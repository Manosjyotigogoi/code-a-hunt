// All AI calls go through the backend (keeps API key server-side)
import api from './api';

export async function generateQuestions(subject, notesContext, count = 5) {
  const { data } = await api.post('/ai/questions', { subject, context: notesContext, count });
  return data.questions || [];
}

export async function summarizeNotes(subject, text) {
  const { data } = await api.post('/ai/summarize', { subject, text });
  return data.summary || '';
}

export async function generateStudySchedule(subjects, examDates, hoursPerDay) {
  const { data } = await api.post('/ai/schedule', { subjects, examDates, hoursPerDay });
  return data;
}

export async function askStudyQuestion(question, subject, eduContext) {
  const { data } = await api.post('/ai/ask', { question, subject, eduContext });
  return data.answer || '';
}

export async function recommendMaterials(subject, level, weakAreas) {
  const { data } = await api.post('/ai/materials', { subject, level, weakAreas });
  return data;
}

export async function analyzeGrowth(subject, scores, topics) {
  const { data } = await api.post('/ai/growth', { subject, scores, topics });
  return data;
}

export default api;
