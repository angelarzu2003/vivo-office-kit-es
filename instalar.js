// Instala la traducción al español en vivo办公套件 (vivo Office Kit, versión china) para Windows.
// Uso: node instalar.js [carpeta de instalación de la app]
// La carpeta es la que contiene pcsuite.exe. Si no se indica, se busca en el registro de Windows.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, 'src');
const TR = path.join(__dirname, 'traducciones');
const VERSION_PROBADA = '7.0.6';

function paso(n, total, msg) { console.log(`\n[${n}/${total}] ${msg}`); }
function fallo(msg) { console.error(`\nERROR: ${msg}\n`); process.exit(1); }
function node(script, args, opts = {}) {
  execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(SRC, script), ...args], { stdio: opts.quiet ? 'ignore' : 'inherit' });
}

// ---------- Localizar la instalación ----------
function buscarEnRegistro() {
  const claves = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\pcsuite',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\pcsuite',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\pcsuite',
  ];
  for (const clave of claves) {
    try {
      const salida = execFileSync('reg', ['query', clave, '/v', 'UninstallString'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const m = salida.match(/UninstallString\s+REG_\w+\s+(.+)/);
      if (m) return path.dirname(m[1].trim().replace(/^"|"$/g, ''));
    } catch { /* clave inexistente */ }
  }
  return null;
}

const dirApp = process.argv[2] || buscarEnRegistro();
if (!dirApp) fallo('No se encontró vivo办公套件 en el registro. Indique la carpeta que contiene pcsuite.exe:\n  node instalar.js "C:\\ruta\\a\\pcsuite"');
const resources = path.join(dirApp, 'resources');
const asar = path.join(resources, 'app.asar');
const original = path.join(resources, 'app.asar.original');
if (!fs.existsSync(asar)) fallo(`No existe ${asar}. ¿Es la carpeta correcta?`);
console.log(`Aplicación encontrada en: ${dirApp}`);

// ---------- La app debe estar cerrada ----------
let rutasEnEjecucion = [];
try {
  rutasEnEjecucion = execFileSync('powershell', ['-NoProfile', '-Command', '(Get-Process pcsuite -ErrorAction SilentlyContinue).Path'], { encoding: 'utf8' })
    .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
} catch { /* PowerShell no disponible: se continúa */ }
const exeApp = path.resolve(dirApp, 'pcsuite.exe').toLowerCase();
if (rutasEnEjecucion.some(r => path.resolve(r).toLowerCase() === exeApp)) {
  fallo('vivo办公套件 está en ejecución. Ciérrela por completo (también desde el icono de la bandeja) y vuelva a intentarlo.');
}

// ---------- Permisos de escritura ----------
try { fs.accessSync(resources, fs.constants.W_OK); const t = path.join(resources, '.prueba_escritura'); fs.writeFileSync(t, ''); fs.unlinkSync(t); }
catch { fallo('Sin permiso para escribir en la carpeta de la app. Ejecute instalar.bat como administrador (clic derecho > Ejecutar como administrador).'); }

const TOTAL = 8;
const trabajo = fs.mkdtempSync(path.join(os.tmpdir(), 'vivo-es-'));
const app = path.join(trabajo, 'app');
const E = path.join(app, 'dist', 'electron');
const T = path.join(E, 'static', 'tinymce', '202609111200');

try {
  // Siempre se parte del original, así el instalador se puede ejecutar varias veces
  paso(1, TOTAL, 'Copia de seguridad del original');
  if (!fs.existsSync(original)) { fs.copyFileSync(asar, original); console.log(`  Guardada en ${original}`); }
  else console.log('  Ya existe app.asar.original; se usará como base.');

  paso(2, TOTAL, 'Extrayendo la aplicación (puede tardar 1-2 minutos)');
  node('asar_extract.js', [original, app], { quiet: true });
  const version = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).version;
  console.log(`  Versión de la app: ${version}`);
  if (version !== VERSION_PROBADA) console.log(`  AVISO: el parche se probó con la versión ${VERSION_PROBADA}. Puede que algunos textos queden sin traducir.`);
  if (!fs.existsSync(T)) fallo('Estructura de la app no reconocida (falta el editor TinyMCE). Esta versión no es compatible.');

  paso(3, TOTAL, 'Analizando los textos de la interfaz');
  node('extract_ui.js', [E, path.join(trabajo, 'ui_strings.json')], { quiet: true });
  const plugins = fs.readdirSync(path.join(T, 'plugins')).map(p => `plugins/${p}/plugin.min.js`).filter(f => fs.existsSync(path.join(T, f)));
  node('extract_ui.js', [T, path.join(trabajo, 'ui_tiny.json'), ...plugins], { quiet: true });

  const tr = ['traduccion_ui.json', 'traduccion_extra.json', 'traduccion_tiny.json'].map(f => path.join(TR, f)).join(',');
  paso(4, TOTAL, 'Traduciendo la interfaz');
  node('apply_ui.js', [E, path.join(trabajo, 'ui_strings.json'), tr, path.join(trabajo, 'out_ui')]);

  paso(5, TOTAL, 'Traduciendo el editor de notas');
  node('apply_ui.js', [T, path.join(trabajo, 'ui_tiny.json'), tr, path.join(trabajo, 'out_tiny')]);

  paso(6, TOTAL, 'Activando el idioma español');
  const parche = path.join(trabajo, 'parche');
  node('patch_es.js', [app, parche, path.join(trabajo, 'out_ui')], { quiet: true });
  fs.cpSync(path.join(trabajo, 'out_tiny'), path.join(parche, 'dist', 'electron', 'static', 'tinymce', '202609111200'), { recursive: true });

  paso(7, TOTAL, 'Reempaquetando');
  const nuevo = path.join(trabajo, 'app_es.asar');
  node('asar_repack.js', [original, parche, nuevo], { quiet: true });

  paso(8, TOTAL, 'Instalando');
  fs.copyFileSync(nuevo, asar);
  console.log('\nListo. Abra vivo办公套件: ahora debería mostrarse en español.');
  console.log('Para deshacer los cambios, ejecute restaurar.bat.');
} catch (e) {
  console.error(`\nERROR: ${e.message}`);
  console.error('No se modificó la aplicación (su app.asar sigue intacto).');
  process.exitCode = 1;
} finally {
  fs.rmSync(trabajo, { recursive: true, force: true });
}
