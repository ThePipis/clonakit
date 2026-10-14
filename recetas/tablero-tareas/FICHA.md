# Ficha: Columnas

> Inspirada en: Trello (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Una web para organizar el trabajo en tableros con columnas (por ejemplo "Pendiente", "En marcha", "Terminado") y tarjetas que se arrastran de una a otra, con checklist, fecha límite y etiquetas de color.

## 2. Para quién y para qué

Para quien lleva pedidos, clientes, encargos o proyectos y quiere ver de un vistazo en qué fase está cada cosa y qué se ha quedado atascado, sin cuentas ni instalaciones.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Tableros | Crear varios tableros con nombre y color de fondo; renombrarlos, duplicarlos y borrarlos (con confirmación). | Estado en JavaScript, `localStorage` |
| 2 | Listas y tarjetas que se arrastran | Cada tablero tiene listas en horizontal con tarjetas dentro. Crear, renombrar y borrar listas; crear tarjetas al pie de cada lista; arrastrar tarjetas dentro de la misma lista o a otra, y arrastrar listas para reordenarlas. Una línea marca dónde caerá lo que se arrastra. | API Drag and Drop de HTML; en móvil y con teclado, un selector "mover a" en el detalle de la tarjeta |
| 3 | Detalle de tarjeta | Al abrir una tarjeta: título, descripción, checklist con barra de progreso, fecha límite (se puede marcar como cumplida) y etiquetas de color. | Ventana con `<dialog>`, `<input type="date">`, `<textarea>` |
| 4 | Filtro y búsqueda | Buscar por texto en títulos y descripciones y filtrar por una o varias etiquetas. Las tarjetas que no cumplen se ocultan y un contador dice cuántas se ven. | Filtrado en memoria sin distinguir mayúsculas ni tildes (`normalize('NFD')`) |
| 5 | Guardar y copia de seguridad | Todo se guarda solo. Exportar un tablero o todos a un archivo `.json` e importarlos después. | `localStorage`, `Blob` + descarga, `<input type="file">` + `File.text()` |

## 4. Pantallas

### Inicio (mis tableros)

- **Qué se ve:** una cuadrícula de tableros, cada uno como un rectángulo de su color con el nombre y el número de tarjetas. Al final, un rectángulo con borde discontinuo para crear uno nuevo. Arriba, los botones de exportar todo e importar.
- **Qué se puede hacer:** abrir un tablero; con el botón "⋯" de cada uno, renombrar, cambiar el color, duplicar o borrar. Al crear un tablero se puede empezar vacío o con tres listas de ejemplo ("Pendiente", "En marcha", "Terminado").

### Tablero

- **Qué se ve:**
  - **Barra superior:** volver al inicio, nombre del tablero (se edita con un clic), buscador, botón de etiquetas para filtrar y el contador "Mostrando N de M tarjetas" cuando hay filtro activo, con un botón para quitarlo. Botón "⋯" con exportar este tablero.
  - **Zona de listas:** sobre el color del tablero, las listas en columnas de 300 px con desplazamiento horizontal. Cada lista tiene su nombre (editable con un clic), el número de tarjetas, un botón "⋯" (borrar la lista con sus tarjetas, con confirmación) y al pie un botón para crear tarjeta. Tras la última lista, un hueco para crear otra.
  - **Tarjeta (cara visible):** puntos de color con sus etiquetas, el título y una fila de indicadores: fecha límite, progreso de la checklist ("2/5") y un icono si tiene descripción.
- **Qué se puede hacer:** al pulsar el botón de nueva tarjeta aparece un cuadro de texto: Intro la crea y deja el cuadro listo para otra; Esc cancela. Clic en una tarjeta abre su detalle. Arrastrar tarjetas y listas para reordenar.
- **Colores de la fecha:** vencida y sin cumplir en rojo, vence hoy o mañana en ámbar, cumplida en verde; si no, gris.

### Detalle de tarjeta

- **Qué se ve:** una ventana centrada (pantalla completa en el móvil) con el título editable y "en la lista X" debajo. Columna principal: descripción (al pulsar se edita; fuera de edición, las direcciones web se ven como enlaces), checklist con barra de progreso, sus elementos con casilla y un campo para añadir más. Columna lateral: etiquetas, fecha límite, mover a otra lista, duplicar y borrar la tarjeta.
- **Etiquetas:** 6 colores fijos por tablero. A cada color se le puede poner un nombre (por ejemplo, rojo = "Urgente"), que se ve al pasar el puntero en la tarjeta y en el filtro.
- **Qué se puede hacer:** los cambios se guardan al momento; Esc o clic fuera cierra la ventana.

## 5. Flujos paso a paso

### Seguir un pedido de principio a fin

1. La persona crea el tablero "Pedidos de la tienda" con las listas "Nuevo", "Preparando", "Enviado" y "Entregado".
2. En "Nuevo", crea la tarjeta "Pedido 1042 · Lucía". La abre, escribe la dirección en la descripción, pone la etiqueta roja "Urgente" y la fecha de mañana.
3. Añade la checklist: "Cobrar", "Empaquetar", "Imprimir etiqueta". Marca "Cobrar": la barra se llena un tercio y la tarjeta muestra "1/3".
4. Arrastra la tarjeta a "Preparando". Al día siguiente la fecha sale en ámbar en la cara de la tarjeta.
5. Al terminar, la arrastra a "Enviado" y marca la fecha como cumplida: se pone en verde.

### Encontrar lo urgente

1. Pulsa el filtro de etiquetas y marca "Urgente".
2. Solo quedan las tarjetas rojas en todas las listas y el contador dice cuántas son.
3. Escribe "Lucía" en el buscador: se combinan los dos filtros. Quitar el filtro devuelve todo.

### Copia de seguridad

1. En el inicio pulsa exportar todo: se descarga `columnas-AAAA-MM-DD.json`.
2. En otro ordenador pulsa importar y elige el archivo. Los tableros se añaden como nuevos; si alguno ya existe, la app pregunta si sustituirlo o guardar una copia.
3. Si el archivo no es válido, muestra un aviso y no cambia nada.

## 6. Datos

- **Qué guarda:** los tableros (nombre, color, nombres de las etiquetas), sus listas en orden y las tarjetas en orden (título, descripción, etiquetas, fecha límite y si está cumplida, elementos de la checklist, fechas de creación y último cambio).
- **Dónde:** en el navegador (`localStorage`), guardando tras cada cambio. El archivo de exportación lleva un número de versión del formato.
- **Datos personales:** los que la persona escriba en las tarjetas. Se quedan en este navegador; la app recomienda exportar una copia de vez en cuando.

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- Filtrar por varias etiquetas muestra las tarjetas que tengan **alguna** de ellas.
- "Mover a" permite elegir lista **y posición**. Las listas también se pueden mover a izquierda o derecha desde su menú, para móvil y teclado.
- Los nombres de las etiquetas se ponen desde el detalle de una tarjeta ("Poner nombre a las etiquetas").
- Cuidado con que cerrar un cuadro de texto o un menú al hacer clic fuera no "se coma" el clic siguiente: es el fallo más habitual de esta receta.
- Al exportar un solo tablero, el archivo se llama `<nombre-app>-<tablero>-AAAA-MM-DD.json`.

## 7. Para más adelante (fuera de esta versión)

- Compartir un tablero con el equipo y ver los cambios al momento (Supabase con inicio de sesión y Realtime).
- Asignar personas, comentarios y adjuntos en las tarjetas.
- Avisos por email cuando se acerca una fecha (n8n + Resend).
- Vista calendario de las fechas límite y archivo de tarjetas terminadas.
- Plantillas de tablero para casos típicos: pedidos, contenidos de redes, contratación.

## 8. Identidad propia

- **Nombre:** Columnas.
- **Colores y estilo:** cálido y ordenado, con esquinas redondeadas y sombras suaves. Fondo de la app arena `#F1ECE2`, listas `#F8F5EF`, tarjetas blancas `#FFFFFF`, texto `#2B2A27`, acento verde azulado `#1F7A74` para botones y foco. Colores de fondo para los tableros: verde azulado `#1F7A74`, teja `#B5553C`, oliva `#6B7A3A`, ciruela `#6E4A6B`, pizarra `#3C4A5C` y arena oscura `#A89068`. Etiquetas: verde `#4CAF7A`, amarillo `#E9C46A`, naranja `#F4A261`, rojo `#E76F51`, lila `#9B7BD4` y azul `#4A90C2`.
- **Icono o logo:** tres columnas de distinta altura, como un pequeño gráfico de barras redondeado.
- **Idioma de la interfaz:** español, con fechas en formato corto español ("14 oct").

## 9. Checklist de sala limpia

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
