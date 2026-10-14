// acciones.js — Lo que pasa cuando haces algo: abrir un canal, cambiar de persona, abrir un hilo,
// buscar, escribir, editar o borrar. Cada acción cambia los datos o el estado de la pestaña y repinta.

import * as D from "./datos.js";
import { ui, $, guardarSesion, esMovil } from "./estado-ui.js";
import { renderTodo, ajustarAltura, actualizarBotonEnviar, DURACION_DESTELLO } from "./vistas.js";
import { aviso, confirmar } from "./avisos.js";

// ---------- Navegar ----------

export function abrirCanal(id, { mantenerPanel = false } = {}) {
  ui.canal = id;
  // Antes de marcarlo como leído, recordamos hasta dónde habías leído para dibujar la línea "Nuevos".
  ui.corte = D.noLeidos(id, ui.persona) > 0 ? D.ultimaLectura(ui.persona, id) : null;
  ui.lecturaPendiente = false;
  ui.desplazar = "inicio";
  if (ui.editando?.donde === "canal") ui.editando = null;
  if (!mantenerPanel && ui.panel?.tipo === "hilo" && D.mensaje(ui.panel.id)?.canal !== id) ui.panel = null;
  guardarSesion();
  cerrarLateral();
  renderTodo();
}

export function cambiarPersona(id) {
  cerrarMenuPersonas();
  if (id === ui.persona || !D.persona(id)) return;
  ui.persona = id;
  ui.editando = null;
  // El canal que tienes delante NO cuenta como leído para la nueva persona hasta que lo abra:
  // así se ve en negrita, igual que si los mensajes le acabaran de llegar.
  const sinLeer = D.noLeidos(ui.canal, id);
  ui.lecturaPendiente = sinLeer > 0;
  ui.corte = sinLeer > 0 ? D.ultimaLectura(id, ui.canal) : null;
  guardarSesion();
  renderTodo();
  aviso(`Ahora escribes como ${D.persona(id).nombre}`);
}

// Si te pones a escribir en el canal, ya lo estás leyendo.
export function empezarALeer() {
  if (!ui.lecturaPendiente) return;
  ui.lecturaPendiente = false;
  renderTodo();
}

export function abrirHilo(id, { desdeBusqueda = false } = {}) {
  ui.panel = { tipo: "hilo", id };
  ui.volverABusqueda = desdeBusqueda;
  ui.desplazarPanel = "final";
  if (ui.editando?.donde === "hilo") ui.editando = null;
  renderTodo();
  if (!esMovil()) $("texto-hilo").focus({ preventScroll: true });
}

export function cerrarPanel() {
  ui.panel = null;
  ui.volverABusqueda = false;
  if (ui.editando?.donde === "hilo") ui.editando = null;
  renderTodo();
}

export function volverABusqueda() {
  ui.panel = { tipo: "busqueda" };
  ui.volverABusqueda = false;
  renderTodo();
}

// ---------- Búsqueda ----------

export function buscar(texto) {
  const limpio = texto.trim();
  if (!limpio) {
    aviso("Escribe una palabra para buscar.");
    return;
  }
  ui.busqueda.texto = limpio;
  ui.panel = { tipo: "busqueda" };
  ui.volverABusqueda = false;
  ui.desplazarPanel = "arriba";
  cerrarLateral();
  renderTodo();
}

export function filtrarBusqueda(campo, valor) {
  ui.busqueda[campo] = valor;
  ui.desplazarPanel = "arriba";
  renderTodo();
}

// Saltar a un resultado: abre su canal (y su hilo, si es una respuesta), lo centra y lo ilumina 2 segundos.
export function irAMensaje(id) {
  const m = D.mensaje(id);
  if (!m) {
    aviso("Ese mensaje ya no existe.");
    return;
  }
  if (m.padre) {
    ui.panel = { tipo: "hilo", id: m.padre };
    ui.volverABusqueda = true;
  } else if (esMovil()) {
    ui.panel = null; // en el móvil el panel tapa el canal: lo cerramos para ver el mensaje
  }
  ui.destello = { id, desde: Date.now() };
  if (m.canal !== ui.canal) abrirCanal(m.canal, { mantenerPanel: true });
  else renderTodo();
  const zona = $(m.padre ? "panel-cuerpo" : "lista-mensajes");
  zona.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(() => {
    if (ui.destello?.id === id) ui.destello = null;
  }, DURACION_DESTELLO);
}

// ---------- Mensajes ----------

