# Trazo

> **Demo de la receta `pizarra-flujos`**, construida por ClonaKit en sala limpia a partir de [su ficha](../FICHA.md). Pruébala con `npm run demo -- pizarra-flujos` y después crea la tuya, con tu nombre y tu marca, escribiendo `/clonar` en Antigravity.

Una pizarra web para dibujar diagramas de flujo con aspecto de boceto a mano: cajas, rombos, elipses, textos y flechas que se quedan pegadas a las formas. Se guarda sola en tu navegador y se exporta como imagen. Sin cuentas ni instalaciones.

Inspirada en Excalidraw. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

## Funciones

- **Lienzo infinito.** Desplázate con la herramienta mano, manteniendo pulsada la barra espaciadora, con la rueda o con dos dedos en el trackpad. Zoom del 10 % al 400 % con Ctrl/Cmd + rueda, pellizcando o con los botones + y −; siempre acerca hacia donde está el puntero. Pulsa el porcentaje para volver al 100 %.
- **Formas, texto y flechas.** Rectángulos, rombos y elipses (con Mayús salen cuadrados o círculos), texto suelto o dentro de una forma (la forma crece si el texto no cabe) y flechas que se enganchan al borde de las formas y las siguen al moverlas. Todo con un trazo a mano que no "tiembla" al redibujar.
- **Editar.** Selecciona con un clic o con un recuadro (Mayús para sumar), mueve, redimensiona con los tiradores, duplica, borra, trae al frente o envía al fondo, y cambia color, relleno, grosor y tipo de línea. Deshacer y rehacer hasta 100 pasos.
- **Guardado y archivos.** Cada cambio se guarda solo en el navegador (también la posición y el zoom). Desde el menú puedes descargar el dibujo como `.json` y volver a abrirlo, o arrastrar el archivo a la pizarra.
- **Exportar imagen.** PNG o SVG, todo o solo la selección, con fondo o transparente, a 1×, 2× o 3× (PNG), recortado al dibujo con un margen. También puedes copiar el PNG para pegarlo en un documento o un correo.

### Atajos de teclado

