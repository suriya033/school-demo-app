const Message = require('../models/Message');
const User = require('../models/User');
const Class = require('../models/Class');

// Get messages for a class
exports.getClassMessages = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.id;

        // Verify user has access to this class (either staff or student)
        const user = await User.findById(userId);
        const isstaff = user.role === 'staff' && user.staffClass?.toString() === classId;
        const isStudent = user.role === 'Student' && user.studentClass?.toString() === classId;

        if (!isstaff && !isStudent) {
            return res.status(403).json({ message: 'Access denied to this class' });
        }

        const messages = await Message.find({ class: classId })
            .populate('sender', 'name role profilePicture')
            .sort({ createdAt: 1 })
            .limit(100); // Last 100 messages

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Send a message to class
exports.sendMessage = async (req, res) => {
    try {
        const { classId } = req.params;
        const { content, isPoll, pollQuestion, pollOptions } = req.body;
        const userId = req.user.id;

        // Verify user has access to this class
        const user = await User.findById(userId);
        const isstaff = user.role === 'staff' && user.staffClass?.toString() === classId;
        const isStudent = user.role === 'Student' && user.studentClass?.toString() === classId;

        if (!isstaff && !isStudent) {
            return res.status(403).json({ message: 'Access denied to this class' });
        }

        // Validate message content
        if (!isPoll && !content && !req.file) {
            return res.status(400).json({ message: 'Message content or attachment is required' });
        }

        if (isPoll && (!pollQuestion || !pollOptions)) {
            return res.status(400).json({ message: 'Poll question and options are required' });
        }

        const messageData = {
            class: classId,
            sender: userId,
            content: content?.trim() || '',
            readBy: [userId], // Sender has read it
        };

        // Handle file attachment
        if (req.file) {
            messageData.attachmentUrl = `uploads/${req.file.path.replace(/\\/g, "/").split('uploads/').pop()}`;
            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                messageData.attachmentType = 'image';
            } else if (fileExtension === 'pdf') {
                messageData.attachmentType = 'pdf';
            }
        }

        // Handle poll
        if (isPoll) {
            messageData.isPoll = true;
            messageData.pollQuestion = pollQuestion.trim();
            messageData.pollOptions = JSON.parse(pollOptions).map(option => ({
                option: option.trim(),
                votes: [],
            }));
        }

        const message = new Message(messageData);
        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name role profilePicture');

        res.status(201).json(populatedMessage);
    } catch (err) {
        console.error('Error sending message:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Add user to readBy if not already there
        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            await message.save();
        }

        res.json({ message: 'Message marked as read' });
    } catch (err) {
        console.error('Error marking message as read:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Get unread message count for user's class
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        let classId;
        if (user.role === 'staff') {
            classId = user.staffClass;
        } else if (user.role === 'Student') {
            classId = user.studentClass;
        }

        if (!classId) {
            return res.json({ count: 0 });
        }

        const count = await Message.countDocuments({
            class: classId,
            readBy: { $ne: userId },
        });

        res.json({ count });
    } catch (err) {
        console.error('Error getting unread count:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Delete a message (only sender or staff can delete)
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const user = await User.findById(userId);

        // Allow deletion if user is sender OR user is a staff of that class
        const isSender = message.sender.toString() === userId;
        const isstaff = user.role === 'staff' && user.staffClass?.toString() === message.class.toString();

        if (!isSender && !isstaff) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(messageId);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error('Error deleting message:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Vote on a poll
exports.votePoll = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message || !message.isPoll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        // Remove previous vote if exists
        message.pollOptions.forEach(opt => {
            opt.votes = opt.votes.filter(v => v.toString() !== userId);
        });

        // Add new vote
        if (message.pollOptions[optionIndex]) {
            message.pollOptions[optionIndex].votes.push(userId);
        } else {
            return res.status(400).json({ message: 'Invalid option' });
        }

        await message.save();

        // Return updated message
        const updatedMessage = await Message.findById(messageId)
            .populate('sender', 'name role profilePicture');

        res.json(updatedMessage);
    } catch (err) {
        console.error('Error voting on poll:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

