// Utilidades pequeñas que usan todos los módulos de Taller.

// Atajos para buscar elementos: $("#id") devuelve uno, $$(".clase") devuelve una lista.
export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

// Crea un elemento en una línea: crear("button", { class: "boton", text: "Hola" }).
// Así evitamos montar HTML con textos del usuario (que podrían romper la página).
export function crear(etiqueta, atributos = {}, hijos = []) {
  const elemento = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === "text") elemento.textContent = valor;
    else if (clave === "html") elemento.innerHTML = valor;
    else if (clave.startsWith("on")) elemento.addEventListener(clave.slice(2), valor);
    else elemento.setAttribute(clave, valor === true ? "" : valor);
  }
  for (const hijo of [].concat(hijos)) {
    if (hijo !== null && hijo !== undefined) elemento.append(hijo);
  }
  return elemento;
}

// Convierte < > & " en texto seguro para meterlo dentro de HTML.
export function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Identificador único para proyectos y misiones.
export function nuevoId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// "Esperar a que la persona pare": ejecuta fn cuando pasan `ms` sin nuevas llamadas.
// Tiene .ahora() para ejecutarla ya (si había algo pendiente), .pendiente() y .cancelar().
export function alParar(fn, ms) {
  let temporizador = null;
  let ultimosArgumentos = [];
  const envoltorio = (...argumentos) => {
    ultimosArgumentos = argumentos;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      temporizador = null;
      fn(...ultimosArgumentos);
    }, ms);
  };
  envoltorio.ahora = () => {
    if (temporizador === null) return;
    clearTimeout(temporizador);
    temporizador = null;
    fn(...ultimosArgumentos);
  };
  envoltorio.pendiente = () => temporizador !== null;
  envoltorio.cancelar = () => {
    clearTimeout(temporizador);
    temporizador = null;
  };
  return envoltorio;
}

// ---------- Tipos de archivo ----------

// Taller solo trabaja con archivos de texto. Cada tipo tiene su nombre, su icono y su color.
export const TIPOS = {
  html: { nombre: "HTML", icono: "<>", lenguaje: "html" },
  css: { nombre: "CSS", icono: "#", lenguaje: "css" },
  js: { nombre: "JavaScript", icono: "JS", lenguaje: "js" },
  json: { nombre: "JSON", icono: "{}", lenguaje: "json" },
  md: { nombre: "Markdown", icono: "M↓", lenguaje: "markdown" },
  txt: { nombre: "Texto", icono: "≡", lenguaje: "text" },
  svg: { nombre: "SVG", icono: "◇", lenguaje: "svg" },
};
export const EXTENSIONES = Object.keys(TIPOS);
export const LISTA_EXTENSIONES = ".html, .css, .js, .json, .txt, .md y .svg";

export const extension = (ruta) => (ruta.match(/\.([^./]+)$/)?.[1] ?? "").toLowerCase();
export const tipoDe = (ruta) => TIPOS[extension(ruta)] ?? TIPOS.txt;
export const esPermitido = (nombre) => EXTENSIONES.includes(extension(nombre));

// "css/estilos.css" → nombre "estilos.css" y carpeta "css".
export const nombreDe = (ruta) => ruta.split("/").pop();
export const carpetaDe = (ruta) => (ruta.includes("/") ? ruta.slice(0, ruta.lastIndexOf("/")) : "");
export const unirRuta = (carpeta, nombre) => (carpeta ? `${carpeta}/${nombre}` : nombre);

// Icono de un archivo: una pastilla con letras y el color de su tipo (lo pinta style.css).
export function iconoArchivo(ruta) {
  const ext = TIPOS[extension(ruta)] ? extension(ruta) : "txt";
  return crear("span", { class: `icono-archivo icono-archivo--${ext}`, "aria-hidden": "true", text: TIPOS[ext].icono });
}

// Comprueba un nombre de archivo o carpeta. Devuelve el problema en texto, o null si está bien.
export function problemaConNombre(nombre, { esCarpeta = false } = {}) {
  if (!nombre) return "Escribe un nombre.";
  if (/[\\/]/.test(nombre)) return "El nombre no puede llevar barras (/). Para meterlo en una carpeta, usa el menú ⋯ de esa carpeta.";
  if (/[<>:"|?*]/.test(nombre)) return 'Evita estos caracteres: < > : " | ? *';
  if (nombre === "." || nombre === "..") return "Ese nombre está reservado.";
  if (!esCarpeta && !esPermitido(nombre)) return `Taller solo trabaja con archivos de texto: ${LISTA_EXTENSIONES}.`;
  return null;
}

// "Mi carta de bar" → "mi-carta-de-bar" (para nombres de archivo descargados).
export function slug(texto) {
  const limpio = String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpio || "proyecto";
}

// Descarga un archivo al ordenador: lo convertimos en un enlace temporal y lo "pulsamos".
export function descargar(nombreArchivo, contenido, tipoMime = "text/plain") {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: `${tipoMime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const enlace = crear("a", { href: url, download: nombreArchivo });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Fecha legible: "hoy, 19:42", "ayer, 10:03" o "12 oct, 10:03".
export function formatearFecha(ms) {
  const fecha = new Date(ms);
  const hora = fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const hoy = new Date();
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  if (fecha.toDateString() === hoy.toDateString()) return `hoy, ${hora}`;
  if (fecha.toDateString() === ayer.toDateString()) return `ayer, ${hora}`;
  const opciones = { day: "numeric", month: "short" };
  if (fecha.getFullYear() !== hoy.getFullYear()) opciones.year = "numeric";
  return `${fecha.toLocaleDateString("es-ES", opciones)}, ${hora}`;
}

// "1 archivo" / "3 archivos".
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Quita tildes y mayúsculas para comparar textos en el buscador.
export const normalizar = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Logo de Taller: una llave inglesa cruzando los signos < >. Se usa en varias pantallas.
export const LOGO_SVG = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
  <rect width="32" height="32" rx="8" fill="#B8E05A"/>
  <path d="M8 11 3.5 16.5 8 22M24 11l4.5 5.5L24 22" fill="none" stroke="#15171C" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.2 26.2 17.6 12.6" stroke="#15171C" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="18.45" cy="10.2" r="4" fill="#15171C"/>
  <rect x="-1.5" y="-2.6" width="3" height="5.2" transform="translate(19.3 7.6) rotate(18)" fill="#B8E05A"/>
</svg>`;
