from common import *
with sync_playwright() as p:
    b,pg,errs=open_portal(p,1440,900)
    pg.evaluate("(()=>{D.snd=0;POPS=[];document.getElementById('pop').innerHTML='';nfDemo('info')})()");pg.wait_for_timeout(1100)
    pg.click('#pop .pp')
    for i in range(5):
        print(pg.evaluate("[document.querySelectorAll('#pop .pp').length,document.querySelectorAll('#nfg .pp').length,NF.lv.length,tab,document.querySelectorAll('.pp').length]"));pg.wait_for_timeout(100)
    print(errs);b.close()
