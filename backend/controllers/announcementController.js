const Announcement = require('../models/Announcement');
const User = require('../models/User');

// Get announcements for current user
exports.getAnnouncements = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        let query = {};

        // staffs see announcements targeted to staffs or All
        if (user.role === 'staff') {
            query.targetAudience = { $in: ['staffs', 'All'] };
        }
        // Students see announcements targeted to Students or All
        else if (user.role === 'Student') {
            query.targetAudience = { $in: ['Students', 'All'] };
        }
        // Admins see all announcements
        else if (user.role === 'Admin') {
            // No filter, see all
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        const announcements = await Announcement.find(query)
            .populate('sender', 'name role')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(announcements);
    } catch (err) {
        console.error('Error fetching announcements:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Create announcement (Admin and Staff)
exports.createAnnouncement = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (user.role !== 'Admin' && user.role !== 'staff') {
            return res.status(403).json({ message: 'Only admins and staff can create announcements' });
        }

        const { title, content, targetAudience } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const announcementData = {
            sender: userId,
            title: title.trim(),
            content: content.trim(),
            targetAudience: targetAudience || 'staffs',
            readBy: [userId], // Sender has read it
        };

        // Handle file attachment
        if (req.file) {
            const relativePath = req.file.path.replace(/\\/g, "/").split('uploads/').pop();
            announcementData.attachmentUrl = `uploads/${relativePath}`;

            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                announcementData.attachmentType = 'image';
            } else if (fileExtension === 'pdf') {
                announcementData.attachmentType = 'pdf';
            }
        }

        const announcement = new Announcement(announcementData);
        await announcement.save();

        const populatedAnnouncement = await Announcement.findById(announcement._id)
            .populate('sender', 'name role');

        res.status(201).json(populatedAnnouncement);
    } catch (err) {
        console.error('Error creating announcement:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const userId = req.user.id;

        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (!announcement.readBy.includes(userId)) {
            announcement.readBy.push(userId);
            await announcement.save();
        }

        res.json({ message: 'Announcement marked as read' });
    } catch (err) {
        console.error('Error marking announcement as read:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Delete announcement (Admin or Sender)
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const announcement = await Announcement.findById(announcementId);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Allow Admin or the original sender to delete
        if (user.role !== 'Admin' && announcement.sender.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own announcements' });
        }

        await Announcement.findByIdAndDelete(announcementId);
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        let query = { readBy: { $ne: userId } };

        if (user.role === 'staff') {
            query.targetAudience = { $in: ['staffs', 'All'] };
        } else if (user.role === 'Student') {
            query.targetAudience = { $in: ['Students', 'All'] };
        }

        const count = await Announcement.countDocuments(query);
        res.json({ count });
    } catch (err) {
        console.error('Error getting unread count:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};
