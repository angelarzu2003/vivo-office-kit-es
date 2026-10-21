# vivo Office Kit en español (versión china)

Parche comunitario que traduce al **español** la versión china de **vivo办公套件** (vivo Office Kit / PC Suite) para Windows.

La versión china de la app trae traducción al español, pero la tiene bloqueada en chino. Además, muchas secciones exclusivas de China (Calendario, Álbum, Grabadora, Notas Origin, ajustes de sincronización, buscador, asistente de IA) tienen el texto escrito directamente en el código. Este parche activa el español y traduce también esas secciones.

> **Este repositorio no contiene software de vivo.** Solo incluye scripts y traducciones. El parche se aplica sobre la copia de la app que ya tienes instalada.

## Requisitos

- Windows 10 u 11
- **vivo办公套件 6.8.2 o 7.0.6** instalado (versiones probadas; con otras puede funcionar parcialmente)
- [Node.js](https://nodejs.org) versión LTS (18 o superior)
- Unos 1,5 GB libres en el disco del sistema (se usan de forma temporal)

## Instalación

1. Descarga este repositorio: botón verde **Code > Download ZIP**, y descomprímelo.
2. **Cierra vivo办公套件 por completo**, también desde el icono junto al reloj.
3. Haz doble clic en **`instalar.bat`**.
   - Si la app está instalada en `C:\Program Files`, usa **clic derecho > Ejecutar como administrador**.
   - La primera vez descarga una pequeña dependencia, así que necesita internet.
4. Espera unos 2-4 minutos hasta que aparezca **"Listo"**.
5. Abre la app: ya estará en español.

El instalador encuentra la app automáticamente. Si no la encuentra, indícale la carpeta que contiene `pcsuite.exe`:

```
node instalar.js "D:\ruta\a\pcsuite"
```

## Deshacer los cambios

Haz doble clic en **`restaurar.bat`**. Restaura el archivo original, que el instalador guardó como `resources\app.asar.original`.

## Si la app se actualiza

Las actualizaciones de vivo reemplazan el archivo traducido y la app vuelve a estar en chino. Solo tienes que volver a ejecutar `instalar.bat`: detecta la actualización, renueva la copia de seguridad y traduce la versión nueva.

## Solución de problemas

**"Estructura de la app no reconocida (falta el editor TinyMCE)"**
Este error lo daba la versión 1.0.0 del parche con versiones de la app distintas de la 7.0.6. Descarga la versión más reciente de este repositorio.

**No descargues ni copies ninguna carpeta `tinymce`.** El editor ya viene dentro de la app, en `resources\app.asar`, y el instalador solo trabaja con ese archivo. Si copiaste una carpeta `tinymce` dentro de la carpeta de la app (por ejemplo en `resources`), bórrala: no sirve para nada.

**"no se encontró la función del idioma por defecto (versión no compatible)"**
Tu versión de la app tiene un código distinto a las probadas. Abre un *issue* indicando la versión que muestra el instalador. Mientras tanto, actualizar la app a la versión 7.0.6 lo soluciona.

**"Sin permiso para escribir en la carpeta de la app"**
Ejecuta `instalar.bat` con clic derecho > **Ejecutar como administrador**.

**"vivo办公套件 está en ejecución"**
Cierra la app desde el icono junto al reloj (clic derecho > Salir).

## Cómo funciona

La interfaz de la app está hecha con Electron, y su código vive en `resources\app.asar`. El instalador sigue estos pasos:

1. **Guarda una copia** del `app.asar` original y trabaja siempre sobre ella, así que se puede ejecutar varias veces. En `resources\app.asar.vivo-es.json` registra los hashes de lo instalado; así detecta si vivo actualizó la app.
2. **Extrae** el `app.asar` en una carpeta temporal.
3. **Activa el español**: cambia el idioma bloqueado (`zh_CN`) por `es_US` y completa las 486 claves que faltaban en la traducción oficial de vivo.
4. **Traduce los textos escritos directamente en el código.** Analiza el JavaScript con un analizador sintáctico (acorn) y sustituye solo los textos visibles. No toca los registros internos, las comparaciones con datos del teléfono o del servidor, las rutas de carpetas ni las consultas a la base de datos.
5. **Aplica reglas especiales** a las frases que se construyen por piezas: días de la semana, reglas de repetición del calendario, cumpleaños y formatos de fecha.
6. **Comprueba la sintaxis** de cada archivo modificado.
7. **Reempaqueta** el `app.asar` y lo instala solo si todo salió bien. Si algo falla, la app queda intacta.

### Estructura del repositorio

| Ruta | Contenido |
|---|---|
| `instalar.bat` / `instalar.js` | Instalador |
| `restaurar.bat` / `restaurar.js` | Restaura el original |
| `src/asar_extract.js`, `src/asar_repack.js` | Leen y escriben el formato `.asar` |
| `src/extract_ui.js` | Localiza los textos visibles en chino (análisis AST) |
| `src/apply_ui.js` | Aplica las traducciones por posición exacta |
| `src/rules.js` | Reglas para frases compuestas por piezas |
| `src/allow.json` | Etiquetas internas que se traducen de forma uniforme |
| `src/patch_es.js` | Activa el idioma español |
| `traducciones/*.json` | Las traducciones (texto chino → español); `traduccion_v6.json` contiene los textos exclusivos de la 6.8.x |

## Limitaciones conocidas

- **Siguen en chino:**
  - el calendario lunar (十七, 廿四…) y las marcas 休/班; se puede desactivar el calendario lunar en los ajustes del Calendario;
  - los nombres de álbumes que vienen del teléfono;
  - el contenido que envían los servidores de vivo;
  - las ventanas nativas de duplicado de pantalla, llamadas y cámara.
- **Calidad de la traducción:** las traducciones adicionales son de la comunidad, no oficiales. Se agradecen correcciones.
- **Conexión por Wi-Fi:** las redes Wi-Fi públicas suelen aislar los dispositivos entre sí y la conexión fallará. No tiene que ver con el parche; usa USB, una red doméstica o la conexión por Bluetooth.

## Contribuir

¿Encontraste un texto en chino o una traducción mejorable? Abre un *issue* con una captura o envía un *pull request* editando `traducciones/traduccion_ui.json`. El formato es `"texto en chino": "traducción"`.

**Antes de publicar capturas, revisa que no muestren datos personales** (notas, correos, contraseñas, nombres de dispositivos).

## Aviso legal

Proyecto comunitario, sin relación con vivo Mobile Communication Co., Ltd. "vivo" y "vivo办公套件" son marcas de sus respectivos propietarios. Este repositorio no distribuye software de vivo. Úsalo bajo tu propia responsabilidad: modifica archivos de una aplicación instalada y una actualización de la app puede revertir los cambios.

Licencia de los scripts y traducciones de este repositorio: [MIT](LICENSE).
