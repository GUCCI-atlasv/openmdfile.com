/* openmdfile · mermaid-tool.js  © 2026 CCC Studio
   UI for the /mermaid-* tool pages. One component, five modes chosen by
   data-mode on #mmdTool: viewer · fix · svg · png · extract. */
(function(){
'use strict';
var root=document.getElementById('mmdTool');
if(!root) return;
var MODE=root.getAttribute('data-mode')||'viewer';
var K=null;
function $(s,el){return (el||root).querySelector(s)}
function $$(s,el){return Array.prototype.slice.call((el||root).querySelectorAll(s))}
function store(k,v){
  try{if(v===undefined) return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}
  return null;
}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var toastTimer;
function toast(msg){
  var el=document.getElementById('toast');
  if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el)}
  el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('show')},2600);
}

var EXAMPLES={
  'Flowchart':'flowchart TD\n    A[Paste Mermaid code] --> B{Renders?}\n    B -->|Yes| C[Export SVG or PNG]\n    B -->|No| D[Fix syntax]\n    D --> B\n    C --> E[Drop into docs, slides or tickets]',
  'Sequence':'sequenceDiagram\n    autonumber\n    participant U as User\n    participant A as App\n    participant S as Auth server\n    U->>A: Click "Sign in"\n    A->>S: Redirect with client_id\n    S-->>U: Login page\n    U->>S: Credentials\n    S-->>A: Authorization code\n    A->>S: Exchange code for token\n    S-->>A: Access token\n    A-->>U: Signed in',
  'Class':'classDiagram\n    class Order {\n        +String id\n        +Date created\n        +total() Money\n    }\n    class LineItem {\n        +int qty\n        +Money price\n    }\n    class Customer {\n        +String email\n    }\n    Customer "1" --> "*" Order : places\n    Order "1" *-- "1..*" LineItem : contains',
  'ER':'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE_ITEM : contains\n    PRODUCT ||--o{ LINE_ITEM : "ordered in"\n    CUSTOMER {\n        int id PK\n        string email\n    }\n    ORDER {\n        int id PK\n        int customer_id FK\n        date created_at\n    }',
  'State':'stateDiagram-v2\n    [*] --> Draft\n    Draft --> Review : submit\n    Review --> Draft : request changes\n    Review --> Published : approve\n    Published --> Archived : archive\n    Archived --> [*]',
  'Gantt':'gantt\n    title Launch plan\n    dateFormat YYYY-MM-DD\n    section Build\n        Design      :done,    d1, 2026-10-01, 5d\n        Implement   :active,  d2, after d1, 10d\n    section Ship\n        QA          :         d3, after d2, 4d\n        Release     :milestone, after d3, 0d',
  'Pie':'pie title Where the time goes\n    "Writing code" : 42\n    "Reviews" : 18\n    "Meetings" : 25\n    "Docs" : 15',
  'Mindmap':'mindmap\n  root((Mermaid))\n    View\n      Paste\n      Upload .mmd\n    Fix\n      Quotes\n      Arrows\n    Export\n      SVG\n      PNG'
};
var BROKEN={
  'ChatGPT-style answer':'Here is a flowchart of the signup process:\n\n```mermaid\ngraph TD\n    A[Visit site (landing)] -> B{Has account?}\n    B -->|Yes| C[Login]\n    B -->|No| D[Sign up]\n    D --> end\n```\n\nThis diagram shows the two paths a visitor can take.',
  'Full-width punctuation':'flowchart TD\n    A[开始（初始化）] → B{检查配置}\n    B -->|通过| C[运行]\n    B -->|失败| D[报错]',
  'Broken edge labels':'flowchart LR\n    A[Request] -->|valid|> B[Handler]\n    A -->|invalid|> C[400 (Bad Request)]',
  'Subgraph with spaces':'flowchart TB\n    subgraph Client Side (React)\n        UI[Components] --> Store[State]\n    end\n    Store --> API[REST API]',
  'Sequence diagram':'sequenceDiagram\n    Client->>Server GET /health\n    Server-->>Client: ok; uptime 99.9%'
};
var SAMPLE_MD='# Payment service — design notes\n\nGenerated with an AI assistant. Every Mermaid block below is picked up automatically.\n\n## Request flow\n\n```mermaid\nflowchart LR\n    C[Client] --> G[API gateway]\n    G --> P[Payment service]\n    P --> DB[(Ledger DB)]\n    P --> Q[[Event queue]]\n```\n\n## Checkout sequence\n\n```mermaid\nsequenceDiagram\n    participant C as Client\n    participant P as Payment service\n    participant B as Bank\n    C->>P: Create payment\n    P->>B: Authorise card\n    B-->>P: Approved\n    P-->>C: 201 Created\n```\n\n## Payment states\n\n```mermaid\nstateDiagram-v2\n    [*] --> Pending\n    Pending --> Authorised : bank approves\n    Pending --> Failed : bank declines\n    Authorised --> Settled\n    Settled --> [*]\n```\n\n## Data model\n\n```mermaid\nerDiagram\n    ACCOUNT ||--o{ PAYMENT : makes\n    PAYMENT ||--|{ LEDGER_ENTRY : creates\n```\n';

