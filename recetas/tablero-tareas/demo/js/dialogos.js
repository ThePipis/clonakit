// Ventanas de pregunta (confirmar, pedir un texto, elegir), avisos flotantes y menús "⋯".
// Usamos <dialog> y popover, que ya traen de serie el cierre con Esc y el foco del teclado.

import { $, el } from "./util.js";

// Hace que un <dialog> se cierre al pulsar en el fondo oscuro de alrededor.
// Comprobamos dónde empezó la pulsación para no cerrarlo si alguien selecciona texto y suelta fuera.
export function cerrarAlPulsarFuera(dialogo, alCerrar = () => dialogo.close()) {
  let empezoFuera = false;
  dialogo.addEventListener("pointerdown", (e) => (empezoFuera = e.target === dialogo));
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo && empezoFuera) alCerrar();
    empezoFuera = false;
  });
}

/* ---------- Preguntas ---------- */

const dialogo = $("dialogo-pregunta");
cerrarAlPulsarFuera(dialogo);

// Ventana genérica: un título, un mensaje, botones y (opcional) un campo de texto.
// Devuelve una promesa con el valor del botón pulsado, o null si se cancela (Esc, clic fuera o "Cancelar").
export function preguntar({ titulo, mensaje = "", opciones, campo = null }) {
  return new Promise((resolver) => {
    const entrada = campo
      ? el("input", { class: "campo", type: "text", value: campo.valor ?? "", maxlength: "120", required: true, "aria-label": campo.etiqueta })
      : null;
    // El botón principal va primero en el HTML (así Intro lo activa) y el CSS lo pinta a la derecha.
    const botones = opciones.map((o) =>
      el("button", { class: `boton ${o.estilo ?? "secundario"}`, value: o.valor, formnovalidate: !o.valor }, o.texto),
    );
    const formulario = el(
      "form",
      { method: "dialog", class: "pregunta" },
      el("h2", { class: "pregunta-titulo", id: "pregunta-titulo" }, titulo),
      mensaje && el("p", { class: "pregunta-mensaje" }, mensaje),
      entrada,
      el("div", { class: "pregunta-botones" }, botones),
    );
    dialogo.replaceChildren(formulario);
    dialogo.returnValue = "";
    dialogo.addEventListener(
      "close",
      () => {
        const valor = dialogo.returnValue;
        if (!valor) return resolver(null);
        resolver(campo ? entrada.value.trim() || null : valor);
      },
      { once: true },
    );
    dialogo.showModal();
    if (entrada) entrada.select();
    else botones[0]?.focus();
  });
}

const CANCELAR = { texto: "Cancelar", valor: "" };

export async function confirmar(titulo, mensaje, textoBoton = "Borrar") {
  const respuesta = await preguntar({ titulo, mensaje, opciones: [{ texto: textoBoton, valor: "si", estilo: "peligro" }, CANCELAR] });
  return respuesta === "si";
}

export function pedirTexto(titulo, valor = "", etiqueta = titulo) {
  return preguntar({ titulo, campo: { valor, etiqueta }, opciones: [{ texto: "Guardar", valor: "ok", estilo: "principal" }, CANCELAR] });
}

export function elegir(titulo, mensaje, opciones) {
  return preguntar({ titulo, mensaje, opciones: [...opciones, CANCELAR] });
}

/* ---------- Avisos flotantes ---------- */

const zonaAvisos = $("avisos");
const hayPopover = typeof zonaAvisos.showPopover === "function";

// Muestra un mensaje corto abajo de la pantalla durante unos segundos.
export function avisar(texto, tipo = "info") {
  const aviso = el("div", { class: `aviso aviso-${tipo}`, role: tipo === "error" ? "alert" : "status" }, texto);
  zonaAvisos.append(aviso);
  // Como mucho tres a la vez: si se acumulan, quitamos los más antiguos.
  while (zonaAvisos.children.length > 3) zonaAvisos.firstElementChild.remove();
  // Los avisos van en la "capa superior" (popover) para verse incluso encima de una ventana abierta.
  if (hayPopover) {
    if (zonaAvisos.matches(":popover-open")) zonaAvisos.hidePopover();
    zonaAvisos.showPopover();
  }
  setTimeout(() => {
    aviso.classList.add("saliendo");
    setTimeout(() => {
      aviso.remove();
      if (hayPopover && !zonaAvisos.children.length && zonaAvisos.matches(":popover-open")) zonaAvisos.hidePopover();
    }, 300);
  }, tipo === "error" ? 6000 : 3500);
}

