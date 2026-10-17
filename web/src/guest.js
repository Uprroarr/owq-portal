/*GUESTstart*/
/* Guest pass, portal side (website only). Runs only when the sign-in adapter accepted a guest link (window.OWQ_GUEST): the portal
   is in local mode (no shared database) and its storage is the guest's own space. On the first visit it loads the built-in
   sample data (demo(): a 3-person agency, 9 clients, 3 months of policies, activity, income and expenses) with the guest as the
   first agent and the owner of the sample clients, then "Enter the station" plays the normal cinematic login and signs the guest
   in as themself (no code). The sidebar's status line says it is a guest preview on sample data; when the pass ends the page goes
   back to the gate, which says so. */
(function(){
 var G=window.OWQ_GUEST;if(!G||!G.n)return;var N=G.n,SEED='owq_guest_seed';
 function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
 function seed(){if(ls(SEED))return true;if(typeof demo!=='function'||typeof D!=='object'||!D)return false;
  try{demo()}catch(e){}
  try{(D.agents||[]).forEach(function(a){if(a.name==='You')a.name=N});(D.policies||[]).forEach(function(p){if(p.ag==='You')p.ag=N});(D.activity||[]).forEach(function(a){if(a.ag==='You')a.ag=N});
   if(!(D.agents||[]).some(function(a){return a.name===N}))(D.agents=D.agents||[]).unshift({id:99,name:N,goal:6000});save()}catch(e){}
  /* the sample clients are his book */
  try{if(typeof crmAll==='function')crmAll().forEach(function(c){if(!c.owner||c.owner==='Unassigned')crmPut(c.id,{owner:N})})}catch(e){}
  ls(SEED,String(Date.now()));try{if(typeof GXU!=='undefined'&&GXU.refresh)GXU.refresh()}catch(e){}return true}
 /* the sample data goes in once the client book is ready (local mode is quick), so the clients land in it too */
 (function wait(n){var ok=false;try{ok=typeof CRM==='undefined'||!crmOn()||CRM.ready}catch(e){ok=true}if(ok||n>60){seed();return}setTimeout(function(){wait(n+1)},100)})(0);
 /* whoever is picked on the login screen, a guest pass signs in as the guest, and needs no code */
 var DL=window.doLogin;if(typeof DL==='function')window.doLogin=function(){try{LG=N;var i=document.getElementById('lgi');if(i&&!String(i.value||'').trim())i.value='guest'}catch(e){}return DL.apply(this,arguments)};
 function until(test,then,ms){var t0=Date.now();(function w(){var ok=false;try{ok=test()}catch(e){}if(ok){then();return}if(Date.now()-t0<ms)setTimeout(w,150)})()}
 window.OWQ_GUEST_GO=function(){seed();
  until(function(){return typeof GXU!=='undefined'&&GXU.state()==='menu'},function(){try{GXU.pick(N)}catch(e){}
   until(function(){return GXU.state()==='land'&&document.getElementById('lgi')},function(){try{doLogin()}catch(e){}},45000)},30000)};
 /* the badge, and a welcome the first time in */
 var DAY=new Date(G.exp).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
 function badge(){var s=document.querySelector('aside .stat');if(!s||s.id==='owqgst')return;s.id='owqgst';s.className='stat owqgst';s.setAttribute('role','button');s.tabIndex=0;
  s.innerHTML='<b></b>GUEST PREVIEW &middot; SAMPLE DATA';s.title='Guest pass for '+N+', good through '+DAY;
  s.onclick=function(){try{toast('Guest preview for '+N+' on sample data, good through '+DAY+'. Nothing here reaches the team.',1)}catch(e){}}}
 var st=document.createElement('style');st.textContent='.owqgst{color:#ffcf40!important;cursor:pointer}.owqgst b{background:#ffcf40!important;box-shadow:0 0 8px #ffcf40!important}';
 (document.head||document.body).appendChild(st);
 var hi=0;setInterval(function(){var on=false;try{on=!!ONLINE}catch(e){}if(on){badge();if(!hi){hi=1;if(!ls('owq_guest_hi')){ls('owq_guest_hi','1');setTimeout(function(){try{toast('Welcome, '+String(N).split(' ')[0]+'. This is a guest preview on sample data. Explore anything.',1)}catch(e){}},2500)}}}
  if(Date.now()>G.exp)location.reload()},1000);
})();
/*GUESTend*/