var DEFAULT_CODE=MODE==='fix'?BROKEN['ChatGPT-style answer']:EXAMPLES.Flowchart;
var KEY=MODE==='fix'?'omf-mmd-fix':MODE==='extract'?'omf-mmd-md':'omf-mmd-code';
var state={theme:store('omf-mmd-theme')||'default',transparent:false,fmt:MODE==='svg'?'svg':'png',scale:MODE==='png'?2:2,
  svgEl:null,lastOk:null,blocks:null,fixResult:null,undo:null,trackedSig:''};

function background(){
  if(state.transparent) return null;
  return state.theme==='dark'?'#1e1e1e':'#ffffff';
}
function themeSelect(){
  return '<label>Theme <select data-r="theme">'+['default','neutral','dark','forest'].map(function(t){
    return '<option value="'+t+'"'+(t===state.theme?' selected':'')+'>'+t+'</option>'}).join('')+'</select></label>';
}
function fmtSeg(){
  return '<div class="mt-seg" data-r="fmt"><button data-v="png">PNG</button><button data-v="svg">SVG</button></div>'
    +'<div class="mt-seg" data-r="scale"><button data-v="1">1x</button><button data-v="2">2x</button><button data-v="3">3x</button></div>';
}
var LOCK='<svg class="i"><use href="#ic-lock"/></svg>';

/* ======================= single-diagram modes ======================= */
function buildSingle(){
  var exOpts=(MODE==='fix'?BROKEN:EXAMPLES);
  root.className='mt';
  root.innerHTML=''
  +'<div class="mt-bar">'
  +'<button class="btn" data-a="upload"><svg class="i"><use href="#ic-file"/></svg> Upload file</button>'
  +'<select data-r="example" aria-label="Load an example"><option value="">'+(MODE==='fix'?'Broken examples…':'Examples…')+'</option>'
  +Object.keys(exOpts).map(function(k){return '<option>'+esc(k)+'</option>'}).join('')+'</select>'
  +'<select data-r="pick" aria-label="Choose a diagram" hidden></select>'
  +'<span class="sp"></span>'+themeSelect()
  +'<label><input type="checkbox" data-r="transparent"> Transparent</label>'
  +'</div>'
  +'<div class="mt-main">'
  +'<section class="mt-pane">'
  +'<div class="mt-hd"><span>Mermaid code</span><span class="mt-status" data-r="status"></span></div>'
  +'<div class="mt-editor"><div class="mt-gutter" data-r="gutter"></div><div class="mt-hl" data-r="hl"></div>'
  +'<textarea data-r="code" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="Mermaid code"></textarea></div>'
  +'<div class="mt-fix'+(MODE==='fix'?' show':'')+'" data-r="fix"></div>'
  +'</section>'
  +'<section class="mt-pane">'
  +'<div class="mt-export">'+fmtSeg()
  +'<button class="btn primary big" data-a="download">Download PNG</button>'
  +'<span class="sp"></span>'
  +'<button class="btn" data-a="copysvg">Copy SVG code</button>'
  +'<button class="btn" data-a="copypng">Copy PNG</button>'
  +'<button class="btn" data-a="share" title="Copy a link that contains this diagram">Share link</button>'
  +'</div>'
  +'<div class="mt-hd"><span>Preview</span><div class="mt-zoom"><button data-a="zout" title="Zoom out">−</button><span data-r="zoom">100%</span>'
  +'<button data-a="zin" title="Zoom in">+</button><button data-a="fit" title="Fit to window">Fit</button></div></div>'
  +'<div class="mt-stage" data-r="stage"><div class="mt-canvas" data-r="canvas"></div><div class="mt-empty" data-r="empty">Loading the renderer…</div></div>'
  +'</section>'
  +'</div>'
  +'<input type="file" data-r="file" accept=".mmd,.mermaid,.md,.markdown,.txt" hidden>';
  root.insertAdjacentHTML('afterend','<p class="mt-privacy">'+LOCK+' Rendered, fixed and exported in your browser — your code is never uploaded.</p>');
}

