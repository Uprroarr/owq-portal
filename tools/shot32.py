from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium');pg=b.new_page()
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(1500)
    r=pg.evaluate("""()=>{try{D.chat=D.chat||{};}catch(e){}
    CH.msgs=[];for(let i=0;i<60;i++)CH.msgs.push({id:'m'+i,n:'Cole',t:'msg '+i,ts:Date.now()-(60-i)*1000});
    tab='Team Chat';go();const l=document.getElementById('chl');return l?[l.scrollTop,l.clientHeight,l.scrollHeight]:'nochl'}""")
    print(r);pg.wait_for_timeout(600)
    print(pg.evaluate("(()=>{const l=document.getElementById('chl');return l?[l.scrollTop,l.clientHeight,l.scrollHeight]:0})()"))
