/* openmdfile · app.js  © 2026 CCC Studio
   Shared: theme, SVG sprite, viewer (open/render/export). */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};

/* ================= strings ================= */
var STR={sizes:['Small','Medium','Large'],size:'Text size: ',over:'is over 10 MB',notmd:'is not a Markdown file',
  binary:'looks like a binary file',nothing:'Nothing to render',url:'Enter a URL',fetching:'Fetching…',
  fetchfail:'Could not fetch that URL (CORS or network). Try a raw.githubusercontent.com link.',
  copied:'Copied — paste into Word, Google Docs, or email',clipfail:'Clipboard blocked — try Ctrl/Cmd+C after selecting',
  word:'Word document downloaded',clip:'Rendered from clipboard',
  imgmiss:"Image not found — relative paths can't load from a single file",by:'rendered by openmdfile',
  pdfgen:'Generating PDF…',pdfok:'PDF downloaded',copysrc:'Markdown source copied',pdffail:'PDF export failed — use the print button instead',
  mmdrender:'Rendering diagram…',mmdload:'The diagram renderer could not be loaded.',mmdloadhint:'Check your connection and reload the page.',
  mmdnone:'No rendered diagrams to export',mmdbroken:'This diagram has a syntax error — fix it first',mmdfixed:'Diagram fixed',
  mmdcopied:'Mermaid code copied',mmdzipping:'Building ZIP…',mmdexportfail:'Export failed',mmdchecking:'Checking syntax…'};
function t(k){return STR[k]}

/* ================= on-demand libraries ================= */
/* mermaid (~3 MB, via mermaid-kit), KaTeX and html2pdf are only fetched when
   a document actually needs them, so they never block the landing page. */
var CDN='https://cdnjs.cloudflare.com/ajax/libs/';
var LIBS={
  mermaid:{js:['/assets/mermaid-kit.js?v=20261016a'],ready:function(){return !!window.MermaidKit}},
  katex:{css:CDN+'KaTeX/0.16.9/katex.min.css',
    js:[CDN+'KaTeX/0.16.9/katex.min.js',CDN+'KaTeX/0.16.9/contrib/auto-render.min.js'],
    ready:function(){return !!window.renderMathInElement}},
  html2pdf:{js:[CDN+'html2pdf.js/0.10.1/html2pdf.bundle.min.js'],ready:function(){return !!window.html2pdf}}
};
var libLoading={};
function loadScript(src){
  return new Promise(function(resolve,reject){
    var s=document.createElement('script');
    s.src=src;s.onload=resolve;s.onerror=reject;
    document.head.appendChild(s);
  });
}
function loadLib(name){
  var lib=LIBS[name];
  if(lib.ready()) return Promise.resolve();
  if(libLoading[name]) return libLoading[name];
  if(lib.css&&!document.querySelector('link[href="'+lib.css+'"]')){
    var l=document.createElement('link');l.rel='stylesheet';l.href=lib.css;document.head.appendChild(l);
  }
  var p=lib.js.reduce(function(chain,src){return chain.then(function(){return loadScript(src)})},Promise.resolve());
  if(name==='mermaid') p=p.then(function(){MermaidKit.ensureCss();return MermaidKit.ready()});
  libLoading[name]=p.catch(function(e){delete libLoading[name];throw e});
  return libLoading[name];
}
function noop(){}

/* ================= theme ================= */
var THEME=localStorage.getItem('omf-theme')||'light';
function applyTheme(){
  document.documentElement.setAttribute('data-theme',THEME);
  var l=document.getElementById('hljs-light'),d=document.getElementById('hljs-dark');
  if(l&&d){l.disabled=(THEME==='dark');d.disabled=(THEME!=='dark');}
}
window.toggleTheme=function(){
  THEME=(THEME==='dark')?'light':'dark';
  localStorage.setItem('omf-theme',THEME);
  applyTheme();
  if(files.length&&$('#reader').style.display==='block') renderActive();
};

/* ================= injected UI ================= */
var SPRITE='<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
+'<symbol id="ic-drop" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></symbol>'
+'<symbol id="ic-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></symbol>'
+'<symbol id="ic-pen" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></symbol>'
+'<symbol id="ic-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></symbol>'
+'<symbol id="ic-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>'
+'<symbol id="ic-eye" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></symbol>'
+'<symbol id="ic-export" viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></symbol>'
+'<symbol id="ic-fx" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3"/><path d="M9 11.2h5.7"/></symbol>'
+'<symbol id="ic-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></symbol>'
+'<symbol id="ic-menu" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></symbol>'
+'<symbol id="ic-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>'
+'<symbol id="ic-back" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></symbol>'
+'<symbol id="ic-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>'
+'<symbol id="ic-word" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8.5 13l1.5 5 2-4 2 4 1.5-5"/></symbol>'
+'<symbol id="ic-print" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></symbol>'
+'<symbol id="ic-arrow" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></symbol>'
+'</svg>';

