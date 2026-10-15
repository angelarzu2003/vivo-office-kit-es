// Extrae literales con chino visibles en la interfaz usando el AST (acorn)
// Uso: node extract_ui.js <dir_electron> <salida.json> [archivos...]
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const CJK = /[㐀-鿿豈-﫿]/;
const LOG_METHODS = new Set(['info', 'error', 'warn', 'debug', 'log', 'trace', 'verbose', 'silly', 'fatal']);
const MATCH_METHODS = new Set(['includes', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith', 'replace', 'replaceAll', 'split', 'match', 'test', 'search', 'hasOwnProperty', 'getItem', 'setItem', 'removeItem', 'get', 'has', 'set']);
const CMP_OPS = new Set(['===', '!==', '==', '!=', 'in', 'instanceof']);

function calleeName(c) {
  if (!c) return '';
  if (c.type === 'Identifier') return c.name;
  if (c.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier') return c.property.name;
  return '';
}
function calleeObjText(c, src) {
  if (c && c.type === 'MemberExpression') return src.slice(c.object.start, c.object.end);
  return '';
}

// Objeto/array grande compuesto casi solo de literales (diccionarios de pinyin, segmentación…)
const dictCache = new WeakMap();
function isDict(a) {
  if (a.type !== 'ObjectExpression' && a.type !== 'ArrayExpression') return false;
  if (dictCache.has(a)) return dictCache.get(a);
  const vals = a.type === 'ObjectExpression' ? a.properties.map(p => p.value) : a.elements;
  let r = false;
  if (vals.length > 150) {
    const lits = vals.filter(v => v && v.type === 'Literal').length;
    r = lits / vals.length > 0.8;
  }
  dictCache.set(a, r);
  return r;
}

// Clasifica un literal según sus ancestros; devuelve null si es UI o el motivo de exclusión
function classify(node, anc, src) {
  const parent = anc[anc.length - 2];
  if (!parent) return null;
  if (node.type === 'Literal' && node.value.length > 1500) return 'datos';
  if (parent.type === 'Property' && parent.key === node) return 'clave';
  if (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') return 'clave';
  if (parent.type === 'MemberExpression' && parent.property === node) return 'clave';
  if (parent.type === 'BinaryExpression' && CMP_OPS.has(parent.operator)) return 'comparacion';
  if (parent.type === 'SwitchCase' && parent.test === node) return 'comparacion';
  if (parent.type === 'ImportExpression' || parent.type === 'ImportDeclaration') return 'import';
  for (let i = anc.length - 2; i >= 0; i--) {
    const a = anc[i];
    if (a.type === 'CallExpression' || a.type === 'NewExpression') {
      const name = calleeName(a.callee);
      const obj = calleeObjText(a.callee, src);
      if (LOG_METHODS.has(name) && (/log|console|logger|__log|this\.\w+/i.test(obj) || /^[A-Za-z_$][\w$]?$/.test(obj))) return 'log';
      if (name === 'defineLocale' || name === 'updateLocale') return 'datos';
      if (name === 'parse' && obj === 'JSON') return 'datos';
      if (/^(__log|log|logger|console)$/.test(name)) return 'log';
      if (a.type === 'NewExpression' && /Error$/.test(name)) return 'error';
      if (i === anc.length - 2 && MATCH_METHODS.has(name) && a.arguments[0] === node) return 'comparacion';
      if (i === anc.length - 3 && MATCH_METHODS.has(name)) {
        // literal dentro de un array pasado a includes etc.
        const p = anc[anc.length - 2];
        if (p.type === 'ArrayExpression' && a.arguments[0] === p && name !== 'set') return 'comparacion';
      }
    }
    if (a.type === 'ThrowStatement') return 'error';
    if (isDict(a)) return 'diccionario';
    if (a.type === 'ArrayExpression' && i === anc.length - 2 && anc[i - 1] && anc[i - 1].type === 'BinaryExpression') return 'comparacion';
  }
  return null;
}

const [, , dir, outFile, ...only] = process.argv;
const files = only.length ? only : fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.startsWith('locales-') && !f.includes('formatjs'));
const result = { files: {} };
const protectedSet = new Set();
const stats = {};
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  if (!CJK.test(src)) continue;
  let ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true, allowHashBang: true });
  } catch (e) {
    try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' }); } catch (e2) { console.error('No se pudo analizar', f, e2.message); continue; }
  }
  const items = [];
  const ALLOW = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'allow.json'), 'utf8')));
  walk.fullAncestor(ast, (node, _st, anc) => {
    let value, kind;
    if (node.type === 'Literal' && typeof node.value === 'string') { value = node.value; kind = 'lit'; }
    else if (node.type === 'TemplateElement') { value = node.value.cooked ?? node.value.raw; kind = 'tpl'; }
    else return;
    if (!CJK.test(value)) return;
    let why = classify(node, anc, src);
    // Etiquetas internas: se traducen también en comparaciones/claves para mantener la coherencia
    if ((why === 'comparacion' || why === 'clave') && ALLOW.has(value)) why = null;
    stats[why || 'ui'] = (stats[why || 'ui'] || 0) + 1;
    if (why === 'comparacion' || why === 'clave') protectedSet.add(value);
    if (why) return;
    const ctx = src.slice(Math.max(0, node.start - 400), node.start);
    if (/initBackupDirPath|initDeviceBackupDirPath|"vivo Office Kit":$|\.lnk|getPath\("(documents|desktop|downloads)"\)[^;]{0,200}$/.test(ctx)) { stats['ruta'] = (stats['ruta'] || 0) + 1; return; }
    items.push({ s: node.start, e: node.end, k: kind, v: value });
  });
  if (items.length) result.files[f] = items;
}
const uniq = new Set();
for (const its of Object.values(result.files)) for (const it of its) if (!protectedSet.has(it.v)) uniq.add(it.v);
result.protected = [...protectedSet];
console.log('protegidas:', protectedSet.size);
result.unique = [...uniq];
fs.writeFileSync(outFile, JSON.stringify(result));
console.log('estadísticas:', stats);
console.log('cadenas UI únicas:', uniq.size);
console.log(Object.entries(result.files).map(([f, i]) => [f, i.length]).sort((a, b) => b[1] - a[1]).slice(0, 30));
