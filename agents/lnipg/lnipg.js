/*LNIPG: Insurance Product Guide is "study the document": opening the PDF completes the section and the next one is right there */
var LNDOCONLY=['bp-insurance-product-guide'];
function lnDocOnlyFix(){LNM.forEach(m=>{if(LNDOCONLY.indexOf(m.id)<0||!m.bp)return;m.doc=1;m.wo=1;m.quiz=null;if(m.slides)m.slides=m.slides.slice(0,1);m.min=Math.min(m.min||5,5)})}
(function(){try{lnDocOnlyFix()}catch(e){}
 if(typeof lnBpBuild==='function'){const _b=lnBpBuild;lnBpBuild=function(){const r=_b.apply(this,arguments);try{lnDocOnlyFix()}catch(e){}return r}}
 if(typeof lnDpFull==='function'){const _f=lnDpFull;lnDpFull=function(i){const r=_f.apply(this,arguments);try{const m=LNM.find(x=>x.id===LN.id);
   if(m&&m.doc&&LN.mode!=='result'){const p=lnPass(m,1,1);LN.res={pass:true,sc:1,n:1,need:0,first:p.first,xp:p.xp};LN.mode='result';LN.anim=1;lnR(1);toast(m.t+' complete',1)}}catch(e){}return r}}
 if(typeof lnDpHtml==='function'){const _h=lnDpHtml;lnDpHtml=function(m){let h=_h.apply(this,arguments);if(m&&m.doc)h=h.replace(/Read (all <b>\d+<\/b> pages|the page) first\. The walkthrough and the questions cover what is in it\./,'Tap the document to open and study it. Opening it completes this section.');return h}}
 if(typeof lnJourney==='function'){const _j=lnJourney;lnJourney=function(m,part){if(m&&m.doc)return`<div class=lnjy>${['Study the document','Complete'].map((n,i)=>`<span class="${i<part?'dd':i===part?'on':''}"><b>${i<part?'&#10003;':i+1}</b>${n}</span>`).join('')}</div>`;return _j.apply(this,arguments)}}})();
