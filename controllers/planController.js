const AppError = require('../utils/apError');
const Plan = require('./../models/plan');
const catchAsync = require('./../utils/catchAsync')


exports.getAllPlans = async(req, res, next)=>{
   
    const plans = await Plan.find().select('-__v').sort('-_id');
    res.status(200).json({
        status:"success",
        result:plans.length,
        data:{
           plans
        }
    })
}

exports.createPlan = catchAsync(async(req, res, next)=>{
    const plan = await Plan.create(req.body)
    res.status(201).json({
        status:"success",
        data:{
            plan
        }
    })

});

exports.getPlan = catchAsync(async(req, res, next)=>{
    const plan = await Plan.findById(req.params.id).select('-__v')
    if(!plan){
        return next(new AppError("No plan was found with that ID", '', 404))
    }
    res.status(201).json({
        status:"success",
        data:{
            plan
        }
    })

});

exports.updatePlan = catchAsync(async(req, res, next)=>{
    
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
        new:true,
        runValidators:true
    })
    if(!plan){
        return next(new AppError("No plan was found with that ID", '', 404))
    }
    res.status(200).json({
        status:"success",
        data:{
            plan
        }
    })

});

exports.deletePlan = catchAsync(async(req, res, next)=>{
    const plan = await Plan.findByIdAndDelete(req.params.id)
    if(!plan){
        return next(new AppError("No plan was found with that ID", '', 404))
    }
    res.status(204).json({
        status:"success",
        data:null
    })

});