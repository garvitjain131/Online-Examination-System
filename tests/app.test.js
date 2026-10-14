import test, { before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { webcrypto } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { createSeed } from '../src/data.js';
import { STORE_KEY } from '../src/domain.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost:5173'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,sessionStorage:dom.window.sessionStorage,HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,MutationObserver:dom.window.MutationObserver,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
let React, App, render, screen, within, fireEvent, waitFor, cleanup;
const require=createRequire(import.meta.url);
before(async()=>{
 React=(await import('react')).default;
 ({render,screen,within,fireEvent,waitFor,cleanup}=await import('@testing-library/react'));
 const bundled=await build({entryPoints:['src/App.jsx'],bundle:true,write:false,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const code=bundled.outputFiles[0].text.replace(/from "([^".][^"]*)"/g,(_,pkg)=>`from "${pathToFileURL(require.resolve(pkg)).href}"`);
 App=(await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
});
afterEach(()=>{cleanup();localStorage.clear();sessionStorage.clear();});
function mount(role='student-garvit',db=createSeed()) {localStorage.setItem(STORE_KEY,JSON.stringify(db));localStorage.setItem('examdesk-session',role);return render(React.createElement(App));}
const stored=()=>JSON.parse(localStorage.getItem(STORE_KEY));
const click=(name,scope=screen)=>fireEvent.click(scope.getByRole('button',{name}));
function fill(label,value,scope=screen){fireEvent.change(scope.getByLabelText(label),{target:{value}});}

test('student can start, save, refresh, resume, submit, and view one result',async()=>{
 const view=mount();
 assert.ok(screen.getByRole('heading',{name:'A good day to make progress.'}));
 click('My examinations');
 const card=screen.getByRole('heading',{name:'Software Engineering'}).closest('article');
 click(/Start exam/,within(card));click(/Begin examination/);
 let a=stored().attempts.find(a=>a.status==='active');assert.ok(a);const deadline=a.deadline;
 const q=a.questions[0];
 fireEvent.click(screen.getByRole('radio',{name:new RegExp(q.options[q.correct].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}));
 click('Mark for review');
 a=stored().attempts.find(x=>x.id===a.id);assert.equal(a.answers[q.id],q.correct);assert.ok(a.flagged.includes(q.id));
 view.unmount();render(React.createElement(App));click('My examinations');click(/Resume exam/);
 assert.ok(screen.getByRole('radio',{checked:true}));assert.equal(stored().attempts.find(x=>x.id===a.id).deadline,deadline);
 click('Submit examination');
 const dialog=within(screen.getByRole('dialog',{name:'Ready to submit?'}));click('Submit examination',dialog);
 assert.ok(screen.getByRole('heading',{name:'Look back. Learn more.'}));
 assert.equal(stored().attempts.find(x=>x.id===a.id).result.score,4);
 assert.equal(stored().attempts.filter(x=>x.id===a.id && x.status==='submitted').length,1);
 click('My examinations');const completed=screen.getByRole('heading',{name:'Software Engineering'}).closest('article');
 assert.ok(within(completed).getByRole('button',{name:/View result/}));assert.equal(within(completed).queryByRole('button',{name:/Start exam/}),null);
});

test('faculty adds a question and publishes a configurable assigned examination',()=>{
 mount('faculty-meera');click('Question bank');click('Add question');
 let dialog=within(screen.getByRole('dialog'));
 fill(/^Question$/,'What verifies a requirement?',dialog);
 ['A test','A guess','A color','A font'].forEach((value,i)=>fill(`Option ${String.fromCharCode(65+i)}`,value,dialog));
 fill(/^Explanation/,'Acceptance tests verify requirements.',dialog);click('Save question',dialog);
 assert.ok(stored().questions.some(q=>q.text==='What verifies a requirement?'));
 click('Examinations');click('Create examination');dialog=within(screen.getByRole('dialog'));
 fill('Examination title','Integration Demo',dialog);fill('Duration (minutes)','1',dialog);fill('Penalty per incorrect answer','1',dialog);
 fireEvent.click(dialog.getByLabelText('Select all questions in this subject'));
 fireEvent.click(dialog.getByLabelText(/^Publish examination/));click(/Save & publish/,dialog);
 const e=stored().exams.find(x=>x.title==='Integration Demo');assert.ok(e);assert.equal(e.published,true);assert.equal(e.duration,1);assert.equal(e.penalty,1);assert.equal(e.questionIds.length,7);assert.deepEqual(e.assigned,['*']);
 assert.ok(screen.getByRole('heading',{name:'Integration Demo'}));
});

test('student cannot begin a scheduled examination early',()=>{
 mount();click('My examinations');const card=screen.getByRole('heading',{name:'Computer Networks'}).closest('article');click('View details',within(card));
 assert.equal(screen.getByRole('button',{name:/Begin examination/}).disabled,true);
 assert.ok(screen.getByText('This examination is outside its scheduled window.'));
});

test('an expired attempt submits automatically and preserves the saved answer',async()=>{
 const db=createSeed(),exam=db.exams[0],q=db.questions.find(q=>q.id===exam.questionIds[0]);
 db.attempts.push({id:'expired',examId:exam.id,userId:'student-garvit',title:exam.title,subject:exam.subject,questions:[q],rules:{marks:4,penalty:1,passPercent:40},answers:{[q.id]:q.correct},flagged:[],startedAt:Date.now()-61000,deadline:Date.now()-1000,status:'active'});
 mount('student-garvit',db);
 await waitFor(()=>assert.equal(stored().attempts.find(a=>a.id==='expired').status,'submitted'),{timeout:2500});
 const a=stored().attempts.find(a=>a.id==='expired');assert.equal(a.result.autoSubmitted,true);assert.equal(a.result.score,4);
});

test('registration hashes a password and the new student can sign in again',async()=>{
 mount('logged-out');click('Register as a student');
 fill('Full name','Test Student');fill('Email address','test@example.test');fill('Roll number','TEST-100');fill(/^Password/,'demo-test-123');click('Create student account');
 await waitFor(()=>assert.ok(screen.getByRole('heading',{name:'A good day to make progress.'})),{timeout:4000});
 const u=stored().users.find(u=>u.email==='test@example.test');assert.ok(u);assert.ok(u.passwordHash);assert.equal(u.password,undefined);assert.notEqual(u.passwordHash,'demo-test-123');
 click('Switch account or role');click('Sign out / register a new account');
 fill('Email address','test@example.test');fill(/^Password/,'demo-test-123');click('Sign in');
 await waitFor(()=>assert.ok(screen.getByRole('heading',{name:'A good day to make progress.'})),{timeout:4000});
 assert.equal(localStorage.getItem('examdesk-session'),u.id);
});

test('administrator creates a subject and disables a demo student account',()=>{
 mount('admin-aryan');click('Subjects');click('Add subject');
 const dialog=within(screen.getByRole('dialog'));fill('Subject code','CS304',dialog);fill('Subject name','Operating Systems',dialog);click('Save subject',dialog);
 assert.ok(stored().subjects.some(s=>s.code==='CS304'));
 click('User management');const row=screen.getByText('Neha Sharma').closest('tr');click('Disable',within(row));
 assert.equal(stored().users.find(u=>u.id==='student-neha').disabled,true);
 click('Activity log');assert.ok(screen.getByRole('cell',{name:'User disabled'}));assert.ok(screen.getByRole('cell',{name:'Subject saved'}));
});
