# Embudo

> **Demo de la receta `email-marketing`**, construida por ClonaKit en sala limpia a partir de [su ficha](../FICHA.md). Pruébala con `npm run demo -- email-marketing` y después crea la tuya, con tu nombre y tu marca, escribiendo `/clonar` en Antigravity.

Un taller de email marketing en el navegador: ordena tus contactos, agrúpalos en segmentos, diseña emails por bloques y dibuja tus automatizaciones. Cuando estés listo, lo exportas todo (HTML de los emails y `.json` de las automatizaciones) para conectarlo a un servicio de envío.

**Lo que esta versión no hace:** no envía emails ni mide aperturas, clics o ventas, y no ejecuta las automatizaciones (solo las dibuja y las prueba). Tampoco muestra números de ejemplo: solo cuenta lo que existe de verdad.

Inspirada en las funciones de ActiveCampaign. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

## Funciones

- **Contactos:** importar un CSV (coma o punto y coma) con un asistente de 4 pasos, añadir y editar contactos a mano, etiquetas, campos personalizados (texto, número o fecha), búsqueda, selección múltiple para etiquetar o borrar en bloque y exportación a CSV.
- **Segmentos:** grupos guardados con condiciones (tiene o no tiene una etiqueta; un campo es igual, contiene, es mayor o menor; una fecha es anterior o posterior), combinadas con «todas» o «alguna». El recuento se actualiza mientras escribes.
- **Emails:** editor por bloques (título, texto, imagen, botón, separador, espacio y pie legal), campos variables como `{{nombre}}`, vista previa de escritorio y de móvil con los datos de un contacto real y exportación del HTML (descarga o copiar).
- **Automatizaciones:** diagrama vertical con disparador, esperas, envío de email, condiciones con ramas «Sí» y «No», poner o quitar etiquetas y fin. Se prueba con un contacto (ilumina su camino sin enviar nada) y se exporta a `.json`.
- **Ajustes:** datos del remitente para el pie legal, copia de seguridad en `.json`, restaurarla y borrarlo todo.

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run demo -- email-marketing
```

Se abrirá en http://localhost:3000.

## Publicarla

Es una web estática (HTML, CSS y JavaScript, sin dependencias ni paso de build): se publica en Vercel importando este repositorio, con el preset **Other** y sin comando de build. Cada `git push` publica una nueva versión.

Ojo: cada persona que abra tu web tendrá sus propios datos, guardados solo en su navegador.

## Cómo está hecha

| Archivo | Qué hace |
| --- | --- |
| `index.html` | La estructura: barra lateral, zona de contenido y capas para ventanas y avisos. |
| `style.css` | Todo el diseño. Los colores están en variables al principio. |
| `app.js` | El arranque: carga los datos y elige qué pantalla pintar según la dirección (`#/contactos`, `#/emails/…`). |
| `js/db.js` | Guardado en IndexedDB, la base de datos del navegador. |
| `js/estado.js` | La copia en memoria de los datos y las funciones para guardarlos. |
| `js/ui.js` | Piezas comunes: crear elementos, iconos, ventanas, avisos, descargas. |
| `js/csv.js` | Lector y escritor de CSV hecho a mano. |
| `js/condiciones.js` | Filtros de los segmentos (también los usan las automatizaciones). |
| `js/contactos.js`, `js/importar.js`, `js/campos.js` | Pantalla de contactos, asistente de importación y campos personalizados. |
| `js/segmentos.js` | Pantalla de segmentos. |
| `js/emails.js`, `js/bloques.js`, `js/propiedades.js`, `js/vista-previa.js` | Lista y editor de emails, bloques y HTML final, panel de propiedades, vista previa y exportación. |
| `js/automatizaciones.js`, `js/simulador.js` | Diagrama de automatizaciones y la prueba con un contacto. |
| `js/ajustes.js`, `js/inicio.js` | Ajustes y portada. |

## Datos y privacidad

Todo se guarda en IndexedDB, en el navegador de quien usa la app; no se envía nada a ningún servidor. Los emails y nombres de tus contactos son datos personales: importa solo contactos que hayan aceptado recibir tus emails (RGPD). Esto no es asesoría legal.

