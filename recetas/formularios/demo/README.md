# Pregunta

> **Demo de la receta `formularios`**, construida por ClonaKit en sala limpia a partir de [su ficha](../FICHA.md). Pruébala con `npm run demo -- formularios` y después crea la tuya, con tu nombre y tu marca, escribiendo `/clonar` en Antigravity.

Constructor de formularios agradables de rellenar: una pregunta por pantalla, se manejan con el teclado, se comparten con un enlace y pueden enviar cada respuesta a tu automatización (n8n, Make o Zapier) sin servidor propio.

Inspirada en las funciones de Typeform. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

## Funciones

- **Constructor** con tres zonas: lista de pantallas, editor y vista previa en vivo. Pantalla de bienvenida (con aviso de privacidad), preguntas y pantalla final (con botón opcional a tu web).
- **7 tipos de pregunta:** texto corto, texto largo, email, opción única, opción múltiple, escala del 1 al 10 y sí/no. Cada una con título, ayuda opcional y "obligatoria". Se reordenan arrastrando (o con flechas), se duplican y se borran.
- **Una pregunta por pantalla** con barra de progreso, botones de anterior y siguiente y atajos de teclado: Intro avanza, los números eligen opción, en la escala del 1 al 9 y el 0 vale 10, y S/N responden sí o no. Comprueba las obligatorias y los emails antes de avanzar.
- **Saltos simples:** en opción única y sí/no, cada respuesta puede llevar a la siguiente, a una pregunta posterior o al final.
- **Compartir con un enlace:** el formulario entero viaja dentro del enlace (comprimido). Botones para copiarlo y abrirlo, aviso si pasa de 2.000 caracteres y **modo quiosco** (vuelve a empezar solo a los 10 segundos).
- **Recibir respuestas:** cada respuesta se envía en JSON a tu webhook (con botón "Enviar una prueba") y además se guarda en el navegador donde se rellena, con tabla, exportación a CSV (coma o punto y coma) y borrado.
- **Modo prueba:** rellena el formulario entero sin enviar ni guardar nada.
- Color de acento por formulario, campo trampa contra robots y diseño adaptado al móvil.

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run demo -- formularios
```

Se abrirá en http://localhost:3000. Para empezar rápido, pulsa **Usar el ejemplo «Pide tu presupuesto»**.

Cómo se usa, en cuatro pasos:

1. Crea un formulario (en blanco o desde el ejemplo) y añade preguntas con **Añadir pregunta**.
2. Pulsa **Probar** para rellenarlo tú sin enviar nada.
3. Pulsa **Compartir**: copia el enlace y, si quieres, pega la URL del webhook de tu automatización y pulsa **Enviar una prueba**.
4. Mira las respuestas rellenadas en tu navegador en **Mis formularios → Respuestas** y expórtalas a CSV.

> Si cambias el formulario, comparte el enlace nuevo: los enlaces antiguos siguen mostrando la versión anterior.

## Recibir las respuestas en tu automatización

Al terminar, el navegador de quien responde hace un `POST` con este JSON a la URL del webhook:

```json
{
  "formulario": { "id": "f_lx3k9a7f2", "titulo": "Pide tu presupuesto" },
  "fecha": "2026-10-13T18:05:00.000Z",
  "prueba": false,
  "respuestas": [
    { "id": "p_lx3kab12c", "pregunta": "¿Cómo te llamas?", "respuesta": "Lucía" },
    { "id": "p_lx3kcd34e", "pregunta": "¿Cuántos productos venderás?", "respuesta": "" }
  ]
}
```

- Van **todas** las preguntas en orden. Las que la persona no vio por un salto llegan vacías (`""`), así las columnas de tu hoja de cálculo siempre cuadran.
- La opción múltiple llega como texto separado por comas, la escala como número y el sí/no como `"Sí"` o `"No"`.
- El botón "Enviar una prueba" manda una respuesta de ejemplo con `"prueba": true`, para que puedas filtrarla.
- Si el envío falla, la app reintenta una vez y, si vuelve a fallar, avisa con amabilidad. La respuesta queda guardada en ese dispositivo.
- **CORS:** el envío sale del navegador, así que tu automatización tiene que aceptar envíos desde tu web. En n8n, permite el origen de tu web (por ejemplo `https://tu-app.vercel.app`) en las opciones del nodo Webhook.
- La URL del webhook va dentro del enlace y cualquiera puede verla: no pongas nada secreto en ella y revisa los datos en tu automatización.

## Modo quiosco (una tableta en tu mostrador)

1. En **Compartir**, marca **Modo quiosco** y abre ese enlace en la tableta.
2. Cada cliente responde; al llegar al final, el formulario vuelve a empezar solo a los 10 segundos.
3. Al cerrar el día, abre en esa tableta la dirección de la app **sin el enlace** (por ejemplo `https://tu-app.vercel.app`). En **Respuestas rellenadas en este dispositivo** verás el formulario: entra y exporta el CSV.