var READER='<div id="reader">'
+'<div id="progress"></div>'
+'<div class="toolbar"><div class="toolbar-inner">'
+'<button class="icon-btn" onclick="backToLanding()" title="Back"><svg class="i"><use href="#ic-back"/></svg></button>'
+'<button class="icon-btn toc-toggle" onclick="document.getElementById(\'toc\').classList.toggle(\'open\')" title="Contents"><svg class="i"><use href="#ic-menu"/></svg></button>'
+'<div class="tabs" id="tabs"></div>'
+'<button class="icon-btn" onclick="document.getElementById(\'fileInput2\').click()" title="Add file"><svg class="i"><use href="#ic-plus"/></svg></button>'
+'<input type="file" id="fileInput2" accept=".md,.markdown,.txt" multiple hidden>'
+'<div class="spacer"></div>'
+'<div class="tool-group" id="modeGroup">'
+'<button id="btnSplit" onclick="setSplit(1)" title="Split view">Split</button>'
+'<button id="btnRead" onclick="setSplit(0)" title="Reading view">Read</button>'
+'</div>'
+'<div class="tool-group hide-mobile">'
+'<button onclick="setFont(-1)" title="Smaller text">A−</button>'
+'<button onclick="setFont(1)" title="Larger text">A＋</button>'
+'<button id="serifBtn" onclick="toggleSerif()" title="Serif">Aa</button>'
+'<button onclick="toggleTheme()" title="Theme"><svg class="i"><use href="#ic-moon"/></svg></button>'
+'<button onclick="window.print()" title="Print"><svg class="i"><use href="#ic-print"/></svg></button>'
+'</div>'
+'<button class="export-btn hide-mobile" onclick="copyRich()"><svg class="i"><use href="#ic-copy"/></svg> Copy rich text</button>'
+'<button class="export-btn" onclick="exportWord()"><svg class="i"><use href="#ic-word"/></svg> Word</button>'
+'<button class="export-btn primary" onclick="exportPdf()"><svg class="i"><use href="#ic-drop"/></svg> PDF</button>'
+'</div></div>'
+'<div class="reader-layout">'
+'<aside id="toc"><div class="toc-title">Contents</div><div id="tocList"></div></aside>'
+'<main class="doc-wrap"><div id="panes">'
+'<section class="pane pane-src">'
+'<div class="pane-hd"><span>Markdown source</span>'
+'<button class="pane-copy" onclick="copySource()" title="Copy source"><svg class="i"><use href="#ic-copy"/></svg></button></div>'
+'<div class="pane-body" id="srcScroll"><pre id="srcBody"></pre></div>'
+'</section>'
+'<section class="pane pane-doc">'
+'<div class="pane-hd"><span>Rendered preview</span></div>'
+'<div class="pane-body" id="docScroll"><article id="doc"><div class="print-header" id="printHeader"></div><div id="docBody" dir="auto"></div></article></div>'
+'</section>'
+'</div></main>'
+'</div></div>';

var MODALS='<div class="modal-overlay" id="modal-paste"><div class="modal">'
+'<h3>Paste Markdown text</h3>'
+'<p class="hint">Paste raw Markdown (e.g. copied from ChatGPT or Claude) and render it as a document.</p>'
+'<textarea id="pasteArea" placeholder="# My document&#10;&#10;…"></textarea>'
+'<div class="modal-actions">'
+'<button class="btn" onclick="closeModals()">Cancel</button>'
+'<button class="btn primary" onclick="renderPaste()">Render <svg class="i"><use href="#ic-arrow"/></svg></button>'
+'</div></div></div>'
+'<div class="modal-overlay" id="modal-url"><div class="modal">'
+'<h3>Open from URL</h3>'
+'<p class="hint">Paste a link to a raw .md file (GitHub raw links work great). Fetched by your browser, never by our servers.</p>'
+'<input type="text" id="urlInput" placeholder="https://raw.githubusercontent.com/user/repo/main/README.md">'
+'<div class="modal-actions">'
+'<button class="btn" onclick="closeModals()">Cancel</button>'
+'<button class="btn primary" onclick="loadUrl()">Open <svg class="i"><use href="#ic-arrow"/></svg></button>'
+'</div></div></div>'
+'<div id="toast"></div>';

/* ================= state ================= */
var files=[],active=0,fontStep=1,FONT_SIZES=[14.5,16,18];
/* embed mode: the reader lives inside the page instead of taking it over */
var EMBED=false;
var TAB_ICON='<svg class="i"><use href="#ic-file"/></svg>';
var toastTimer=null;

