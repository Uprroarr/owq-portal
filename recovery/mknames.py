"""Build names105.json: for every top-level unit of the v105 bundle, its module and the name to use there.
three units -> {'three': {'mod': 'three'|addon path, 'exp': export name}} (only exported ones matter)."""
import json, re
R = '/home/claude/rec/'
U = json.load(open(R + 'u105.json'))['units']
A = json.load(open(R + 'align105.json'))
MOD = json.load(open(R + 'ref/v101_modof.json'))
LOC = json.load(open(R + 'ref/v101_local.json'))
final = A['final']
u_end = A['u_end']

# three export maps from the name-preserving reference build
ref = open(R + 'ref/allthree_ms_p.js').read()
ADDON = {
    'exports_three_module': 'three',
    'exports_EffectComposer': '../three/examples/jsm/postprocessing/EffectComposer.js',
    'exports_RenderPass': '../three/examples/jsm/postprocessing/RenderPass.js',
    'exports_UnrealBloomPass': '../three/examples/jsm/postprocessing/UnrealBloomPass.js',
    'exports_OutputPass': '../three/examples/jsm/postprocessing/OutputPass.js',
    'exports_ShaderPass': '../three/examples/jsm/postprocessing/ShaderPass.js',
    'exports_RoomEnvironment': '../three/examples/jsm/environments/RoomEnvironment.js',
    'exports_BufferGeometryUtils': '../three/examples/jsm/utils/BufferGeometryUtils.js',
    'exports_RoundedBoxGeometry': '../three/examples/jsm/geometries/RoundedBoxGeometry.js',
}
EXP = {}  # reference local name -> (module, export name)
for m in re.finditer(r'__export\((exports_\w+), \{(.*?)\}\);', ref, re.S):
    mod = ADDON.get(m.group(1))
    if not mod: continue
    for e in re.finditer(r'(\w+): \(\) => (\w+)', m.group(2)):
        exp, loc = e.group(1), e.group(2)
        if loc not in EXP or mod == 'three': EXP[loc] = (mod, exp)

