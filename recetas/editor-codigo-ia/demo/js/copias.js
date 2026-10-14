// Crear, duplicar, exportar (.zip y .json) e importar proyectos.

import * as db from "./db.js";
import { crearZip } from "./zip.js";
import { descargar, slug, nuevoId, carpetaDe, esPermitido, problemaConNombre } from "./util.js";

const FORMATO = "taller-proyecto"; // marca para reconocer nuestros .json al importarlos
const ESTADOS_VALIDOS = ["pendiente", "en-curso", "hecha"];

// Crea un proyecto nuevo con sus archivos y misiones. Devuelve el registro del proyecto.
export async function crearProyecto({ nombre, archivos = [], carpetas = [], misiones = [], abiertas = null }) {
  const ahora = Date.now();
  const rutas = archivos.map((a) => a.ruta);
  const pestanas = (abiertas ?? (rutas.includes("index.html") ? ["index.html"] : [])).filter((r) => rutas.includes(r));
  const proyecto = {
    id: nuevoId(),
    nombre,
    creado: ahora,
    modificado: ahora,
    carpetas,
    abiertas: pestanas,
    activa: pestanas[0] ?? null,
    zonas: {}, // anchos de las zonas que la persona haya cambiado
    verMisiones: false,
    consolaAbierta: true,
    tamanoPrevia: "escritorio",
  };
  await db.enLote([
    { poner: proyecto, en: "proyectos" },
    ...archivos.map((a) => ({ poner: { proyectoId: proyecto.id, ruta: a.ruta, contenido: a.contenido }, en: "archivos" })),
    ...misiones.map((m, i) => ({ poner: { ...m, id: nuevoId(), proyectoId: proyecto.id, orden: i, creada: m.creada ?? ahora }, en: "misiones" })),
  ]);
  return proyecto;
}

// Todo lo de un proyecto guardado: { proyecto, archivos, misiones }.
export async function leerProyectoCompleto(id) {
  const [proyecto, archivos, misiones] = await Promise.all([db.leer("proyectos", id), db.leerDeProyecto("archivos", id), db.leerDeProyecto("misiones", id)]);
  return { proyecto, archivos, misiones: misiones.sort((a, b) => a.orden - b.orden) };
}

export async function duplicarProyecto(id) {
  const { proyecto, archivos, misiones } = await leerProyectoCompleto(id);
  return crearProyecto({
    nombre: `${proyecto.nombre} (copia)`,
    archivos,
    carpetas: [...proyecto.carpetas],
    misiones,
    abiertas: proyecto.abiertas,
  });
}

// ---------- .zip listo para publicar ----------

export function descargarZip(proyecto, archivos) {
  // Todas las carpetas: las creadas a mano (aunque estén vacías) y las que contienen archivos.
  const carpetas = new Set();
  const anadirConPadres = (ruta) => {
    for (let c = ruta; c; c = carpetaDe(c)) carpetas.add(c);
  };
  proyecto.carpetas.forEach(anadirConPadres);
  archivos.forEach((a) => anadirConPadres(carpetaDe(a.ruta)));

  const entradas = [
    ...[...carpetas].sort().map((ruta) => ({ ruta, contenido: null })),
    ...[...archivos].sort((a, b) => a.ruta.localeCompare(b.ruta)).map((a) => ({ ruta: a.ruta, contenido: a.contenido })),
  ];
  const nombre = `${slug(proyecto.nombre)}.zip`;
  descargar(nombre, crearZip(entradas));
  return nombre;
}

// ---------- Copia en .json ----------

export function exportarJson(proyecto, archivos, misiones) {
  const copia = {
    formato: FORMATO,
    version: 1,
    exportado: new Date().toISOString(),
    nombre: proyecto.nombre,
    creado: proyecto.creado,
    modificado: proyecto.modificado,
    carpetas: proyecto.carpetas,
    abiertas: proyecto.abiertas,
    archivos: archivos.map(({ ruta, contenido }) => ({ ruta, contenido })),
    misiones: misiones.map(({ titulo, objetivo, hecho, archivos: rutas, notas, estado, creada }) => ({ titulo, objetivo, hecho, archivos: rutas, notas, estado, creada })),
  };
  const nombre = `${slug(proyecto.nombre)}.json`;
  descargar(nombre, JSON.stringify(copia, null, 2), "application/json");
  return nombre;
}

// Limpia una ruta que viene de fuera: sin "..", sin barras sobrantes y con nombres válidos.
function rutaSegura(ruta, { esCarpeta = false } = {}) {
  if (typeof ruta !== "string") return null;
  const partes = ruta.split("/").filter((p) => p && p !== "." && p !== "..");
  if (!partes.length) return null;
  const valida = partes.every((p, i) => !problemaConNombre(p, { esCarpeta: esCarpeta || i < partes.length - 1 }));
  return valida ? partes.join("/") : null;
}

// Lee un .json exportado por Taller y lo convierte en un proyecto nuevo.
export async function importarJson(archivo) {
  let datos;
  try {
    datos = JSON.parse(await archivo.text());
  } catch {
    throw new Error("Ese archivo no es un .json válido.");
  }
  if (datos?.formato !== FORMATO || !Array.isArray(datos.archivos)) {
    throw new Error("Ese .json no es una copia de un proyecto de Taller.");
  }

  const archivos = [];
  for (const a of datos.archivos) {
    const ruta = rutaSegura(a?.ruta);
    if (ruta && esPermitido(ruta) && typeof a.contenido === "string" && !archivos.some((x) => x.ruta === ruta)) {
      archivos.push({ ruta, contenido: a.contenido });
    }
  }
  const rutas = archivos.map((a) => a.ruta);
  const carpetas = (Array.isArray(datos.carpetas) ? datos.carpetas : []).map((c) => rutaSegura(c, { esCarpeta: true })).filter(Boolean);
  const texto = (valor) => (typeof valor === "string" ? valor : "");
  const misiones = (Array.isArray(datos.misiones) ? datos.misiones : []).map((m) => ({
    titulo: texto(m?.titulo),
    objetivo: texto(m?.objetivo),
    hecho: texto(m?.hecho),
    notas: texto(m?.notas),
    estado: ESTADOS_VALIDOS.includes(m?.estado) ? m.estado : "pendiente",
    archivos: Array.isArray(m?.archivos) ? m.archivos.filter((r) => rutas.includes(r)) : [],
    creada: Number.isFinite(m?.creada) ? m.creada : undefined,
  }));

  return crearProyecto({
    nombre: texto(datos.nombre).trim().slice(0, 80) || "Proyecto importado",
    archivos,
    carpetas: [...new Set(carpetas)],
    misiones,
    abiertas: Array.isArray(datos.abiertas) ? datos.abiertas : null,
  });
}
