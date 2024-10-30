const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const faqController = require('../controllers/faqController')

router.route('/')
.get(faqController.getAllfaqs)
.post(authController.protect, authController.restrictTo('admin'), faqController.createFaq)
router.route('/:id')
.delete(authController.protect, authController.restrictTo('admin'), faqController.deleteFaq)
module.exports = router;
