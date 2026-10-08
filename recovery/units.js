// Split a bun IIFE bundle (pretty-printed) into top-level "units" and fingerprint each one.
// usage: node units.js <bundle.js> <out.json>
// A unit is one var declarator, function, class, or other top-level statement inside the IIFE.
// canon: structure with every identifier replaced by its first-appearance index (property names kept).
// refs: for each identifier occurrence (in canon order), the top-level name it resolves to, or null.
const ts = require('/home/claude/.npm-global/lib/node_modules/typescript');
const fs = require('fs'), crypto = require('crypto');
const [, , inFile, outFile] = process.argv;
const text = fs.readFileSync(inFile, 'utf8');
const host = ts.createCompilerHost({ allowJs: true, noEmit: true, target: ts.ScriptTarget.ESNext });
const sf = ts.createSourceFile(inFile, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const origGet = host.getSourceFile;
host.getSourceFile = (n, l) => (n === inFile ? sf : origGet(n, l));
const prog = ts.createProgram([inFile], { allowJs: true, noEmit: true, target: ts.ScriptTarget.ESNext, noLib: true, types: [] }, host);
const checker = prog.getTypeChecker();

// find the IIFE body
let body = null;
for (const st of sf.statements) {
  if (ts.isExpressionStatement(st) && ts.isCallExpression(st.expression)) {
    let f = st.expression.expression;
    while (ts.isParenthesizedExpression(f)) f = f.expression;
    if ((ts.isArrowFunction(f) || ts.isFunctionExpression(f)) && ts.isBlock(f.body)) { body = f.body; break; }
  }
}
if (!body) throw new Error('no IIFE');
const topDecl = new Set(); // declaration nodes at top level
for (const st of body.statements) {
  if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach(d => topDecl.add(d));
  else if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) topDecl.add(st);
}
function topNameOf(id) {
  const sym = (ts.isShorthandPropertyAssignment(id.parent) && id.parent.name === id) ? checker.getShorthandAssignmentValueSymbol(id.parent) : checker.getSymbolAtLocation(id);
  if (!sym || !sym.declarations) return null;
  for (const d of sym.declarations) {
    let n = d;
    if (ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n)) { if (topDecl.has(n)) return sym.name; }
  }
  return null;
}
function isPropName(id) {
  const p = id.parent;
  if (!p) return false;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return true;
  if ((ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p) || ts.isGetAccessorDeclaration(p) || ts.isSetAccessorDeclaration(p) || ts.isPropertySignature(p)) && p.name === id) return true;
  if (ts.isJsxAttribute && ts.isJsxAttribute(p)) return true;
  return false;
}
function unitInfo(node) {
  const idx = new Map(); const out = []; const coarse = []; const refs = []; const props = new Set();
  const push = (a, b) => { out.push(a); coarse.push(b === undefined ? a : b); };
  const leaf = n => {
    if (ts.isIdentifier(n)) {
      if (isPropName(n)) { push('.' + n.text); props.add(n.text); return true; }
      let sym;
      if (ts.isShorthandPropertyAssignment(n.parent) && n.parent.name === n) { push('.' + n.text); props.add(n.text); sym = checker.getShorthandAssignmentValueSymbol(n.parent); }
      else sym = checker.getSymbolAtLocation(n);
      if (!sym || !sym.declarations || !sym.declarations.length) { push('g:' + n.text); refs.push(null); return true; }
      if (!idx.has(sym)) idx.set(sym, idx.size);
      push('$' + idx.get(sym), '_'); refs.push(topNameOf(n));
      return true;
    }
    if (ts.isPrivateIdentifier(n)) { push('#' + n.text); return true; }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { push('s' + JSON.stringify(n.text)); return true; }
    if (ts.isNumericLiteral(n) || ts.isBigIntLiteral(n)) { push('n' + n.text); return true; }
    if (ts.isRegularExpressionLiteral(n)) { push('r' + n.text); return true; }
    if (n.kind === ts.SyntaxKind.TemplateHead || n.kind === ts.SyntaxKind.TemplateMiddle || n.kind === ts.SyntaxKind.TemplateTail) { push('t' + JSON.stringify(n.text)); return true; }
    return false;
  };
  const visit = n => {
    if (leaf(n)) return;
    if (ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) push('op' + n.operator);
    if (ts.isBinaryExpression(n)) push('bo' + n.operatorToken.kind);
    if (ts.isVariableDeclarationList(n)) push('vk' + (n.flags & 3));
    push('<' + (ts.isShorthandPropertyAssignment(n) ? 'PropertyAssignment' : ts.SyntaxKind[n.kind]));
    ts.forEachChild(n, visit);
    push('>');
  };
  visit(node);
  return {
    canon: crypto.createHash('sha1').update(out.join(' ')).digest('hex').slice(0, 16),
    coarse: crypto.createHash('sha1').update(coarse.join(' ')).digest('hex').slice(0, 16),
    clen: out.length, refs, props: [...props].sort(),
  };
}
const units = [];
let si = 0;
for (const st of body.statements) {
  const base = { si, line: sf.getLineAndCharacterOfPosition(st.getStart()).line + 1 };
  if (ts.isVariableStatement(st)) {
    const kw = st.declarationList.flags & ts.NodeFlags.Const ? 'const' : st.declarationList.flags & ts.NodeFlags.Let ? 'let' : 'var';
    for (const d of st.declarationList.declarations) {
      const name = ts.isIdentifier(d.name) ? d.name.text : null;
      units.push({ ...base, kind: 'var', kw, name, start: d.getStart(), end: d.getEnd(), ...unitInfo(d) });
    }
  } else if (ts.isFunctionDeclaration(st)) {
    units.push({ ...base, kind: 'fn', name: st.name ? st.name.text : null, start: st.getStart(), end: st.getEnd(), ...unitInfo(st) });
  } else if (ts.isClassDeclaration(st)) {
    const u = { ...base, kind: 'class', name: st.name ? st.name.text : null, start: st.getStart(), end: st.getEnd(), ...unitInfo(st) };
    u.members = st.members.map(m => ({ name: m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) ? m.name.text : (m.kind === ts.SyntaxKind.Constructor ? 'constructor' : '?'), kind: ts.SyntaxKind[m.kind], static: !!(ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static), start: m.getStart(), end: m.getEnd(), ...unitInfo(m) }));
    units.push(u);
  } else {
    units.push({ ...base, kind: 'stmt', name: null, start: st.getStart(), end: st.getEnd(), ...unitInfo(st) });
  }
  si++;
}
fs.writeFileSync(outFile, JSON.stringify({ file: inFile, n: units.length, units }));
console.log(inFile, 'units', units.length, 'statements', body.statements.length);
