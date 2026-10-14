// Guardar y abrir: el guardado automático en el navegador (localStorage),
// la descarga de archivos y la lectura (con comprobación) de dibujos .json.

import { CLAVE_GUARDADO, VERSION_FORMATO, TINTA, TAMANO_TEXTO, GROSORES, ZOOM_MIN, ZOOM_MAX } from "./constantes.js";
import { nuevoId } from "./estado.js";
import { nuevaSemilla } from "./trazo-a-mano.js";

const TIPOS = ["rectangulo", "rombo", "elipse", "flecha", "texto"];

/** Datos que se guardan. `vista` añade la cámara y las preferencias (solo en el navegador). */
export function empaquetar(estado, vista) {
  const datos = { formato: "trazo", version: VERSION_FORMATO, elementos: estado.elementos };
  if (vista) {
    datos.camara = estado.camara;
    datos.preferencias = estado.preferencias;
  }
  return datos;
}

/** Guarda en el navegador. Devuelve false si no se puede (modo privado, sin espacio...). */
export function guardarEnNavegador(datos) {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
    return true;
  } catch {
    return false;
  }
}

/** Lee lo guardado en el navegador, o null si no hay nada (o está dañado). */
export function cargarDelNavegador() {
  let texto = null;
  try {
    texto = localStorage.getItem(CLAVE_GUARDADO);
  } catch {
    return null; // algunos navegadores bloquean localStorage: empezamos con la pizarra vacía
  }
  if (!texto) return null;
  const resultado = leerDibujo(texto);
  return resultado.ok ? resultado : null;
}

/**
 * Comprueba y limpia un dibujo en texto JSON.
 * Devuelve { ok: true, elementos, camara, preferencias } o { ok: false, mensaje } con un mensaje amable.
 */
export function leerDibujo(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    return { ok: false, mensaje: "No se puede leer este archivo. ¿Seguro que es un dibujo guardado con Trazo?" };
  }
  if (!datos || datos.formato !== "trazo" || !Array.isArray(datos.elementos)) {
    return { ok: false, mensaje: "Este archivo no es un dibujo de Trazo." };
  }
  if (typeof datos.version !== "number" || datos.version > VERSION_FORMATO) {
    return { ok: false, mensaje: "Este dibujo se guardó con una versión más nueva de Trazo y no se puede abrir aquí." };
  }
  // Aquí, el día que cambie el formato, se convertirían los archivos de versiones antiguas.

  const vistos = new Set();
  const elementos = [];
  for (const bruto of datos.elementos) {
    const el = limpiarElemento(bruto);
    if (!el) continue;
    if (vistos.has(el.id)) el.id = nuevoId(); // dos elementos con el mismo id darían problemas
    vistos.add(el.id);
    elementos.push(el);
  }
  if (datos.elementos.length > 0 && elementos.length === 0) {
    return { ok: false, mensaje: "El archivo no tiene ningún elemento que Trazo entienda." };
  }
  return { ok: true, elementos, camara: limpiarCamara(datos.camara), preferencias: limpiarPreferencias(datos.preferencias) };
}

/** Descarga un archivo creado en el navegador (por ejemplo, un dibujo o una imagen). */
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  // Se libera la memoria un poco después, cuando la descarga ya ha empezado.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Fecha de hoy como AAAA-MM-DD (hora local), para los nombres de archivo. */
export function fechaHoy() {
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
}

// ---------------------------------------------------------------------------
// Limpieza: nunca nos fiamos de un archivo de fuera. Lo que no tenga sentido
// se descarta o se cambia por un valor por defecto.
// ---------------------------------------------------------------------------

function numero(valor, porDefecto = 0) {
  return Number.isFinite(valor) ? valor : porDefecto;
}

function limpiarElemento(o) {
  if (!o || typeof o !== "object" || !TIPOS.includes(o.tipo)) return null;
  const el = {
    id: typeof o.id === "string" && o.id ? o.id : nuevoId(),
    tipo: o.tipo,
    trazo: typeof o.trazo === "string" && /^#[0-9a-f]{6}$/i.test(o.trazo) ? o.trazo.toUpperCase() : TINTA,
    relleno: o.relleno === "suave" ? "suave" : "ninguno",
    grosor: GROSORES.includes(o.grosor) ? o.grosor : 2,
    linea: o.linea === "discontinua" ? "discontinua" : "continua",
    texto: typeof o.texto === "string" ? o.texto : "",
    tamano: Math.min(400, Math.max(6, numero(o.tamano, TAMANO_TEXTO))),
    semilla: Number.isInteger(o.semilla) ? o.semilla : nuevaSemilla(),
  };
  if (el.tipo === "flecha") {
    el.x1 = numero(o.x1);
    el.y1 = numero(o.y1);
    el.x2 = numero(o.x2);
    el.y2 = numero(o.y2);
    el.desde = typeof o.desde === "string" ? o.desde : null;
    el.hasta = typeof o.hasta === "string" ? o.hasta : null;
  } else {
    el.x = numero(o.x);
    el.y = numero(o.y);
    el.ancho = Math.abs(numero(o.ancho));
    el.alto = Math.abs(numero(o.alto));
  }
  // Un texto suelto vacío no se ve ni se puede seleccionar: se descarta.
  if (el.tipo === "texto" && !el.texto.trim()) return null;
  return el;
}

function limpiarCamara(c) {
  if (!c || typeof c !== "object") return null;
  return { x: numero(c.x), y: numero(c.y), zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, numero(c.zoom, 1))) };
}

function limpiarPreferencias(p) {
  if (!p || typeof p !== "object") return null;
  return {
    cuadricula: typeof p.cuadricula === "boolean" ? p.cuadricula : true,
    oscuro: typeof p.oscuro === "boolean" ? p.oscuro : false,
  };
}
