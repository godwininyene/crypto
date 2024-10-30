const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'A plan must have a name'],
        trim:true,
        unique:true,
        cast:'Name must be a string. Got {VALUE}',
    },
    minDeposit:{
        type:Number,
        required:[true, 'A plan must have minimum deposit'],
        cast:'Minimum deposit must be a number. Got {VALUE}',
    },

    maxDeposit:{
        type:Number,
        required:[true, 'A plan must have maximum deposit'],
        // cast:[null, (value, path, model, kind)=> `"${value}" is not a number`]
        cast:'Maximum deposit must be a number. Got {VALUE}'
    },
    planDuration:{
        type:Number,
        required:[true, 'A plan must have duration'],
        cast:'Plan duration must be a number. Got {VALUE}'
    },
    timingParameter:{
        type:String,
        enum:{
            values:['hours', 'days'],
            message:'Timing parameter is either: hours or days. Got {VALUE}'
        },
        default:'hours'
    },
    percentage:{
        type:Number,
        required:[true, 'A plan must have a percentage value'],
        cast:'Percentage must be a number. Got {VALUE}'
    },

    referalBonus:{
        type:Number,
        // required:[true, 'A plan must have referal bonus'],
        // cast:'Referral bonus must be a number. Got {VALUE}'
    },
    allowReferral:{
        type:Boolean,
        default:true,
        cast:'Allow referral must be a boolean. Got {VALUE}'
    },
    currency:{
        type:String,
        default:"USD",
        cast:'Currency must be a number. Got {VALUE}'
    },
    returnPrincipal:{
        type:String,
        default:false,
        cast:'Return Principal must be a boolean. Got {VALUE}'
    }

});

const Plan = mongoose.model("Plan", planSchema);
module.exports = Plan;