function toast(msg){
  var el=$('#toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){el.classList.remove('show')},2600);
}
window.setFont=function(d){
  fontStep=Math.max(0,Math.min(2,fontStep+d));
  document.documentElement.style.setProperty('--doc-size',FONT_SIZES[fontStep]+'px');
  toast(t('size')+t('sizes')[fontStep]);
};
window.toggleSerif=function(){
  $('#doc').classList.toggle('serif');
  $('#serifBtn').classList.toggle('on');
};

/* ================= split view ================= */
var SPLIT=0;
window.setSplit=function(on){
  SPLIT=on?1:0;
  document.documentElement.setAttribute('data-split',SPLIT?'1':'0');
  var a=$('#btnSplit'),b=$('#btnRead');
  if(a) a.classList.toggle('on',!!SPLIT);
  if(b) b.classList.toggle('on',!SPLIT);
  document.getElementById('progress').style.width='0%';
  if(SPLIT) bindSync();
  updateProgress();
};
window.copySource=function(){
  var f=files[active]; if(!f) return;
  try{ navigator.clipboard.writeText(f.raw).then(function(){toast(t('copysrc'))},function(){toast(t('clipfail'))}) }
  catch(e){ toast(t('clipfail')) }
};
var syncing=false;
function bindSync(){
  var a=$('#srcScroll'),b=$('#docScroll');
  if(!a||!b||a.getAttribute('data-bound'))return;
  a.setAttribute('data-bound','1');
  var mk=function(from,to){return function(){
    if(syncing)return;
    /* on narrow screens the preview flows at natural height and the page
       scrolls instead — there is nothing to sync to, so stay out of the way */
    if(to.scrollHeight-to.clientHeight<8)return;
    syncing=true;
    var m=Math.max(1,from.scrollHeight-from.clientHeight);
    to.scrollTop=(from.scrollTop/m)*(to.scrollHeight-to.clientHeight);
    requestAnimationFrame(function(){syncing=false});
  }};
  a.addEventListener('scroll',mk(a,b),{passive:true});
  b.addEventListener('scroll',mk(b,a),{passive:true});
  b.addEventListener('scroll',function(){updateProgress();spy(b)},{passive:true});
}
function updateProgress(){
  var el=$('#progress'); if(!el)return;
  if(SPLIT){
    var b=$('#docScroll'); if(!b)return;
    var m=Math.max(1,b.scrollHeight-b.clientHeight);
    el.style.width=(b.scrollTop/m*100)+'%';
  }else{
    var h=document.documentElement;
    el.style.width=(h.scrollTop/Math.max(1,(h.scrollHeight-h.clientHeight))*100)+'%';
  }
}
window.openModal=function(id){$('#modal-'+id).classList.add('open')};
window.closeModals=function(){document.querySelectorAll('.modal-overlay').forEach(function(m){m.classList.remove('open')})};

/* ================= open flows ================= */
function handleFiles(list){
  var arr=Array.prototype.slice.call(list);
  if(!arr.length) return;
  dropSample();
  var pending=arr.length;
  arr.forEach(function(f){
    var done=function(){if(--pending===0)finishOpen()};
    if(f.size>10*1024*1024){toast('"'+f.name+'" '+t('over'));done();return}
    if(!/\.(md|markdown|txt)$/i.test(f.name)){toast('"'+f.name+'" '+t('notmd'));done();return}
    var r=new FileReader();
    r.onload=function(){
      if(r.result.indexOf(String.fromCharCode(0))!==-1){toast('"'+f.name+'" '+t('binary'))}
      else files.push({name:f.name,raw:r.result});
      done();
    };
    r.readAsText(f);
  });
}
function finishOpen(){if(files.length){active=files.length-1;showReader()}}
window.loadSample=function(isPreload){
  files.push({name:'sample.md',raw:SAMPLE_MD,sample:(isPreload===true)});
  active=files.length-1;showReader();
};
/* the preloaded demo document steps aside for the user's first real file */
function dropSample(){
  if(files.length===1&&files[0].sample){files.length=0;active=0}
}
window.renderPaste=function(){
  var v=$('#pasteArea').value.trim();
  if(!v){toast(t('nothing'));return}
  dropSample();
  files.push({name:'pasted.md',raw:v});active=files.length-1;
  closeModals();showReader();
};
window.loadUrl=function(){
  var u=$('#urlInput').value.trim();
  if(!u){toast(t('url'));return}
  toast(t('fetching'));
  fetch(u).then(function(res){if(!res.ok)throw 0;return res.text()}).then(function(text){
    dropSample();
    files.push({name:u.split('/').pop()||'remote.md',raw:text});active=files.length-1;
    closeModals();showReader();
  }).catch(function(){toast(t('fetchfail'))});
};

/* ================= reader ================= */
window.showReader=function(){
  if(!EMBED){var p=$('#page'); if(p)p.style.display='none'}
  $('#reader').style.display='block';
  renderTabs();renderActive();
  if(!EMBED) window.scrollTo(0,0);
};
window.backToLanding=function(){
  if(EMBED)return;
  $('#reader').style.display='none';
  var p=$('#page'); if(p)p.style.display='block';
};
function renderTabs(){
  var el=$('#tabs');el.innerHTML='';
  files.forEach(function(f,i){
    var b=document.createElement('button');
    b.className='tab'+(i===active?' active':'');
    b.innerHTML=TAB_ICON+' '+f.name+(files.length>1?' <span class="close">✕</span>':'');
    b.onclick=function(e){
      if(e.target.classList&&e.target.classList.contains('close')){
        files.splice(i,1);
        if(!files.length){backToLanding();return}
        active=Math.min(active,files.length-1);
      }else active=i;
      renderTabs();renderActive();window.scrollTo(0,0);
    };
    el.appendChild(b);
  });
}
var renderSeq=0;
var MATH_RE=/\$\$[\s\S]+?\$\$|\$[^$\n]+\$/;
function renderActive(){
  var f=files[active];if(!f)return Promise.resolve();
  var seq=++renderSeq;
  document.title=f.name+' — openmdfile';
  $('#printHeader').textContent=f.name+' · '+t('by');
  var src=$('#srcBody'); if(src) src.textContent=f.raw;
  var body=$('#docBody');
  body.innerHTML=marked.parse(f.raw);
  body.querySelectorAll('li input[type=checkbox]').forEach(function(cb){cb.closest('li').classList.add('task-item')});
  body.querySelectorAll('img').forEach(function(img){
    img.onerror=function(){
      var s=document.createElement('span');s.className='img-missing';s.textContent=t('imgmiss');img.replaceWith(s);
    };
  });
  body.querySelectorAll('pre code.language-mermaid').forEach(function(c,i){
    c.closest('pre').replaceWith(diagramBlock(c.textContent,i));
  });
  if(window.hljs) body.querySelectorAll('pre code').forEach(function(c){try{hljs.highlightElement(c)}catch(e){}});
  buildToc();
  var diagrams=body.querySelectorAll('.mmd-block');
  if(diagrams.length>1) body.insertBefore(diagramBanner(diagrams.length),body.firstChild);
  var needMath=MATH_RE.test(f.raw);
  var stale=function(){return seq!==renderSeq};
  var mmReady=diagrams.length?loadLib('mermaid'):null;
  var mathReady=needMath?loadLib('katex'):null;
  if(mathReady) mathReady.catch(noop);
  /* math runs after mermaid so auto-render never rewrites diagram source */
  return (mmReady?mmReady.then(function(){
    if(stale())return;
    MermaidKit.track('mermaid_extract',{count:diagrams.length,source:'md'});
    return Array.prototype.reduce.call(diagrams,function(chain,blk){
      return chain.then(function(){if(!stale()) return renderDiagram(blk)});
    },Promise.resolve());
  },function(){
    diagrams.forEach(function(blk){showDiagramError(blk,{title:t('mmdload'),hint:t('mmdloadhint')},false)});
  }):Promise.resolve()).then(function(){
    if(!mathReady)return;
    return mathReady.then(function(){
      if(stale())return;
      try{renderMathInElement(body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false})}catch(e){}
    },noop);
  });
}
window.renderActive=renderActive;

