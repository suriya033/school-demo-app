const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance, getStudentAttendance, getAdminAttendanceStats, getClassAttendanceDetails } = require('../controllers/attendanceController');

// @route   GET api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', getAttendance);

// @route   POST api/attendance
// @desc    Mark attendance
// @access  Private (staff/Admin)
router.post('/', markAttendance);

// @route   GET api/attendance/admin-stats
// @desc    Get admin attendance statistics
// @access  Private (Admin)
router.get('/admin-stats', getAdminAttendanceStats);

// @route   GET api/attendance/class-details
// @desc    Get class attendance details with student list
// @access  Private (Admin)
router.get('/class-details', getClassAttendanceDetails);

// @route   GET api/attendance/student/:studentId
// @desc    Get student attendance history
// @access  Private
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
