// Comprueba que el ordenador tiene todo lo necesario para usar ClonaKit.
//
// Uso:  npm run comprobar

import fs from "node:fs";
import os from "node:os";
import { REA_BIN, commandOutput, findChrome, reaVersion, say } from "./comun.mjs";

const PLATFORM = { darwin: "Mac", win32: "Windows", linux: "Linux" }[process.platform] ?? process.platform;

function nodeSupported(version) {
  const [major, minor] = version.split(".").map(Number);
  return (major === 22 && minor >= 19) || (major === 24 && minor >= 11) || major >= 26;
}

const checks = [];
const check = (required, ok, label, detail, fix) => checks.push({ required, ok, label, detail, fix });

const node = process.versions.node;
check(true, nodeSupported(node), "Node.js", `versión ${node}`, "Instala la versión LTS (24) desde https://nodejs.org y abre una terminal nueva.");

const npm = commandOutput("npm", ["--version"]);
check(true, Boolean(npm), "npm", npm ? `versión ${npm}` : "no encontrado", "Viene con Node.js: reinstala Node.js desde https://nodejs.org");

const git = commandOutput("git", ["--version"]);
check(
  true,
  Boolean(git),
  "Git",
  git ?? "no encontrado",
  process.platform === "darwin" ? "Ejecuta: xcode-select --install (o descárgalo de https://git-scm.com)" : "Descárgalo de https://git-scm.com",
);

const rea = fs.existsSync(REA_BIN) ? reaVersion() : null;
check(true, Boolean(rea), "REA (dependencia del kit)", rea ? `versión ${rea}` : "no instalado", "Ejecuta: npm install (dentro de la carpeta ClonaKit)");

const chrome = findChrome();
check(false, Boolean(chrome), "Google Chrome", chrome ? "instalado" : "no encontrado", "Solo hace falta para investigar webs: https://www.google.com/chrome/");

const gh = commandOutput("gh", ["--version"]);
check(false, Boolean(gh), "GitHub CLI (gh)", gh ? gh.split("\n")[0] : "no encontrado", "Facilita subir tu app a GitHub: https://cli.github.com");

say(`\n🧰 ClonaKit · comprobando tu ${PLATFORM} (${os.arch()})\n`);
for (const { required, ok, label, detail } of checks) {
  const icon = ok ? "✅" : required ? "❌" : "⚪️";
  say(`  ${icon} ${label}: ${detail}${!ok && !required ? " (opcional)" : ""}`);
}

const missing = checks.filter((c) => !c.ok);
if (missing.length) {
  say("\nCómo arreglarlo:");
  for (const { label, fix, required } of missing) say(`  · ${label}${required ? "" : " (opcional)"}: ${fix}`);
}

const blocking = missing.filter((c) => c.required);
say(blocking.length ? "\n❌ Falta algo imprescindible. Arréglalo y vuelve a ejecutar: npm run comprobar\n" : "\n✅ Todo listo. En Antigravity escribe /clonar o pide a tu agente empezar.\n");
process.exit(blocking.length ? 1 : 0);
