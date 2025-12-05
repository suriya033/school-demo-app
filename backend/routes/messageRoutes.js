const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    getClassMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    deleteMessage,
    votePoll
} = require('../controllers/messageController');

// @route   GET api/messages/class/:classId
// @desc    Get all messages for a class
// @access  Private (Students and staffs of that class)
router.get('/class/:classId', auth, getClassMessages);

// @route   POST api/messages/class/:classId
// @desc    Send a message to class
// @access  Private (Students and staffs of that class)
router.post('/class/:classId', auth, upload.single('attachment'), sendMessage);

// @route   PUT api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', auth, markAsRead);

// @route   PUT api/messages/:messageId/vote
// @desc    Vote on a poll
// @access  Private
router.put('/:messageId/vote', auth, votePoll);

// @route   GET api/messages/unread-count
// @desc    Get unread message count for user's class
// @access  Private
router.get('/unread-count', auth, getUnreadCount);

// @route   DELETE api/messages/:messageId
// @desc    Delete a message
// @access  Private (Sender or Class staff)
router.delete('/:messageId', auth, deleteMessage);

module.exports = router;
