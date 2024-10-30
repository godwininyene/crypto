const mongoose = require('mongoose');
const faqSchema = new mongoose.Schema({
    question:{
        type:String,
        required:[true, 'Faq must have a question!']
    },
    answer:{
        type:String,
        required:[true, 'Faq must have an answer!']
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

const Faq = mongoose.model("Faq", faqSchema);

module.exports = Faq;