/* ================= mermaid diagrams ================= */
function mmdTheme(){return THEME==='dark'?'dark':'neutral'}
function mmdBg(){return THEME==='dark'?'#1e1e1e':'#ffffff'}
function diagramBlock(code,i){
  var blk=document.createElement('div');
  blk.className='mmd-block';blk.setAttribute('data-i',i);
  blk.innerHTML='<div class="mmd-tools" role="toolbar" aria-label="Diagram tools">'
    +'<button data-m="code" title="View the Mermaid code">Code</button>'
    +'<button data-m="copy" title="Copy the Mermaid code">Copy</button>'
    +'<button data-m="png" title="Download as PNG">PNG</button>'
    +'<button data-m="svg" title="Download as SVG">SVG</button>'
    +'<button data-m="fix" title="Check and fix the syntax">Fix</button>'
    +'<button data-m="open" title="Open in the Mermaid viewer">Open in tool ↗</button></div>'
    +'<div class="mermaid mmd-loading"></div>';
  var m=blk.querySelector('.mermaid');
  m.setAttribute('data-src',code);m.textContent=t('mmdrender');
  return blk;
}
function diagramBanner(n){
  var d=document.createElement('div');d.className='mmd-banner';
  d.innerHTML='<span>This file contains <strong>'+n+' diagrams</strong></span><span class="sp"></span>'
    +'<select data-m-fmt aria-label="Export format"><option value="png">PNG (2x)</option><option value="svg">SVG</option></select>'
    +'<button class="btn primary" data-m="zip">Export all (ZIP)</button>';
  return d;
}
function renderDiagram(blk){
  var m=blk.querySelector('.mermaid'),code=m.getAttribute('data-src');
  return MermaidKit.render(code,{theme:mmdTheme()}).then(function(r){
    MermaidKit.track('mermaid_render',{ok:r.ok,type:r.type||'unknown',source:'md'});
    var old=blk.querySelector('.mmd-error');if(old)old.remove();
    m.classList.remove('mmd-loading');
    if(r.ok){m.innerHTML=r.svg;m.classList.remove('mmd-failed');blk.classList.remove('mmd-has-error')}
    else showDiagramError(blk,r.error,true);
  });
}
/* a broken diagram only replaces itself with an explanation — the rest of the document still renders */
function showDiagramError(blk,e,canFix){
  var m=blk.querySelector('.mermaid');
  m.classList.remove('mmd-loading');m.classList.add('mmd-failed');m.textContent='';
  blk.classList.add('mmd-has-error');
  var box=document.createElement('div');box.className='mmd-error';
  var h=document.createElement('p');h.className='mmd-err-title';h.textContent=e.title;
  var p=document.createElement('p');p.className='mmd-err-hint';p.textContent=e.hint;
  box.appendChild(h);box.appendChild(p);
  if(e.snippet){var s=document.createElement('pre');s.className='mmd-snip';s.textContent=e.snippet;box.appendChild(s)}
  if(canFix){
    var a=document.createElement('div');a.className='mmd-err-actions';
    a.innerHTML='<button class="btn primary" data-m="fix">Try to fix</button><button class="btn" data-m="code">Show code</button><button class="btn" data-m="open">Open in fixer ↗</button>';
    box.appendChild(a);
  }
  m.parentNode.insertBefore(box,m.nextSibling);
}
function headingFor(blk){
  var last='',nodes=$('#docBody').querySelectorAll('h1,h2,h3,h4,h5,h6,.mmd-block');
  for(var i=0;i<nodes.length;i++){
    if(nodes[i]===blk) break;
    if(!nodes[i].classList.contains('mmd-block')) last=nodes[i].textContent;
  }
  return last;
}
function diagramMeta(blk){return {title:headingFor(blk),index:+blk.getAttribute('data-i')}}
function applyDiagramFix(blk,fixed,res){
  var m=blk.querySelector('.mermaid'),before=m.getAttribute('data-src'),i=+blk.getAttribute('data-i'),f=files[active];
  MermaidKit.track('mermaid_fix_accept',{source:'md',rules:res.applied.map(function(r){return r.id}).join(',')});
  var b=f&&MermaidKit.extract(f.raw)[i];
  if(b&&b.code.trim()===before.trim()){
    f.raw=MermaidKit.replaceBlock(f.raw,i,fixed);
    var src=$('#srcBody'); if(src) src.textContent=f.raw;
  }
  m.setAttribute('data-src',fixed);
  var pre=blk.querySelector('.mmd-code code'); if(pre) pre.textContent=fixed;
  renderDiagram(blk).then(function(){toast(t('mmdfixed'))});
}
function exportAllDiagrams(fmt){
  var K=MermaidKit,all=$('#docBody').querySelectorAll('.mmd-block');
  var blks=Array.prototype.filter.call(all,function(b){return b.querySelector('.mermaid svg')});
  if(!blks.length){toast(t('mmdnone'));return}
  var names=K.fileNames(blks.map(diagramMeta),fmt),bg=mmdBg();
  toast(t('mmdzipping'));
  Promise.all(blks.map(function(b){
    var svg=b.querySelector('.mermaid svg');
    return fmt==='svg'?K.svgString(svg,{background:bg}):K.pngBlob(svg,{scale:2,background:bg});
  })).then(function(datas){
    return K.zip(datas.map(function(d,i){return {name:names[i],data:d}}));
  }).then(function(zip){
    var f=files[active],base=(f?f.name.replace(/\.(md|markdown|txt)$/i,''):'document');
    K.download(zip,base+'-diagrams.zip');
    K.track('mermaid_export',{format:fmt,scale:fmt==='png'?2:1,mode:'batch',count:blks.length,source:'md'});
    var skipped=all.length-blks.length;
    toast(blks.length+' diagrams exported'+(skipped?' · '+skipped+' with errors skipped':''));
  },function(e){toast(t('mmdexportfail')+(e&&e.message?': '+e.message:''))});
}
function onDiagramClick(e){
  var b=e.target.closest&&e.target.closest('[data-m]');
  if(!b||!window.MermaidKit) return;
  var K=MermaidKit,act=b.getAttribute('data-m');
  if(act==='zip'){exportAllDiagrams(b.parentNode.querySelector('[data-m-fmt]').value);return}
  var blk=b.closest('.mmd-block');if(!blk) return;
  var m=blk.querySelector('.mermaid'),code=m.getAttribute('data-src'),svg=m.querySelector('svg');
  var meta=diagramMeta(blk),name=K.fileNames([meta],'x')[0].replace(/\.x$/,'');
  if(act==='code'){
    var pre=blk.querySelector('.mmd-code'),btn=blk.querySelector('.mmd-tools [data-m="code"]');
    if(pre){pre.remove();btn.classList.remove('on');return}
    pre=document.createElement('pre');pre.className='mmd-code';
    var c=document.createElement('code');c.textContent=code;pre.appendChild(c);
    blk.appendChild(pre);btn.classList.add('on');
  }else if(act==='copy'){
    K.copyText(code).then(function(){toast(t('mmdcopied'))},function(){toast(t('clipfail'))});
  }else if(act==='png'||act==='svg'){
    if(!svg){toast(t('mmdbroken'));return}
    var done=function(){K.track('mermaid_export',{format:act,scale:act==='png'?2:1,mode:'single',source:'md'})};
    if(act==='svg'){K.download(K.svgString(svg,{background:mmdBg()}),name+'.svg','image/svg+xml');done()}
    else K.pngBlob(svg,{scale:2,background:mmdBg()}).then(function(png){K.download(png,name+'.png');done()},function(){toast(t('mmdexportfail'))});
  }else if(act==='fix'){
    toast(t('mmdchecking'));
    K.fix(code,{source:'md'}).then(function(res){
      K.fixDialog(res,function(fixed){applyDiagramFix(blk,fixed,res)});
    });
  }else if(act==='open'){
    var w=window.open('about:blank','_blank');
    K.encodeShare(code).then(function(tok){
      var url=(blk.classList.contains('mmd-has-error')?'/fix-mermaid-syntax/':'/mermaid-viewer/')+'#code='+tok;
      if(w) w.location.href=url; else location.href=url;
    });
  }
}
/* exports carry the diagrams, not the on-screen buttons around them */
function stripDiagramChrome(root){
  root.querySelectorAll('.mmd-tools,.mmd-banner,.mmd-code,.mmd-error').forEach(function(n){n.remove()});
  root.querySelectorAll('.mermaid.mmd-failed,.mermaid.mmd-loading').forEach(function(m){
    var pre=document.createElement('pre');pre.textContent=m.getAttribute('data-src')||'';m.replaceWith(pre);
  });
}
function buildToc(){
  var list=$('#tocList');list.innerHTML='';
  document.querySelectorAll('#docBody h1, #docBody h2, #docBody h3').forEach(function(h,i){
    h.id='h-'+i;
    var a=document.createElement('a');
    a.textContent=h.textContent;a.href='#h-'+i;a.className=h.tagName.toLowerCase();
    a.onclick=function(e){
      $('#toc').classList.remove('open');
      if(SPLIT){
        e.preventDefault();
        var tgt=document.getElementById(this.getAttribute('href').slice(1));
        var sc=$('#docScroll');
        if(tgt&&sc) sc.scrollTop+=tgt.getBoundingClientRect().top-sc.getBoundingClientRect().top-12;
      }
    };
    list.appendChild(a);
  });
  updateProgress();
}
/* scroll spy + reading progress (page-level, non-split) */
function spy(container){
  var hs=document.querySelectorAll('#docBody h1, #docBody h2, #docBody h3');
  var limit=container?container.getBoundingClientRect().top+70:110;
  var cur=null;
  for(var i=0;i<hs.length;i++){ if(hs[i].getBoundingClientRect().top<limit) cur=hs[i]; else break; }
  document.querySelectorAll('#tocList a').forEach(function(a){
    a.classList.toggle('active', !!cur && a.getAttribute('href')==='#'+cur.id);
  });
}
window.addEventListener('scroll',function(){
  if(SPLIT)return;
  updateProgress(); spy(null);
},{passive:true});

