const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const investmentRouter = require('./../routes/investmentRoutes')
const transactionRouter = require('./../routes/transactionRoutes')

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.use('/me/transactions', transactionRouter);
router.use('/me/investments', investmentRouter)

router.route('/updateMyPassword').patch( authController.updatePassword);
router.route('/updateMe').patch(userController.updateMe);
router.route('/deleteMe').delete(userController.deleteMe);

router.route('/').get(authController.restrictTo('admin'), userController.getAllUsers);
router.route('/:id').delete(authController.restrictTo('admin'), userController.deleteUser)

module.exports = router;
