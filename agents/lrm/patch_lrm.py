"""v115: Lead Purchasing Roadmap slide in Learning Network > The Production Equation (after Balance your inputs).
Native 7-stage track plus the full OWQ sheet (rm.jpg, embedded). Exact replacements with asserted counts on top of v114."""
import os, base64
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v114-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v115-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:80]); s = s.replace(old, new)
assert 'lrm-trk' not in s, 'already patched'
img = 'data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(HERE, 'rm.jpg'), 'rb').read()).decode()
css = """<style>.lrm-trk{display:grid;grid-template-columns:repeat(7,minmax(118px,1fr));gap:8px;overflow-x:auto;padding:4px 2px 10px}
.lrm-st{position:relative;border:1px solid #ff1f4f;background:linear-gradient(180deg,#1a1a24,#121219);box-shadow:0 0 14px #ff1f4f22;text-align:center;padding:10px 6px 10px}
.lrm-st.top{border-color:#fff;box-shadow:0 0 18px #ff1f4f55}.lrm-st i{display:flex;width:26px;height:26px;margin:0 auto 6px;border-radius:50%;border:2px solid #ff1f4f;align-items:center;justify-content:center;font:700 12px Verdana,sans-serif;font-style:normal}
.lrm-st b{display:block;color:#ff1f4f;font:700 12px Verdana,sans-serif;letter-spacing:1px}.lrm-st small{display:block;color:#bdbdc8;font-size:10px;letter-spacing:1px;text-transform:uppercase;margin:2px 0 6px}
.lrm-st h5{margin:0;font:700 10.5px Verdana,sans-serif;text-transform:uppercase}.lrm-st strong{display:block;font:700 20px Verdana,sans-serif;margin:4px 0 0;text-shadow:0 0 12px #ff1f4f88}.lrm-st strong em{font-style:normal;font-size:10px;color:#ff1f4f}
.lrm-st p{margin:2px 0 8px;font-size:10.5px;color:#cfcfd8}.lrm-st u{display:block;text-decoration:none;border:1px solid #ff1f4f;padding:4px 0;font:700 10.5px Verdana,sans-serif;letter-spacing:1px}.lrm-st u.f{background:#ff1f4f}
.lrm-sp{display:flex;height:24px;margin:6px 0;border:1px solid #2b2b36;font:700 11px Verdana,sans-serif}.lrm-sp span{display:flex;align-items:center;justify-content:center}.lrm-sp span:first-child{width:70%;background:linear-gradient(90deg,#b0102f,#ff1f4f)}.lrm-sp span:last-child{width:30%;background:#16161f}
.lrm-img{display:block;width:100%;margin-top:8px;border:1px solid #ff1f4f55}.lrm-d summary{cursor:pointer;color:#ff1f4f;font:700 12px Verdana,sans-serif;letter-spacing:1px;text-transform:uppercase;margin-top:12px}</style>"""
js = r"""const LRM_S=[['WEEKS 1-2','LEAD VAULT','FREE','','Warm up. No lead spend.','LEARN THE SCRIPT'],['WEEKS 3-4','AGED 1ST + 2ND WK','$300','/WK','Target: $2,400/week','GOAL 8X'],['WEEKS 5-6','AGED 3RD + 4TH WK','$400','/WK','Target: $4,000/week','GOAL 10X'],['WEEKS 7-8','AGED 5TH + 6TH WK','$600','/WK','Target: $6,000/week','GOAL 10X'],['WEEKS 9-10','AGED 7TH + 8TH WK','$800','/WK','Target: $8,000/week','GOAL 10X'],['WEEKS 11-12','REAL-TIME LEADS','$1,200','/WK','Target: $12,000/week','GOAL 10X'],['WEEK 13 ONWARD','REAL-TIME LEADS','$1,500+','/WK','Target: $15,000+/week','GOAL 10X+']];
function lrmHtml(){return `"""+css.replace('`','')+r"""<p class=lnp>Seven stages from a free warm-up to $1,500+ per week in real-time leads. Open all three rules.</p><div class=lrm-trk>${LRM_S.map((x,i)=>`<div class="lrm-st ${i===6?'top':''}"><i>${i+1}</i><b>STAGE ${i+1}</b><small>${x[0]}</small><h5>${x[1]}</h5><strong>${x[2]}<em>${x[3]}</em></strong><p>${x[4]}</p><u class="${i?'':'f'}">${x[5]}</u></div>`).join('')}</div>`+lnTiles([['Keep Lead Vault live','Dial it in the background at every stage.','01'],['Earn the next stage','Hit the goal both weeks to advance. Miss it? Repeat the stage.','02'],['Optional real-time split','<div class=lrm-sp><span>70% REAL-TIME</span><span>30% AGED</span></div>Once on real-time, keep 30% on your best aged tier.','03']],{cols:3})+`<div class=lnbq style="margin-top:12px"><b style="font-size:16px">LEARN BEFORE YOU EARN</b><small>Production targets are goals, not guarantees.</small></div><details class=lrm-d><summary>View the full roadmap sheet</summary><img class=lrm-img alt="Lead Purchasing Roadmap" src="${LRM_IMG}"></details>`}
"""
rep("and chargebacks.</small></div>`}],\nquiz:[",
    "and chargebacks.</small></div>`},\n{t:'Lead Purchasing Roadmap',gate:3,h:()=>lrmHtml()}],\nquiz:[")
rep('function lnTiles(arr,o){', 'const LRM_IMG="' + img + '";\n' + js + 'function lnTiles(arr,o){')
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