/* ================= export ================= */
window.copyRich=function(){
  var clone=document.createElement('div');
  clone.innerHTML=$('#docBody').innerHTML;
  stripDiagramChrome(clone);
  var html=clone.innerHTML,text=clone.innerText||clone.textContent;
  try{
    navigator.clipboard.write([new ClipboardItem({
      'text/html':new Blob([html],{type:'text/html'}),
      'text/plain':new Blob([text],{type:'text/plain'})
    })]).then(function(){toast(t('copied'))},function(){toast(t('clipfail'))});
  }catch(e){toast(t('clipfail'))}
};
/* Self-contained print styles for the PDF render target.
   Deliberately plain CSS: html2canvas cannot parse modern colour functions
   (color-mix(), oklch(), …) and silently renders a blank page if it meets one,
   so the export must not depend on the site stylesheet at all. */
var PDF_CSS=''
+'.pdf-doc{position:static;width:794px;background:#fff;color:#111;'
+'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans Arabic","Noto Sans Devanagari",sans-serif;'
+'font-size:14px;line-height:1.7;padding:0 4px}'
+'.pdf-doc .pdf-meta{font-size:10px;color:#999;border-bottom:1px solid #e5e5e5;padding-bottom:6px;margin-bottom:16px}'
+'.pdf-doc h1{font-size:25px;font-weight:700;margin:12px 0 12px;color:#000;line-height:1.35}'
+'.pdf-doc h2{font-size:20px;font-weight:700;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #e5e5e5;color:#000;line-height:1.35}'
+'.pdf-doc h3{font-size:16px;font-weight:700;margin:16px 0 8px;color:#000;line-height:1.4}'
+'.pdf-doc h4{font-size:14.5px;font-weight:700;margin:14px 0 6px;color:#000}'
+'.pdf-doc p{margin:8px 0}'
+'.pdf-doc ul,.pdf-doc ol{padding-left:22px;margin:8px 0}'
+'.pdf-doc li{margin:4px 0}'
+'.pdf-doc li.task-item{list-style:none;margin-left:-22px}'
+'.pdf-doc blockquote{border-left:3px solid #99FF00;background:#fafafa;padding:8px 14px;margin:10px 0;color:#555}'
+'.pdf-doc code{background:#f4f4f4;padding:1px 4px;border-radius:3px;'
+'font-family:"SF Mono",Menlo,Consolas,"Courier New",monospace;font-size:12px;color:#111}'
+'.pdf-doc pre{background:#f6f6f6;border:1px solid #e2e2e2;border-radius:6px;padding:12px;font-size:12px;'
+'line-height:1.55;white-space:pre-wrap;word-wrap:break-word;overflow:visible;margin:10px 0}'
+'.pdf-doc pre code{background:none;padding:0;font-size:12px}'
+'.pdf-doc table{border-collapse:collapse;width:100%;margin:10px 0;font-size:13px}'
+'.pdf-doc th,.pdf-doc td{border:1px solid #ccc;padding:6px 10px;text-align:left;color:#111}'
+'.pdf-doc th{background:#f2f2f2;font-weight:700}'
+'.pdf-doc img,.pdf-doc svg{max-width:100%;height:auto}'
+'.pdf-doc a{color:#000;text-decoration:underline}'
+'.pdf-doc hr{border:none;border-top:1px solid #ddd;margin:16px 0}'
+'.pdf-doc .mermaid{background:#fff;padding:6px 0;text-align:center}'
+'.pdf-doc .img-missing{color:#999;font-size:11px;border:1px dashed #ccc;border-radius:5px;padding:5px 10px}';

