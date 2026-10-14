// app.js — Punto de entrada de Corrillo.
// Prepara la página, conecta cada botón y cada tecla con su acción y arranca la demo.
//
// El resto del código vive en módulos dentro de js/:
//   datos.js     lo que se guarda (localStorage) y el aviso entre pestañas (BroadcastChannel)
//   vistas.js    cómo se pinta la pantalla a partir de los datos
//   acciones.js  lo que pasa cuando haces algo (abrir canal, cambiar de persona, buscar...)
//   dialogos.js  las ventanas (bienvenida, equipo, ajustes...)
//   emojis.js, formato.js, iconos.js, avisos.js, estado-ui.js y ejemplo.js: piezas de apoyo

import * as D from "./js/datos.js";
import { ui, $ } from "./js/estado-ui.js";
import { pintarIconos } from "./js/iconos.js";
import { aviso } from "./js/avisos.js";
import { renderTodo, asegurarSeleccion, htmlCompositor, ajustarAltura, actualizarBotonEnviar } from "./js/vistas.js";
import * as A from "./js/acciones.js";
import { iniciarSelectorEmojis, abrirSelectorEmojis } from "./js/emojis.js";
import * as V from "./js/dialogos.js";

// ---------- 1. Montar las piezas repetidas ----------

// Los dos cuadros de escribir (canal e hilo) son iguales: los genera la misma función.
document.querySelectorAll("[data-compositor]").forEach((hueco) => {
  hueco.outerHTML = htmlCompositor(hueco.dataset.compositor);
});
pintarIconos();

// En el móvil no cabe el texto largo de la búsqueda: usamos uno corto.
const pantallaEstrecha = matchMedia("(max-width: 760px)");
const ajustarBusqueda = () => {
  $("caja-busqueda").placeholder = pantallaEstrecha.matches ? "Buscar mensajes" : "Buscar en todos los canales e hilos";
};
pantallaEstrecha.addEventListener("change", ajustarBusqueda);
ajustarBusqueda();

// ---------- 2. Repintar cuando cambian los datos (en esta pestaña o en otra) ----------

D.alCambiar(() => {
  if (!D.estado) {
    limpiarPantalla();
    V.mostrarBienvenida();
    return;
  }
  V.cerrarBienvenida();
  renderTodo();
  V.refrescarDialogos();
});
D.alFallarGuardado(() => aviso("No se ha podido guardar: el almacenamiento del navegador está lleno o bloqueado.", "error"));

function limpiarPantalla() {
  for (const id of ["lista-canales", "zona-archivados", "lista-equipo", "lista-mensajes", "persona-avatar", "panel-cuerpo"]) $(id).innerHTML = "";
  for (const id of ["persona-nombre", "canal-nombre", "canal-descripcion"]) $(id).textContent = "";
  $("panel").hidden = true;
  $("cuerpo").classList.remove("con-panel");
  document.title = "Corrillo · chat de equipo";
}

// ---------- 3. Barra lateral ----------

$("lateral").addEventListener("click", (evento) => {
  const canal = evento.target.closest("[data-canal]");
  if (canal) return A.abrirCanal(canal.dataset.canal);
  const persona = evento.target.closest("[data-persona]");
  if (persona) return A.cambiarPersona(persona.dataset.persona);
  const accion = evento.target.closest("[data-accion]")?.dataset.accion;
  if (accion === "ver-archivados") {
    ui.verArchivados = !ui.verArchivados;
    renderTodo();
  } else if (accion === "gestionar-equipo") {
    A.cerrarMenuPersonas();
    V.abrirEquipo();
  }
});
$("btn-persona").addEventListener("click", () => A.alternarMenuPersonas());
$("btn-crear-canal").addEventListener("click", () => V.abrirDialogoCanal("crear"));
$("btn-crear-canal-mini").addEventListener("click", () => V.abrirDialogoCanal("crear"));
$("btn-equipo").addEventListener("click", V.abrirEquipo);
$("btn-modo-demo").addEventListener("click", V.abrirInfoDemo);
$("btn-ajustes").addEventListener("click", V.abrirAjustes);
$("btn-menu").addEventListener("click", () => A.alternarLateral());
$("velo").addEventListener("click", A.cerrarLateral);
// Clic fuera del desplegable de personas: se cierra.
document.addEventListener("pointerdown", (evento) => {
  if (!$("menu-personas").hidden && !evento.target.closest(".selector-persona")) A.cerrarMenuPersonas();
});

// ---------- 4. Canal, mensajes y panel derecho ----------

// Un solo "escuchador" para todos los botones de los mensajes (se llama delegación de eventos).
function alPulsarEnMensajes(evento, donde) {
  const boton = evento.target.closest("[data-accion]");
  const mensaje = evento.target.closest("[data-id]");
  if (!boton || !mensaje) return;
  const id = mensaje.dataset.id;
  switch (boton.dataset.accion) {
    case "reaccionar":
      abrirSelectorEmojis(boton, (emoji) => A.reaccionar(id, emoji), "Reaccionar con…");
      break;
    case "reaccion":
      A.reaccionar(id, boton.dataset.emoji);
      break;
    case "hilo":
      A.abrirHilo(id);
      break;
    case "editar":
      A.empezarEdicion(id, donde);
      break;
    case "borrar":
      A.borrarMensaje(id);
      break;
    case "guardar-edicion":
      A.guardarEdicion();
      break;
    case "cancelar-edicion":
      A.cancelarEdicion();
      break;
  }
}

