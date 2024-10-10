/*
    Todo:
    1. Send email to admin and client when a new transaction is created
    2. Implement authorization for deleting user
    3. Install cookie-parser to read into the body

*/
const express = require('express');
const app = express();
const globalErrorController = require('./controllers/errorController')
const planRouter = require('./routes/planRoutes');
const userRouter = require('./routes/userRoutes');
const investmentRouter = require('./routes/investmentRoutes');
const transactionRouter = require('./routes/transactionRoutes');
const AppError = require('./utils/apError');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp')
const cookieParser = require('cookie-parser');
const cors = require('cors');

const limiter = rateLimit({
    max:300,
    windowMs: 60 * 60 * 1000,
    message:"Too  many requests from this IP, please try again in an hour!"
});

//Implement cors
app.use(cors())
app.options('*', cors())
//Set Security HTTP Headers
app.use(helmet());

//Limit number of requests from same IP
app.use('/api', limiter)

//Body parser, read data from req.body into body
app.use(express.json());
app.use(cookieParser())
// Data Sanitization against Nosql Query Injection
app.use(mongoSanitize());
//Data Sanitization against xss attack
app.use(xss());
//Preventing Parameter Pollution Attack
app.use(hpp());

// Test Middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies)
    next();
})

app.use('/api/v1/plans', planRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/investments', investmentRouter);
app.use('/api/v1/transactions', transactionRouter);

//Not found route
app.all('*', (req, res, next)=>{
    return next(new AppError(`The request URL ${req.originalUrl} was not found on this server!`, '', 404))
})

app.use(globalErrorController)

module.exports = app;