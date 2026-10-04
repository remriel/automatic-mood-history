const fs = require("fs");
const path = require("path");

// Actual release code/CSS plus a small Obsidian DOM adapter. Fictional data only.
function fixtureHTML() {
  const root = path.resolve(__dirname, "..");
  const bundle = fs.readFileSync(path.join(root, "main.js"), "utf8").replace(/<\/script/gi, "<\\/script");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Automatic Mood History - synthetic layout fixture</title>
  <style>
    :root { font-size:16px; --font-interface:system-ui,sans-serif; --font-monospace:ui-monospace,monospace; --text-normal:#e8e5eb; --text-muted:#b8b3bf; --text-faint:#6f6777; --background-primary:#211d26; --background-secondary:#2a2431; --interactive-accent:#a477e5; --link-color:#d6acff; }
    body { margin:0; background:var(--background-primary); color:var(--text-normal); font-family:var(--font-interface); }
    body.theme-light { --text-normal:#171717; --background-primary:#fffdf4; --background-secondary:#fff; --link-color:#6831ad; }
    #pane { width:100%; max-width:100%; box-sizing:border-box; padding:8px; margin-inline:auto; }
    button,input { font:inherit; } button { cursor:pointer; } button:disabled { cursor:not-allowed; } strong { color:var(--text-normal); } a { color:var(--link-color); }
    .setting-item { display:flex; align-items:center; gap:20px; padding:18px 0; border-bottom:1px solid #675b71; }
    .setting-item-info { flex:1; } .setting-item-name { font-weight:800; } .setting-item-description { font-size:.85rem; line-height:1.6; margin-top:5px; }
    .setting-item-control { display:flex; gap:8px; } .setting-item-control input { width:230px; padding:8px; box-sizing:border-box; } .setting-item-control button { padding:8px 12px; }
    ${css}
  </style></head><body class="theme-dark"><main id="pane"><div id="dashboard"></div><div id="settings" hidden></div></main>
  <script>(() => {
    HTMLElement.prototype.empty=function(){this.replaceChildren();};
    HTMLElement.prototype.setText=function(text){this.textContent=text;};
    HTMLElement.prototype.createEl=function(tag,options={}){const el=document.createElement(tag);if(options.cls)el.className=options.cls;if(options.text!==undefined)el.textContent=options.text;for(const[k,v]of Object.entries(options.attr||{}))el.setAttribute(k,v);this.appendChild(el);return el;};
    HTMLElement.prototype.createDiv=function(options){return this.createEl('div',options);};
    class FixtureSetting {
      constructor(container){this.item=container.createDiv({cls:'setting-item'});this.info=this.item.createDiv({cls:'setting-item-info'});this.control=this.item.createDiv({cls:'setting-item-control'});}
      setName(text){this.name=text;this.info.createDiv({cls:'setting-item-name',text});return this;}
      setDesc(text){this.info.createDiv({cls:'setting-item-description',text});return this;}
      addToggle(callback){const el=this.control.createEl('button',{text:'Off',attr:{role:'switch','aria-label':this.name}});const api={setValue(v){el.textContent=v?'On':'Off';el.setAttribute('aria-checked',String(v));return api;},onChange(fn){el.addEventListener('click',()=>{const v=el.getAttribute('aria-checked')!=='true';api.setValue(v);void fn(v);});return api;}};callback(api);return this;}
      addText(callback){const el=this.control.createEl('input',{attr:{type:'text','aria-label':this.name}});const api={setValue(v){el.value=v;return api;},onChange(fn){el.addEventListener('input',()=>void fn(el.value));return api;}};callback(api);return this;}
      addButton(callback){const el=this.control.createEl('button');const api={setButtonText(t){el.textContent=t;return api;},setCta(){return api;},onClick(fn){el.addEventListener('click',fn);return api;}};callback(api);return this;}
    }
    const module={exports:{}};
    const require=(name)=>{if(name==='obsidian')return {Component:class{},Notice:class{},Plugin:class{},PluginSettingTab:class{},Setting:FixtureSetting,TFile:class{},TFolder:class{},requestUrl:async()=>{throw new Error('Network disabled in layout fixture');}};throw new Error(name);};
    ${bundle}
    const plugin=new module.exports();const dashboard=document.getElementById('dashboard');
    plugin.settings={outputFolder:'Mood History',enableGroq:true,model:'synthetic-model',autoAnalyze:false,analyzeOnStartup:false};plugin.runtime={};plugin.renderContainers=new Set([dashboard]);plugin.chartObservers=new Map();plugin.debounceTimers=new Map();
    const calls={analyze:0,retry:0,check:0,save:0};plugin.savePluginData=async()=>{calls.save+=1;};plugin.clearGroqPause=()=>{};
    let statusText='SYNTHETIC PREVIEW · Local-only fixture. These examples are not personal mood records.';
    plugin.groqStatus=()=>({kind:plugin.settings.enableGroq?'ready':'local',text:plugin.activeScan?'Analyzing fictional fixture records':plugin.checkingGroq?'Checking with fictional fixture text':statusText});
    const action=async(name)=>{calls[name]+=1;if(name==='check')plugin.checkingGroq=true;else plugin.activeScan=true;plugin.refreshRenderers();await new Promise(r=>setTimeout(r,120));plugin.checkingGroq=false;plugin.activeScan=false;plugin.refreshRenderers();};
    plugin.analyzeAll=()=>action('analyze');plugin.retryAllWithGroq=()=>action('retry');plugin.checkGroqConnection=()=>action('check');
    const tab=new AutomaticMoodHistorySettingTab({},plugin);tab.containerEl=document.getElementById('settings');
    function configure(options={}) {
      document.documentElement.style.fontSize=options.largeText?'32px':'16px';document.body.className=options.theme==='light'?'theme-light':'theme-dark';document.getElementById('pane').style.width=options.paneWidth?options.paneWidth+'px':'100%';
      statusText=options.longText?'PROVIDER STATUS · '+('LongUnbrokenModelName'.repeat(18)):'SYNTHETIC PREVIEW · Local-only fixture. These examples are not personal mood records.';
      const count=options.mode==='empty'?0:options.count??32;plugin.records={};
      for(let i=0;i<count;i++) {
        const date=new Date(Date.UTC(2099,0,i+1)).toISOString().slice(0,10);const insufficient=options.mode==='insufficient'||i%11===10;const legacy=i%7===6;
        plugin.records[date]={date,dateBasis:legacy?'legacy-note-date':'created-at-local-date',status:insufficient?'insufficient':'complete',moodScore:insufficient?null:1+i%5,energyScore:1+(i+2)%5,connectionScore:1+(i+3)%5,intensityScore:1+(i+1)%5,emotions:['curious','hopeful',...(options.longText?['VeryLongUnbrokenEmotionName'.repeat(10)]:[])],summary:insufficient?'There was not enough readable text to infer a score.':'A fictional day with thoughtful reflection, small achievements, and supportive conversations.'+(options.longText?' '+('WrappedEvidence'.repeat(45)):''),analysisSource:insufficient?'none':i%3===0?'groq':'local-fallback',entryPath:'Mood History/Entries/'+date+' (Automatic Mood History).md',providerIssue:i%3?{message:'Fictional provider issue'}:undefined};
      }
      dashboard.hidden=Boolean(options.settingsView);tab.containerEl.hidden=!options.settingsView;plugin.renderDashboard(dashboard);if(options.settingsView)tab.display();
    }
    document.addEventListener('click',event=>{const link=event.target.closest('a.internal-link');if(link){event.preventDefault();window.lastOpenedEntry=link.getAttribute('data-href');}});
    window.fixture={plugin,calls,configure,tab};configure();
  })();</script></body></html>`;
}
module.exports = { fixtureHTML };
