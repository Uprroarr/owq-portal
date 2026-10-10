/*DCstart*/
/* ===== DAY COUNTS (dc): contacts and appointments for a day, from the Activity log and the Clients book =====
   For each person and day the number is the higher of the two sources, so an end-of-day Activity total that already
   includes the Clients work never counts twice. In the Clients book a contact is a person you added by hand (imports,
   migrated and demo records do not count) or reached with a call, text, email or meeting; an appointment is one you
   booked that day (cancelled ones drop out). Used by the Morning Recognition goals, the Live Pulse and the check-in.
   The Clients part is worked out once per change of the Clients book (CRM.ver) for every day at once. */
var DCX={v:-1,m:null,t:0};
function dcName(n){n=String(n||'');return n==='Agency Owner'&&(D.agents||[]).some(a=>a.name==='Cole Leckey')?'Cole Leckey':n}
function dcCrm(){
  if(typeof CRM==='undefined'||typeof crmOn!=='function'||!crmOn())return null;
  if(DCX.m&&DCX.v===CRM.ver)return DCX.m;
  const m={},box=(day,n)=>{n=dcName(n);if(!n)return null;const d=m[day]||(m[day]={});return d[n]||(d[n]={con:new Set(),app:0})};
  try{
    const imp=new Set();CRM.e.forEach(e=>{if(e&&!e.del&&e.ty==='import')imp.add(+e.c)});
    CRM.c.forEach(c=>{if(!c||c.del||!c.at||c.lg||(c.cad&&c.cad.k==='legacy')||imp.has(+c.id))return;const b=box(crmDay(c.at),c.by||c.owner);if(b)b.con.add(+c.id)});
    CRM.e.forEach(e=>{if(!e||e.del||e.mig||!e.at||!CRM_EVL[e.ty]||e.ty==='note'||!crmGet(e.c))return;const b=box(crmDay(e.at),e.by);if(b)b.con.add(+e.c)});
    CRM.t.forEach(t=>{if(!t||t.del||t.ty!=='appt'||t.s==='x'||!t.at||!crmGet(t.c))return;const b=box(crmDay(t.at),t.by||t.ow);if(b)b.app++});
  }catch(e){}
  DCX.v=CRM.ver;DCX.m=m;return m}
/* {con, app} for one person (who) or the whole team (who = ''), plus what the Clients book alone shows */
function dayCounts(day,who){
  const w=who?dcName(who):'',act={};
  (D.activity||[]).forEach(a=>{if(a.d!==day)return;const n=dcName(a.ag)||'Unassigned';if(w&&n!==w)return;const o=act[n]||(act[n]={con:0,app:0});o.con+=+a.con||0;o.app+=+a.app||0});
  const cm=dcCrm(),cd=(cm&&cm[day])||{},names=new Set(Object.keys(act));Object.keys(cd).forEach(n=>{if(!w||n===w)names.add(n)});
  let con=0,app=0,cc=0,ca=0;
  names.forEach(n=>{const a=act[n]||{con:0,app:0},c=cd[n],k=c?c.con.size:0,p=c?c.app:0;con+=Math.max(a.con,k);app+=Math.max(a.app,p);cc+=k;ca+=p});
  return{con,app,crmCon:cc,crmApp:ca}}
/* a change in the Clients book (mine or a teammate's) refreshes the pinned Morning Recognition and its goal bars */
(function(){if(typeof crmRefresh!=='function')return;const _r=crmRefresh;crmRefresh=function(){const v=_r.apply(this,arguments);clearTimeout(DCX.t);DCX.t=setTimeout(()=>{try{if(typeof MR!=='undefined'&&MR.ready)mrRefresh()}catch(e){}},400);return v}})();
/*DCend*/
