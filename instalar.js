// Instala la traducción al español en vivo办公套件 (vivo Office Kit, versión china) para Windows.
// Uso: node instalar.js [carpeta de instalación de la app]
// La carpeta es la que contiene pcsuite.exe. Si no se indica, se busca en el registro de Windows.
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, 'src');
const TR = path.join(__dirname, 'traducciones');
const VERSIONES_PROBADAS = ['6.8.2', '7.0.6'];

function paso(n, total, msg) { console.log(`\n[${n}/${total}] ${msg}`); }
function fallo(msg) { console.error(`\nERROR: ${msg}\n`); process.exit(1); }
function node(script, args, opts = {}) {
  execFileSync(process.execPath, ['--max-old-space-size=8192', path.join(SRC, script), ...args], { stdio: opts.quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit' });
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
// Registro de la última instalación: permite detectar si vivo actualizó la app
const estado = path.join(resources, 'app.asar.vivo-es.json');

function sha256(archivo) {
  const h = crypto.createHash('sha256');
  const fd = fs.openSync(archivo, 'r');
  const buf = Buffer.alloc(8 * 1024 * 1024);
  let n;
  while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n));
  fs.closeSync(fd);
  return h.digest('hex');
}

// La carpeta del editor lleva la fecha de compilación en el nombre (p. ej. 202609111200) y cambia en cada versión
function carpetaTinymce() {
  const base = path.join(E, 'static', 'tinymce');
  if (!fs.existsSync(base)) return null;
  const candidatas = fs.readdirSync(base).filter(d => fs.existsSync(path.join(base, d, 'plugins'))).sort();
  return candidatas.length ? path.join(base, candidatas[candidatas.length - 1]) : null;
}

try {
  // Siempre se parte del original, así el instalador se puede ejecutar varias veces
  paso(1, TOTAL, 'Copia de seguridad del original');
  const hashActual = sha256(asar);
  const previo = fs.existsSync(estado) ? JSON.parse(fs.readFileSync(estado, 'utf8')) : null;
  if (!fs.existsSync(original)) {
    fs.copyFileSync(asar, original);
    console.log(`  Guardada en ${original}`);
  } else if (previo && hashActual === previo.parcheado) {
    console.log('  La app ya tenía este parche; se rehace a partir del original guardado.');
  } else if (hashActual === sha256(original)) {
    console.log('  Ya existe app.asar.original; se usará como base.');
  } else {
    // app.asar no es ni el original guardado ni nuestro parche: vivo actualizó la app
    fs.copyFileSync(asar, original);
    console.log('  Se detectó una actualización de la app: se renovó la copia de seguridad.');
  }

  paso(2, TOTAL, 'Extrayendo la aplicación (puede tardar 1-2 minutos)');
  node('asar_extract.js', [original, app], { quiet: true });
  const version = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).version;
  console.log(`  Versión de la app: ${version}`);
  if (!VERSIONES_PROBADAS.includes(version)) console.log(`  AVISO: el parche se probó con las versiones ${VERSIONES_PROBADAS.join(', ')}. Puede que algunos textos queden sin traducir.`);
  if (!fs.existsSync(path.join(E, 'main.js'))) throw new Error('Estructura de la app no reconocida (falta dist/electron/main.js). Esta versión no es compatible.');
  const T = carpetaTinymce();
  if (!T) console.log('  AVISO: no se encontró el editor de notas (TinyMCE); se omitirá su traducción.');

  paso(3, TOTAL, 'Analizando los textos de la interfaz');
  node('extract_ui.js', [E, path.join(trabajo, 'ui_strings.json')], { quiet: true });
  let plugins = [];
  if (T) {
    plugins = fs.readdirSync(path.join(T, 'plugins')).map(p => `plugins/${p}/plugin.min.js`).filter(f => fs.existsSync(path.join(T, f)));
    node('extract_ui.js', [T, path.join(trabajo, 'ui_tiny.json'), ...plugins], { quiet: true });
  }

  const tr = ['traduccion_v6.json', 'traduccion_ui.json', 'traduccion_extra.json', 'traduccion_tiny.json'].map(f => path.join(TR, f)).join(',');
  paso(4, TOTAL, 'Traduciendo la interfaz');
  node('apply_ui.js', [E, path.join(trabajo, 'ui_strings.json'), tr, path.join(trabajo, 'out_ui')]);

  paso(5, TOTAL, 'Traduciendo el editor de notas');
  if (T) node('apply_ui.js', [T, path.join(trabajo, 'ui_tiny.json'), tr, path.join(trabajo, 'out_tiny')]);
  else console.log('  Omitido.');

  paso(6, TOTAL, 'Activando el idioma español');
  const parche = path.join(trabajo, 'parche');
  node('patch_es.js', [app, parche, path.join(trabajo, 'out_ui')]);
  if (T) fs.cpSync(path.join(trabajo, 'out_tiny'), path.join(parche, path.relative(app, T)), { recursive: true });

  // Verificación: todo el JavaScript modificado debe tener sintaxis válida
  const listar = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(x => x.isDirectory() ? listar(path.join(d, x.name)) : [path.join(d, x.name)]);
  for (const f of listar(parche).filter(f => f.endsWith('.js'))) {
    try { execFileSync(process.execPath, ['--check', f], { stdio: 'ignore' }); }
    catch { throw new Error(`El archivo modificado ${path.relative(parche, f)} no es válido; se cancela la instalación.`); }
  }

  paso(7, TOTAL, 'Reempaquetando');
  const nuevo = path.join(trabajo, 'app_es.asar');
  node('asar_repack.js', [original, parche, nuevo], { quiet: true });

  paso(8, TOTAL, 'Instalando');
  fs.copyFileSync(nuevo, asar);
  fs.writeFileSync(estado, JSON.stringify({ version, original: sha256(original), parcheado: sha256(asar), fecha: new Date().toISOString() }, null, 2));
  console.log('\nListo. Abra vivo办公套件: ahora debería mostrarse en español.');
  console.log('Para deshacer los cambios, ejecute restaurar.bat.');
} catch (e) {
  console.error(`\nERROR: ${e.message}`);
  console.error('No se modificó la aplicación (su app.asar sigue intacto).');
  process.exitCode = 1;
} finally {
  fs.rmSync(trabajo, { recursive: true, force: true });
}
