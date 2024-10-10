const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    balance:{
        type:Number,
        default:0
    },
    profit:{
        type:Number,
        default:0
    },
    referralBalance:{
        type:Number,
        default:0
    },

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true, 'A wallet must belong to a user']
    }
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;