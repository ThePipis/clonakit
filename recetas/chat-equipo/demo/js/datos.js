// datos.js — Los datos de Corrillo: personas, canales, mensajes y qué ha leído cada persona.
//
// Todo se guarda junto, como un único texto JSON, en el localStorage del navegador.
// Así sobrevive a recargar la página, pero NO sale de este navegador: por eso es una demo.

const CLAVE = "corrillo:datos";

// Paleta de colores para las personas del equipo.
export const PALETA = [
  { nombre: "Coral", color: "#F07B5A" },
  { nombre: "Mostaza", color: "#D9A441" },
  { nombre: "Azul", color: "#4F7CAC" },
  { nombre: "Verde", color: "#5E9C76" },
  { nombre: "Malva", color: "#B5838D" },
  { nombre: "Gris pizarra", color: "#6D7A86" },
];

// El estado actual (o null si todavía no hay demo). Otros módulos lo leen con `import { estado }`;
// solo este archivo lo cambia, y cada cambio pasa por la función cambiar().
export let estado = null;

// ---------- Avisos de cambios ----------

// Quien quiera enterarse de los cambios (para volver a pintar la pantalla) se apunta aquí.
const oyentes = [];
export function alCambiar(funcion) {
  oyentes.push(funcion);
}
function avisarCambio(origen) {
  for (const funcion of oyentes) funcion(origen);
}

let alFallar = () => {};
export function alFallarGuardado(funcion) {
  alFallar = funcion;
}

// BroadcastChannel deja que las pestañas de este mismo navegador se avisen entre sí (no es multiusuario real).
// El aviso lleva los datos completos: así no dependemos de releer localStorage, que en otra pestaña
// puede tardar unos milisegundos en ponerse al día y nos daría datos viejos.
const radio = "BroadcastChannel" in self ? new BroadcastChannel("corrillo") : null;
if (radio) {
  radio.onmessage = (evento) => {
    try {
      estado = evento.data ? validar(evento.data) : null; // null = otra pestaña borró la demo
    } catch {
      return; // un mensaje raro no debe romper esta pestaña
    }
    avisarCambio("otra-pestana");
  };
}

// ---------- Leer y guardar ----------

// Lee lo guardado. Devuelve true si había una demo válida.
export function cargar() {
  let texto = null;
  try {
    texto = localStorage.getItem(CLAVE);
  } catch {
    // El navegador puede bloquear el almacenamiento (modo muy privado): seguimos sin datos.
  }
  if (!texto) {
    estado = null;
    return false;
  }
  try {
    estado = validar(JSON.parse(texto));
    return true;
  } catch {
    estado = null;
    return false;
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch (error) {
    alFallar(error);
  }
}

// Guarda, manda los datos a las otras pestañas y repinta esta.
function difundir() {
  guardar();
  radio?.postMessage(estado);
  avisarCambio("esta-pestana");
}

/**
 * Todos los cambios pasan por aquí: se aplica el cambio sobre los datos en memoria
 * (que las otras pestañas mantienen al día con sus avisos), se guarda y se difunde.
 */
export function cambiar(funcion) {
  if (!estado) return undefined;
  const resultado = funcion(estado);
  difundir();
  return resultado;
}

export function reemplazar(nuevo) {
  estado = validar(nuevo);
  difundir();
}

export function borrarTodo() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que borrar.
  }
  estado = null;
  radio?.postMessage(null);
  avisarCambio("esta-pestana");
}

export function exportar() {
  return JSON.stringify({ app: "Corrillo", exportado: new Date().toISOString(), ...estado }, null, 2);
}

// ---------- Comprobar datos (al cargar y al importar un archivo) ----------

// Un id solo lleva letras, números, - y _: así nunca puede romper el HTML donde se escribe.
// (Comprobamos antes que sea texto, porque /regex/.test(null) convierte null en "null" y lo daría por bueno.)
const esId = (valor) => typeof valor === "string" && /^[\w-]{1,64}$/.test(valor);
const ES_COLOR = /^#[0-9a-f]{6}$/i;
const texto = (valor, maximo) => (typeof valor === "string" ? valor : "").slice(0, maximo);

export function validar(datos) {
  if (!datos || typeof datos !== "object" || !Array.isArray(datos.personas) || !Array.isArray(datos.canales) || !Array.isArray(datos.mensajes)) {
    throw new Error("El archivo no tiene el formato de una copia de Corrillo.");
  }
  const personas = datos.personas
    .filter((p) => p && esId(p.id) && texto(p.nombre, 40).trim())
    .map((p) => ({ id: p.id, nombre: texto(p.nombre, 40).trim(), color: ES_COLOR.test(p.color) ? p.color : PALETA[5].color }));
  const canales = datos.canales
    .filter((c) => c && esId(c.id) && texto(c.nombre, 40).trim())
    .map((c) => ({ id: c.id, nombre: texto(c.nombre, 40).trim(), descripcion: texto(c.descripcion, 200), archivado: c.archivado === true, creado: Number(c.creado) || 0 }));
  if (!personas.length || !canales.length) throw new Error("El archivo no tiene personas o canales.");

  const idsCanales = new Set(canales.map((c) => c.id));
  const mensajes = datos.mensajes
    .filter((m) => m && esId(m.id) && idsCanales.has(m.canal) && typeof m.texto === "string" && Number.isFinite(m.fecha))
    .map((m) => ({
      id: m.id,
      canal: m.canal,
      autor: esId(m.autor) ? m.autor : "desconocido",
      texto: texto(m.texto, 4000),
      fecha: m.fecha,
      editado: m.editado === true,
      padre: esId(m.padre) ? m.padre : null,
      reacciones: limpiarReacciones(m.reacciones),
    }));

  // lecturas[persona][canal] = fecha en la que esa persona leyó ese canal por última vez.
  const lecturas = {};
  for (const p of personas) {
    const suyas = datos.lecturas?.[p.id];
    lecturas[p.id] = {};
    if (suyas && typeof suyas === "object") {
      for (const [canalId, fecha] of Object.entries(suyas)) {
        if (idsCanales.has(canalId) && Number.isFinite(fecha)) lecturas[p.id][canalId] = fecha;
      }
    }
  }
  return { personas, canales, mensajes, lecturas };
}

