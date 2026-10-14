// Pequeñas herramientas que usan todos los módulos: crear elementos, fechas, textos e iconos.

// Atajo para coger elementos del HTML por su id: $("buscador").
export const $ = (id) => document.getElementById(id);

// Crea un elemento HTML de forma segura (sin innerHTML, así nadie puede colar código con un título).
// Ejemplo: el("button", { class: "boton", onclick: guardar }, "Guardar")
export function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
    else if (clave === "style" && typeof valor === "object") {
      // setProperty también sirve para variables CSS como "--color".
      for (const [propiedad, v] of Object.entries(valor)) nodo.style.setProperty(propiedad, v);
    }
    else if (clave === "dataset") Object.assign(nodo.dataset, valor);
    else if (clave === "html") nodo.innerHTML = valor; // solo para nuestros iconos SVG, nunca para texto del usuario
    else if (valor === true) nodo.setAttribute(clave, "");
    else nodo.setAttribute(clave, valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}

// Identificadores únicos para tableros, listas y tarjetas.
export function nuevoId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// Copia profunda de un objeto de datos (sirve para duplicar sin que las copias compartan nada).
export const clonar = (objeto) => JSON.parse(JSON.stringify(objeto));

// Quita tildes y mayúsculas para que "lucia" encuentre "Lucía".
// normalize("NFD") separa la letra de su tilde y la expresión borra las tildes sueltas.
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// "1 tarjeta" / "3 tarjetas": evita los plurales raros.
export const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

/* ---------- Fechas ---------- */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// La fecha de hoy como "2026-10-14" en hora local (toISOString usaría la hora de Londres).
export function hoyISO(fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

// Convierte "2026-10-14" en un Date a medianoche local.
function aFecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

// Formato corto español: "14 oct" (y el año si no es el actual: "14 oct 2027").
export function fechaCorta(iso) {
  const f = aFecha(iso);
  const texto = `${f.getDate()} ${MESES[f.getMonth()]}`;
  return f.getFullYear() === new Date().getFullYear() ? texto : `${texto} ${f.getFullYear()}`;
}

// Decide el color de la fecha límite: verde si está cumplida, rojo si venció,
// ámbar si vence hoy o mañana y gris en cualquier otro caso.
export function estadoFecha(iso, cumplida) {
  if (!iso) return null;
  if (cumplida) return { clase: "cumplida", texto: "Cumplida" };
  const dias = Math.round((aFecha(iso) - aFecha(hoyISO())) / 86400000);
  if (dias < 0) return { clase: "vencida", texto: "Vencida" };
  if (dias === 0) return { clase: "pronto", texto: "Vence hoy" };
  if (dias === 1) return { clase: "pronto", texto: "Vence mañana" };
  return { clase: "normal", texto: `Faltan ${dias} días` };
}

/* ---------- Enlaces en la descripción ---------- */

// Convierte el texto en nodos, cambiando las direcciones web por enlaces.
// Se hace con nodos de texto (no con innerHTML) para que nadie pueda inyectar HTML.
export function textoConEnlaces(texto) {
  const fragmento = document.createDocumentFragment();
  const patron = /\b(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;
  let ultimo = 0;
  for (const coincidencia of texto.matchAll(patron)) {
    // Los signos de puntuación al final ("...mira https://web.com.") no forman parte del enlace.
    const direccion = coincidencia[0].replace(/[.,;:!?)\]]+$/, "");
    fragmento.append(texto.slice(ultimo, coincidencia.index));
    const href = direccion.startsWith("www.") ? `https://${direccion}` : direccion;
    fragmento.append(el("a", { href, target: "_blank", rel: "noopener noreferrer" }, direccion));
    ultimo = coincidencia.index + direccion.length;
  }
  fragmento.append(texto.slice(ultimo));
  return fragmento;
}

/* ---------- Iconos ---------- */

// Iconos dibujados a mano en SVG (sin librerías externas). Usan currentColor para tomar el color del texto.
const trazo = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const iconos = {
  logo: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#1F7A74"/><rect x="7" y="13" width="5" height="12" rx="2.5" fill="#F1ECE2"/><rect x="13.5" y="7" width="5" height="18" rx="2.5" fill="#F1ECE2"/><rect x="20" y="16" width="5" height="9" rx="2.5" fill="#E9C46A"/></svg>`,
  mas: trazo('<path d="M12 5v14M5 12h14"/>'),
  puntos: trazo('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>'),
  volver: trazo('<path d="M15 18l-6-6 6-6"/>'),
  buscar: trazo('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  etiqueta: trazo('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  reloj: trazo('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: trazo('<path d="M5 12l5 5L20 7"/>'),
  checklist: trazo('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>'),
  texto: trazo('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  cerrar: trazo('<path d="M6 6l12 12M18 6L6 18"/>'),
  descargar: trazo('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  subir: trazo('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
  papelera: trazo('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  copiar: trazo('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  lapiz: trazo('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  paleta: trazo('<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16" cy="10" r="1.2" fill="currentColor"/><path d="M12 21a3 3 0 0 1 0-6h2"/>'),
  mover: trazo('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  izquierda: trazo('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  filtro: trazo('<path d="M4 5h16l-6 8v6l-4-2v-4z"/>'),
};
