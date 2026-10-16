/* openmdfile · mermaid-kit.js  © 2026 CCC Studio
   Mermaid engine shared by the .md reader and the /mermaid-* tool pages:
   lazy loading, sandboxed rendering, human-readable errors, the rule-based
   syntax fixer, SVG/PNG/ZIP export, Markdown extraction and share links.
   Everything runs in the browser — diagram code is never sent anywhere. */
(function(){
'use strict';
if(window.MermaidKit) return;

/* Pinned on purpose: run tests/mermaid-fix/bench.html before bumping. */
var MERMAID_VERSION='10.9.1';
var CDN='https://cdnjs.cloudflare.com/ajax/libs/';
var MERMAID_SRC=CDN+'mermaid/'+MERMAID_VERSION+'/mermaid.min.js';
var PURIFY_SRC=CDN+'dompurify/3.1.6/purify.min.js';
var CSS_HREF='/assets/mermaid.css?v=20261016a';

function noop(){}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

/* ================= loading ================= */
function loadScript(src){
  return new Promise(function(resolve,reject){
    var s=document.createElement('script');
    s.src=src;s.async=true;s.onload=resolve;s.onerror=function(){reject(new Error('Could not load '+src))};
    document.head.appendChild(s);
  });
}
function ensureCss(){
  if(document.querySelector('link[data-mmd-css]')||document.querySelector('link[href*="assets/mermaid.css"]')) return;
  var l=document.createElement('link');l.rel='stylesheet';l.href=CSS_HREF;l.setAttribute('data-mmd-css','1');
  document.head.appendChild(l);
}
var readyP=null;
function ready(){
  if(readyP) return readyP;
  readyP=Promise.all([
    window.mermaid?Promise.resolve():loadScript(MERMAID_SRC),
    window.DOMPurify?Promise.resolve():loadScript(PURIFY_SRC)
  ]).catch(function(e){readyP=null;throw e});
  return readyP;
}

/* mermaid keeps global state, so renders must never overlap */
var queue=Promise.resolve();
function enqueue(fn){
  var p=queue.then(fn,fn);
  queue=p.catch(noop);
  return p;
}
var lastTheme=null;
/* SVG-text labels (no foreignObject): needed for PDF export, canvas PNG
   export without tainting, and SVG files that open cleanly in Office/Figma */
function configure(theme){
  theme=theme||'default';
  if(theme===lastTheme) return;
  lastTheme=theme;
  mermaid.initialize({
    startOnLoad:false,securityLevel:'strict',theme:theme,htmlLabels:false,
    fontFamily:'"trebuchet ms",verdana,arial,sans-serif',
    flowchart:{htmlLabels:false},class:{htmlLabels:false},state:{htmlLabels:false}
  });
}

/* ================= diagram type ================= */
var TYPES=['flowchart','graph','sequenceDiagram','classDiagram-v2','classDiagram','stateDiagram-v2','stateDiagram',
  'erDiagram','journey','gantt','pie','quadrantChart','requirementDiagram','gitGraph','C4Context','C4Container',
  'C4Component','C4Dynamic','C4Deployment','mindmap','timeline','zenuml','sankey-beta','xychart-beta','block-beta','packet-beta'];
var HEADER_RE=new RegExp('^\\s*('+TYPES.map(function(t){return t.replace(/-/g,'\\-')}).join('|')+')(?![\\w-])');
var HEADER_RE_I=new RegExp(HEADER_RE.source,'i');

/* index of the first line that is real diagram code (skips front matter, comments, init directives) */
function headerIndex(lines){
  var i=0;
  while(i<lines.length&&!lines[i].trim()) i++;
  if(lines[i]&&lines[i].trim()==='---'){
    for(var j=i+1;j<lines.length;j++) if(lines[j].trim()==='---'){i=j+1;break}
  }
  for(;i<lines.length;i++){
    var t=lines[i].trim();
    if(!t||/^%%/.test(t)) continue;
    return i;
  }
  return -1;
}
function detectType(code){
  var lines=String(code||'').split('\n'),i=headerIndex(lines);
  if(i<0) return null;
  var m=HEADER_RE.exec(lines[i]);
  if(!m) return null;
  var t=m[1];
  if(t==='graph') return 'flowchart';
  return t.replace(/-v2$/,'');
}
function isFlow(code){return detectType(code)==='flowchart'}

/* ================= Markdown extraction ================= */
function extract(md){
  var lines=String(md||'').replace(/\r\n?/g,'\n').split('\n');
  var out=[],heading='',fence=null;
  for(var i=0;i<lines.length;i++){
    var ln=lines[i];
    if(!fence){
      var h=/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(ln);
      if(h){heading=h[1].replace(/[*_`]/g,'').trim();continue}
      var f=/^(\s{0,3})(`{3,}|~{3,})\s*([\w+-]*)/.exec(ln);
      if(f){fence={ch:f[2][0],len:f[2].length,lang:f[3].toLowerCase(),start:i,body:[]};}
      continue;
    }
    var c=new RegExp('^\\s{0,3}'+(fence.ch==='`'?'`':'~')+'{'+fence.len+',}\\s*$').exec(ln);
    if(c){
      if(fence.lang==='mermaid'||fence.lang==='mmd') out.push({code:fence.body.join('\n'),title:heading,line:fence.start+1,index:out.length,from:fence.start+1,to:i});
      fence=null;continue;
    }
    fence.body.push(ln);
  }
  return out;
}
/* swap the code of the n-th mermaid block; null when the document has no such block */
function replaceBlock(md,index,code){
  var src=String(md||'').replace(/\r\n?/g,'\n'),b=extract(src)[index];
  if(!b) return null;
  var lines=src.split('\n');
  lines.splice(b.from,b.to-b.from,code);
  return lines.join('\n');
}
/* paste / upload: strip a lone ```mermaid wrapper, or split a Markdown document */
function parseInput(text){
  text=String(text||'').replace(/\r\n?/g,'\n');
  var blocks=extract(text);
  if(blocks.length>1) return {blocks:blocks};
  if(blocks.length===1) return {code:blocks[0].code,unwrapped:true};
  var m=/^\s*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\s*\1\s*$/.exec(text);
  if(m) return {code:m[2],unwrapped:true};
  return {code:text};
}
function slug(s){
  return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\w\u4e00-\u9fff]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);
}
/* diagram-01, or the nearest heading when there is one; always unique */
function fileNames(blocks,ext){
  var seen={};
  return blocks.map(function(b,i){
    var base=slug(b.title)||('diagram-'+String((b.index!=null?b.index:i)+1).padStart(2,'0'));
    var name=base,n=2;
    while(seen[name]) name=base+'-'+(n++);
    seen[name]=1;
    return name+'.'+ext;
  });
}

/* ================= human-readable errors ================= */
var TOKEN_HINTS=[
  [/^(PS|PE)$/,'a parenthesis “( )” inside a node label','Wrap the label in double quotes, e.g. A["Start (init)"].'],
  [/^(SQS|SQE)$/,'a square bracket “[ ]” inside a node label','Wrap the label in double quotes, e.g. A["List [x]"].'],
  [/^(DIAMOND_START|DIAMOND_STOP)$/,'a curly brace “{ }” inside a label','Wrap the label in double quotes, e.g. A["Config {json}"].'],
  [/^(end|END)$/i,'the word “end” used as a node name','“end” is reserved in Mermaid. Rename the node, e.g. endNode[End].'],
  [/^EOF$/,'the end of the diagram too early','A bracket, quote or subgraph is probably not closed, or the last line is incomplete.'],
  [/^STR$/,'an unexpected double quote','Quotes inside a quoted label must be written as #quot;.'],
  [/^PIPE$/,'a misplaced “|”','Edge labels are written A -->|label| B.'],
  [/^(TAGEND|TAGSTART)$/,'an unexpected “>” or “<”','Check the arrow syntax: flowcharts use -->, not ->.'],
  [/^(NEWLINE|SPACE)$/,'the line ending before the statement was complete','A node label or edge is probably cut off on this line.'],
  [/LINK|ARROW|START_LINK/,'an arrow in an unexpected place','Each line should look like A --> B. Check for a doubled or broken arrow.'],
  [/^(MINUS|AMP|SEMI|COLON|QUOTE|NODE_STRING|ALPHA|TEXT|UNICODE_TEXT)$/,'text Mermaid could not attach to a node or edge','Check node IDs on this line: they must be a single word, and labels go in brackets.']
];
function errMessage(e){
  if(!e) return 'Unknown error';
  if(typeof e==='string') return e;
  return String(e.message||e.str||e);
}
function friendly(e,code){
  var raw=errMessage(e);
  var lines=String(code||'').split('\n');
  var m=/on line (\d+)/i.exec(raw)||/line[: ]+(\d+)/i.exec(raw);
  var line=m?parseInt(m[1],10):null;
  if(line&&line>lines.length) line=lines.length;
  var title,hint;
  if(/No diagram type detected|UnknownDiagram/i.test(raw)){
    line=null;
    title='Mermaid could not tell what kind of diagram this is.';
    hint='The first line must declare the diagram type, e.g. flowchart TD, sequenceDiagram or erDiagram.';
  }else if(/Lexical error/i.test(raw)){
    title='Line '+line+' contains characters Mermaid cannot read here.';
    hint='Common causes: full-width punctuation (：，（）), smart quotes, an arrow typed as -> or →, or brackets inside an unquoted label.';
  }else{
    var got=/got '([^']+)'/.exec(raw);
    var found=null;
    if(got&&/^end$/i.test(got[1])&&detectType(code)!=='flowchart') found=[0,'an “end” with no block to close','Every end must close a loop, alt, opt, par or rect block that was opened above it.'];
    else if(got) for(var i=0;i<TOKEN_HINTS.length;i++) if(TOKEN_HINTS[i][0].test(got[1])){found=TOKEN_HINTS[i];break}
    if(found){
      title=(line?'Line '+line+': ':'')+'Mermaid ran into '+found[1]+'.';
      hint=found[2];
    }else if(line){
      title='Line '+line+' has a syntax error.';
      hint='Compare it with the lines around it — a missing bracket, quote or arrow is the usual cause.';
    }else{
      title='Mermaid could not render this diagram.';
      hint=raw.split('\n')[0].slice(0,200);
    }
  }
  return {title:title,hint:hint,line:line,snippet:line?(lines[line-1]||'').trim():'',raw:raw};
}

