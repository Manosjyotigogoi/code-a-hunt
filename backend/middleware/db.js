import mongoose from 'mongoose';

// ── Connection ────────────────────────────────────────────────────────────────
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  id:                         { type: String, required: true, unique: true },
  name:                       { type: String, required: true },
  email:                      { type: String, required: true, lowercase: true, unique: true },
  password:                   { type: String, required: true },
  hasCompletedDataCollection: { type: Boolean, default: false },
  createdAt:                  { type: String },
});

const eduDataSchema = new mongoose.Schema({
  userId:          { type: String, required: true, unique: true },
  institution:     String,
  educationLevel:  String,
  course:          String,
  semester:        String,
  specialization:  String,
  subjects:        [String],
  updatedAt:       String,
});

const examSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  exams:     { type: Array, default: [] },
  updatedAt: String,
});

const growthSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  subject:   { type: String, required: true },
  scores:    { type: Array, default: [] },
  analysis:  { type: Object, default: null },
  updatedAt: String,
});

const timetableSchema = new mongoose.Schema({
  userId:      { type: String, required: true, unique: true },
  schedule:    { type: Array, default: [] },
  hoursPerDay: { type: Number, default: 3 },
  updatedAt:   String,
});

const subjectDataSchema = new mongoose.Schema({
  userId:      { type: String, required: true },
  subject:     { type: String, required: true },
  notes:       { type: String, default: '' },
  youtubeLink: { type: String, default: '' },
  summary:     { type: String, default: '' },
  questions:   { type: Array, default: [] },
  updatedAt:   String,
});

const quizAttemptSchema = new mongoose.Schema({
  id:               { type: String, required: true, unique: true },
  userId:           { type: String, required: true },
  subject:          { type: String, required: true },
  correct:          { type: Number, default: 0 },
  total:            { type: Number, required: true },
  score:            Number,
  accuracy:         Number,
  difficulty:       Number,
  previousScore:    Number,
  timeTakenSeconds: { type: Number, default: 0 },
  questions:        { type: Array, default: [] },
  createdAt:        String,
  date:             String,
  time:             String,
});

const sessionSchema = new mongoose.Schema({
  userId:             { type: String, required: true },
  date:               { type: String, required: true },
  totalOnlineMinutes: { type: Number, default: 0 },
  activeMinutes:      { type: Number, default: 0 },
  breaks:             { type: Number, default: 0 },
  focusLevel:         { type: Number, default: 5 },
  updatedAt:          String,
});

const questionSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  subject:   { type: String, required: true },
  topic:     { type: String, default: '' },
  questions: { type: Array, default: [] },
  savedAt:   String,
});

const studyMaterialSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  subject:   { type: String, required: true },
  weakAreas: { type: String, default: '' },
  materials: { type: Array, default: [] },
  savedAt:   String,
});

// ── Models ────────────────────────────────────────────────────────────────────
export const User          = mongoose.model('User',          userSchema);
export const EduData       = mongoose.model('EduData',       eduDataSchema);
export const Exam          = mongoose.model('Exam',          examSchema);
export const Growth        = mongoose.model('Growth',        growthSchema);
export const Timetable     = mongoose.model('Timetable',     timetableSchema);
export const SubjectData   = mongoose.model('SubjectData',   subjectDataSchema);
export const QuizAttempt   = mongoose.model('QuizAttempt',   quizAttemptSchema);
export const Session       = mongoose.model('Session',       sessionSchema);
export const Question      = mongoose.model('Question',      questionSchema);
export const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
