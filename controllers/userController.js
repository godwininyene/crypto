const AppError = require("../utils/apError");
const catchAsync = require("../utils/catchAsync");
const User = require('./../models/user')

const filterObj = (obj, ...allowFields)=>{
    const newObj = {};
    Object.keys(obj).forEach(key=>{
        if(allowFields.includes(key)) newObj[key] = obj[key]
    });

    return newObj
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

exports.createUser = catchAsync(async(req, res, next)=>{
    res.status(500).json({
        status:"error",
        message:"This route is not yet implement"
    });
})

exports.getAllUsers = catchAsync(async(req, res, next)=>{
    const users = await User.find()
    res.status(200).json({
        status:"success",
        data:{
            results:users.length,
            users
        }
    })
});


exports.getUser = catchAsync(async(req, res, next)=>{
    res.status(500).json({
        status:"error",
        message:"This route is not yet implement"
    });
});

exports.updateUser = catchAsync(async(req, res, next)=>{
    res.status(500).json({
        status:"error",
        message:"This route is not yet implement"
    });
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