# Ficha: Corrillo

> Inspirada en: Slack (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Un chat de equipo organizado por canales, con hilos, reacciones y búsqueda que, en esta primera versión, funciona como **demo en un solo dispositivo**: cambias de "persona" para simular a tu equipo y ver cómo os organizaríais.

**Aviso que la app debe mostrar con claridad:** esta versión no tiene servidor, así que los mensajes **no llegan** a otros móviles ni ordenadores; todo se guarda en este navegador. Se explica en la primera visita y queda una etiqueta fija "Modo demo" en la barra lateral. Para chatear de verdad con tu equipo hace falta el paso de la sección 7.

## 2. Para quién y para qué

Para pequeños negocios y equipos que quieren ordenar su comunicación interna por temas (ventas, pedidos, avisos) en lugar de un grupo de mensajería donde todo se mezcla. Con la demo pueden diseñar sus canales, probar los hilos y decidir si les compensa montar la versión real con servidor.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Canales y personas | Crear, renombrar y archivar canales con una descripción. Crear un equipo ficticio (nombre, color e iniciales). Un selector indica con quién estás escribiendo y permite cambiar de persona en un clic. Los canales con mensajes que la persona actual no ha leído salen en negrita. | Estado en JavaScript guardado en `localStorage`; la persona actual en `sessionStorage` (una por pestaña) |
| 2 | Mensajes con formato | Escribir y enviar con Intro (Mayús+Intro hace salto de línea). `*texto*` sale en negrita y `_texto_` en cursiva; las direcciones web se convierten solas en enlaces; un selector con unos 40 emojis frecuentes. Botones de negrita, cursiva y enlace. Editar y borrar tus propios mensajes. | `<textarea>` y conversión segura a HTML (primero se escapa todo el texto y después se aplica el formato), `Intl.DateTimeFormat` para fechas y horas |
| 3 | Hilos | Responder a un mensaje concreto en un panel lateral sin llenar el canal. Bajo el mensaje original aparecen el número de respuestas y las iniciales de quien ha respondido. | Panel lateral; cada respuesta guarda el identificador de su mensaje original |
| 4 | Reacciones | Añadir un emoji a cualquier mensaje. Si otra persona elige el mismo, se suma al contador; pulsar tu propia reacción la quita. Al pasar el puntero se ve quién ha reaccionado. | Estado por mensaje (emoji → lista de personas), atributo `title` |
| 5 | Búsqueda | Buscar un texto en todos los canales e hilos, con filtros por canal y por persona. La palabra sale resaltada; al pulsar un resultado, la app salta al mensaje y lo ilumina un momento. | Búsqueda en memoria sin distinguir mayúsculas ni tildes (`normalize('NFD')`), `scrollIntoView()` |

Extra de la demo: si se abre Corrillo en dos pestañas del mismo navegador (una como Ana y otra como Luis), lo que se escribe en una aparece al momento en la otra, usando `BroadcastChannel`. Sirve para enseñar la idea; no es multiusuario real.

## 4. Pantallas

### Pantalla principal

- **Qué se ve:** tres zonas.
  - **Barra lateral (izquierda, oscura):** nombre de la app con la etiqueta "Modo demo"; debajo, la persona actual (círculo de color con sus iniciales) con un desplegable para cambiarla; la lista de canales, cada uno con `#` delante; un botón para crear canal; y la sección del equipo con un botón para gestionarlo.
  - **Centro:** una cabecera con el nombre y la descripción del canal; la lista de mensajes, agrupados por día con un separador ("Hoy", "Ayer", "lunes 12 de octubre"). Cada mensaje muestra avatar, nombre, hora, texto, reacciones y, si tiene, el resumen del hilo. Los mensajes seguidos de la misma persona con menos de 5 minutos de diferencia se agrupan sin repetir avatar. Abajo, el cuadro de escribir con su barra de formato y el botón de emojis.
  - **Panel derecho (solo al abrir un hilo o una búsqueda):** el mensaje original con sus respuestas y su propio cuadro de escribir, o la lista de resultados.
- **Arriba, a lo ancho:** la caja de búsqueda.
- **Qué se puede hacer:** al pasar el puntero por un mensaje aparece una barra pequeña de acciones (reaccionar, responder en hilo y, si es tuyo, editar y borrar). Borrar pide confirmación. Un mensaje editado muestra "(editado)".
- **En el móvil:** la barra lateral se abre con un botón de menú y el hilo ocupa toda la pantalla.

### Gestionar el equipo

- Una ventana para añadir personas (nombre y color de una paleta), editarlas y borrarlas. Los mensajes de una persona borrada se quedan, firmados como "Persona eliminada".

### Primera visita

- Una bienvenida con el aviso del modo demo y dos opciones: empezar vacío (crea la persona "Tú" y el canal #avisos) o cargar un ejemplo con 3 personas, los canales #avisos, #ventas y #charla y una docena de mensajes, hilos y reacciones para curiosear.

## 5. Flujos paso a paso

### Simular una conversación

1. Ana escribe en #ventas: "¿Alguien ha llamado a *Bodas Luna*?" y pulsa Intro. El mensaje aparece con su avatar, la hora y "Bodas Luna" en negrita.
2. Cambia a Luis con el selector. Para Luis, #ventas sale en negrita porque tiene un mensaje sin leer. Al abrir el canal deja de estarlo.
3. Luis pulsa "responder en hilo" en el mensaje de Ana y escribe "Yo, mañana a las 10". Se abre el panel lateral; bajo el mensaje de Ana aparece "1 respuesta" con las iniciales de Luis.
4. Luis reacciona con 👍. Vuelve a Ana: ve la reacción con el contador a 1 y, al pasar el puntero, el nombre de Luis.

### Encontrar un acuerdo antiguo

1. La persona escribe "presupuesto" en la búsqueda y pulsa Intro.
2. El panel derecho lista los resultados de más nuevo a más antiguo, con canal, autor, fecha y la palabra resaltada. Puede filtrar por canal o persona.
3. Pulsa un resultado: se abre el canal (o el hilo), salta al mensaje y lo resalta durante 2 segundos.

## 6. Datos

- **Qué guarda:** personas (nombre, color), canales (nombre, descripción, archivado o no), mensajes (canal, autor, texto tal como se escribió, fecha, si se ha editado, mensaje original si es una respuesta, reacciones) y, para cada persona, cuándo leyó por última vez cada canal.
- **Dónde:** en el navegador (`localStorage`, todo junto en un JSON). En ajustes: exportar todo a un archivo `.json`, importarlo y borrar la demo (con confirmación).
- **Datos personales:** solo los nombres que escribas. Recomendación que la app muestra en la bienvenida: no uses datos reales de clientes en la demo, porque quedan en este navegador y los puede ver cualquiera que use este ordenador.

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- Al sincronizar pestañas con `BroadcastChannel`, el aviso debe llevar **los datos completos**: si la otra pestaña relee `localStorage`, a veces lo ve con retraso y pisa cambios.
- Al cambiar de persona, el canal abierto no cuenta como leído para la nueva hasta que lo abra (así se ven en negrita sus no leídos).
- En el móvil no hay Mayús+Intro: allí Intro hace salto de línea y se envía con el botón.
- Al borrar un mensaje con hilo, se borran también sus respuestas.

## 7. Para más adelante (fuera de esta versión)

- **Equipo real en tiempo real:** cuentas e inicio de sesión (Supabase Auth), mensajes en una base de datos con permisos por canal (Supabase Postgres) y entrega al instante (Supabase Realtime). Es el paso que convierte la demo en un chat de verdad.
- Notificaciones en el móvil y el ordenador (necesitan un servicio de notificaciones push).
- Mensajes directos entre dos personas y menciones con @ que avisan.
- Adjuntar archivos e imágenes (Supabase Storage).
- Avisos automáticos: que cada pedido nuevo de tu tienda aparezca en #ventas mediante un flujo de n8n.

## 8. Identidad propia

- **Nombre:** Corrillo.
- **Colores y estilo:** cercano y ordenado. Barra lateral verde pino `#17413A` con texto `#E8F0EC` y canal activo en `#24594F`; zona de mensajes blanco roto `#FAFAF7` con texto `#1F2523` y bordes `#E3E5E1`; acento coral `#F07B5A` para el botón de enviar, los avisos de no leído y tus propias reacciones. Colores para las personas: coral `#F07B5A`, mostaza `#D9A441`, azul `#4F7CAC`, verde `#5E9C76`, malva `#B5838D` y gris pizarra `#6D7A86`.
- **Icono o logo:** dos bocadillos de conversación superpuestos que forman una "C".
- **Idioma de la interfaz:** español, con fechas y horas en formato español (13/10/2026, 12:40).

## 9. Checklist de sala limpia

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
