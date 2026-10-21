"""v120 batch 4: chat (General only, more file types up to 5 MB, audio/video preview, Paste button, drag and drop), private
1-on-1 channels with the owner + Ideas, MTD Hype Board, Sales Floor only hours, 10 minute idle sign-out with docking,
usage tracking, exploit fixes, weekly time-tracking report. Module agents/b4/b4.js."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v119-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v120-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:90]); s = s.replace(old, new)
assert '/*B4start*/' not in s, 'already patched'
js = open(os.path.join(HERE, 'b4.js'), encoding='utf8').read(); css = open(os.path.join(HERE, 'b4.css'), encoding='utf8').read()
js = ''.join(c if ord(c) < 128 else '\\u%04x' % ord(c) for c in js)
assert all(ord(c) < 128 for c in css)
i = s.rfind('</script>'); s = s[:i] + js + '\n' + s[i:]
i = s.find('</style>'); s = s[:i] + css + s[i:]
rep("const chChans=()=>", "let chChans=()=>")
rep("const chBadge=()=>", "let chBadge=()=>")
# files: more types, up to 5 MB (40 parts)
rep("const CHA='.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv,.json,.md,.docx,.xlsx,.pptx,.zip',CHMAX=9e5,", "const CHA='.png,.jpg,.jpeg,.gif,.webp,.heic,.pdf,.txt,.csv,.json,.md,.rtf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.zip,.mp3,.m4a,.wav,.ogg,.mp4,.mov,.webm',CHMAX=5e6,")
rep("const okType=t=>/^(image\\/(png|jpeg|webp|gif)|application\\/(pdf|zip|json|vnd\\.[a-z0-9.\\-+]+)|text\\/(plain|csv|markdown))$/.test(String(t))?String(t):'application/octet-stream';",
    "const okType=t=>/^(image\\/(png|jpeg|webp|gif|heic)|application\\/(pdf|zip|x-zip-compressed|json|rtf|msword|vnd\\.[a-z0-9.\\-+]+)|text\\/(plain|csv|markdown|rtf)|audio\\/(mpeg|mp3|mp4|x-m4a|aac|wav|x-wav|wave|ogg|webm)|video\\/(mp4|quicktime|webm))$/.test(String(t))?String(t):'application/octet-stream';")
rep("if(data.length>1.25e6||f.size>CHMAX&&type!=='image/jpeg')return toast('That file is too big. Files can be up to about 900 KB here.');", "if(data.length>7e6||f.size>CHMAX&&type!=='image/jpeg')return toast('That file is too big. Files can be up to 5 MB here.');", 2)
s = s.replace("Math.min(+a.n||0,8)", "Math.min(+a.n||0,40)").replace("Math.min(+mm.att.n||0,8)", "Math.min(+mm.att.n||0,40)").replace("Math.min(+m.att.n||0,8)", "Math.min(+m.att.n||0,40)")
rep("${IMG.test(t)?`<img src=\"data:${t};base64,${data}\" alt=\"${nm}\" class=chvi>`:`<p class=mut>${fmtSz(+a.size||0)}. Save it to your device to open it.</p>`}",
    "${IMG.test(t)?`<img src=\"data:${t};base64,${data}\" alt=\"${nm}\" class=chvi>`:/^audio\\//.test(t)?`<audio controls src=\"data:${t};base64,${data}\"></audio>`:/^video\\//.test(t)?`<video controls playsinline src=\"data:${t};base64,${data}\"></video>`:`<p class=mut>${fmtSz(+a.size||0)}. Save it to your device to open it.</p>`}", 2)
rep("<input type=file id=chfile hidden accept=\"image/*,${CHA}\" onchange=\"chPick(this.files)\">", "<input type=file id=chfile hidden accept=\"image/*,audio/*,video/*,${CHA}\" onchange=\"chPick(this.files)\"><button class=\"btn o\" onclick=\"chPasteBtn()\" aria-label=\"Paste\" title=\"Paste text or a picture\" ${ro?'disabled':''}>&#128203;</button>")
# hours that earn: Sales Floor only (credits and Battle Pass XP)
rep("o.h+=+a.h||0;", "o.h+=(typeof flH==='function'?flH(a):+a.h||0);", 2)
# monitoring notice at sign-in
rep("Not case sensitive. Esc to go back.", "Not case sensitive. Esc to go back. Sales Floor time and portal activity are tracked.")
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
