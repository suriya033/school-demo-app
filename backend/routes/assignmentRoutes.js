const express = require('express');
const router = express.Router();
const {
    getAssignments,
    assignSubjectTostaff,
    removeSubjectFromstaff,
    assignClassstaff
} = require('../controllers/assignmentController');

// @route   GET api/assignments
// @desc    Get all staff assignments
// @access  Private (Admin)
router.get('/', getAssignments);

// @route   POST api/assignments/subject
// @desc    Assign subject to staff
// @access  Private (Admin)
router.post('/subject', assignSubjectTostaff);

// @route   DELETE api/assignments/subject
// @desc    Remove subject from staff
// @access  Private (Admin)
router.delete('/subject', removeSubjectFromstaff);

// @route   POST api/assignments/class-staff
// @desc    Assign class staff
// @access  Private (Admin)
router.post('/class-staff', assignClassstaff);

module.exports = router;