var ta,gutter,hl,stage,canvas,statusEl,fixEl,zoomEl;
var view={s:1,x:0,y:0},userZoomed=false,errLine=null,lineCount=0;
function updateGutter(force){
  var n=ta.value.split('\n').length;
  if(n===lineCount&&!force) return;
  lineCount=n;
  var html='';
  for(var i=1;i<=n;i++) html+='<div'+(i===errLine?' class="err"':'')+'>'+i+'</div>';
  gutter.innerHTML=html+'<div></div><div></div>';
  syncScroll();
}
function syncScroll(){
  gutter.scrollTop=ta.scrollTop;
  if(errLine){hl.style.display='block';hl.style.top=(14+(errLine-1)*20-ta.scrollTop)+'px'}
  else hl.style.display='none';
}
function setErrLine(n){errLine=n||null;updateGutter(true)}

function svgBox(svg){
  var vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);
  if(vb.length===4&&vb[2]>0) return {w:vb[2],h:vb[3]};
  var r=svg.getBoundingClientRect();return {w:r.width/view.s||400,h:r.height/view.s||300};
}
function applyView(){
  canvas.style.transform='translate('+view.x+'px,'+view.y+'px) scale('+view.s+')';
  zoomEl.textContent=Math.round(view.s*100)+'%';
}
function fit(){
  if(!state.svgEl) return;
  var b=svgBox(state.svgEl),W=stage.clientWidth,H=stage.clientHeight;
  var s=Math.min((W-40)/b.w,(H-40)/b.h);
  s=Math.max(.05,Math.min(s,1.6));
  view={s:s,x:(W-b.w*s)/2,y:(H-b.h*s)/2};
  userZoomed=false;applyView();
}
function zoomAt(f,cx,cy){
  if(cx==null){cx=stage.clientWidth/2;cy=stage.clientHeight/2}
  var ns=Math.max(.05,Math.min(view.s*f,8));
  view.x=cx-(cx-view.x)*(ns/view.s);view.y=cy-(cy-view.y)*(ns/view.s);view.s=ns;
  userZoomed=true;applyView();
}
function bindStage(){
  var drag=null;
  stage.addEventListener('pointerdown',function(e){
    if(e.button!==0) return;
    drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};
    stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove',function(e){
    if(!drag) return;
    view.x=drag.vx+(e.clientX-drag.x);view.y=drag.vy+(e.clientY-drag.y);userZoomed=true;applyView();
  });
  var end=function(){drag=null;stage.classList.remove('dragging')};
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  stage.addEventListener('wheel',function(e){
    if(!(e.ctrlKey||e.metaKey)) return;
    e.preventDefault();
    var r=stage.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY*0.0025),e.clientX-r.left,e.clientY-r.top);
  },{passive:false});
  stage.addEventListener('dblclick',fit);
  var rt;
  window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(!userZoomed)fit()},120)});
}

function setStageTheme(){
  stage.classList.toggle('dark',state.theme==='dark'&&!state.transparent);
  stage.classList.toggle('transparent',state.transparent);
}
function setSeg(name,val){
  $$('[data-r="'+name+'"] button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-v')===String(val))});
}
function refreshExportUi(){
  setSeg('fmt',state.fmt);setSeg('scale',state.scale);
  $('[data-r="scale"]').style.display=state.fmt==='png'?'':'none';
  $('[data-a="download"]').textContent='Download '+(state.fmt==='png'?'PNG':'SVG');
}

