# Recetas

Las recetas son fichas ya escritas y listas para construir, inspiradas en las apps que más usan los negocios: eliges una, la haces tuya y en un rato tienes tu propia versión funcionando y publicada.

Todas son webs en HTML, CSS y JavaScript, sin dependencias, que guardan los datos en tu navegador y se publican gratis en Vercel.

## Pruébalas ya

Cada receta trae una **demo ya construida** y probada en su carpeta `demo/`. Ábrela en un minuto para ver lo que vas a crear:

```bash
npm run demo -- enlaces-bio
```

Cambia `enlaces-bio` por cualquier receta del catálogo. Las demos son de muestra: la gracia está en crear **la tuya**, con tu nombre, tus colores y los datos de tu negocio.

## Cómo se usa

1. En Antigravity escribe `/clonar` y di "quiero la receta X", con el nombre de su carpeta. Por ejemplo: "quiero la receta enlaces-bio".
2. El tutor copia su ficha a `clones/<nombre>/FICHA.md`. Con una receta te saltas la fase de investigar.
3. La personalizáis juntos: el nombre, los colores, qué funciones quieres y cuáles dejas para más adelante. Al terminar repasáis la checklist de sala limpia, que marcas tú.
4. Un ayudante la construye en sala limpia, leyendo solo tu ficha. La pruebas con `npm run probar -- <nombre>` y la publicas con `/desplegar`.

¿Es tu primera vez? Empieza por **enlaces-bio**: es la más sencilla y la que antes verás publicada en internet.

## Catálogo

| Receta | Inspirada en | Qué consigues | Dificultad | ¿Funciona sola o necesita servidor para usarla con otras personas? |
| --- | --- | --- | --- | --- |
| [enlaces-bio](enlaces-bio/) (MiEnlace) | Linktree | Tu propia página de enlaces para la bio de tus redes, con tu estilo y en una dirección tuya. | ★ | Funciona sola: exportas un `index.html` y lo publicas; cualquiera puede visitarlo. |
| [tablero-tareas](tablero-tareas/) (Columnas) | Trello | Ves de un vistazo en qué fase está cada pedido, cliente o proyecto. | ★★ | Funciona sola para ti en un dispositivo. Compartir tableros con el equipo necesita servidor. |
| [formularios](formularios/) (Pregunta) | Typeform | Presupuestos, inscripciones y encuestas agradables de rellenar que llegan a tu automatización. | ★★ | Recibe respuestas reales sin servidor propio gracias al webhook (n8n, Make o Zapier). Sin webhook, cada respuesta se queda en el dispositivo donde se rellena. |
| [chat-equipo](chat-equipo/) (Corrillo) | Slack | Pruebas cómo organizar la comunicación del equipo por canales e hilos antes de montarlo de verdad. | ★★ | Demo en un solo dispositivo: cambias de persona para simular al equipo. Para chatear de verdad necesita servidor (por ejemplo, Supabase). |
| [editor-codigo-ia](editor-codigo-ia/) (Taller) | Google Antigravity | Un editor propio para crear y retocar webs con vista previa y una lista de encargos para la IA. | ★★ | Funciona sola. Conectar una IA dentro de la app necesita tu clave y un pequeño intermediario. |
| [estudio-grabacion](estudio-grabacion/) (MiniEstudio) | OBS Studio | Grabas tutoriales y demos con pantalla, cámara y textos sin instalar nada. | ★★ | Funciona sola: graba y descarga el vídeo. Ya está construida como ejemplo del kit. |
| [pizarra-flujos](pizarra-flujos/) (Trazo) | Excalidraw | Dibujas los procesos de tu negocio en minutos y los exportas como imagen. | ★★★ | Funciona sola. Dibujar a la vez con otras personas necesita servidor. |
| [base-datos-visual](base-datos-visual/) (Celda) | Airtable | Tu base de clientes, productos o inventario con vistas de tabla, tablero y galería. | ★★★ | Funciona sola para ti en un dispositivo. Trabajar en equipo necesita servidor. |
| [email-marketing](email-marketing/) (Embudo) | ActiveCampaign | Ordenas tus contactos, diseñas tus emails y planificas tus secuencias, listos para conectar a un servicio de envío. | ★★★ | Demo en un solo dispositivo: no envía emails. Para enviar de verdad necesita n8n + Resend o Brevo. |

Las estrellas indican cuánto trabajo y cuántas pruebas lleva: ★ se hace en una tarde; ★★★ tiene muchas piezas y conviene ir función a función.

## ¿Tu app no está?

No pasa nada. Con `/clonar` puedes investigar cualquier otra app que uses (una app de Mac, una app Electron o una web pública) y escribir su ficha con el tutor a partir de [plantillas/FICHA.md](../plantillas/FICHA.md). Las recetas te sirven de modelo de cómo queda una buena ficha. También puedes partir de una receta parecida y cambiarle las funciones.

## Nota legal

Los nombres de las apps originales se usan solo para indicar en qué se inspira cada receta. Son marcas de sus titulares, y ClonaKit no está afiliado a ellos ni cuenta con su respaldo. Las recetas describen funciones genéricas con palabras propias: no contienen código, textos, imágenes, iconos ni colores de marca de las apps originales, y cada una propone un nombre y una identidad visual propios. Excalidraw es de código abierto (licencia MIT); su receta tampoco reutiliza su código.

Antes de publicar, repasa la checklist de tu `LEGAL.md`. Esto no es asesoramiento jurídico: más detalle en [formacion/02-lo-legal.md](../formacion/02-lo-legal.md) y en el [AVISO-LEGAL.md](../AVISO-LEGAL.md).
