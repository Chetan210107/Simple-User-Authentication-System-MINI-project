const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Question = require('../models/Question');

function normalizeDifficulty(difficulty) {
  const d = String(difficulty || '').toLowerCase();
  if (d === 'easy' || d === 'medium' || d === 'hard') return d;
  return 'easy';
}

function normalizeText(s) {
  return String(s || '').trim();
}

function buildKey({ subject, question }) {
  return `${normalizeText(subject).toLowerCase()}::${normalizeText(question).toLowerCase()}`;
}

async function main() {
  const mockPath = path.join(__dirname, '..', '..', 'client', 'src', 'components', 'Quiz', 'mock.json');
  const raw = fs.readFileSync(mockPath, 'utf8');
  const items = JSON.parse(raw);

  if (!Array.isArray(items)) {
    throw new Error('mock.json must be an array');
  }

  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI is not set (server/.env)');
  }

  await mongoose.connect(mongoURI);

  const existing = await Question.find({}, { subject: 1, question: 1 }).lean();
  const existingKeys = new Set(existing.map((q) => buildKey({ subject: q.subject, question: q.question })));

  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    const subject = normalizeText(item.category || item.subject);
    const questionText = normalizeText(item.question);
    const options = Array.isArray(item.options) ? item.options.map(normalizeText).filter(Boolean) : [];
    const answer = normalizeText(item.correct_answer || item.answer);
    const difficulty = normalizeDifficulty(item.difficulty);

    if (!subject || !questionText || options.length < 2 || !answer) {
      skipped += 1;
      continue;
    }

    const key = buildKey({ subject, question: questionText });
    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    await Question.create({
      subject,
      question: questionText,
      options: options.slice(0, 4),
      answer,
      difficulty,
    });

    existingKeys.add(key);
    inserted += 1;
  }

  const total = await Question.countDocuments();
  await mongoose.disconnect();

  console.log(`Seed complete. Inserted: ${inserted}, skipped: ${skipped}, total in DB: ${total}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

