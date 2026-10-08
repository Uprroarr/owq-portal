// For each v101 module: bundle-level name (as in an unminified bun build) -> name in the module source.
// node localnames.js <srcdir> <plain-bundle.js> <out.json>
const ts = require('/home/claude/.npm-global/lib/node_modules/typescript');
const fs = require('fs'), path = require('path');
const [, , srcDir, plainFile, outFile] = process.argv;
function topNames(sf) {
  const names = [];
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach(d => { if (ts.isIdentifier(d.name)) names.push(d.name.text); });
    else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name) names.push(st.name.text);
  }
  return names;
}
// bundle: statements inside the IIFE, grouped by the preceding "// src/x.js" comment
const ptext = fs.readFileSync(plainFile, 'utf8');
const psf = ts.createSourceFile(plainFile, ptext, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
let body = null;
for (const st of psf.statements) if (ts.isExpressionStatement(st) && ts.isCallExpression(st.expression)) { let f = st.expression.expression; while (ts.isParenthesizedExpression(f)) f = f.expression; body = f.body; }
const byMod = {};
let cur = null;
for (const st of body.statements) {
  const ranges = ts.getLeadingCommentRanges(ptext, st.pos) || [];
  for (const r of ranges) { const c = ptext.slice(r.pos, r.end); const m = c.match(/^\/\/ (.+\.js)$/); if (m) cur = m[1]; }
  const names = [];
  if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach(d => { if (ts.isIdentifier(d.name)) names.push(d.name.text); });
  else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name) names.push(st.name.text);
  if (cur) (byMod[cur] = byMod[cur] || []).push(...names);
}
const out = {};
for (const mod of Object.keys(byMod)) {
  if (!mod.startsWith('src/')) continue;
  const f = path.join(srcDir, path.basename(mod));
  if (!fs.existsSync(f)) { console.log('missing', f); continue; }
  const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const loc = new Set(topNames(sf)), bun = byMod[mod];
  const m = {};
  for (const b of bun) {
    if (loc.has(b)) { m[b] = b; continue; }
    const base = b.replace(/\d+$/, '');
    if (loc.has(base)) { m[b] = base; continue; }
    console.log('  no local name for', mod, b); m[b] = b;
  }
  out[mod] = m;
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('modules', Object.keys(out).length);
