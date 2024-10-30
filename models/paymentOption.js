const mongoose = require('mongoose');
const paymentOptionSchema = new mongoose.Schema({
    payOption:{
        type:String,
        required:[true, 'Please provide pay option']
    },
    bank:{
        type:String,
        required:[true, 'Please provide bank']
    },
    accountNumber:{
        type:String,
        required:[true, 'Please provide account number']
    },
    image:String,
    extra:String,
    displayStatus:{
        type:Boolean,
        default:true
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

const PaymentOption = mongoose.model("PaymentOption", paymentOptionSchema);

module.exports = PaymentOption;