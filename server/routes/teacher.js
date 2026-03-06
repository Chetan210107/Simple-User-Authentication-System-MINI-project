const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
    getStudents,
    createQuestion,
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    kickStudent,
    updateQuestionOrder
} = require('../controllers/teacher');

// @route   GET api/teacher/students
// @desc    Get all students
// @access  Private (Teacher)
router.get('/students', protect, authorize('Teacher', 'Admin'), getStudents);

// @route   PUT api/teacher/questions/reorder
// @desc    Update the order of questions
// @access  Private (Teacher)
router.put('/questions/reorder', protect, authorize('Teacher', 'Admin'), updateQuestionOrder);

// @route   POST api/teacher/questions
// @desc    Create a new question
// @access  Private (Teacher)
router.post('/questions', protect, authorize('Teacher', 'Admin'), createQuestion);

// @route   GET api/teacher/questions
// @desc    Get all questions
// @access  Private (Teacher)
router.get('/questions', protect, authorize('Teacher', 'Admin'), getQuestions);

// @route   GET api/teacher/questions/:id
// @desc    Get a single question
// @access  Private (Teacher)
router.get('/questions/:id', protect, authorize('Teacher', 'Admin'), getQuestion);

// @route   PUT api/teacher/questions/:id
// @desc    Update a question
// @access  Private (Teacher)
router.put('/questions/:id', protect, authorize('Teacher', 'Admin'), updateQuestion);

// @route   DELETE api/teacher/questions/:id
// @desc    Delete a question
// @access  Private (Teacher)
router.delete('/questions/:id', protect, authorize('Teacher', 'Admin'), deleteQuestion);

// @route   POST api/teacher/kick/:id
// @desc    Kick a student
// @access  Private (Teacher)
router.post('/kick/:id', protect, authorize('Teacher', 'Admin'), kickStudent);

module.exports = router;
