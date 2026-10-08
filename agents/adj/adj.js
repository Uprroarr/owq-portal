/*ADJstart*/
/* One-time owner correction (asked for on Oct 6, 2026): extra clocked-in hours for Monday Oct 5, 2026.
   Cole Leckey +4 h; Austin Vardzel, Nate Johnson and John Montini +2 h each (not RJ, not Ayman).
   Runs once, on the owner's device, after the shared data has loaded. Fixed record ids make it safe on several devices,
   and an adjustment that was deleted is never added back. Shows up in Time Clock as a shift "Added by the owner". */
(function(){const ADJ=[['Cole Leckey',4],['Austin Vardzel',2],['Nate Johnson',2],['John Montini',2]],DAY='2026-10-05',UNTIL=new Date(2026,9,10).getTime();
 function run(){try{if(Date.now()>UNTIL)return true;
   if(typeof ONLINE==='undefined'||!ONLINE||typeof SYN==='undefined'||!SYN.on||!SYN.first||SYN.ro)return false;
   if(!(WHO==='Cole Leckey'||WHO==='Agency Owner'))return true;
   const sS=SYN.sent.shifts||{},sA=SYN.sent.activity||{},d0=new Date(2026,9,5).getTime(),added=[];
   ADJ.forEach(([n,h],k)=>{if(!D.agents.some(a=>a.name===n))return;const sid='adj1005s'+k,aid='adj1005a'+k;
     if(sS[sid]!==undefined||(D.shifts||[]).some(s=>s._i===sid))return;
     /* a time slot that day that does not overlap their own shifts */
     const mine=(D.shifts||[]).filter(s=>s.ag===n&&s.start<d0+864e5&&(s.end||Date.now())>d0);let st=null;
     for(const hh of [8,12,16,19,0]){const a=d0+hh*36e5,b=a+h*36e5;if(b>d0+864e5)continue;if(!mine.some(s=>s.start<b&&(s.end||Date.now())>a)){st=a;break}}if(st==null)st=d0+8*36e5;
     const id=2026100500+k,en=st+h*36e5;D.shifts=D.shifts||[];D.shifts.push({id,ag:n,start:st,end:en,note:'Added by the owner',_i:sid,_t:en*1000});
     if(sA[aid]===undefined&&!(D.activity||[]).some(a=>a._i===aid)){D.activity=D.activity||[];D.activity.push({d:DAY,ag:n,h,con:0,app:0,clock:id,_i:aid,_t:en*1000})}
     added.push(n.split(' ')[0]+' +'+h+' h')});
   if(added.length){save();try{pushAlert({sev:'ok',rd:1,t:'Hours added for Mon, Oct 5',m:added.join(', '),go:['Agency Performance','Agents']},true)}catch(e){}try{go()}catch(e){}}
   return true}catch(e){return false}}
 const iv=setInterval(()=>{if(run())clearInterval(iv)},3000)})();
/*ADJend*/
