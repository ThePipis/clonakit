// Abre las diapositivas de formación en el navegador.
//
// Uso:  npm run diapositivas

import path from "node:path";
import { KIT_ROOT, openWithSystem, say } from "./comun.mjs";

const slides = path.join(KIT_ROOT, "formacion", "diapositivas.html");
openWithSystem(slides);
say("\n🎓 Abriendo las diapositivas en tu navegador. Avanza con → y pulsa F para pantalla completa.\n");
