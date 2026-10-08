// Regenerate ES module sources from the pretty-printed v105 bundle.
// node gen.js <pretty105.js> <names105.json> <outdir>
const ts = require('/home/claude/.npm-global/lib/node_modules/typescript');
const fs = require('fs'), path = require('path');
const [, , inFile, namesFile, outDir] = process.argv;
const N = JSON.parse(fs.readFileSync(namesFile, 'utf8'));
const text = fs.readFileSync(inFile, 'utf8');
const host = ts.createCompilerHost({ allowJs: true, noEmit: true, target: ts.ScriptTarget.ESNext });
const sf = ts.createSourceFile(inFile, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const og = host.getSourceFile; host.getSourceFile = (n, l) => (n === inFile ? sf : og(n, l));
const prog = ts.createProgram([inFile], { allowJs: true, noEmit: true, target: ts.ScriptTarget.ESNext, noLib: true, types: [] }, host);
const checker = prog.getTypeChecker();
let body = null;
for (const st of sf.statements) if (ts.isExpressionStatement(st) && ts.isCallExpression(st.expression)) { let f = st.expression.expression; while (ts.isParenthesizedExpression(f)) f = f.expression; if (f.body && ts.isBlock(f.body)) { body = f.body; break; } }

// enumerate units exactly like units.js
const units = [];
for (const st of body.statements) {
  if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) units.push({ kind: 'var', node: d, st });
  else if (ts.isFunctionDeclaration(st)) units.push({ kind: 'fn', node: st, st });
  else if (ts.isClassDeclaration(st)) units.push({ kind: 'class', node: st, st });
  else units.push({ kind: 'stmt', node: st, st });
}
// symbol -> info
const symInfo = new Map();
const topDecl = new Set();
units.forEach((u, i) => {
  if (u.kind === 'stmt') return;
  topDecl.add(u.node);
  const nameNode = u.node.name;
  if (!nameNode || !ts.isIdentifier(nameNode)) return;
  const sym = checker.getSymbolAtLocation(nameNode);
  const mangled = nameNode.text;
  const ui = N.units[i];
  if (ui) symInfo.set(sym, { mine: true, mod: ui.mod, local: ui.local || mangled, idx: i });
  else if (N.three[mangled]) symInfo.set(sym, { three: true, mod: N.three[mangled].mod, exp: N.three[mangled].exp, idx: i });
  else symInfo.set(sym, { internal: true, mangled, idx: i });
});
function isTop(sym) { return sym && sym.declarations && sym.declarations.some(d => topDecl.has(d)); }
function isPropName(id) {
  const p = id.parent;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return true;
  if ((ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p) || ts.isGetAccessorDeclaration(p) || ts.isSetAccessorDeclaration(p)) && p.name === id) return true;
  return false;
}
const modUnits = {};   // mod -> [unit index]
units.forEach((u, i) => { const ui = N.units[i]; if (ui && ui.mod) (modUnits[ui.mod] = modUnits[ui.mod] || []).push(i); });

