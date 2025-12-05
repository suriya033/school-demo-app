const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const auth = require('../middleware/auth');

router.get('/', auth, timetableController.getTimetables);
router.get('/:id', auth, timetableController.getTimetableById);
router.post('/', auth, timetableController.createTimetable);
router.put('/:id', auth, timetableController.updateTimetable);
router.delete('/:id', auth, timetableController.deleteTimetable);

module.exports = router;
