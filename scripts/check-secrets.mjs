import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/"private_key"\s*:\s*"[^"\n]+/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/];
const flagged=files.filter(file=>{try{return patterns.some(pattern=>pattern.test(readFileSync(file,'utf8')));}catch{return false;}});
if(flagged.length){console.error('Possíveis credenciais privadas em ficheiros versionados. Reveja localmente; valores omitidos.');process.exit(1);}
console.log('Verificação de padrões de credenciais privadas concluída.');
