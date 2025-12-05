const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const {
    getAnnouncements,
    createAnnouncement,
    markAsRead,
    deleteAnnouncement,
    getUnreadCount
} = require('../controllers/announcementController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `attachment-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed'));
    }
});

// @route   GET api/announcements
// @desc    Get announcements for current user
// @access  Private
router.get('/', auth, getAnnouncements);

// @route   POST api/announcements
// @desc    Create announcement (Admin and Staff)
// @access  Private (Admin/Staff)
router.post('/', auth, upload.single('attachment'), createAnnouncement);

// @route   PUT api/announcements/:announcementId/read
// @desc    Mark announcement as read
// @access  Private
router.put('/:announcementId/read', auth, markAsRead);

// @route   DELETE api/announcements/:announcementId
// @desc    Delete announcement (Admin only)
// @access  Private (Admin)
router.delete('/:announcementId', auth, deleteAnnouncement);

// @route   GET api/announcements/unread/count
// @desc    Get unread announcement count
// @access  Private
router.get('/unread/count', auth, getUnreadCount);

module.exports = router;
