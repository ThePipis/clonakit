# Ejemplo: MiniEstudio

Un clon completo hecho con el flujo de ClonaKit, para que veas el resultado de cada fase antes de hacer el tuyo.

| Fase | Archivo |
| --- | --- |
| 1. Investigar | [investigacion/informe.md](investigacion/informe.md): lo que REA descubrió de OBS Studio en 16 segundos |
| 2. Ficha | [FICHA.md](FICHA.md): las 4 funciones del MVP, con palabras propias |
| 3. Construir | [app/](app/): HTML + CSS + JavaScript, sin dependencias |
| 4. Legal | [app/LEGAL.md](app/LEGAL.md): el método de sala limpia y la checklist |

Fíjate en cómo el informe dice **qué usa** OBS (ScreenCaptureKit para la pantalla, AVFoundation para la cámara, VideoToolbox para comprimir) y la ficha lo traduce a **qué hace** y a su equivalente web (`getDisplayMedia()`, `getUserMedia()`, `MediaRecorder`), sin copiar nada.

Pruébalo:

```bash
npm run probar -- ejemplos/mini-estudio/app
```

Y practica la publicación con `/desplegar` antes de publicar tu propio clon.

_En el informe solo se incluye el resumen; los datos en bruto de REA (`datos/`) no se publican._
