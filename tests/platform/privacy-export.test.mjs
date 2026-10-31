import test from 'node:test';
import assert from 'node:assert/strict';
import {subjectExport} from '../../lib/platform/privacy-export.mjs';

test('subject export never mixes another pupil or unrelated family',()=>{
  const value=subjectExport({
    subjectProfile:{id:'s1',kind:'student',name:'Aluno A',guardianIds:['g1']},
    linkedProfiles:[
      {id:'g1',kind:'guardian',name:'Enc A'},
      {id:'g2',kind:'guardian',name:'Enc B'},
      {id:'s2',kind:'student',name:'Aluno B',guardianIds:['g2']},
    ],
    sessions:[
      {id:'x',title:'Partilhada',studentIds:['s1','s2']},
      {id:'y',title:'Outra',studentIds:['s2']},
    ],
    attendance:[{id:'a1',sessionId:'x',studentId:'s1'},{id:'a2',sessionId:'x',studentId:'s2'}],
    records:[{id:'r1',studentId:'s1',kind:'assessment'},{id:'r2',studentId:'s2',kind:'assessment'}],
  });
  assert.deepEqual(value.linkedProfiles.map(p=>p.id),['g1']);
  assert.deepEqual(value.sessions.map(s=>s.id),['x']);
  assert.deepEqual(value.sessions[0].studentIds,['s1']);
  assert.deepEqual(value.attendance.map(a=>a.studentId),['s1']);
  assert.deepEqual(value.records.map(r=>r.studentId),['s1']);
  assert.equal(JSON.stringify(value).includes('Aluno B'),false);
});
