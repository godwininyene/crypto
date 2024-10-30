const mongoose = require('mongoose')
const countrySchema = new mongoose.Schema({
    id:Number,
    phone:Number,
    code:String,
    country_flag:String,
    name:String,
    continent:String,
    capital:String,
    currency:String,
    currency_name:String,
    alpha_3:String,
    symbol:String

});

const Country = mongoose.model("Country", countrySchema);
module.exports = Country;



// fetch('http://127.0.0.1:8000/api/fetch-countries')
// .then(res =>  res.json())
// .then(async data =>await  Country.create(data))
// .catch(err => console.log(err))