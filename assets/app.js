/* openmdfile · app.js  © 2026 CCC Studio
   Shared: i18n, theme, SVG sprite, viewer (open/render/export). */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};

/* ================= i18n ================= */
var JT={
 en:{sizes:['Small','Medium','Large'],size:'Text size: ',over:'is over 10 MB',notmd:'is not a Markdown file',
     binary:'looks like a binary file',nothing:'Nothing to render',url:'Enter a URL',fetching:'Fetching…',
     fetchfail:'Could not fetch that URL (CORS or network). Try a raw.githubusercontent.com link.',
     copied:'Copied — paste into Word, Google Docs, or email',clipfail:'Clipboard blocked — try Ctrl/Cmd+C after selecting',
     word:'Word document downloaded',clip:'Rendered from clipboard',
     imgmiss:"Image not found — relative paths can't load from a single file",by:'rendered by openmdfile',
     pdfgen:'Generating PDF…',pdfok:'PDF downloaded',copysrc:'Markdown source copied',pdffail:'PDF export failed — use the print button instead'},
 zh:{sizes:['小','中','大'],size:'字号：',over:'超过 10 MB',notmd:'不是 Markdown 文件',
     binary:'疑似二进制文件，无法渲染',nothing:'没有可渲染的内容',url:'请输入链接',fetching:'获取中…',
     fetchfail:'无法获取该链接（跨域或网络问题），请改用 raw.githubusercontent.com 直链',
     copied:'已复制——可直接粘贴到 Word / Google Docs / 邮件',clipfail:'剪贴板被拦截——请选中内容后 Ctrl/Cmd+C',
     word:'Word 文档已下载',clip:'已渲染剪贴板内容',
     imgmiss:'图片未找到——单文件无法加载相对路径图片',by:'由 openmdfile 渲染',
     pdfgen:'正在生成 PDF…',pdfok:'PDF 已下载',copysrc:'已复制 Markdown 源码',pdffail:'PDF 生成失败——请改用打印按钮'},
 ar:{sizes:['صغير','متوسط','كبير'],size:'حجم النص: ',over:'يتجاوز 10 ميغابايت',notmd:'ليس ملف ماركداون',
     binary:'يبدو أنه ملف ثنائي',nothing:'لا يوجد محتوى للعرض',url:'أدخل رابطًا',fetching:'جارٍ الجلب…',
     fetchfail:'تعذّر جلب الرابط (قيود CORS أو الشبكة). جرّب رابط raw.githubusercontent.com',
     copied:'تم النسخ — الصقه في Word أو Google Docs أو البريد',clipfail:'تم حظر الحافظة — حدّد المحتوى ثم اضغط Ctrl/Cmd+C',
     word:'تم تنزيل مستند Word',clip:'تم العرض من الحافظة',
     imgmiss:'الصورة غير موجودة — لا يمكن تحميل المسارات النسبية من ملف واحد',by:'معروض بواسطة openmdfile',
     pdfgen:'جارٍ إنشاء PDF…',pdfok:'تم تنزيل ملف PDF',copysrc:'تم نسخ شيفرة ماركداون',pdffail:'تعذّر إنشاء PDF — استخدم زر الطباعة'},
 hi:{sizes:['छोटा','मध्यम','बड़ा'],size:'टेक्स्ट आकार: ',over:'10 MB से बड़ी है',notmd:'Markdown फ़ाइल नहीं है',
     binary:'बाइनरी फ़ाइल लगती है',nothing:'रेंडर करने के लिए कुछ नहीं',url:'URL दर्ज करें',fetching:'लाया जा रहा है…',
     fetchfail:'यह URL नहीं मिल सका (CORS या नेटवर्क). raw.githubusercontent.com लिंक आज़माएँ',
     copied:'कॉपी हो गया — Word, Google Docs या ईमेल में पेस्ट करें',clipfail:'क्लिपबोर्ड ब्लॉक है — चुनकर Ctrl/Cmd+C दबाएँ',
     word:'Word दस्तावेज़ डाउनलोड हो गया',clip:'क्लिपबोर्ड से रेंडर किया गया',
     imgmiss:'छवि नहीं मिली — एकल फ़ाइल से सापेक्ष पथ लोड नहीं हो सकते',by:'openmdfile द्वारा रेंडर',
     pdfgen:'PDF बनाया जा रहा है…',pdfok:'PDF डाउनलोड हो गया',copysrc:'Markdown स्रोत कॉपी हो गया',pdffail:'PDF नहीं बना — प्रिंट बटन का उपयोग करें'}
};
/* c = ISO 639-1 language code (used by hreflang/html lang — must stay hi/ar)
   n = native name shown in the switcher */
var LANGS=[{c:'en',n:'English'},{c:'zh',n:'简体中文'},
           {c:'ar',n:'العربية'},{c:'hi',n:'हिन्दी'}];