var renderTimer=null,renderSeq=0;
function schedule(){clearTimeout(renderTimer);renderTimer=setTimeout(doRender,300)}
function doRender(){
  if(!K) return Promise.resolve();
  var code=ta.value,seq=++renderSeq;
  store(KEY,code);
  if(!code.trim()){
    canvas.innerHTML='';state.svgEl=null;state.lastOk=null;
    $('[data-r="empty"]').textContent='Paste Mermaid code on the left to see the diagram.';
    $('[data-r="empty"]').style.display='flex';
    statusEl.textContent='';statusEl.className='mt-status';setErrLine(null);renderFix();
    return Promise.resolve();
  }
  return K.render(code,{theme:state.theme}).then(function(r){
    if(seq!==renderSeq) return;
    var sig=(r.ok?'ok':'err')+':'+(r.type||'unknown');
    if(sig!==state.trackedSig){state.trackedSig=sig;K.track('mermaid_render',{ok:r.ok,type:r.type||'unknown',source:'tool',page:MODE})}
    if(r.ok){
      canvas.innerHTML=r.svg;
      var svg=canvas.querySelector('svg');
      var b=svgBox(svg);
      svg.setAttribute('width',b.w);svg.setAttribute('height',b.h);svg.style.maxWidth='none';
      state.svgEl=svg;state.lastOk=true;state.error=null;
      $('[data-r="empty"]').style.display='none';
      if(!userZoomed) fit(); else applyView();
      statusEl.textContent='✓ Renders · '+(r.type||'diagram');statusEl.className='mt-status ok';
      setErrLine(null);
    }else{
      state.lastOk=false;state.error=r.error;
      statusEl.textContent='✕ Syntax error'+(r.error.line?' on line '+r.error.line:'');statusEl.className='mt-status bad';
      setErrLine(r.error.line);
      if(!state.svgEl){$('[data-r="empty"]').textContent='Fix the error on the left to see the diagram.';$('[data-r="empty"]').style.display='flex'}
      canvas.style.opacity=state.svgEl?'.35':'1';
    }
    if(r.ok) canvas.style.opacity='1';
    if(!r.ok&&MODE==='fix'&&!state.fixResult) return runFix(true);
    renderFix();
  });
}

function errorBox(e,withButton){
  return '<div class="mmd-error"><p class="mmd-err-title">'+esc(e.title)+'</p><p class="mmd-err-hint">'+esc(e.hint)+'</p>'
    +(e.snippet?'<pre class="mmd-snip">'+esc(e.snippet)+'</pre>':'')
    +(withButton?'<div class="mmd-err-actions"><button class="btn primary" data-a="fix">Try to fix</button></div>':'')+'</div>';
}
function renderFix(){
  var r=state.fixResult,html='';
  if(r&&r.ok&&!r.alreadyValid&&ta.value===r.original){
    html='<div class="mt-fix-top"><h4>Suggested fix · '+r.applied.length+' change'+(r.applied.length>1?'s':'')+'</h4>'
      +'<div class="mt-fix-actions"><button class="btn primary" data-a="apply">Apply fix</button><button class="btn" data-a="dismiss">Dismiss</button></div></div>'
      +'<ul class="mmd-rules">'+r.applied.map(function(x){return '<li><strong>'+esc(x.name)+'</strong> — '+esc(x.desc)+'</li>'}).join('')+'</ul>'
      +K.diffHtml(r.original,r.code);
  }else if(r&&!r.ok&&ta.value===r.original){
    var e=r.originalError||state.error||{};
    html=errorBox(e,false)
      +'<p class="mmd-muted" style="margin-top:10px">The automatic rules could not repair this one. Line '+(e.line||'?')+' is highlighted in the editor — '
      +'compare it with the <a href="/fix-mermaid-syntax/#errors">common errors table</a>.</p>';
  }else if(state.undo&&ta.value===state.undo.fixed){
    html='<p class="mt-ok">✓ Fixed — '+state.undo.count+' change'+(state.undo.count>1?'s':'')+' applied. The diagram renders now.</p>'
      +'<div class="mt-fix-actions"><button class="btn" data-a="undo">Undo fix</button></div>';
  }else if(state.lastOk===false&&state.error){
    html=errorBox(state.error,true);
  }else if(MODE==='fix'){
    html=state.lastOk?'<p class="mt-ok">✓ No syntax errors — this diagram renders.</p>'
      :'<p class="mmd-muted">Paste broken Mermaid code above. Errors are explained here and can be fixed in one click.</p>';
  }
  fixEl.innerHTML=html;
  fixEl.classList.toggle('show',!!html);
}
function runFix(auto){
  var code=ta.value;
  if(!auto){fixEl.innerHTML='<p class="mmd-muted">Trying fixes…</p>';fixEl.classList.add('show')}
  return K.fix(code,{source:'tool'}).then(function(res){
    if(ta.value!==code) return;
    state.fixResult=res;
    if(res.alreadyValid){state.fixResult=null;toast('This diagram already renders — nothing to fix')}
    if(!res.ok&&res.originalError) setErrLine(res.originalError.line);
    renderFix();
  });
}
function applyFix(){
  var r=state.fixResult;if(!r||!r.ok) return;
  state.undo={original:r.original,fixed:r.code,count:r.applied.length};
  state.fixResult=null;
  ta.value=r.code;
  K.track('mermaid_fix_accept',{source:'tool',rules:r.applied.map(function(x){return x.id}).join(',')});
  updateGutter(true);doRender();
}

