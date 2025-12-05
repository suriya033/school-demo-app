const express = require('express');
const router = express.Router();
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');

// @route   GET api/notices
// @desc    Get all notices
// @access  Private
router.get('/', getNotices);

const upload = require('../middleware/upload');

// @route   POST api/notices
// @desc    Create notice
// @access  Private (Admin)
router.post('/', upload.single('attachment'), createNotice);

// @route   PUT api/notices/:id
// @desc    Update notice
// @access  Private (Admin)
router.put('/:id', updateNotice);

// @route   DELETE api/notices/:id
// @desc    Delete notice
// @access  Private (Admin)
router.delete('/:id', deleteNotice);

module.exports = router;
