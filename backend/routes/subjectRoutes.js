const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, deleteSubject, addClass, removeClass } = require('../controllers/subjectController');

// @route   GET api/subjects
// @desc    Get all subjects
// @access  Private (Admin/staff)
router.get('/', getSubjects);

// @route   POST api/subjects
// @desc    Create a subject
// @access  Private (Admin)
router.post('/', createSubject);

// @route   DELETE api/subjects/:id
// @desc    Delete a subject
// @access  Private (Admin)
router.delete('/:id', deleteSubject);

// @route   POST api/subjects/:subjectId/classes
// @desc    Add class to a subject
// @access  Private (Admin)
router.post('/:subjectId/classes', addClass);

// @route   DELETE api/subjects/:subjectId/classes/:classId
// @desc    Remove class from a subject
// @access  Private (Admin)
router.delete('/:subjectId/classes/:classId', removeClass);

module.exports = router;
