// Extractor mínimo de archivos .asar de Electron
// Uso: node asar_extract.js <archivo.asar> <directorio_salida>
const fs = require('fs');
const path = require('path');

const [, , asarPath, outDir] = process.argv;
const fd = fs.openSync(asarPath, 'r');
const sizeBuf = Buffer.alloc(8);
fs.readSync(fd, sizeBuf, 0, 8, 0);
const headerPickleSize = sizeBuf.readUInt32LE(4);
const headerBuf = Buffer.alloc(headerPickleSize);
fs.readSync(fd, headerBuf, 0, headerPickleSize, 8);
const jsonLen = headerBuf.readUInt32LE(4);
const header = JSON.parse(headerBuf.slice(8, 8 + jsonLen).toString('utf8'));
const base = 8 + headerPickleSize;
const unpackedDir = asarPath + '.unpacked';

let nFiles = 0, nUnpacked = 0, nLinks = 0;
function walk(node, rel) {
  for (const [name, entry] of Object.entries(node.files)) {
    const r = path.join(rel, name);
    const dst = path.join(outDir, r);
    if (entry.files) {
      fs.mkdirSync(dst, { recursive: true });
      walk(entry, r);
    } else if (entry.link) {
      nLinks++;
      fs.writeFileSync(dst + '.symlink.txt', entry.link);
    } else if (entry.unpacked) {
      nUnpacked++;
      const src = path.join(unpackedDir, r);
      if (fs.existsSync(src)) fs.copyFileSync(src, dst);
    } else {
      nFiles++;
      const buf = Buffer.alloc(entry.size);
      if (entry.size > 0) fs.readSync(fd, buf, 0, entry.size, base + Number(entry.offset));
      fs.writeFileSync(dst, buf);
    }
  }
}
fs.mkdirSync(outDir, { recursive: true });
walk(header, '');
console.log({ nFiles, nUnpacked, nLinks });
