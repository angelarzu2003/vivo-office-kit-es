// Restaura el app.asar original de vivo办公套件 (deshace la traducción).
// Uso: node restaurar.js [carpeta de instalación de la app]
const fs = require('fs');
const path = require('path');
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

const dirApp = process.argv[2] || buscarEnRegistro();
if (!dirApp) { console.error('No se encontró la app. Uso: node restaurar.js "C:\\ruta\\a\\pcsuite"'); process.exit(1); }
const original = path.join(dirApp, 'resources', 'app.asar.original');
if (!fs.existsSync(original)) { console.error(`No hay copia de seguridad en ${original}. No hay nada que restaurar.`); process.exit(1); }
fs.copyFileSync(original, path.join(dirApp, 'resources', 'app.asar'));
console.log('Original restaurado. La app vuelve a estar en chino.');
