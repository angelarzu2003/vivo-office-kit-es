# Solución de problemas

Guía de los fallos más comunes y cómo resolverlos. **Busca en esta página (Ctrl+F) el texto exacto del mensaje que te aparece.**

> **Importante:** si el instalador muestra `ERROR`, tu app **no se modificó**. El instalador solo reemplaza `app.asar` cuando todo terminó bien, así que puedes reintentar sin miedo.

## Índice

1. [Antes de instalar](#1-antes-de-instalar)
2. [Mensajes del instalador](#2-mensajes-del-instalador)
3. [Después de instalar](#3-después-de-instalar)
4. [Problemas de conexión con el teléfono](#4-problemas-de-conexión-con-el-teléfono)
5. [Restaurar el original](#5-restaurar-el-original)
6. [Cómo reportar un problema](#6-cómo-reportar-un-problema)

---

## 1. Antes de instalar

### Al hacer doble clic en `instalar.bat` la ventana se abre y se cierra al instante, o dice "Cannot find module ...instalar.js"

Estás ejecutando el archivo **desde dentro del ZIP**, sin descomprimirlo. Windows solo extrae el `.bat` a una carpeta temporal y el resto de archivos no existe.

**Solución:** clic derecho en el ZIP > **Extraer todo...**, entra en la carpeta extraída y ejecuta `instalar.bat` desde ahí.

### "Windows protegió su PC" (SmartScreen) o el antivirus bloquea `instalar.bat`

Windows marca como "descargados de internet" los archivos que vienen de un ZIP.

**Solución:**
- En el aviso de SmartScreen, pulsa **Más información > Ejecutar de todas formas**.
- O bien, antes de descomprimir: clic derecho en el ZIP > **Propiedades**, marca **Desbloquear** > Aceptar, y después extrae.
- Si tu antivirus lo pone en cuarentena, restáuralo y añade la carpeta del parche como excepción. El código es abierto y puedes revisarlo en este repositorio.

### "No se encontro Node.js. Instale la version LTS desde https://nodejs.org..."

El parche necesita Node.js para funcionar.

**Solución:**
1. Descarga e instala la versión **LTS** desde https://nodejs.org (deja las opciones por defecto).
2. **Cierra y vuelve a abrir** cualquier ventana de terminal o el Explorador. Si sigue sin detectarlo, reinicia el PC: Windows solo actualiza el PATH en programas abiertos después de instalar.
3. Vuelve a ejecutar `instalar.bat`.

Para comprobar que quedó instalado, abre una terminal (tecla Windows, escribe `cmd`) y ejecuta `node -v`: debe mostrar `v18` o superior.

### Tengo Node.js, pero aparece un error de sintaxis (`SyntaxError: Unexpected token`) o `fs.cpSync is not a function`

Tu versión de Node.js es demasiado antigua.

**Solución:** instala la versión LTS actual desde https://nodejs.org. Se requiere Node.js **18 o superior**.

### "No se pudieron instalar las dependencias. Compruebe su conexion a internet."

La primera vez el instalador descarga una pequeña librería (`acorn`) con `npm`.

**Solución:**
- Comprueba que tienes internet y vuelve a intentarlo.
- En redes de empresa o escuela con proxy, configúralo en una terminal:
  ```
  npm config set proxy http://usuario:clave@proxy:puerto
  npm config set https-proxy http://usuario:clave@proxy:puerto
  ```
- Si falló a medias, borra la carpeta `node_modules` del parche y vuelve a ejecutar `instalar.bat`.

### "Cannot find module 'acorn'"

La instalación de dependencias quedó incompleta.

**Solución:** borra la carpeta `node_modules` del parche y vuelve a ejecutar `instalar.bat` con internet.

### Tengo Mac

El parche es **solo para Windows**. La versión de Mac tiene otra estructura y no es compatible.

---

## 2. Mensajes del instalador

### "No se encontró vivo办公套件 en el registro. Indique la carpeta que contiene pcsuite.exe"

La app no está registrada en Windows. Suele pasar con copias portátiles o copiadas de otro PC.

**Solución (la más fácil):** **arrastra la carpeta de la app** (la que contiene `pcsuite.exe`) **y suéltala encima de `instalar.bat`**.

O desde una terminal en la carpeta del parche:
```
node instalar.js "C:\ruta\a\pcsuite"
```

Ubicaciones habituales:
- `C:\Program Files (x86)\pcsuite`
- `C:\Program Files\pcsuite`

### "No existe ...\resources\app.asar. ¿Es la carpeta correcta?"

La carpeta que indicaste no es la de la app.

**Solución:** indica la carpeta que contiene **`pcsuite.exe`**, no una subcarpeta (`resources`) ni el acceso directo del escritorio.

Para encontrarla: clic derecho en el acceso directo de vivo办公套件 > **Abrir la ubicación del archivo**.

### "vivo办公套件 está en ejecución. Ciérrela por completo..."

La app sigue abierta, aunque no veas la ventana.

**Solución:**
1. Busca el icono de vivo junto al reloj (puede estar en la flecha `^`), haz clic derecho y elige **Salir**.
2. Si no lo encuentras, abre el **Administrador de tareas** (Ctrl+Shift+Esc), busca `pcsuite.exe` y pulsa **Finalizar tarea**.

### "Sin permiso para escribir en la carpeta de la app. Ejecute instalar.bat como administrador"

La app está instalada en `C:\Program Files` o `C:\Program Files (x86)`, que requieren permisos de administrador.

**Solución:** clic derecho en `instalar.bat` > **Ejecutar como administrador**.

### El instalador parece congelado en "[2/8] Extrayendo la aplicación"

No está congelado. La app tiene más de 20 000 archivos internos y este paso tarda entre **1 y 4 minutos**, más en discos duros mecánicos.

**Solución:** espera. Si pasan más de 10 minutos, revisa que tu antivirus no esté analizando cada archivo; puedes pausarlo temporalmente.

### "AVISO: el parche se probó con las versiones 6.8.2, 7.0.6. Puede que algunos textos queden sin traducir."

No es un error. Tu versión de la app es distinta a las probadas. El instalador continúa y traduce todo lo que reconoce; puede que algunos textos nuevos queden en chino.

**Solución:** si la instalación termina con "Listo", úsala normalmente. Si quieres ayudar, abre un *issue* indicando tu versión.

### "Estructura de la app no reconocida (falta el editor TinyMCE)"

Error de la **versión 1.0.0 del parche**, que solo reconocía la app 7.0.6.

**Solución:** descarga la versión más reciente de este repositorio.

**No descargues ni copies ninguna carpeta `tinymce`.** El editor ya viene dentro de la app (`resources\app.asar`) y el instalador solo trabaja con ese archivo. Si copiaste una carpeta `tinymce` en la carpeta de la app, **bórrala**: no sirve para nada.

### "AVISO: no se encontró el editor de notas (TinyMCE); se omitirá su traducción."

No es un error grave. Tu versión de la app tiene el editor en otra ubicación. Todo lo demás se traduce y la app funciona; solo el editor de notas queda sin traducir.

### "Estructura de la app no reconocida (falta dist/electron/main.js). Esta versión no es compatible."

El `app.asar` no es el de vivo办公套件, o está dañado.

**Solución:**
1. Comprueba que la carpeta es la de vivo办公套件 (la que tiene `pcsuite.exe`).
2. Si la app está dañada, reinstálala desde la web oficial de vivo y vuelve a ejecutar el instalador.

### "no se encontró la función del idioma por defecto (versión no compatible)", "no se encontró la inicialización de i18n" o "no se encontró handleExEnv"

Tu versión de la app activa el idioma de una forma que el parche aún no reconoce. Puede ser una versión muy antigua o una muy nueva.

**Solución:**
- Actualiza la app a la versión **7.0.6** (o a la más reciente compatible) y vuelve a intentarlo.
- Abre un *issue* indicando la "Versión de la app" que mostró el instalador.

### "se esperaban 1 coincidencias de ... hay 0"

Igual que el caso anterior: la versión de la app no es compatible con el parche.

**Solución:** abre un *issue* con la versión y el texto completo del error.

### "El archivo modificado ... no es válido; se cancela la instalación."

Una comprobación de seguridad detectó que una traducción rompería un archivo de la app, y se canceló todo antes de tocar nada.

**Solución:** abre un *issue* con el mensaje completo y la versión de la app.

### "ENOSPC: no space left on device"

No queda espacio en el disco. El instalador necesita unos **1,5 GB libres de forma temporal** en el disco del sistema (C:).

**Solución:** libera espacio (Configuración > Sistema > Almacenamiento > Archivos temporales) y vuelve a intentarlo.

### "EBUSY: resource busy or locked" o "EPERM: operation not permitted" al final de la instalación

Otro programa tiene abierto `app.asar`: normalmente la propia app, su servicio en segundo plano o un antivirus analizándolo.

**Solución:**
1. Cierra la app por completo (ver "está en ejecución").
2. Reinicia el PC y ejecuta `instalar.bat` como administrador **antes** de abrir la app.
3. Si persiste, pausa el antivirus durante la instalación.

### La ventana muestra caracteres raros en lugar de acentos o chino

Es solo un problema de la fuente de la consola en Windows antiguos; no afecta a la instalación.

**Solución:** ignóralo y fíjate en si el último mensaje es "Listo" o "ERROR".

---

## 3. Después de instalar

### Algunos textos siguen en chino

Algunos se dejan en chino a propósito, porque traducirlos rompería funciones de la app:
- **Calendario lunar** (十七, 廿四, 初八…) y las marcas **休/班** de días libres o laborables. Puedes desactivar el calendario lunar en los ajustes del Calendario.
- **Nombres de álbumes que vienen del teléfono** (相机, 视频…).
- **Contenido que envían los servidores de vivo**: respuestas de la IA, nombres de categorías, avisos.
- **Ventanas nativas** de duplicado de pantalla, llamadas y cámara, que son programas aparte.

Si encuentras otro texto en chino, abre un *issue* con una captura (revisa la sección 6).

### Algunos textos aparecen en inglés

Son textos que la app trae en su traducción oficial al inglés y no en la española. Se muestran en inglés en lugar de chino. Puedes reportarlos para traducirlos.

### La app volvió a estar en chino

Casi seguro que **vivo actualizó la app**, y la actualización reemplaza los archivos traducidos.

**Solución:** vuelve a ejecutar `instalar.bat`. Detecta la actualización, renueva la copia de seguridad y traduce la versión nueva.

### La app no abre, se queda en blanco o muestra "抱歉，vivo办公套件运行异常" (o su traducción "Lo sentimos, Kit de oficina de vivo tuvo un error")

**Solución:**
1. Ejecuta `restaurar.bat` para volver al original.
2. Abre la app. **Si con el original tampoco funciona**, el problema no es del parche: reinstala la app desde la web de vivo.
3. Si con el original funciona pero con el parche no, abre un *issue* con tu versión de la app.

### Una actualización de vivo falla después de instalar el parche

**Solución:** ejecuta `restaurar.bat`, actualiza la app y vuelve a ejecutar `instalar.bat`.

### La IA (Copiloto BlueLM / Creador con IA) responde en chino

El parche traduce las instrucciones que la app envía a la IA, pero el modelo de vivo está orientado al chino y puede responder en ese idioma.

**Solución:** pídele explícitamente en tu mensaje "responde en español".

### Las fechas tienen un formato raro

Algunos formatos de fecha se adaptaron a `DD/MM/YYYY`. Si ves alguno incorrecto, repórtalo con una captura.

---

## 4. Problemas de conexión con el teléfono

> El parche **no modifica la conexión**: el servicio nativo de conexión (`pcsuite.exe` y sus programas en C++) no se toca. Para comprobarlo, ejecuta `restaurar.bat` e intenta conectar con la app original. Si falla igual, el problema es la red o la configuración.

### "Se agotó el tiempo de espera de conexión" aunque el teléfono y el PC están en la misma red Wi-Fi

La causa más común es el **aislamiento de clientes**. Las redes Wi-Fi públicas (cafeterías, hoteles, escuelas, redes "Free WiFi", y a veces la red de invitados de casa) impiden que los dispositivos se comuniquen entre sí, aunque ambos tengan internet.

**Cómo comprobarlo:** en el teléfono, mira su IP en Ajustes > Wi-Fi > (tu red). En el PC, abre `cmd` y ejecuta:
```
ping IP_DEL_TELEFONO
```
Si responde "Tiempo de espera agotado" o "Host de destino inaccesible", la red los está aislando.

**Soluciones (de más a menos fiable):**
1. **Conexión USB:** botón "Conexión USB" (ver más abajo).
2. **Bluetooth:** con el Bluetooth del PC y del teléfono activados y el teléfono desbloqueado, pulsa "Conectar ahora" y **espera 30–60 segundos sin cerrar la app**. Esta vía crea un enlace directo y no depende del router.
3. **Otra red:** la de casa, o el punto de acceso de otro teléfono.

### Funciona en la red de casa pero no siempre

- **Perfil de red:** en Windows, ve a Configuración > Red e Internet > Wi-Fi > (tu red) y cambia el perfil a **Privada**. Con el perfil **Público**, el firewall de Windows bloquea conexiones entrantes.
- **Firewall:** si Windows preguntó si permitir el acceso a `pcsuite.exe` y lo denegaste, ve a Panel de control > Firewall de Windows Defender > Permitir una aplicación, y marca `pcsuite` en **Privada**.
- **VPN o redes virtuales** (Tailscale, ZeroTier, VPN de empresa, Hyper-V/WSL): pueden desviar el tráfico. Desactívalas temporalmente para probar.
- **Bandas Wi-Fi distintas:** algunos routers separan 2,4 GHz y 5 GHz, o la red de invitados, en subredes distintas. Conecta ambos dispositivos a la misma red y banda.

### La conexión USB no funciona

1. Usa un cable **de datos**: algunos cables solo cargan.
2. En el teléfono, cuando aparezca el aviso, elige **"Conectar a Kit de oficina"** y **permite la depuración USB**.
3. Si no aparece el aviso:
   - Activa el modo desarrollador: Ajustes > Acerca del teléfono > Información de la versión, y toca **7 veces** "Versión de software".
   - Ve a Ajustes > Sistema > **Opciones de desarrollador** y activa **Depuración USB**.
   - Desconecta y vuelve a conectar el cable.
4. Prueba otro puerto USB, preferiblemente uno trasero o directo de la placa, sin hub.
5. Si Windows no reconoce el teléfono, reinstala los drivers: están en la carpeta `drivers` de la app.

### "Bt recv data failed" en los registros, o el Bluetooth no conecta

- Mantén el teléfono **desbloqueado con la pantalla encendida** durante la conexión.
- Activa en el teléfono: Ajustes > Más conexiones > **Servicio de conexión de dispositivos**.
- Inicia sesión con **la misma cuenta vivo** en el teléfono y en la app del PC.
- Apaga y enciende el Bluetooth en ambos dispositivos.

### El teléfono no aparece en la lista de dispositivos

- Ambos dispositivos deben tener **la misma cuenta vivo**.
- El teléfono debe ser **de la versión china (OriginOS)**. La versión china del Kit no siempre detecta teléfonos de versión internacional (Funtouch OS global), y viceversa.
- Actualiza la app "Kit de oficina" / "办公套件" del teléfono desde su tienda de aplicaciones.

---

## 5. Restaurar el original

### "No hay copia de seguridad en ...app.asar.original. No hay nada que restaurar."

El parche nunca se instaló en esa carpeta, o la copia se borró manualmente.

**Solución:** si la app está en español y quieres volver al chino sin copia, reinstala la app desde la web de vivo.

### "La app se actualizó después de instalar el parche: ya está en su versión original. No se cambió nada."

No es un error. vivo actualizó la app y la actualización ya reemplazó los archivos traducidos por los originales. Restaurar la copia antigua estropearía la app, así que no se hace.

### "No se encontró la app."

Igual que en la instalación: arrastra la carpeta de la app (la que contiene `pcsuite.exe`) encima de `restaurar.bat`.

---

## 6. Cómo reportar un problema

Abre un *issue* en este repositorio con:

1. **La versión de la app**, que el instalador muestra como "Versión de la app: X.X.X".
2. **El texto completo de la ventana del instalador.** Para copiarlo, selecciónalo con el ratón y pulsa Ctrl+C. En la consola clásica: clic derecho en la barra de título > Editar > Seleccionar todo, y pulsa Enter. También sirve una captura de pantalla (tecla Windows + Shift + S).
3. **Tu versión de Windows** (Windows 10 / 11).
4. Si es un problema dentro de la app: una **captura** de la pantalla.

**Antes de publicar capturas o registros, revisa que no contengan datos personales:** notas, correos, contraseñas, nombres de dispositivos, números de teléfono o tu cuenta vivo. Recorta o tapa esa información.

Si te piden los registros de la app, están en `%APPDATA%\pcsuite\log` (pega esa ruta en la barra del Explorador). Los más útiles son:
- `framework_log\render\render-FECHA.log`
- `conn_service_log\ConnService_FECHA.log` (para problemas de conexión)

Estos registros contienen identificadores de tu cuenta y de tus dispositivos: envíalos solo si es necesario y nunca los publiques completos.
