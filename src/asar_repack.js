// Reempaqueta un .asar sustituyendo algunos archivos
// Uso: node asar_repack.js <original.asar> <dir_parche> <salida.asar>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [, , srcAsar, patchDir, outAsar] = process.argv;
const fd = fs.openSync(srcAsar, 'r');
const sz = Buffer.alloc(8);
fs.readSync(fd, sz, 0, 8, 0);
const hps = sz.readUInt32LE(4);
const hb = Buffer.alloc(hps);
fs.readSync(fd, hb, 0, hps, 8);
const header = JSON.parse(hb.slice(8, 8 + hb.readUInt32LE(4)).toString('utf8'));
const base = 8 + hps;

function integrity(buf) {
  const BS = 4 * 1024 * 1024, blocks = [];
  for (let i = 0; i < buf.length; i += BS) blocks.push(crypto.createHash('sha256').update(buf.slice(i, i + BS)).digest('hex'));
  if (!blocks.length) blocks.push(crypto.createHash('sha256').update(Buffer.alloc(0)).digest('hex'));
  return { algorithm: 'SHA256', hash: crypto.createHash('sha256').update(buf).digest('hex'), blockSize: BS, blocks };
}

// Recorre en orden y asigna offsets nuevos
const plan = []; // { src: 'orig'|'patch', origOffset, size, patchPath }
let offset = 0, replaced = [];
function walk(node, rel) {
  for (const [name, e] of Object.entries(node.files)) {
    const r = rel ? rel + '/' + name : name;
    if (e.files) { walk(e, r); continue; }
    if (e.link || e.unpacked) continue;
    const p = path.join(patchDir, r);
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      plan.push({ buf });
      e.size = buf.length;
      if (e.integrity) e.integrity = integrity(buf);
      replaced.push(r);
    } else {
      plan.push({ origOffset: base + Number(e.offset), size: e.size });
    }
    e.offset = String(offset);
    offset += e.size;
  }
}
walk(header, '');

// Cabecera en formato Pickle
const json = Buffer.from(JSON.stringify(header), 'utf8');
const strPad = (4 - (json.length % 4)) % 4;
const headerPickle = Buffer.alloc(8 + json.length + strPad);
headerPickle.writeUInt32LE(4 + json.length + strPad, 0);
headerPickle.writeUInt32LE(json.length, 4);
json.copy(headerPickle, 8);
const sizePickle = Buffer.alloc(8);
sizePickle.writeUInt32LE(4, 0);
sizePickle.writeUInt32LE(headerPickle.length, 4);

const out = fs.openSync(outAsar, 'w');
fs.writeSync(out, sizePickle);
fs.writeSync(out, headerPickle);
const CH = 8 * 1024 * 1024, tmp = Buffer.alloc(CH);
for (const it of plan) {
  if (it.buf) { fs.writeSync(out, it.buf); continue; }
  let left = it.size, pos = it.origOffset;
  while (left > 0) {
    const n = fs.readSync(fd, tmp, 0, Math.min(CH, left), pos);
    fs.writeSync(out, tmp, 0, n);
    left -= n; pos += n;
  }
}
fs.closeSync(out);
console.log('Reemplazados:', replaced.length, replaced);
