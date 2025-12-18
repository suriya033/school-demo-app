const express = require('express');
const router = express.Router();
const { getClasses, getClassById, createClass, deleteClass, assignSubjectstaff, removeSubjectstaff, addSubject, removeSubject, assignClassStaff } = require('../controllers/classController');

// @route   GET api/classes
// @desc    Get all classes
// @access  Private (Admin/staff)
router.get('/', getClasses);

// @route   GET api/classes/:id
// @desc    Get class by ID
// @access  Private (Admin/staff)
router.get('/:id', getClassById);

// @route   POST api/classes
// @desc    Create a class
// @access  Private (Admin)
router.post('/', createClass);

// @route   DELETE api/classes/:id
// @desc    Delete a class
// @access  Private (Admin)
router.delete('/:id', deleteClass);

// @route   POST api/classes/:classId/assign-subject-staff
// @desc    Assign subject staff to a class
// @access  Private (Admin)
router.post('/:classId/assign-subject-staff', assignSubjectstaff);

// @route   DELETE api/classes/:classId/subject-staff/:subjectId
// @desc    Remove subject staff from a class
// @access  Private (Admin)
router.delete('/:classId/subject-staff/:subjectId', removeSubjectstaff);

// @route   POST api/classes/:classId/subjects
// @desc    Add subject to a class
// @access  Private (Admin)
router.post('/:classId/subjects', addSubject);

// @route   DELETE api/classes/:classId/subjects/:subjectId
// @desc    Remove subject from a class
// @access  Private (Admin)
router.delete('/:classId/subjects/:subjectId', removeSubject);

// @route   POST api/classes/:classId/assign-class-staff
// @desc    Assign class staff (Class Teacher) to a class
// @access  Private (Admin)
router.post('/:classId/assign-class-staff', assignClassStaff);

module.exports = router;