/* ================= render ================= */
var seq=0;
function sanitizeSvg(svg){
  if(!window.DOMPurify) return '';
  return DOMPurify.sanitize(svg,{
    USE_PROFILES:{svg:true,svgFilters:true,html:true},
    ADD_TAGS:['style','foreignObject'],
    ADD_ATTR:['dominant-baseline','alignment-baseline','marker-end','marker-start','text-anchor']
  });
}
function cleanup(id){
  ['d'+id,'i'+id,id].forEach(function(x){var n=document.getElementById(x);if(n&&!n.closest('[data-mmd-keep]'))n.remove()});
}
function parseOnly(code){
  return ready().then(function(){return enqueue(function(){
    configure(lastTheme||'default');
    return Promise.resolve().then(function(){return mermaid.parse(code)}).then(function(r){
      if(r===false) throw new Error('Parse error');
      return {ok:true};
    },function(e){return {ok:false,error:friendly(e,code)}});
  })});
}
function render(code,opts){
  opts=opts||{};
  var started=Date.now();
  return ready().then(function(){return enqueue(function(){
    configure(opts.theme);
    var id='mmd'+(++seq)+'x'+Math.random().toString(36).slice(2,7);
    return Promise.resolve().then(function(){return mermaid.parse(code)}).then(function(r){
      if(r===false) throw new Error('Parse error');
      return mermaid.render(id,code);
    }).then(function(res){
      cleanup(id);
      var svg=sanitizeSvg(res.svg);
      if(!svg||svg.indexOf('<svg')<0) throw new Error('Mermaid produced an empty diagram');
      return {ok:true,svg:svg,type:detectType(code),ms:Date.now()-started};
    },function(e){
      cleanup(id);
      return {ok:false,error:friendly(e,code),type:detectType(code)};
    });
  })});
}

/* ================= syntax fixer =================
   Pure rules, run locally. Each rule rewrites the code; after every rule that
   changed something the code is re-validated and the fixer stops as soon as
   Mermaid accepts it. Nothing is applied until the user confirms the diff. */

