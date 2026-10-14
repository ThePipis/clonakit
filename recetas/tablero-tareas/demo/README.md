# Columnas

> **Demo de la receta `tablero-tareas`**, construida por ClonaKit en sala limpia a partir de [su ficha](../FICHA.md). Pruébala con `npm run demo -- tablero-tareas` y después crea la tuya, con tu nombre y tu marca, escribiendo `/clonar` en Antigravity.

Organiza el trabajo en tableros con columnas (por ejemplo «Pendiente», «En marcha» y «Terminado») y tarjetas que se arrastran de una a otra, con checklist, fecha límite y etiquetas de color. Pensada para quien lleva pedidos, clientes, encargos o proyectos y quiere ver de un vistazo en qué fase está cada cosa, sin cuentas ni instalaciones.

Inspirada en las funciones de Trello. No es una app oficial ni contiene nada del original; mira [LEGAL.md](LEGAL.md).

## Funciones

- **Tableros**: crea varios, cada uno con su nombre y color de fondo. Desde el botón «⋯» de cada tablero puedes renombrarlo, cambiar el color, duplicarlo o borrarlo (con confirmación). Al crearlo eliges empezar vacío o con tres listas de ejemplo.
- **Listas y tarjetas que se arrastran**: listas en horizontal con tarjetas dentro. Crea, renombra (con un clic en el nombre) y borra listas; crea tarjetas al pie de cada lista (Intro crea y deja el cuadro listo para otra; Esc cancela). Arrastra tarjetas dentro de una lista o a otra, y arrastra listas por su cabecera para reordenarlas: una línea marca dónde caerá.
- **Detalle de tarjeta**: título, descripción (las direcciones web se convierten en enlaces), checklist con barra de progreso, fecha límite que se puede marcar como cumplida, 6 etiquetas de color con nombre, mover a otra lista o posición, duplicar y borrar.
- **Filtro y búsqueda**: busca por texto en títulos y descripciones (sin distinguir mayúsculas ni tildes) y filtra por una o varias etiquetas. Un contador dice cuántas tarjetas se ven.
- **Guardar y copia de seguridad**: todo se guarda solo en el navegador. Exporta un tablero o todos a un archivo `.json` e impórtalos en otro ordenador.

En la cara de cada tarjeta, la fecha sale en **rojo** si venció sin cumplirse, en **ámbar** si vence hoy o mañana, en **verde** si está cumplida y en gris en los demás casos.

## Probarla en tu ordenador

Desde la carpeta de ClonaKit:

```bash
npm run demo -- tablero-tareas
```

Se abrirá en http://localhost:3000.

## Publicarla

Es una web estática (HTML, CSS y JavaScript, sin dependencias ni paso de build): se publica en Vercel importando este repositorio, con el preset **Other** y sin comando de build. Cada `git push` publica una nueva versión.

Los datos de cada persona se quedan en su propio navegador: publicar la app no comparte los tableros de nadie.

## Cómo está hecha

| Archivo | Qué hay dentro |
| --- | --- |
| `index.html` | La estructura de las dos pantallas (inicio y tablero) y de las ventanas. |
| `style.css` | Todo el diseño. Los colores están en variables al principio. |
| `app.js` | El punto de entrada: decide qué pantalla se ve según la dirección (`#/` o `#/tablero/…`). |
| `js/estado.js` | Los datos (tableros, listas y tarjetas), guardarlos en `localStorage` y las operaciones que los cambian. |
| `js/inicio.js` | La pantalla de inicio: cuadrícula de tableros, menú «⋯» y ventana de nuevo tablero. |
| `js/tablero.js` | La pantalla de tablero: listas, tarjetas, crear y renombrar, filtro y búsqueda. |
| `js/arrastre.js` | Arrastrar y soltar tarjetas y listas, con la línea que marca el destino. |
| `js/detalle.js` | La ventana de detalle de una tarjeta. |
| `js/copias.js` | Exportar e importar copias de seguridad. |
| `js/dialogos.js` | Ventanas de confirmación, avisos y menús flotantes. |
| `js/util.js` | Herramientas pequeñas: crear elementos, fechas, enlaces e iconos. |