$("lista-mensajes").addEventListener("click", (evento) => alPulsarEnMensajes(evento, "canal"));
$("panel-cuerpo").addEventListener("click", (evento) => {
  const resultado = evento.target.closest("[data-ir]");
  if (resultado) return A.irAMensaje(resultado.dataset.ir);
  alPulsarEnMensajes(evento, "hilo");
});

// Caja de edición de un mensaje: Intro guarda, Mayús+Intro hace salto de línea, Esc cancela.
document.addEventListener("input", (evento) => {
  if (!evento.target.matches("[data-edicion]") || !ui.editando) return;
  ui.editando.texto = evento.target.value;
  ajustarAltura(evento.target);
});
document.addEventListener("keydown", (evento) => {
  if (!evento.target.matches?.("[data-edicion]")) return;
  if (evento.key === "Enter" && !evento.shiftKey && !evento.isComposing) {
    evento.preventDefault();
    A.guardarEdicion();
  } else if (evento.key === "Escape") {
    evento.preventDefault();
    evento.stopPropagation();
    A.cancelarEdicion();
  }
});

$("btn-editar-canal").addEventListener("click", () => V.abrirDialogoCanal("editar"));
$("btn-archivar-canal").addEventListener("click", () => A.archivarCanal(ui.canal, true));
$("btn-desarchivar").addEventListener("click", () => A.archivarCanal(ui.canal, false));
$("btn-panel-cerrar").addEventListener("click", A.cerrarPanel);
$("btn-panel-volver").addEventListener("click", A.volverABusqueda);

// Búsqueda: se lanza con Intro (envío del formulario).
$("form-busqueda").addEventListener("submit", (evento) => {
  evento.preventDefault();
  A.buscar($("caja-busqueda").value);
});
$("filtro-canal").addEventListener("change", (evento) => A.filtrarBusqueda("canal", evento.target.value));
$("filtro-persona").addEventListener("change", (evento) => A.filtrarBusqueda("persona", evento.target.value));

// ---------- 5. Cuadros de escribir (canal e hilo) ----------

for (const destino of ["canal", "hilo"]) {
  const formulario = $(`compositor-${destino}`);
  const caja = $(`texto-${destino}`);
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    A.enviar(destino);
  });
  // Intro envía; Mayús+Intro deja el salto de línea normal. isComposing evita enviar a medio escribir un acento en algunos teclados.
  caja.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && !evento.shiftKey && !evento.isComposing) {
      evento.preventDefault();
      A.enviar(destino);
    }
  });
  caja.addEventListener("input", () => {
    ajustarAltura(caja);
    actualizarBotonEnviar(destino);
  });
  caja.addEventListener("focus", A.empezarALeer);
  formulario.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-formato]");
    if (!boton) return;
    const tipo = boton.dataset.formato;
    if (tipo === "negrita") A.envolverSeleccion(caja, "*");
    else if (tipo === "cursiva") A.envolverSeleccion(caja, "_");
    else if (tipo === "emoji") abrirSelectorEmojis(boton, (emoji) => A.insertarEnCaja(caja, emoji));
    else if (tipo === "enlace") insertarEnlace(caja);
  });
}

// Botón de enlace: pide la dirección y la escribe donde estaba el cursor (se convierte sola en enlace).
async function insertarEnlace(caja) {
  const { selectionStart: inicio, selectionEnd: fin } = caja;
  const elegido = caja.value.slice(inicio, fin).trim();
  const eraDireccion = /^(https?:\/\/|www\.)/i.test(elegido);
  const url = await V.pedirEnlace(eraDireccion ? elegido : "");
  caja.focus();
  if (!url) return;
  // Si habías seleccionado una dirección, se sustituye; si era otro texto, el enlace va detrás.
  if (!eraDireccion) caja.setSelectionRange(fin, fin);
  const anterior = caja.value[caja.selectionStart - 1];
  A.insertarEnCaja(caja, `${anterior && !/\s/.test(anterior) ? " " : ""}${url} `);
}

// ---------- 6. Teclado y pestaña ----------

// Esc cierra lo último que se abrió: menú de personas, barra lateral del móvil o panel derecho.
document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape" || evento.defaultPrevented || document.querySelector("dialog[open]")) return;
  if (!$("menu-personas").hidden) A.cerrarMenuPersonas();
  else if ($("lateral").classList.contains("abierta")) A.cerrarLateral();
  else if (ui.panel) A.cerrarPanel();
});

// Al volver a esta pestaña, repintamos (y marcamos como leído lo que tengas delante).
// Si mientras no mirabas llegaron mensajes al canal abierto, la línea «Nuevos» marca dónde empiezan.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !D.estado) return;
  if (!ui.lecturaPendiente && D.noLeidos(ui.canal, ui.persona) > 0) ui.corte = D.ultimaLectura(ui.persona, ui.canal);
  renderTodo();
});

// ---------- 7. Arrancar ----------

iniciarSelectorEmojis();
V.iniciarDialogos();

if (D.cargar()) {
  asegurarSeleccion();
  A.abrirCanal(ui.canal);
} else {
  limpiarPantalla();
  V.mostrarBienvenida();
}
