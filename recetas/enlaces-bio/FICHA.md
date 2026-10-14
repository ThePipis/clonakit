# Ficha: MiEnlace

> Inspirada en: Linktree (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Un editor para montar tu página de enlaces (foto, nombre, una frase sobre ti y botones a tu web, tu tienda, tu agenda o tu WhatsApp) que la descarga como un único `index.html` listo para publicar gratis en Vercel. Esa página publicada es el enlace que pones en la bio de tus redes.

## 2. Para quién y para qué

Para emprendedores, creadores y negocios que quieren un solo enlace en sus redes que lleve a todo lo importante, con su estilo, en una dirección suya y sin depender de una plataforma. Es la receta más fácil del kit: ideal como primera app publicada.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Perfil | Subir una foto (se recorta al centro en cuadrado y se reduce a 320 × 320 px), escribir el nombre y una bio corta de hasta 160 caracteres con contador. | `<input type="file" accept="image/*">`, `createImageBitmap()` + `<canvas>` + `toDataURL('image/jpeg', 0.85)` |
| 2 | Enlaces | Añadir enlaces con título, dirección e icono; editarlos, ocultarlos un tiempo sin borrarlos, borrarlos y cambiar su orden arrastrando o con botones de subir y bajar. Si falta `https://`, se añade solo; también vale un email o un teléfono. | API Drag and Drop de HTML, objeto `URL` para validar |
| 3 | Temas | Elegir entre 5 temas propios o ajustar a mano el color de fondo, de los botones y de su texto, la forma de los botones (redondeados, píldora o rectos) y el tipo de letra. Avisa si el texto se lee mal sobre su fondo. | Variables CSS, `<input type="color">`, cálculo de contraste según la norma WCAG |
| 4 | Vista previa móvil en vivo | A la derecha, un teléfono dibujado con la página tal como quedará; cambia con cada tecla que pulsas. | `<iframe srcdoc>` generado con la misma función que la exportación, para que sean idénticos |
| 5 | Exportar mi página | Un botón descarga un `index.html` autónomo: estilos dentro del archivo, la foto incrustada, título y descripción para buscadores y para cuando se comparte el enlace, y sin JavaScript. | Plantilla HTML generada como texto, `Blob` + descarga |

## 4. Pantallas

### Editor (pantalla única)

- **Qué se ve:** dos columnas. En el móvil, una sola con un botón flotante para ver la vista previa.
  - **Izquierda (edición), de arriba abajo:**
    1. **Perfil:** la foto en un círculo con un botón para cambiarla o quitarla, el nombre y la bio con su contador.
    2. **Enlaces:** un botón grande para añadir y la lista de enlaces como tarjetas con un asa para arrastrar (⋮⋮), el icono, el título, la dirección en gris, un interruptor de visible/oculto, los botones de subir y bajar y uno de borrar.
    3. **Aspecto:** los 5 temas como muestras pequeñas; debajo, "personalizar" con los selectores de color, la forma de los botones y el tipo de letra.
    4. **Publicar:** el botón principal "Exportar mi página" y, al lado, guardar y abrir el proyecto (`.json`) para seguir editándolo otro día.
  - **Derecha (vista previa):** el marco de un teléfono con la página dentro, centrado y fijo mientras se desplaza la columna izquierda.
- **Qué se puede hacer:** al pulsar una tarjeta de enlace se despliega para editar título, dirección e icono. El icono se elige de una rejilla de iconos genéricos propios dibujados en SVG: web, tienda, calendario, correo, teléfono, chat, vídeo, música, foto, documento, mapa y estrella, o ninguno. No se usan logotipos de redes sociales ni de otras marcas.

### La página exportada (lo que verán tus visitantes)

- La foto redonda arriba y centrada, el nombre, la bio y los botones a lo ancho (máximo 560 px), uno debajo de otro, con su icono a la izquierda. Al pie, una línea pequeña y opcional: "Hecho con MiEnlace".
- Se adapta al móvil, se puede usar con el teclado (foco visible) y tiene `lang="es"`. Los enlaces de email y teléfono abren la app de correo o de llamadas.

## 5. Flujos paso a paso

### Tu primera página publicada (unos 10 minutos)

1. La persona abre MiEnlace. La primera vez aparece un ejemplo ya relleno para que vea cómo queda, con un botón para empezar desde cero.
2. Sube su foto, escribe "Marta · Cerámica hecha a mano" y una bio corta. La vista previa cambia mientras escribe.
3. Añade "Tienda online" (dirección de su tienda, icono tienda), "Reserva un taller" (su agenda, icono calendario) y "Escríbeme" (su email, icono correo). La app convierte el email en un enlace de correo.
4. Arrastra "Reserva un taller" al primer lugar.
5. Elige el tema "Arena". Prueba un botón amarillo claro con texto blanco: aparece un aviso de que no se lee bien y lo cambia.
6. Pulsa "Exportar mi página": se descarga `index.html`. La app muestra los siguientes pasos: crear una carpeta, poner dentro el archivo y publicarla con `/desplegar` del kit.
7. Publica en Vercel y copia su dirección (`marta-ceramica.vercel.app`) en la bio de sus redes.

### Cambiar algo más adelante

1. Abre MiEnlace (el último proyecto se recupera solo) o abre su `.json` guardado.
2. Cambia un enlace, exporta de nuevo y sustituye el `index.html` publicado.

## 6. Datos

- **Qué guarda:** el perfil (nombre, bio y foto como imagen incrustada), la lista de enlaces en orden (título, dirección, icono, visible u oculto) y el tema.
- **Dónde:** en el navegador (`localStorage`, por eso la foto se reduce antes de guardarla), en el `.json` del proyecto si la persona lo descarga, y en el `index.html` exportado.
- **Datos personales:** los que la persona decida publicar sobre sí misma. La app avisa de que la página exportada será pública. La página no usa cookies ni analítica.
- **Seguridad de la página exportada:** todo el texto se escapa antes de meterlo en el HTML, y solo se aceptan direcciones `https://`, `http://`, `mailto:` y `tel:` (cualquier otra se rechaza con un aviso).

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- En pantallas táctiles el arrastre de HTML no funciona: el orden de los enlaces se cambia también con botones de subir y bajar (y con las flechas del teclado sobre el asa).
- La vista previa del teléfono se dibuja a 390 px de ancho y se encoge para caber; si no, los textos se parten más que en un móvil real.
- El color del nombre y la bio se elige solo (oscuro o claro) según el fondo, y se avisa cuando un color no llega a contraste 4,5:1 (norma WCAG AA).
- Los enlaces sin título o con dirección no válida no salen ni en la vista previa ni en la página exportada, y se avisa. Una página vacía no se exporta.

## 7. Para más adelante (fuera de esta versión)

- Tu propio dominio (`marta.com`): se explica en la lección 08 del kit.
- Contar visitas y clics (una herramienta de analítica respetuosa con la privacidad o una función de servidor; con cookies, necesitarías un aviso de cookies).
- Una caja para apuntarse a tu lista de correo (con la receta de formularios y un webhook de n8n).
- Varias páginas, enlaces destacados o programados por fechas, fondo con imagen.
- Imagen para cuando se comparte el enlace en redes (necesita una imagen publicada junto a la página).

## 8. Identidad propia

- **Nombre:** MiEnlace.
- **Colores y estilo del editor:** claro y alegre. Fondo `#FBF9F6`, texto `#2A2A2E`, bordes `#E7E2DA`, acento mandarina `#F07F3C` para el botón de exportar y los elementos activos, siempre con texto oscuro encima (el blanco sobre mandarina no se lee bien).
- **Temas de la página exportada (propios):**
  - **Arena:** fondo `#F5EFE6`, botones `#2B2B2B` con texto blanco.
  - **Noche:** fondo `#141824`, botones `#F2C46D` con texto `#141824`.
  - **Mar:** fondo `#DDEFF2`, botones `#0F5563` con texto blanco.
  - **Melocotón:** fondo `#FFE8DC`, botones `#7A3E2B` con texto blanco.
  - **Mínimo:** fondo blanco, botones con borde `#111111` y texto `#111111`.
- **Tipos de letra:** solo del sistema: sin remates (`system-ui`), con remates (`Georgia`, `serif`) o redondeada (`ui-rounded`, `system-ui`; solo existe en Apple, en Windows y Android se ve sin remates).
- **Icono o logo:** un eslabón de cadena con forma de corazón.
- **Idioma de la interfaz:** español.

## 9. Checklist de sala limpia

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
