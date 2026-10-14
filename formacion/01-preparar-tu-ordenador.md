# Prepara tu ordenador

> **Tu tutor para esta lección:** en Antigravity, escribe `/empezar` y el tutor comprueba e instala lo que falte y te guía en esto paso a paso. Esta lección te lleva por todos los prerrequisitos básicos de tu máquina.

## En esta lección

- Abrirás la terminal y escribirás tus primeros comandos.
- Instalarás Node.js, Git y Antigravity, y comprobarás que funcionan.
- Descargarás ClonaKit, instalarás sus piezas y arrancarás el tutor con `/empezar`.

## Lo que necesitas

- Un Mac o un PC con Windows y conexión a internet.
- Permiso para instalar programas en ese ordenador.
- Tu entorno de Antigravity listo.
- Entre 20 y 40 minutos.

## Paso 1. Abre la terminal

La *terminal* es una ventana donde le das órdenes al ordenador escribiendo, en vez de hacer clic. Cada orden se llama *comando*: lo escribes y pulsas Intro.

**Mac:** pulsa `Cmd + Espacio`, escribe `Terminal` y pulsa Intro. También está en Aplicaciones → Utilidades → Terminal.

**Windows:** haz clic derecho en el botón de Inicio y elige **Terminal** (Windows 11) o **Windows PowerShell** (Windows 10). PowerShell es el "idioma" de la terminal de Windows; los comandos del kit funcionan en él.

Prueba tu primer comando (vale en Mac y en Windows):

```bash
pwd
```

Te dice en qué carpeta estás. Para pegar texto en la terminal usa `Cmd + V` en Mac y `Ctrl + V` o clic derecho en Windows.

## Paso 2. Instala Node.js

*Node.js* es un programa que ejecuta JavaScript (el lenguaje de la web) fuera del navegador. Las herramientas de ClonaKit funcionan con él. Al instalarlo también se instala *npm*, que descarga las piezas que el kit necesita.