## Decisiones

Cosas que la ficha no concretaba y cómo se resolvieron:

- **Direcciones con `#`**: el inicio es `#/` y cada tablero `#/tablero/<id>`. Así, al recargar sigues en el mismo tablero, el botón Atrás del navegador funciona y no hace falta configurar nada en el servidor.
- **Nuevo tablero**: por defecto se ofrece «Con tres listas» (Pendiente, En marcha, Terminado) y el color verde azulado. Intro en el nombre lo crea y lo abre.
- **Filtro con varias etiquetas**: se ve una tarjeta si tiene **alguna** de las etiquetas marcadas. El texto del buscador se suma a ese filtro (tienen que cumplirse los dos). El filtro no se guarda: se reinicia al cambiar de tablero o recargar.
- **Nombres de las etiquetas**: se ponen desde el detalle de cualquier tarjeta («Poner nombre a las etiquetas») y valen para todo el tablero. Una etiqueta sin nombre se muestra con el de su color («Rojo»).
- **«Mover a»**: además de la lista se elige la **posición**, para poder reordenar dentro de la misma lista sin arrastrar. Para las **listas**, su menú «⋯» incluye «Mover a la izquierda / a la derecha», como alternativa a arrastrarlas en el móvil o con el teclado (la ficha solo pedía la alternativa para tarjetas).
- **Clic fuera del cuadro de nueva tarjeta o lista**: si hay texto escrito se crea (para no perderlo); si está vacío, simplemente se cierra. Esc siempre cancela.
- **Duplicar**: la tarjeta copiada aparece justo debajo con « (copia)» en el título y conserva descripción, etiquetas, fecha y checklist. El tablero duplicado aparece detrás del original con « (copia)» y es independiente.
- **Checklist**: cada elemento se puede quitar con su botón ×. Para cambiar un texto, se quita y se vuelve a escribir.
- **Fecha límite**: «cumplida» solo se puede marcar si hay fecha; al quitar la fecha se quita también la marca. Si la fecha no es de este año se añade el año («14 oct 2027»).
- **Título de la tarjeta**: es de una sola línea (Intro termina la edición). Si se deja vacío, vuelve el título anterior.
- **Importar**: un tablero «ya existe» si tiene el mismo identificador interno (por ejemplo, al importar en el mismo navegador una copia hecha desde él). Se pregunta por cada uno, «Sustituir» o «Guardar una copia»; si se cancela la pregunta, se anula toda la importación y no cambia nada. Si al archivo le falta algo esencial (nombres, listas, títulos), se rechaza entero con un aviso.
- **Formato del archivo**: `{ "app": "columnas", "formato": 1, "exportado": "…", "tableros": [ … ] }`. Exportar todo descarga `columnas-AAAA-MM-DD.json`; exportar un tablero, `columnas-<nombre-del-tablero>-AAAA-MM-DD.json`.
- **Recordatorio de copia**: el inicio recuerda que los datos viven solo en este navegador y muestra la fecha de la última copia completa.
- **Dos pestañas abiertas**: si cambias algo en una, la otra se recarga sola para no pisar esos cambios.
- **Datos dañados**: si lo guardado en el navegador no se puede leer, la app arranca vacía y aparta lo dañado en `columnas:datos:rescate` en lugar de borrarlo.
- **Primera visita**: sin tableros, el inicio muestra una bienvenida con un dibujo de ejemplo.
- **Solo modo claro**: la identidad de la ficha es cálida y clara, así que no hay modo oscuro.
- **Móvil**: el detalle se abre a pantalla completa con el foco en «Cerrar» (para que no salga el teclado de golpe) y la barra del navegador toma el color del tablero.