/* task checkboxes become plain glyphs — form controls do not rasterise well */
function flattenChecks(root){
  root.querySelectorAll('input[type=checkbox]').forEach(function(cb){
    var s=document.createElement('span');
    s.textContent=(cb.checked?'☑':'☐')+' ';
    cb.replaceWith(s);
  });
}
window.exportPdf=function(){
  var f=files[active];if(!f)return;
  toast(t('pdfgen'));
  loadLib('html2pdf').then(function(){buildPdf(f)},function(){window.print()});
};
function buildPdf(f){
  var wasDark=(THEME==='dark');
  var proceed=function(){
    /* wrapper is off-screen, but the captured element itself stays in normal
       flow — an out-of-flow target makes html2pdf measure a zero-height page */
    var wrap=document.createElement('div');
    wrap.setAttribute('aria-hidden','true');
    wrap.style.cssText='position:fixed;left:-10000px;top:0;width:820px;z-index:-1;pointer-events:none';
    var st=document.createElement('style'); st.textContent=PDF_CSS;
    var el=document.createElement('div');
    el.className='pdf-doc';
    el.innerHTML='<div class="pdf-meta">'+f.name+' · '+t('by')+'</div>'+$('#docBody').innerHTML;
    stripDiagramChrome(el);
    flattenChecks(el);
    /* mermaid emits width="100%" SVGs; html2canvas needs their real on-screen size */
    var liveSvgs=document.querySelectorAll('#docBody .mermaid svg');
    el.querySelectorAll('.mermaid svg').forEach(function(svg,i){
      var r=liveSvgs[i]&&liveSvgs[i].getBoundingClientRect();
      if(!r||!r.width)return;
      var w=Math.min(r.width,780),h=r.height*(w/r.width);
      svg.setAttribute('width',w);svg.setAttribute('height',h);
      svg.style.maxWidth='none';
    });
    wrap.appendChild(st); wrap.appendChild(el);
    document.body.appendChild(wrap);
    var opt={margin:[14,12,16,12],
      filename:f.name.replace(/\.(md|markdown|txt)$/i,'')+'.pdf',
      image:{type:'jpeg',quality:0.95},
      html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false,
        /* strip the site stylesheet from html2canvas's private clone only:
           the visible page keeps its styling and the PDF stays deterministic */
        onclone:function(doc){
          doc.querySelectorAll('link[rel=stylesheet]').forEach(function(l){
            if((l.href||'').indexOf('assets/style.css')>-1) l.disabled=true;
          });
        }},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},
      pagebreak:{mode:['css','legacy'],avoid:['tr','img','blockquote','pre']}};
    var fin=function(ok){
      wrap.remove();
      if(wasDark){THEME='dark';localStorage.setItem('omf-theme','dark');applyTheme();renderActive();}
      toast(ok===false?t('pdffail'):t('pdfok'));
    };
    try{
      html2pdf().set(opt).from(el).save()
        .then(function(){fin(true)},function(){fin(false)});
    }catch(e){ fin(false) }
  };
  if(wasDark){THEME='light';applyTheme();renderActive().then(function(){setTimeout(proceed,100)})}
  else setTimeout(proceed,30);
}
/* Word reads HTML, but only styles that are spelled out for it: without an
   embedded stylesheet it falls back to Calibri defaults and drops every table
   border. So the export ships its own print-oriented CSS plus MSO page setup. */
