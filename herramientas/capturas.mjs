// Prepara la carpeta donde guardar capturas de pantalla de una app (modo capturas)
// y la abre para que arrastres las imágenes dentro.
//
// Uso:  npm run capturas -- <nombre-del-clon>

import fs from "node:fs";
import path from "node:path";
import { CLONES_DIR, fail, openWithSystem, say, slugify } from "./comun.mjs";

const name = process.argv[2];
if (!name) fail("Dime para qué clon son las capturas: npm run capturas -- <nombre-del-clon>");

const dir = path.join(CLONES_DIR, slugify(name), "investigacion", "capturas");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  path.join(dir, "LEEME.txt"),
  "Capturas de la app original, solo para tu investigación.\n" +
    "Nunca se publican ni las ve quien construye tu app (sala limpia).\n",
);

const shortcut =
  process.platform === "darwin"
    ? "Cmd+Mayús+4 y arrastra para elegir una zona (se guarda en el Escritorio)"
    : process.platform === "win32"
      ? "Windows+Mayús+S y elige una zona (luego pégala en Paint y guárdala)"
      : "la herramienta de capturas de tu sistema";

openWithSystem(dir);
say(`\n📸 Carpeta de capturas lista: ${path.relative(process.cwd(), dir)}`);
say("   Se ha abierto en tu explorador de archivos.");
say(`   1. Abre la app original con TU cuenta y haz capturas de cada pantalla y función que te guste (${shortcut}).`);
say("   2. Arrastra las imágenes a esa carpeta.");
say("   3. Vuelve a Antigravity y dile «ya están las capturas».");
say("   Evita capturar datos personales de otras personas (nombres, emails, mensajes de clientes).\n");
