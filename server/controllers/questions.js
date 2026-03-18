const Question = require('../models/Question');

exports.getCategories = async (req, res) => {
    try {
        const categories = await Question.distinct('subject');
        res.json(categories);
    } catch (err) {
        console.error(err.message);
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
