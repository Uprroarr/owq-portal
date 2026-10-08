from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(viewport={'width':1280,'height':760})
    logs=[];pg.on('console',lambda m:logs.append(m.text));pg.on('pageerror',lambda e:logs.append('ERR '+str(e)))
    pg.add_init_script("window.__au=[];const O=window.Audio;window.Audio=function(s){const a=new O(s);window.__au.push(a);const pl=a.play.bind(a);a.play=function(){const r=pl();r.then(()=>logs2.push('play ok muted='+a.muted),e=>logs2.push('play rej '+e.name+' muted='+a.muted));return r};return a};window.logs2=[]")
    pg.goto('file:///mnt/user-data/outputs/owq-command-station-v2.html');pg.wait_for_timeout(3000)
    print(pg.evaluate("JSON.stringify({st:LB.st,muted:LB.muted,logs:logs2,n:__au.length,paused:__au[0]&&__au[0].paused,t:__au[0]&&__au[0].currentTime,mu:__au[0]&&__au[0].muted})"),logs)
    pg.mouse.click(300,300);pg.wait_for_timeout(800)
    print(pg.evaluate("JSON.stringify({st:LB.st,muted:LB.muted,paused:__au[0].paused,t:__au[0].currentTime,mu:__au[0].muted})"))
