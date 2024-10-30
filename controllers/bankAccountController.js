const catchAsync = require("../utils/catchAsync");
const BankAccount = require('./../models/bankAccount')

exports.createBankAccount = catchAsync(async(req, res, next)=>{
    // Assign the user ID if it's not provided in the body (for nested routes)
    if (!req.body.user) req.body.user = req.user._id;
    const account = await BankAccount.create(req.body);
    res.status(200).json({
        status:"success",
        data:{
            account
        }
    })
})

exports.getAllAccounts = catchAsync(async(req, res, next)=>{
    const accounts = await BankAccount.find({user:req.user._id});

    res.status(200).json({
        status:"success",
        data:{
            accounts
        }
    });
})