import test from 'node:test';
import assert from 'node:assert/strict';
import {bootstrapAdminEmails,isBootstrapAdmin} from '../../lib/platform/access.mjs';

test('the association bootstrap administrator email is normalized and requires verification',()=>{
  assert.equal(bootstrapAdminEmails().has('carlos.gomes@baticamigo.com'),true);
  assert.equal(isBootstrapAdmin('Carlos.Gomes@BaticAmigo.com',true),true);
  assert.equal(isBootstrapAdmin('carlos.gomes@baticamigo.com',false),false);
});
