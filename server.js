const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});

const app = require('./app');
// mongoose.connect(process.env.DB_LOCAL, {
//     useNewUrlParser:true,
//     useCreateIndex:true,
//     useFindAndModify:false,
//     useUnifiedTopology:true
// }).then(()=>console.log('Database connected successfully'))

let DB;
if (process.env.NODE_ENV === 'development') {
    DB = process.env.DB_LOCAL;
} else if (process.env.NODE_ENV === 'production') {
    DB = process.env.DB_LOCAL;
    // DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
}


mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('DB connection successfully'))

const port = process.env.PORT || 3000
const server = app.listen(port, ()=>{
    console.log(`running on port ${port}`);
})