## Publicarla

Es una web estática (HTML, CSS y JavaScript, sin dependencias): se publica en Vercel importando este repositorio, con el preset **Other** y sin comando de build. Cada `git push` publica una nueva versión.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `index.html` | La página. Todo se pinta desde `app.js`. |
| `style.css` | Colores, letra y diseño (también el del móvil). |
| `app.js` | Punto de entrada: decide qué pantalla enseñar según la dirección. |
| `js/datos.js` | Cómo es un formulario, el ejemplo y el guardado en `localStorage`. |
| `js/enlace.js` | Meter el formulario en el enlace y leerlo de vuelta. |
| `js/constructor.js` | El constructor (lista, barra superior, probar). |
| `js/editor.js` | El editor de bienvenida, preguntas y final. |
| `js/jugador.js` | El formulario que ve quien responde (y la vista previa). |
| `js/compartir.js` | La ventana de compartir y el webhook. |
| `js/webhook.js` | El envío a tu automatización con reintento. |
| `js/inicio.js` | Mis formularios. |
| `js/respuestas.js` | La tabla de respuestas y el CSV. |
| `js/ui.js` | Piezas comunes: iconos, avisos, ventanas, portapapeles. |

## Decisiones

Cosas que la ficha no concretaba y cómo se han resuelto:

- **Cómo se activa el modo quiosco:** con una casilla en la ventana de compartir que añade `&quiosco=1` al enlace. Así el mismo formulario tiene un enlace normal (para la web y las redes) y otro para la tableta. En modo quiosco no se muestra el enlace "Hecho con Pregunta", para que un cliente no pueda salir del formulario.
- **Ver en la tableta respuestas de un formulario creado en otro sitio:** "Mis formularios" tiene una sección **Respuestas rellenadas en este dispositivo** con los formularios que se han rellenado allí aunque no se crearon allí. Si en ese navegador no hay formularios propios, esta sección sale la primera.
- **Avance automático:** opción única, escala y sí/no pasan solas a la siguiente pregunta tras un instante (0,45 s). En la última pregunta no: el botón cambia a "Enviar" y hay que pulsarlo, para que nadie envíe sin querer.
- **Texto largo:** Intro avanza (como en el resto) y Mayús + Intro hace un salto de línea.
- **Formato del enlace:** `#f=z.` + base64url del JSON comprimido con `deflate-raw`. Si el navegador no tiene `CompressionStream`, se usa `#f=j.` (JSON sin comprimir). El prefijo indica cómo leerlo. Solo viaja lo que necesita quien responde (sin fechas internas).
- **"Ir al final"** en un salto significa terminar y enviar la respuesta.
- **Saltos que dejan de ser válidos** al reordenar o borrar preguntas (porque apuntarían hacia atrás o a una pregunta borrada) vuelven a "la siguiente pregunta" y la app lo avisa.
- **Las preguntas nuevas** se añaden justo después de la que está elegida (o al final si no hay ninguna).
- **Envío:** la respuesta se guarda primero en el dispositivo y después se envía (con un máximo de 10 s de espera y un reintento tras 1,5 s). El navegador no permite distinguir "la URL no existe" de "bloqueado por CORS", así que el mensaje de error explica las dos posibilidades.
- **Campo trampa:** si llega relleno, no se envía ni se guarda nada, pero se muestra la pantalla final como si todo hubiera ido bien (para no dar pistas al robot).
- **Email:** además de `<input type="email">`, se pide un punto en el dominio (`nombre@dominio.es`).
- **URLs:** el webhook, el enlace de la política de privacidad y el botón del final solo aceptan direcciones `http://` o `https://` (nunca `javascript:`). Si la web está en `https`, el webhook también debe estarlo.
- **Bienvenida sin título:** se usa el título del formulario. El botón del final solo aparece si tiene una dirección.
- **Borrar un formulario** borra también las respuestas guardadas en ese navegador. Los enlaces ya compartidos siguen funcionando, porque el formulario va dentro.
- **CSV:** de la respuesta más antigua a la más reciente, fecha como `dd/mm/aaaa hh:mm`, BOM UTF-8 para que Excel lea las tildes, y un apóstrofo delante de los valores que empiezan por `=`, `@` o `+`/`-` seguidos de una letra, para que Excel no los ejecute como fórmulas (los teléfonos como `+34 600…` se respetan).
- **Teclas numéricas:** eligen las 9 primeras opciones; a partir de la décima, se elige con clic.
- **Reordenar en el móvil:** además de arrastrar (que no funciona en todas las pantallas táctiles), hay flechas de subir y bajar.
- **Sin modo oscuro:** la identidad pide fondo crema y letra oscura, así que la app se ve siempre en claro.
- **Letra:** sin tipografías externas (nada de CDN); se usa Avenir Next si el sistema la tiene (Mac, iPhone) y la del sistema si no.
