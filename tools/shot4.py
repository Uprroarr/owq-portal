from playwright.sync_api import sync_playwright
init="""
(()=>{const pres={};const hs=[];const ph=[];
const room={peers(){return [{peer:'me',presence:Object.assign({},pres),isMe:true,sameTab:true,kind:'viewer'}]},on(){return()=>{}},onPeers(f){ph.push(f);return()=>{}},async presence(p){Object.entries(p).forEach(([k,v])=>{if(v===null)delete pres[k];else pres[k]=v});ph.forEach(f=>f({peers:room.peers(),joined:[],left:[],updated:[]}))},async emit(){}};
window.claude={use:async n=>n==='room'?room:null}})();
"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']);ctx=b.new_context(viewport={'width':1280,'height':900});ctx.grant_permissions(['camera','microphone'])
    pg=ctx.new_page();pg.add_init_script(init);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(600)
    pg.click('.lpc >> nth=1');pg.fill('#lgi','x');pg.press('#lgi','Enter');pg.wait_for_timeout(6500)
    pg.evaluate("openTab('Team Chat');chGo('__voice')");pg.wait_for_timeout(500)
    pg.evaluate("vcJoin()");pg.wait_for_timeout(800)
    pg.evaluate("vcCam()");pg.wait_for_timeout(800)
    pg.evaluate("vcToggleDev()");pg.wait_for_timeout(800)
    pg.screenshot(path='v2.png');print(errs[:3]);print(pg.evaluate("JSON.stringify({dev:VC.dev,err:VC.err,cam:!!VC.cam,on:VC.on})")[:400])
    b.close()
