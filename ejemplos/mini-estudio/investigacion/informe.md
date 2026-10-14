# Informe de investigación: OBS

> Generado por ClonaKit con REA 6.4.0 el 13 de octubre de 2026 a las 18:33.
> Objetivo: `/Applications/OBS.app` · Tipo: **app nativa de Mac**

Este informe resume **cómo está montada** la app para que puedas diseñar tu propia versión. Úsalo para entender, no para copiar: en tu `FICHA.md` describe las funciones con tus palabras, sin copiar textos, nombres, imágenes ni código del original.

## Resumen en 30 segundos

- Es una **app nativa de Mac** hecha con Qt (C++).
- Pide permiso para: cámara, micrófono, controlar otras apps (Apple Events / atajos globales).
- Piezas del sistema que usa: grabar y reproducir audio y vídeo, usar la cámara, audio de bajo nivel, cámaras virtuales y dispositivos de vídeo, gráficos y cálculo en la tarjeta gráfica, capturar la pantalla o ventanas, extensiones del sistema, comprimir vídeo con el chip del ordenador.
- Está dividida en 26 plugins.

## Qué tipo de app es

OBS (versión 32.2.2, identificador `com.obsproject.obs-studio`) es una app **nativa**: está compilada para el procesador del Mac y habla directamente con el sistema. Sin un desensamblador (Ghidra o Hopper) no podemos leer su lógica por dentro, pero tampoco hace falta: para recrear sus funciones basta con saber **qué piezas usa y para qué**.

Funciona en macOS 13.0 o superior.

## Permisos que pide

Lo que la app pide al sistema operativo, con la explicación que ella misma da al usuario. Esa explicación es texto del original: sirve para entender la función, pero no la copies en tu versión.

| Permiso | Para qué lo pide |
| --- | --- |
| Cámara | «OBS needs to access the camera to enable camera sources to work.» |
| Micrófono | «OBS needs to access the microphone to enable audio input.» |
| Controlar otras apps (Apple Events / atajos globales) | «OBS needs to access background events to enable hotkeys while not in focus.» |

Capacidades especiales que Apple le concede (entitlements):

- Instalar extensiones del sistema (p. ej. una cámara virtual)
- Compartir datos con sus programas ayudantes
- Ejecutar código no firmado en memoria (plugins o scripts)
- Cargar plugins de terceros
- Usar el micrófono
- Usar la cámara

## Piezas del sistema que usa

La columna central es la clave para tu versión: cómo se consigue lo mismo en una app web.

| Pieza | Para qué sirve | Cómo se hace en una web | Quién la usa |
| --- | --- | --- | --- |
| AppKit | Interfaz nativa de Mac (ventanas, menús, botones) (usa NSRunningApplication, NSColorSpace, NSWorkspace y 5 más) | HTML + CSS | app principal, aja, aja-output-ui y 8 más |
| ApplicationServices | Accesibilidad, eventos y control de otras apps | No disponible en web (los atajos solo funcionan con la pestaña activa) | app principal |
| AudioToolbox | Codificar y reproducir audio | Web Audio API o MediaRecorder | coreaudio-encoder |
| AudioUnit | Efectos y procesado de audio | Web Audio API (AudioWorklet) | mac-capture |
| AVFoundation | Grabar y reproducir audio y vídeo, usar la cámara (usa AVCaptureDevice, AVCaptureDeviceFormat, AVCaptureSession y 4 más) | getUserMedia() y las etiquetas <video>/<audio> | app principal, mac-avcapture, mac-avcapture-legacy y 1 más |
| CoreAudio | Audio de bajo nivel (micrófonos, altavoces) | Web Audio API | coreaudio-encoder, mac-capture |
| CoreGraphics | Dibujo 2D, pantallas y ventanas | <canvas> 2D o SVG | app principal, mac-avcapture, mac-capture |
| CoreMedia | Manejar fotogramas y muestras de audio/vídeo | MediaStream o WebCodecs | mac-avcapture, mac-avcapture-legacy, mac-capture y 2 más |
| CoreMediaIO | Cámaras virtuales y dispositivos de vídeo | getUserMedia() (en web no se pueden crear cámaras virtuales) | mac-avcapture, mac-avcapture-legacy, mac-virtualcam |
| CoreVideo | Imágenes de vídeo en memoria | <canvas> o WebCodecs (VideoFrame) | mac-avcapture, mac-avcapture-legacy, mac-capture y 2 más |
| DiskArbitration | Detectar discos conectados | No disponible en web | app principal, aja-output-ui, decklink-captions y 5 más |
| ImageIO | Leer y guardar imágenes | <img>, createImageBitmap() y canvas.toBlob() | app principal, aja-output-ui, decklink-captions y 5 más |
| IOKit | Hardware: USB, energía, dispositivos | WebUSB o WebHID (limitado) | app principal, aja, aja-output-ui y 6 más |
| Metal | Gráficos y cálculo en la tarjeta gráfica (GPU) | WebGL o WebGPU | app principal, aja-output-ui, decklink-captions y 5 más |
| OpenGL | Gráficos 2D/3D en la GPU (tecnología antigua) | WebGL | app principal, aja-output-ui, decklink-captions y 5 más |
| ScreenCaptureKit | Capturar la pantalla o ventanas (usa SCStreamConfiguration, SCContentFilter, SCStream y 1 más) | getDisplayMedia() | mac-capture |
| Security | Llavero, certificados y cifrado | Web Crypto API (las contraseñas, mejor en un servidor) | app principal, obs-outputs |
| SystemExtensions | Extensiones del sistema (p. ej. cámara virtual) (usa OSSystemExtensionRequest, OSSystemExtensionManager) | No disponible en web | mac-virtualcam |
| UniformTypeIdentifiers | Tipos de archivo | <input type="file" accept="…"> | app principal, aja-output-ui, decklink-captions y 5 más |
| VideoToolbox | Comprimir vídeo con el chip del ordenador (H.264/HEVC) | MediaRecorder o WebCodecs (VideoEncoder) | mac-videotoolbox |