| Atajo | Qué hace |
| --- | --- |
| `1` a `8` | Seleccionar, mano, rectángulo, rombo, elipse, flecha, texto y goma |
| Barra espaciadora (mantener) | Mano temporal para desplazar |
| Doble clic | Escribir en una forma o una flecha; en vacío, crear un texto |
| `Supr` (o `Retroceso` en Mac) | Borrar lo seleccionado |
| `Ctrl/Cmd + D` | Duplicar |
| `Ctrl/Cmd + Z` / `Ctrl/Cmd + Mayús + Z` | Deshacer / rehacer |
| `Ctrl/Cmd + A` | Seleccionar todo |
| Flechas del teclado | Mover 1 px (10 px con Mayús) |
| `Esc` | Terminar de escribir, cancelar un arrastre o soltar la selección |

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run demo -- pizarra-flujos
```

Se abrirá en http://localhost:3000. Para copiar imágenes al portapapeles el navegador exige `localhost` o `https`: con `npm run probar` y en Vercel funciona; abriendo el archivo con doble clic, no.

## Publicarla

Es una web estática (HTML, CSS y JavaScript, sin dependencias): se publica en Vercel importando este repositorio, con el preset **Other** y sin comando de build. Cada `git push` publica una nueva versión.

## Cómo está organizado el código

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La estructura: lienzo, paneles, menú y ventanas |
| `style.css` | Colores de la identidad, modo oscuro y aspecto de los paneles |
| `app.js` | Arranque, ratón/dedos/teclado, rueda y arrastrar archivos |
| `js/estado.js` | Todo lo que la app recuerda (elementos, selección, cámara...) |
| `js/trazo-a-mano.js` | El aspecto de boceto: líneas irregulares con semilla fija |
| `js/geometria.js` | Qué hay bajo el puntero, enganche de flechas y medida de textos |
| `js/lienzo.js` | Dibujar en el `<canvas>` |
| `js/acciones.js` | Duplicar, borrar, deshacer, zoom, abrir, guardar... |
| `js/editor-texto.js` | Escribir dentro de formas y flechas |
| `js/exportar.js` | PNG, SVG, portapapeles y la ventana de exportar |
| `js/archivos.js` | Guardado automático y lectura segura de archivos `.json` |
| `js/historial.js` | Deshacer y rehacer |
| `js/interfaz.js` | Botones y paneles, y el logo dibujado a mano |
| `js/avisos.js` | Mensajes y preguntas de sí o no |
| `js/constantes.js` | Colores, medidas y nombres que comparten los demás archivos |

## Decisiones

Cosas que la ficha no concretaba y cómo se han resuelto:

- **Exportar en modo oscuro:** la imagen usa siempre los colores "de papel" (fondo crema y tinta azul noche), porque la ficha pide que la exportación respete los colores elegidos. El modo oscuro solo cambia cómo se ve en pantalla: allí la tinta se muestra en `#E9E4D8` y los rellenos se mezclan con el fondo oscuro para no deslumbrar.
- **Relleno suave:** es el color del trazo mezclado al 20 % con blanco (opaco, para que las flechas y los textos de detrás no se transparenten).
- **Botones + y −:** saltan por escalones (10, 25, 50, 75, 100, 125, 150, 200, 250, 300 y 400 %) y acercan hacia el centro de la ventana, porque al pulsar el botón el puntero está sobre el propio botón. La rueda y el pellizco sí acercan hacia el puntero.
- **Una flecha sola seleccionada** muestra dos tiradores redondos en sus extremos en lugar del recuadro de 8 tiradores (que no tiene sentido en una línea). Arrastrar un extremo sobre una forma lo engancha a ella. Con varias cosas seleccionadas se usa el recuadro de 8 tiradores.
- **Mover o redimensionar una flecha sin su forma** la desengancha por ese lado; si se mueven juntas, sigue enganchada. Las flechas se enganchan solo a rectángulos, rombos y elipses (no a textos) y nunca a la misma forma por los dos lados.
- **Duplicar** una flecha junto con sus formas engancha la copia a las copias; si se duplica sola, la copia queda suelta.
- **Hacer clic dentro de una forma** la selecciona aunque no tenga relleno (más fácil para principiantes).
- **Texto:** tamaño de 20 px a zoom 100 %. Redimensionar un texto suelto cambia el tamaño de la letra; el texto dentro de una forma no cambia de tamaño. Las formas crecen desde su centro cuando el texto no cabe; si al redimensionar una forma queda más pequeña que su texto, vuelve a crecer al soltar.
- **Herramienta texto:** un clic en vacío crea un texto; un clic en una forma o una flecha escribe en ella. Un texto suelto que se queda vacío se borra.
- **Al terminar** de dibujar una forma, una flecha o un texto se vuelve a la herramienta seleccionar. Un clic sin arrastrar con una forma o la flecha no crea nada y deja la herramienta activa.
- **Goma:** marca (en tenue) todo lo que toca al arrastrar y lo borra al soltar, como un solo paso de deshacer. Las flechas enganchadas a lo borrado se sueltan y se quedan donde estaban.
- **Elegir una herramienta** distinta de seleccionar suelta la selección. Cambiar el estilo con algo seleccionado también cambia el estilo de los próximos elementos.
- **Teclado:** además de `Supr`, borra la tecla `Retroceso` (la de borrar de los teclados de Mac). `Esc` termina de escribir, cancela un arrastre, cierra el menú o suelta la selección. Mover con las flechas del teclado cuenta como un paso de deshacer por pulsación.
- **Doble clic** reconocido a mano (dos pulsaciones en menos de 400 ms y 10 px) para que funcione también con el dedo. El cuadro de texto se abre al soltar, para que el móvil muestre el teclado.
- **Línea discontinua:** se dibuja con una sola pasada (dos pasadas discontinuas quedan confusas) y la punta de la flecha siempre es continua.
- **Etiquetas de flecha:** la línea se interrumpe detrás del texto para que se lea, también en PNG y SVG (con una máscara).
- **Archivo `.json`:** guarda solo los elementos (con `formato` y `version`). La cámara y las preferencias se guardan solo en el navegador. Al abrir un archivo el dibujo se centra en la ventana. Abrir y vaciar se pueden deshacer.
- **Primera visita:** el modo oscuro se activa si el sistema lo usa; después manda la opción del menú.
- **Ventana de exportar:** 2× y "con fondo" vienen marcados. "Solo la selección" se desactiva si no hay nada seleccionado. "Copiar PNG" copia siempre un PNG con el fondo y la escala elegidos, aunque esté marcado SVG. Si un PNG fuera enorme (más de 16 millones de píxeles), se reduce la escala para que el navegador pueda crearlo.
- **Safari en Mac:** el pellizco del trackpad llega con eventos `gesture*`, que no son estándar; se usan solo para que Safari no amplíe la página entera.
- **Fuentes del dibujo:** Segoe Print (Windows), Bradley Hand y Chalkboard SE (Mac), Comic Sans MS, Marker Felt y, si no hay ninguna, `cursive`. Como dependen del ordenador, un SVG puede verse con otra letra en otro equipo.
- **Móvil:** en pantallas estrechas se oculta la marca, la barra de herramientas se pega a la izquierda (y se puede deslizar si no cabe) y no hay ayudas al pasar el puntero.
