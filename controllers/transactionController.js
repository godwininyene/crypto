const catchAsync = require("../utils/catchAsync");
const Transaction = require('./../models/transaction');
const Wallet = require('./../models/wallet');
const User = require('./../models/user');
const sendEmail = require('./../utils/email')
const AppError = require('./../utils/apError')
const multer = require('multer')
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//     destination:(req, file, cb)=>{
//         cb(null, 'public/img/receipts')
//     },
//     filename:(req, file, cb)=>{
//         const ext = file.mimetype.split('/')[1]
//         cb(null, `receipt-${req.user._id}-${Date.now()}.${ext}`)
//     }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb)=>{
    if(file.mimetype.startsWith("image")){
       cb(null, true)
    }else{
        cb(new AppError("Invalid File.", {receipt:"Receipt must be of type image!"}, 400), false)
    }
}

const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
})


exports.uploadReceipt = upload.single("receipt");
exports.resizeReceipt = catchAsync(async(req, res, next)=>{
    
    if(!req.file) return next();

    req.file.filename = `receipt-${req.user._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        // .resize(800, 600)
        .toFormat("jpeg")
        .jpeg({quality: 30})
        .toFile(`public/img/receipts/${req.file.filename}`);

    next()
})
exports.createTransaction = catchAsync(async(req, res, next)=>{
    const { type, amount, pay_option, user } = req.body;
    
    // Assign the user ID if it's not provided in the body (for nested routes)
    if (!req.body.user) req.body.user = req.user._id;

    // If transaction type is 'withdrawal', check the payment option
    if (type === 'withdrawal') {
        if (!pay_option) {
            return next(new AppError('Missing Pay option.', { pay_option: 'Please provide pay option' }, 400));
        }

        const wallet = await Wallet.findOne({ user: req.user });
        if (!wallet) return next(new AppError('Wallet not found.', '', 404));

        // Validate withdrawal based on the selected pay_option and wallet balances
        let balanceField, balanceAmount;
        if (pay_option === 'profit') {
            balanceField = 'profit';
            balanceAmount = wallet.profit;
        } else if (pay_option === 'balance') {
            balanceField = 'balance';
            balanceAmount = wallet.balance;
        } else if (pay_option === 'referral_balance') {
            balanceField = 'referral balance';
            balanceAmount = wallet.referralBalance;
        }else{
            return next(new AppError('Invalid pay opton.', {pay_option:`Pay option is either: profit, balance or referral_balance. But got ${pay_option}`}, 400))
        }

        if (balanceAmount < amount) {
            return next(
                new AppError(
                    `Insufficient funds. You are trying to withdraw $${amount} from your ${balanceField}, but your ${balanceField} is only $${balanceAmount}. Please check your balance and try again.`,
                    '',
                    400
                )
            );
        }
    }

    // Create new transaction
    if(req.file) req.body.receipt = req.file.filename;
     const newTransaction = await Transaction.create(req.body);

    // Prepare the email message
    const username = req.user.name;
    const action = type === 'deposit' ? 'deposited' : 'withdrawn';
    const message = `Hi ${username}, you have successfully ${action} $${amount}.\n 
    ${type === 'deposit' ? 'Deposit' : 'Withdrawal'} is waiting to be confirmed.`;

    //send email to user
    try {
        await sendEmail({
            subject: `${type === 'deposit' ? 'Deposit Notice' : 'Withdrawal Notice'}`,
            email: req.user.email,
            message,
        });

        // Send response after successful transaction and email
        res.status(201).json({
            status: 'success',
            data: {
                transaction: newTransaction,
            },
        });
    } catch (error) {
        return next(new AppError("There was a problem sending the email.. Please try again later!", '', 500))
    }
});

exports.getAllTransactions = catchAsync(async(req, res, next)=>{
    //Allowed for fetching transaction for the user
    let filter = {};
    if(req.user.role != 'admin') filter={user:req.user._id}

    const transactions = await Transaction.find(filter);
    res.status(200).json({
        results:transactions.length,
        status:'success',
        data:{
           transactions
        }
    });
});

exports.handleTransaction = catchAsync(async (req, res, next) => {
    const { action } = req.params; // 'approve' or 'decline'
    let message;

    // Retrieve transaction, user, and wallet
    const transaction = await Transaction.findById(req.params.id);
    const wallet = await Wallet.findOne({ user: transaction.user });
    const user = await User.findById(transaction.user);

    if (!transaction) {
        return next(new AppError("No transaction was found with that ID", '', 404));
    }

    // Already processed status checks
    if (action === 'approve' && transaction.status === 'success') {
        return next(new AppError("Transaction already approved!", '', 400));
    }
    if (action === 'decline' && transaction.status === 'declined') {
        return next(new AppError("Transaction already declined!", '', 400));
    }

    if (action === 'approve') {
        // Approve transaction logic
        if (transaction.type === 'deposit') {
            wallet.balance += transaction.amount;
            message = `Your deposit of $${transaction.amount} has been confirmed. \n You can view your account balance by clicking the button below.`;
        } else if (transaction.type === 'withdrawal') {
            wallet.balance -= transaction.amount;
            message = `Your withdrawal of $${transaction.amount} has been confirmed and coins have been paid into your provided wallet address. \n You can view your withdrawal transaction status by clicking the button below.`;
        }
        transaction.status = 'success';
    } else if (action === 'decline') {
        // Decline transaction logic
        message = `Your ${transaction.type} of $${transaction.amount} was not confirmed. \n You will receive an email with more details.`;

        if (transaction.status === 'success') {
            if (transaction.type === 'deposit') {
                wallet.balance -= transaction.amount;
            } else if (transaction.type === 'withdrawal') {
                wallet.balance += transaction.amount;
            }
        }
        transaction.status = 'declined';
    }

    //save updates
    await wallet.save({ validateBeforeSave: false });
    await transaction.save({ validateBeforeSave: false });

    // Send email
    try {
        await sendEmail({
            subject: transaction.type === 'deposit' ? 'Deposit Notice' : 'Withdrawal Notice',
            email: user.email,
            message,
        });
        res.status(200).json({
            status: 'success',
            message: `Transaction ${action}d successfully!`,
        });
    } catch (error) {
        return next(new AppError("There was a problem sending the email. Please try again later!", '', 500));
    }
});