# new units: module + name (index -> list of names per declarator, or module only for statements)
NEW = {
 804: ('src/layout.js', 'AISLE'), 809: ('src/layout.js', 'COLX'), 810: ('src/layout.js', 'BOARD'),
 817: ('src/room.js', 'buildLounge'),
 820: ('src/cosm.js', 'CREM'), 821: ('src/cosm.js', 'EXT'), 823: ('src/cosm.js', 'SIGM'), 828: ('src/cosm.js', 'MKC'),
 829: ('src/cosm.js', 'mk'), 830: ('src/cosm.js', 'SM'), 831: ('src/cosm.js', 'PATC'), 832: ('src/cosm.js', 'patTex'),
 850: ('src/cosm.js', 'headset'), 856: ('src/cosm.js', 'WOODT'), 857: ('src/cosm.js', 'woodTex'),
 872: ('src/avatar.js', 'OUTC_BP'), 877: ('src/avatar.js', 'BPKEYS'), 885: ('src/avatar.js', 'HAPPYE'),
 935: ('src/ui.js', 'CSS'),
 960: ('src/drive.js', 'XB'), 961: ('src/drive.js', 'ZB'), 962: ('src/drive.js', 'CSS'), 967: ('src/drive.js', 'STEERK'), 968: ('src/drive.js', 'steer0'),
 970: ('src/board.js', 'titleCv'), 971: ('src/board.js', 'hintCv'), 972: ('src/board.js', 'buildBoard'),
 973: ('src/games.js', 'GW'), 974: ('src/games.js', 'GH'), 975: ('src/games.js', 'GAMES'), 976: ('src/games.js', 'COLS'),
 977: ('src/games.js', 'F'), 978: ('src/games.js', 'rr'), 979: ('src/games.js', 'glow'), 980: ('src/games.js', 'screenBg'),
 981: ('src/games.js', 'topBar'), 982: ('src/games.js', 'overScreen'), 983: ('src/games.js', 'SHAPES'), 984: ('src/games.js', 'PCOL'),
 985: ('src/games.js', 'rot'), 986: ('src/games.js', 'ROTS'), 987: ('src/games.js', 'Stacker'), 988: ('src/games.js', 'Paddle'),
 989: ('src/games.js', 'Snake'), 990: ('src/games.js', 'Bricks'), 991: ('src/games.js', 'QS'), 992: ('src/games.js', 'Trivia'),
 993: ('src/games.js', 'MAKE'), 994: ('src/games.js', 'tileArt'),
 995: ('src/games2.js', 'CME'), 996: ('src/games2.js', 'COP'), 997: ('src/games2.js', 'first'), 998: ('src/games2.js', 'endScreen'),
 999: ('src/games2.js', 'leftScreen'), 1000: ('src/games2.js', 'hint'), 1001: ('src/games2.js', 'VS'), 1002: ('src/games2.js', 'PaddleVS'),
 1003: ('src/games2.js', 'SCW'), 1004: ('src/games2.js', 'SCH'), 1005: ('src/games2.js', 'SnakeVS'), 1006: ('src/games2.js', 'pickQs'),
 1007: ('src/games2.js', 'TriviaVS'), 1008: ('src/games2.js', 'MAKE2'),
 1009: ('src/arcade.js', 'CSS'), 1010: ('src/arcade.js', 'TKEYS'), 1011: ('src/arcade.js', 'GN'), 1012: ('src/arcade.js', 'TWO'),
 1013: ('src/arcade.js', 'first'), 1014: ('src/arcade.js', 'SW'), 1015: ('src/arcade.js', 'SH'), 1016: ('src/arcade.js', 'SK'),
 1017: ('src/arcade.js', 'Arcade'), 1018: ('src/arcade.js', 'homog'), 1019: ('src/arcade.js', 'holoCv'),
 1020: ('src/crate.js', 'Crates'),
 1023: ('src/office.js', None), 1029: ('src/office.js', 'inPoly'), 1044: ('src/office.js', 'arcade'), 1045: ('src/office.js', 'arcadeOn'), 1046: ('src/office.js', 'boardOpen'),
 1053: ('src/cosm2.js', 'TAU'), 1054: ('src/cosm2.js', 'glow'), 1055: ('src/cosm2.js', 'FLT'), 1056: ('src/cosm2.js', 'flameTex'),
 1057: ('src/cosm2.js', 'flame'), 1058: ('src/cosm2.js', 'coneG'), 1059: ('src/cosm2.js', 'bend'), 1060: ('src/cosm2.js', 'normUV'),
 1061: ('src/cosm2.js', 'lerp'), 1062: ('src/cosm2.js', 'sstep'), 1067: ('src/cosm2.js', 'trig'), 1068: ('src/cosm2.js', 'guard'),
 1069: ('src/cosm2.js', 'tubeX'), 1070: ('src/cosm2.js', 'tank'), 1076: ('src/cosm2.js', 'job'),
 1079: ('src/cosm3.js', 'TAU'), 1080: ('src/cosm3.js', 'put'), 1081: ('src/cosm3.js', 'panel'), 1082: ('src/cosm3.js', 'T1'),
 1083: ('src/cosm3.js', 'tex1'), 1084: ('src/cosm3.js', 'T2'), 1085: ('src/cosm3.js', 'tex2'), 1090: ('src/cosm3.js', 'mTire'),
 1091: ('src/cosm3.js', 'mGlass'), 1092: ('src/cosm3.js', 'mLite'), 1093: ('src/cosm3.js', 'mTail'), 1094: ('src/cosm3.js', 'wheels'),
 1095: ('src/cosm3.js', 'lights'), 1096: ('src/cosm3.js', 'sideText'), 1098: ('src/cosm3.js', 'fuselage'), 1099: ('src/cosm3.js', 'wing'),
 1100: ('src/cosm3.js', 'fin'), 1101: ('src/cosm3.js', 'prop'), 1102: ('src/cosm3.js', 'gear'), 1103: ('src/cosm3.js', 'canopy'),
 1104: ('src/cosm3.js', 'jet'),
 1106: ('src/preview.js', 'GLOK'), 1107: ('src/preview.js', 'glOK'), 1108: ('src/preview.js', 'mkRenderer'), 1109: ('src/preview.js', 'mkScene'),
 1110: ('src/preview.js', 'MATS'), 1111: ('src/preview.js', 'mat'), 1112: ('src/preview.js', 'deskStage'), 1113: ('src/preview.js', 'stageFor'),
 1114: ('src/preview.js', 'frame'), 1115: ('src/preview.js', 'meshBox'), 1116: ('src/preview.js', 'disposeAll'), 1117: ('src/preview.js', 'SHARED'),
 1118: ('src/preview.js', 'QUEUE'), 1119: ('src/preview.js', 'CACHE'), 1120: ('src/preview.js', 'render1'), 1121: ('src/preview.js', 'thumb'),
 1122: ('src/preview.js', 'preview'),
}
STMT_MOD = {}  # statements: module by range
def stmt_mod(i):
    if 1063 <= i <= 1078: return 'src/cosm2.js'
    if 1086 <= i <= 1105: return 'src/cosm3.js'
    return None

OVR = {'AJ': 'PCFSoftShadowMap'}   # checked by hand: shadowMap.type = AJ
for k, v in OVR.items(): final[k] = v
out = {'units': {}, 'three': {}}
last_mod = None
for i in range(len(U)):
    u = U[i]
    if i < u_end:
        nm = u.get('name')
        if nm and nm in final and final[nm] in EXP:
            mod, exp = EXP[final[nm]]
            out['three'][nm] = {'mod': mod, 'exp': exp}
        continue
    if i == len(U) - 1: continue  # globalThis.VO3 = ...
    nm = u.get('name')
    if i in NEW:
        mod, local = NEW[i]
    elif nm and nm in final:
        bname = final[nm]; mod = MOD.get(bname)
        local = LOC.get(mod, {}).get(bname, bname) if mod else bname
        if not mod: mod = last_mod
    else:
        mod = stmt_mod(i) or last_mod; local = None
    if u['kind'] == 'stmt': local = None
    out['units'][i] = {'mod': mod, 'local': local, 'mangled': nm}
    last_mod = mod
json.dump(out, open(R + 'names105.json', 'w'), indent=0)
from collections import Counter
print(Counter(v['mod'] for v in out['units'].values()))
print('three exported refs', len(out['three']))
# sanity: duplicate local names within a module
seen = {}
for i, v in out['units'].items():
    if v['local']:
        k = (v['mod'], v['local'])
        if k in seen: print('DUP', k, seen[k], i)
        seen[k] = i
