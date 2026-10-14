// formato.js — Convierte el texto de los mensajes en HTML seguro, resalta búsquedas y escribe fechas en español.

// ---------- Texto seguro ----------

// Escapar: cambia < > & " ' por su versión "inofensiva" para que nadie pueda colar HTML o scripts en un mensaje.
const ENTIDADES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (letra) => ENTIDADES[letra]);
}

// Direcciones web: empiezan por http(s):// o www. y acaban antes de un espacio.
// El último carácter no puede ser un signo de puntuación: así "mira www.web.com." no se lleva el punto final.
const RE_URL = /\b(?:https?:\/\/|www\.)[^\s<>"']*[^\s<>"'.,;:!?¡¿)\]}*_]/giu;

// *negrita* y _cursiva_: el símbolo de fuera no puede estar pegado a letras o números,
// así "2*3*4" o "nombre_de_archivo" no se convierten por error.
const RE_NEGRITA = /(^|[^\p{L}\p{N}*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\p{L}\p{N}*])/gu;
const RE_CURSIVA = /(^|[^\p{L}\p{N}_])_(?=[^\s_])([^_\n]*?[^\s_])_(?![\p{L}\p{N}_])/gu;

// Marcas invisibles para "aparcar" los enlaces mientras se aplica el formato (así un _ dentro de una URL no la rompe).
const APARCA_INICIO = "";
const APARCA_FIN = "";

/**
 * Convierte el texto de un mensaje (tal como se escribió) en HTML.
 * Orden importante: 1) aparcar enlaces, 2) escapar TODO, 3) aplicar negrita/cursiva, 4) devolver los enlaces.
 */
export function formatearMensaje(texto) {
  const enlaces = [];
  let html = String(texto ?? "").replace(/[]/g, "");
  html = html.replace(RE_URL, (url) => {
    enlaces.push(url);
    return `${APARCA_INICIO}${enlaces.length - 1}${APARCA_FIN}`;
  });
  html = escapar(html);
  html = html.replace(RE_NEGRITA, "$1<strong>$2</strong>");
  html = html.replace(RE_CURSIVA, "$1<em>$2</em>");
  html = html.replace(/(\d+)/g, (_, i) => {
    const url = enlaces[Number(i)];
    const destino = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return `<a href="${escapar(destino)}" target="_blank" rel="noopener noreferrer">${escapar(url)}</a>`;
  });
  return html.replace(/\n/g, "<br>");
}

// Texto sin los símbolos de formato (para los resultados de búsqueda): "*Bodas Luna*" → "Bodas Luna".
export function quitarFormato(texto) {
  return String(texto ?? "").replace(RE_NEGRITA, "$1$2").replace(RE_CURSIVA, "$1$2");
}

// ---------- Búsqueda ----------

// Quita tildes y mayúsculas: "Presupuésto" y "presupuesto" se consideran iguales.
// normalize("NFD") separa la letra de su tilde, y \p{M} borra esas tildes sueltas.
export function normalizar(texto) {
  return String(texto ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Devuelve el texto como HTML seguro con las coincidencias de `consulta` dentro de <mark>.
 * Si el texto es más largo que `maximo` letras, recorta un trozo alrededor de la primera coincidencia.
 */
export function resaltar(texto, consulta, maximo = Infinity) {
  const letras = Array.from(String(texto ?? ""));
  const buscado = normalizar(String(consulta ?? "").trim());

  // Versión "plana" del texto y, para cada posición plana, de qué letra original viene.
  let plano = "";
  const origen = [];
  letras.forEach((letra, i) => {
    const plana = normalizar(letra);
    for (let k = 0; k < plana.length; k++) {
      plano += plana[k];
      origen.push(i);
    }
  });

  const marcadas = new Array(letras.length).fill(false);
  let primera = -1;
  if (buscado) {
    let desde = 0;
    let pos = plano.indexOf(buscado, desde);
    while (pos !== -1) {
      for (let k = pos; k < pos + buscado.length; k++) marcadas[origen[k]] = true;
      if (primera === -1) primera = origen[pos];
      desde = pos + buscado.length;
      pos = plano.indexOf(buscado, desde);
    }
  }

  let inicio = 0;
  let fin = letras.length;
  if (letras.length > maximo) {
    inicio = Math.max(0, Math.max(primera, 0) - Math.floor(maximo / 3));
    fin = Math.min(letras.length, inicio + maximo);
    inicio = Math.max(0, fin - maximo);
  }

  let html = inicio > 0 ? "…" : "";
  let dentro = false;
  for (let i = inicio; i < fin; i++) {
    if (marcadas[i] !== dentro) {
      html += marcadas[i] ? "<mark>" : "</mark>";
      dentro = marcadas[i];
    }
    html += letras[i] === "\n" ? " " : escapar(letras[i]);
  }
  if (dentro) html += "</mark>";
  if (fin < letras.length) html += "…";
  return html;
}

// ---------- Fechas y horas (formato español con Intl.DateTimeFormat) ----------

const fmtHora = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
const fmtFecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDiaSemana = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
const fmtDiaMes = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" });
const fmtDiaMesAnio = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });

export const hora = (fecha) => fmtHora.format(fecha); // 12:40
export const fechaCorta = (fecha) => fmtFecha.format(fecha); // 13/10/2026
export const fechaHora = (fecha) => `${fechaCorta(fecha)}, ${hora(fecha)}`; // 13/10/2026, 12:40

// Identificador del día (sirve para saber si dos mensajes son del mismo día).
export const claveDia = (fecha) => new Date(fecha).toDateString();

// "Hoy", "Ayer" o "lunes 12 de octubre" (con el año si no es el actual).
export function etiquetaDia(fecha) {
  const medianoche = (t) => new Date(t).setHours(0, 0, 0, 0);
  const dias = Math.round((medianoche(Date.now()) - medianoche(fecha)) / 86400000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  const mismoAnio = new Date(fecha).getFullYear() === new Date().getFullYear();
  return `${fmtDiaSemana.format(fecha)} ${(mismoAnio ? fmtDiaMes : fmtDiaMesAnio).format(fecha)}`;
}

// ---------- Personas ----------

// Iniciales para el avatar: "Ana García" → "AG"; "Luis" → "L".
export function iniciales(nombre) {
  const palabras = String(nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return "?";
  const primera = Array.from(palabras[0])[0];
  const ultima = palabras.length > 1 ? Array.from(palabras[palabras.length - 1])[0] : "";
  return (primera + ultima).toUpperCase();
}

// "Ana", "Ana y Luis", "Ana, Luis y Marta"
const fmtLista = new Intl.ListFormat("es", { style: "long", type: "conjunction" });
export const listaNombres = (nombres) => fmtLista.format(nombres);
