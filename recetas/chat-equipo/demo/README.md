# Corrillo

> **Demo de la receta `chat-equipo`**, construida por ClonaKit en sala limpia a partir de [su ficha](../FICHA.md). Pruébala con `npm run demo -- chat-equipo` y después crea la tuya, con tu nombre y tu marca, escribiendo `/clonar` en Antigravity.

El chat de tu equipo ordenado por canales, con hilos, reacciones y búsqueda. Esta primera versión es una **demo en un solo dispositivo**: cambias de «persona» para simular a tu equipo y ver cómo os organizaríais (ventas, pedidos, avisos…) antes de montar la versión real con servidor.

Inspirada en las funciones de Slack. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

> **Modo demo:** no hay servidor, así que los mensajes **no llegan** a otros móviles ni ordenadores. Todo se guarda en este navegador. No uses datos reales de clientes.

## Funciones

- **Canales y personas:** crear, renombrar y archivar canales con descripción; crear un equipo ficticio (nombre, color e iniciales); cambiar de persona en un clic. Los canales con mensajes que no has leído salen en negrita.
- **Mensajes con formato:** Intro envía y Mayús+Intro hace salto de línea; `*negrita*`, `_cursiva_`, enlaces automáticos, botones de formato y un selector con 40 emojis. Puedes editar y borrar tus mensajes.
- **Hilos:** responde a un mensaje en un panel lateral; bajo el original se ve cuántas respuestas hay y quién ha respondido.
- **Reacciones:** añade un emoji a cualquier mensaje; el contador suma a cada persona y, al pasar el puntero, ves quién ha reaccionado.
- **Búsqueda:** busca en todos los canales e hilos, sin distinguir mayúsculas ni tildes, con filtros por canal y por persona; al pulsar un resultado la app salta al mensaje y lo ilumina.
- **Extra:** abre Corrillo en dos pestañas (una como Ana y otra como Luis) y verás aparecer los mensajes al momento en la otra.
- **Ajustes:** exportar todo a un `.json`, importarlo y borrar la demo.

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run demo -- chat-equipo
```

Se abrirá en http://localhost:3000. La primera vez verás la bienvenida: elige **Cargar un ejemplo** para curiosear con 3 personas y varios mensajes, o **Empezar vacío**.

Truco: abre la misma dirección en una segunda pestaña, pulsa otra persona en «Equipo» y escribe en una de las dos.

No abras `index.html` con doble clic: el código está repartido en módulos (`import`/`export`) y el navegador solo los carga si la página se sirve desde un servidor, como el de `npm run probar`.

## Publicarla

Es una web estática (HTML, CSS y JavaScript, sin dependencias ni paso de compilación): se publica en Vercel importando este repositorio, con el preset **Other** y sin comando de build. Si el repositorio es el kit entero, indica `clones/chat-equipo/app` como **Root Directory**. Cada `git push` publica una nueva versión.

## Cómo está hecho

| Archivo | Qué hace |
| --- | --- |
| `index.html` | La estructura de la página y las ventanas (bienvenida, equipo, ajustes…) |
| `style.css` | El aspecto. Los colores están en variables al principio del archivo |
| `app.js` | Punto de entrada: conecta botones y teclas con sus acciones |
| `js/datos.js` | Lo que se guarda en `localStorage` y el aviso entre pestañas (`BroadcastChannel`) |
| `js/vistas.js` | Cómo se pinta la pantalla a partir de los datos |
| `js/acciones.js` | Lo que pasa al abrir un canal, cambiar de persona, buscar, escribir… |
| `js/dialogos.js` | Las ventanas: bienvenida, crear canal, equipo, ajustes, enlace |
| `js/formato.js` | Texto seguro (negrita, cursiva, enlaces), resaltado de búsqueda y fechas en español |
| `js/emojis.js`, `js/iconos.js`, `js/avisos.js`, `js/estado-ui.js`, `js/ejemplo.js` | Piezas de apoyo: selector de emojis, iconos y logo, avisos flotantes, estado de la pestaña y datos de ejemplo |

Los datos viven en el navegador: personas, canales y mensajes en `localStorage` (todo junto en un JSON); la persona y el canal de cada pestaña en `sessionStorage`, para que cada pestaña pueda ser alguien distinto.

## Decisiones

Cosas que la ficha no concretaba y cómo se han resuelto:

- **Iniciales:** se calculan solas a partir del nombre («Ana García» → AG, «Luis» → L).
- **No leídos:** solo cuentan los mensajes principales de otras personas; las respuestas de un hilo no ponen el canal en negrita. Además de la negrita, el canal muestra un contador coral y, al abrirlo, una línea «Nuevos».
- **Cambiar de persona:** el canal que tienes delante no cuenta como leído para la nueva persona hasta que lo abras (o empieces a escribir en él). Así se ve en negrita, como pide el flujo «Simular una conversación».
- **Cambio en un clic:** además del desplegable de «Escribes como», pulsar a alguien en la lista «Equipo» cambia de persona directamente.
- **Archivar:** el canal pasa a una sección «Archivados» de la barra lateral; se puede leer y buscar en él, pero no escribir ni reaccionar, y se puede desarchivar. Los canales no se borran.
- **Nombres:** los canales se guardan en minúsculas y sin espacios («Pedidos Web» → #pedidos-web) y no se pueden repetir; tampoco se repiten nombres de persona. Siempre tiene que quedar al menos una persona.
- **Borrar un mensaje con hilo** borra también sus respuestas (la confirmación lo avisa).
- **Editar:** Intro guarda y Esc cancela; un mensaje no puede quedar vacío (para eso está borrar). Si no cambias nada, no aparece «(editado)».
- **Reacciones:** elegir en el selector un emoji con el que ya habías reaccionado lo quita, igual que pulsar tu reacción.
- **Botón de enlace:** pide una dirección web y la inserta en el texto; se convierte sola en enlace (la ficha no define enlaces con texto distinto de la dirección).
- **Búsqueda:** busca la frase exacta (sin mayúsculas ni tildes) también en canales archivados. Los resultados muestran el texto sin los símbolos `*` y `_`. En escritorio la lista sigue abierta al saltar a un mensaje; en el móvil se cierra para ver el mensaje. Si el resultado es una respuesta, se abre su hilo con un botón para volver a los resultados.
- **Ajustes:** están en el botón de la barra superior (icono de controles). Importar sustituye todos los datos (no los mezcla) y pide confirmación.
- **Pestañas:** el aviso de `BroadcastChannel` lleva los datos completos, porque en Chrome el `localStorage` de otra pestaña tarda unos milisegundos en ponerse al día y releerlo daba datos viejos. Si dos pestañas cambian algo en el mismo instante, gana el último cambio (es una demo, no multiusuario real).
- **Sin modo oscuro:** la ficha define una paleta clara concreta, así que se quitó el modo oscuro automático de la plantilla.
- **Pantallas medianas (tableta):** el panel del hilo o de la búsqueda se abre por encima del canal para no aplastarlo.
- **Móvil:** Intro también envía. Los teclados táctiles no tienen Mayús+Intro, así que en el móvil no se pueden escribir saltos de línea.
- **Límites:** 4000 caracteres por mensaje, 40 por nombre de canal, 200 por descripción y 30 por nombre de persona.
- **Avisos flotantes:** pequeños mensajes de confirmación («Canal creado», «Ahora escribes como Luis») que desaparecen solos; como mucho se ven 3 a la vez.
