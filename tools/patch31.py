import re
p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
a='<div class=hxd><p>SELECT YOUR PROFILE</p><div class=lgp>'
if a in s: s=s.replace(a,'<div class=hxd><div class=lgp>',1)
# drop the brand ticker
i=s.find('function hxTicker(){')
if i>=0 and 'function hxTicker(){return \'\';' not in s:
    s=s[:i]+"function hxTicker(){return '';}\nfunction hxTickerOld(){"+s[i+len('function hxTicker(){'):]
s=re.sub(r'/\*LGUI\*/.*?/\*LGUIend\*/','',s,flags=re.S)
css='''/*LGUI*/#login .hxd{bottom:20px}#login .hxd .lgp{gap:7px;padding:8px 9px;background:rgba(7,3,10,.48)}
#login .hxd .lpc{flex:0 0 clamp(70px,6.4vw,94px);padding:9px 4px 8px;gap:3px}
#login .hxd .lpc .av{width:36px!important;height:36px!important}
#login .hxd .lpc b{font-size:9.5px!important}
#login .hxd .lpc small{font-size:7px;letter-spacing:1.2px}
#login .hxd .lpc:before{top:4px;left:6px;font-size:7px}/*LGUIend*/
'''
s=s.replace('</style>',css+'</style>',1)
open(p,'w',encoding='utf-8').write(s)
print(s.count('SELECT YOUR PROFILE'),s.count("function hxTicker(){return '';}"),s.count('/*LGUI*/'))