var WORD_CSS=''
+'@page WordSection1{size:21cm 29.7cm;mso-page-orientation:portrait;margin:2.2cm 2cm 2.2cm 2cm}'
+'div.WordSection1{page:WordSection1}'
+'body{font-family:"Calibri","Microsoft YaHei","PingFang SC",sans-serif;font-size:11pt;line-height:1.55;color:#111}'
+'h1{font-size:20pt;font-weight:bold;color:#000;margin:14pt 0 8pt;line-height:1.3}'
+'h2{font-size:15pt;font-weight:bold;color:#000;margin:14pt 0 6pt;border-bottom:0.5pt solid #d9d9d9;padding-bottom:3pt}'
+'h3{font-size:12.5pt;font-weight:bold;color:#000;margin:12pt 0 5pt}'
+'h4{font-size:11pt;font-weight:bold;color:#000;margin:10pt 0 4pt}'
+'p{margin:5pt 0}'
+'ul,ol{margin:5pt 0 5pt 0}'
+'li{margin:3pt 0}'
+'li.task-item{list-style:none}'
+'p.task-item{margin:2pt 0}'
+'table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10.5pt}'
+'th,td{border:0.75pt solid #999999;padding:4pt 7pt;vertical-align:top}'
+'th{background:#f2f2f2;font-weight:bold;text-align:left}'
+'pre{font-family:Consolas,"Courier New",monospace;font-size:9.5pt;background:#f5f5f5;'
+'border:0.75pt solid #dddddd;padding:7pt;margin:8pt 0;white-space:pre-wrap;word-wrap:break-word}'
+'code{font-family:Consolas,"Courier New",monospace;font-size:9.5pt;background:#f5f5f5}'
+'pre code{background:transparent}'
+'blockquote{border-left:3pt solid #99FF00;margin:8pt 0 8pt 0;padding:2pt 0 2pt 10pt;color:#555}'
+'img{max-width:100%}'
+'hr{border:none;border-top:0.75pt solid #dddddd}'
+'a{color:#0563c1}';

/* Word cannot render KaTeX (MathML + unstyled HTML show up two or three times)
   or Mermaid SVG, so the export carries their source text instead. */
