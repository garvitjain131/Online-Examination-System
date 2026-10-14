import { evaluate } from './domain.js';
export const DEMO_USERS = [
  { id: 'student-garvit', name: 'Garvit Jain', email: 'garvit@student.demo', role: 'student', roll: 'E225', course: 'B.Tech Computer Science', semester: '5' },
  { id: 'student-neha', name: 'Neha Sharma', email: 'neha@student.demo', role: 'student', roll: 'E226', course: 'B.Tech Computer Science', semester: '5' },
  { id: 'faculty-meera', name: 'Dr. Meera Kapoor', email: 'meera@faculty.demo', role: 'faculty', department: 'Computer Science' },
  { id: 'admin-aryan', name: 'Aryan Verma', email: 'aryan@admin.demo', role: 'admin' }
];
const questionSets = {
  se: [
    ['Which model follows a sequential approach to software development?', ['Agile', 'Waterfall', 'Spiral', 'Prototype'], 1, 'The Waterfall model completes phases in sequence.'],
    ['What does a use case diagram primarily describe?', ['Database tables', 'Interactions between actors and a system', 'Source code structure', 'Network topology'], 1, 'Use cases represent system functions from an actor’s perspective.'],
    ['Which testing technique uses knowledge of the internal code?', ['Black-box testing', 'Acceptance testing', 'White-box testing', 'Usability testing'], 2, 'White-box testing exercises internal structures and paths.'],
    ['Which is a non-functional requirement?', ['Register a student', 'Generate a score card', 'Load a page within 2 seconds', 'Create an examination'], 2, 'Response time describes a quality constraint.'],
    ['In UML, which relationship represents strong ownership?', ['Association', 'Generalization', 'Aggregation', 'Composition'], 3, 'Composition gives a part a lifecycle tied to its owner.'],
    ['What is the main purpose of regression testing?', ['Check existing features after changes', 'Replace unit testing', 'Measure network speed', 'Create requirements'], 0, 'Regression tests check that changes have not broken existing behavior.']
  ],
  dbms: [
    ['Which SQL command retrieves records?', ['UPDATE', 'SELECT', 'DELETE', 'INSERT'], 1, 'SELECT retrieves data from one or more tables.'],
    ['A primary key must be…', ['Nullable', 'Unique and non-null', 'A text field', 'A foreign key'], 1, 'A primary key uniquely identifies every row.'],
    ['Which normal form removes partial dependencies?', ['1NF', '2NF', '3NF', 'BCNF only'], 1, 'Second normal form removes partial dependencies on composite candidate keys.'],
    ['What does the A in ACID stand for?', ['Availability', 'Aggregation', 'Atomicity', 'Authorization'], 2, 'Atomicity treats a transaction as one indivisible operation.'],
    ['Which JOIN returns only matching rows from both tables?', ['FULL JOIN', 'LEFT JOIN', 'CROSS JOIN', 'INNER JOIN'], 3, 'An INNER JOIN returns matches satisfying the join condition.'],
    ['Which constraint enforces a relationship between tables?', ['DEFAULT', 'FOREIGN KEY', 'CHECK only', 'NOT NULL'], 1, 'A foreign key references a key in another or the same table.']
  ],
  cn: [
    ['Which protocol provides reliable, ordered delivery?', ['UDP', 'IP', 'TCP', 'ARP'], 2, 'TCP provides acknowledgements and ordered delivery.'],
    ['What does DNS resolve?', ['MAC addresses to ports', 'Domain names to IP addresses', 'Files to folders', 'Passwords to users'], 1, 'DNS maps domain names to records including IP addresses.'],
    ['Which OSI layer handles routing?', ['Physical', 'Network', 'Session', 'Application'], 1, 'The Network layer routes packets between networks.'],
    ['What is the default HTTPS port?', ['21', '80', '443', '25'], 2, 'HTTPS commonly uses TCP port 443.'],
    ['Which device forwards frames using MAC addresses?', ['Switch', 'Repeater', 'Modem', 'Hub'], 0, 'Ethernet switches use MAC address tables.'],
    ['How many bits are in an IPv4 address?', ['16', '32', '64', '128'], 1, 'IPv4 addresses contain 32 bits.']
  ]
};
export function createSeed() {
  const now = Date.now();
  const questions = Object.entries(questionSets).flatMap(([subject, items]) => items.map(([text, options, correct, explanation], i) => ({id: `${subject}-${i + 1}`, subject, text, options, correct, explanation, difficulty: i < 2 ? 'Easy' : 'Medium'})));
  const base = { duration: 20, marks: 4, penalty: 1, passPercent: 40, maxAttempts: 1, assigned: ['*'], published: true, createdBy: 'faculty-meera' };
  const exams = [
    { ...base, id: 'exam-se', subject: 'se', title: 'Software Engineering', description: 'SDLC, requirements, UML & software testing', start: new Date(now - 3600000).toISOString(), end: new Date(now + 7 * 86400000).toISOString(), questionIds: questions.filter(q => q.subject === 'se').map(q => q.id) },
    { ...base, id: 'exam-dbms', subject: 'dbms', title: 'Database Management Systems', description: 'Relational databases, SQL & normalization', duration: 15, penalty: 0, start: new Date(now - 3600000).toISOString(), end: new Date(now + 7 * 86400000).toISOString(), questionIds: questions.filter(q => q.subject === 'dbms').map(q => q.id) },
    { ...base, id: 'exam-cn', subject: 'cn', title: 'Computer Networks', description: 'Network layers, protocols & addressing', duration: 25, start: new Date(now + 86400000).toISOString(), end: new Date(now + 2 * 86400000).toISOString(), questionIds: questions.filter(q => q.subject === 'cn').map(q => q.id) },
    { ...base, id: 'exam-practice', subject: 'se', title: 'SE · Foundation Practice', start: new Date(now - 3 * 86400000).toISOString(), end: new Date(now - 86400000).toISOString(), questionIds: questions.filter(q => q.subject === 'se').slice(0, 5).map(q => q.id) }
  ];
  const practice = { id: 'attempt-practice', examId: 'exam-practice', userId: 'student-garvit', title: 'SE · Foundation Practice', subject: 'se', questions: questions.filter(q => q.subject === 'se').slice(0, 5), rules: {marks: 4, penalty: 0, passPercent: 40}, answers: {'se-1': 1, 'se-2': 1, 'se-3': 2, 'se-4': 2, 'se-5': 1}, flagged: [], startedAt: now - 2 * 86400000, deadline: now - 2 * 86400000 + 1200000, status: 'submitted' };
  practice.result = evaluate(practice, false, now - 2 * 86400000 + 800000);
  return { version: 1, users: DEMO_USERS, subjects: [{id:'se', code:'CS301', name:'Software Engineering', color:'green'}, {id:'dbms', code:'CS302', name:'Database Management Systems', color:'blue'}, {id:'cn', code:'CS303', name:'Computer Networks', color:'purple'}], questions, exams, attempts: [practice], logs: [{id:'initial-log', userId:'faculty-meera', action:'Demo workspace created', detail:'Sample examinations and question bank', at:now}] };
}
