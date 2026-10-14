# Ficha: Pregunta

> Inspirada en: Typeform (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Un constructor de formularios agradables de rellenar, que muestran una pregunta por pantalla y se manejan con el teclado, se comparten con un enlace y pueden enviar cada respuesta a tu automatización (n8n, Make o Zapier) sin servidor propio.

## 2. Para quién y para qué

Para negocios que quieren pedir presupuestos, apuntar a gente a un taller, hacer encuestas de satisfacción o cualificar clientes potenciales con algo más cuidado que un formulario plano, y recibir las respuestas en su hoja de cálculo, su CRM o su email.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Constructor | Crear formularios con una pantalla de bienvenida, preguntas y una pantalla final. Tipos: texto corto, texto largo, email, opción única, opción múltiple, escala del 1 al 10 y sí/no. Cada pregunta tiene título, ayuda opcional y "obligatoria" sí o no. Reordenar, duplicar y borrar preguntas. | Estado en JavaScript, `localStorage`, API Drag and Drop de HTML |
| 2 | Una pregunta por pantalla | Quien responde ve solo una pregunta, grande y centrada, con una barra de progreso. Intro avanza; los números eligen opción; la escala acepta 1–9 y 0 para el 10; S y N responden sí o no. Se puede volver atrás. Comprueba obligatorias y emails antes de avanzar. | Eventos de teclado, transiciones CSS (`transform`, `opacity`), `<input type="email">` |
| 3 | Saltos simples | En las preguntas de opción única y de sí/no, cada respuesta puede llevar a "la siguiente", a otra pregunta posterior o al final. Solo se salta hacia delante, así no hay bucles. | Reglas guardadas en cada pregunta y evaluadas al avanzar |
| 4 | Compartir con un enlace | El formulario completo viaja dentro del propio enlace, así no hace falta guardarlo en ningún servidor. Botones para copiar el enlace y para abrirlo en una pestaña nueva. | JSON → `CompressionStream('deflate-raw')` si existe → base64url en el fragmento `#f=` de la URL; lectura con `URLSearchParams(location.hash.slice(1))` |
| 5 | Recibir respuestas | Campo opcional "Enviar respuestas a tu automatización": al terminar, cada respuesta se envía en JSON a la URL de webhook indicada. Además se guarda en el navegador donde se ha rellenado, con una tabla y exportación a CSV. | `fetch` con método POST y cuerpo JSON, `localStorage`, `Blob` + descarga con BOM UTF-8 |

## 4. Pantallas

### Mis formularios

- **Qué se ve:** tarjetas con el título, el número de preguntas y el número de respuestas guardadas en este navegador. Un botón para crear un formulario (vacío o desde un ejemplo: "Pide tu presupuesto").
- **Qué se puede hacer:** editar, duplicar, borrar (con confirmación), copiar el enlace y ver respuestas.

### Constructor

- **Qué se ve:** tres zonas.
  - **Izquierda:** la lista de pantallas en orden (bienvenida, preguntas numeradas con un icono de su tipo, final) y un botón para añadir pregunta que despliega los 7 tipos.
  - **Centro:** el editor de lo que esté elegido. Para una pregunta: título, ayuda, obligatoria, y según el tipo, las opciones (añadir, renombrar, ordenar, borrar), las etiquetas de los extremos de la escala ("Nada probable" / "Muy probable") y los saltos ("si responde X → ir a…").
  - **Derecha:** vista previa en vivo de esa pantalla tal como la verá quien responde.
- **Barra superior:** título del formulario, color de acento, botón de probar (rellena el formulario entero sin enviar nada al webhook ni guardar la respuesta) y botón de compartir.
- **Ventana de compartir:** el enlace con un botón para copiarlo, un aviso si pasa de 2.000 caracteres (algunas apps cortan los enlaces largos) y el campo de webhook con un botón "enviar una prueba" que manda una respuesta de ejemplo marcada como prueba y dice si ha llegado.

### Formulario (lo que ve quien responde)

Es la misma web: si el enlace lleva un formulario dentro, se abre directamente en este modo, sin mostrar el constructor.

- **Bienvenida:** título, un texto, el aviso de privacidad (si se ha escrito) y un botón para empezar.
- **Cada pregunta:** número, título, ayuda en gris y el campo. Las opciones se ven como botones anchos con su número delante; al elegir una en opción única se avanza solo tras un instante. Debajo, un botón para continuar con la pista "o pulsa Intro". Si falta algo, un mensaje breve bajo el campo.
- **Abajo:** la barra de progreso y botones de anterior y siguiente (útiles en el móvil).
- **Final:** el texto de agradecimiento y, si se ha configurado, un botón a una dirección (por ejemplo, tu web).

### Respuestas

- **Qué se ve:** un aviso honesto ("Estas son las respuestas rellenadas en este dispositivo") y una tabla con una fila por respuesta y una columna por pregunta, más la fecha.
- **Qué se puede hacer:** exportar a CSV (separador coma o punto y coma para Excel en español) y borrar respuestas.

## 5. Flujos paso a paso

### Pedir presupuestos y recibirlos en tu automatización

1. La persona crea "Pide tu presupuesto": nombre (texto corto), email, "¿Qué necesitas?" (opción única: Web, Tienda online, Otra cosa), "¿Cuántos productos venderás?" (opción única), "Cuéntame más" (texto largo) y "¿Cuándo quieres empezar?" (opción única).
2. En "¿Qué necesitas?" pone los saltos "Web → Cuéntame más" y "Otra cosa → Cuéntame más": así la pregunta de productos solo la ve quien quiere una tienda.
3. Pega en el campo de webhook la URL de su flujo de n8n y pulsa enviar una prueba: la app dice "Recibido" (o explica el error).
4. Copia el enlace y lo pone en su web y en sus redes.
5. Una clienta lo rellena en su móvil. Al terminar, la app envía la respuesta al webhook y muestra la pantalla final. Si el envío falla, reintenta una vez y, si vuelve a fallar, avisa con amabilidad y guarda la respuesta en ese dispositivo.

### Encuesta en un mostrador (modo quiosco)

1. Abre el enlace en una tableta del local y la deja a la vista.
2. Cada cliente responde; al llegar al final, el formulario vuelve a empezar solo a los 10 segundos.
3. Al cerrar el día, la persona abre "Respuestas" en esa tableta y exporta el CSV.

## 6. Datos

- **Qué guarda:** los formularios (preguntas, opciones, saltos, textos, color y URL de webhook) en el navegador de quien los crea, y las respuestas (fecha y valor de cada pregunta) en el navegador **donde se rellenan**.
- **Dónde:** `localStorage`; la definición también va dentro del enlace. Si se edita el formulario, hay que compartir el enlace nuevo: los enlaces antiguos siguen mostrando la versión anterior.
- **Envío al webhook:** un JSON con el identificador y el título del formulario, la fecha de envío y una lista de pares pregunta → respuesta. Si el navegador bloquea el envío por seguridad (CORS), la app lo explica: en n8n hay que permitir el origen de tu web en el nodo Webhook.
- **Datos personales:** sí, si preguntas nombre o email. Escribe un aviso de privacidad en la bienvenida con enlace a tu política. La URL del webhook va dentro del enlace y cualquiera puede verla: no pongas nada secreto en ella y comprueba los datos en tu automatización. Un campo oculto trampa ayuda a descartar robots: si llega relleno, no se envía nada.

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- El modo quiosco se activa con una casilla en la ventana de compartir, que añade `&quiosco=1` al enlace.
- Sin webhook, cada respuesta se queda en el dispositivo donde se rellena: el negocio no la ve. Por eso el webhook es lo recomendado. En una tableta de quiosco, la app muestra la sección "Respuestas rellenadas en este dispositivo".
- En las preguntas de texto largo, Intro avanza y Mayús+Intro hace salto de línea.
- Ejemplo del JSON que recibe el webhook: `{"formulario":"Pide tu presupuesto","enviado":"2026-10-13T18:00:00Z","respuestas":{"¿Cómo te llamas?":"Lucía","¿Qué necesitas?":"Tienda online, Web","Valora del 1 al 10":8,"Cuéntame más":""}}`. Las preguntas saltadas llegan vacías, la opción múltiple llega separada por comas y la escala como número.
- Si se rellena el campo trampa, se muestra el final normal pero no se guarda ni se envía nada.

## 7. Para más adelante (fuera de esta versión)

- Juntar todas las respuestas en un solo sitio sin automatización externa (Supabase), con un panel de resultados.
- Enlaces cortos (`tu-dominio.com/presupuesto`) guardando el formulario en un servidor.
- Código QR del enlace para imprimirlo.
- Subir archivos, firmas y pagos (con un proveedor de pagos oficial).
- Puntuaciones tipo cuestionario y saltos con varias condiciones.

## 8. Identidad propia

- **Nombre:** Pregunta.
- **Colores y estilo:** amable y espacioso, con letra grande y mucho aire. Fondo crema `#FFF8F0`, texto `#2A2333`, acento índigo `#3D4BA8` para botones y opción elegida, amarillo maíz `#F2C14E` para la barra de progreso y verde `#3E8E63` para "Recibido". Quien crea un formulario puede cambiar el color de acento de ese formulario.
- **Icono o logo:** un signo de interrogación de apertura (¿) dentro de un círculo.
- **Idioma de la interfaz:** español.

## 9. Checklist de sala limpia

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
