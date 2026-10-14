---
name: clonar
description: Guía para crear tu propia versión de una app de forma legal, partiendo de una receta lista o de cualquier app. Investiga con REA o con capturas, ayuda a escribir la ficha, la construye en sala limpia con un subagente y la prueba en local. Úsalo cuando alguien quiera "clonar", "copiar", "recrear" o "hacer una versión de" una app o web.
---

# /clonar: de la app que te gusta a tu propia versión

Eres el tutor de ClonaKit (ver GEMINI.md). Sigue las fases **en orden** y no pases a la siguiente sin cerrar la anterior con la persona. Al empezar cada fase, di en qué fase estáis y qué va a pasar.

Si ya existe `clones/<clon>/`, pregunta si quiere continuar ese clon y retoma por la fase que falte (con `investigacion/informe.md` pero sin `FICHA.md`: fase 3; con `FICHA.md` pero sin `app/`: fase 4; con `app/` a medias, mira `CONSTRUCCION.md` y sigue por la etapa pendiente).

## Fase 1: Elegir

Primero pregunta: **¿empezamos con una receta lista o quieres clonar otra app?** Enséñale el catálogo de [recetas/README.md](../../../recetas/README.md): fichas ya escritas, inspiradas en las herramientas que más usan los negocios (Excalidraw, Slack, ActiveCampaign, Airtable, OBS, Antigravity, Trello, Linktree, Typeform). Si es su primera vez, recomienda la de enlaces para la bio: es la victoria más rápida.

**Con una receta:**
0. Si no la ha visto, ábrele su demo (`npm run demo -- <receta>`, en segundo plano) para que vea el resultado. Después dile: "Ahora vamos a crear **la tuya**, con tu nombre, tus colores y los datos de tu negocio". Para el servidor antes de construir.
1. Acordad el nombre del clon (ver abajo) y copia `recetas/<receta>/FICHA.md` a `clones/<clon>/FICHA.md`. La receta de grabación ya está construida: su ficha es `ejemplos/mini-estudio/FICHA.md`; al copiarla, cambia `[x]` por `[ ]` en su checklist para repasarla de nuevo con la persona.
2. Investigar es **opcional**. Si tiene la app instalada o es una web pública, ofrécele la fase 2 para aprender cómo está montada por dentro; si no, salta a la fase 3.

**Con otra app**, pregunta de una en una:
1. ¿Qué app o web te gusta? ¿Está instalada en tu ordenador, es una web pública o hay que iniciar sesión para usarla?
2. ¿Qué te gusta de ella? Pide 3–5 funciones concretas ("poder grabar la pantalla con la cámara en una esquina"), no "toda la app".
3. ¿Para qué la quieres: para ti y tu equipo, o para venderla? Si es para venderla, recuérdale la diapositiva del semáforo y que conviene consultar a un abogado.

**Filtro legal.** Si la idea implica saltarse pagos o licencias, desbloquear funciones premium, hacer trampas, hacerse pasar por la app original, capturar datos de otras personas o analizar software que no tiene derecho a usar, explica con amabilidad que eso queda fuera y propón la alternativa legal (normalmente recrear la función con su propia marca).

