# Ficha: Taller

> Inspirada en: Google Antigravity (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Un pequeño editor de código en el navegador para crear páginas web con varios archivos (HTML, CSS y JavaScript), verlas funcionando al momento y organizar en un panel de "misiones" los encargos que le haces a una IA.

## 2. Para quién y para qué

Para quien está aprendiendo a crear webs con ayuda de la IA y quiere un sitio propio donde retocar su página, ver el resultado sin instalar nada y llevar la cuenta de qué ha pedido, qué está en marcha y qué ya está hecho.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Proyectos y árbol de archivos | Crear proyectos vacíos o desde una plantilla básica (`index.html`, `style.css`, `app.js`). Árbol de carpetas y archivos con icono según el tipo: crear, renombrar y borrar (con confirmación). También se pueden añadir archivos arrastrándolos desde el ordenador. | Estado en JavaScript, IndexedDB, Drag and Drop de archivos + `File.text()` |
| 2 | Editor | Pestañas con los archivos abiertos (un punto indica cambios sin guardar), números de línea, Tab y Mayús+Tab para sangrar y quitar sangría, sangría automática al pulsar Intro, guardar con Ctrl/Cmd+S y la posición del cursor (línea y columna) en la barra inferior. | `<textarea>` con una columna de números sincronizada con su desplazamiento, `selectionStart`/`selectionEnd` y eventos de teclado |
| 3 | Vista previa en vivo | A la derecha, la página funcionando. Se recarga sola medio segundo después de dejar de escribir, o con un botón. Tamaños de escritorio, tableta y móvil. Debajo, una consola que muestra los mensajes y errores de la página. | `<iframe srcdoc>` con `sandbox="allow-scripts"`, el CSS y el JS del proyecto metidos dentro del HTML, `postMessage` para pasar la consola |
| 4 | Misiones | Una lista de encargos para la IA: título, qué quieres conseguir, cuándo se considera hecho, archivos implicados, notas y estado (pendiente, en curso, hecha). Botón para copiar la misión como un texto listo para pegar en Antigravity u otro asistente. | Estado + IndexedDB, `navigator.clipboard.writeText()` |
| 5 | Guardar y descargar | Todo se guarda solo. Descargar el archivo abierto o el proyecto entero en un `.zip` listo para publicar en Vercel. Exportar e importar el proyecto como `.json`. | IndexedDB, ZIP sin compresión generado en JavaScript (cabeceras + CRC32, sin librerías), `Blob` + descarga |

## 4. Pantallas

### Lista de proyectos

- **Qué se ve:** tarjetas con el nombre de cada proyecto, la fecha del último cambio y el número de misiones pendientes. Un botón para crear un proyecto (vacío o con plantilla) y otro para importar un `.json`.
- **Qué se puede hacer:** abrir, renombrar, duplicar y borrar (con confirmación).

### Espacio de trabajo

- **Qué se ve:** cuatro zonas que se pueden redimensionar arrastrando sus bordes.
  - **Izquierda:** el árbol de archivos, con botones para nuevo archivo y nueva carpeta. El archivo abierto se resalta.
  - **Centro:** las pestañas y el editor. Abajo, la barra de estado: línea y columna, tipo de archivo y "Guardado" o "Sin guardar".
  - **Derecha:** la vista previa con un selector de tamaño y un botón de recargar; debajo, la consola plegable (mensajes normales en gris, avisos en ámbar y errores en rojo, con el número de línea si lo hay) y un botón para vaciarla.
  - **Panel de misiones:** se abre y se cierra con un botón de la barra superior, como una columna a la derecha de la vista previa.
- **Barra superior:** nombre del proyecto, descargar `.zip`, exportar `.json`, mostrar u ocultar misiones y volver a la lista de proyectos.
- **Qué se puede hacer:** clic derecho (o botón "⋯") sobre un archivo del árbol para renombrar o borrar; arrastrar pestañas para reordenarlas; escribir en un buscador encima del árbol para filtrar los archivos por su nombre.

### Panel de misiones

- **Qué se ve:** filtros por estado con su número real de misiones, la lista de misiones (título, estado como pastilla de color y número de archivos implicados) y un botón para crear una.
- **Qué se puede hacer:** al abrir una misión se edita en el mismo panel: título, objetivo, "está hecha cuando…", archivos implicados (casillas con los archivos del proyecto), notas y estado. Las misiones se reordenan arrastrándolas para marcar prioridad. El botón de copiar genera un texto con el objetivo, el criterio de hecho y el contenido actual de los archivos marcados.

## 5. Flujos paso a paso

### Crear una página y verla al momento

1. La persona crea el proyecto "Mi carta de bar" con la plantilla básica. Se abre `index.html` y la vista previa ya muestra la página de ejemplo.
2. Escribe un título nuevo. Medio segundo después de parar, la vista previa se actualiza.
3. Abre `app.js` y escribe un error a propósito. La consola muestra el mensaje en rojo con el número de línea.
4. Cambia la vista previa a tamaño móvil para comprobar que se ve bien.

### Trabajar con una misión

1. Crea la misión "Añadir un formulario de reservas", con el objetivo, el criterio "se ve en móvil y valida el email" y los archivos `index.html` y `style.css`.
2. La pasa a "en curso" y pulsa copiar. Pega el texto en Antigravity y aplica en el editor los cambios que le propone.
3. Comprueba el resultado en la vista previa, anota en las notas qué se cambió y pasa la misión a "hecha".

### Llevarse el proyecto

1. Pulsa descargar `.zip`. Se descarga `mi-carta-de-bar.zip` con todas las carpetas y archivos.
2. Lo descomprime y lo publica con `/desplegar` en Vercel.

## 6. Datos

- **Qué guarda:** los proyectos (nombre y fechas), sus archivos (ruta y contenido como texto), las pestañas abiertas, el tamaño de las zonas y las misiones (con su estado, notas y archivos implicados).
- **Dónde:** en el navegador con IndexedDB, guardando cada archivo un segundo después de dejar de escribir y siempre con Ctrl/Cmd+S. Copias en `.zip` o `.json` que se descargan al ordenador.
- **Datos personales:** ninguno. Nada sale del navegador salvo lo que la persona copie a mano.

**Límites de esta versión (la app los explica en una ayuda breve):** solo trabaja con archivos de texto (`.html`, `.css`, `.js`, `.json`, `.txt`, `.md`, `.svg`); la vista previa enseña el `index.html` del proyecto, o el HTML que esté abierto; y dentro de la vista previa no funciona el almacenamiento del navegador por seguridad (para probarlo, hay que descargar el proyecto y abrirlo con `npm run probar`).

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- La vista previa usa `<iframe sandbox="allow-scripts allow-forms">` (sin `allow-forms` los formularios no funcionan) e impide que un envío no gestionado saque al iframe de la página.
- Cada recarga de la vista previa crea un iframe nuevo: cambiar `srcdoc` añade entradas al historial y rompe el botón Atrás.
- IndexedDB puede no terminar de guardar si se recarga o se cierra en menos de un segundo: deja una copia de rescate en `localStorage` al salir de la página (`pagehide`) y recupérala al volver.
- Los errores de la consola indican la línea del archivo original (`app.js:14`), no la del documento montado.
- Límite que hay que explicar en la ayuda: dentro de la vista previa no funcionan los `import` entre archivos del proyecto ni `fetch()` de sus archivos.
- Para arrastrar pestañas y misiones en el móvil, usa eventos de puntero: el arrastre de HTML no funciona con el dedo.

## 7. Para más adelante (fuera de esta versión)

- **Conectar un modelo de IA con tu propia clave**, para que las misiones se puedan enviar desde la app.
  **Aviso de seguridad:** la clave es como el PIN de tu tarjeta. Nunca se escribe en el código ni se publica en GitHub o Vercel: en una web estática, cualquiera puede ver todo su código. La forma segura es un pequeño intermediario que guarde la clave en privado (una función de Vercel con la clave en sus variables de entorno, o un flujo de n8n). Además, pon un límite de gasto en tu cuenta del proveedor de IA.
- Colores para el código, autocompletado y buscar y reemplazar.
- Imágenes y otros archivos que no sean texto dentro del proyecto.
- Publicar en Vercel con un botón y guardar versiones con Git (necesita un intermediario con tus credenciales).

## 8. Identidad propia

- **Nombre:** Taller.
- **Colores y estilo:** oscuro y concentrado, como un banco de trabajo por la noche. Fondo `#15171C`, paneles `#1D2027`, bordes `#2A2E37`, texto `#E6E3DA`, números de línea `#6B7080`, acento verde lima `#B8E05A` (pestaña activa, botones principales y cursor). Estados de las misiones: pendiente en gris `#8A90A0`, en curso en ámbar `#E8B04A` y hecha en menta `#5CC8A8`.
- **Tipografía:** monoespaciada del sistema para el código (`ui-monospace`, Menlo, Consolas, `monospace`) y la del sistema para el resto.
- **Icono o logo:** una llave inglesa cruzada con los signos `< >`.
- **Idioma de la interfaz:** español.

## 9. Checklist de sala limpia

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
