const express = require('express');
const transactionController = require('./../controllers/transactionController');
const authController = require('./../controllers/authController');


const router = express.Router({mergeParams:true});


// Protect all the routes below
router.use(authController.protect);
router.route('/')
.post(
    authController.restrictTo('user'), 
    transactionController.uploadReceipt, 
    transactionController.resizeReceipt, 
    transactionController.createTransaction
)
.get(transactionController.getAllTransactions);
router.route('/:id/action/:action').patch(authController.restrictTo('admin'), transactionController.handleTransaction)


module.exports = router;