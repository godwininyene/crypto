const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const bankAccountController = require('../controllers/bankAccountController')

router.route('/')
.get(bankAccountController.getAllAccounts)
.post(authController.protect, authController.restrictTo('user'), bankAccountController.createBankAccount)

// router.route('/:id')
// .delete(authController.protect, authController.restrictTo('user'), bankAccountController.deleteFaq)
module.exports = router;
