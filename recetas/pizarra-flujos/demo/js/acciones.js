// Acciones de la app: lo que se puede hacer con un botón o con un atajo de teclado.
// Tanto los botones (interfaz.js) como el teclado (app.js) llaman a estas funciones,
// así cada acción está escrita una sola vez.

import { estado, cambio, seleccionados, nuevoId, aMundo } from "./estado.js";
import { ZOOM_MIN, ZOOM_MAX, PASOS_ZOOM, DESPLAZAMIENTO_DUPLICADO } from "./constantes.js";
import { recalcularFlechas, limitesDe, ajustarAlTexto, esForma } from "./geometria.js";
import * as historial from "./historial.js";
import { empaquetar, descargar, fechaHoy, leerDibujo } from "./archivos.js";
import { avisar, preguntar } from "./avisos.js";

/** Da por terminado un cambio: lo apunta en el historial (para deshacer) y avisa. */
export function confirmarCambio() {
  historial.confirmar(estado.elementos);
  cambio();
}

// ---------------------------------------------------------------------------
// Herramientas y estilo
// ---------------------------------------------------------------------------

export function elegirHerramienta(nombre) {
  estado.herramienta = nombre;
  // Con una herramienta que no es "seleccionar" se suelta la selección:
  // así el panel de estilo decide cómo serán los elementos nuevos.
  if (nombre !== "seleccionar") estado.seleccion.clear();
  estado.resaltado = null;
  cambio();
}

/** ¿Tiene sentido esta propiedad de estilo en este elemento? (un texto no tiene relleno ni grosor) */
export function admiteEstilo(el, propiedad) {
  if (propiedad === "trazo") return true;
  if (propiedad === "relleno") return esForma(el);
  return el.tipo !== "texto"; // grosor y tipo de línea
}

/** Cambia el estilo de lo seleccionado y también el de los próximos elementos. */
export function aplicarEstilo(propiedad, valor) {
  estado.estilo[propiedad] = valor;
  for (const el of seleccionados()) {
    if (admiteEstilo(el, propiedad)) el[propiedad] = valor;
  }
  recalcularFlechas(estado.elementos); // el grosor cambia el hueco entre flecha y forma
  confirmarCambio();
}

// ---------------------------------------------------------------------------
// Editar la selección
// ---------------------------------------------------------------------------

export function seleccionarTodo() {
  estado.herramienta = "seleccionar";
  estado.seleccion = new Set(estado.elementos.map((el) => el.id));
  cambio();
}

export function borrarElementos(ids) {
  if (ids.size === 0) return;
  estado.elementos = estado.elementos.filter((el) => !ids.has(el.id));
  estado.seleccion = new Set([...estado.seleccion].filter((id) => !ids.has(id)));
  recalcularFlechas(estado.elementos); // las flechas enganchadas a lo borrado se sueltan
  confirmarCambio();
}

export function borrarSeleccion() {
  borrarElementos(new Set(estado.seleccion));
}

/** Copia lo seleccionado 10 px más abajo y a la derecha, y selecciona la copia. */
export function duplicar() {
  const originales = seleccionados();
  if (originales.length === 0) return;
  const idNuevo = new Map(); // id original -> id de su copia
  const copias = originales.map((el) => {
    const copia = structuredClone(el);
    copia.id = nuevoId();
    idNuevo.set(el.id, copia.id);
    return copia;
  });
  for (const copia of copias) {
    if (copia.tipo === "flecha") {
      // Si su forma también se ha copiado, la copia de la flecha se engancha a la copia de la forma.
      // Si no, se suelta (si no, se quedaría encima de la original).
      copia.desde = (copia.desde && idNuevo.get(copia.desde)) || null;
      copia.hasta = (copia.hasta && idNuevo.get(copia.hasta)) || null;
    }
    moverElemento(copia, DESPLAZAMIENTO_DUPLICADO, DESPLAZAMIENTO_DUPLICADO);
  }
  estado.elementos.push(...copias);
  estado.seleccion = new Set(copias.map((c) => c.id));
  recalcularFlechas(estado.elementos);
  confirmarCambio();
}

/** Lleva lo seleccionado encima de todo (al final de la lista, que se pinta lo último). */
export function traerAlFrente() {
  const resto = estado.elementos.filter((el) => !estado.seleccion.has(el.id));
  estado.elementos = [...resto, ...seleccionados()];
  confirmarCambio();
}

/** Lleva lo seleccionado debajo de todo (al principio de la lista). */
export function enviarAlFondo() {
  const resto = estado.elementos.filter((el) => !estado.seleccion.has(el.id));
  estado.elementos = [...seleccionados(), ...resto];
  confirmarCambio();
}

export function moverElemento(el, dx, dy) {
  if (el.tipo === "flecha") {
    el.x1 += dx;
    el.y1 += dy;
    el.x2 += dx;
    el.y2 += dy;
  } else {
    el.x += dx;
    el.y += dy;
  }
}

/**
 * Al mover o redimensionar una flecha sin su forma, el extremo enganchado se suelta;
 * si no, la forma tiraría de él y la flecha no se podría mover.
 */
export function soltarFlechasQueSeMuevenSolas() {
  for (const el of seleccionados()) {
    if (el.tipo !== "flecha") continue;
    if (el.desde && !estado.seleccion.has(el.desde)) el.desde = null;
    if (el.hasta && !estado.seleccion.has(el.hasta)) el.hasta = null;
  }
}

/** Mueve la selección con el teclado. El paso al historial se hace al soltar la tecla. */
export function moverSeleccion(dx, dy) {
  const sel = seleccionados();
  if (sel.length === 0) return;
  soltarFlechasQueSeMuevenSolas();
  for (const el of sel) moverElemento(el, dx, dy);
  recalcularFlechas(estado.elementos);
  cambio();
}

