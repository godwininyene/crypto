const AppError = require("../utils/apError");
const catchAsync = require("../utils/catchAsync");
const User = require('./../models/user')
const Email = require('./../utils/email')

const filterObj = (obj, ...allowFields)=>{
    const newObj = {};
    Object.keys(obj).forEach(key=>{
        if(allowFields.includes(key)) newObj[key] = obj[key]
    });

    return newObj
}

const updateApprovalStatus = async(user, newStatus)=> {
    if (newStatus === 'approve' && user.approvalStatus === 'approved') {
        throw new AppError("User account already approved!", '', 400);
    }
    if (newStatus === 'deny' && user.approvalStatus === 'denied') {
        throw new AppError("User account approval already denied!", '', 400);
    }
    if (newStatus === 'deactivate' && user.approvalStatus === 'deactivated') {
        throw new AppError("User account already deactivated!", '', 400);
    }

    user.approvalStatus = newStatus === 'deny' ? 'denied' : `${newStatus}d`;
    user.status = newStatus === 'deny' ? 'denied' : `${newStatus}d`;
    await user.save({ validateBeforeSave: false });
    return user;
}



exports.getMe = (req, res, next)=>{
    req.params.id = req.user._id;
    next();
}
exports.updateMe = catchAsync(async(req, res, next)=>{
    // 1) Create an error if user trys to update password field
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError("This route is not for password updates, please use /updateMyPassword", '', 401));
    }

    // 2) Remove unwanted fields that are not allowed to be updated
    const filterBody = filterObj(req.body, 'name', 'email', 'phone', 'gender')
    //3) Update the user document
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
        new:true,
        runValidators:true
    });
    res.status(200).json({
        status:"success",
        data:{
            user:updatedUser
        }
    })
});

exports.deleteMe = catchAsync(async(req, res, next)=>{
    await User.findByIdAndUpdate(req.user._id, {status:false})
    res.status(204).json({
        status:"success",
        data:null
    })
})


exports.getAllUsers = catchAsync(async(req, res, next)=>{
    const users = await User.find({role: {$ne:'admin'}}).populate('wallet').populate('bankAccounts')
    res.status(200).json({
        status:"success",
        data:{
            results:users.length,
            users
        }
    })
});


exports.getUser = catchAsync(async(req, res, next)=>{
    const user = await User.findById(req.params.id)
    if(!user){
        return next(new AppError("No user found with that ID", '', 404))
    }
    res.status(200).json({
        status:"success",
        data:{
            user
        }
    })
});



exports.deleteUser = catchAsync(async(req, res, next)=>{
    const user = await User.findByIdAndDelete(req.params.id)
    if(!user){
        return next(new AppError("No user found with that ID", '', 404))
    }
    res.status(204).json({
        status:"success",
        data:null
    })
})


exports.updateStatus = catchAsync(async(req, res, next)=>{
    const{status} = req.body
    let type;
    const user = await User.findById(req.params.id).populate('wallet');

    if(!user){
        return next(new AppError("No user found with that ID", '', 404))
    }
   

    let url = `${req.get('referer')}manage/investor/dashboard`

    if (status === 'approve') type='account_approved'
    
    if (status === 'deny') type='account_denied'
     
    if (status === 'deactivate') type="account_deactivated"
       
    try {
        const updatedUser = await updateApprovalStatus(user, status)
        await new Email(user, type, url).sendOnBoard();
        res.status(200).json({
            status: 'success',
            data:{
                user:updatedUser
            }
        });
    } catch (error) {
        return next(new AppError("There was a problem sending the email. Please try again later!", '', 500));
    }
})