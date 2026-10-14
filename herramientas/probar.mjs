// Sirve una app en http://localhost:3000 para probarla en el navegador.
//
// Uso:  npm run probar -- <nombre-del-clon>
//       npm run probar -- ejemplos/mini-estudio/app      (cualquier carpeta con index.html)
//       npm run demo -- <receta>                         (la demo de una receta)

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { CLONES_DIR, KIT_ROOT, fail, openWithSystem, say } from "./comun.mjs";

const FIRST_PORT = 3000;
const LAST_PORT = 3010;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function listClones() {
  if (!fs.existsSync(CLONES_DIR)) return [];
  return fs.readdirSync(CLONES_DIR).filter((name) => fs.existsSync(path.join(CLONES_DIR, name, "app", "index.html")));
}

// `npm run demo -- <receta>` sirve la demo ya construida de una receta.
function resolveDemo(recipe) {
  const demos = fs.readdirSync(path.join(KIT_ROOT, "recetas")).filter((name) =>
    fs.existsSync(path.join(KIT_ROOT, "recetas", name, "demo", "index.html")),
  );
  if (recipe === "estudio-grabacion") return path.join(KIT_ROOT, "ejemplos", "mini-estudio", "app");
  if (!recipe || !demos.includes(recipe)) {
    fail(`Dime qué demo quieres ver: npm run demo -- <receta>\n   Demos: ${[...demos, "estudio-grabacion"].sort().join(", ")}`);
  }
  return path.join(KIT_ROOT, "recetas", recipe, "demo");
}

function resolveRoot(arg) {
  if (!arg) {
    const clones = listClones();
    fail(
      "Dime qué app quieres probar: npm run probar -- <nombre-del-clon>\n" +
        (clones.length ? `   Clones listos: ${clones.join(", ")}` : "   Todavía no tienes clones con app/index.html."),
    );
  }
  const candidates = [path.join(CLONES_DIR, arg, "app"), path.resolve(arg), path.resolve(KIT_ROOT, arg)];
  const root = candidates.find((dir) => fs.existsSync(path.join(dir, "index.html")));
  if (!root) fail(`No encuentro un index.html para «${arg}». Busqué en:\n   ${candidates.join("\n   ")}`);
  return root;
}

function createServer(root) {
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400).end("Petición no válida");
      return;
    }
    let file = path.join(root, pathname);
    // Nunca servir nada fuera de la carpeta de la app.
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end("Prohibido");
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) {
      // Los navegadores piden iconos por su cuenta: no son errores de la app.
      if (!/^\/(favicon\.ico|apple-touch-icon.*\.png)$/.test(pathname)) say(`   ⚠️  404: ${pathname} (el archivo no existe)`);
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end(`No existe: ${pathname}`);
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  });
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(port));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const root = args[0] === "--demo" ? resolveDemo(args[1]) : resolveRoot(args[0]);
  const server = createServer(root);
  let port = FIRST_PORT;
  for (; port <= LAST_PORT; port++) {
    try {
      await listen(server, port);
      break;
    } catch (err) {
      if (err.code !== "EADDRINUSE") throw err;
    }
  }
  if (port > LAST_PORT) fail(`Los puertos ${FIRST_PORT}–${LAST_PORT} están ocupados. Cierra otros servidores y vuelve a probar.`);

  const url = `http://localhost:${port}`;
  say(`\n🚀 Tu app está en ${url}`);
  say(`   Carpeta: ${path.relative(process.cwd(), root) || "."}`);
  say("   Guarda cambios y recarga la página (Cmd+R o Ctrl+R) para verlos.");
  say("   Para parar el servidor: Ctrl+C\n");
  openWithSystem(url);
}

main();
