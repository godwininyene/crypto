const AppError = require('../utils/apError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/user');
const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const sendMail = require('./../utils/email');
const crypto = require('crypto');
const Wallet = require('./../models/wallet')

const signToken = user=>{
    return jwt.sign({id:user._id}, process.env.JWT_SECRET, {
        expiresIn:process.env.JWT_EXPIRESIN
    });
}

const createSendToken = (user, statusCode, res)=>{
    const token = signToken(user)
    const cookieOption = {
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000),
        // secure:true,
        httpOnly:true
    }
    if(req.secure) cookieOption.secure = true
    res.cookie('jwt', token, cookieOption);
     //Remove password from output
    user.password = undefined
    res.status(statusCode).json({
        status:"sucess",
        token,
        data:{
            user
        }
    });
}
exports.signup = catchAsync(async(req, res, next)=>{
    
    
    const user = await User.create(
        {
            name:req.body.name,
            email:req.body.email,
            referralId:req.body.referralId,
            password:req.body.password,
            phone:req.body.phone,
            passwordConfirm:req.body.passwordConfirm
        }
    );
    //Create a wallet for the newly created user
    await Wallet.create({user:user._id})
    createSendToken(user, 201, res)
});

exports.login = catchAsync(async(req, res, next)=>{
    const{email, password} = req.body;

    //1) Check if there is email and password
    if(!email || !password){
        return next(new AppError("Missing log in credentials", 
            {credentials:"Please provide email and password "}, 401))
    }

    //2) Check if user exist and password is correct
    const user = await User.findOne({email:email}).select('+password');
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError("Invalid log in credentials", 
            {credentials:"Password or email is incorrect "}, 401))
    }

    // 3) Everything is ok, send token to client
    createSendToken(user, 200, res)
});

exports.protect = catchAsync(async(req, res, next)=>{
    // 1) Getting token and checking if there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token){
        return next(new AppError("Unauthenticated", 
            {Unauthenticated: "You are not log in. Please log in to gain access!"}, 401))
    }

    // 2) Validate Token
    const decoded = await promisify(jwt.verify) (token, process.env.JWT_SECRET);
   
    // 3) Check if user still exits
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError("The user belonging to this token no longer exist.", '', 401))
    }

    // 4) Check if user change password after token was issued
    if(currentUser.changePasswordAfter(decoded.iat)){
        return next(new AppError("User recently changed password! Please log in again.", '', 401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser
    next();
});

exports.restrictTo = (...roles)=>{
    return(req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError("You do not have the permission to perform this operation!", '', 403))
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async(req, res, next)=>{
    // 1) Get user based on POSTed email
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return next(new AppError("No user was found with that email!", '', 404))
    }

    //2) Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave:false});
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:${resetURL}.\n If you didn't forget your password, please ignore this email `

    //3) Send token to client's email
    try{
        await sendMail({
            subject:'Your password reset token (valid for 10mins)', 
            email:user.email, 
            message
        });
        res.status(200).json({
            status:"success",
            message:"Token has been sent to email!"
        });
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave:false});
        return next(new AppError("There was a problem sending email. Please try again later!",'', 500))
    }
});

exports.resetPassword = catchAsync(async(req, res, next)=>{
    // 1) Get user base on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires:{$gt: Date.now()}});
  

    // 2) If token has not expire, and there is a user, set password
    if(!user){
        return next(new AppError("Invalid token or token has expired!", '', 404))
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update passwordChangedAt property for the user

    // 4) Log in the user, send JWT
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async(req, res, next)=>{
    //1) Get user from collection
    const user = await User.findById(req.user._id).select('+password');
   
    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError("Your current password is wrong!", '', 401))
    }

    // 3) If so, update user's password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log the user in, send jwt
    createSendToken(user, 200, res)
})