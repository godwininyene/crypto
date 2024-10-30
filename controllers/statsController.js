const catchAsync = require("../utils/catchAsync");
const Wallet = require('./../models/wallet');
const User = require('./../models/user');
const Transanction = require('./../models/transaction');
const Investment = require('./../models/investment');


const getInvestmentStats = async(user_id)=>{
    // Find all active investments for the given user and populate the 'plan' field
    const minings = await Investment.find({
       user:user_id,
       status: 'active'
   })
   .populate('plan')
   .sort({ amount: -1 }) // Sorting by amount in descending order
   .exec();

   //Count all investments
   const total_investment = await Investment.countDocuments({ user:user_id});

   //Calculate Total Profit and total amount invested
   let total_profit = 0;
   let total_amount = 0;
   const all_investments = await Investment.find({ user:user_id});
   all_investments.forEach(el =>{
       total_profit+= el.profit;
       total_amount+= el.amount
   })



   const investments = [];
   // Loop through each mining record
   for (const investment of minings) {
       let totalDuration = 0;
       let currentLevel = 0;

       if (investment) {
           // Parse the dates using the Date object
           const expiryDate = new Date(investment.expiryDate);

           const createdAt = new Date(investment.createdAt);
           const now = new Date();

           // Calculate total duration and current level in hours
           totalDuration = Math.floor(Math.abs(expiryDate - createdAt) / (1000 * 60 * 60));
         
           currentLevel = Math.floor(Math.abs(now - createdAt) / (1000 * 60 * 60));
         
       }

       // Calculate the percentage
       const percentage = (totalDuration !== 0 || currentLevel !== 0)
       ? Math.floor((currentLevel / totalDuration) * 100)
       : 0;
   

       // Add the investment details to the array
       investments.push({
           investment,
           totalDuration,
           currentLevel,
           percentage
       });
   }
   return{ investments, total_investment, total_profit,  total_amount};
}

const getTotalTransactions = async(user_id)=>{
   //Allowed for nested route
   let filter = {}
   if(user_id)filter = {user: user_id}
   const transactions = await Transanction.find(filter);
   let total_deposit = 0;
   let total_withdrawal = 0;
   transactions.forEach(tran =>{
       if(tran.type == 'deposit') total_deposit+= tran.amount
       if(tran.type == 'withdrawal') total_withdrawal+= tran.amount;
   });
   return{total_deposit, total_withdrawal}
}


exports.getStatsForAdmin = catchAsync(async(req, res, next)=>{
    const wallets = await Wallet.find();
    const users = await User.countDocuments({role: {$ne: 'admin'}});
    const transactions = await Transanction.find().sort('-createdAt').limit(5).populate('user');
    const investments = await Investment.find().sort('-createdAt').limit(5).populate('user');
    let {total_withdrawal} = await getTotalTransactions();
    const total_referrals = await User.countDocuments({referralId: {$ne: null}});
   
    let total_balance = 0;
    let total_profit = 0;
    let total_referral_balance = 0;

    wallets.forEach(wallet =>{
        total_balance+= wallet.balance;
        total_profit+=wallet.profit;
        total_referral_balance+=wallet.referralBalance;
    });
    let stats ={
        total_balance,
        total_profit,
        total_withdrawal,
        total_referral_balance,
        total_referrals,
        users
    }

    res.status(200).json({
        status:"success",
        data:{
            stats,
            latest_transactions:transactions,
            latest_investments:investments,
           
        }
    })
});



exports.getStatsForUser = catchAsync(async(req, res, next)=>{
  
    const {investments, total_investment, total_profit,  total_amount} = await getInvestmentStats(req.user._id);
    let {total_deposit, total_withdrawal} = await getTotalTransactions(req.user._id);
    const wallet = await Wallet.findOne({user: req.user._id});
    const total_referrals = await User.countDocuments({referralId: req.user.accountId});
   

    res.status(200).json({
        status:"success",
        data:{
            stats:{
                investments,
                total_investment,
                total_profit,
                total_withdrawal,
                total_amount,
                total_deposit,
                total_referrals,
                wallet
            }
        }
    })
})
