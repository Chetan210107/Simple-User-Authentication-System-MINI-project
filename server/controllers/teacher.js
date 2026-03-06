const User = require('../models/User');
const Question = require('../models/Question');

exports.getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'Student' });
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.createQuestion = async (req, res) => {
    const { question, options, answer, subject, difficulty } = req.body;

    try {
        // Find the highest order value for the given subject
        const lastQuestion = await Question.findOne({ subject }).sort({ order: -1 });
        const newOrder = lastQuestion ? lastQuestion.order + 1 : 0;

        const newQuestion = new Question({
            question,
            options,
            answer,
            subject,
            difficulty: difficulty || 'easy',
            order: newOrder
        });

        const savedQuestion = await newQuestion.save();
        res.json(savedQuestion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getQuestions = async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }
        res.json(question);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Question not found' });
        }
        res.status(500).send('Server error');
    }
};

exports.updateQuestion = async (req, res) => {
    const { question, options, answer, subject, difficulty } = req.body;

    try {
        let questionToUpdate = await Question.findById(req.params.id);
        if (!questionToUpdate) {
            return res.status(404).json({ msg: 'Question not found' });
        }

        questionToUpdate = await Question.findByIdAndUpdate(
            req.params.id,
            { $set: { question, options, answer, subject, difficulty } },
            { new: true }
        );

        res.json(questionToUpdate);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Question not found' });
        }
        res.status(500).send('Server error');
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }

        res.json({ msg: 'Question removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Question not found' });
        }
        res.status(500).send('Server error');
    }
};

exports.kickStudent = async (req, res) => {
    const { id: userIdToKick } = req.params;
    const { io, userSockets } = req;

    try {
        const userToKick = await User.findById(userIdToKick);
        if (!userToKick) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (userToKick.role !== 'Student') {
            return res.status(403).json({ msg: 'Teachers can only kick students.' });
        }

        const socketId = userSockets[userIdToKick];

        if (socketId) {
            io.to(socketId).emit('kicked', { msg: 'You have been kicked by your teacher.' });
            
            delete userSockets[userIdToKick];

            res.json({ msg: `Student ${userIdToKick} has been kicked.` });
        } else {
            res.status(404).json({ msg: 'Student is not currently connected.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateQuestionOrder = async (req, res) => {
    const { questionIds } = req.body; // Array of question _id strings in new order

    if (!questionIds || !Array.isArray(questionIds)) {
        return res.status(400).json({ msg: 'Invalid request body. Expecting an array of questionIds.' });
    }

    try {
        const updatePromises = questionIds.map((id, index) =>
            Question.findByIdAndUpdate(id, { $set: { order: index } })
        );

        await Promise.all(updatePromises);

        res.json({ msg: 'Question order updated successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
