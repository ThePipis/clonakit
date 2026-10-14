# Taller

> **Demo de la receta `editor-codigo-ia`**, construida por ClonaKit en sala limpia a partir de [su ficha](../FICHA.md). Pruébala con `npm run demo -- editor-codigo-ia` y después crea la tuya, con tu nombre y tu marca, escribiendo `/clonar` en Antigravity.

Un pequeño editor de código en el navegador para crear páginas web con varios archivos (HTML, CSS y JavaScript), verlas funcionando al momento y organizar en un panel de **misiones** los encargos que le haces a una IA.

Inspirada en las funciones de Google Antigravity. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

## Funciones

- **Proyectos y árbol de archivos.** Crea proyectos vacíos o con una plantilla básica (`index.html`, `style.css` y `app.js`). Carpetas y archivos con icono según su tipo: crear, renombrar y borrar (con confirmación), con clic derecho o con el botón ⋯. Buscador para filtrar por nombre. Puedes arrastrar archivos (o carpetas) desde tu ordenador al árbol.
- **Editor.** Pestañas que se reordenan arrastrándolas, con un punto ámbar si hay cambios sin guardar. Números de línea, Tab y Mayús+Tab para sangrar y quitar sangría (también varias líneas a la vez), sangría automática al pulsar Intro, guardar con Ctrl/Cmd+S y barra de estado con línea, columna, tipo de archivo y «Guardado» / «Sin guardar».
- **Vista previa en vivo.** La página funcionando a la derecha. Se recarga sola medio segundo después de dejar de escribir, o con el botón. Tamaños de escritorio, tableta (768 × 1024) y móvil (390 × 844). Debajo, una consola plegable con los mensajes de la página: normales en gris, avisos en ámbar y errores en rojo, con el archivo y la línea (si la pulsas, el editor salta ahí).
- **Misiones.** Encargos para la IA con título, objetivo, «está hecha cuando…», archivos implicados, notas y estado (pendiente, en curso, hecha). Filtros con su número de misiones, reordenar arrastrando para marcar prioridad y un botón que copia la misión lista para pegar en Antigravity: objetivo, criterio y el contenido actual de los archivos marcados.
- **Guardar y descargar.** Todo se guarda solo en el navegador (IndexedDB) un segundo después de dejar de escribir. Descarga el archivo abierto, el proyecto entero en un `.zip` listo para publicar, o una copia `.json` que se puede volver a importar.
- **Móvil.** En pantallas pequeñas se ve una zona cada vez (Archivos, Código, Vista y Misiones) con una barra abajo para cambiar.

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run demo -- editor-codigo-ia
```

Se abrirá en http://localhost:3000.

## Publicarla

Es una web estática (HTML, CSS y JavaScript sin dependencias): se publica en Vercel importando este repositorio, con el preset **Other** y sin comando de build. Cada `git push` publica una nueva versión. En ClonaKit, el comando `/desplegar` te guía paso a paso.

Los proyectos que crees dentro de Taller se descargan como `.zip` (por ejemplo `mi-carta-de-bar.zip`): descomprímelo y publícalo igual, con `/desplegar`.

## Cómo está hecha

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Las dos pantallas (lista de proyectos y espacio de trabajo) y los iconos |
| `style.css` | Todo el diseño, con los colores en variables al principio |
| `app.js` | Arranque: decide qué pantalla se ve según la dirección (`#/` o `#/proyecto/…`) y la ayuda |
| `js/db.js` | La base de datos del navegador (IndexedDB) |
| `js/estado.js` | El proyecto abierto en memoria y los avisos entre paneles |
| `js/archivos.js` | Guardar, crear, renombrar, borrar y añadir archivos; copia de rescate |
| `js/arbol.js` | El árbol de archivos, su menú, el buscador y arrastrar desde el ordenador |
| `js/editor.js` | Pestañas, área de código, números de línea, teclado y barra de estado |
| `js/vista-previa.js` | Montar la página en el `<iframe>`, tamaños y consola |
| `js/misiones.js` | El panel de misiones y el texto para la IA |
| `js/proyectos.js` | La pantalla de inicio con las tarjetas de proyectos |
| `js/copias.js` | Crear, duplicar, exportar (`.zip`, `.json`) e importar proyectos |
| `js/zip.js` | Un `.zip` hecho a mano: cabeceras + CRC32, sin librerías |
| `js/dialogos.js` | Ventanas de confirmar y escribir, avisos y menú contextual |
| `js/reordenar.js` | Arrastrar para reordenar (pestañas y misiones), con ratón o dedo |
| `js/plantilla.js` | Los archivos de la plantilla básica |
| `js/util.js` | Ayudantes pequeños: tipos de archivo, fechas, nombres, logo |

## Límites de esta versión

