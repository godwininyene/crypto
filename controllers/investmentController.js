const catchAsync = require("../utils/catchAsync");
const Investment = require('./../models/investment')
const Plan = require('../models/plan');
const Wallet = require('../models/wallet');
const AppError = require("../utils/apError");
const User = require('./../models/user')
const Email = require("../utils/email");



exports.makeInvestment = catchAsync(async(req, res, next)=>{
    // Assign the user ID if it's not provided in the body (for nested routes)
    if (!req.body.user) req.body.user = req.user._id;
    const plan = await Plan.findById(req.body.plan);
    const wallet = await Wallet.findOne({user:req.body.user});

    if(!plan){
        return next(new AppError("Missing Plan", {plan:"No plan was found with that ID"}, 404))
    }

    if(plan.minDeposit > req.body.amount){
        return next(new AppError("Amount too small", {amount:`You cannot invest lesser than the minimum deposit of $${plan.minDeposit} on this plan`}, 400))
    }

    if( req.body.amount > plan.maxDeposit){
        return next(new AppError("Amount too Large", {amount:`You cannot invest more than the maximum deposit of $${plan.maxDeposit} on this plan`}, 400))

    }

    if(wallet.balance < req.body.amount){
        return next(new AppError("Insufficient fund", {balance:`Insufficient wallet balance. Kindly fund your wallet and try again.`}, 400))
       
    }

    // Calculate the expiry date
     let expiryDate;
     if (plan.timingParameter == 'hours') {
        expiryDate = new Date(Date.now() + plan.planDuration * 60 * 60 * 1000);
     } else if (plan.timingParameter == 'days') {
        expiryDate = new Date(Date.now() + plan.planDuration * 24 * 60 * 60 * 1000);
     }

    //Create investment
    req.body.expiryDate = expiryDate;
    const investment = await Investment.create(req.body);

    //Substract invested amount from wallet
    wallet.balance -= req.body.amount;
    await wallet.save();

    //Manage referral wallet
    if(req.user.referralId){
        const referral= await User.findOne({accountId: req.user.referralId});
       if(referral){
            const referral_bonus = (plan.percentage / 100) * req.body.amount;
            const referral_wallet = await Wallet.findOne({user: referral._id});
            referral_wallet.referralBalance+=referral_bonus
            await  referral_wallet.save();
       }

    }
   

    // Send email
     try {
        await new Email(req.user, '', '', req.body.amount,plan ).sendInvestment()
        res.status(201).json({
            status: 'success',
            data:{
                investment
            }
        });
    } catch (error) {
        console.log(error)
        return next(new AppError("There was a problem sending the email. Please try again later!", '', 500));
    }

});

exports.getAllInvestments = catchAsync(async(req, res, next)=>{
     //Allowed for fetching investments for the user
     let filter = {};
     if(req.user.role != 'admin') filter={user:req.user._id}
   
    const query =  Investment.find(filter);

     //If the requested user is an admin, populate investment with the user.
     if(req.user.role == 'admin'){
        query.populate({path:'user', select:'name photo'})
    }
    const investments = await query;

    res.status(200).json({
        result:investments.length,
        status:"success",
        data:{
            investments
        }
    });
});



exports.handleInvestments = catchAsync(async (req, res, next) => {
    const investments = await Investment.find({ user: req.user._id, status: 'active' });
    const wallet = await Wallet.findOne({ user: req.user._id });

    let totalProfit = 0; // Track total profit to be added to the wallet
    let totalBalance = 0; // Track total balance to be added back to the wallet

    for (const investment of investments) {
        const plan = await Plan.findById(investment.plan._id);

        const today = new Date();
        const lastUp = new Date(investment.updatedAt);
        const hours = (today.getTime() - lastUp.getTime()) / 3600000;

        const from = new Date(investment.createdAt).getTime();
        const to = new Date(investment.expiryDate).getTime();
    
        const totalDuration = (to - from) / 3600000;
      

        const expiryDate = new Date(investment.expiryDate).getTime();
        const now = today.getTime();

      
        // Mining has ended
        if (expiryDate <= now) {
            // Calculate and accumulate the profit and balance
            totalProfit += (plan.percentage / 100) * investment.amount;
            totalBalance += investment.amount;
            // Update investment
            investment.profit = (plan.percentage / 100) * investment.amount;
            investment.status = 'completed';
            await investment.save(); // Save the investment only
        } else {
            // Mining is still active
            const hourlyInterest = (((plan.percentage / 100) * investment.amount) / totalDuration) * hours;
            investment.profit = investment.profit + hourlyInterest;
            investment.updatedAt = Date.now();
            await investment.save(); // Save the investment only
        }
    }

    // Save wallet changes only once after processing all investments
    wallet.profit += totalProfit;
    wallet.balance += totalBalance;
    await wallet.save();

    res.status(200).json({
        status: "success",
        results: investments.length,
        data: {
            investments
        }
    });
});


