import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import qvt
from playwright.sync_api import sync_playwright
url='file://'+qvt.BUILD
with sync_playwright() as p:
    b=qvt.launch(p);ctx=qvt.context(b,1440,900);errs=[];pg=qvt.page(ctx,errs)
    qvt.open_login(pg,url,6)
    print('tabs',pg.evaluate("[!!document.querySelector('#rail .qv-tabs'),document.querySelector('#rail .qv-tabs')&&document.querySelector('#rail .qv-tabs').innerText.replace(/\\s+/g,' '),QV.tab]"))
    print('bell',pg.evaluate("[document.querySelector('#bell b')&&document.querySelector('#bell b').textContent,document.getElementById('bell').getAttribute('aria-label')]"))
    pg.screenshot(path=qvt.B+'/tmp/s_alerts.png')
    pg.evaluate("qvTab('chat')");pg.wait_for_timeout(600)
    pg.screenshot(path=qvt.B+'/tmp/s_chat.png')
    print('chat',pg.evaluate("[document.querySelectorAll('#qvCL .qv-m').length,QV.ch,document.getElementById('qvCL').scrollTop,document.getElementById('qvCL').scrollHeight]"))
    pg.evaluate("qvCh('Lead Flow')");pg.wait_for_timeout(400)
    pg.click('#qvCI');pg.keyboard.type('Trying the noon block today. Thanks @Co');pg.wait_for_timeout(200)
    print('mention picker',pg.evaluate("document.getElementById('qvMN').innerText"))
    pg.keyboard.press('Enter');pg.keyboard.type('for the tip');pg.keyboard.press('Enter');pg.wait_for_timeout(500)
    print('after send',pg.evaluate("[chIn('Lead Flow').slice(-1)[0].text,document.querySelectorAll('#qvCL .qv-m').length,document.getElementById('qvCI').value]"))
    pg.screenshot(path=qvt.B+'/tmp/s_chat2.png')
    pg.evaluate("qvTab('floor')");pg.wait_for_timeout(500)
    pg.screenshot(path=qvt.B+'/tmp/s_floor.png')
    pg.evaluate("openTab('Team Chat')");pg.wait_for_timeout(500)
    print('team chat sees it',pg.evaluate("CH.ch='Lead Flow';go();document.getElementById('chl').innerText.indexOf('noon block')>=0"))
    print('\n'.join(errs[:10]))
    b.close()
