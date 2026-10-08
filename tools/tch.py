h=open('/mnt/user-data/outputs/owq-command-station-v2.html').read()
js=h.split('<script>')[1].split('</script>')[0]
hdr=open('gen_hdr.js').read()
test=r'''
;const R=id=>document.getElementById(id).innerHTML;
let F=0;const ok=(n,c)=>{if(!c){F++;console.log('FAIL',n)}else console.log('ok  ',n)};
pickProfile('Cole Leckey');set({lgi:'zed'});doLogin();flush();
ok('seeded challenges',D.challenges.length>=6);
const st=D.challenges.map(chState);console.log(st.join(','));
ok('3 live,1 soon,2 done',st.filter(x=>x==='live').length===3&&st.filter(x=>x==='soon').length===1&&st.filter(x=>x==='done').length===2);
D.challenges.filter(c=>c.done).forEach(c=>ok('done has winner '+c.name,!!c.winner));
tab='Leaderboard';LBV='Challenges';go();bad('chPage',R('main'));ok('page renders',R('main').includes('First to'));
LBV='Rankings';go();bad('rank',R('main'));ok('rankings banner/toggle',R('main').includes('Challenges'));
tab='Command Deck';go();bad('deck',R('main'));ok('deck panel',R('main').includes('Active Challenge'));
cdTick();ok('fmtCd',fmtCd(90061000)==='1d 01:01:01');
// race winner
const race=D.challenges.find(c=>c.type==='race'&&!c.done);const ev=chEval(race);console.log('race rows',JSON.stringify(ev.rows.slice(0,2)));
race.target=1;let o=chSync();console.log('sync alerts',o.length);ok('race winner set or alerted',o.length>0||race.done);
// top ends
const top=D.challenges.find(c=>c.type==='top'&&!c.done);top.stop=1;o=chSync();ok('top finalized',top.done&&!!top.winner);
// team
const team=D.challenges.find(c=>c.type==='team'&&!c.done);if(team){team.target=1;o=chSync();ok('team reached',team.done)}
// add
set({hn:'Test Race',ht:'Race to a target',hm:'Policies placed',hg:'5',hs:dAgo(1),he:dAgo(-5),hp:'Pizza'});const n=D.challenges.length;addH();ok('addH adds',D.challenges.length===n+1);
set({hn:'',ht:'Top performer',hm:'Points',hg:'',hs:dAgo(1),he:dAgo(-5),hp:''});addH();ok('addH rejects empty name',D.challenges.length===n+1);
set({hn:'x',ht:'Top performer',hm:'Points',hg:'',hs:dAgo(1),he:dAgo(5),hp:''});set({he:dAgo(3)});addH();ok('addH rejects bad dates',D.challenges.length===n+1);
const id=D.challenges[0].id;chPay(id);ok('pay toggles',D.challenges[0].paid===true);
chEnd(D.challenges.find(c=>!c.done).id);document.getElementById('yes').onclick();
chDel(id);document.getElementById('yes').onclick();ok('del',!D.challenges.find(c=>c.id===id));
tab='Leaderboard';LBV='Challenges';go();bad('chPage2',R('main'));
ONLINE=1;document.getElementById('main').innerHTML='X';refreshQuiet();ok('refreshQuiet on Challenges',R('main')!=='X');ONLINE=0;
for(const k of Object.keys(views)){tab=k;cid=1;go();bad(k,R('main')+R('hud')+R('nav'))}
console.log('done, failures',F);
'''
open('tch.js','w').write("const vm=require('vm');vm.runInThisContext("+__import__('json').dumps(hdr+js+test)+");")
