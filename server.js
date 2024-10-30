const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path:'./config.env'});
const MongoClient = require('mongodb').MongoClient;
const Plan = require('./models/plan')

process.on('uncaughtException', err=>{
    console.log("uncaughtException! shutting down...")
    console.log(err.name, err.message) 
    process.exit(1)
})

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
    // DB = process.env.DB_LOCAL;
    DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
}


mongoose.connect(DB, {
    useNewUrlParser: false,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(async () => {
    console.log('DB connection successfully')
    const plans = await Plan.find();
    console.log(plans)
})

// const conn = mongoose.createConnection(DB, {useNewUrlParser:true})

// const client = new MongoClient(DB);

// client.connect()
// .then(()=> console.log("Connected successfully"))
// .catch(err => console.log(err.name, err.message))

const port = process.env.PORT || 3000
const server = app.listen(port, ()=>{
    console.log(`running on port ${port}`);
})
process.on('unhandledRejection', err=>{
    console.log("UNHANDLED REJECTION! shutting down...")
    console.log(err.name, err.message)
    server.close(()=>{
        process.exit(1)
    })
})

