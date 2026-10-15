// Genera los archivos parcheados para mostrar vivo PC Suite en español (es_US)
// Uso: node patch_es.js <dir_app_extraida> <dir_salida_parche>
const fs = require('fs');
const path = require('path');

const [, , appDir, outDir, uiDir] = process.argv;
// Fuente: versión con la interfaz traducida (uiDir) si existe; si no, la original
const srcOf = rel => { const u = uiDir && path.join(uiDir, path.basename(rel)); return u && rel.startsWith("dist/electron/") && !rel.slice(14).includes("/") && fs.existsSync(u) ? u : path.join(appDir, rel); };
const LANG = 'es_US', VLANG = 'ves_rUS';
const E = path.join(appDir, 'dist', 'electron');
const here = __dirname;

const pend = require(path.join(here, '..', 'traducciones', 'pendientes.json'));
const trad = require(path.join(here, '..', 'traducciones', 'traducciones.json'));
if (pend.length !== trad.length) throw new Error('pendientes/traducciones no coinciden');

const written = [];
function out(rel, content) {
  const dst = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, content);
  written.push(rel);
}

// Reemplazo que exige un número exacto de coincidencias
function replaceExact(src, from, to, expected, label) {
  const n = src.split(from).length - 1;
  if (n !== expected) throw new Error(`${label}: se esperaban ${expected} coincidencias de ${JSON.stringify(from)}, hay ${n}`);
  return src.split(from).join(to);
}

// Traducciones agrupadas por módulo: { mod: { clave: texto } }
const byMod = {};
pend.forEach((p, i) => ((byMod[p.mod] ||= {})[p.k] = trad[i]));

function setPath(obj, key, val) {
  // las claves pueden contener puntos solo si el objeto es anidado; aquí son planas
  obj[key] = val;
}

// ---------- 1. locales-es_US.js ----------
{
  const rel = `dist/electron/locales-${LANG}.js`;
  let src = fs.readFileSync(srcOf(rel), 'utf8');
  const mapM = src.match(/\{("\.\/[\w-]+\.json":\d+,?)+\}/);
  const map = JSON.parse(mapM[0]);
  const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const zhSrc = fs.readFileSync(path.join(E, 'locales-zh_CN.js'), 'utf8');
  const zhMap = JSON.parse(zhSrc.match(/\{("\.\/[\w-]+\.json":\d+,?)+\}/)[0]);

  let nextId = 99001;
  const newEntries = [];
  for (const file of Object.keys(zhMap)) {
    const mod = file.replace(/^\.\/|\.json$/g, '');
    const add = byMod[mod] || {};
    if (map[file] !== undefined) {
      const id = map[file];
      const re = new RegExp(`([,{]${id}:function\\(e\\)\\{e\\.exports=JSON\\.parse\\(')((?:[^'\\\\]|\\\\.)*)('\\)\\})`);
      const m = src.match(re);
      if (!m) throw new Error('módulo no encontrado ' + file);
      const obj = Function(`return JSON.parse('${m[2]}')`)();
      for (const [k, v] of Object.entries(add)) setPath(obj, k, v);
      src = src.replace(re, (_, a, __, c) => a + esc(JSON.stringify(obj)) + c);
    } else {
      // Módulo inexistente en español (p. ej. record, album): se crea
      const id = nextId++;
      map[file] = id;
      newEntries.push(`,${id}:function(e){e.exports=JSON.parse('${esc(JSON.stringify(add))}')}`);
    }
  }
  src = src.replace(mapM[0], JSON.stringify(map));
  // Añadir los módulos nuevos al final del objeto de módulos del chunk
  const tail = src.lastIndexOf('}]);');
  if (tail < 0) throw new Error('fin de chunk no encontrado');
  src = src.slice(0, tail) + newEntries.join('') + src.slice(tail);
  out(rel, src);
}

// ---------- 2. locales/es_US/framework.json (proceso principal) ----------
{
  const rel = `dist/electron/locales/${LANG}/framework.json`;
  const obj = JSON.parse(fs.readFileSync(srcOf(rel), 'utf8'));
  const zh = JSON.parse(fs.readFileSync(path.join(E, 'locales/zh_CN/framework.json'), 'utf8'));
  const add = byMod.framework || {};
  for (const k of Object.keys(zh)) if ((!(k in obj) || obj[k] === '') && add[k] !== undefined) obj[k] = add[k];
  out(rel, JSON.stringify(obj, null, 2));
}

// ---------- 3. Ventanas (renderer / child-window / module-share-preview) ----------
for (const f of ['renderer.js', 'child-window.js', 'module-share-preview.js']) {
  const rel = `dist/electron/${f}`;
  let src = fs.readFileSync(srcOf(rel), 'utf8');
  // Idioma por defecto de la versión china: zh_CN -> es_US
  src = src.replace(/(function \w\(\)\{if\(!\w\)return)"zh_CN"(;)/, (m, a, b) => {
    return a + `"${LANG}"` + b;
  });
  if (!src.includes(`return"${LANG}";const`)) throw new Error(f + ': getDefaultLanguage no parcheado');
  // Locale inicial y de respaldo de vue-i18n
  const before = src;
  src = src.replace(/const (\w)=(\w)\?(\w)\(\):"zh_CN",(\w)=new (\w)\.default\(\{locale:\1,fallbackLocale:\2\?"en_US":"zh_CN"/,
    (m, c, n, o, d, b) => `const ${c}=${o}(),${d}=new ${b}.default({locale:${c},fallbackLocale:"en_US"`);
  if (src === before) throw new Error(f + ': inicialización de i18n no parcheada');
  out(rel, src);
}

// ---------- 4. main.js (proceso principal: bandeja, diálogos nativos) ----------
{
  const rel = 'dist/electron/main.js';
  let src = fs.readFileSync(srcOf(rel), 'utf8');
  // handleExEnv: al cambiar a versión china se forzaba zh_CN; además ahora se fuerza es_US siempre
  src = replaceExact(src,
    'o.default.setItem("isExport",g),g||(o.default.setItem("currentLanguage","zh_CN"),o.default.setItem("vLang","vzh_rCN"),o.default.setItem("isRtl",!1)))}',
    `o.default.setItem("isExport",g)),g||(o.default.setItem("currentLanguage","${LANG}"),o.default.setItem("vLang","${VLANG}"),o.default.setItem("isRtl",!1))}`,
    1, 'handleExEnv');
  // RtlManager: idioma por defecto
  src = replaceExact(src, 'this._isRtl=!1,this._currentLanguage="zh_CN"}', `this._isRtl=!1,this._currentLanguage="${LANG}"}`, 1, 'RtlManager');
  out(rel, src);
}

// Copiar el resto de bundles traducidos
if (uiDir) for (const f of fs.readdirSync(uiDir)) { const rel = 'dist/electron/' + f; if (!written.includes(rel)) out(rel, fs.readFileSync(path.join(uiDir, f))); }
console.log('Archivos generados:\n  ' + written.join('\n  '));
