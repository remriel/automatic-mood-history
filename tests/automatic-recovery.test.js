const assert=require('node:assert/strict');
const Module=require('node:module');
const original=Module._load;
class TFile { constructor(path){this.path=path;this.extension='md';this.stat={ctime:Date.UTC(2030,0,1)};} }
Module._load=function(name,...args){if(name==='obsidian')return {Plugin:class{},PluginSettingTab:class{},Component:class{},TFile,TFolder:class{},Notice:class{},Setting:class{}};return original.call(this,name,...args);};
const Mood=require('../main.js');Module._load=original;
const dates=['2030-01-01','2030-01-02'];
const valid={moodScore:4,energyScore:3,connectionScore:4,intensityScore:2,valence:'positive',emotions:['grateful','calm'],summary:'A fictional writer enjoyed a quiet afternoon.',drivers:['A fictional restful afternoon.'],confidence:'medium',confidenceReason:'Limited fictional evidence.'};
function fixture(){
 const p=new Mood();p.settings={enableGroq:true,autoAnalyze:true,model:'fictional',minimumCharacters:40,outputFolder:'Mood History',maxCharactersPerDay:60000};
 p.runtime={};p.records={};p.groqBlockedUntil=0;p.getAllDates=()=>dates;p.apiKey=()=> 'fictional';
 p.gatherDate=async date=>({date,contentHash:date,sourcePaths:['Fictional/source.md'],analysisText:'Fictional writing describing a restful afternoon and a supportive friend.'});
 p.analyzeWithGroq=async()=>({...valid});p.writeEntryNote=p.savePluginData=p.ensureSupportFiles=async()=>{};p.refreshRenderers=()=>{};
 return p;
}
async function run(){
 let p=fixture();
 const response=a=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(a)}}]});
 assert.deepEqual(p.parseGroqAnalysis(response(valid)).emotions,['grateful','calm'],'bounded natural labels are retained, not replaced with invented lexicon values');
 for(const emotions of [[''],['<script>'],['a'.repeat(49)],[null],['a','b','c','d','e','f','g']]) assert.throws(()=>p.parseGroqAnalysis(response({...valid,emotions})));
 assert.deepEqual(p.parseGroqAnalysis(response({...valid,emotions:[' Grateful ','grateful']})).emotions,['grateful']);
 assert.throws(()=>p.parseGroqAnalysis(response({...valid,moodScore:0})));
 assert.throws(()=>p.parseGroqAnalysis(response({...valid,confidenceReason:''})));
 assert.throws(()=>p.parseGroqAnalysis({choices:[{message:{content:'{"secret-note":INVALID_PRIVATE_TEXT}'}}]}),e=>!e.message.includes('PRIVATE_TEXT'),'JSON syntax errors do not disclose response text');

 p=fixture();const prior={...valid,date:dates[0],contentHash:'old',analysisSource:'groq',status:'complete',dateBasis:'created-at-local-date'};p.records[dates[0]]=prior;
 p.analyzeWithGroq=async date=>{if(date===dates[0]){const e=new Error('Fictional invalid output');e.status=422;throw e;}return {...valid};};
 const result=await p.analyzeAll({silent:true});
 assert.equal(result.pending,1);assert.equal(result.groq,1);assert.equal(p.records[dates[0]],prior);assert.equal(p.records[dates[1]].analysisSource,'groq');
 assert.equal(p.groqBlockedUntil,0,'one invalid date cannot pause every other date');assert.equal(p.runtime.pendingDates[dates[0]].kind,'output');
 assert.equal(p.runtime.pendingDates[dates[1]],undefined);

 p=fixture();let reads=0;p.gatherDate=async date=>{reads++;if(date===dates[0]){const e=new Error('PRIVATE_FILE_PATH');e.code='source_read';throw e;}return {date,contentHash:date,sourcePaths:['Fictional/source.md'],analysisText:'A fictional source with enough text to infer a calm, supportive day.'};};
 const unavailable=await p.analyzeAll({silent:true});assert.equal(unavailable.groq,1);assert.equal(unavailable.pending,1);assert.equal(p.records[dates[0]],undefined);assert.equal(p.runtime.pendingDates[dates[0]].kind,'source');
 assert(!JSON.stringify(p.runtime).includes('PRIVATE_FILE_PATH'));
 const before=reads;await p.analyzeDate(dates[0],{background:true});assert.equal(reads,before,'backoff avoids repeating failed reads');
 const pending=JSON.parse(JSON.stringify(p.runtime));p=fixture();p.runtime=pending;p.runtime.pendingDates[dates[0]].retryAt=new Date(0).toISOString();p.lastAutomaticReconcileAt=Date.now();
 await p.runAutomaticRecovery();assert.equal(p.records[dates[0]].analysisSource,'groq');assert.equal(Object.keys(p.runtime.pendingDates).length,0,'persisted pending dates recover without another note edit');
 p.settings.autoAnalyze=false;p.analyzeAll=()=>{throw new Error('Automatic opt-out ignored');};await p.runAutomaticRecovery();
 p.settings.autoAnalyze=true;p.groqBlockedUntil=Date.now()+60000;await p.runAutomaticRecovery();
 p.groqBlockedUntil=0;p.unloaded=true;await p.runAutomaticRecovery();

 p=fixture();p.app={vault:{cachedRead:async file=>{if(file.path==='Fictional/cloud.md')throw new Error('Cloud provider unavailable');return 'Fictional available text';}},metadataCache:{getFileCache:()=>({})}};
 await assert.rejects(p.gatherFiles(dates[0],[new TFile('Fictional/local.md'),new TFile('Fictional/cloud.md')]),e=>e.code==='source_read','never score a partial set of files');

 p=fixture();p.records[dates[0]]=prior;let saves=0;p.savePluginData=async()=>{if(++saves===1)throw new Error('Disk unavailable');};
 await p.analyzeDate(dates[0]);assert.equal(p.records[dates[0]],prior,'failed storage does not leave an unsaved hash that suppresses retries');assert.equal(p.runtime.pendingDates[dates[0]].kind,'storage');
 p.savePluginData=async()=>{};await p.analyzeDate(dates[0]);assert.equal(p.records[dates[0]].contentHash,dates[0]);assert.equal(p.runtime.pendingDates[dates[0]],undefined);

 p=fixture();let attempts=0;p.analyzeWithGroq=async()=>{attempts++;const e=new Error('rate limit');e.status=429;e.retryAfterMilliseconds=120000;throw e;};
 await p.analyzeAll({silent:true});assert.equal(attempts,1);assert.equal(Object.keys(p.runtime.pendingDates).length,2);assert(Date.parse(p.runtime.pendingDates[dates[1]].retryAt)>=p.groqBlockedUntil);
 p=new Mood();p.manifest={version:'synthetic'};p.loadData=async()=>({});p.saveData=async()=>{throw new Error('Unavailable sync storage');};
 const commands=[];p.addCommand=c=>commands.push(c);p.addRibbonIcon=p.registerMarkdownCodeBlockProcessor=p.addSettingTab=()=>{};
 p.app={workspace:{onLayoutReady:()=>{}}};await p.onload();assert.equal(p.runtime.lastLoadStatus,'loaded-with-storage-error');assert(commands.some(c=>c.id==='analyze-changed-daily-notes'),'startup storage failure must not prevent command registration');
 console.log('Natural emotion labels, safe parsing, isolated failures, cloud reads, persistent retries, backoff, opt-out, unload, storage rollback, and rate-limit regressions passed');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
