const express = require('express');
const router = express.Router();
const { getHomework, createHomework, updateHomework, deleteHomework } = require('../controllers/homeworkController');

// @route   GET api/homework
// @desc    Get all homework
// @access  Private
router.get('/', getHomework);

// @route   POST api/homework
// @desc    Create homework
// @access  Private (staff/Admin)
router.post('/', createHomework);

// @route   PUT api/homework/:id
// @desc    Update homework
// @access  Private (staff/Admin)
router.put('/:id', updateHomework);

// @route   DELETE api/homework/:id
// @desc    Delete homework
// @access  Private (staff/Admin)
router.delete('/:id', deleteHomework);

module.exports = router;
