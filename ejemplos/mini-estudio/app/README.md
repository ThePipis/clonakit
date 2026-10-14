# MiniEstudio

Compón tu pantalla, tu cámara, textos e imágenes en escenas y grábalo en vídeo, todo desde el navegador y sin instalar nada.

Inspirada en las funciones de OBS Studio. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

## Funciones

- **Escenas**: varias composiciones; se cambia entre ellas con un fundido o con las teclas 1–9.
- **Fuentes**: pantalla, cámara, texto e imagen. Se colocan y redimensionan arrastrando en la vista previa.
- **Mezclador de audio**: micrófono y audio de la pantalla, con medidor, volumen y silencio.
- **Grabar**: a MP4 (o WebM si el navegador no puede), en 1920×1080 a 30 FPS.

Atajos: flechas para mover la fuente seleccionada (Mayús = 10 px), Supr para borrarla, doble clic para ajustarla a pantalla completa.

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run probar -- ejemplos/mini-estudio/app
```

Se abrirá en http://localhost:3000. Funciona mejor en Chrome. En Mac, la primera vez que captures la pantalla tendrás que dar permiso a Chrome en Ajustes del Sistema → Privacidad y seguridad → Grabación de pantalla.

## Publicarla

Es una web estática: se publica en Vercel importando el repositorio, con el preset **Other** y sin comando de build. En Antigravity, `/desplegar` te guía.

## Limitaciones

- No emite en directo: un navegador no puede enviar vídeo por RTMP sin un servidor intermedio.
- El audio del sistema solo llega si compartes una pestaña de Chrome con su audio.
- Las escenas se pierden al recargar la página.

## Decisiones

- La composición se dibuja en un `<canvas>` de 1920×1080 y la vista previa es una copia con el recuadro de selección encima, para que este no salga en la grabación.
- El ritmo de fotogramas lo marca un Web Worker, porque `requestAnimationFrame` se pausa cuando la ventana queda tapada por otras apps.