var FW_OPEN={'（':'(','【':'[','［':'[','｛':'{'};
var FW_CLOSE={'）':')','】':']','］':']','｝':'}'};
var OPENERS=[
  ['(((',[')))']],['((',['))']],['([',['])']],['[[',[']]']],['[(',[')]']],
  ['[/',['/]','\\]']],['[\\',['\\]','/]']],['{{',['}}']],
  ['[',[']']],['(',[')']],['{',['}']],['>',[']']],
  ['（',['）',')']],['【',['】',']']],['［',['］',']']],['｛',['｝','}']]
];
function isIdChar(c){return !!c&&/[\p{L}\p{N}_$]/u.test(c)}
function isTerm(line,k){return /^($|\s|[-=.~&;<]|:::)/.test(line.slice(k))}
function findClose(line,start,closers){
  var j,c,k;
  if(line[start]==='"'){
    for(j=start+1;j<line.length;j++){
      if(line[j]!=='"') continue;
      for(k=0;k<closers.length;k++){c=closers[k];if(line.startsWith(c,j+1)&&isTerm(line,j+1+c.length)) return {pos:j+1,tok:c}}
    }
  }
  var depth=0;
  for(j=start;j<line.length;j++){
    for(k=0;k<closers.length;k++){c=closers[k];if(depth<=0&&line.startsWith(c,j)&&isTerm(line,j+c.length)) return {pos:j,tok:c}}
    var ch=line[j];
    if('([{（【［｛'.indexOf(ch)>=0) depth++;
    else if(')]}）】］｝'.indexOf(ch)>=0&&depth>0) depth--;
  }
  for(j=line.length-1;j>=start;j--){
    for(k=0;k<closers.length;k++){c=closers[k];if(line.startsWith(c,j)&&isTerm(line,j+c.length)) return {pos:j,tok:c}}
  }
  return null;
}
/* split a flowchart line into code / node-label / edge-label / string / comment segments */
function segments(line){
  var segs=[],buf='',i=0;
  var flush=function(){if(buf){segs.push({k:'code',s:buf});buf=''}};
  while(i<line.length){
    var ch=line[i];
    if(ch==='%'&&line[i+1]==='%'){flush();segs.push({k:'comment',s:line.slice(i)});return segs}
    if(ch==='"'||ch==='“'){
      var endq=-1;
      for(var q=i+1;q<line.length;q++) if(line[q]==='"'||(ch==='“'&&line[q]==='”')){endq=q;break}
      if(endq<0){buf+=line.slice(i);break}
      flush();segs.push({k:'str',body:line.slice(i+1,endq),o:ch,c:line[endq]});i=endq+1;continue;
    }
    if(ch==='|'||ch==='｜'){
      var endp=-1;
      for(var p=i+1;p<line.length;p++) if(line[p]==='|'||line[p]==='｜'){endp=p;break}
      if(endp<0){buf+=ch;i++;continue}
      flush();segs.push({k:'edge',body:line.slice(i+1,endp),o:ch,c:line[endp]});i=endp+1;continue;
    }
    if(isIdChar(line[i-1])){
      var hit=null;
      for(var o=0;o<OPENERS.length;o++){
        var op=OPENERS[o];
        if(!line.startsWith(op[0],i)) continue;
        var cl=findClose(line,i+op[0].length,op[1]);
        if(cl){hit={open:op[0],close:cl.tok,body:line.slice(i+op[0].length,cl.pos),end:cl.pos+cl.tok.length};break}
      }
      if(hit){flush();segs.push({k:'node',open:hit.open,close:hit.close,body:hit.body});i=hit.end;continue}
    }
    buf+=ch;i++;
  }
  flush();
  return segs;
}
function joinSegs(segs){
  return segs.map(function(s){
    if(s.k==='code'||s.k==='comment') return s.s;
    if(s.k==='node') return s.open+s.body+s.close;
    if(s.k==='edge') return s.o+s.body+s.c;
    return s.o+s.body+s.c;
  }).join('');
}
var KEYWORD_LINE=/^\s*(style|classDef|class|click|linkStyle|direction|%%)\b/;
function mapLines(code,fn){
  var lines=code.split('\n'),h=headerIndex(lines);
  return lines.map(function(ln,i){return (i<=h||!ln.trim())?ln:fn(ln,i)}).join('\n');
}
function mapFlowSegs(code,fn){
  return mapLines(code,function(ln){
    if(KEYWORD_LINE.test(ln)) return ln;
    var segs=segments(ln),out=[];
    segs.forEach(function(s,i){out.push(fn(s,i,segs)||s)});
    return joinSegs(out);
  });
}
function hasHeader(code){return HEADER_RE.test((code.split('\n')[headerIndex(code.split('\n'))]||''))}
function quoteBody(b){return '"'+b.replace(/"/g,'#quot;')+'"'}
function isQuoted(b){var t=b.trim();return t.length>=2&&t[0]==='"'&&t[t.length-1]==='"'}

var FW_MAP={'：':':','，':',','；':';','“':'"','”':'"','‘':"'",'’':"'",'｜':'|','＞':'>','－':'-','＝':'=','　':' ','（':'(','）':')','【':'[','】':']','［':'[','］':']','｛':'{','｝':'}'};
function asciiPunct(s){
  return s.replace(/——>|—>|–>|⟶|→|⇒/g,'-->').replace(/[：，；“”‘’｜＞－＝　（）【】［］｛｝]/g,function(c){return FW_MAP[c]});
}
var PROSE_START=/^(here('s| is| are)|this (is|diagram|flowchart|chart|shows)|the (above|diagram|flowchart|chart|following)|below is|i (have|hope|created|made)|i'(ve|ll|m)|let me|feel free|you can|hope this|explanation|key (points|features)|summary|legend|sure[,!]|certainly|of course|in this (diagram|flowchart))\b/i;
function isProse(t,type){
  t=t.trim();
  if(!t) return false;
  if(/^Note\s+(right|left|over)\b/i.test(t)) return false;
  if(PROSE_START.test(t)) return true;
  if(/^#{1,6}\s+\S/.test(t)) return true;
  if(type!=='mindmap'&&/^([-*+]|\d+\.)\s+\S/.test(t)&&!/-->|---|==>|->>/.test(t)) return true;
  if(/\*\*[^*]+\*\*/.test(t)&&!/-->|---|==>|->>|\[/.test(t)) return true;
  var words=t.split(/\s+/).length;
  if(words>=6&&/[.!?:]$/.test(t)&&!/-->|---|==>|-\.|->>|:::|[\[\](){}|]/.test(t)) return true;
  return false;
}
/* "Flowchart TD" is a mistyped header, "Graph of the flow:" is a sentence */
function looseHeader(l){
  var m=HEADER_RE_I.exec(l);
  return !!m&&/^\s*([\w-]+)?\s*;?\s*$/.test(l.slice(m.index+m[0].length));
}

var RULES=[
  {id:'invisible',name:'Removed invisible characters',
   desc:'Zero-width spaces, byte-order marks and non-breaking spaces copied from chat apps break the parser.',
   apply:function(c){
     return c.replace(/\r\n?/g,'\n').replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g,'').replace(/[\u00A0\u202F\u2007]/g,' ');
   }},
  {id:'fences',name:'Removed Markdown code fences',
   desc:'```mermaid and ``` lines belong to Markdown, not to the diagram.',
   apply:function(c){
     return c.split('\n').filter(function(l){return !/^\s*(`{3,}|~{3,})\s*(mermaid|mmd)?\s*$/i.test(l)}).join('\n');
   }},
  {id:'prose',name:'Removed explanation text around the diagram',
   desc:'Sentences like “Here is the diagram:” before or after the code are not Mermaid.',
   apply:function(c){
     var lines=c.split('\n'),type=detectType(c);
     var start=-1,i;
     for(i=0;i<lines.length;i++) if(HEADER_RE.test(lines[i])){start=i;break}
     if(start<0) for(i=0;i<lines.length;i++) if(looseHeader(lines[i])){start=i;break}
     if(start>0) lines=lines.slice(start);
     else if(start<0){while(lines.length&&(isProse(lines[0],type)||!lines[0].trim())) lines.shift()}
     var end=lines.length;
     while(end>1&&(!lines[end-1].trim()||isProse(lines[end-1],type))) end--;
     return lines.slice(0,end).join('\n');
   }},
  {id:'header-case',name:'Corrected the diagram type line',
   desc:'Diagram types are case-sensitive (flowchart, sequenceDiagram) and directions must be TD, TB, BT, LR or RL.',
   apply:function(c){
     var lines=c.split('\n'),h=headerIndex(lines);
     if(h<0||!looseHeader(lines[h])) return c;
     var m=HEADER_RE_I.exec(lines[h]);
     var want=null;
     for(var i=0;i<TYPES.length;i++) if(TYPES[i].toLowerCase()===m[1].toLowerCase()){want=TYPES[i];break}
     var rest=lines[h].slice(m.index+m[0].length);
     if(/^(flowchart|graph)$/.test(want)){
       var d=/^\s*([\w-]+)\s*;?\s*$/.exec(rest);
       var DIR={'td':'TD','tb':'TB','bt':'BT','lr':'LR','rl':'RL','topdown':'TD','top-down':'TD','top':'TD','down':'TD','vertical':'TD','leftright':'LR','left-right':'LR','left':'LR','right':'LR','horizontal':'LR'};
       if(d) rest=' '+(DIR[d[1].toLowerCase()]||d[1]);
     }
     lines[h]=lines[h].slice(0,m.index)+want+rest;
     return lines.join('\n');
   }},
  {id:'header',name:'Added the missing diagram type',
   desc:'The first line must declare the diagram type, e.g. flowchart TD.',
   apply:function(c){
     if(hasHeader(c)) return c;
     var lines=c.split('\n'),h=headerIndex(lines);
     if(h<0) return c;
     var body=lines.slice(h).join('\n');
     var head='flowchart TD';
     if(/(^|\n)\s*(participant|actor)\s|-{1,2}>>|->>/.test(body)) head='sequenceDiagram';
     else if(/\|\|--|\}o--|\|o--|--o\{|--\|\{/.test(body)) head='erDiagram';
     else if(/(^|\n)\s*\[\*\]\s*-->/.test(body)) head='stateDiagram-v2';
     lines.splice(h,0,head);
     return lines.join('\n');
   }},
  {id:'fullwidth',name:'Replaced full-width punctuation in syntax positions',
   desc:'Chinese/Japanese punctuation such as ： ， （ ） → works inside labels but not as Mermaid syntax.',
   apply:function(c){
     if(isFlow(c)){
       return mapLines(c,function(ln){
         var segs=segments(ln);
         return segs.map(function(s){
           if(s.k==='code') return asciiPunct(s.s);
           if(s.k==='node') return (FW_OPEN[s.open]||s.open)+s.body+(FW_CLOSE[s.close]||s.close);
           if(s.k==='edge') return '|'+s.body+'|';
           if(s.k==='str') return '"'+s.body+'"';
           return s.s;
         }).join('');
       });
     }
     return mapLines(c,function(ln){
       var m=/[:：]/.exec(ln);
       if(!m) return asciiPunct(ln);
       return asciiPunct(ln.slice(0,m.index))+':'+ln.slice(m.index+1);
     });
   }},
  {id:'graph-flowchart',name:'Changed graph to flowchart',
   desc:'Newer syntax (subgraph directions, extra shapes and arrows) only works with the flowchart keyword.',
   apply:function(c){
     var lines=c.split('\n'),h=headerIndex(lines);
     if(h<0||!/^\s*graph\b/.test(lines[h])) return c;
     lines[h]=lines[h].replace(/^(\s*)graph\b/,'$1flowchart');
     return lines.join('\n');
   }},
  {id:'v11-shapes',name:'Rewrote new-style node shapes',
   desc:'The A@{ shape: … } syntax needs a newer Mermaid than most tools ship; it is rewritten as classic brackets, e.g. A[(Database)].',
   apply:function(c){
     if(!isFlow(c)||c.indexOf('@{')<0) return c;
     var SH={rect:'[]',rectangle:'[]',proc:'[]',process:'[]',rounded:'()',event:'()',stadium:'([])',pill:'([])',terminal:'([])',
       circle:'(())',circ:'(())','dbl-circ':'((()))','double-circle':'((()))',diamond:'{}',diam:'{}',decision:'{}',question:'{}',
       hex:'{{}}',hexagon:'{{}}',prepare:'{{}}',cyl:'[()]',cylinder:'[()]',database:'[()]',db:'[()]',
       subproc:'[[]]',subroutine:'[[]]','fr-rect':'[[]]','lean-r':'[//]','in-out':'[//]','lean-l':'[\\\\]','out-in':'[\\\\]',flag:'>]',odd:'>]'};
     return c.replace(/([\p{L}\p{N}_$-]+)@\{([^}]*)\}/gu,function(all,id,body){
       var kv={};
       body.replace(/(\w+)\s*:\s*("([^"]*)"|[^,]+)/g,function(_,k,v,q){kv[k]=(q!=null?q:v).trim()});
       var b=SH[(kv.shape||'rect').toLowerCase()]||'[]',h=b.length/2;
       return id+b.slice(0,h)+quoteBody(kv.label||id)+b.slice(h);
     });
   }},
  {id:'arrows',name:'Fixed arrows',
   desc:'Flowcharts and state diagrams use --> (flowcharts also ==> and -.->); a single -> or => is not valid.',
   apply:function(c){
     var type=detectType(c);
     if(type==='stateDiagram') return mapLines(c,function(ln){return ln.replace(/(^|[^-])->(?!>)/g,'$1-->')});
     if(type!=='flowchart') return c;
     return mapFlowSegs(c,function(s){
       if(s.k!=='code') return;
       var t=s.s.replace(/——>|—>|–>|⟶|→/g,'-->').replace(/<->/g,'<-->').replace(/--\s+>|-\s+->/g,'-->')
         .replace(/-->>/g,'-->').replace(/(^|[^-])->>/g,'$1-->').replace(/(^|[^-=.<>])->(?![>-])/g,'$1-->').replace(/(^|[^=<])=>(?![>=])/g,'$1==>');
       return {k:'code',s:t};
     });
   }},
  {id:'link-label',name:'Fixed edge label syntax',
   desc:'Edge labels are written A -->|label| B — no extra > or arrow after the closing pipe, and a single space before the target.',
   apply:function(c){
     if(!isFlow(c)) return c;
     return mapLines(c,function(ln){
       return ln.replace(/(-->|---|==>|-\.->)\s*\|([^|]*)\|\s*>\s*/g,'$1|$2| ')
         .replace(/(^|[^-])--\s*\|([^|]*)\|\s*(-->|>)\s*/g,'$1-->|$2| ')
         .replace(/(-->|==>)\s*\|([^|]*)\|\s*(-->|==>)\s*/g,'$1|$2| ')
         .replace(/\|([^|]*)\|\s*>\s*(?=\w)/g,'|$1| ')
         .replace(/(-->|---|==>|-\.->)\|([^|]*)\|\s{2,}/g,'$1|$2| ');
     });
   }},
  {id:'quote-labels',name:'Quoted labels that contain brackets or special characters',
   desc:'Parentheses, brackets, braces, quotes or a leading slash inside a label must be wrapped in double quotes: A["Start (init)"].',
   apply:function(c){
     if(!isFlow(c)) return c;
     return mapFlowSegs(c,function(s){
       if(s.k==='node'){
         var b=s.body;
         if(isQuoted(b)||/^"`/.test(b)) return;
         if(/[()\[\]{}"|;]/.test(b)||(s.open==='['&&/^[\/\\]/.test(b))||((s.open==='['||s.open==='(')&&/[\/\\]$/.test(b)))
           return {k:'node',open:s.open,close:s.close,body:quoteBody(b)};
       }
       if(s.k==='edge'&&!isQuoted(s.body)&&/[()\[\]{}"]/.test(s.body))
         return {k:'edge',o:'|',c:'|',body:quoteBody(s.body)};
     });
   }},
  {id:'inner-quotes',name:'Escaped double quotes inside labels',
   desc:'A quote inside a quoted label ends it early; Mermaid needs #quot; instead.',
   apply:function(c){
     if(!isFlow(c)) return c;
     var fixQ=function(b){
       var t=b.trim();
       if(t.length<2||t[0]!=='"'||t[t.length-1]!=='"') return null;
       var inner=t.slice(1,-1);
       if(inner.indexOf('"')<0) return null;
       return '"'+inner.replace(/"/g,'#quot;')+'"';
     };
     return mapFlowSegs(c,function(s){
       if(s.k==='node'){var n=fixQ(s.body);if(n) return {k:'node',open:s.open,close:s.close,body:n}}
       if(s.k==='edge'){var e=fixQ(s.body);if(e) return {k:'edge',o:'|',c:'|',body:e}}
     });
   }},
  {id:'end-node',name:'Renamed the node called “end”',
   desc:'Lowercase end is a reserved word (it closes subgraphs), so it cannot be a node ID.',
   apply:function(c){
     if(!isFlow(c)) return c;
     var out=mapLines(c,function(ln){
       if(/^\s*(subgraph|classDef)\b/.test(ln)) return ln;
       var segs=segments(ln);
       var codeOnly=segs.filter(function(x){return x.k==='code'}).map(function(x){return x.s}).join('').trim();
       if(codeOnly==='end'&&segs.every(function(x){return x.k==='code'||x.k==='comment'})) return ln;
       return joinSegs(segs.map(function(s){
         return s.k==='code'?{k:'code',s:s.s.replace(/(^|[^\w])end(?![\w])/g,'$1endNode')}:s;
       }));
     });
     if(out===c||/\bendNode\s*[\[\(\{>]/.test(out)) return out;
     var done=false;
     return mapLines(out,function(ln){
       if(done||/^\s*(style|class|classDef|linkStyle|click)\b/.test(ln)) return ln;
       var r=ln.replace(/\bendNode\b(?!\s*[\[\(\{>])/,function(m){done=true;return 'endNode["end"]'});
       return r;
     });
   }},
  {id:'subgraph',name:'Quoted subgraph titles',
   desc:'A subgraph title with spaces or symbols needs an ID and a quoted label: subgraph g1["My Group"].',
   apply:function(c){
     if(!isFlow(c)) return c;
     var used={};
     c.replace(/subgraph\s+(g\d+)\b/g,function(_,id){used[id]=1});
     var n=0;
     var nextId=function(){do{n++}while(used['g'+n]);return 'g'+n};
     return mapLines(c,function(ln){
       var m=/^(\s*)subgraph\s+(.+?)\s*$/.exec(ln);
       if(!m) return ln;
       var t=m[2];
       if(/^[\w-]+$/.test(t)||/^"[^"]*"$/.test(t)) return ln;
       var b=/^([\w-]+)\s*\[(.*)\]$/.exec(t);
       if(b){
         if(isQuoted(b[2])) return ln;
         return m[1]+'subgraph '+b[1]+'['+quoteBody(b[2])+']';
       }
       if(/^[\w-]+\s*\["/.test(t)) return ln;
       return m[1]+'subgraph '+nextId()+'['+quoteBody(t.replace(/^"|"$/g,''))+']';
     });
   }},
  {id:'spaced-ids',name:'Turned multi-word node names into IDs with labels',
   desc:'Node IDs cannot contain spaces: User Login --> Home becomes User_Login["User Login"] --> Home.',
   apply:function(c){
     if(!isFlow(c)) return c;
     var OP=/(\s*(?:<?(?:-{2,}|={2,}|-\.+-)[>ox]?|&)\s*)/;
     var WORDS=/^[A-Za-z\u00C0-\uFFFF][\w\u00C0-\uFFFF]*(?: +[\w\u00C0-\uFFFF]+)+$/;
     return mapLines(c,function(ln){
       if(/^\s*(subgraph|end|style|classDef|class|click|linkStyle|direction)\b/.test(ln)) return ln;
       var segs=segments(ln);
       if(segs.some(function(s){return s.k==='code'&&/(--|==)\s+[^-=>|]+\s+(-->|==>|---)/.test(s.s)})) return ln;
       return joinSegs(segs.map(function(s,i){
         if(s.k!=='code') return s;
         var parts=s.s.split(OP);
         var beforeNode=segs[i+1]&&segs[i+1].k==='node';
         for(var p=0;p<parts.length;p+=2){
           var raw=parts[p],t=raw.trim();
           if(!WORDS.test(t)) continue;
           var id=t.replace(/\s+/g,'_');
           var lead=raw.match(/^\s*/)[0],trail=raw.match(/\s*$/)[0];
           parts[p]=lead+((beforeNode&&p===parts.length-1)?id:id+'['+quoteBody(t)+']')+trail;
         }
         return {k:'code',s:parts.join('')};
       }));
     });
   }},
  {id:'unclosed',name:'Closed unfinished blocks',
   desc:'Every subgraph, loop, alt, opt or par block needs a matching end line.',
   apply:function(c){
     var type=detectType(c),open=0;
     var OPEN=type==='flowchart'?/^\s*subgraph\b/:type==='sequenceDiagram'?/^\s*(loop|alt|opt|par|critical|break|rect|box)\b/:null;
     if(!OPEN) return c;
     c.split('\n').forEach(function(l){if(OPEN.test(l))open++;else if(/^\s*end\s*$/.test(l))open--});
     if(open<=0) return c;
     var out=c.replace(/\s+$/,'');
     for(var i=0;i<open;i++) out+='\n    end';
     return out;
   }},
  {id:'er-labels',name:'Quoted ER relationship labels',
   desc:'In erDiagram the relationship label after the colon must be one word or quoted: : "places order".',
   apply:function(c){
     if(detectType(c)!=='erDiagram') return c;
     return mapLines(c,function(ln){
       var m=/^(\s*[\w-]+\s+[|}{o.\-]{4,}\s+[\w-]+\s*:\s*)(.+?)\s*$/.exec(ln);
       if(!m||/^".*"$/.test(m[2])||/^[\w-]+$/.test(m[2])) return ln;
       return m[1]+'"'+m[2].replace(/"/g,"'")+'"';
     });
   }},
  {id:'seq-messages',name:'Fixed sequence diagram messages',
   desc:'A message needs a colon before its text (A->>B: hello), and a semicolon inside the text must be written #59;.',
   apply:function(c){
     if(detectType(c)!=='sequenceDiagram') return c;
     var ARROW=/^(\s*[^\s:>-][^:>]*?)(-->>|->>|-->|->|--x|-x|--\)|-\))([+-]?)([^:]+?)(?::(.*))?$/;
     return mapLines(c,function(ln){
       var m=ARROW.exec(ln);
       if(!m||/^\s*(Note|participant|actor|loop|alt|else|opt|par|and|critical|break|rect|end|activate|deactivate|autonumber|box|title)\b/.test(ln)) return ln;
       var target=m[4],text=m[5];
       if(text==null){
         var sp=/^(\s*\S+)\s+(.+)$/.exec(target);
         if(!sp) return ln;
         target=sp[1];text=' '+sp[2];
       }
       return m[1]+m[2]+m[3]+target+':'+text.replace(/;/g,'#59;');
     });
   }},
  {id:'pie-labels',name:'Fixed pie chart slices',
   desc:'Pie slices are written "Label" : 42 — the label needs double quotes and the value must be a plain number (no %).',
   apply:function(c){
     if(detectType(c)!=='pie') return c;
     return mapLines(c,function(ln){
       if(/^\s*(title|showData|accTitle|accDescr)\b/.test(ln)) return ln;
       var m=/^(\s*)("[^"]*"|[^":][^:]*?)\s*:\s*([\d.]+)\s*%?\s*$/.exec(ln);
       if(!m) return ln;
       var label=m[2][0]==='"'?m[2]:'"'+m[2].trim()+'"';
       return m[1]+label+' : '+m[3];
     });
   }}
];

function lineDiff(a,b){
  var A=a.split('\n'),B=b.split('\n'),n=A.length,m=B.length;
  var dp=[];
  for(var i=0;i<=n;i++){dp.push(new Array(m+1).fill(0))}
  for(i=n-1;i>=0;i--) for(var j=m-1;j>=0;j--) dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  var out=[];i=0;j=0;
  while(i<n&&j<m){
    if(A[i]===B[j]){out.push({t:'=',s:A[i]});i++;j++}
    else if(dp[i+1][j]>=dp[i][j+1]){out.push({t:'-',s:A[i]});i++}
    else{out.push({t:'+',s:B[j]});j++}
  }
  while(i<n) out.push({t:'-',s:A[i++]});
  while(j<m) out.push({t:'+',s:B[j++]});
  return out;
}
function diffHtml(a,b){
  return '<div class="mmd-diff">'+lineDiff(a,b).map(function(d){
    var cls=d.t==='+'?'add':d.t==='-'?'del':'same';
    return '<div class="dl '+cls+'"><span class="dm">'+(d.t==='='?' ':d.t)+'</span>'+(esc(d.s)||' ')+'</div>';
  }).join('')+'</div>';
}

/* render() is the real arbiter: some errors only surface during layout */
function accepts(code){
  return parseOnly(code).then(function(p){
    if(!p.ok) return p;
    return render(code,{theme:lastTheme||'default'}).then(function(r){return r.ok?{ok:true}:{ok:false,error:r.error}});
  });
}
function fix(code,opts){
  opts=opts||{};
  var original=String(code||'');
  return accepts(original).then(function(first){
    if(first.ok) return {ok:true,alreadyValid:true,code:original,original:original,applied:[]};
    track('mermaid_fix_attempt',{source:opts.source||'tool',type:detectType(original)||'unknown'});
    var cur=original.replace(/\s+$/,''),applied=[];
    var steps=[];
    for(var pass=0;pass<2;pass++) RULES.forEach(function(r){steps.push(r)});
    var idx=0;
    var step=function(){
      if(idx>=steps.length) return accepts(cur).then(function(v){
        var res={ok:v.ok,code:cur,original:original,applied:applied,error:v.ok?null:first.error,originalError:first.error};
        if(v.ok) track('mermaid_fix_success',{source:opts.source||'tool',rules:applied.map(function(r){return r.id}).join(',')});
        return res;
      });
      var rule=steps[idx++],next;
      try{next=rule.apply(cur)}catch(e){next=cur}
      if(next==null||next===cur) return step();
      if(next.trim()===cur.trim()){cur=next;return step()}
      cur=next;
      if(applied.indexOf(rule)<0) applied.push(rule);
      return accepts(cur).then(function(v){
        if(!v.ok) return step();
        track('mermaid_fix_success',{source:opts.source||'tool',rules:applied.map(function(r){return r.id}).join(',')});
        return {ok:true,code:cur,original:original,applied:applied,originalError:first.error};
      });
    };
    return step();
  });
}

/* ================= export ================= */
var SHAPES={path:1,rect:1,circle:1,ellipse:1,line:1,polyline:1,polygon:1,text:1,tspan:1,textPath:1};
var PROPS=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity'];
var TEXT_PROPS=['font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline'];
function svgBox(svg){
  var vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);
  if(vb.length===4&&vb[2]>0&&vb[3]>0) return {x:vb[0],y:vb[1],w:vb[2],h:vb[3]};
  var r=svg.getBoundingClientRect();
  return {x:0,y:0,w:r.width||800,h:r.height||600};
}
/* Office and Figma ignore most of mermaid's <style> block, so the computed
   look is written onto every shape and text node as presentation styles. */
function exportSvgEl(live,opts){
  opts=opts||{};
  var clone=live.cloneNode(true);
  var L=live.querySelectorAll('*'),C=clone.querySelectorAll('*');
  for(var i=0;i<L.length&&i<C.length;i++){
    var tag=L[i].tagName;
    if(!SHAPES[tag]) continue;
    var cs=getComputedStyle(L[i]),st=[];
    var list=(tag==='text'||tag==='tspan'||tag==='textPath')?PROPS.concat(TEXT_PROPS):PROPS;
    list.forEach(function(p){var v=cs.getPropertyValue(p);if(v&&v!=='normal'&&v!=='auto') st.push(p+':'+v)});
    if(cs.display==='none') st.push('display:none');
    C[i].setAttribute('style',st.join(';')+';'+(C[i].getAttribute('style')||''));
  }
  var box=svgBox(live);
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
  clone.setAttribute('width',Math.ceil(box.w));
  clone.setAttribute('height',Math.ceil(box.h));
  clone.style.maxWidth='';clone.style.width='';clone.style.height='';
  if(!clone.getAttribute('style')) clone.removeAttribute('style');
  if(opts.background){
    var bg=document.createElementNS('http://www.w3.org/2000/svg','rect');
    bg.setAttribute('x',box.x);bg.setAttribute('y',box.y);bg.setAttribute('width',box.w);bg.setAttribute('height',box.h);
    bg.setAttribute('fill',opts.background);
    clone.insertBefore(bg,clone.firstChild);
  }
  return {el:clone,box:box};
}
function svgString(live,opts){
  var r=exportSvgEl(live,opts);
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(r.el);
}
var MAX_SIDE=16384,MAX_AREA=1.2e8;
function pngBlob(live,opts){
  opts=opts||{};
  var r=exportSvgEl(live,opts),box=r.box;
  var scale=opts.scale||2;
  scale=Math.min(scale,MAX_SIDE/box.w,MAX_SIDE/box.h,Math.sqrt(MAX_AREA/(box.w*box.h)));
  var W=Math.max(1,Math.round(box.w*scale)),H=Math.max(1,Math.round(box.h*scale));
  r.el.setAttribute('width',W);r.el.setAttribute('height',H);
  var xml=new XMLSerializer().serializeToString(r.el);
  /* a data: URL (not blob:) keeps Safari from tainting the canvas */
  var url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);
  return new Promise(function(resolve,reject){
    var img=new Image();
    img.onload=function(){
      try{
        var cv=document.createElement('canvas');cv.width=W;cv.height=H;
        var ctx=cv.getContext('2d');
        if(opts.background){ctx.fillStyle=opts.background;ctx.fillRect(0,0,W,H)}
        ctx.drawImage(img,0,0,W,H);
        cv.toBlob(function(b){b?resolve(b):reject(new Error('PNG encoding failed'))},'image/png');
      }catch(e){reject(e)}
    };
    img.onerror=function(){reject(new Error('Could not rasterise the SVG'))};
    img.src=url;
  });
}
function download(data,name,mime){
  var blob=data instanceof Blob?data:new Blob([data],{type:mime||'application/octet-stream'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
}
function copyText(s){
  if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(s);
  return new Promise(function(resolve,reject){
    var ta=document.createElement('textarea');ta.value=s;ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy')?resolve():reject(new Error('copy failed'))}catch(e){reject(e)}
    ta.remove();
  });
}
/* the blob promise goes straight into ClipboardItem so Safari keeps the user gesture */
function copyPng(live,opts){
  if(!window.ClipboardItem||!navigator.clipboard||!navigator.clipboard.write) return Promise.reject(new Error('Clipboard images are not supported in this browser'));
  return navigator.clipboard.write([new ClipboardItem({'image/png':pngBlob(live,opts)})]);
}

/* ---- minimal ZIP (store, no compression; PNG/SVG compress poorly anyway) ---- */
var CRC=null;
function crc32(u8){
  if(!CRC){CRC=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC[n]=c>>>0}}
  var crc=0xFFFFFFFF;
  for(var i=0;i<u8.length;i++) crc=CRC[(crc^u8[i])&0xFF]^(crc>>>8);
  return (crc^0xFFFFFFFF)>>>0;
}
function toBytes(d){
  if(d instanceof Uint8Array) return Promise.resolve(d);
  if(d instanceof Blob) return d.arrayBuffer().then(function(b){return new Uint8Array(b)});
  return Promise.resolve(new TextEncoder().encode(String(d)));
}
function zip(files){
  return Promise.all(files.map(function(f){return toBytes(f.data)})).then(function(datas){
    var enc=new TextEncoder(),parts=[],central=[],offset=0;
    var now=new Date();
    var time=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
    var date=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
    files.forEach(function(f,i){
      var name=enc.encode(f.name),data=datas[i],crc=crc32(data);
      var h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);
      h.setUint16(10,time,true);h.setUint16(12,date,true);h.setUint32(14,crc,true);
      h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
      parts.push(new Uint8Array(h.buffer),name,data);
      var c=new DataView(new ArrayBuffer(46));
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);
      c.setUint16(12,time,true);c.setUint16(14,date,true);c.setUint32(16,crc,true);
      c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);
      c.setUint32(42,offset,true);
      central.push(new Uint8Array(c.buffer),name);
      offset+=30+name.length+data.length;
    });
    var cdSize=central.reduce(function(s,p){return s+p.length},0);
    var e=new DataView(new ArrayBuffer(22));
    e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
    e.setUint32(12,cdSize,true);e.setUint32(16,offset,true);
    return new Blob(parts.concat(central,[new Uint8Array(e.buffer)]),{type:'application/zip'});
  });
}

/* ================= share links (code lives in the URL hash only) ================= */
function b64u(bytes){
  var s='';for(var i=0;i<bytes.length;i+=0x8000) s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unb64u(s){
  s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';
  var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;
}
function streamBytes(bytes,stream){
  return new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(function(b){return new Uint8Array(b)});
}
function encodeShare(code){
  var raw=new TextEncoder().encode(code);
  if(window.CompressionStream){
    return streamBytes(raw,new CompressionStream('deflate-raw')).then(function(z){return 'z.'+b64u(z)},function(){return 'b.'+b64u(raw)});
  }
  return Promise.resolve('b.'+b64u(raw));
}
function decodeShare(token){
  try{
    var kind=token.slice(0,2),bytes=unb64u(token.slice(2));
    if(kind==='z.'){
      if(!window.DecompressionStream) return Promise.reject(new Error('unsupported'));
      return streamBytes(bytes,new DecompressionStream('deflate-raw')).then(function(u){return new TextDecoder().decode(u)});
    }
    if(kind==='b.') return Promise.resolve(new TextDecoder().decode(bytes));
  }catch(e){}
  return Promise.reject(new Error('bad link'));
}

/* ================= analytics hook =================
   Events go to GA4 (gtag) or, without gtag, to a GTM dataLayer, and are
   also dispatched as `omf:track`. Diagram code is never included.
   GA4 drops parameter values longer than 100 characters. */
function track(name,props){
  var p={};
  Object.keys(props||{}).forEach(function(k){
    var v=props[k];
    p[k]=typeof v==='number'?v:String(v).slice(0,100);
  });
  props=p;
  try{
    if(typeof window.gtag==='function') window.gtag('event',name,props);
    else if(Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({event:name},props));
    (window.__omfEvents=window.__omfEvents||[]).push({name:name,props:props,t:Date.now()});
    document.dispatchEvent(new CustomEvent('omf:track',{detail:{name:name,props:props}}));
  }catch(e){}
}

/* ================= fix dialog (used by the .md reader) ================= */
function fixDialog(result,onAccept){
  ensureCss();
  var ov=document.createElement('div');
  ov.className='mmd-modal-ov';
  var body;
  if(result.alreadyValid){
    body='<h3>Nothing to fix</h3><p class="mmd-muted">This diagram already renders without errors.</p>'
      +'<div class="mmd-modal-actions"><button class="btn primary" data-act="close">OK</button></div>';
  }else if(result.ok){
    body='<h3>We can fix this diagram</h3>'
      +'<p class="mmd-muted">Review the changes below. Nothing is replaced until you apply them.</p>'
      +'<ul class="mmd-rules">'+result.applied.map(function(r){return '<li><strong>'+esc(r.name)+'</strong> — '+esc(r.desc)+'</li>'}).join('')+'</ul>'
      +diffHtml(result.original,result.code)
      +'<div class="mmd-modal-actions"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="apply">Apply fix</button></div>';
  }else{
    var e=result.originalError||{};
    body='<h3>Automatic fix did not work</h3>'
      +'<p class="mmd-muted">'+esc(e.title||'')+' '+esc(e.hint||'')+'</p>'
      +(e.snippet?'<pre class="mmd-snip">'+esc(e.snippet)+'</pre>':'')
      +'<p class="mmd-muted">Open it in the <a href="/fix-mermaid-syntax/">Mermaid syntax fixer</a> to edit the highlighted line by hand.</p>'
      +'<div class="mmd-modal-actions"><button class="btn primary" data-act="close">Close</button></div>';
  }
  ov.innerHTML='<div class="mmd-modal" role="dialog" aria-modal="true">'+body+'</div>';
  var close=function(){ov.remove();document.removeEventListener('keydown',onKey)};
  var onKey=function(e){if(e.key==='Escape')close()};
  ov.addEventListener('click',function(e){
    if(e.target===ov) return close();
    var act=e.target.getAttribute&&e.target.getAttribute('data-act');
    if(act==='close') close();
    if(act==='apply'){close();onAccept&&onAccept(result.code)}
  });
  document.addEventListener('keydown',onKey);
  document.body.appendChild(ov);
  var b=ov.querySelector('[data-act="apply"]')||ov.querySelector('[data-act="close"]');if(b)b.focus();
}

window.MermaidKit={
  version:MERMAID_VERSION,ready:ready,ensureCss:ensureCss,
  render:render,parse:parseOnly,fix:fix,rules:RULES,friendly:friendly,
  detectType:detectType,extract:extract,replaceBlock:replaceBlock,parseInput:parseInput,fileNames:fileNames,slug:slug,
  lineDiff:lineDiff,diffHtml:diffHtml,fixDialog:fixDialog,
  svgString:svgString,pngBlob:pngBlob,copyPng:copyPng,copyText:copyText,download:download,zip:zip,
  encodeShare:encodeShare,decodeShare:decodeShare,track:track,esc:esc,
  _segments:segments
};
})();