var RTL={ar:1};
/* country -> language preset (used only when the browser language gives no hint) */
var GEO2LANG={
  CN:'zh',TW:'zh',HK:'zh',MO:'zh',SG:'zh',
  IN:'hi',
  SA:'ar',AE:'ar',EG:'ar',QA:'ar',KW:'ar',BH:'ar',OM:'ar',JO:'ar',LB:'ar',IQ:'ar',
  LY:'ar',DZ:'ar',MA:'ar',TN:'ar',SD:'ar',YE:'ar',SY:'ar',PS:'ar',MR:'ar'
};
var LANG_SRC='default';
function detectLang(){
  var q=(location.search.match(/[?&]lang=([a-zA-Z-]+)/)||[])[1];
  if(q){q=q.toLowerCase().split('-')[0];if(JT[q]){LANG_SRC='param';return q}}
  var s=localStorage.getItem('omf-lang'); if(s&&JT[s]){LANG_SRC='saved';return s}
  var langs=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'en'];
  for(var i=0;i<langs.length;i++){
    var n=(langs[i]||'').toLowerCase();
    if(n.indexOf('zh')===0){LANG_SRC='nav';return 'zh'}
    if(n.indexOf('ar')===0){LANG_SRC='nav';return 'ar'}
    if(n.indexOf('hi')===0){LANG_SRC='nav';return 'hi'}
    if(n.indexOf('en')===0){LANG_SRC='nav-en';return 'en'}
  }
  return 'en';
}
var LANG=detectLang();
/* IP/country preset — only for first-time visitors whose browser language
   matched nothing (or matched generic English). Never overrides an explicit
   ?lang= or a saved choice. Country is read from the CDN edge, not stored. */
function geoPreset(){
  if(LANG_SRC==='param'||LANG_SRC==='saved'||LANG_SRC==='nav')return;
  var done=function(cc){
    var g=GEO2LANG[(cc||'').toUpperCase()];
    if(!g||g===LANG)return;
    if(LANG_SRC==='nav-en'&&g!=='ar'&&g!=='zh'&&g!=='hi')return;
    LANG=g; applyLang();
    if(files.length&&$('#reader')&&$('#reader').style.display==='block') renderActive();
  };
  try{
    fetch('/geo',{cache:'no-store'}).then(function(r){return r.ok?r.json():null})
      .then(function(j){ if(j&&j.country) done(j.country) }).catch(function(){});
  }catch(e){}
}
function t(k){return (JT[LANG]||JT.en)[k]}

/* SEO: default H1 is EN-only in HTML (no zh/ar/hi glyphs in <h1>); lang switcher swaps from this map.
   Values may contain <em> markup (static strings, ours). EN restores the original server HTML. */
