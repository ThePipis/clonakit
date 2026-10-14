# Receta: estudio de grabación

> Inspirada en: OBS Studio (solo como referencia de funciones; no se copia nada)

Esta receta **ya está construida**: es MiniEstudio, el ejemplo completo del kit, en [ejemplos/mini-estudio/](../../ejemplos/mini-estudio/). Su ficha está en [ejemplos/mini-estudio/FICHA.md](../../ejemplos/mini-estudio/FICHA.md). Por eso aquí no hay otra copia: la ficha vive en un solo sitio y no se desincroniza.

## Qué consigues

Grabar tutoriales, clases o demos con tu pantalla, tu cámara en una esquina, textos e imágenes, controlar el volumen del micrófono y descargar el vídeo. Todo en el navegador, sin instalar nada.

- **Dificultad:** ★★
- **¿Funciona sola?** Sí: graba y descarga el vídeo en tu ordenador. Emitir en directo necesitaría un servidor y queda fuera.

## Pruébala antes

Desde la carpeta del kit:

```bash
npm run probar -- ejemplos/mini-estudio/app
```

Si te sirve tal cual, puedes publicar el ejemplo con `/desplegar` (mira [ejemplos/mini-estudio/README.md](../../ejemplos/mini-estudio/README.md)). Si quieres tu propia versión, sigue leyendo.

## Cómo usarla como receta

1. En Antigravity escribe `/clonar` y di: "quiero la receta estudio-grabacion".
2. El tutor copia `ejemplos/mini-estudio/FICHA.md` a `clones/<nombre>/FICHA.md`.
3. **Cambiáis la identidad**, que es obligatorio porque el nombre y el estilo de MiniEstudio ya son del ejemplo:
   - El título (`# Ficha: …`) y el nombre de la sección 8: elige uno tuyo.
   - La cabecera: cambia "Autor/a: ClonaKit" por tu nombre y la fecha de hoy.
   - Los colores, el estilo y el icono de la sección 8.
   - La checklist de la sección 9: **desmárcala** (cambia cada `- [x]` por `- [ ]`). En el ejemplo está marcada porque ya se revisó; tú la repasas de nuevo y la marcas cuando sea verdad.
4. Ajusta las funciones: quita lo que no vayas a usar o sube algo de "Para más adelante". Por ejemplo, guardar las escenas entre sesiones en el navegador.
5. Sigue con la fase de construir de `/clonar`. El ayudante programa tu versión desde cero leyendo **solo tu ficha**: no mira el código del ejemplo.

## Ideas para hacerla tuya

- **Para clases:** una escena con una imagen de pizarra de fondo y la cámara grande a un lado.
- **Para tu marca:** un rótulo fijo con tu logo y tu web en todas las escenas.
- **Para redes:** un formato vertical 9:16 además del 16:9.
