# Ficha: Trazo

> Inspirada en: Excalidraw (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Una pizarra web para dibujar diagramas de flujo con aspecto de boceto a mano (cajas, rombos, elipses, textos y flechas que se quedan pegadas a las formas) que se guarda sola en el navegador y se exporta como imagen.

## 2. Para quién y para qué

Para quien necesita explicar un proceso de su negocio (cómo entra un pedido, cómo se atiende a un cliente, qué pasos tiene un lanzamiento) y quiere dibujarlo en dos minutos, sin cuentas ni instalaciones, para pegarlo en una presentación, un documento o un mensaje.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Lienzo infinito | Un espacio de dibujo sin bordes. Se desplaza con la herramienta mano, manteniendo pulsada la barra espaciadora o con la rueda o el trackpad. El zoom (del 10 % al 400 %) se hace con Ctrl/Cmd + rueda, pellizcando o con los botones + y −, y siempre acerca hacia el punto donde está el puntero. | `<canvas>` a pantalla completa ajustado a `devicePixelRatio`, una "cámara" (desplazamiento + zoom) aplicada con `setTransform`, Pointer Events y el evento `wheel` |
| 2 | Formas, texto y flechas | Dibujar rectángulos, rombos y elipses arrastrando; escribir texto suelto o dentro de una forma. Las flechas que empiezan o acaban sobre una forma se enganchan a su borde y la siguen al moverla. Todo con trazo "a mano": líneas un poco irregulares que no cambian al redibujar. | Dibujo 2D en `<canvas>` con `quadraticCurveTo`, un generador pseudoaleatorio con semilla fija por elemento y un `<textarea>` superpuesto para escribir |
| 3 | Editar | Seleccionar con clic o con un recuadro (Mayús para sumar), mover, redimensionar con tiradores, duplicar, borrar y cambiar color, relleno y grosor. Deshacer y rehacer cualquier cambio. | Pointer Events, cálculo geométrico de "qué hay bajo el puntero", pila de historial con copias del estado |
| 4 | Guardado y archivos | Cada cambio se guarda solo en el navegador. El dibujo se puede descargar como archivo `.json` y volver a abrir (también arrastrándolo a la pizarra). | `localStorage`, `Blob` + enlace de descarga, `<input type="file">`, `File.text()` y Drag and Drop de archivos |
| 5 | Exportar imagen | Descargar el dibujo entero o solo lo seleccionado en PNG o SVG, con fondo o transparente, recortado al contenido con un margen. Copiar el PNG al portapapeles. | Un `<canvas>` aparte + `toBlob()`, SVG generado como texto, `Blob` + descarga, `navigator.clipboard.write()` con `ClipboardItem` |

## 4. Pantallas

### Pantalla principal (la pizarra)

- **Qué se ve:** el lienzo ocupa toda la ventana, con una cuadrícula de puntos muy suave que se puede ocultar. Flotando sobre él:
  - **Arriba, centrada:** la barra de herramientas con iconos propios: seleccionar, mano, rectángulo, rombo, elipse, flecha, texto y goma. Atajos con los números 1 a 8 en ese orden, que se muestran al pasar el puntero.
  - **A la izquierda:** el panel de estilo, visible solo si hay algo seleccionado o una herramienta de dibujo activa: color de trazo (6 colores), relleno (ninguno o color suave), grosor (fino, medio, grueso), línea continua o discontinua y, si hay selección, botones para duplicar, borrar, traer al frente y enviar al fondo.
  - **Abajo a la izquierda:** zoom (−, porcentaje, +; al pulsar el porcentaje vuelve al 100 %), deshacer y rehacer.
  - **Arriba a la derecha:** un menú con abrir archivo, guardar archivo, exportar imagen, mostrar u ocultar la cuadrícula, modo oscuro y vaciar el lienzo (pide confirmación).
- **Qué se puede hacer:**
  - Con una forma activa, arrastrar dibuja la forma; con Mayús queda cuadrada o circular. Al soltar, la herramienta vuelve a seleccionar.
  - Clic en un elemento lo selecciona y muestra un recuadro con 8 tiradores; arrastrar en vacío dibuja un recuadro de selección (quedan elegidos los elementos que caben enteros dentro).
  - Doble clic en una forma o una flecha permite escribir dentro (texto centrado en la forma, etiqueta en el punto medio de la flecha). Doble clic en vacío crea un texto suelto. Esc o clic fuera termina.
  - Teclado: Supr borra; Ctrl/Cmd+D duplica (desplazado 10 px); Ctrl/Cmd+Z deshace; Ctrl/Cmd+Mayús+Z rehace; Ctrl/Cmd+A selecciona todo; las flechas del teclado mueven 1 px (10 px con Mayús). Hay que anular la acción por defecto del navegador en esos atajos.
  - Funciona con ratón, trackpad y pantalla táctil (dos dedos para desplazar y pellizcar para el zoom).

### Ventana de exportar

- **Qué se ve:** una vista previa del resultado y las opciones: formato (PNG o SVG), todo o solo la selección, con fondo o transparente, y escala 1×, 2× o 3× (solo PNG).
- **Qué se puede hacer:** descargar el archivo o copiar el PNG al portapapeles. Si el navegador no permite copiar imágenes, ese botón no aparece.

## 5. Flujos paso a paso

### Dibujar el flujo de un pedido

1. La persona elige el rectángulo y arrastra: aparece una caja con trazo a mano.
2. Hace doble clic dentro y escribe "Llega el pedido". El texto se centra y la caja crece si no cabe.
3. Dibuja debajo un rombo con "¿Hay stock?" y dos cajas más: "Enviar" y "Avisar al cliente".
4. Elige la flecha, empieza a arrastrar dentro de la primera caja y suelta sobre el rombo. Al pasar por encima de una forma, su borde se resalta para indicar que la flecha se enganchará. La flecha sale y llega al borde, no al centro.
5. Mueve el rombo: las flechas enganchadas se recalculan al momento y lo siguen.
6. Hace doble clic en una flecha y escribe "Sí". Repite con "No" en la otra.
7. Cierra la pestaña. Al volver, el dibujo está igual, con la misma posición y zoom.

### Compartir el diagrama como imagen

1. Abre el menú y elige exportar.
2. Marca PNG, 2× y con fondo. La vista previa se actualiza.
3. Descarga `trazo-AAAA-MM-DD.png` o lo copia para pegarlo en un documento o un correo.

### Llevar el dibujo a otro ordenador

1. Menú → guardar archivo: se descarga `diagrama-AAAA-MM-DD.json`.
2. En el otro ordenador abre Trazo y arrastra el archivo a la pizarra (o usa abrir). Si ya hay un dibujo, la app pregunta antes de sustituirlo.
3. Si el archivo no es válido, muestra un mensaje amable y no toca el dibujo actual.

## 6. Datos

- **Qué guarda:** la lista de elementos (tipo, posición, tamaño, colores, grosor, estilo de línea, texto y la semilla de su trazo a mano; en las flechas, además, sus extremos y a qué forma está enganchado cada uno), la posición y el zoom de la cámara y las preferencias (cuadrícula y modo oscuro).
- **Dónde:** en el navegador (`localStorage`), como mucho una vez por segundo para no ralentizar. El archivo `.json` incluye un número de versión del formato para poder abrir archivos antiguos en el futuro. El historial de deshacer vive solo en memoria (hasta 100 pasos).
- **Datos personales:** ninguno. Nada sale del navegador.

**Detalle del trazo a mano (para quien programe):** cada lado de una forma se dibuja como una curva que se desvía unos píxeles de la línea recta, y se repasa una segunda vez con desviaciones distintas. Las desviaciones salen de un generador pseudoaleatorio con la semilla guardada en el elemento, así que la forma nunca "tiembla" al redibujar ni al exportar.

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- Una flecha suelta se edita moviendo sus dos extremos, no con 8 tiradores.
- La imagen exportada sale con los colores claros de papel aunque la app esté en modo oscuro.
- En Safari para Mac, el pellizco del trackpad llega con eventos `gesture*` (no estándar): hay que atenderlos para que no amplíe la página entera.
- Los textos del dibujo usan fuentes manuscritas del sistema, así que un SVG puede verse con otra letra en otro ordenador.

## 7. Para más adelante (fuera de esta versión)

- Dibujar a la vez con otras personas (necesita un servidor, por ejemplo Supabase Realtime).
- Compartir con un enlace de solo lectura (el dibujo guardado en Supabase o comprimido en la URL).
- Rotar elementos, líneas con varios puntos, flechas curvas y dibujo a mano alzada.
- Plantillas propias: organigrama, embudo de ventas, mapa de un proceso.
- Insertar imágenes, agrupar elementos y tener varios dibujos con nombre.

## 8. Identidad propia

- **Nombre:** Trazo.
- **Colores y estilo:** papel cálido y tinta, sensación de cuaderno. Lienzo crema `#FBF7EE`, tinta azul noche `#1E2A3A` para el trazo por defecto y los textos de la interfaz, acento terracota `#C8553D` para la herramienta activa y la selección, paneles blancos `#FFFFFF` con sombra suave y esquinas redondeadas. Colores de dibujo: tinta `#1E2A3A`, terracota `#C8553D`, salvia `#5B8C5A`, azul mar `#2F6690`, mostaza `#D4A017` y gris `#8A8F98`; los rellenos usan versiones muy claras de esos tonos. Modo oscuro: fondo `#1B1E24` y trazo claro `#E9E4D8` (la exportación respeta los colores elegidos).
- **Tipografía:** la del sistema para la interfaz; para los textos del dibujo, fuentes manuscritas del sistema con `cursive` como respaldo, sin descargar fuentes externas.
- **Icono o logo:** una línea ondulada que une dos cuadraditos, dibujada con el mismo trazo a mano.
- **Idioma de la interfaz:** español.

## 9. Checklist de sala limpia

Nota de licencia: la app de referencia es de código abierto (licencia MIT). Esta receta no reutiliza nada de su código: se construye desde cero a partir de esta ficha. Si algún día quieres reutilizarlo, tendrás que cumplir su licencia y apuntarlo en `LEGAL.md`.

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