(function(){
  var path=(location.pathname||'/').replace(/\/index\.html$/,'/').replace(/\/+$/,'')||'/';
  var maps={
    "/":{"en": "Open MD File Online", "zh": "在线打开 MD 文件", "ar": "افتح ملف MD عبر الإنترنت", "hi": "ऑनलाइन MD फ़ाइल खोलें"},
    "/how-to-open-md-file":{"en": "How to Open an MD File", "zh": "如何打开 MD 文件", "ar": "كيف تفتح ملف MD", "hi": "MD फ़ाइल कैसे खोलें"},
    "/learn/open-markdown-without-uploading":{"en": "How to open a Markdown file <em>without uploading</em> it", "zh": "如何<em>不上传</em>打开 Markdown 文件", "ar": "كيف تفتح ملف ماركداون <em>دون رفعه</em>", "hi": "Markdown फ़ाइल को <em>अपलोड किए बिना</em> कैसे खोलें"},
    "/markdown-reader":{"en": "Markdown Reader — <em>source</em> and <em>preview</em>, side by side", "zh": "Markdown 阅读器——<em>源码</em>与<em>预览</em>左右对照", "ar": "قارئ ماركداون — <em>الشيفرة</em> و<em>المعاينة</em> جنبًا إلى جنب", "hi": "मार्कडाउन रीडर — <em>स्रोत</em> और <em>प्रीव्यू</em> साथ-साथ"},
    "/md-to-pdf":{"en": "MD to <em>PDF</em> Converter — Free, No Watermark", "zh": "MD 转 <em>PDF</em> 转换器——免费、无水印", "ar": "محوّل MD إلى <em>PDF</em> — مجاني وبدون علامة مائية", "hi": "MD से <em>PDF</em> कन्वर्टर — मुफ़्त, बिना वॉटरमार्क"},
    "/md-to-word":{"en": "MD to <em>Word</em> — keep it editable", "zh": "MD 转 <em>Word</em>——保持可编辑", "ar": "MD إلى <em>Word</em> — يبقى قابلًا للتحرير", "hi": "MD से <em>Word</em> — संपादन-योग्य रखें"},
    "/md-viewer":{"en": "MD Viewer — view <em>Markdown</em> files online", "zh": "MD 查看器——在线查看 <em>Markdown</em> 文件", "ar": "عارض MD — اعرض ملفات <em>ماركداون</em> عبر الإنترنت", "hi": "MD व्यूअर — <em>Markdown</em> फ़ाइलें ऑनलाइन देखें"},
    "/privacy":{"en": "Privacy Policy", "zh": "隐私协议", "ar": "سياسة الخصوصية", "hi": "गोपनीयता नीति"},
    "/terms":{"en": "Terms of Service", "zh": "服务条款", "ar": "شروط الخدمة", "hi": "सेवा की शर्तें"},
    "/what-is-an-md-file":{"en": "What is an <em>.md</em> file?", "zh": "什么是 <em>.md</em> 文件？", "ar": "ما هو ملف <em>.md</em>؟", "hi": "<em>.md</em> फ़ाइल क्या है?"}
  };
  window.PAGE_H1_I18N=maps[path]||null;
  /* FAQ: default HTML is EN-only (matches FAQPage JSON-LD); zh/ar/hi Q&A swapped in by applyLang. */
  var faq={
"/md-viewer": {
"zh": [
[
"这个 MD 查看器支持手机吗？",
"支持。查看器完全响应式，任何现代手机浏览器都可使用——打开页面、点击选择文件即可阅读。"
],
[
"支持哪些 Markdown 特性？",
"完整 GFM：标题、表格、任务列表、删除线、带高亮的代码块、图片，另支持 Mermaid 图表与 KaTeX 数学公式。"
],
[
"有文件大小限制吗？",
"支持最大 10 MB 的文件，足以覆盖几乎所有实际场景的 Markdown 文档。"
]
],
"ar": [
[
"هل يعمل عارض MD على الهاتف؟",
"نعم. العارض متجاوب بالكامل ويعمل في أي متصفح هاتف حديث — افتح الصفحة، اضغط «اختر ملفًا»، واقرأ."
],
[
"ما ميزات ماركداون المدعومة؟",
"صيغة GitHub-flavored Markdown كاملة: العناوين والجداول وقوائم المهام والشطب وكتل الشيفرة مع التمييز والصور، إضافة إلى مخططات Mermaid ومعادلات KaTeX."
],
[
"هل هناك حد لحجم الملف؟",
"يدعم الملفات حتى 10 ميغابايت، وهو ما يغطي عمليًا كل مستندات ماركداون الواقعية."
]
],
"hi": [
[
"क्या यह MD व्यूअर मोबाइल पर काम करता है?",
"हाँ। व्यूअर पूरी तरह रिस्पॉन्सिव है और किसी भी आधुनिक मोबाइल ब्राउज़र में चलता है — पेज खोलें, “फ़ाइल चुनें” दबाएँ, और पढ़ें।"
],
[
"कौन-सी Markdown सुविधाएँ समर्थित हैं?",
"पूरा GitHub-flavored Markdown: हेडिंग, टेबल, टास्क लिस्ट, स्ट्राइकथ्रू, सिंटैक्स हाइलाइटिंग वाले कोड ब्लॉक, इमेज, साथ ही Mermaid डायग्राम और KaTeX गणित।"
],
[
"क्या फ़ाइल आकार की कोई सीमा है?",
"10 MB तक की फ़ाइलें समर्थित हैं, जो व्यावहारिक रूप से हर वास्तविक Markdown दस्तावेज़ को कवर करती हैं।"
]
]
},
"/markdown-reader": {
"zh": [
[
"可以同时看到 Markdown 源码和预览吗？",
"可以。本页默认以分栏视图打开文件：左边源码、右边渲染文档，两栏都完整展开。点击\"阅读\"按钮可收成单栏阅读模式。"
],
[
"可以同时阅读多个 MD 文件吗？",
"可以——一次拖入多个文件，通过阅读器顶部的标签页切换。"
],
[
"暗色模式对文档内容也生效吗？",
"生效。整篇文档（包括代码块与图表）都会切换到暗色配色。"
]
],
"ar": [
[
"هل يمكنني رؤية شيفرة ماركداون والمعاينة في آنٍ واحد؟",
"نعم. تفتح هذه الصفحة الملفات في عرض مقسوم افتراضيًا: الشيفرة على جانب والمستند المعروض على الجانب الآخر، وكلاهما معروض بالكامل. واستخدم زر «قراءة» لطيّه إلى عمود قراءة واحد."
],
[
"هل يمكنني قراءة عدة ملفات MD معًا؟",
"نعم — أفلت عدة ملفات دفعة واحدة وتنقّل بينها عبر التبويبات أعلى القارئ."
],
[
"هل يعمل الوضع الداكن على المستند أيضًا؟",
"نعم، ينتقل المستند بالكامل — بما في ذلك كتل الشيفرة والمخططات — إلى لوحة ألوان داكنة."
]
],
"hi": [
[
"क्या मैं Markdown स्रोत और प्रीव्यू एक साथ देख सकता हूँ?",
"हाँ। यह पेज फ़ाइलें डिफ़ॉल्ट रूप से स्प्लिट व्यू में खोलता है: एक ओर स्रोत, दूसरी ओर रेंडर दस्तावेज़, दोनों पूरे दिखते हैं। \"पढ़ें\" बटन से इसे एक पठन कॉलम में समेटें।"
],
[
"क्या एक साथ कई MD फ़ाइलें पढ़ सकते हैं?",
"हाँ — कई फ़ाइलें एक साथ छोड़ें और रीडर के ऊपर टैब से उनके बीच स्विच करें।"
],
[
"क्या डार्क मोड दस्तावेज़ पर भी लागू होता है?",
"हाँ, पूरा दस्तावेज़ — कोड ब्लॉक और डायग्राम सहित — डार्क पैलेट में बदल जाता है।"
]
]
},
"/md-to-pdf": {
"zh": [
[
"PDF 有水印或页数限制吗？",
"没有。导出完全免费，无水印、无页数限制、无需注册。"
],
[
"表格和代码的格式会保留吗？",
"会。PDF 直接从渲染后的文档生成，表格、高亮代码、图表与公式与屏幕预览一致。"
],
[
"转换时我的 Markdown 会被上传吗？",
"绝不会。PDF 由浏览器本地运行的 JavaScript 生成，文件始终留在你的设备上。"
]
],
"ar": [
[
"هل يحتوي ملف PDF على علامة مائية أو قيود؟",
"لا. التصدير مجاني تمامًا: بلا علامة مائية وبلا حدّ للصفحات وبلا تسجيل."
],
[
"هل تحافظ الجداول والشيفرة على تنسيقها؟",
"نعم. يُنشأ ملف PDF مباشرةً من المستند المعروض، لذا تطابق الجداول والشيفرة المميّزة والمخططات والمعادلات ما تراه على الشاشة."
],
[
"هل يُرفع ملف ماركداون أثناء التحويل؟",
"إطلاقًا. يُنشأ ملف PDF عبر JavaScript يعمل محليًا في متصفحك، ويبقى الملف على جهازك."
]
],
"hi": [
[
"क्या PDF पर वॉटरमार्क या सीमा है?",
"नहीं। एक्सपोर्ट पूरी तरह मुफ़्त है — न वॉटरमार्क, न पेज सीमा, न साइन-अप।"
],
[
"क्या टेबल और कोड की फ़ॉर्मैटिंग बनी रहेगी?",
"हाँ। PDF सीधे रेंडर किए दस्तावेज़ से बनती है, इसलिए टेबल, हाइलाइटेड कोड, डायग्राम और सूत्र स्क्रीन प्रीव्यू जैसे ही रहते हैं।"
],
[
"क्या रूपांतरण के दौरान मेरा Markdown अपलोड होता है?",
"कभी नहीं। PDF आपके ब्राउज़र में लोकल चल रहे JavaScript से बनती है; फ़ाइल आपके डिवाइस पर ही रहती है।"
]
]
},
"/md-to-word": {
"zh": [
[
"Word 文件可以编辑吗？",
"可以——输出是普通的可编辑文档，标题、表格、列表、代码块都能在 Word 中修改。"
],
[
"支持 Google Docs 吗？",
"支持。使用“复制富文本”直接粘贴到 Google Docs，格式保持不变。"
],
[
"有水印或收费吗？",
"没有。转换免费、不限次数、无水印，文件也绝不上传。"
]
],
"ar": [
[
"هل يكون ملف Word قابلًا للتحرير؟",
"نعم — المخرجات مستند عادي قابل للتحرير، ويمكن تعديل العناوين والجداول والقوائم وكتل الشيفرة داخل Word."
],
[
"هل يعمل مع Google Docs؟",
"نعم. استخدم «انسخ نصًا منسقًا» والصقه مباشرة في Google Docs مع الحفاظ على التنسيق."
],
[
"هل توجد علامة مائية أو رسوم؟",
"لا. التحويل مجاني وغير محدود وبلا علامة مائية، وملفك لا يُرفع أبدًا."
]
],
"hi": [
[
"क्या Word फ़ाइल संपादन-योग्य होगी?",
"हाँ — आउटपुट एक सामान्य संपादन-योग्य दस्तावेज़ है। हेडिंग, टेबल, सूचियाँ और कोड ब्लॉक सभी Word में बदले जा सकते हैं।"
],
[
"क्या यह Google Docs के साथ काम करता है?",
"हाँ। “रिच टेक्स्ट कॉपी करें” का उपयोग करें और सीधे Google Docs में पेस्ट करें — फ़ॉर्मैटिंग बनी रहती है।"
],
[
"क्या कोई वॉटरमार्क या शुल्क है?",
"नहीं। रूपांतरण मुफ़्त, असीमित और वॉटरमार्क-रहित है, और आपकी फ़ाइल कभी अपलोड नहीं होती।"
]
]
},
"/what-is-an-md-file": {
"zh": [
[
"MD 文件打开安全吗？",
"安全。.md 是纯文本，不可能包含可执行代码，用查看器或文本编辑器打开都没有风险。"
],
[
"MD 文件可以编辑吗？",
"可以——任何文本编辑器都行（记事本、TextEdit、VS Code）。本站专注阅读与导出；编辑用普通编辑器即可。"
],
[
".md 和 .markdown 是同一种文件吗？",
"是的，两者是同一格式的不同扩展名。本查看器都支持，另外还支持 .txt。"
]
],
"ar": [
[
"هل فتح ملف MD آمن؟",
"نعم. ملف .md نص بسيط ولا يمكن أن يحتوي شيفرة قابلة للتنفيذ، لذا فتحه في عارض أو محرر نصوص آمن تمامًا."
],
[
"هل يمكنني تحرير ملف MD؟",
"نعم — أي محرر نصوص يفي بالغرض (المفكرة، TextEdit، VS Code). يركّز هذا الموقع على القراءة والتصدير، أما التحرير فيكفيه محرر بسيط."
],
[
"هل .md و .markdown الصيغة نفسها؟",
"نعم، هما امتدادان للصيغة ذاتها. ويدعم هذا العارض كليهما إضافة إلى .txt."
]
],
"hi": [
[
"क्या MD फ़ाइल खोलना सुरक्षित है?",
"हाँ। .md सादा टेक्स्ट है और इसमें निष्पादन-योग्य कोड नहीं हो सकता। इसे व्यूअर या टेक्स्ट एडिटर में खोलना सुरक्षित है।"
],
[
"क्या MD फ़ाइल संपादित कर सकते हैं?",
"हाँ — कोई भी टेक्स्ट एडिटर काम करता है (Notepad, TextEdit, VS Code)। यह साइट पढ़ने और एक्सपोर्ट पर केंद्रित है; संपादन के लिए साधारण एडिटर पर्याप्त है।"
],
[
"क्या .md और .markdown एक ही हैं?",
"हाँ, ये एक ही फ़ॉर्मैट के दो एक्सटेंशन हैं। यह व्यूअर दोनों के साथ .txt भी खोलता है।"
]
]
},
"/learn/open-markdown-without-uploading": {
"zh": [
[
"需要安装软件吗？",
"不需要。页面与库加载后，选择 .md 即用浏览器 File API 本地读取——无需安装、不会上传。"
],
[
"支持 GitHub Flavored Markdown（GFM）吗？",
"支持。含表格、任务列表、代码高亮、删除线，以及页面已加载相应库时的 Mermaid 图与 KaTeX 公式等。"
],
[
"和 mdtohtml.app 有什么区别？",
"openmdfile 用于打开、阅读并导出为文档（预览 / PDF / Word）。mdtohtml.app 是姊妹工具，把 Markdown 转成或发布为网页 HTML。阅读用前者，要 HTML 输出用后者。"
],
[
"你们的服务器会记录我的 Markdown 正文吗？",
"不会。预览与 PDF/Word 导出时正文不离开浏览器；我们收不到、也不存储你的文档。CDN、语言国家提示、页面分析等可选请求都不包含 Markdown 正文。"
],
[
"支持哪些格式与大小限制？",
"仅 <code>.md</code>、<code>.markdown</code>、<code>.txt</code>。软限制约 <strong>10 MB</strong>——更大文件请用桌面编辑器。"
],
[
"本地拖放预览或导出 PDF/Word 会上传正文吗？",
"不会。本地拖放用浏览器 File API 在标签页内读取；预览与 PDF/Word 导出<strong>不会</strong>把文档正文上传到我们的服务器。"
],
[
"“从 URL 打开”是零网络路径吗？",
"不是。浏览器会请求你填写的远端主机——这不是零网络路径。即便本地文件，CDN 脚本与可选的 geo 语言提示仍可能加载；它们不包含你的 Markdown 正文。"
]
],
"ar": [
[
"هل أحتاج إلى تثبيت أي شيء؟",
"لا. بعد تحميل الصفحة ومكتباتها، اختيار ملف .md يقرأه محليًا عبر File API — بلا تثبيت وبلا رفع."
],
[
"هل يدعم GitHub Flavored Markdown (GFM)؟",
"نعم. يشمل الجداول وقوائم المهام والتعليمات البرمجية المظللة والمخططات والرياضيات عند توفر المكتبات."
],
[
"ما الفرق عن mdtohtml.app؟",
"openmdfile للقراءة والتصدير كمستند؛ mdtohtml.app أداة شقيقة لتحويل/نشر ماركداون كـ HTML للويب."
],
[
"هل تسجّل خوادمكم محتوى ملف الماركداون؟",
"لا. لا يغادر المحتوى متصفحك للمعاينة أو التصدير، ولا نستلم مستندك ولا نخزّنه."
],
[
"ما الصيغ وحدود الحجم المدعومة؟",
"فقط <code>.md</code> و<code>.markdown</code> و<code>.txt</code>. حد مرن نحو <strong>10 ميغابايت</strong> — للملفات الأكبر استخدم محررًا مكتبيًا."
],
[
"هل يرفع الإفلات المحلي المستند للمعاينة أو PDF/Word؟",
"لا. الإفلات المحلي يستخدم File API في تبويبك. المعاينة وتصدير PDF/Word <em>لا</em> ترفع نص المستند إلى خوادمنا."
],
[
"هل «فتح من رابط» مسار بلا شبكة؟",
"لا. متصفحك يجلب المضيف البعيد الذي كتبته — ليس مسارًا بلا شبكة. حتى مع الملفات المحلية قد تُحمَّل سكربتات CDN وتلميح geo اختياري؛ ولا تتضمن نص الماركداون."
]
],
"hi": [
[
"क्या कुछ इंस्टॉल करना होगा?",
"नहीं। पेज और लाइब्रेरी लोड होने के बाद .md चुनने पर File API से लोकल पढ़ा जाता है — इंस्टॉल नहीं, अपलोड नहीं।"
],
[
"क्या GitHub Flavored Markdown (GFM) सपोर्ट है?",
"हाँ। टेबल, टास्क लिस्ट, कोड हाइलाइट, तथा पेज पर लाइब्रेरी होने पर Mermaid/KaTeX आदि।"
],
[
"mdtohtml.app से क्या अलग है?",
"openmdfile पढ़ने और दस्तावेज़ एक्सपोर्ट के लिए है; mdtohtml.app बहन टूल है — Markdown को वेब HTML में कन्वर्ट/पब्लिश करने के लिए।"
],
[
"क्या आपके सर्वर मेरी Markdown सामग्री लॉग करते हैं?",
"नहीं। प्रीव्यू या PDF/Word के लिए सामग्री ब्राउज़र नहीं छोड़ती; हम दस्तावेज़ प्राप्त या संग्रहित नहीं करते।"
],
[
"कौन से फ़ॉर्मैट और साइज़ सीमाएँ?",
"केवल <code>.md</code>, <code>.markdown</code>, और <code>.txt</code>। नरम सीमा लगभग <strong>10 MB</strong> — बड़ी फ़ाइलें डेस्कटॉप एडिटर में खोलें।"
],
[
"क्या लोकल ड्रॉप प्रीव्यू या PDF/Word के लिए दस्तावेज़ अपलोड करता है?",
"नहीं। लोकल ड्रॉप आपके टैब में File API इस्तेमाल करता है। प्रीव्यू और PDF/Word एक्सपोर्ट दस्तावेज़ बॉडी हमारे सर्वर पर <em>अपलोड नहीं</em> करते।"
],
[
"क्या “URL से खोलें” ज़ीरो-नेटवर्क पथ है?",
"नहीं। ब्राउज़र आपके लिखे रिमोट होस्ट को फ़ेच करता है — यह ज़ीरो-नेटवर्क पथ नहीं है। लोकल फ़ाइलों पर भी CDN स्क्रिप्ट और वैकल्पिक geo भाषा संकेत लोड हो सकते हैं; उनमें आपका Markdown टेक्स्ट नहीं होता।"
]
]
}
};
  window.PAGE_FAQ_I18N=faq[path]||null;
})();

