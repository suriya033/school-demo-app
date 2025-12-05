const express = require('express');
const router = express.Router();
const { getFees, createFee, updateFeePayment, deleteFee, getFeeStats } = require('../controllers/feeController');

// @route   GET api/fees
// @desc    Get all fees
// @access  Private
router.get('/', getFees);

// @route   POST api/fees
// @desc    Create fee
// @access  Private (Admin)
router.post('/', createFee);

// @route   PUT api/fees/:feeId/payment
// @desc    Update fee payment
// @access  Private
router.put('/:feeId/payment', updateFeePayment);

// @route   DELETE api/fees/:feeId
// @desc    Delete fee
// @access  Private (Admin)
router.delete('/:feeId', deleteFee);

// @route   GET api/fees/stats
// @desc    Get fee statistics
// @access  Private (Admin)
router.get('/stats', getFeeStats);

module.exports = router;
