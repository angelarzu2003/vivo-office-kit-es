// Aplica las traducciones de literales (por posición del AST) a los bundles
// Uso: node apply_ui.js <dir_electron_original> <ui_strings.json> <traducciones.json[,otra.json]> <dir_salida_electron>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [, , srcDir, uiFile, trFiles, outDir] = process.argv;
const ui = JSON.parse(fs.readFileSync(uiFile, 'utf8'));

// texto chino -> traducción (varios archivos separados por comas; los últimos tienen prioridad)
const byValue = new Map();
const ph = s => (s.match(/\{[\w.]+\}/g) || []).sort().join(',');
for (const f of trFiles.split(',')) {
  for (const [v, t] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    if (t === null || t === undefined) continue;
    // Los marcadores {0}, {name}… deben conservarse
    if (ph(v) !== ph(t)) console.warn(`AVISO marcadores distintos: ${JSON.stringify(v)} => ${JSON.stringify(t)}`);
    byValue.set(v, t);
  }
}

// Conserva los espacios/saltos de línea iniciales y finales del original
function withWs(orig, t) {
  const lead = orig.match(/^\s*/)[0], trail = orig.match(/\s*$/)[0];
  // solo se quitan saltos de línea; los espacios de la traducción se respetan (fragmentos concatenados)
  return lead + t.replace(/^[\r\n]+|[\r\n]+$/g, '') + trail;
}
function escLit(s, q) {
  return s.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q)
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(new RegExp(String.fromCharCode(0x2028), "g"), '\\u2028').replace(new RegExp(String.fromCharCode(0x2029), "g"), '\\u2029');
}
function escTpl(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

// Reglas por contexto: { re, to } aplicadas al texto original; los literales dentro se excluyen
const RULES = require('./rules.js');
const SKIP_FILES = new Set(['vendors~formatjs-polyfill-locale.js']);

let total = 0;
const report = {};
const allFiles = new Set([...Object.keys(ui.files), ...fs.readdirSync(srcDir).filter(f => f.endsWith('.js') && !f.startsWith('locales-') && !SKIP_FILES.has(f))]);
for (const file of allFiles) {
  const items = ui.files[file] || [];
  let src = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const ranges = [];
  for (const r of RULES) for (const m of src.matchAll(r.re)) ranges.push([m.index, m.index + m[0].length]);
  const inRule = it => ranges.some(([a, b]) => it.s >= a && it.e <= b);
  const todo = items.filter(it => byValue.has(it.v) && !inRule(it)).sort((a, b) => b.s - a.s);
  if (!todo.length && !ranges.length) continue;
  for (const it of todo) {
    const t = withWs(it.v, byValue.get(it.v));
    const raw = src.slice(it.s, it.e);
    let rep;
    if (it.k === 'lit') {
      const q = raw[0];
      if (q !== '"' && q !== "'") throw new Error(`${file}@${it.s}: literal inesperado ${raw.slice(0, 20)}`);
      rep = q + escLit(t, q) + q;
    } else {
      rep = escTpl(t);
    }
    src = src.slice(0, it.s) + rep + src.slice(it.e);
  }
  for (const r of RULES) src = src.replace(r.re, r.to);
  const dst = path.join(outDir, file);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, src);
  execFileSync(process.execPath, ['--check', dst]); // lanza error si la sintaxis no es válida
  report[file] = todo.length;
  total += todo.length;
}
console.log('reemplazos:', total, 'archivos:', Object.keys(report).length);
