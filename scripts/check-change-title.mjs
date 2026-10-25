const value=String(process.argv.slice(2).join(' ')||'').trim();
const conventional=/^[a-z][a-z0-9-]*(\([a-z0-9._/-]+\))?!?: .{3,}$/;
if(!conventional.test(value)) {
  console.error('Change title must follow Conventional Commits, e.g. feat(platform): complete requirements');
  process.exit(1);
}
console.log('Conventional change title OK:',value);