export function enviar(destino) {
  const caja = $(`texto-${destino}`);
  const texto = caja.value.trim();
  if (!texto || caja.disabled) return;
  const padre = destino === "hilo" && ui.panel?.tipo === "hilo" ? ui.panel.id : null;
  if (destino === "hilo" && !padre) return;
  const canalId = padre ? D.mensaje(padre)?.canal : ui.canal;
  if (!canalId || D.canal(canalId)?.archivado) return;

  caja.value = "";
  ajustarAltura(caja);
  if (destino === "hilo") {
    ui.desplazarPanel = "final";
  } else {
    ui.desplazar = "final";
    ui.corte = null;
    ui.lecturaPendiente = false;
  }
  D.enviarMensaje({ canal: canalId, autor: ui.persona, texto, padre });
  actualizarBotonEnviar(destino);
}

export function reaccionar(id, emoji) {
  D.alternarReaccion(id, emoji, ui.persona);
}

export function empezarEdicion(id, donde) {
  const m = D.mensaje(id);
  if (!m || m.autor !== ui.persona) return;
  ui.editando = { id, texto: m.texto, donde, enfocar: true };
  renderTodo();
}

export function guardarEdicion() {
  if (!ui.editando) return;
  const { id, texto } = ui.editando;
  const limpio = texto.trim();
  if (!limpio) {
    aviso("El mensaje no puede quedar vacío. Si quieres quitarlo, bórralo.", "error");
    return;
  }
  ui.editando = null;
  if (D.mensaje(id)?.texto === limpio) renderTodo(); // sin cambios: no se marca "(editado)"
  else D.editarMensaje(id, limpio);
}

export function cancelarEdicion() {
  ui.editando = null;
  renderTodo();
}

export async function borrarMensaje(id) {
  const m = D.mensaje(id);
  if (!m || m.autor !== ui.persona) return;
  const n = D.respuestas(id).length;
  const detalle = n === 0 ? "" : n === 1 ? " También se borrará su respuesta del hilo." : ` También se borrarán sus ${n} respuestas del hilo.`;
  const confirmado = await confirmar({
    titulo: "¿Borrar este mensaje?",
    texto: `Desaparecerá para todo el equipo de la demo.${detalle} No se puede deshacer.`,
    boton: "Borrar mensaje",
  });
  if (!confirmado) return;
  if (ui.panel?.tipo === "hilo" && ui.panel.id === id) ui.panel = ui.volverABusqueda ? { tipo: "busqueda" } : null;
  D.borrarMensaje(id);
  aviso("Mensaje borrado");
}

// ---------- Canales ----------

export function archivarCanal(id, archivar) {
  const nombre = D.canal(id)?.nombre;
  if (archivar) ui.verArchivados = true;
  D.editarCanal(id, { archivado: archivar });
  aviso(archivar ? `#${nombre} archivado: lo tienes en «Archivados».` : `#${nombre} vuelve a estar activo.`);
}

// ---------- Cuadro de escribir: formato ----------

export function insertarEnCaja(caja, texto) {
  const { selectionStart: inicio, selectionEnd: fin } = caja;
  caja.setRangeText(texto, inicio, fin, "end");
  caja.focus();
  caja.dispatchEvent(new Event("input", { bubbles: true }));
}

// Rodea lo seleccionado con * o _. Sin selección, pone las dos marcas y deja el cursor en medio.
export function envolverSeleccion(caja, marca) {
  const { selectionStart: inicio, selectionEnd: fin, value } = caja;
  const elegido = value.slice(inicio, fin);
  if (elegido.trim()) {
    const [, antes, centro, despues] = elegido.match(/^(\s*)([\s\S]*?)(\s*)$/);
    caja.setRangeText(`${antes}${marca}${centro}${marca}${despues}`, inicio, fin, "end");
  } else {
    caja.setRangeText(marca + marca, inicio, fin, "start");
    caja.selectionStart = caja.selectionEnd = inicio + 1;
  }
  caja.focus();
  caja.dispatchEvent(new Event("input", { bubbles: true }));
}

// ---------- Menús ----------

export function alternarMenuPersonas(forzar) {
  const menu = $("menu-personas");
  const abrir = forzar ?? menu.hidden;
  menu.hidden = !abrir;
  $("btn-persona").setAttribute("aria-expanded", String(abrir));
}
export const cerrarMenuPersonas = () => alternarMenuPersonas(false);

// En el móvil, la barra lateral se abre por encima con el botón de menú.
export function alternarLateral(forzar) {
  const lateral = $("lateral");
  const abrir = forzar ?? !lateral.classList.contains("abierta");
  lateral.classList.toggle("abierta", abrir);
  $("velo").hidden = !abrir;
  $("btn-menu").setAttribute("aria-expanded", String(abrir));
}
export const cerrarLateral = () => alternarLateral(false);
