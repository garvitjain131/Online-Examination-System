export const STORE_KEY = 'examdesk-v1';
export const uid = () => crypto.randomUUID();
export function statusOf(exam, now = Date.now()) {
  if (!exam.published) return 'Draft';
  if (now < Date.parse(exam.start)) return 'Upcoming';
  if (now >= Date.parse(exam.end)) return 'Closed';
  return 'Live';
}
export function eligible(exam, user, attempts, now = Date.now()) {
  if (!exam || user.role !== 'student') return 'Only students can attempt examinations.';
  if (!exam.assigned.includes('*') && !exam.assigned.includes(user.id)) return 'This examination is not assigned to you.';
  const existing = attempts.filter(a => a.examId === exam.id && a.userId === user.id);
  if (existing.some(a => a.status === 'active')) return null;
  if (statusOf(exam, now) !== 'Live') return 'This examination is outside its scheduled window.';
  if (existing.filter(a => a.status === 'submitted').length >= exam.maxAttempts) return 'You have used all available attempts.';
  return null;
}
export function evaluate(attempt, autoSubmitted = false, now = Date.now()) {
  let correct = 0, wrong = 0, skipped = 0;
  const review = attempt.questions.map(q => {
    const answer = attempt.answers[q.id];
    const answered = Number.isInteger(answer);
    const isCorrect = answered && answer === q.correct;
    if (!answered) skipped++; else if (isCorrect) correct++; else wrong++;
    return { ...q, selected: answered ? answer : null, isCorrect };
  });
  const total = attempt.questions.length * attempt.rules.marks;
  const score = Math.max(0, correct * attempt.rules.marks - wrong * attempt.rules.penalty);
  const percentage = total ? Math.round(score / total * 10000) / 100 : 0;
  return { score, total, percentage, correct, wrong, skipped, passed: percentage >= attempt.rules.passPercent,
    grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= attempt.rules.passPercent ? 'D' : 'F',
    review, autoSubmitted, submittedAt: now };
}
export function submitAttempt(db, id, automatic = false, now = Date.now()) {
  const a = db.attempts.find(x => x.id === id);
  if (!a || a.status !== 'active') return db;
  return { ...db, attempts: db.attempts.map(x => x.id === id ? { ...x, status: 'submitted', result: evaluate(x, automatic || now >= x.deadline, now) } : x),
    logs: [...db.logs, { id: uid(), userId: a.userId, action: automatic || now >= a.deadline ? 'Examination auto-submitted' : 'Examination submitted', detail: a.title, at: now }] };
}
export function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
export function formatTime(ms) {
  const secs = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
}
export function csv(rows) {
  return rows.map(row => row.map(value => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`).join(',')).join('\r\n');
}