// pass 1: per module, which names it imports (from my modules / addons) and whether it uses THREE
const imports = {};   // mod -> Map(fromMod -> Set(name))
const usesThree = {};
const exportsOf = {}; // mod -> Set(local)
const errors = [];
function walkIds(node, fn) { const v = n => { if (ts.isIdentifier(n)) fn(n); ts.forEachChild(n, v); }; v(node); }
function symOf(id) { return (ts.isShorthandPropertyAssignment(id.parent) && id.parent.name === id) ? checker.getShorthandAssignmentValueSymbol(id.parent) : checker.getSymbolAtLocation(id); }
for (const [mod, idxs] of Object.entries(modUnits)) {
  imports[mod] = imports[mod] || new Map();
  for (const i of idxs) {
    walkIds(units[i].node, id => {
      if (isPropName(id)) return;
      const sym = symOf(id); if (!sym || !isTop(sym)) return;
      const info = symInfo.get(sym); if (!info) { errors.push('no info ' + id.text); return; }
      if (info.three) {
        if (info.mod === 'three') usesThree[mod] = true;
        else { if (!imports[mod].has(info.mod)) imports[mod].set(info.mod, new Set()); imports[mod].get(info.mod).add(info.exp); }
      } else if (info.internal) errors.push(mod + ': uses unexported bundle name ' + id.text + ' (unit ' + info.idx + ')');
      else if (info.mod !== mod) {
        if (!imports[mod].has(info.mod)) imports[mod].set(info.mod, new Set()); imports[mod].get(info.mod).add(info.local);
        (exportsOf[info.mod] = exportsOf[info.mod] || new Set()).add(info.local);
      }
    });
  }
}
// API exports (index.js namespace object, unit 5)
const api = [];
{
  const st = units[5].node; const t = text.slice(st.getStart(), st.getEnd());
  for (const m of t.matchAll(/(\w+): \(\) => ([\w$]+)/g)) {
    const id = m[2];
    // resolve the mangled name to a symbol via the top-level map
    let info = null;
    for (const [s, inf] of symInfo) if (inf.mine && s.name === id) info = inf;
    if (!info) { errors.push('api name not found ' + m[1]); continue; }
    api.push({ api: m[1], mod: info.mod, local: info.local });
    (exportsOf[info.mod] = exportsOf[info.mod] || new Set()).add(info.local);
  }
}
// collision check: imported name equal to a module's own local name
const ownNames = {};
for (const [mod, idxs] of Object.entries(modUnits)) ownNames[mod] = new Set(idxs.map(i => N.units[i].local).filter(Boolean));
const alias = {}; // mod -> Map(fromMod|name -> alias)
for (const [mod, m] of Object.entries(imports)) {
  alias[mod] = new Map();
  for (const [from, names] of m) for (const nm of names) if (ownNames[mod].has(nm) || (from !== 'three' && [...m].some(([f2, s2]) => f2 !== from && s2.has(nm)))) alias[mod].set(from + '|' + nm, nm + '_' + path.basename(from, '.js').replace(/\W/g, ''));
}
// ---- v101 sources: reuse their text (with comments and real local names) where code is unchanged
const SRC101 = process.env.SRC101 || '';
const ALIGN = JSON.parse(fs.readFileSync('/home/claude/rec/align105.json', 'utf8'));
const U105 = JSON.parse(fs.readFileSync('/home/claude/rec/u105.json', 'utf8')).units;
const V101U = JSON.parse(fs.readFileSync('/home/claude/rec/ref/v101_units.json', 'utf8')).units;
const LOC101 = JSON.parse(fs.readFileSync('/home/claude/rec/ref/v101_local.json', 'utf8'));
const pairOf = {};   // v105 unit index -> {ref: v101 bundle name, exact}
for (const [i, n, src] of ALIGN.exact) if (src === 'mine') pairOf[i] = { ref: n, exact: true };
for (const [i, n] of ALIGN.changed) pairOf[i] = { ref: n, exact: false };
const v101ByName = {}; V101U.forEach(u => { if (u.name) v101ByName[u.name] = u; });
const srcIdx = {};   // mod -> {decl: Map(local -> text), members: Map(class|name|static -> text), aliases: Map(from|name -> alias)}
function indexSource(mod) {
  if (srcIdx[mod] !== undefined) return srcIdx[mod];
  const f = SRC101 && path.join(SRC101, path.basename(mod));
  if (!f || !fs.existsSync(f)) return (srcIdx[mod] = null);
  const t = fs.readFileSync(f, 'utf8');
  const s2 = ts.createSourceFile(f, t, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const decl = new Map(), members = new Map(), aliases = new Map();
  const lead = st => { const full = st.getFullText(); return full.replace(/^\s*\n/, '').replace(/^[ \t]*(?=\S)/, ''); };
  for (const st of s2.statements) {
    if (ts.isImportDeclaration(st) && st.importClause && st.importClause.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      let from = st.moduleSpecifier.text; if (from.startsWith('./')) from = 'src/' + from.slice(2);
      for (const el of st.importClause.namedBindings.elements) if (el.propertyName) aliases.set(from + '|' + el.propertyName.text, el.name.text);
      continue;
    }
    const strip = txt => txt.replace(/^((?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*)export\s+/, '$1');
    if (ts.isVariableStatement(st)) {
      const kw = st.declarationList.flags & ts.NodeFlags.Const ? 'const' : st.declarationList.flags & ts.NodeFlags.Let ? 'let' : 'var';
      const ds = st.declarationList.declarations;
      const lc = (ts.getLeadingCommentRanges(t, st.getFullStart()) || []).map(r => t.slice(r.pos, r.end)).join('\n');
      ds.forEach((d, k) => { if (ts.isIdentifier(d.name)) decl.set(d.name.text, (k === 0 && lc ? lc + '\n' : '') + kw + ' ' + d.getText() + ';'); });
    } else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name) {
      decl.set(st.name.text, strip(lead(st)));
      if (ts.isClassDeclaration(st)) for (const m of st.members) {
        const nm = m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) ? m.name.text : (m.kind === ts.SyntaxKind.Constructor ? 'constructor' : null);
        if (!nm) continue;
        const stat = !!(ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static);
        members.set(st.name.text + '|' + nm + '|' + stat + '|' + ts.SyntaxKind[m.kind], m.getFullText().replace(/^\s*\n/, '').replace(/^[ \t]*(?=\S)/, ''));
      }
    }
  }
  return (srcIdx[mod] = { decl, members, aliases });
}
// pass 2: emit
fs.mkdirSync(path.join(outDir, 'src'), { recursive: true });
const report = [];
const reused = { full: 0, members: 0, genMembers: 0 };
for (const [mod, idxs] of Object.entries(modUnits)) {
  const bound = new Set([...ownNames[mod], 'THREE']);
  for (const [from, names] of imports[mod]) for (const nm of names) bound.add(alias[mod].get(from + '|' + nm) || ((indexSource(mod) || { aliases: new Map() }).aliases.get(from + '|' + nm)) || nm);
  const chunks = [];
  let renamedLocals = 0;
  for (const i of idxs) {
    const u = units[i];
    const start = u.node.getStart(), end = u.node.getEnd();
    const edits = [];
    walkIds(u.node, id => {
      if (isPropName(id)) return;
      const sym = symOf(id);
      const short = ts.isShorthandPropertyAssignment(id.parent) && id.parent.name === id;
      let rep = null;
      if (sym && isTop(sym)) {
        const info = symInfo.get(sym);
        if (info.three) rep = info.mod === 'three' ? 'THREE.' + info.exp : info.exp;
        else if (info.mine) rep = info.mod === mod ? info.local : (alias[mod].get(info.mod + '|' + info.local) || ((indexSource(mod) || { aliases: new Map() }).aliases.get(info.mod + '|' + info.local)) || info.local);
      } else if (sym && sym.declarations && sym.declarations.length && bound.has(id.text)) {
        rep = id.text + '__L'; renamedLocals++;
      }
      if (rep !== null && rep !== id.text) edits.push([id.getStart(), id.getEnd(), short ? id.text + ': ' + rep : rep]);
      else if (rep !== null && short && rep !== id.text) edits.push([id.getStart(), id.getEnd(), id.text + ': ' + rep]);
    });
    edits.sort((a, b) => b[0] - a[0]);
    const emitRange = (a, b) => { let t = text.slice(a, b); for (const [s, e, r] of edits) if (s >= a && e <= b) t = t.slice(0, s - a) + r + t.slice(e - a); return t; };
    const pr = pairOf[i], si = indexSource(mod), loc = pr && LOC101[mod] ? LOC101[mod][pr.ref] : null;
    if (pr && pr.exact && si && loc && si.decl.has(loc) && u.kind !== 'stmt') { chunks.push(si.decl.get(loc)); reused.full++; continue; }
    if (pr && !pr.exact && u.kind === 'class' && si && loc && si.decl.has(loc)) {
      const vu = v101ByName[pr.ref], mu = U105[i].members || [];
      const vm = new Map((vu && vu.members || []).map(m => [m.name + '|' + m.static + '|' + m.kind, m]));
      const mem = u.node.members;
      let out = emitRange(start, mem.length ? mem[0].getStart() : end - 1);
      mem.forEach((m, k) => {
        const me = mu[k], key = me.name + '|' + me.static + '|' + me.kind, v = vm.get(key);
        const stext = si.members.get(loc + '|' + key);
        if (v && v.canon === me.canon && stext) { out += stext; reused.members++; }
        else { out += emitRange(m.getStart(), m.getEnd()); reused.genMembers++; }
        out += k < mem.length - 1 ? '\n  ' : '\n';
      });
      out += '}';
      chunks.push(out); continue;
    }
    let t = emitRange(start, end);
    if (u.kind === 'var') t = 'var ' + t + ';';
    chunks.push(t);
  }
  // header
  const hdr = [];
  if (usesThree[mod]) hdr.push("import * as THREE from 'three';");
  const rel = f => f.startsWith('../three') || f === 'three' ? f : './' + path.basename(f);
  const GORDER = ['three', '../three/examples/jsm/postprocessing/EffectComposer.js', '../three/examples/jsm/postprocessing/RenderPass.js', '../three/examples/jsm/postprocessing/UnrealBloomPass.js', '../three/examples/jsm/postprocessing/OutputPass.js', '../three/examples/jsm/postprocessing/ShaderPass.js', '../three/examples/jsm/environments/RoomEnvironment.js', '../three/examples/jsm/utils/BufferGeometryUtils.js', '../three/examples/jsm/geometries/RoundedBoxGeometry.js',
    ...['geo', 'util', 'tex', 'layout', 'room', 'cosm', 'avatar', 'tv', 'fx', 'audio', 'tone', 'nuke', 'ui', 'track', 'drive', 'board', 'games', 'games2', 'arcade', 'crate', 'office', 'cosm2', 'cosm3', 'preview'].map(m => 'src/' + m + '.js')];
  const V101I = JSON.parse(fs.readFileSync('/home/claude/rec/ref/v101_imports.json', 'utf8'));
  const orig = V101I[mod] || [];
  const gi = f => { const o = orig.indexOf(f); if (o >= 0) return o; const k = GORDER.indexOf(f); if (k < 0) throw new Error('order? ' + f); return 1000 + k; };
  for (const [from, names] of [...imports[mod]].sort((a, b) => gi(a[0]) - gi(b[0]))) {
    const si = indexSource(mod);
    const parts = [...names].sort().map(nm => { const a = alias[mod].get(from + '|' + nm) || (si && si.aliases.get(from + '|' + nm)); return a ? nm + ' as ' + a : nm; });
    hdr.push('import {' + parts.join(', ') + "} from '" + rel(from) + "';");
  }
  const ex = exportsOf[mod] ? [...exportsOf[mod]].sort() : [];
  const out = hdr.join('\n') + (hdr.length ? '\n\n' : '') + chunks.join('\n') + '\n' + (ex.length ? '\nexport {' + ex.join(', ') + '};\n' : '');
  fs.writeFileSync(path.join(outDir, mod), out);
  report.push(mod + ' units ' + idxs.length + ' imports ' + [...imports[mod].keys()].map(f => path.basename(f)).join(',') + ' exports ' + ex.length + (renamedLocals ? ' renamedLocals ' + renamedLocals : ''));
}
// index.js
const byMod = {};
api.forEach(a => (byMod[a.mod] = byMod[a.mod] || []).push(a));
const line = m => 'export {' + byMod[m].map(a => a.api === a.local ? a.api : a.local + ' as ' + a.api).join(',') + "} from './" + path.basename(m) + "';";
const order = ['src/office.js', 'src/audio.js', 'src/tone.js', 'src/cosm.js', 'src/avatar.js'];
const idxL = order.filter(m => byMod[m]).map(line);
idxL.push("import './cosm2.js';", "import './cosm3.js';");
Object.keys(byMod).filter(m => !order.includes(m)).forEach(m => idxL.push(line(m)));
const idx = idxL.join('\n') + '\n';
fs.writeFileSync(path.join(outDir, 'src/index.js'), idx);
fs.writeFileSync(path.join(outDir, 'src/iife.js'), "import * as VO3 from './index.js';\nglobalThis.VO3=VO3;\n");
console.log(report.join('\n'));
console.log('reused v101 text:', JSON.stringify(reused));
console.log('errors', errors.length); errors.slice(0, 40).forEach(e => console.log('  ', e));