## Decisiones

Cosas que la ficha no concretaba y cómo se han resuelto:

- **Portada.** La ficha habla de una portada pero la barra lateral solo tiene cinco secciones. La portada es la pantalla de inicio y se abre al pulsar el nombre «Embudo». Muestra lo que la app no hace y los totales reales (contactos, etiquetas, segmentos, emails y automatizaciones).
- **Campos fijos.** Email, nombre y fecha de alta existen siempre; también se pueden usar en segmentos y en los emails (`{{email}}`, `{{nombre}}`, `{{alta}}`). Cada campo personalizado tiene su clave sin acentos: «Interés» → `{{interes}}`.
- **Etiquetas en minúsculas.** Se guardan en minúsculas para que «Cliente» y «cliente» no sean dos etiquetas. Las comparaciones de texto de los segmentos y el buscador ignoran mayúsculas y acentos («ceramica» encuentra «Cerámica»).
- **Operadores.** Etiqueta: tiene / no tiene. Texto: es igual a / contiene. Número: es igual a / mayor que / menor que. Fecha: anterior a / posterior a (sin incluir el mismo día). Una condición sin valor todavía no filtra, y un segmento sin condiciones incluye a todos.
- **Importación.** La primera fila del CSV son los títulos. La app propone a qué campo va cada columna (las desconocidas, como campo nuevo con el tipo adivinado). Si un email ya existe, se actualiza: las celdas vacías no borran nada y las etiquetas se suman. Los emails se guardan en minúsculas. Las filas repetidas dentro del mismo archivo se juntan en un contacto.
- **Exportación de contactos.** CSV con punto y coma y marca BOM, para que Excel en español lo abra con columnas y acentos bien. Exporta los contactos que coinciden con la búsqueda actual (todos si no hay búsqueda).
- **Barra de selección.** Aparece desde el primer contacto marcado.
- **Tabla grande.** La tabla pinta 200 filas de golpe y un botón «Mostrar más» pinta las siguientes, para ir fluida con miles de contactos.
- **Nombre del email.** Cada email tiene un nombre interno (el que se ve en la lista y en las automatizaciones) además del asunto. Los emails nuevos empiezan con título, texto y pie legal.
- **Bloques nuevos** se añaden debajo del bloque elegido o, si no hay ninguno, al final (encima del pie legal).
- **Pie legal.** Usa los datos del remitente de Ajustes. Si falta el bloque, «Exportar» avisa y ofrece añadirlo o exportar igualmente. Si faltan datos del remitente, el pie muestra huecos como «[Dirección postal]» y la exportación lo advierte.
- **HTML exportado.** Los campos variables se quedan como `{{nombre}}` para que los rellene el servicio de envío. Las imágenes solo admiten direcciones `http(s)`; su tamaño es un porcentaje del ancho útil (536 px).
- **Diagrama.** Una condición siempre cierra su columna: si se inserta en mitad del diagrama, los pasos de debajo pasan a la rama «Sí» (la app lo avisa). «Fin» solo se ofrece al final de una rama. Al borrar una condición se elige qué rama conservar o borrar las dos.
- **Probar con un contacto.** Se simula sobre una copia: el contacto real no cambia. Si el contacto aún no cumple el disparador, se simula igualmente como si lo cumpliera y se dice. Las etiquetas que la prueba pone o quita cuentan para las condiciones siguientes. Cada paso se ilumina con una pausa de 0,65 s y se lleva la cuenta del tiempo simulado.
- **`.json` de la automatización.** Incluye los nombres y asuntos de los emails y los nombres de los segmentos, para que se entienda sin la app.
- **Sin modo oscuro.** La identidad pide fondo crema; la app se ve siempre en claro.
- **Móvil.** La barra lateral pasa a ser una barra inferior (con «Automat.» abreviado) y los paneles de propiedades salen desde abajo. Arrastrar bloques también funciona con el dedo (asa ⋮⋮), y siguen las flechas.
- **Extras pequeños de ayuda:** totales reales junto a cada sección del menú y miniaturas de cada email en la lista.
