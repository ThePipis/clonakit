# Contexto Arquitectónico: ClonaKit (Edición Antigravity)

## Visión General
ClonaKit es un kit educativo y de herramientas asistido por IA para recrear aplicaciones web funcionales con metodología de "sala limpia" (clean-room design) sin programar. Utiliza REA (`rea-agents`) para ingeniería inversa funcional y entrega clones en HTML/CSS/JavaScript estático sin dependencias ni paso de build.

## Estructura Adaptada para Antigravity
- `GEMINI.md` / `AGENTS.md`: Instrucciones del tutor para agentes de IA en Antigravity.
- `.agent/skills/`: Skills nativos descubiertos por Antigravity (`/empezar`, `/clonar`, `/desplegar`).
- `mcp_config.json`: Conexión de herramientas MCP locales (`rea`).
- `herramientas/`: Scripts de CLI Node.js para auditoría, captura, inspección y servidor local.
- `recetas/`: Catálogo de 9 aplicaciones listas para clonar con demos integradas.
- `formacion/`: Lecciones paso a paso, glosario y diapositivas formativas.
