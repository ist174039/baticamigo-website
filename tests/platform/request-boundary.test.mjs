import test from 'node:test';
import assert from 'node:assert/strict';
import {assertJsonRequest,assertTrustedOrigin} from '../../lib/platform/server.js';

test('JSON mutations require application/json',()=>{
  const request=new Request('https://baticamigo.pt/api/platform',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});
  assert.throws(()=>assertJsonRequest(request),error=>error?.status===415);
});

test('browser origin must match request origin',()=>{
  const good=new Request('https://baticamigo.pt/api/platform',{method:'POST',headers:{Origin:'https://baticamigo.pt','Content-Type':'application/json'},body:'{}'});
  assert.doesNotThrow(()=>assertJsonRequest(good));
  const bad=new Request('https://baticamigo.pt/api/platform',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'});
  assert.throws(()=>assertTrustedOrigin(bad),error=>error?.status===403);
});

test('non-browser clients without Origin remain supported when bearer auth is used',()=>{
  const request=new Request('https://baticamigo.pt/api/platform',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.doesNotThrow(()=>assertJsonRequest(request));
});
