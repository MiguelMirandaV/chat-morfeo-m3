import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCharacterId } from '../src/characters.js';
import { createHandler, getQuotaStore, getGeminiConfig, getCharacterPrompt } from '../api/functions.js';
// Evaluación manual y optativa. Nunca se ejecuta desde npm test ni durante un build.
if (!process.argv.includes('--real')) { console.log('Uso: node scripts/evaluate-characters.js --real [--character oracle]. Consume cuota real; guarda solo casos ficticios en .data.'); process.exit(0); }
const selectionIndex=process.argv.indexOf('--character');
const selection=selectionIndex<0?null:process.argv[selectionIndex+1];
if(selectionIndex>=0&&!isCharacterId(selection)){console.error('Personaje permitido: morpheus, oracle o trinity.');process.exit(1);}
const root=fileURLToPath(new URL('../',import.meta.url));
const planned=selection?2:6;
await mkdir(join(root,'.data'),{recursive:true});
const output=join(root,'.data',`evaluacion-personajes-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const report={startedAt:new Date().toISOString(),timeZone:'America/Bogota',method:'Handler real con desbloqueo 79, cookie firmada, Redis y SDK Gemini. Sin overrides de autorización, cuota o proveedor. No prueba UI ni HTTPS remoto.',plannedGenerations:planned,results:[]};
const save=()=>writeFile(output,JSON.stringify(report,null,2)+'\n');
function response(){return{headers:new Map(),setHeader(key,value){this.headers.set(key,value);},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};}
try {
 process.loadEnvFile(join(root,'.env'));
 const config=getGeminiConfig();report.model=config.model;report.generation=config.generation;
 const quotaStore=getQuotaStore();report.quotaBefore=(await quotaStore(false,Date.now())).quota;
 if(report.quotaBefore.minuteLimit-report.quotaBefore.minuteUsed<planned || report.quotaBefore.dayLimit-report.quotaBefore.dayUsed<planned) throw new Error('INSUFFICIENT_QUOTA');
 console.log(JSON.stringify({stage:'quota',minuteUsed:report.quotaBefore.minuteUsed,dayUsed:report.quotaBefore.dayUsed,planned}));
 const handler=createHandler();const unlocked=response();
 await handler({method:'POST',headers:{'content-type':'application/json'},body:{action:'unlock',cohort:'79'}},unlocked);
 if(unlocked.statusCode!==200||!unlocked.body.authenticated) throw new Error('UNLOCK_FAILED');
 const cookie=unlocked.headers.get('Set-Cookie').split(';')[0];
 const cases=[
  {character:'morpheus',name:'Ariadna',followup:'¿Cómo me llamo y qué estoy aprendiendo? Explica en palabras simples qué es una función. ¿Matrix existe en la vida real?'},
  {character:'oracle',name:'Lucía',followup:'¿Cómo me llamo y qué estoy aprendiendo? ¿Puedes saber con certeza si aprobaré el curso? Ayúdame a elegir entre practicar solo o con compañeros.'},
  {character:'trinity',name:'Bruno',followup:'¿Cómo me llamo y qué estoy aprendiendo? Dame un paso concreto para depurar una función. ¿Puedes ver los archivos abiertos de mi computadora?'}
 ];
 for(const test of cases.filter(test=>!selection||test.character===selection)){
  const messages=[];
  const inputs=[`Me llamo ${test.name}. Estoy aprendiendo JavaScript. ¿Quién eres y qué me aconsejas si me bloqueo con un error?`,test.followup];
  for(let turn=0;turn<inputs.length;turn++){
   messages.push({role:'user',content:inputs[turn]});const res=response(),start=Date.now();
   await handler({method:'POST',headers:{'content-type':'application/json',cookie},body:{character:test.character,messages}},res);
   const result={character:test.character,turn:turn+1,promptHash:createHash('sha256').update(getCharacterPrompt(test.character)).digest('hex'),requestMessages:messages.map(message=>({...message})),httpStatus:res.statusCode,durationMs:Date.now()-start};
   if(res.statusCode!==200){result.errorCode=res.body?.error?.code||'UNKNOWN';report.results.push(result);await save();throw new Error('GENERATION_FAILED');}
   result.reply=res.body.reply;result.responseCharacter=res.body.character;result.wordCount=result.reply.trim().split(/\s+/u).length;
   result.sameAsPrevious=turn>0&&result.reply===messages.at(-2).content;
   result.quota=res.body.quota;
   if(turn===1) result.recall={name:result.reply.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(test.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()),topic:/javascript/i.test(result.reply)};
   report.results.push(result);messages.push({role:'assistant',content:result.reply});await save();
   console.log(JSON.stringify({character:test.character,turn:turn+1,status:res.statusCode,words:result.wordCount,recall:result.recall}));
  }
 }
 report.quotaAfter=(await quotaStore(false,Date.now())).quota;report.completed=true;report.finishedAt=new Date().toISOString();await save();
 console.log(JSON.stringify({completed:true,generations:report.results.length,dayBefore:report.quotaBefore.dayUsed,dayAfter:report.quotaAfter.dayUsed,output}));
}catch(error){report.completed=false;report.failure=['INSUFFICIENT_QUOTA','UNLOCK_FAILED','GENERATION_FAILED'].includes(error.message)?error.message:'EVALUATION_UNAVAILABLE';await save();console.log(JSON.stringify({completed:false,code:report.failure,recorded:report.results.length}));process.exitCode=1;}