- Solo archivos de texto: `.html`, `.css`, `.js`, `.json`, `.txt`, `.md` y `.svg`.
- La vista previa enseña el `index.html` del proyecto, o la página `.html` que tengas abierta.
- Dentro de la vista previa no funciona el almacenamiento del navegador (localStorage, IndexedDB, cookies) por seguridad. Para probarlo, descarga el proyecto y ábrelo con `npm run probar`.
- Los proyectos viven en este navegador. Si borras sus datos, se borran: descarga copias (`.zip` o `.json`).

## Decisiones

Cosas que la ficha no concretaba y cómo se han resuelto:

- **Sandbox de la vista previa: `allow-scripts allow-forms`.** La ficha dice `sandbox="allow-scripts"`, pero sin `allow-forms` Chrome bloquea los formularios y ni siquiera lanza el evento `submit`, así que el flujo del «formulario de reservas» no se podría comprobar. Se añade `allow-forms` y la propia vista previa impide que un envío no gestionado saque al iframe de la página (lo avisa en la consola). Sigue sin `allow-same-origin`: la página no puede leer tus proyectos.
- **Un `<iframe>` nuevo en cada recarga.** Cambiar el `srcdoc` del mismo iframe añade una entrada al historial del navegador por cada recarga, y el botón Atrás dejaba de volver a la lista de proyectos.
- **Números de línea de los errores.** El CSS y el JS se meten dentro del HTML; Taller apunta de qué archivo y línea viene cada trozo para que la consola diga `app.js:14` y no la línea del documento montado. También se muestra la línea de los `console.log`.
- **Enlaces dentro de la vista previa.** Un enlace a otra página del proyecto (`contacto.html`) la abre en el editor (y por tanto en la vista previa). Los enlaces externos no se abren y lo avisa la consola. Los enlaces `#seccion` se desplazan dentro de la página.
- **`alert()`, `confirm()` y `prompt()`** están bloqueados en la vista previa: sus mensajes aparecen en la consola. Los scripts con `defer` o `async` se colocan al final del `<body>` para que se comporten igual que al publicarlos. Los `.svg` del proyecto usados en `<img>` se ven en la vista previa.
- **Qué HTML se enseña.** El `.html` activo; si cambias a un `.css` o `.js`, se sigue viendo el último `.html` que abriste mientras su pestaña esté abierta; si no, `index.html`; si no hay, el primero por orden alfabético.
- **Copia de rescate.** IndexedDB no llega a terminar si recargas o cierras justo después de escribir. Al salir de la página, lo que aún no se había guardado se deja al instante en `localStorage` y se pasa a IndexedDB la próxima vez que abres Taller.
- **Sangría de dos espacios.** Intro añade un nivel tras `{`, `[`, `(` o una etiqueta HTML que abre; si el cursor está entre `{}` o entre `<ul></ul>`, el cierre baja a su propia línea. Tras pulsar Esc, Tab vuelve a mover el foco fuera del editor (para quien usa el teclado).
- **Los archivos `.html` nuevos** empiezan con un esqueleto mínimo; el resto, vacíos. Los nombres no pueden llevar `/`: para crear dentro de una carpeta se usa su menú ⋯ («Nuevo archivo aquí»).
- **Arrastrar archivos que ya existen** pregunta antes de reemplazarlos. Se ignoran los que no son de texto o pasan de 2 MB, y se avisa de cuáles.
- **El `.zip`** lleva los archivos en la raíz (sin carpeta envolvente) e incluye las carpetas vacías. Su nombre sale del nombre del proyecto sin tildes (`Mi carta de bar` → `mi-carta-de-bar.zip`). Incluye también lo escrito que aún no se había guardado.
- **Tarjetas de proyecto.** Además del nombre, la fecha y las misiones pendientes, muestran una miniatura de la página (sin ejecutar sus scripts), el número de archivos y cuántas misiones hay en curso. La dirección `#/proyecto/<id>` hace que al recargar sigas en el mismo proyecto y que el botón Atrás funcione.
- **El contador del botón Misiones** cuenta las que no están hechas (pendientes y en curso).
- **Texto copiado para la IA:** título, una línea de contexto («web estática con HTML, CSS y JavaScript»), objetivo, criterio de hecho, cada archivo marcado en un bloque de código y la petición de devolver los archivos completos. Las notas no se incluyen: son para ti. Si el navegador no deja usar el portapapeles, se muestra el texto para copiarlo a mano.
- **Tamaño de las zonas.** Se guarda por proyecto. Doble clic en un borde lo devuelve a su tamaño inicial; con el teclado, las flechas lo mueven.
- **Módulos JavaScript.** Un `app.js` con `type="module"` funciona en la vista previa, pero los `import` entre archivos del proyecto no (la vista previa no puede pedir archivos al servidor). Lo mismo con `fetch()` de archivos del proyecto: para eso, descarga el `.zip` y usa `npm run probar`.