function setCode(code){
  ta.value=code;state.fixResult=null;state.undo=null;userZoomed=false;
  updateGutter(true);ta.scrollTop=0;
  return doRender();
}
function setBlocks(blocks){
  state.blocks=blocks;
  var sel=$('[data-r="pick"]');
  if(!blocks||blocks.length<2){sel.hidden=true;return}
  sel.innerHTML=blocks.map(function(b,i){
    return '<option value="'+i+'">Diagram '+(i+1)+' of '+blocks.length+(b.title?' — '+esc(b.title.slice(0,40)):'')+'</option>';
  }).join('');
  sel.hidden=false;
  K.track('mermaid_extract',{count:blocks.length,source:'tool',page:MODE});
  toast('Found '+blocks.length+' Mermaid diagrams — pick one from the list');
}
function takeInput(text){
  var p=K.parseInput(text);
  if(p.blocks){setBlocks(p.blocks);setCode(p.blocks[0].code);return}
  setBlocks(null);
  if(p.unwrapped) toast('Removed the ```mermaid wrapper');
  setCode(p.code);
}
function readFile(f){
  if(!f) return;
  if(f.size>5*1024*1024){toast('That file is over 5 MB');return}
  var r=new FileReader();
  r.onload=function(){takeInput(String(r.result))};
  r.readAsText(f);
}
function bindDrop(onFile){
  ['dragenter','dragover'].forEach(function(ev){root.addEventListener(ev,function(e){e.preventDefault();root.classList.add('dragover')})});
  ['dragleave','drop'].forEach(function(ev){root.addEventListener(ev,function(e){e.preventDefault();if(ev==='drop'||e.target===root)root.classList.remove('dragover')})});
  root.addEventListener('drop',function(e){var f=e.dataTransfer&&e.dataTransfer.files[0];if(f)onFile(f)});
}

function exportName(ext){
  var t=(K.detectType(ta.value)||'diagram');
  return 'mermaid-'+t+'.'+ext;
}
function needSvg(){
  if(state.svgEl&&state.lastOk) return true;
  toast(state.lastOk===false?'Fix the syntax error first — the diagram does not render yet':'Nothing to export yet');
  return false;
}
function doDownload(){
  if(!needSvg()) return;
  if(state.fmt==='svg'){
    K.download(K.svgString(state.svgEl,{background:background()}),exportName('svg'),'image/svg+xml');
    K.track('mermaid_export',{format:'svg',scale:1,mode:'single',page:MODE});
  }else{
    K.pngBlob(state.svgEl,{scale:state.scale,background:background()}).then(function(b){
      K.download(b,exportName('png'));
      K.track('mermaid_export',{format:'png',scale:state.scale,mode:'single',page:MODE});
    },function(e){toast('PNG export failed: '+e.message)});
  }
}
function share(){
  var code=ta.value;if(!code.trim()) return;
  K.encodeShare(code).then(function(tok){
    var url=location.origin+location.pathname+'#code='+tok;
    history.replaceState(null,'',url);
    if(url.length>8000) toast('Link is long ('+url.length+' characters) — some apps may cut it');
    K.copyText(url).then(function(){toast('Share link copied — the diagram lives in the link, not on a server')},function(){toast('Link is in the address bar — copy it from there')});
  });
}

