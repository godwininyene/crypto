const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true, 'Investment must belong to a user']
    },
    plan:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Plan",
        required:[true, 'Investment must belong to a plan']
    },
    amount:{
        type:Number,
        required:[true, 'Please provide amount to invest'],
    },
    profit:{
        type:Number,
        default:0
    },
    status:{
        type:String,
        enum:['active', 'completed', 'failed'],
        default:'active'
    },
    expiryDate:{
        type:Date,
        required:[true, "Investment must have an expiry date!"]
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



investmentSchema.pre(/^find/, async function(next){
    this.populate({path:'plan', select:'name'})
    next();
})
const Investment = mongoose.model("Investment", investmentSchema);

module.exports = Investment

