# ClonaKit (Edición Antigravity)

**Crea tu propia versión de las herramientas que usas en tu negocio. De forma legal y sin saber programar.**

Adaptado para su uso directo con **Google Antigravity**.

ClonaKit convierte a **Antigravity** en tu tutor: te acompaña desde "me gusta cómo funciona esta app" hasta tu propia versión publicada en internet con tu marca. Por debajo usa [REA](https://github.com/morluto/rea), una herramienta que averigua cómo está construida una app sin ver su código.

## Empieza en 4 pasos

Necesitas un Mac o un PC con Windows, [Node.js](https://nodejs.org) (versión LTS), [Git](https://git-scm.com) y **Antigravity** (CLI o IDE). Google Chrome es opcional (solo para investigar webs). Lo demás es gratis, incluidos GitHub y Vercel para publicar.

1. **Abre esta carpeta en Antigravity** como tu espacio de trabajo (workspace).
2. **Abre una terminal en la carpeta** `ClonaKit` e instala las dependencias:
   ```bash
   npm install
   ```
3. **Verifica tu entorno:**
   ```bash
   npm run comprobar
   ```
4. **Pide a Antigravity empezar** escribiendo **`/empezar`** en el chat.

El tutor te abrirá una formación exprés de 5 minutos, comprobará tu ordenador y te propondrá tu primer clon. El kit incluye configuración MCP para `rea` en `mcp_config.json` para inspección avanzada.

¿Te falta Node.js o Git? La lección [01 · Prepara tu ordenador](formacion/01-preparar-tu-ordenador.md) te guía paso a paso.

## Recetas listas para clonar

Fichas ya escritas para recrear las herramientas que más usan los negocios. Eliges una, le pones tu nombre y tus colores, y se construye.

| Tu versión | Inspirada en |
| --- | --- |
| **Trazo**: pizarra de diagramas de flujo | Excalidraw |
| **Corrillo**: chat de equipo | Slack |
| **Embudo**: email marketing y automatizaciones | ActiveCampaign |
| **Celda**: base de datos visual | Airtable |
| **MiniEstudio**: estudio de grabación (ya construida) | OBS Studio |
| **Taller**: editor de código con misiones para IA | Antigravity |
| **Columnas**: tablero de tareas | Trello |
| **MiEnlace**: tu página de enlaces para la bio | Linktree |
| **Pregunta**: formularios que conectan con n8n | Typeform |

Todas traen una **demo ya construida** para probarla al momento (`npm run demo -- enlaces-bio`). Detalles, dificultad y qué necesita cada una en [recetas/](recetas/README.md). ¿Tu app no está? Con `/clonar` puedes investigar y recrear **cualquier otra**, también las que exigen iniciar sesión (con el modo capturas).

## Cómo funciona

```
 1. Elegir       2. Investigar       3. Ficha            4. Construir        5. Publicar
 receta o app →  REA o tus       →  qué hace, con   →  un ayudante la  →  GitHub + Vercel:
                 capturas            tus palabras       programa desde      tu app en
                                                        cero con la ficha   internet
```

"Clonar" aquí significa **crear tu propia versión**, no copiar. Las ideas y las funciones no tienen dueño; el código, los textos, las imágenes y las marcas sí. Por eso ClonaKit sigue el método de **sala limpia**: quien escribe el código solo ve tu ficha, nunca la app original. Lo explican las diapositivas y [formacion/02-lo-legal.md](formacion/02-lo-legal.md).

## Comandos y Skills

| En Antigravity | Qué hace |
| --- | --- |
| `/empezar` | Formación exprés, comprobar tu ordenador y tu primer contacto con un clon |
| `/clonar` | De una receta o cualquier app a tu propia versión funcionando con subagentes |
| `/desplegar` | Publicar tu app en internet (Git, GitHub y Vercel) y actualizarla |

| En la terminal | Qué hace |
| --- | --- |
| `npm run diapositivas` | Abre la formación exprés |
| `npm run comprobar` | Revisa que tu ordenador tiene todo lo necesario |
| `npm run investigar -- "<app o URL>" --nombre <clon>` | Analiza una app y escribe un informe fácil de leer |
| `npm run capturas -- <clon>` | Prepara la carpeta para el modo capturas |
| `npm run probar -- <clon>` | Abre tu app en http://localhost:3000 |
| `npm run demo -- <receta>` | Abre la demo ya construida de una receta |

## Qué hay en la carpeta

```
ClonaKit/
├── formacion/       diapositivas + 9 lecciones paso a paso + glosario
├── recetas/         fichas listas para clonar, cada una con su demo
├── ejemplos/        MiniEstudio, un clon completo de principio a fin
├── plantillas/      ficha, registro legal y proyecto web base
├── herramientas/    investigar, capturas, probar y comprobar
├── clones/          aquí se crean tus clones
├── GEMINI.md        instrucciones y comportamiento del tutor para Antigravity
├── AGENTS.md        especificación estándar para agentes de IA
├── mcp_config.json  configuración MCP local para la herramienta REA
└── .agent/skills/   skills nativos del tutor (/empezar, /clonar, /desplegar)
```

## Sigue aprendiendo

¿Dudas, ideas o quieres enseñar tu clon? Abre una issue en el repositorio o compártelo con la comunidad.

## Uso responsable

ClonaKit es para aprender y crear cosas propias. No lo uses para copiar código o recursos ajenos, saltarte pagos o protecciones, hacerte pasar por otra app ni analizar software que no tengas derecho a usar. Lee el [AVISO-LEGAL.md](AVISO-LEGAL.md). Los nombres de las apps que inspiran las recetas son marcas de sus titulares y solo se usan para indicar la inspiración.

## Créditos y licencia

- [REA](https://github.com/morluto/rea), de morluto y sus colaboradores (licencia MIT), hace la investigación. ClonaKit lo usa como dependencia sin modificarlo.
- ClonaKit, con licencia [MIT](LICENSE).
