const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const upload = require('../middleware/upload');

// @route   GET api/students
// @desc    Get all students
// @access  Private (Admin/staff)
router.get('/', getStudents);

// @route   GET api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', getStudentById);

// @route   POST api/students
// @desc    Create a student
// @access  Private (Admin)
router.post('/', upload.single('profilePicture'), createStudent);

// @route   PUT api/students/:id
// @desc    Update a student
// @access  Private (Admin)
router.put('/:id', upload.single('profilePicture'), updateStudent);

// @route   DELETE api/students/:id
// @desc    Delete a student
// @access  Private (Admin)
router.delete('/:id', deleteStudent);

module.exports = router;
