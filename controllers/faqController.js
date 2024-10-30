const Faq = require("../models/faq");
const catchAsync = require("../utils/catchAsync");

exports.createFaq = catchAsync(async(req, res, next)=>{
    const faq = await Faq.create(req.body);
    res.status(200).json({
        status:"success",
        data:{
            faq
        }
    })
});

exports.getAllfaqs = async(req, res, next)=>{
   
    const faqs = await Faq.find().select('-__v').sort('-_id');
    res.status(200).json({
        status:"success",
        result:faqs.length,
        data:{
            faqs
        }
    })
}

exports.updateFaq = catchAsync(async(req, res, next)=>{
    
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true
    })
    if(!faq){
        return next(new AppError("No faq was found with that ID", '', 404))
    }
    res.status(200).json({
        status:"success",
        data:{
            faq
        }
    })
});

exports.deleteFaq = catchAsync(async(req, res, next)=>{
    const faq = await Faq.findByIdAndDelete(req.params.id)
    if(!faq){
        return next(new AppError("No faq was found with that ID", '', 404))
    }
    res.status(204).json({
        status:"success",
        data:null
    })

});