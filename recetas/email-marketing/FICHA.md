# Ficha: Embudo

> Inspirada en: ActiveCampaign (solo como referencia de funciones; no se copia nada)
> Receta de ClonaKit · Personaliza el nombre, los colores y las funciones antes de construir

Esta ficha es el **encargo** para construir tu app. Quien la programe solo verá este documento, así que todo lo que importe tiene que estar aquí, **escrito con tus palabras**.

## 1. En una frase

Un taller de email marketing en el navegador para ordenar tus contactos, agruparlos en segmentos, diseñar emails por bloques y dibujar tus automatizaciones, listo para conectarlo más adelante a un servicio de envío.

**Lo que esta versión no hace (y la app lo dice en su portada):** no envía emails ni mide aperturas, clics o ventas. Tampoco muestra números de ejemplo: solo cuenta lo que existe de verdad (contactos, etiquetas, contactos de un segmento). El envío real se añade en la sección 7.

## 2. Para quién y para qué

Para negocios pequeños que quieren preparar su email marketing (limpiar su lista, decidir a quién escribir, maquetar sus emails y planificar sus secuencias de bienvenida o de venta) sin depender todavía de una herramienta de pago por contactos.

## 3. Funciones de la primera versión (MVP)

| # | Función | Qué hace, con tus palabras | Cómo se hará en la web |
| --- | --- | --- | --- |
| 1 | Contactos | Importar un CSV eligiendo qué columna va a cada campo; añadir y editar contactos a mano; poner y quitar etiquetas; crear campos personalizados (texto, número o fecha). Tabla con búsqueda, selección múltiple para etiquetar o borrar en bloque y exportación a CSV. | `<input type="file">` + `File.text()`, lector de CSV propio (comillas, coma o punto y coma), IndexedDB, `Blob` + descarga |
| 2 | Segmentos | Crear grupos guardados con filtros: tiene o no tiene una etiqueta; un campo es igual, contiene, es mayor o menor; una fecha es anterior o posterior. Se combinan con "todas las condiciones" o "alguna". El número de contactos que cumplen se actualiza mientras se edita. | Filtrado en memoria con JavaScript |
| 3 | Editor de emails | Montar un email apilando bloques: título, texto, imagen (por dirección web), botón, separador, espacio y pie legal. Reordenar, duplicar y borrar bloques; editar sus propiedades en un panel. Asunto, texto de vista previa y campos variables como `{{nombre}}`. Vista previa de escritorio y de móvil, y exportación del HTML. | `contenteditable` para el texto, `<iframe srcdoc>` a 600 px y a 375 px, HTML con tablas y estilos en línea, `Blob` + descarga, `navigator.clipboard.writeText()` |
| 4 | Automatizaciones | Dibujar una secuencia como diagrama vertical: un disparador arriba y debajo pasos de espera, enviar email, condición (con dos ramas, sí y no), poner o quitar etiqueta y fin. Se insertan pasos con botones "+" entre cajas. Un modo "probar con un contacto" recorre el diagrama y marca qué camino seguiría, sin enviar nada. | Cajas en HTML con conectores en SVG, estado en JavaScript, IndexedDB, exportación a `.json` |

## 4. Pantallas

### Estructura general

- **Barra lateral fija:** Contactos, Segmentos, Emails, Automatizaciones y Ajustes. Arriba, el nombre de la app; abajo, un recordatorio discreto: "Tus datos están solo en este navegador".

### Contactos

- **Qué se ve:** botones para importar, añadir y exportar; un buscador (por nombre, email o etiqueta); una tabla con casilla de selección, email, nombre, etiquetas (como pastillas de color), fecha de alta y las columnas de campos personalizados que la persona elija mostrar. Encima, el total real de contactos.
- **Qué se puede hacer:** pulsar una fila abre una ficha lateral para editar datos, etiquetas y campos, y para ver en qué segmentos está. Con varias filas marcadas aparece una barra para añadir o quitar una etiqueta, o borrarlas (con confirmación).
- **Asistente de importación:** 1) elegir el archivo; 2) ver las 5 primeras filas y asignar cada columna a un campo existente, a un campo nuevo o a "no importar" (la columna email es obligatoria); 3) elegir etiquetas para todos los importados; 4) resumen: cuántos nuevos, cuántos actualizados (mismo email) y cuántas filas descartadas por email no válido, con la lista de estas últimas.

### Segmentos

- **Qué se ve:** la lista de segmentos con su número de contactos. Al abrir uno: el nombre, el interruptor "todas / alguna", las filas de condición (campo → operador → valor, con el operador adaptado al tipo de campo) y debajo los contactos que cumplen.

### Emails

- **Qué se ve:** una lista de emails guardados. El editor tiene tres zonas: a la izquierda, los tipos de bloque para añadir; en el centro, el email a 600 px de ancho; a la derecha, las propiedades del bloque elegido (texto, alineación, colores, dirección del enlace, tamaño de imagen). Arriba, asunto, texto de vista previa y los botones de escritorio/móvil y exportar.
- **Qué se puede hacer:** subir o bajar bloques arrastrando o con flechas, insertar un campo variable desde un desplegable y elegir un contacto real para ver la vista previa con sus datos. El pie legal es obligatorio: si falta, la exportación avisa.

