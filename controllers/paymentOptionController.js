const PaymentOption = require("../models/paymentOption");
const catchAsync = require("../utils/catchAsync");

exports.createPaymentOption = catchAsync(async(req, res, next)=>{
    console.log(req.headers.authorization);
    
    const paymentOption = await PaymentOption.create(req.body);
    res.status(200).json({
        status:"success",
        data:{
            paymentOption
        }
    })
});

exports.getAllPaymentOptions = async(req, res, next)=>{
   
    const paymentOptions = await PaymentOption.find().select('-__v').sort('-_id');
    res.status(200).json({
        status:"success",
        result:paymentOptions.length,
        data:{
            paymentOptions
        }
    })
}

exports.updatePayOption = catchAsync(async(req, res, next)=>{
    
    const paymentOption = await PaymentOption.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true
    })
    if(!paymentOption){
        return next(new AppError("No payment Option was found with that ID", '', 404))
    }
    res.status(200).json({
        status:"success",
        data:{
            paymentOption
        }
    })
});

exports.deletePayOption = catchAsync(async(req, res, next)=>{
    const paymentOption = await PaymentOption.findByIdAndDelete(req.params.id)
    if(!paymentOption){
        return next(new AppError("No payment Option was found with that ID", '', 404))
    }
    res.status(204).json({
        status:"success",
        data:null
    })

});