// Restaura el app.asar original de vivo办公套件 (deshace la traducción).
// Uso: node restaurar.js [carpeta de instalación de la app]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

function buscarEnRegistro() {
  for (const clave of [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\pcsuite',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\pcsuite',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\pcsuite',
  ]) {
    try {
      const m = execFileSync('reg', ['query', clave, '/v', 'UninstallString'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .match(/UninstallString\s+REG_\w+\s+(.+)/);
      if (m) return path.dirname(m[1].trim().replace(/^"|"$/g, ''));
    } catch { /* clave inexistente */ }
  }
  return null;
}

function sha256(archivo) {
  const h = crypto.createHash('sha256');
  const fd = fs.openSync(archivo, 'r');
  const buf = Buffer.alloc(8 * 1024 * 1024);
  let n;
  while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n));
  fs.closeSync(fd);
  return h.digest('hex');
}

const dirApp = process.argv[2] || buscarEnRegistro();
if (!dirApp) { console.error('No se encontró la app. Uso: node restaurar.js "C:\\ruta\\a\\pcsuite"'); process.exit(1); }
const resources = path.join(dirApp, 'resources');
const asar = path.join(resources, 'app.asar');
const original = path.join(resources, 'app.asar.original');
const estado = path.join(resources, 'app.asar.vivo-es.json');
if (!fs.existsSync(original)) { console.error(`No hay copia de seguridad en ${original}. No hay nada que restaurar.`); process.exit(1); }

// Si vivo actualizó la app, app.asar ya es el original nuevo y la copia guardada es de la versión anterior
if (fs.existsSync(estado)) {
  const previo = JSON.parse(fs.readFileSync(estado, 'utf8'));
  if (sha256(asar) !== previo.parcheado) {
    console.log('La app se actualizó después de instalar el parche: ya está en su versión original. No se cambió nada.');
    process.exit(0);
  }
}

fs.copyFileSync(original, asar);
fs.rmSync(estado, { force: true });
console.log('Original restaurado. La app vuelve a estar en chino.');