1. Ve a [nodejs.org](https://nodejs.org).
2. Descarga la versión **LTS** (*Long Term Support*: la estable, con soporte largo). Elige la **24**.
3. Abre el instalador y acepta las opciones por defecto.
4. **Cierra la terminal y ábrela de nuevo**, para que encuentre Node.js.
5. Comprueba la versión:

```bash
node -v
```

Debe salir algo como `v24.11.0` o un número mayor. El kit exige **22.19 o superior** si usas la serie 22, o **24.11 o superior** si usas la 24.

## Paso 3. Instala Git

*Git* guarda versiones de tu proyecto, como si hiciera fotos de cada momento. Lo usarás para publicar tu app (lección 06).

**Mac:**

```bash
xcode-select --install
```

Se abre una ventana: pulsa **Instalar** y espera (puede tardar varios minutos). Esto instala las herramientas para desarrolladores de Apple, que incluyen Git. Si prefieres otra vía, tienes opciones en [git-scm.com](https://git-scm.com/downloads).

**Windows:** descarga el instalador desde [git-scm.com](https://git-scm.com/downloads), ábrelo y acepta las opciones por defecto. Después, cierra y vuelve a abrir la terminal.

Comprueba que funciona (Mac y Windows):

```bash
git --version
```

Debe salir algo como `git version 2.` seguido de más números.

## Paso 4. Instala y prepara Antigravity

Antigravity es el entorno de desarrollo y ejecución de agentes de IA donde vive el tutor de ClonaKit.

- Si usas la CLI de Antigravity (`agy`): comprueba que está disponible en tu terminal.
- Si usas el entorno de Antigravity (IDE / Workspace): asegúrate de abrir la carpeta `ClonaKit` como tu workspace activo.

Con esto tendrás el asistente listo para interactuar contigo, guiarte paso a paso y ejecutar las herramientas del kit.

## Paso 5. Descarga ClonaKit

Consejo: guarda tus proyectos en una carpeta que **no** se sincronice con la nube (iCloud, OneDrive, Google Drive). El kit descarga miles de archivos pequeños y la sincronización lo ralentiza o lo estropea. Crea una carpeta `proyectos` en tu carpeta de usuario:

**Mac:**

```bash
mkdir -p ~/proyectos
cd ~/proyectos
```

**Windows (PowerShell):**

```powershell
mkdir ~\proyectos
cd ~\proyectos
```

`mkdir` crea una carpeta, `cd` (*change directory*) te mete en ella y `~` es tu carpeta de usuario.

Ahora coloca ahí el kit. Te llegó como archivo **ClonaKit.zip**:

1. Mueve el ZIP a la carpeta `proyectos` y descomprímelo (en Mac, doble clic; en Windows, clic derecho → "Extraer todo"). Aparecerá la carpeta `ClonaKit`.
2. Entra en ella desde la terminal:

```bash
cd ~/proyectos/ClonaKit
```

En Windows: `cd ~\proyectos\ClonaKit`.

El kit trae carpetas de configuración (como `.agent`, donde viven los skills del tutor). Es normal que algunas estén ocultas en Finder o en el Explorador: no las borres.

## Paso 6. Instala las dependencias del kit

Las *dependencias* son piezas de software que el kit usa, como REA. Se instalan con un comando, estando dentro de la carpeta `ClonaKit`:

```bash
npm install
```

Suele tardar poco, aunque verás muchas líneas. Los avisos que empiezan por `WARN` son normales; los que dicen `ERR!` no (mira "Si algo falla").

Después, comprueba que todo está en orden:

```bash
npm run comprobar
```

Verás una lista: ✅ significa que está bien, ❌ que falta algo imprescindible y ⚪️ que falta algo opcional (como Google Chrome o GitHub CLI, que usarás más adelante). Si algo falla, el propio comando te dice cómo arreglarlo.

## Paso 7. Inicia Antigravity y escribe `/empezar`

Abre la carpeta `ClonaKit` en tu entorno de Antigravity (IDE o CLI):

- Si usas la CLI: ejecuta `agy` o abre tu sesión de agente en esta carpeta.
- Si usas el entorno gráfico: abre la carpeta del kit como espacio de trabajo.

El tutor detectará las instrucciones del kit en `GEMINI.md` y los skills del proyecto (`/empezar`, `/clonar`, `/desplegar`).

El kit incluye configuración MCP para `rea` en `mcp_config.json`, lo que permite al agente interactuar con REA para preguntas avanzadas sobre cualquier aplicación.

Por último, escribe o pídele al tutor:

```
/empezar
```

El tutor comprobará que todo está en orden, instalará lo que falte y te explicará el kit.

## Si algo falla

- **"`node` o `git` no se reconoce" o "command not found".** Cierra la terminal y ábrela de nuevo. Si sigue igual, reinstala aceptando las opciones por defecto. En Windows, reinicia el ordenador.
- **Windows: "la ejecución de scripts está deshabilitada en este sistema" al usar `npm`.** PowerShell bloquea algunos scripts por defecto. Ejecuta esto una vez, confirma con `S` (o `Y`) y vuelve a intentarlo:

  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

- **`node -v` muestra una versión antigua (por ejemplo, `v18`).** Instala la LTS desde nodejs.org y reabre la terminal. Si ya tenías Node.js instalado de otra forma, pide ayuda al tutor.
- **`npm install` termina con `ERR!`.** Comprueba que estás en la carpeta del kit (`pwd` debe terminar en `ClonaKit`), que tienes internet y que tu Node.js es compatible. Si sigue, pega las últimas líneas del error a Antigravity y pide ayuda.
- **Mac: `xcode-select --install` dice que ya está instalado.** Perfecto: ya tienes Git. Compruébalo con `git --version`.

## Resumen

- La terminal es una ventana para dar órdenes escribiendo; en Mac es Terminal y en Windows, PowerShell o Terminal.
- Necesitas Node.js LTS (24), Git y Antigravity, y compruebas las herramientas con `node -v` y `git --version`.
- Descargas el kit, ejecutas `npm install` y `npm run comprobar` dentro de su carpeta, y abres Antigravity.
- El tutor cargará los skills del kit y escribirás `/empezar`.

**Siguiente lección →** [02 · Lo legal](02-lo-legal.md)