function applyLang(){
  var h=document.documentElement;
  h.setAttribute('data-lang',LANG);
  var pageH1=document.getElementById('pageH1');
  if(pageH1){
    if(pageH1.__enHTML==null) pageH1.__enHTML=pageH1.innerHTML;
    var map=window.PAGE_H1_I18N||{};
    var hv=(LANG!=='en'&&map[LANG])?map[LANG]:null;
    pageH1.innerHTML=hv||pageH1.__enHTML;
    if(LANG==='ar') pageH1.setAttribute('dir','rtl'); else pageH1.removeAttribute('dir');
  }
  var fm=window.PAGE_FAQ_I18N;
  if(fm){
    var fl=(LANG!=='en'&&fm[LANG])?fm[LANG]:null;
    document.querySelectorAll('.faq > details').forEach(function(d,i){
      var s=d.querySelector('summary'),p=d.querySelector('summary ~ p');
      if(!s||!p)return;
      if(s.__enHTML==null){s.__enHTML=s.innerHTML;p.__enHTML=p.innerHTML;}
      var tr=fl&&fl[i];
      s.innerHTML=tr?tr[0]:s.__enHTML; p.innerHTML=tr?tr[1]:p.__enHTML;
      if(tr&&LANG==='ar') d.setAttribute('dir','rtl'); else d.removeAttribute('dir');
    });
  }
  h.lang=({en:'en',zh:'zh-CN',ar:'ar',hi:'hi'})[LANG]||'en';
  h.setAttribute('dir',RTL[LANG]?'rtl':'ltr');
  var cur=LANGS.filter(function(l){return l.c===LANG})[0]||LANGS[0];
  var b=$('#langBtn'); if(b) b.innerHTML='<svg class="i"><use href="#ic-globe"/></svg> <span>'+cur.n+'</span>';
  var m=$('#langMenu');
  if(m) m.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-l')===LANG)});
}
window.setLang=function(c){
  if(!JT[c])return;
  LANG=c; localStorage.setItem('omf-lang',c);
  applyLang(); closeLangMenu();
  if(files.length&&$('#reader')&&$('#reader').style.display==='block') renderActive();
};
window.toggleLangMenu=function(e){
  if(e)e.stopPropagation();
  var m=$('#langMenu'); if(m) m.classList.toggle('open');
};
function closeLangMenu(){var m=$('#langMenu'); if(m) m.classList.remove('open')}
document.addEventListener('click',closeLangMenu);
/* legacy shim */
window.toggleLang=function(e){toggleLangMenu(e)};

