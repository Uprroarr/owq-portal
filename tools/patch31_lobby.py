import base64
p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
i=s.find("const LOBBYSRC='");j=s.find("'",i+len("const LOBBYSRC='"))
b=base64.b64encode(open('/root/.claude/uploads/6e37954b-9c9e-57d7-b212-24d756de5469/2fc36c7a-26953.mp3','rb').read()).decode()
s=s[:i]+"const LOBBYSRC='data:audio/mpeg;base64,"+b+"'"+s[j+1:]
open(p,'w',encoding='utf-8').write(s)
