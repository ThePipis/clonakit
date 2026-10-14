# Ficha: Celda

> Inspirada en: Airtable (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Una hoja de datos con superpoderes: tablas con columnas de tipo fijo (texto, número, fecha, casilla, selección, enlace) que puedes ver como cuadrícula, como tablero por columnas o como galería de tarjetas, con filtros, orden y CSV, todo guardado en tu navegador.

## 2. Para quién y para qué

Para negocios que llevan clientes, pedidos, productos, proveedores o contenidos en hojas de cálculo que se les quedan cortas, y quieren verlos por fases o con fotos sin montar un programa de gestión.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Bases, tablas y campos | Crear varias bases (p. ej. "Tienda"), cada una con varias tablas ("Productos", "Pedidos"). Cada tabla tiene campos con tipo: texto, número (con decimales y, si se quiere, símbolo €), fecha, casilla, selección (opciones con color) y URL. El primer campo es el nombre de cada fila. Se pueden añadir, renombrar, reordenar, ocultar, borrar y cambiar de tipo. | Estado en JavaScript guardado en IndexedDB |
| 2 | Vista cuadrícula | Una tabla editable: clic en una celda para seleccionarla, Intro o doble clic para editarla con el control adecuado a su tipo, flechas del teclado para moverse, Tab para pasar a la derecha, Esc para cancelar. Fila nueva al final. Cada fila se puede abrir en una ficha con todos sus campos. | `<table>` con `<input>`, `<input type="date">`, `<input type="checkbox">` y `<select>` según el tipo; eventos de teclado |
| 3 | Vista tablero | Columnas según las opciones de un campo de selección (más una columna "Sin valor"). Cada fila es una tarjeta; arrastrarla a otra columna cambia ese valor. | API Drag and Drop de HTML; en móvil, un desplegable en la tarjeta para cambiar de columna |
| 4 | Vista galería | Una cuadrícula de tarjetas con una imagen de portada (tomada de un campo URL que apunte a una imagen), el nombre y hasta 3 campos más. | CSS Grid, `<img loading="lazy">` |
| 5 | Filtros, orden y CSV | Cada vista guarda sus filtros (condiciones según el tipo de campo, combinadas con "todas" o "alguna") y su orden (hasta 3 campos). Importar un CSV como tabla nueva o añadiendo filas, adivinando el tipo de cada columna. Exportar la vista actual a CSV. | `File.text()`, lector de CSV propio, `Blob` + descarga con BOM UTF-8 para que Excel lea bien las tildes |

## 4. Pantallas

### Inicio

- **Qué se ve:** las bases como tarjetas (nombre, emoji y color elegidos por la persona, número de tablas y fecha de último cambio) y un botón para crear una base vacía o desde un ejemplo ("Clientes y pedidos" con datos inventados que se pueden borrar).
- **Qué se puede hacer:** abrir, renombrar, duplicar, borrar (con confirmación) e importar o exportar una base completa como `.json`.

### Dentro de una base

- **Qué se ve:**
  - **Arriba:** el nombre de la base y una fila de pestañas, una por tabla, con un "+" para crear otra.
  - **Barra de la vista:** el nombre de la vista actual (cuadrícula, tablero o galería) con un desplegable para cambiar entre las vistas guardadas de esa tabla o crear una nueva; botones de filtrar, ordenar, ocultar campos, importar y exportar; un buscador rápido; y el contador "N de M filas".
  - **Centro:** la vista elegida.
- **Cuadrícula:** cabecera fija con un icono por tipo de campo y el nombre. Al pulsar la cabecera se abre un menú para renombrar, cambiar el tipo, ordenar, ocultar o borrar el campo; el ancho de columna se cambia arrastrando su borde. La primera columna queda fija al desplazar en horizontal. La celda elegida tiene un borde del color de acento. Las casillas se marcan con un solo clic; las selecciones se ven como pastillas de color; las URL, como enlaces.
- **Tablero:** columnas con el color de cada opción y su número de tarjetas; tarjetas con el nombre y los 3 primeros campos visibles; un botón al pie de cada columna para crear una fila con ese valor ya puesto. Si la tabla no tiene ningún campo de selección, la vista lo explica y ofrece crear uno.
- **Galería:** tarjetas de ancho fijo; sin imagen, una portada con la inicial del nombre sobre el color de acento.
- **Ficha de la fila:** una ventana con todos los campos de la fila en vertical, botones para ir a la fila anterior o siguiente, duplicar y borrar.

### Ventana de filtros

- Filas de condición: campo → operador → valor. Los operadores cambian con el tipo: texto (contiene, no contiene, es, está vacío), número y fecha (=, ≠, <, >, entre, está vacío), casilla (marcada, sin marcar), selección (es, no es, es alguna de), URL (está vacía, no está vacía).

## 5. Flujos paso a paso

### Llevar los pedidos por fases

1. La persona crea la base "Tienda" y la tabla "Pedidos" con los campos Cliente (texto), Importe (número con €), Fecha (fecha), Pagado (casilla), Estado (selección: Nuevo, Preparando, Enviado, Entregado) y Seguimiento (URL).
2. Rellena filas en la cuadrícula moviéndose con Tab e Intro.
3. Crea la vista "Tablero de envíos" de tipo tablero, agrupada por Estado.
4. Arrastra el pedido de Lucía de "Preparando" a "Enviado": en la cuadrícula su Estado ya es "Enviado".
5. En la cuadrícula filtra "Pagado sin marcar" y ordena por Fecha ascendente para ver qué cobros faltan. El filtro solo afecta a esa vista.

### Traer los datos de una hoja de cálculo

1. Pulsa importar y elige `clientes.csv`. La app detecta si el separador es coma o punto y coma.
2. Ve una vista previa con el tipo propuesto para cada columna (número si todos los valores lo son, fecha si tienen formato de fecha, casilla si son sí/no o verdadero/falso, URL si empiezan por http) y puede cambiarlo.
3. Elige "tabla nueva" o "añadir a la tabla actual" (y en ese caso, a qué campo va cada columna).
4. Pulsa importar: ve cuántas filas se han creado y qué valores no encajaban con su tipo (se dejan vacíos y se listan).

### Exportar para la gestoría

1. En una vista filtrada pulsa exportar y elige el separador: coma, o punto y coma (lo que espera Excel configurado en español).
2. Se descarga `pedidos-AAAA-MM-DD.csv` solo con las filas y columnas visibles.

## 6. Datos

- **Qué guarda:** las bases, sus tablas, la definición de los campos (nombre, tipo, opciones y formato), las filas y las vistas de cada tabla (tipo, filtros, orden, campos ocultos, anchos de columna y campo de agrupación).
- **Dónde:** en el navegador con IndexedDB, guardando cada cambio al momento. Cambiar el tipo de un campo convierte los valores que se pueda y avisa antes de vaciar los que no. Copia de seguridad por base en `.json`.
- **Datos personales:** los que la persona decida guardar (por ejemplo, clientes). Se quedan en este navegador; si se borran los datos del navegador, se pierden, así que la app recomienda exportar una copia de vez en cuando.

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- El tablero tiene un selector "Agrupado por" para elegir qué campo de selección forma las columnas; "Sin valor" va al final.
- Al teclear sobre una fecha, `<input type="date">` se come la primera tecla: usa un campo de texto que acepte dd/mm/aaaa (y abre el selector nativo con Intro).
- La galería solo intenta cargar como portada las URL con aspecto de imagen.
- El CSV exportado usa coma decimal cuando el separador es `;`, y solo entrecomilla lo necesario: así la ida y vuelta queda idéntica.
- Para que vaya fluida hasta unas 2.000 filas, al editar una celda se repinta solo esa celda si el cambio no afecta al orden, los filtros ni la búsqueda.
- Si al pulsar Intro se abre una ventana, haz `preventDefault`: si no, el mismo Intro la cierra al momento.
- `replaceChildren` no descarta `null` ni aplana listas: usa una función auxiliar o aparecerá "null" escrito en pantalla.

## 7. Para más adelante (fuera de esta versión)

- Enlazar filas entre tablas (un pedido que apunta a su cliente) y campos de fórmula.
- Adjuntar archivos e imágenes en lugar de usar URL.
- Vista calendario por un campo de fecha.
- Trabajar en equipo y desde varios dispositivos (Supabase como base de datos con inicio de sesión).
- Formularios públicos que añadan filas (receta de formularios + n8n) y automatizaciones con n8n.
- Tablas muy grandes (decenas de miles de filas), que necesitan pintar solo las filas visibles.

## 8. Identidad propia

- **Nombre:** Celda.
- **Colores y estilo:** claro, limpio y tranquilo, pensado para muchas horas de uso. Fondo `#FCFCFA`, texto grafito `#2B2D31`, cabeceras `#F4F2ED`, líneas de la rejilla `#E6E4DF`, acento verde salvia `#3F8A6B` (botones principales y borde de la celda elegida, con fondo de selección `#EEF6F1`). Colores de las opciones de selección en tonos pastel propios: `#F6D8CF`, `#F9E7B7`, `#D7EBD2`, `#CFE3EE`, `#E6DDF1`, `#EFE3D3`, `#DDE1E6`.
- **Icono o logo:** un cuadrado dividido en cuatro celdas con una de ellas rellena de verde salvia.
- **Idioma de la interfaz:** español, con números y fechas en formato español (1.234,50 € y 13/10/2026).

## 9. Checklist de sala limpia

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
