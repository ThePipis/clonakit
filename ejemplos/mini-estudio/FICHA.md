# Ficha: MiniEstudio

> Inspirada en: OBS Studio (solo como referencia de funciones; no se copia nada)
> Autor/a: ClonaKit · Fecha: 12 de octubre de 2026

## 1. En una frase

Una web para montar una "realización" sencilla, con tu pantalla, tu cámara y textos colocados a tu gusto, y grabarla en un vídeo MP4 sin instalar nada.

## 2. Para quién y para qué

Para quien graba tutoriales, clases o demos cortas y quiere algo más que una grabación de pantalla, sin aprender un programa profesional.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Escenas | Tener varias composiciones guardadas (p. ej. "pantalla completa" y "pantalla + cámara") y saltar de una a otra con un fundido suave o con las teclas 1–9. | Estado en JavaScript + fundido dibujando en `<canvas>` |
| 2 | Fuentes | Añadir a cada escena la pantalla, la cámara, un texto o una imagen, y colocarlas y redimensionarlas arrastrando sobre la vista previa. Se pueden ocultar, reordenar y borrar. | `getDisplayMedia()`, `getUserMedia()` y composición en `<canvas>` |
| 3 | Mezclador de audio | Ver el nivel del micrófono y del audio de la pantalla con un medidor, y poder subir, bajar o silenciar cada uno. | Web Audio API (GainNode + AnalyserNode) |
| 4 | Grabar | Un botón para empezar y parar. Al parar se descarga el vídeo (MP4 si el navegador lo permite). Mientras graba se ve un contador. | `canvas.captureStream()` + `MediaRecorder` |

## 4. Pantallas

### Pantalla principal

- **Qué se ve:** arriba, una vista previa grande de la escena actual en 16:9 (1920×1080). Debajo, cuatro paneles en fila: escenas, fuentes, mezclador de audio y controles. Abajo del todo, una barra de estado con el contador de grabación, los fotogramas por segundo y la resolución.
- **Qué se puede hacer:** elegir escena, añadir o quitar fuentes con un menú, seleccionar una fuente haciendo clic en la vista previa (se marca con un recuadro y un tirador en la esquina para redimensionar), doble clic para ajustarla a pantalla completa, flechas del teclado para moverla con precisión y la tecla Supr para borrarla.

## 5. Flujos paso a paso

### Grabar un tutorial con cámara

1. La persona añade "Captura de pantalla" y elige qué compartir en el diálogo del navegador.
2. Añade "Cámara" y acepta el permiso. La cámara aparece pequeña en la esquina inferior derecha.
3. Pulsa "+ Micrófono" en el mezclador y comprueba que el medidor se mueve al hablar.
4. Pulsa "Iniciar grabación". El botón se pone rojo y el contador avanza.
5. Pulsa "Detener grabación". Se descarga un archivo con la fecha y la hora en el nombre.

## 6. Datos

- **Qué guarda:** escenas y posiciones de las fuentes.
- **Dónde:** solo en memoria (se pierde al recargar). El vídeo se descarga al ordenador de la persona.
- **Datos personales:** ninguno sale del navegador.

## 7. Para más adelante (fuera de esta versión)

- Emitir en directo (desde una web no se puede emitir por RTMP directamente; necesitaría un servidor).
- Filtros (croma, desenfoque), transiciones distintas del fundido y guardar las escenas entre sesiones.

## 8. Identidad propia

- **Nombre:** MiniEstudio.
- **Colores y estilo:** oscuro y técnico, con acento azul, y rojo solo para la grabación.
- **Icono o logo:** ninguno de momento.
- **Idioma de la interfaz:** español.

## 9. Checklist de sala limpia

- [x] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [x] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [x] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [x] El nombre y la identidad visual son míos y no se confunden con la app original.
- [x] Ninguna función se salta pagos, licencias, logins o protecciones del original.
