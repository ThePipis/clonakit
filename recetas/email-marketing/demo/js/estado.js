// El "estado" es la copia en memoria de todos los datos de la app.
// Al arrancar se lee de IndexedDB; cada cambio se guarda en memoria y en la base
// de datos a la vez. Así las pantallas leen rápido y nada se pierde al recargar.

import { ALMACENES, abrirBD, borrarVarios, guardarVarios, leerTodo, vaciar } from "./db.js";
import { slug } from "./ui.js";

export const estado = {
  contactos: [],
  campos: [], // campos personalizados: { id, nombre, tipo: "texto"|"numero"|"fecha", clave, visible }
  segmentos: [],
  emails: [],
  automatizaciones: [],
  remitente: { negocio: "", direccion: "", enlaceBaja: "" },
};

const REMITENTE_VACIO = { negocio: "", direccion: "", enlaceBaja: "" };

// Las pantallas se apuntan aquí para enterarse de que algo ha cambiado.
const oyentes = new Set();
let avisoPendiente = false;
export function alCambiarDatos(funcion) {
  oyentes.add(funcion);
}
function avisarCambio() {
  // Agrupamos varios cambios seguidos en un solo aviso para no repintar de más.
  if (avisoPendiente) return;
  avisoPendiente = true;
  queueMicrotask(() => {
    avisoPendiente = false;
    oyentes.forEach((f) => f());
  });
}

export async function cargarEstado() {
  await abrirBD();
  const [contactos, campos, segmentos, emails, automatizaciones, ajustes] = await Promise.all(ALMACENES.map(leerTodo));
  Object.assign(estado, { contactos, campos, segmentos, emails, automatizaciones });
  estado.remitente = { ...REMITENTE_VACIO, ...(ajustes.find((a) => a.id === "remitente") ?? {}) };
  delete estado.remitente.id;
}

// Identificador único corto: prefijo + hora + azar.
export function nuevoId(prefijo) {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Crea o reemplaza objetos de una colección (en memoria y en IndexedDB).
async function guardarEn(coleccion, objetos) {
  const lista = estado[coleccion];
  const posiciones = new Map(lista.map((o, i) => [o.id, i]));
  for (const objeto of objetos) {
    if (posiciones.has(objeto.id)) lista[posiciones.get(objeto.id)] = objeto;
    else {
      posiciones.set(objeto.id, lista.length);
      lista.push(objeto);
    }
  }
  avisarCambio();
  await guardarVarios(coleccion, objetos);
}

export async function borrarDe(coleccion, ids) {
  const quitar = new Set(ids);
  estado[coleccion] = estado[coleccion].filter((o) => !quitar.has(o.id));
  avisarCambio();
  await borrarVarios(coleccion, [...quitar]);
}

export const guardarContactos = (lista) => guardarEn("contactos", lista);
export const guardarContacto = (contacto) => guardarEn("contactos", [contacto]);
export const guardarSegmento = (segmento) => guardarEn("segmentos", [segmento]);
export const guardarEmail = (email) => guardarEn("emails", [email]);
export const guardarAutomatizacion = (auto) => guardarEn("automatizaciones", [auto]);
export const guardarCampos = (campos) => guardarEn("campos", campos);

export async function guardarRemitente(datos) {
  estado.remitente = { ...REMITENTE_VACIO, ...datos };
  avisarCambio();
  await guardarVarios("ajustes", [{ id: "remitente", ...estado.remitente }]);
}

// ---------- Campos ----------
// Email, nombre y fecha de alta existen siempre; el resto los crea la persona.
export const CAMPOS_FIJOS = [
  { id: "email", nombre: "Email", tipo: "texto", clave: "email", fijo: true },
  { id: "nombre", nombre: "Nombre", tipo: "texto", clave: "nombre", fijo: true },
  { id: "alta", nombre: "Fecha de alta", tipo: "fecha", clave: "alta", fijo: true },
];

export function todosLosCampos() {
  return [...CAMPOS_FIJOS, ...estado.campos];
}

export function buscarCampo(id) {
  return todosLosCampos().find((c) => c.id === id);
}

export function valorCampo(contacto, campoId) {
  if (campoId === "email") return contacto.email ?? "";
  if (campoId === "nombre") return contacto.nombre ?? "";
  if (campoId === "alta") return (contacto.alta ?? "").slice(0, 10);
  return contacto.campos?.[campoId] ?? "";
}

// La "clave" es lo que se escribe entre llaves en los emails: {{interes}}.
function claveLibre(nombre) {
  const base = slug(nombre) || "campo";
  let clave = base;
  for (let n = 2; todosLosCampos().some((c) => c.clave === clave); n++) clave = `${base}_${n}`;
  return clave;
}

export async function crearCampo(nombre, tipo) {
  const existente = estado.campos.find((c) => c.nombre.toLowerCase() === nombre.trim().toLowerCase());
  if (existente) return existente;
  const nuevo = { id: nuevoId("campo"), nombre: nombre.trim(), tipo, clave: claveLibre(nombre), visible: true };
  await guardarEn("campos", [nuevo]);
  return nuevo;
}

export async function borrarCampo(id) {
  // Además de borrar la definición, quitamos ese dato de los contactos que lo tenían.
  const afectados = estado.contactos.filter((c) => c.campos && id in c.campos);
  for (const c of afectados) delete c.campos[id];
  if (afectados.length) await guardarContactos(afectados);
  await borrarDe("campos", [id]);
}

// ---------- Etiquetas ----------
// No hay una lista aparte de etiquetas: son las que llevan los contactos.
export function contarEtiquetas() {
  const cuenta = new Map();
  for (const c of estado.contactos) for (const e of c.etiquetas ?? []) cuenta.set(e, (cuenta.get(e) ?? 0) + 1);
  return new Map([...cuenta].sort((a, b) => a[0].localeCompare(b[0], "es")));
}

// ---------- Copia de seguridad ----------
export function crearCopia() {
  return {
    app: "Embudo",
    version: 1,
    exportado: new Date().toISOString(),
    datos: {
      contactos: estado.contactos,
      campos: estado.campos,
      segmentos: estado.segmentos,
      emails: estado.emails,
      automatizaciones: estado.automatizaciones,
      remitente: estado.remitente,
    },
  };
}

export async function borrarTodo() {
  for (const almacen of ALMACENES) await vaciar(almacen);
  Object.assign(estado, { contactos: [], campos: [], segmentos: [], emails: [], automatizaciones: [], remitente: { ...REMITENTE_VACIO } });
  avisarCambio();
}

export async function restaurarCopia(copia) {
  const d = copia?.datos;
  const esLista = (x) => Array.isArray(x);
  if (copia?.app !== "Embudo" || !d || !["contactos", "campos", "segmentos", "emails", "automatizaciones"].every((k) => esLista(d[k]))) {
    throw new Error("Este archivo no es una copia de seguridad de Embudo.");
  }
  await borrarTodo();
  for (const coleccion of ["contactos", "campos", "segmentos", "emails", "automatizaciones"]) {
    if (d[coleccion].length) await guardarEn(coleccion, d[coleccion]);
  }
  await guardarRemitente(d.remitente ?? {});
}