/* ================= theme ================= */
var THEME=localStorage.getItem('omf-theme')||'light';
function applyTheme(){
  document.documentElement.setAttribute('data-theme',THEME);
  var l=document.getElementById('hljs-light'),d=document.getElementById('hljs-dark');
  if(l&&d){l.disabled=(THEME==='dark');d.disabled=(THEME!=='dark');}
  if(window.mermaid) mermaid.initialize({startOnLoad:false,theme:(THEME==='dark')?'dark':'neutral'});
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
+'<symbol id="ic-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></symbol>'
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
+'<button id="btnSplit" onclick="setSplit(1)" title="Split view"><span class="lang-en">Split</span><span class="lang-zh">分栏</span><span class="lang-ar" dir="rtl">مقسوم</span><span class="lang-hi">स्प्लिट</span></button>'
+'<button id="btnRead" onclick="setSplit(0)" title="Reading view"><span class="lang-en">Read</span><span class="lang-zh">阅读</span><span class="lang-ar" dir="rtl">قراءة</span><span class="lang-hi">पढ़ें</span></button>'
+'</div>'
+'<div class="tool-group hide-mobile">'
+'<button onclick="setFont(-1)" title="Smaller text">A−</button>'
+'<button onclick="setFont(1)" title="Larger text">A＋</button>'
+'<button id="serifBtn" onclick="toggleSerif()" title="Serif">Aa</button>'
+'<button onclick="toggleTheme()" title="Theme"><svg class="i"><use href="#ic-moon"/></svg></button>'
+'<button onclick="window.print()" title="Print"><svg class="i"><use href="#ic-print"/></svg></button>'
+'</div>'
+'<button class="export-btn hide-mobile" onclick="copyRich()"><svg class="i"><use href="#ic-copy"/></svg> <span class="lang-en">Copy rich text</span><span class="lang-zh">复制富文本</span></button>'
+'<button class="export-btn" onclick="exportWord()"><svg class="i"><use href="#ic-word"/></svg> Word</button>'
+'<button class="export-btn primary" onclick="exportPdf()"><svg class="i"><use href="#ic-drop"/></svg> PDF</button>'
+'</div></div>'
+'<div class="reader-layout">'
+'<aside id="toc"><div class="toc-title"><span class="lang-en">Contents</span><span class="lang-zh">目录</span><span class="lang-ar" dir="rtl">الفهرس</span><span class="lang-hi">विषय-सूची</span></div><div id="tocList"></div></aside>'
+'<main class="doc-wrap"><div id="panes">'
+'<section class="pane pane-src">'
+'<div class="pane-hd"><span><span class="lang-en">Markdown source</span><span class="lang-zh">Markdown 源码</span><span class="lang-ar" dir="rtl">شيفرة ماركداون</span><span class="lang-hi">Markdown स्रोत</span></span>'
+'<button class="pane-copy" onclick="copySource()" title="Copy source"><svg class="i"><use href="#ic-copy"/></svg></button></div>'
+'<div class="pane-body" id="srcScroll"><pre id="srcBody"></pre></div>'
+'</section>'
+'<section class="pane pane-doc">'
+'<div class="pane-hd"><span><span class="lang-en">Rendered preview</span><span class="lang-zh">渲染预览</span><span class="lang-ar" dir="rtl">المعاينة</span><span class="lang-hi">रेंडर प्रीव्यू</span></span></div>'
+'<div class="pane-body" id="docScroll"><article id="doc"><div class="print-header" id="printHeader"></div><div id="docBody" dir="auto"></div></article></div>'
+'</section>'
+'</div></main>'
+'</div></div>';

var MODALS='<div class="modal-overlay" id="modal-paste"><div class="modal">'
+'<h3><span class="lang-en">Paste Markdown text</span><span class="lang-zh">粘贴 Markdown 文本</span></h3>'
+'<p class="hint"><span class="lang-en">Paste raw Markdown (e.g. copied from ChatGPT or Claude) and render it as a document.</span><span class="lang-zh">粘贴原始 Markdown（例如从 ChatGPT / Claude 复制的内容），立即渲染为文档。</span></p>'
+'<textarea id="pasteArea" placeholder="# My document&#10;&#10;…"></textarea>'
+'<div class="modal-actions">'
+'<button class="btn" onclick="closeModals()"><span class="lang-en">Cancel</span><span class="lang-zh">取消</span></button>'
+'<button class="btn primary" onclick="renderPaste()"><span class="lang-en">Render</span><span class="lang-zh">渲染</span> <svg class="i"><use href="#ic-arrow"/></svg></button>'
+'</div></div></div>'
+'<div class="modal-overlay" id="modal-url"><div class="modal">'
+'<h3><span class="lang-en">Open from URL</span><span class="lang-zh">从链接打开</span></h3>'
+'<p class="hint"><span class="lang-en">Paste a link to a raw .md file (GitHub raw links work great). Fetched by your browser, never by our servers.</span><span class="lang-zh">粘贴 .md 文件直链（推荐 GitHub raw 链接）。由你的浏览器直接获取，不经过我们的服务器。</span></p>'
+'<input type="text" id="urlInput" placeholder="https://raw.githubusercontent.com/user/repo/main/README.md">'
+'<div class="modal-actions">'
+'<button class="btn" onclick="closeModals()"><span class="lang-en">Cancel</span><span class="lang-zh">取消</span></button>'
+'<button class="btn primary" onclick="loadUrl()"><span class="lang-en">Open</span><span class="lang-zh">打开</span> <svg class="i"><use href="#ic-arrow"/></svg></button>'
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
function renderActive(){
  var f=files[active];if(!f)return;
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
    var d=document.createElement('div');d.className='mermaid';d.textContent=c.textContent;d.id='mmd-'+Date.now()+'-'+i;
    c.closest('pre').replaceWith(d);
  });
  var after=function(){
    body.querySelectorAll('pre code').forEach(function(c){try{hljs.highlightElement(c)}catch(e){}});
    if(window.renderMathInElement){try{renderMathInElement(body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false})}catch(e){}}
    buildToc();
  };
  if(window.mermaid){try{mermaid.run({nodes:body.querySelectorAll('.mermaid')}).then(after,after)}catch(e){after()}}
  else after();
}
window.renderActive=renderActive;
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
  var html=$('#docBody').innerHTML,text=$('#docBody').innerText;
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
  if(!window.html2pdf){window.print();return}
  toast(t('pdfgen'));
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
    flattenChecks(el);
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
  if(wasDark){THEME='light';applyTheme();renderActive();setTimeout(proceed,700)}
  else setTimeout(proceed,30);
};
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

