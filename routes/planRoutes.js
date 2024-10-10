const express = require('express');
const router = express.Router();
const planController = require('./../controllers/planController');
const authController = require('./../controllers/authController')

router.route('/')
.get(planController.getAllPlans)
.post(authController.protect, authController.restrictTo('admin'), planController.createPlan);
router.route('/:id')
.get(planController.getPlan)
.patch(authController.protect, authController.restrictTo('admin'), planController.updatePlan)
.delete(authController.protect, authController.restrictTo('admin'), planController.deletePlan);

module.exports= router;