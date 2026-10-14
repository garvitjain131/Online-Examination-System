import test from 'node:test';
import assert from 'node:assert/strict';
import {eligible,evaluate,submitAttempt,statusOf,formatTime,csv,shuffle} from '../src/domain.js';
const now=Date.now();
const exam={id:'e',published:true,start:new Date(now-1000).toISOString(),end:new Date(now+60000).toISOString(),assigned:['s'],maxAttempts:1};
const student={id:'s',role:'student'};
const attempt=(answers,count=12)=>({id:'a',examId:'e',userId:'s',title:'Test',questions:Array.from({length:count},(_,i)=>({id:String(i),text:`Q${i}`,options:['A','B','C','D'],correct:0})),answers,rules:{marks:4,penalty:1,passPercent:40},deadline:now+60000,status:'active'});
test('deck example: 10 correct and 2 wrong equals 38 marks',()=>{
 const a=attempt(Object.fromEntries(Array.from({length:12},(_,i)=>[String(i),i<10?0:1])));const r=evaluate(a);
 assert.equal(r.score,38);assert.equal(r.correct,10);assert.equal(r.wrong,2);assert.equal(r.total,48);
});
test('score floors at zero; skipped answers have no penalty',()=>{
 const r=evaluate(attempt({'0':1,'1':1,'2':1,'3':1,'4':1}));
 assert.equal(r.score,0);assert.equal(r.wrong,5);assert.equal(r.skipped,7);assert.equal(r.passed,false);
});
test('pass boundary is inclusive at 40 percent',()=>{
 const a=attempt({'0':0,'1':0},5);a.rules.penalty=0;
 assert.equal(evaluate(a).percentage,40);assert.equal(evaluate(a).passed,true);assert.equal(evaluate({...a,answers:{'0':0}}).passed,false);
});
test('selected option zero and unanswered are distinguished',()=>{
 const r=evaluate(attempt({'0':0},2));assert.equal(r.review[0].selected,0);assert.equal(r.review[0].isCorrect,true);assert.equal(r.review[1].selected,null);
});
test('publication and opening/closing boundaries',()=>{
 assert.equal(statusOf({...exam,published:false},now),'Draft');assert.equal(statusOf(exam,Date.parse(exam.start)-1),'Upcoming');assert.equal(statusOf(exam,Date.parse(exam.start)),'Live');assert.equal(statusOf(exam,Date.parse(exam.end)),'Closed');
});
test('eligibility checks role, assignment, schedule and attempt limits',()=>{
 assert.equal(eligible(exam,student,[],now),null);assert.ok(eligible(exam,{...student,role:'faculty'},[],now));assert.ok(eligible(exam,{...student,id:'other'},[],now));assert.ok(eligible({...exam,start:new Date(now+1000).toISOString()},student,[],now));assert.ok(eligible(exam,student,[{examId:'e',userId:'s',status:'submitted'}],now));assert.equal(eligible({...exam,maxAttempts:2},student,[{examId:'e',userId:'s',status:'submitted'}],now),null);
});
test('resumption and wildcard assignment',()=>{
 assert.equal(eligible(exam,student,[{examId:'e',userId:'s',status:'active'}],now),null);assert.equal(eligible({...exam,assigned:['*']},{id:'new',role:'student'},[],now),null);
});
test('one submission stores one result and one audit event',()=>{
 const db={attempts:[attempt({'0':0},2)],logs:[]};const once=submitAttempt(db,'a',false,now);const twice=submitAttempt(once,'a',false,now+1);
 assert.equal(once.attempts[0].status,'submitted');assert.equal(once.logs.length,1);assert.strictEqual(twice,once);assert.equal(db.attempts[0].status,'active');assert.equal(once.attempts[0].result.score,4);
});
test('timeout evaluates and preserves saved answers through serialization',()=>{
 const a=attempt({'0':0},1);a.deadline=now;const db=submitAttempt({attempts:[a],logs:[]},'a',false,now);
 assert.equal(db.attempts[0].result.autoSubmitted,true);assert.equal(db.attempts[0].result.score,4);assert.deepEqual(JSON.parse(JSON.stringify(db)).attempts[0].answers,{'0':0});
});
test('result review preserves question snapshots',()=>{
 const a=attempt({'0':0},1);const r=evaluate(a);a.questions[0].correct=1;assert.equal(r.review[0].correct,0);assert.equal(r.score,4);
});
test('timer formatting and shuffle',()=>{
 assert.equal(formatTime(61000),'01:01');assert.equal(formatTime(-1),'00:00');assert.equal(formatTime(1),'00:01');const input=[1,2,3,4,5];const out=shuffle(input);assert.deepEqual([...out].sort(),input);assert.notEqual(out,input);
});
test('CSV quotes commas, quotes, and formula prefixes',()=>{
 assert.equal(csv([['a,b','say "yes"','=1+1']]),'"a,b","say ""yes""","\'=1+1"');
});