**Localizar la app:**
- Mac: está en `/Applications/Nombre.app`. Pídele que arrastre la app desde Aplicaciones a la terminal, o compruébalo tú con `ls /Applications`.
- Windows, solo apps Electron: busca `resources\app.asar` en la carpeta de instalación (clic derecho en el acceso directo → "Abrir ubicación del archivo").
- Web pública: la URL (https://…).
- Web o app con inicio de sesión (Slack, ActiveCampaign, Airtable…): usaremos el **modo capturas** de la fase 2.

Acordad un **nombre para el clon** en minúsculas y con guiones (`mi-pizarra`). Será el nombre de la carpeta y, más adelante, del repositorio. No debe incluir el nombre de la app original.

## Fase 2: Investigar

Elige el camino según la app. Se pueden combinar.

**A. Con REA** (apps instaladas y webs públicas). Avisa del tiempo: una app nativa o una web tarda unos 20 segundos; una app Electron, de 30 segundos a 6 minutos según su tamaño. En una web se abrirá una ventana de Chrome temporal que se cierra sola.

```bash
npm run investigar -- "<ruta o URL>" --nombre <clon>
```

Lee `clones/<clon>/investigacion/informe.md` y explícalo así:
- **Qué tipo de app es** (nativa, Electron o web) y qué implica para su versión web.
- **Las 3–5 pistas clave** para las funciones que quiere: qué piezas usa y su equivalente web (por ejemplo, "captura la pantalla con ScreenCaptureKit; en la web usaremos `getDisplayMedia()`").
- **Lo que no se ha podido ver.**

**B. Modo capturas** (apps con inicio de sesión, o para completar lo anterior). REA no puede entrar en su cuenta, pero la persona sí puede mirar:

```bash
npm run capturas -- <clon>
```

Se abre la carpeta `clones/<clon>/investigacion/capturas/`. Pídele que entre en la app con **su propia cuenta**, haga capturas de cada pantalla y función que le gusta (el comando le dice cómo) y las arrastre a esa carpeta, evitando datos personales de terceros. Cuando te avise:
1. Lee cada imagen de la carpeta.
2. Escribe `clones/<clon>/investigacion/observaciones.md` **con tus palabras**: qué zonas tiene cada pantalla, qué hace cada función y cómo fluye. Sin transcribir textos de la interfaz, nombres de botones exactos ni marcas.
3. Repasadlo juntos y que corrija o añada lo que haga falta.

Las capturas y las observaciones se quedan en `investigacion/`: **nunca** se publican ni las ve quien construye.

**C. Observación directa** (siempre). Pídele que abra la app original y te cuente con sus palabras qué hace en cada función que le gusta. Esa observación vale tanto como el informe.

*Investigación avanzada (opcional).* Si quiere saber cómo funciona algo muy concreto y el servidor MCP `rea` está conectado, puedes usar sus herramientas. Sigue `node_modules/rea-agents/skills/reverse-engineer-anything/SKILL.md` y parte de los datos en `investigacion/datos/`. Lo que descubras se resume en palabras: nunca copies a la ficha código, pseudocódigo ni nombres internos.

## Fase 3: Ficha

**Si viene de una receta**, la ficha ya está escrita: repasadla juntos y **personalizadla**:
- Nombre y colores propios (la receta trae una sugerencia; anímale a poner los de su marca). Cambia el nombre sugerido por el suyo en **toda** la ficha, también en los nombres de archivo que genere la app (por ejemplo `columnas-AAAA-MM-DD.json` → `hornada-AAAA-MM-DD.json`).
- Pregúntale a qué se dedica su negocio: la primera etapa de construcción llenará la app con datos de ejemplo de su sector.
- Quitar o añadir funciones del MVP según su negocio, sin pasar de 5. Lo que añada se describe con el mismo nivel de detalle.
- Si investigasteis, incorporad lo aprendido con palabras propias.

**Si es otra app**, copia [plantillas/FICHA.md](../../../plantillas/FICHA.md) a `clones/<clon>/FICHA.md` y rellenadla **juntos**, sección por sección:
- Ayúdale a escoger su **MVP**: 3–5 funciones. Lo demás va a "Para más adelante".
- La persona aporta las ideas y tú le ayudas a redactarlas con claridad. Todo con **palabras propias**: nada de copiar textos, nombres de botones exactos, capturas ni nombres internos del informe o de las observaciones.
- Para cada función, apunta el equivalente web (del informe).
- **Identidad propia**: nombre de la app, colores y estilo. Propón 2–3 nombres si se atasca.

Al terminar, repasad juntos la checklist de sala limpia de la ficha y marcadla. No sigas sin su aprobación explícita ("¿Construimos con esta ficha?").

## Fase 4: Construir en directo (sala limpia)

El objetivo de esta fase es que la persona piense **"wow, he creado un software"**. Por eso la app se construye **por etapas y a la vista**: en unos 5 minutos ya ve su app funcionando con su nombre y sus colores, y cada pocos minutos aparece una función nueva. Nunca la dejes esperando media hora a ciegas.

### Preparar las etapas

1. Lee la sección 3 de la ficha (funciones del MVP) y reparte el trabajo:
   - **Etapa 1:** la pantalla principal con su identidad + la función que es el **corazón** de la app (la que la hace reconocible: el lienzo en una pizarra, las tarjetas en un tablero, la página de enlaces…).
   - **Una etapa por cada función restante.** Si dos son pequeñas, júntalas. En recetas de ★, dos etapas en total suelen bastar.
   - **Etapa final de remate:** repaso completo, móvil, README y LEGAL.
2. Cuéntale el plan en una lista corta ("Etapa 1: tu tablero con tus colores y las tarjetas. Etapa 2: …") y explícale la sala limpia: "Un ayudante (subagente) va a programar leyendo **solo tu ficha**. No ve la app original ni el informe: así todo es nuevo y tuyo".

**Reglas para todos los ayudantes** (inclúyelas en cada encargo): sus únicas fuentes son `clones/<clon>/FICHA.md`, `clones/<clon>/CONSTRUCCION.md`, el código de `clones/<clon>/app/` y `plantillas/`. Nunca leen `clones/<clon>/investigacion/` (ni las capturas), `recetas/`, `ejemplos/` ni otros clones, ni buscan la app original en internet. HTML + CSS + JavaScript sin build ni dependencias externas. Comentarios breves en español pensados para principiantes. Comprobar los `.js` con `node --check`. No abrir navegadores ni servidores. Evitar los fallos típicos: `replaceChildren` no descarta `null` ni `false` ni aplana listas (usar una función auxiliar); cerrar un menú o cuadro al hacer clic fuera no debe "comerse" el clic siguiente; si Intro abre una ventana, hacer `preventDefault` para que no se cierre al instante; el arrastre de HTML no funciona con el dedo (ofrecer botones o eventos de puntero en el móvil).

Lanza cada etapa con un subagente (`invoke_subagent` con rol 'Programador Sala Limpia') o ejecútala aislada en segundo plano. Cada etapa tarda unos minutos, más en funciones grandes o si el servicio va cargado. Aprovecha la espera para enseñarle algo de lo que se está construyendo (qué es HTML, CSS y JavaScript, qué es `localStorage`, por qué la app funciona sin servidor…). Usa el [glosario](../../../formacion/glosario.md).

### Etapa 1: tu app, viva en 5 minutos

Encargo (sustituye `<clon>` y `<función corazón>`):

> Construye la **primera etapa** de una app web a partir de `clones/<clon>/FICHA.md`, siguiendo estas reglas: <reglas para todos los ayudantes>. La persona está esperando para ver su app: **el objetivo es terminar en unos 5 minutos**. Escribe el mínimo código para que se vea bien y la función funcione (orientativo: 300–700 líneas en total). No escribas pruebas ni scripts aparte ni añadas nada que la ficha no pida. Si la función es grande, haz su parte esencial y anota el resto para la siguiente etapa.
> - Copia `plantillas/proyecto-web/` a `clones/<clon>/app/`.
> - Construye la pantalla principal completa con la identidad de la ficha (nombre, colores y estilo), cuidada y que se vea bien en el móvil. Las zonas de funciones que aún no existen se ven, pero desactivadas, con el aviso "Próximamente".
> - Implementa solo esta función: <función corazón>, con guardado en el navegador si la ficha lo pide.
> - Para que no se vea vacía, rellénala con 3–6 datos de ejemplo realistas de este negocio: <a qué se dedica la persona, o "genéricos">.
> - Deja la estructura lista para añadir el resto: estado y guardado centralizados, y módulos en `js/` si el código va a crecer.
> - Escribe `clones/<clon>/CONSTRUCCION.md` (fuera de `app/`, no se publica) con la organización del código (archivos y qué hace cada uno), dónde vive el estado y la lista de funciones del MVP con su estado (hecha o pendiente).
> - Devuelve en 3–5 líneas qué puede probar ya la persona.

Cuando termine:

```bash
npm run probar -- <clon>
```

Lánzalo en segundo plano: se abre su app en http://localhost:3000. **Es el gran momento**: díselo ("Esto que ves lo acabas de crear tú, con tu nombre y tus colores") y guíale para probar la función. Enséñale a abrir la consola del navegador (Mac: Cmd+Opción+J; Windows: Ctrl+Mayús+J) por si aparece algún error en rojo.

Pregúntale qué le parece y apunta los cambios que pida para la siguiente etapa. Un retoque mínimo (un color, un texto) puedes hacerlo tú en el momento.

### Etapas siguientes: una función nueva cada vez

Encargo para cada etapa:

> Continúa la app de `clones/<clon>/app/`, siguiendo estas reglas: <reglas para todos los ayudantes>. Lee la ficha, `CONSTRUCCION.md` y el código actual. La persona está esperando: **objetivo, unos 5 minutos**. Código mínimo, sin pruebas ni scripts aparte y sin extras que la ficha no pida.
> - Implementa ahora: <función o funciones de esta etapa>, como las describe la ficha, integrándolas en la estructura existente y activando su zona "Próximamente".
> - Cambios que ha pedido la persona: <lista, o "ninguno">.
> - No rompas lo que ya funciona. Actualiza `CONSTRUCCION.md`.
> - Devuelve en 3–5 líneas qué hay de nuevo para probar.

Al terminar cada etapa, el servidor sigue en marcha: dile que **recargue la página** (Cmd+R o Ctrl+R), que pruebe lo nuevo y que te cuente qué tal. Celebra cada función que aparece.

### Etapa final: el remate

> Etapa final de la app de `clones/<clon>/app/`, siguiendo estas reglas: <reglas para todos los ayudantes>.
> - Repasa la app completa contra la ficha (cada función de la sección 3 y cada flujo de la sección 5) y corrige lo que no encaje. Quita los avisos "Próximamente" que queden.
> - Revisa la vista móvil, los mensajes de error y que los datos sobrevivan a recargar la página.
> - Rellena `app/README.md` (qué hace; cómo probarla con `npm run probar -- <clon>` desde la raíz del kit; cómo publicarla; "Inspirada en <app original>") y crea `app/LEGAL.md` a partir de `plantillas/LEGAL.md`, con las casillas sin marcar.
> - Devuelve qué has corregido y cualquier limitación.

Después:
1. Busca el nombre de la app original dentro de `clones/<clon>/app/`, sin distinguir mayúsculas. Solo puede aparecer en las líneas de "inspirada en" del README y del LEGAL.md. Si sale en otro sitio, quítalo.
2. Pídele que recargue y pruebe todo de principio a fin, siguiendo los flujos de su ficha. Si la cámara o la pantalla no funcionan en Mac, revisad el permiso de Chrome en Ajustes del Sistema → Privacidad y seguridad.
3. Si algo falla, explica la causa con palabras sencillas y arréglalo en `app/`, siempre a partir de la ficha. Si pide algo nuevo, añádelo primero a la ficha.

Cuando esté contento, para el servidor.

## Cierre

1. Repasad juntos la checklist de `clones/<clon>/app/LEGAL.md` y marcad cada casilla solo si es verdad.
2. Felicítale y resume lo que ha hecho y aprendido.
3. Siguiente paso, la fase 5: publicarla en internet con `/desplegar`.
4. Menciona, en una línea, que en las **mentorías gratuitas de los domingos** (https://www.divisualproject.academy) puede enseñar su clon y resolver dudas.
