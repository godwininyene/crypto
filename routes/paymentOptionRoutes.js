const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const paymentOptionController = require('./../controllers/paymentOptionController')

// Protect all the routes below
router.use(authController.protect);

router.route('/')
.post( 
    authController.restrictTo('admin'),
    paymentOptionController.uploadBarcode,
    paymentOptionController.resizeBarcode,
    paymentOptionController.createPaymentOption
)
.get(paymentOptionController.getAllPaymentOptions)
router.route('/:id')
.patch(
    authController.restrictTo('admin'),
    paymentOptionController.uploadBarcode,
    paymentOptionController.resizeBarcode,
    paymentOptionController.updatePayOption
)
.delete( authController.restrictTo('admin'), paymentOptionController.deletePayOption)


module.exports = router;