function initSingle(){
  buildSingle();
  ta=$('[data-r="code"]');gutter=$('[data-r="gutter"]');hl=$('[data-r="hl"]');stage=$('[data-r="stage"]');
  canvas=$('[data-r="canvas"]');statusEl=$('[data-r="status"]');fixEl=$('[data-r="fix"]');zoomEl=$('[data-r="zoom"]');
  refreshExportUi();setStageTheme();bindStage();
  ta.addEventListener('input',function(){updateGutter();state.fixResult=null;schedule()});
  ta.addEventListener('scroll',syncScroll,{passive:true});
  ta.addEventListener('keydown',function(e){
    if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();ta.setRangeText('    ',ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'))}
  });
  ta.addEventListener('paste',function(e){
    var text=(e.clipboardData||window.clipboardData).getData('text');
    if(!text) return;
    var p=K&&K.parseInput(text);
    if(!p||(!p.blocks&&!p.unwrapped)) return;
    e.preventDefault();
    var whole=ta.selectionStart===0&&ta.selectionEnd===ta.value.length||!ta.value.trim();
    if(p.blocks){takeInput(text);return}
    toast('Removed the ```mermaid wrapper');
    if(whole){setCode(p.code);return}
    ta.setRangeText(p.code,ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'));
  });
  root.addEventListener('click',function(e){
    var b=e.target.closest('[data-a],[data-v]');if(!b) return;
    var a=b.getAttribute('data-a'),seg=b.parentNode&&b.parentNode.getAttribute('data-r');
    if(seg==='fmt'){state.fmt=b.getAttribute('data-v');refreshExportUi();return}
    if(seg==='scale'){state.scale=+b.getAttribute('data-v');refreshExportUi();return}
    if(a==='upload') $('[data-r="file"]').click();
    else if(a==='download') doDownload();
    else if(a==='copysvg'){if(needSvg()) K.copyText(K.svgString(state.svgEl,{background:background()})).then(function(){toast('SVG code copied');K.track('mermaid_export',{format:'svg-code',scale:1,mode:'single',page:MODE})},function(){toast('Clipboard blocked by the browser')})}
    else if(a==='copypng'){if(needSvg()) K.copyPng(state.svgEl,{scale:state.scale,background:background()}).then(function(){toast('PNG copied — paste it into your doc or chat');K.track('mermaid_export',{format:'png-clipboard',scale:state.scale,mode:'single',page:MODE})},function(err){toast(err&&err.message||'Clipboard blocked by the browser')})}
    else if(a==='share') share();
    else if(a==='zin') zoomAt(1.25);
    else if(a==='zout') zoomAt(.8);
    else if(a==='fit') fit();
    else if(a==='fix') runFix(false);
    else if(a==='apply') applyFix();
    else if(a==='dismiss'){state.fixResult=null;renderFix()}
    else if(a==='undo'&&state.undo){var o=state.undo.original;state.undo=null;setCode(o)}
  });
  $('[data-r="file"]').addEventListener('change',function(e){readFile(e.target.files[0]);e.target.value=''});
  $('[data-r="example"]').addEventListener('change',function(e){
    var k=e.target.value;if(!k) return;
    setBlocks(null);setCode((MODE==='fix'?BROKEN:EXAMPLES)[k]);e.target.value='';
  });
  $('[data-r="pick"]').addEventListener('change',function(e){var b=state.blocks&&state.blocks[+e.target.value];if(b)setCode(b.code)});
  $('[data-r="theme"]').addEventListener('change',function(e){state.theme=e.target.value;store('omf-mmd-theme',state.theme);setStageTheme();doRender()});
  $('[data-r="transparent"]').addEventListener('change',function(e){state.transparent=e.target.checked;setStageTheme()});
  bindDrop(readFile);

  var hash=/^#code=(.+)$/.exec(location.hash);
  var initial=store(KEY)||DEFAULT_CODE;
  ta.value=initial;updateGutter(true);
  boot().then(function(){
    if(hash) return K.decodeShare(hash[1]).then(function(c){return setCode(c)},function(){toast('That share link is damaged');return doRender()});
    return doRender();
  });
}

/* ======================= extract mode ======================= */
function initExtract(){
  root.className='mt';
  root.innerHTML=''
  +'<div class="mt-bar">'
  +'<button class="btn" data-a="upload"><svg class="i"><use href="#ic-file"/></svg> Upload .md</button>'
  +'<button class="btn ghost" data-a="sample">Load sample</button>'
  +'<span class="sp"></span>'
  +'<label>Export as</label>'+fmtSeg()+themeSelect()
  +'<label><input type="checkbox" data-r="transparent"> Transparent</label>'
  +'</div>'
  +'<div class="mt-main">'
  +'<section class="mt-pane"><div class="mt-hd"><span>Markdown</span><span class="mt-status" data-r="status"></span></div>'
  +'<textarea class="mt-plain" data-r="md" spellcheck="false" aria-label="Markdown document" placeholder="Paste a Markdown document that contains ```mermaid blocks…"></textarea></section>'
  +'<section class="mt-pane mt-grid-wrap">'
  +'<div class="mt-export"><label><input type="checkbox" data-r="all" checked> Select all</label><span class="sp"></span>'
  +'<button class="btn primary big" data-a="zip">Download ZIP</button></div>'
  +'<div class="mt-grid" data-r="grid"><p class="mmd-muted">Loading the renderer…</p></div>'
  +'</section></div>'
  +'<input type="file" data-r="file" accept=".md,.markdown,.txt,.mmd" hidden>';
  root.insertAdjacentHTML('afterend','<p class="mt-privacy">'+LOCK+' Extracted and exported in your browser — your Markdown is never uploaded.</p>');
  var md=$('[data-r="md"]'),grid=$('[data-r="grid"]'),statusX=$('[data-r="status"]');
  var cards=[],seq=0,timer=null;
  var refresh=function(){
    setSeg('fmt',state.fmt);setSeg('scale',state.scale);
    $('[data-r="scale"]').style.display=state.fmt==='png'?'':'none';
    var n=cards.filter(function(c){return c.ok&&c.on}).length;
    $('[data-a="zip"]').textContent='Download ZIP ('+n+' '+state.fmt.toUpperCase()+')';
    $$('.mt-thumb',grid).forEach(function(t){t.style.background=state.transparent?'repeating-conic-gradient(#e9e9e9 0% 25%,#fff 0% 50%) 0 0/14px 14px':state.theme==='dark'?'#1e1e1e':'#fff'});
  };
  var run=function(){
    var text=md.value,my=++seq;
    store(KEY,text);
    var blocks=K.extract(text);
    statusX.textContent=blocks.length?blocks.length+' diagram'+(blocks.length>1?'s':'')+' found':'';
    statusX.className='mt-status'+(blocks.length?' ok':'');
    if(!blocks.length){
      cards=[];grid.innerHTML='<p class="mmd-muted">No <code>```mermaid</code> blocks found yet. Paste or upload a Markdown file that contains Mermaid code blocks.</p>';refresh();return;
    }
    K.track('mermaid_extract',{count:blocks.length,source:'tool',page:'extract'});
    var names=K.fileNames(blocks,'x');
    cards=blocks.map(function(b,i){return {b:b,name:names[i].replace(/\.x$/,''),ok:false,on:true,el:null}});
    grid.innerHTML=cards.map(function(c,i){
      return '<div class="mt-card" data-i="'+i+'"><div class="mt-card-hd"><input type="checkbox" checked aria-label="Include in ZIP">'
        +'<span title="'+esc(c.b.title||'')+'">'+(i+1)+'. '+esc(c.b.title||'Diagram '+(i+1))+'</span></div>'
        +'<div class="mt-thumb"><span class="mmd-muted">Rendering…</span></div>'
        +'<div class="mt-card-ft"><span class="meta">line '+c.b.line+'</span>'
        +'<button data-c="svg">SVG</button><button data-c="png">PNG</button><button data-c="open">Open</button></div></div>';
    }).join('');
    refresh();
    var chain=Promise.resolve();
    cards.forEach(function(c,i){
      chain=chain.then(function(){
        if(my!==seq) return;
        return K.render(c.b.code,{theme:state.theme}).then(function(r){
          if(my!==seq) return;
          var card=grid.querySelector('[data-i="'+i+'"]'),thumb=card.querySelector('.mt-thumb');
          c.ok=r.ok;
          if(r.ok){
            thumb.innerHTML=r.svg;
            var svg=thumb.querySelector('svg'),vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);
            if(vb.length===4){svg.setAttribute('width',vb[2]);svg.setAttribute('height',vb[3])}
            svg.style.maxWidth='';
            c.el=svg;
            card.querySelector('.meta').textContent=(r.type||'diagram')+' · line '+c.b.line;
          }else{
            c.on=false;card.classList.add('off');card.querySelector('input').checked=false;card.querySelector('input').disabled=true;
            thumb.innerHTML=errorBox(r.error,false);
            card.querySelector('[data-c="svg"]').remove();card.querySelector('[data-c="png"]').remove();
            card.querySelector('[data-c="open"]').textContent='Fix it';
          }
          K.track('mermaid_render',{ok:r.ok,type:r.type||'unknown',source:'tool',page:'extract'});
          refresh();
        });
      });
    });
  };
  var schedule=function(){clearTimeout(timer);timer=setTimeout(run,450)};
  md.addEventListener('input',schedule);
  var zip=function(){
    var sel=cards.filter(function(c){return c.ok&&c.on&&c.el});
    if(!sel.length){toast('Select at least one diagram that renders');return}
    var ext=state.fmt,bg=background();
    var names=K.fileNames(sel.map(function(c){return c.b}),ext);
    toast('Building ZIP…');
    Promise.all(sel.map(function(c){
      return ext==='svg'?K.svgString(c.el,{background:bg}):K.pngBlob(c.el,{scale:state.scale,background:bg});
    })).then(function(datas){
      return K.zip(datas.map(function(d,i){return {name:names[i],data:d}}));
    }).then(function(blob){
      K.download(blob,'mermaid-diagrams.zip');
      K.track('mermaid_export',{format:ext,scale:ext==='png'?state.scale:1,mode:'batch',count:sel.length,page:'extract'});
      toast(sel.length+' diagram'+(sel.length>1?'s':'')+' exported');
    },function(e){toast('Export failed: '+e.message)});
  };
  root.addEventListener('click',function(e){
    var b=e.target.closest('[data-a],[data-v],[data-c]');if(!b) return;
    var seg=b.parentNode&&b.parentNode.getAttribute('data-r');
    if(seg==='fmt'){state.fmt=b.getAttribute('data-v');refresh();return}
    if(seg==='scale'){state.scale=+b.getAttribute('data-v');refresh();return}
    var a=b.getAttribute('data-a'),c=b.getAttribute('data-c');
    if(a==='upload') $('[data-r="file"]').click();
    else if(a==='sample'){md.value=SAMPLE_MD;run()}
    else if(a==='zip') zip();
    else if(c){
      var i=+b.closest('.mt-card').getAttribute('data-i'),card=cards[i];if(!card) return;
      var bg=background();
      if(c==='svg'){K.download(K.svgString(card.el,{background:bg}),card.name+'.svg','image/svg+xml');K.track('mermaid_export',{format:'svg',scale:1,mode:'single',page:'extract'})}
      else if(c==='png') K.pngBlob(card.el,{scale:state.scale,background:bg}).then(function(bl){K.download(bl,card.name+'.png');K.track('mermaid_export',{format:'png',scale:state.scale,mode:'single',page:'extract'})});
      else if(c==='open'){
        var w=window.open('about:blank','_blank');
        K.encodeShare(card.b.code).then(function(tok){
          var url=(card.ok?'/mermaid-viewer/':'/fix-mermaid-syntax/')+'#code='+tok;
          if(w) w.location.href=url; else location.href=url;
        });
      }
    }
  });
  grid.addEventListener('change',function(e){
    if(e.target.type!=='checkbox') return;
    var i=+e.target.closest('.mt-card').getAttribute('data-i');
    cards[i].on=e.target.checked;e.target.closest('.mt-card').classList.toggle('off',!e.target.checked);
    refresh();
  });
  $('[data-r="all"]').addEventListener('change',function(e){
    cards.forEach(function(c,i){
      if(!c.ok) return;
      c.on=e.target.checked;
      var card=grid.querySelector('[data-i="'+i+'"]');
      card.querySelector('input').checked=c.on;card.classList.toggle('off',!c.on);
    });
    refresh();
  });
  $('[data-r="theme"]').addEventListener('change',function(e){state.theme=e.target.value;store('omf-mmd-theme',state.theme);run()});
  $('[data-r="transparent"]').addEventListener('change',function(e){state.transparent=e.target.checked;refresh()});
  var onFile=function(f){
    if(!f) return;
    if(f.size>10*1024*1024){toast('That file is over 10 MB');return}
    var r=new FileReader();r.onload=function(){md.value=String(r.result);run()};r.readAsText(f);
  };
  $('[data-r="file"]').addEventListener('change',function(e){onFile(e.target.files[0]);e.target.value=''});
  bindDrop(onFile);
  md.value=store(KEY)||SAMPLE_MD;
  boot().then(run);
}

/* the renderer is fetched after first paint so it never delays LCP */
function boot(){
  var load=window.MermaidKit?Promise.resolve():new Promise(function(resolve,reject){
    var s=document.createElement('script');s.src='/assets/mermaid-kit.js?v=20261016a';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  return load.then(function(){K=window.MermaidKit;return K.ready()}).catch(function(){
    toast('Could not load the Mermaid renderer — check your connection');
    var g=$('[data-r="empty"]')||$('[data-r="grid"]');if(g) g.textContent='Could not load the Mermaid renderer. Check your connection and reload.';
    throw new Error('load failed');
  });
}

if(MODE==='extract') initExtract(); else initSingle();
})();