// Reacciones: { "👍": ["id-persona", ...] }
function limpiarReacciones(reacciones) {
  const limpias = {};
  if (!reacciones || typeof reacciones !== "object") return limpias;
  for (const [emoji, ids] of Object.entries(reacciones)) {
    const validos = Array.isArray(ids) ? [...new Set(ids.filter((id) => esId(id)))] : [];
    if (emoji.length <= 16 && validos.length) limpias[emoji] = validos;
  }
  return limpias;
}

// ---------- Consultas ----------

export const persona = (id) => estado?.personas.find((p) => p.id === id) ?? null;
export const canal = (id) => estado?.canales.find((c) => c.id === id) ?? null;
export const mensaje = (id) => estado?.mensajes.find((m) => m.id === id) ?? null;

const porFecha = (a, b) => a.fecha - b.fecha;

// Mensajes principales de un canal (las respuestas de hilo van aparte).
export function mensajesDelCanal(canalId) {
  return estado.mensajes.filter((m) => m.canal === canalId && !m.padre).sort(porFecha);
}

export function respuestas(mensajeId) {
  return estado.mensajes.filter((m) => m.padre === mensajeId).sort(porFecha);
}

export function ultimaLectura(personaId, canalId) {
  return estado?.lecturas[personaId]?.[canalId] ?? 0;
}

// Mensajes de OTRAS personas escritos en el canal después de la última lectura.
// Las respuestas de hilo no cuentan: así un hilo no pone en negrita todo el canal.
export function noLeidos(canalId, personaId) {
  if (!estado) return 0;
  const desde = ultimaLectura(personaId, canalId);
  return estado.mensajes.filter((m) => m.canal === canalId && !m.padre && m.autor !== personaId && m.fecha > desde).length;
}

// ---------- Cambios ----------

// Id corto y único: prefijo + hora + azar (no hace falta nada más para una demo).
export const nuevoId = (prefijo) => `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// "Pedidos Web" → "pedidos-web": minúsculas, sin espacios ni símbolos raros.
export function nombreCanalLimpio(nombre) {
  return String(nombre ?? "")
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
}

export function crearCanal(nombre, descripcion) {
  return cambiar((e) => {
    const nuevo = { id: nuevoId("c"), nombre, descripcion, archivado: false, creado: Date.now() };
    e.canales.push(nuevo);
    return nuevo;
  });
}

export function editarCanal(id, cambios) {
  cambiar((e) => {
    const c = e.canales.find((x) => x.id === id);
    if (c) Object.assign(c, cambios);
  });
}

export function crearPersona(nombre, color) {
  return cambiar((e) => {
    const nueva = { id: nuevoId("p"), nombre, color };
    e.personas.push(nueva);
    e.lecturas[nueva.id] = {};
    return nueva;
  });
}

export function editarPersona(id, cambios) {
  cambiar((e) => {
    const p = e.personas.find((x) => x.id === id);
    if (p) Object.assign(p, cambios);
  });
}

// Sus mensajes se quedan: al no encontrar a su autor, la app los firma como "Persona eliminada".
export function borrarPersona(id) {
  cambiar((e) => {
    e.personas = e.personas.filter((p) => p.id !== id);
    delete e.lecturas[id];
  });
}

function marcar(e, personaId, canalId) {
  e.lecturas[personaId] ??= {};
  e.lecturas[personaId][canalId] = Date.now();
}

export function marcarLeido(personaId, canalId) {
  cambiar((e) => marcar(e, personaId, canalId));
}

export function enviarMensaje({ canal: canalId, autor, texto: contenido, padre = null }) {
  return cambiar((e) => {
    const nuevo = { id: nuevoId("m"), canal: canalId, autor, texto: contenido, fecha: Date.now(), editado: false, padre, reacciones: {} };
    e.mensajes.push(nuevo);
    if (!padre) marcar(e, autor, canalId); // quien escribe ya ha leído el canal
    return nuevo;
  });
}

export function editarMensaje(id, contenido) {
  cambiar((e) => {
    const m = e.mensajes.find((x) => x.id === id);
    if (m && m.texto !== contenido) {
      m.texto = contenido;
      m.editado = true;
    }
  });
}

// Borrar un mensaje con hilo borra también sus respuestas (si no, quedarían huérfanas).
export function borrarMensaje(id) {
  cambiar((e) => {
    e.mensajes = e.mensajes.filter((m) => m.id !== id && m.padre !== id);
  });
}

// Pulsar una reacción: si ya era tuya, se quita; si no, te sumas al contador.
export function alternarReaccion(id, emoji, personaId) {
  cambiar((e) => {
    const m = e.mensajes.find((x) => x.id === id);
    if (!m) return;
    const quienes = m.reacciones[emoji] ?? [];
    const posicion = quienes.indexOf(personaId);
    if (posicion >= 0) quienes.splice(posicion, 1);
    else quienes.push(personaId);
    if (quienes.length) m.reacciones[emoji] = quienes;
    else delete m.reacciones[emoji];
  });
}
