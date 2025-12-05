const express = require('express');
const router = express.Router();
const { getstaffs, getstaffById, createstaff, updatestaff, deletestaff } = require('../controllers/staffController');
const upload = require('../middleware/upload');

// @route   GET api/staffs
// @desc    Get all staffs
// @access  Private (Admin)
router.get('/', getstaffs);

// @route   GET api/staffs/:id
// @desc    Get staff by ID
// @access  Private
router.get('/:id', getstaffById);

// @route   POST api/staffs
// @desc    Create a staff
// @access  Private (Admin)
router.post('/', upload.single('profilePicture'), createstaff);

// @route   PUT api/staffs/:id
// @desc    Update a staff
// @access  Private (Admin)
router.put('/:id', upload.single('profilePicture'), updatestaff);

// @route   DELETE api/staffs/:id
// @desc    Delete a staff
// @access  Private (Admin)
router.delete('/:id', deletestaff);

module.exports = router;
