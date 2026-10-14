# MiEnlace

> **Demo de la receta `enlaces-bio`**, construida por ClonaKit en sala limpia a partir de [su ficha](../FICHA.md). Pruébala con `npm run demo -- enlaces-bio` y después crea la tuya, con tu nombre y tu marca, escribiendo `/clonar` en Antigravity.

Un editor para montar tu página de enlaces (foto, nombre, una frase sobre ti y botones a tu web, tu tienda, tu agenda o tu WhatsApp) que la descarga como **un único `index.html`** listo para publicar gratis en Vercel. Esa página publicada es el enlace que pones en la bio de tus redes.

Inspirada en las funciones de Linktree. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

## Funciones

- **Perfil:** sube una foto (se recorta al centro en cuadrado y se reduce a 320 × 320 px), escribe tu nombre y una bio de hasta 160 caracteres con contador.
- **Enlaces:** añade, edita, oculta sin borrar, borra (con «Deshacer») y cambia el orden arrastrando el asa ⋮⋮, con los botones de subir y bajar o con las flechas del teclado. Si falta `https://`, se añade solo; un email se convierte en enlace de correo y un teléfono en enlace de llamada. Cada enlace lleva un icono propio (web, tienda, calendario, correo, teléfono, chat, vídeo, música, foto, documento, mapa, estrella o ninguno).
- **Temas:** 5 temas propios (Arena, Noche, Mar, Melocotón y Mínimo) o colores a mano para el fondo, los botones y su texto, la forma de los botones (redondeados, píldora o rectos) y el tipo de letra. Avisa si el texto se lee mal (norma WCAG) y lo arregla con un clic.
- **Vista previa móvil en vivo:** un teléfono dibujado con tu página dentro, que cambia con cada tecla. Usa exactamente el mismo HTML que se descarga.
- **Exportar mi página:** descarga un `index.html` autónomo (estilos dentro, foto incrustada, título y descripción para buscadores y redes, sin JavaScript) y te explica los pasos para publicarlo.
- **Guardar y abrir el proyecto** (`.json`) para seguir otro día. Además, todo se guarda solo en tu navegador.

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run demo -- enlaces-bio
```

Se abrirá en http://localhost:3000. La primera vez verás un ejemplo relleno; pulsa **Empezar desde cero** para crear la tuya.

## Publicarla

Aquí hay dos cosas distintas que se pueden publicar:

1. **Tu página de enlaces** (lo normal): en MiEnlace pulsa **Exportar mi página**, crea una carpeta nueva (por ejemplo `marta-ceramica`), mete dentro el `index.html` descargado y publícala con `/desplegar` del kit. Te dará una dirección como `marta-ceramica.vercel.app`: cópiala en la bio de tus redes. Para cambiar algo más adelante, edita en MiEnlace, exporta otra vez y sustituye el `index.html` publicado.
2. **El propio editor MiEnlace** (si quieres usarlo desde cualquier sitio): es una web estática (HTML, CSS y JavaScript), así que se publica en Vercel importando esta carpeta, con el preset **Other** y sin comando de build. Cada `git push` publica una nueva versión.

## Cómo está hecho

Sin dependencias ni pasos de compilación. Cada archivo de `js/` se ocupa de una parte:

| Archivo | Qué hace |
| --- | --- |
| `index.html` | La estructura del editor y el molde de cada tarjeta de enlace. |
| `style.css` | El aspecto del editor (los estilos de la página exportada van dentro de `js/pagina.js`). |
| `js/app.js` | Punto de entrada: arranca cada sección y las conecta. |
| `js/estado.js` | Los datos del proyecto, el ejemplo inicial, la limpieza de datos y el guardado en el navegador. |
| `js/perfil.js` | Foto (recorte y reducción con `<canvas>`), nombre y bio. |
| `js/enlaces.js` | Lista de enlaces: editar, ocultar, borrar, subir, bajar y arrastrar. |
| `js/direcciones.js` | Comprueba y arregla las direcciones (web, email, teléfono) y rechaza las peligrosas. |
| `js/aspecto.js` y `js/temas.js` | Temas, colores, forma, letra y cálculo de contraste. |
| `js/pagina.js` | Genera el `index.html` final como texto (lo usan la vista previa y la exportación). |
| `js/vista-previa.js` | El teléfono con la página dentro. |
| `js/publicar.js` | Exportar, guardar y abrir el proyecto. |
| `js/iconos.js` | Los iconos y el logo, dibujados en SVG. |
| `js/ui.js` | Avisos flotantes, ventanas y descargas. |

## Decisiones

Cosas que la ficha no concretaba y cómo se han resuelto:

- **Cada tema trae su forma y su letra**, además de los colores, para que tengan personalidad: Arena (redondeados, con remates), Noche (píldora, sin remates), Mar (píldora, redondeada), Melocotón (redondeados, redondeada) y Mínimo (rectos, sin remates). Se pueden cambiar después.
- **El color del nombre y la bio no tiene selector:** se elige solo (casi negro o blanco) según el fondo. Si ninguno de los dos se lee bien (contraste menor de 4,5:1), aparece un aviso.
- **El aviso de contraste usa el mínimo de la norma WCAG AA (4,5:1)** e incluye un botón «Usar texto oscuro / blanco» que lo arregla con un clic.
- **Borde automático:** si un botón casi no se distingue del fondo (como en el tema Mínimo, con botón blanco sobre fondo blanco), se le dibuja un borde del color de su texto.
- **Enlaces que no salen en la página:** los ocultos, los que no tienen título y los que tienen una dirección no válida. Estos dos últimos se avisan en la tarjeta y al exportar. La vista previa sigue la misma regla, porque es idéntica a la exportación.
- **Reglas de las direcciones:** algo con `@` es un email (→ `mailto:`); solo números, espacios, guiones y `+` con al menos 6 dígitos es un teléfono (→ `tel:`, sin espacios); lo demás es una web, y debe terminar en `.algo` (por eso no valen direcciones IP ni `localhost`). La dirección arreglada se ve al salir del campo.
- **Los enlaces nuevos llevan el icono «Web»** por defecto, y solo se despliega una tarjeta a la vez.
- **Borrar no pregunta «¿seguro?»:** borra al momento y ofrece «Deshacer» durante 7 segundos.
- **Teclado:** con el foco en el asa ⋮⋮, las flechas arriba y abajo mueven el enlace (alternativa a arrastrar). En pantallas táctiles, donde arrastrar no siempre funciona, están los botones de subir y bajar.
- **La vista previa dibuja la página a 390 px de ancho** (un móvil típico) y la encoge para caber en el teléfono, así se reparte igual que en un móvil real. Sus botones no navegan: un aviso dice adónde llevarán.
- **Ejemplo inicial:** «Lucía Ríos · Ilustración» con una ilustración propia en SVG y un enlace oculto para enseñar esa función. La franja ofrece «Empezar desde cero» y «Seguir con el ejemplo».
- **Página exportada:** los enlaces se abren en la misma pestaña; el icono de la pestaña es un círculo con la inicial del nombre; sin foto no se dibuja círculo; sin nombre el título es «Mis enlaces» y sin bio se escribe una descripción automática. «Hecho con MiEnlace» viene activado y se quita con una casilla en Publicar.
- **No se exporta una página vacía** (sin nombre ni enlaces): se avisa en su lugar.
- **El editor no tiene modo oscuro**, porque la ficha pide un estilo claro.
- **El botón mandarina lleva texto oscuro:** el blanco sobre `#F07F3C` solo llega a 2,7:1 de contraste y se leería mal.
- **Fotos:** las PNG transparentes se ponen sobre fondo blanco (el JPEG no tiene transparencia). Al abrir un `.json`, la foto solo se acepta si es una imagen incrustada (`data:image/…`) de menos de unos 1,5 MB, y se revisan todos los campos.
- **Después de exportar** se sugiere un nombre de carpeta a partir de tu nombre (por ejemplo `marta-ceramica-hecha-a-mano`).