Otras piezas del sistema: ScriptingBridge.

## Librerías que lleva dentro

| Librería | Para qué sirve |
| --- | --- |
| Chromium Embedded Framework | Chromium embebido: un navegador dentro de la app para mostrar webs |
| QtCore, QtGui, QtNetwork, QtSvg y 2 más | Qt: interfaz multiplataforma escrita en C++ |
| Sparkle | Sparkle: actualizaciones automáticas |
| Syphon | Syphon: compartir vídeo entre apps de Mac |
| libavcodec, libavdevice, libavfilter, libavformat y 3 más | FFmpeg: codificar y decodificar audio y vídeo |
| libdatachannel | WebRTC: vídeo y datos en tiempo real |
| libfreetype | Dibujar tipografías |
| libmbedcrypto, libmbedtls, libmbedx509 | Cifrado y conexiones seguras (TLS) |
| libobs-frontend-api, libobs-metal, libobs-opengl, libobs y 2 más | Núcleo propio de la app |
| librist, libsrt | Protocolos de vídeo en directo por red |
| libx264 | x264: codificador de vídeo H.264 |

## Módulos y plugins

La app está dividida en piezas que se cargan por separado. El nombre de cada plugin y lo que usa dan pistas de su función:

| Plugin | Usa |
| --- | --- |
| aja | Solo piezas genéricas |
| aja-output-ui | gráficos y cálculo en la tarjeta gráfica (GPU) |
| coreaudio-encoder | audio de bajo nivel (micrófonos, altavoces) |
| decklink | Solo piezas genéricas |
| decklink-captions | gráficos y cálculo en la tarjeta gráfica (GPU) |
| decklink-output-ui | gráficos y cálculo en la tarjeta gráfica (GPU) |
| frontend-tools | gráficos y cálculo en la tarjeta gráfica (GPU) |
| image-source | Solo piezas genéricas |
| mac-avcapture | grabar y reproducir audio y vídeo, usar la cámara, cámaras virtuales y dispositivos de vídeo |
| mac-avcapture-legacy | grabar y reproducir audio y vídeo, usar la cámara, cámaras virtuales y dispositivos de vídeo |
| mac-capture | audio de bajo nivel (micrófonos, altavoces), capturar la pantalla o ventanas |
| mac-syphon | Solo piezas genéricas |
| mac-videotoolbox | grabar y reproducir audio y vídeo, usar la cámara, comprimir vídeo con el chip del ordenador (H.264/HEVC) |
| mac-virtualcam | cámaras virtuales y dispositivos de vídeo, extensiones del sistema (p. ej. cámara virtual) |
| obs-browser | gráficos y cálculo en la tarjeta gráfica (GPU) |
| obs-ffmpeg | Solo piezas genéricas |
| obs-filters | Solo piezas genéricas |
| obs-outputs | Solo piezas genéricas |
| obs-transitions | Solo piezas genéricas |
| obs-vst | gráficos y cálculo en la tarjeta gráfica (GPU) |
| obs-webrtc | Solo piezas genéricas |
| obs-websocket | gráficos y cálculo en la tarjeta gráfica (GPU) |
| obs-x264 | Solo piezas genéricas |
| rtmp-services | Solo piezas genéricas |
| text-freetype2 | Solo piezas genéricas |
| vlc-video | Solo piezas genéricas |

## Pistas de arquitectura

Familias de funciones que el programa principal pide a sus propias librerías, con cuántas usa de cada una. Los nombres suelen delatar los conceptos con los que está construida la app (por ejemplo `scene` = escenas, `source` = fuentes, `output` = salidas):

- **libobs**: `obs_source` (99), `obs_sceneitem` (58), `obs_data` (48), `obs_property` (48), `obs_get` (39), `obs_output` (39), `obs_encoder` (26), `obs_hotkey` (24), `obs_service` (20), `obs_scene` (19), `obs_enum` (15), `obs_transition` (12)
- **obs-frontend-api**: `obs_frontend` (16)

## Programas ayudantes

| Nombre | Qué es |
| --- | --- |
| com.obsproject.obs-studio.mac-camera-extension | extensión del sistema |
| OBS Helper (GPU) | proceso ayudante |
| OBS Helper (Plugin) | proceso ayudante |
| OBS Helper (Renderer) | proceso ayudante |
| OBS Helper | proceso ayudante |
| obs-ffmpeg-mux | programa o librería auxiliar |

## Lo que este informe no puede ver

- El código por dentro: sin Ghidra o Hopper solo vemos el «esqueleto» (piezas, permisos, plugins).
- Lo que pasa en sus servidores, si los tiene.
- Cómo se ve: ábrela y fíjate en sus pantallas, o haz capturas para ti.

## Siguiente paso

Escribe tu `FICHA.md`: elige de 3 a 5 funciones para tu primera versión y descríbelas con tus palabras. En Antigravity, `/clonar` te guía. Los datos en bruto de `datos/` son solo para consulta: **no los publiques**.
