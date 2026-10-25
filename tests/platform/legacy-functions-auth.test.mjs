import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for(const path of ['../../functions/index.js','../../public/firebase-functions/index.js']){
  test(`${path} requires verified email and persisted admin revocation checks`,()=>{
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.match(source,/async function requireAdmin\(context\)/);
    assert.match(source,/email_verified !== true/);
    assert.match(source,/collection\("platform_accounts"\)\.doc\(context\.auth\.uid\)/);
    assert.match(source,/account\.active !== true/);
    assert.match(source,/account\.suspended === true/);
    assert.match(source,/roles\.includes\("admin"\)/);
    assert.match(source,/if \(context\.auth\.token\.admin !== true\)/);
    const accountCheck=source.indexOf('if (accountSnapshot.exists)');
    const legacyClaim=source.indexOf('if (context.auth.token.admin !== true)');
    assert.ok(accountCheck>=0&&legacyClaim>accountCheck,'persisted account must be authoritative before legacy admin claim');
    assert.match(source,/await requireAdmin\(context\)/);
  });
}
