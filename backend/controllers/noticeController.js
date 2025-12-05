const Notice = require('../models/Notice');

// Get all notices
exports.getNotices = async (req, res) => {
    try {
        const { targetAudience } = req.query;

        let query = {};
        if (targetAudience) {
            query.targetAudience = targetAudience;
        }

        const notices = await Notice.find(query)
            .populate('author', 'name role')
            .populate('targetClasses', 'name grade section')
            .sort({ date: -1 });

        res.json(notices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create notice
exports.createNotice = async (req, res) => {
    try {
        const { title, content, authorId, targetAudience, targetClasses } = req.body;

        const noticeData = {
            title,
            content,
            author: authorId,
            targetAudience: typeof targetAudience === 'string' ? JSON.parse(targetAudience) : (targetAudience || []),
            targetClasses: typeof targetClasses === 'string' ? JSON.parse(targetClasses) : (targetClasses || []),
        };

        if (req.file) {
            // Extract only the relative path (uploads/filename)
            // req.file.path might be absolute like "C:/Users/.../uploads/file.jpg"
            // We only want "uploads/file.jpg"
            const relativePath = req.file.path.replace(/\\/g, "/").split('uploads/').pop();
            noticeData.attachmentUrl = `uploads/${relativePath}`;

            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                noticeData.attachmentType = 'image';
            } else if (fileExtension === 'pdf') {
                noticeData.attachmentType = 'pdf';
            }
        }

        const notice = new Notice(noticeData);

        await notice.save();

        const populated = await Notice.findById(notice._id)
            .populate('author', 'name role')
            .populate('targetClasses', 'name grade section');

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update notice
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, targetAudience, targetClasses } = req.body;

        const notice = await Notice.findByIdAndUpdate(
            id,
            { title, content, targetAudience, targetClasses },
            { new: true }
        )
            .populate('author', 'name role')
            .populate('targetClasses', 'name grade section');

        res.json(notice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete notice
exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        await Notice.findByIdAndDelete(id);
        res.json({ message: 'Notice deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
