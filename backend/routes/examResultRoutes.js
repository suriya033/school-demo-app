const express = require('express');
const router = express.Router();
const examResultController = require('../controllers/examResultController');
const auth = require('../middleware/auth');

router.get('/', auth, examResultController.getExamResults);
router.get('/:id', auth, examResultController.getExamResultById);
router.post('/', auth, examResultController.createExamResult);
router.put('/:id', auth, examResultController.updateExamResult);
router.delete('/:id', auth, examResultController.deleteExamResult);

module.exports = router;
