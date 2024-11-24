const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type:{
        type:String,
        enum:{
            values:['deposit', 'withdrawal', 'investment'],
            message:'Transaction type is either: deposit, withrawal or investment. Got {VALUE}'
        },
        required:[true, 'Please provide transaction type']
    },
    amount:{
        type:Number,
        required:[true, 'Please provide amount']
    },
    currency:{
        type:String,
        default:"USD"
    },
    status:{
        type:String,
        enum:{
            values:['pending', 'success', 'failed', 'declined'],
            message:'Transaction status is either: pending, success, failed or declined. Got {VALUE}'
        },
        default:'pending'
    },

    payOption:{
        type:String,
        enum:{
            values:['profit', 'balance', 'referral_balance'],
            message:'Pay option  is either: profit, balance or referral_balance. Got {VALUE}'
        },
    },
    receipt:String,
    paymentChannel:{
        type:String,
        enum:['bank payment', 'crypto wallet'],
        default:'bank payment'
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true, 'Transaction must belong to a user.']
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    updatedAt:{
        type:Date,
        default:Date.now()
    }
});



const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;