### Automatizaciones

- **Qué se ve:** el diagrama de arriba abajo, con cajas unidas por líneas. La condición abre dos columnas, "Sí" y "No", que siguen hacia abajo. Al pulsar una caja se edita en un panel lateral: el disparador (se añade una etiqueta, entra en un segmento, se crea un contacto), la espera (horas o días), el email que se envía, la condición (tiene etiqueta, valor de un campo, está en un segmento) o la etiqueta que se pone o se quita.
- **Qué se puede hacer:** insertar pasos con "+", borrar un paso (si es una condición, pregunta qué rama conservar), renombrar la automatización, marcarla como "borrador" o "lista para conectar", exportarla a `.json` y probarla con un contacto.

## 5. Flujos paso a paso

### Preparar una bienvenida para quien se apunta en una feria

1. La persona importa `feria.csv`, asigna las columnas y pone a todos la etiqueta "feria-2026". El resumen cuenta los contactos reales del archivo: cuántos son nuevos y cuántos se han descartado.
2. Crea el segmento "Feria con interés" (etiqueta "feria-2026" y campo "interés" contiene "cerámica"). Ve al momento cuántos contactos lo cumplen.
3. Diseña el email "Gracias por pasarte": título, texto con `{{nombre}}`, imagen, botón al catálogo y pie legal. Lo revisa en móvil.
4. Dibuja la automatización: disparador "se añade la etiqueta feria-2026" → esperar 1 día → enviar "Gracias por pasarte" → esperar 3 días → condición "tiene la etiqueta cliente" → No: enviar "Cupón de bienvenida"; Sí: fin.
5. La prueba con Marta: el diagrama ilumina su camino paso a paso y muestra "aquí esperaría 1 día" sin esperar de verdad.
6. Exporta el HTML de los emails y el `.json` de la automatización para montarlos después en su servicio de envío.

## 6. Datos

- **Qué guarda:** contactos (email, nombre, etiquetas, campos personalizados, fecha de alta y origen), definiciones de campos, segmentos (condiciones), emails (asunto, vista previa y lista de bloques) y automatizaciones (lista de pasos y ramas).
- **Dónde:** en el navegador con IndexedDB, porque una lista de miles de contactos no cabe bien en `localStorage`. En Ajustes: copia de seguridad completa en `.json`, restaurarla y borrarlo todo. También los datos del remitente para el pie legal (nombre del negocio, dirección postal y enlace de baja).
- **Datos personales:** sí, los emails y nombres de tus contactos. Se quedan en este navegador y no se envían a ningún sitio. Importa solo contactos que hayan aceptado recibir tus emails (RGPD). La app lo recuerda en el paso 1 del asistente de importación. Esto no es asesoría legal.

**Notas técnicas para quien programe** (aprendidas al construir y probar esta receta):

- El CSV exportado usa `;` como separador (lo que espera Excel en español), con BOM; al importar se aceptan `;` y `,`.
- Las variables se escriben sin acentos ni espacios: el campo "Interés" se usa como `{{interes}}`.
- Al insertar una condición a mitad de un diagrama, los pasos de debajo pasan a la rama "Sí". "Fin" solo puede ir al final de una rama.
- Cada email tiene un nombre interno, además de su asunto.
- La imagen "por dirección web" necesita que la imagen esté alojada en algún sitio (por ejemplo, en la propia web publicada).

## 7. Para más adelante (fuera de esta versión)

- **Envío real:** un flujo de n8n que lea tus contactos y emails exportados y los envíe con Resend o Brevo, desde un dominio propio verificado.
- **Ejecutar las automatizaciones** de verdad (esperas, condiciones) en n8n, partiendo del `.json` exportado.
- Métricas reales de aperturas y clics, que llegan desde el servicio de envío; solo entonces tendrá sentido un panel de resultados.
- Enlace de baja que funcione solo y formulario de alta con doble confirmación (puede hacerse con la receta de formularios + un webhook).
- Guardar los contactos en Supabase para usarlos desde varios dispositivos.

## 8. Identidad propia

- **Nombre:** Embudo.
- **Colores y estilo:** serio y cálido, como una papelería de calidad. Fondo crema `#FBF6EF`, texto `#2A2124`, barra lateral granate `#6B2737` con texto `#F6EDE6`, acento ámbar `#E3A23B` para botones principales y la caja seleccionada. En el diagrama, rama "Sí" en verde `#3E7C59` y rama "No" en teja `#B4493C`. Etiquetas en tonos suaves (`#F3D9C4`, `#D9E8D5`, `#D6E3EF`, `#EADCF0`, `#F6E7B0`).
- **Icono o logo:** un embudo sencillo formado por tres líneas horizontales cada vez más cortas.
- **Idioma de la interfaz:** español.

## 9. Checklist de sala limpia

- [ ] Las funciones están descritas con mis palabras; no hay textos copiados del original.
- [ ] No hay capturas, iconos, logos, sonidos ni imágenes del original en este documento.
- [ ] No hay código, pseudocódigo ni nombres internos sacados del informe de investigación.
- [ ] El nombre y la identidad visual son míos y no se confunden con la app original.
- [ ] Ninguna función se salta pagos, licencias, logins o protecciones del original.