/* ---------- Menús "⋯" y paneles flotantes ---------- */

// Los menús son "popover": el navegador los cierra solo al pulsar fuera o con Esc.
// Detalle a cuidar: al pulsar el mismo botón con el menú abierto, el navegador lo cierra
// justo antes del clic y el clic lo volvería a abrir. Por eso, al apretar el puntero,
// apuntamos si el panel estaba abierto por ese mismo botón.
const paneles = new Map(); // panel → { boton, pulsadoAbierto }

document.addEventListener(
  "pointerdown",
  (e) => {
    for (const [panel, estado] of paneles) {
      estado.pulsadoAbierto = panel.matches(":popover-open") && Boolean(estado.boton?.contains(e.target));
    }
  },
  true, // fase de captura: se ejecuta antes de que el navegador cierre el panel
);

function prepararPanel(panel) {
  if (paneles.has(panel)) return paneles.get(panel);
  const estado = { boton: null, pulsadoAbierto: false };
  panel.addEventListener("beforetoggle", (e) => {
    if (e.newState !== "closed" || !estado.boton) return;
    const boton = estado.boton;
    boton.setAttribute("aria-expanded", "false");
    estado.boton = null;
    // Si el foco estaba dentro del panel, vuelve al botón que lo abrió (importante con teclado).
    if (!panel.contains(document.activeElement)) return;
    queueMicrotask(() => {
      const activo = document.activeElement;
      if (!activo || activo === document.body || panel.contains(activo)) boton.focus();
    });
  });
  paneles.set(panel, estado);
  return estado;
}

export function cerrarPanel(panel) {
  if (panel.matches(":popover-open")) panel.hidePopover();
}

// Abre (o cierra, si ya estaba abierto) un panel flotante pegado a un botón.
// "construir" rellena el panel justo antes de mostrarlo, con los datos del momento.
export function alternarPanel(panel, boton, construir) {
  const estado = prepararPanel(panel);
  const cerrarSolo = estado.pulsadoAbierto || (panel.matches(":popover-open") && estado.boton === boton);
  estado.pulsadoAbierto = false;
  if (cerrarSolo) return cerrarPanel(panel); // segundo clic en el mismo botón: solo cerrar
  cerrarPanel(panel);
  construir();
  estado.boton = boton;
  boton.setAttribute("aria-expanded", "true");
  panel.showPopover();
  colocarJuntoA(panel, boton);
  panel.querySelector("button, input")?.focus();
}

const menu = $("menu");
export const cerrarMenu = () => cerrarPanel(menu);

// Abre un menú de opciones. Cada opción: { texto, icono, peligro, accion } o un nodo ya hecho.
export function abrirMenu(boton, opciones, titulo = "") {
  alternarPanel(menu, boton, () => {
    const contenido = opciones.filter(Boolean).map((o) => {
      if (o instanceof Node) return o;
      return el(
        "button",
        {
          class: `menu-opcion${o.peligro ? " peligro" : ""}`,
          type: "button",
          onclick: () => {
            cerrarMenu();
            o.accion();
          },
        },
        el("span", { class: "icono", html: o.icono ?? "" }),
        o.texto,
      );
    });
    menu.replaceChildren(...(titulo ? [el("p", { class: "menu-titulo" }, titulo)] : []), ...contenido);
  });
}

// Coloca un panel flotante debajo de un botón sin que se salga de la pantalla.
export function colocarJuntoA(panel, boton) {
  const r = boton.getBoundingClientRect();
  const ancho = panel.offsetWidth;
  const alto = panel.offsetHeight;
  const izquierda = Math.max(8, Math.min(r.right - ancho, window.innerWidth - ancho - 8));
  let arriba = r.bottom + 6;
  if (arriba + alto > window.innerHeight - 8) arriba = Math.max(8, r.top - alto - 6);
  panel.style.left = `${izquierda}px`;
  panel.style.top = `${arriba}px`;
}