window.exportWord=function(){
  var f=files[active];if(!f)return;
  /* work on a detached copy so the on-screen document is untouched */
  var body=document.createElement('div');
  body.innerHTML=$('#docBody').innerHTML;
  flattenChecks(body);
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
+'## Cost model\n\nThe per-user cost follows:\n\n$$C(u) = \\frac{\\alpha \\cdot T_u}{\\eta} + \\beta$$\n\nwhere $T_u$ is tokens per user, $\\eta$ is cache hit efficiency, and $\\beta$ is fixed overhead.\n\n'
+'## Implementation notes\n\n```python\ndef route_request(query: str) -> str:\n    """Route to the cheapest capable model."""\n    score = complexity(query)\n    if score < 0.3:\n        return faq_model(query)\n    return assistant_llm(query, review=score > 0.8)\n```\n\n'
+'### Open questions\n\n1. Do we gate the assistant behind a feature flag per region?\n2. Latency budget: is **1.2 s p95** acceptable for chat?\n\n---\n\n*Questions? Ping #ai-rollout. Last updated 2026-07-14.*\n';

/* ================= init ================= */
function buildLangMenu(){
  var host=document.querySelector('.lang-wrap');
  if(!host||host.querySelector('#langMenu'))return;
  var html='<div class="lang-menu" id="langMenu" onclick="event.stopPropagation()">';
  LANGS.forEach(function(l){
    html+='<button data-l="'+l.c+'" onclick="setLang(\''+l.c+'\')" lang="'+l.c+'">'+l.n+'</button>';
  });
  html+='</div>';
  host.insertAdjacentHTML('beforeend',html);
}
function init(){
  document.body.insertAdjacentHTML('beforeend',SPRITE);
  buildLangMenu();
  applyLang();applyTheme();geoPreset();
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
    setSplit(document.body.getAttribute('data-split-default')==='1'?1:0);
    if(window.marked) marked.setOptions({gfm:true,breaks:false});
    if(window.mermaid) mermaid.initialize({startOnLoad:false,theme:(THEME==='dark')?'dark':'neutral'});
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
    applyLang(); /* re-apply for injected nodes (CSS handles it, but refresh lang btn) */
    /* embedded mode always shows a live document — preload the sample */
    if(EMBED&&!files.length) loadSample(true);
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
})();
