// avisos.js — Mensajitos flotantes ("Canal creado") y la ventana de confirmación ("¿Borrar?").

import { $ } from "./estado-ui.js";

// Aviso que aparece abajo unos segundos y desaparece solo.
export function aviso(texto, tipo = "") {
  const caja = $("avisos");
  const elemento = document.createElement("div");
  elemento.className = `aviso ${tipo}`;
  elemento.setAttribute("role", "status");
  elemento.textContent = texto;
  caja.append(elemento);
  // Como mucho 3 avisos a la vez: si llegan más seguidos, el más antiguo se va.
  while (caja.children.length > 3) caja.firstElementChild.remove();
  // La caja es un "popover": así el aviso se ve por encima incluso de una ventana abierta.
  if (caja.showPopover && !caja.matches(":popover-open")) caja.showPopover();
  setTimeout(() => {
    elemento.classList.add("saliendo");
    setTimeout(() => {
      elemento.remove();
      if (!caja.children.length && caja.hidePopover && caja.matches(":popover-open")) caja.hidePopover();
    }, 300);
  }, 2800);
}

/**
 * Pregunta antes de hacer algo que no se puede deshacer.
 * Devuelve una promesa: true si la persona confirma, false si cancela (botón, Esc o clic fuera).
 */
export function confirmar({ titulo, texto, boton = "Borrar" }) {
  const dialogo = $("dlg-confirmar");
  $("confirmar-titulo").textContent = titulo;
  $("confirmar-texto").textContent = texto;
  $("confirmar-si").textContent = boton;
  dialogo.returnValue = "";
  dialogo.showModal();
  $("confirmar-no").focus();
  return new Promise((resolver) => {
    dialogo.addEventListener("close", () => resolver(dialogo.returnValue === "si"), { once: true });
  });
}
