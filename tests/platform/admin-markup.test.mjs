import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderAdminMarkup} from '../../app/admin/dashboard/markup.mjs';

test('admin panels are independent so hidden Contacto cannot hide members or partners',()=>{
  const markup=renderAdminMarkup(readFileSync(new URL('../../public/admin/dashboard.html',import.meta.url),'utf8'));
  const stack=[], panels=[];
  for(const match of markup.matchAll(/<div\b[^>]*>|<\/div\s*>/gi)) {
    if(match[0].startsWith('</')) {stack.pop();continue;}
    const id=match[0].match(/\bid="([^"]+)"/)?.[1];
    const classes=(match[0].match(/\bclass="([^"]+)"/)?.[1] || '').split(/\s+/);
    if(classes.includes('admin-section')) {
      assert.equal(stack.some(parent=>parent.classes.includes('admin-section')),false,`${id} must not be nested in a panel that navigation can hide`);
      panels.push(id);
    }
    stack.push({id,classes});
  }
  for(const id of ['membros-section','parceiros-section','contacto-section','utilizadores-section','perfil-section']) assert.ok(panels.includes(id));
  assert.equal(new Set(panels).size,panels.length,'Panel IDs must remain unique');
});