// ---------------------------------------------------------------------------
// Deshacer y rehacer
// ---------------------------------------------------------------------------

export function deshacer() {
  historial.confirmar(estado.elementos); // por si quedaba un cambio sin apuntar
  const elementos = historial.deshacer();
  if (elementos) restaurar(elementos);
}

export function rehacer() {
  const elementos = historial.rehacer();
  if (elementos) restaurar(elementos);
}

function restaurar(elementos) {
  estado.elementos = elementos;
  // La selección solo puede contener elementos que existan.
  const existen = new Set(elementos.map((el) => el.id));
  estado.seleccion = new Set([...estado.seleccion].filter((id) => existen.has(id)));
  cambio();
}

// ---------------------------------------------------------------------------
// Cámara: desplazamiento y zoom
// ---------------------------------------------------------------------------

export function desplazar(dx, dy) {
  estado.camara.x += dx;
  estado.camara.y += dy;
  cambio();
}

/** Cambia el zoom manteniendo quieto el punto de la pantalla indicado (donde está el puntero). */
export function zoomHacia(zoomNuevo, punto) {
  const camara = estado.camara;
  const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomNuevo));
  const mundo = aMundo(punto.x, punto.y); // qué punto del dibujo hay bajo el puntero...
  camara.zoom = zoom;
  camara.x = punto.x - mundo.x * zoom; // ...y lo volvemos a poner bajo el puntero
  camara.y = punto.y - mundo.y * zoom;
  cambio();
}

const centroVentana = () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

/** Botones + y −: saltan al siguiente escalón de zoom, acercando hacia el centro de la ventana. */
export function zoomPaso(direccion) {
  const actual = estado.camara.zoom;
  const siguiente =
    direccion > 0
      ? PASOS_ZOOM.find((paso) => paso > actual + 0.001) ?? ZOOM_MAX
      : [...PASOS_ZOOM].reverse().find((paso) => paso < actual - 0.001) ?? ZOOM_MIN;
  zoomHacia(siguiente, centroVentana());
}

export function zoomAl100() {
  zoomHacia(1, centroVentana());
}

/** Centra el dibujo en la ventana (y lo aleja si no cabe). Se usa al abrir un archivo. */
export function encuadrar() {
  const camara = estado.camara;
  const b = limitesDe(estado.elementos);
  if (!b) {
    Object.assign(camara, { x: 0, y: 0, zoom: 1 });
  } else {
    const margen = 80;
    const libreX = Math.max(100, window.innerWidth - margen * 2);
    const libreY = Math.max(100, window.innerHeight - margen * 2);
    const zoom = Math.min(1, libreX / Math.max(1, b.x2 - b.x1), libreY / Math.max(1, b.y2 - b.y1));
    camara.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
    camara.x = window.innerWidth / 2 - ((b.x1 + b.x2) / 2) * camara.zoom;
    camara.y = window.innerHeight / 2 - ((b.y1 + b.y2) / 2) * camara.zoom;
  }
  cambio();
}

// ---------------------------------------------------------------------------
// Menú: archivos y preferencias
// ---------------------------------------------------------------------------

export function guardarArchivo() {
  const texto = JSON.stringify(empaquetar(estado, false), null, 2);
  descargar(new Blob([texto], { type: "application/json" }), `diagrama-${fechaHoy()}.json`);
  avisar("Dibujo guardado en tu carpeta de descargas.");
}

/** Abre un archivo .json (elegido en el menú o arrastrado a la pizarra). */
export async function abrirArchivo(archivo) {
  if (!/\.json$/i.test(archivo.name) && archivo.type !== "application/json") {
    avisar("Ese archivo no es un dibujo de Trazo. Busca uno que termine en .json.");
    return;
  }
  let resultado;
  try {
    resultado = leerDibujo(await archivo.text());
  } catch {
    resultado = { ok: false, mensaje: "No se ha podido leer el archivo. Prueba otra vez." };
  }
  // Si algo falla, avisamos y el dibujo actual no se toca.
  if (!resultado.ok) {
    avisar(resultado.mensaje);
    return;
  }
  if (estado.elementos.length > 0) {
    const aceptar = await preguntar(`Ya hay un dibujo en la pizarra. ¿Quieres sustituirlo por «${archivo.name}»?`, "Sustituir");
    if (!aceptar) return;
  }
  // Las medidas de los textos dependen de las fuentes de cada ordenador: se recalculan.
  for (const el of resultado.elementos) ajustarAlTexto(el);
  recalcularFlechas(resultado.elementos);
  estado.elementos = resultado.elementos;
  estado.seleccion.clear();
  estado.herramienta = "seleccionar";
  confirmarCambio(); // abrir también se puede deshacer
  encuadrar();
  avisar(`Abierto «${archivo.name}».`);
}

export function alternarCuadricula() {
  estado.preferencias.cuadricula = !estado.preferencias.cuadricula;
  cambio();
}

export function alternarModoOscuro() {
  estado.preferencias.oscuro = !estado.preferencias.oscuro;
  cambio();
}

export async function vaciarLienzo() {
  if (estado.elementos.length === 0) {
    avisar("El lienzo ya está vacío.");
    return;
  }
  const aceptar = await preguntar(
    "¿Vaciar el lienzo? Se borrará todo el dibujo. Podrás recuperarlo con Deshacer mientras no cierres la pestaña.",
    "Vaciar",
  );
  if (!aceptar) return;
  estado.elementos = [];
  estado.seleccion.clear();
  confirmarCambio();
}