function texOf(node){
  var a=node.querySelector('annotation[encoding="application/x-tex"]');
  return a?a.textContent:node.textContent;
}
function wordifyMath(root){
  root.querySelectorAll('.katex-display').forEach(function(k){
    var tex='$$'+texOf(k)+'$$';
    var p=k.closest('p');
    if(p&&p.textContent.trim()===k.textContent.trim()){
      var pre=document.createElement('pre');pre.textContent=tex;p.replaceWith(pre);
    }else{
      var c=document.createElement('code');c.textContent=tex;k.replaceWith(c);
    }
  });
  root.querySelectorAll('.katex').forEach(function(k){
    var c=document.createElement('code');c.textContent='$'+texOf(k)+'$';k.replaceWith(c);
  });
}
function wordifyDiagrams(root){
  root.querySelectorAll('.mermaid').forEach(function(m){
    var note=document.createElement('p');
    var em=document.createElement('em');
    em.textContent='Mermaid diagram — export to PDF to keep the rendered chart.';
    note.appendChild(em);
    var pre=document.createElement('pre');
    pre.textContent=m.getAttribute('data-src')||m.textContent;
    m.replaceWith(note,pre);
  });
}
/* checkbox glyphs already mark task items; a bullet on top doubles them up */
function wordifyTasks(root){
  root.querySelectorAll('ul').forEach(function(ul){
    var items=Array.prototype.filter.call(ul.children,function(li){return li.tagName==='LI'});
    if(!items.length||!items.every(function(li){return li.classList.contains('task-item')}))return;
    var frag=document.createDocumentFragment();
    items.forEach(function(li){
      var p=document.createElement('p');p.className='task-item';p.innerHTML=li.innerHTML;frag.appendChild(p);
    });
    ul.replaceWith(frag);
  });
}
window.exportWord=function(){
  var f=files[active];if(!f)return;
  /* work on a detached copy so the on-screen document is untouched */
  var body=document.createElement('div');
  body.innerHTML=$('#docBody').innerHTML;
  stripDiagramChrome(body);
  flattenChecks(body);
  wordifyMath(body);
  wordifyDiagrams(body);
  wordifyTasks(body);
  /* Word honours the legacy border attribute far more reliably than CSS alone */
  body.querySelectorAll('table').forEach(function(tb){
    tb.setAttribute('border','1');
    tb.setAttribute('cellspacing','0');
    tb.setAttribute('cellpadding','4');
  });
  /* syntax-highlight spans carry no colour once our stylesheet is gone */
  body.querySelectorAll('pre code span').forEach(function(sp){
    sp.replaceWith(document.createTextNode(sp.textContent));
  });
  body.querySelectorAll('[id]').forEach(function(n){n.removeAttribute('id')});

  var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" '
    +'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    +'<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">'
    +'<title>'+f.name.replace(/[<>&]/g,'')+'</title>'
    +'<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>'
    +'<w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->'
    +'<style>'+WORD_CSS+'</style></head>'
    +'<body><div class="WordSection1">'+body.innerHTML+'</div></body></html>';

  var blob=new Blob(['﻿'+html],{type:'application/msword;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=f.name.replace(/\.(md|markdown|txt)$/i,'')+'.doc';
  a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  toast(t('word'));
};

/* ================= sample ================= */
var SAMPLE_MD='# Q3 Product Strategy — AI Assistant Rollout\n\n'
+'> Generated with Claude · Shared as `strategy.md` · This is a **sample document** showing what openmdfile can render.\n\n'
+'## Executive summary\n\nOur Q3 goal is to ship the AI assistant to **all enterprise customers** while keeping support tickets flat. Early beta data shows a ~~12%~~ **18% reduction** in time-to-resolution.\n\n'
+'## Key metrics\n\n| Metric | Q2 baseline | Q3 target | Status |\n|---|---|---|---|\n| Weekly active users | 42,000 | 60,000 | On track |\n| Time-to-resolution | 3.4 h | 2.5 h | At risk |\n| CSAT | 4.2 | 4.5 | On track |\n| Infra cost / user | $0.31 | $0.25 | Behind |\n\n'
+'## Launch checklist\n\n- [x] Security review completed\n- [x] Beta feedback synthesized (n = 214)\n- [ ] Pricing page update\n- [ ] Support macros localized (DE / JA)\n\n'
+'## Rollout architecture\n\n```mermaid\nflowchart LR\n    A[User request] --> B{Router}\n    B -->|Simple| C[FAQ model]\n    B -->|Complex| D[Assistant LLM]\n    D --> E[Human review queue]\n    C --> F[Response]\n    D --> F\n    E --> F\n```\n\n'
+'## Request lifecycle\n\n```mermaid\nsequenceDiagram\n    participant U as User\n    participant R as Router\n    participant L as Assistant LLM\n    U->>R: Ask a question\n    R->>L: Complex query\n    L-->>R: Draft answer\n    R-->>U: Response\n```\n\n'
+'## Cost model\n\nThe per-user cost follows:\n\n$$C(u) = \\frac{\\alpha \\cdot T_u}{\\eta} + \\beta$$\n\nwhere $T_u$ is tokens per user, $\\eta$ is cache hit efficiency, and $\\beta$ is fixed overhead.\n\n'
+'## Implementation notes\n\n```python\ndef route_request(query: str) -> str:\n    """Route to the cheapest capable model."""\n    score = complexity(query)\n    if score < 0.3:\n        return faq_model(query)\n    return assistant_llm(query, review=score > 0.8)\n```\n\n'
+'### Open questions\n\n1. Do we gate the assistant behind a feature flag per region?\n2. Latency budget: is **1.2 s p95** acceptable for chat?\n\n---\n\n*Questions? Ping #ai-rollout. Last updated 2026-07-14.*\n';

/* ================= init ================= */
function init(){
  document.body.insertAdjacentHTML('beforeend',SPRITE);
  applyTheme();
  var dz=document.getElementById('dropzone');
  if(dz){
    document.body.insertAdjacentHTML('beforeend',READER+MODALS);
    /* embedded reader: live tool sits in the page, sample preloaded */
    var host=document.getElementById('embedHost');
    if(host&&document.body.getAttribute('data-embed')==='1'){
      EMBED=true;
      document.documentElement.setAttribute('data-embed','1');
      host.appendChild(document.getElementById('reader'));
    }
    document.getElementById('docBody').addEventListener('click',onDiagramClick);
    setSplit(document.body.getAttribute('data-split-default')==='1'?1:0);
    if(window.marked) marked.setOptions({gfm:true,breaks:false});
    var fi=document.getElementById('fileInput');
    fi.addEventListener('change',function(e){handleFiles(e.target.files)});
    document.getElementById('fileInput2').addEventListener('change',function(e){handleFiles(e.target.files)});
    ['dragover','dragenter'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.add('dragover')})});
    ['dragleave','drop'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.remove('dragover')})});
    dz.addEventListener('drop',function(e){handleFiles(e.dataTransfer.files)});
    document.addEventListener('dragover',function(e){e.preventDefault()});
    document.addEventListener('drop',function(e){e.preventDefault();if(e.dataTransfer.files.length)handleFiles(e.dataTransfer.files)});
    document.querySelectorAll('.modal-overlay').forEach(function(m){m.addEventListener('click',function(e){if(e.target===m)closeModals()})});
    document.addEventListener('paste',function(e){
      if(!EMBED&&$('#reader').style.display==='block')return;
      if(document.querySelector('.modal-overlay.open'))return;
      if(/INPUT|TEXTAREA/.test((e.target.tagName||'')))return;
      var v=(e.clipboardData||window.clipboardData).getData('text');
      if(v&&v.length>20){files.push({name:'pasted.md',raw:v});active=files.length-1;showReader();toast(t('clip'))}
    });
    /* embedded mode always shows a live document — preload the sample */
    if(EMBED&&!files.length) loadSample(true);
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
})();
