// Ventanas, avisos y menús propios de Taller.
// Usamos <dialog> en vez de confirm()/prompt() del navegador porque se ven con
// los colores de la app y no bloquean la página.

import { $, crear } from "./util.js";

// Abre una ventana y devuelve una promesa con el valor del botón pulsado ("" si se cancela).
// botones: [{ texto, valor, clase }]. El último es el principal (se activa con Intro).
export function abrirDialogo({ titulo, cuerpo, botones, clase = "", alAbrir, validar }) {
  return new Promise((resolver) => {
    const dialogo = crear("dialog", { class: `dialogo ${clase}`, "aria-label": titulo });
    const formulario = crear("form", { method: "dialog", class: "dialogo__caja" });
    formulario.append(crear("h2", { class: "dialogo__titulo", text: titulo }));
    if (typeof cuerpo === "string") formulario.append(crear("p", { class: "dialogo__texto", text: cuerpo }));
    else if (cuerpo) formulario.append(cuerpo);

    const pie = crear("div", { class: "dialogo__pie" });
    botones.forEach((boton, i) => {
      const esPrincipal = i === botones.length - 1;
      pie.append(
        crear("button", {
          // Solo el principal es "submit": así Intro lo pulsa a él y no a "Cancelar".
          type: esPrincipal ? "submit" : "button",
          value: boton.valor,
          class: `boton ${boton.clase ?? ""}`,
          text: boton.texto,
          onclick: esPrincipal ? null : () => dialogo.close(boton.valor),
        }),
      );
    });
    formulario.append(pie);
    dialogo.append(formulario);

    // Si hay que comprobar algo (por ejemplo, un nombre), lo hacemos antes de cerrar.
    formulario.addEventListener("submit", (evento) => {
      if (validar && evento.submitter?.value && !validar()) evento.preventDefault();
    });
    // Clic fuera de la caja (en el fondo oscuro) = cancelar.
    dialogo.addEventListener("click", (evento) => {
      if (evento.target === dialogo) dialogo.close("");
    });
    dialogo.addEventListener("close", () => {
      resolver(dialogo.returnValue);
      dialogo.remove();
    });

    document.body.append(dialogo);
    dialogo.returnValue = "";
    dialogo.showModal();
    alAbrir?.(dialogo);
  });
}

// "¿Seguro?" con un botón rojo. Devuelve true o false.
export async function confirmar(titulo, mensaje, { aceptar = "Borrar", peligro = true } = {}) {
  const valor = await abrirDialogo({
    titulo,
    cuerpo: mensaje,
    botones: [
      { texto: "Cancelar", valor: "" },
      { texto: aceptar, valor: "si", clase: peligro ? "boton--peligro" : "boton--principal" },
    ],
  });
  return valor === "si";
}

// Pide un texto (un nombre, por ejemplo). Devuelve el texto o null si se cancela.
// validar(texto) devuelve un mensaje de error o null si está bien.
export async function pedirTexto({ titulo, etiqueta, valor = "", aceptar = "Aceptar", placeholder = "", validar, seleccion }) {
  const campo = crear("input", { class: "campo", type: "text", value: valor, placeholder, spellcheck: "false", autocomplete: "off" });
  const error = crear("p", { class: "dialogo__error", role: "alert" });
  const cuerpo = crear("label", { class: "dialogo__etiqueta" }, [crear("span", { text: etiqueta }), campo, error]);

  const resultado = await abrirDialogo({
    titulo,
    cuerpo,
    botones: [
      { texto: "Cancelar", valor: "" },
      { texto: aceptar, valor: "ok", clase: "boton--principal" },
    ],
    alAbrir: () => {
      campo.focus();
      // Seleccionamos el nombre sin la extensión para poder reescribirlo directamente.
      if (seleccion) campo.setSelectionRange(...seleccion);
      else campo.select();
    },
    validar: () => {
      const problema = validar?.(campo.value.trim());
      error.textContent = problema ?? "";
      if (problema) campo.focus();
      return !problema;
    },
  });
  return resultado === "ok" ? campo.value.trim() : null;
}

// ---------- Avisos breves (abajo de la pantalla) ----------

export function notificar(texto, tipo = "ok") {
  let zona = $(".avisos");
  if (!zona) {
    zona = crear("div", { class: "avisos", "aria-live": "polite" });
    document.body.append(zona);
  }
  const aviso = crear("div", { class: `aviso aviso--${tipo}`, text: texto });
  zona.append(aviso);
  while (zona.childElementCount > 3) zona.firstElementChild.remove(); // como mucho tres a la vez
  setTimeout(() => aviso.classList.add("aviso--saliendo"), 2600);
  setTimeout(() => aviso.remove(), 3000);
}

// ---------- Menú contextual (clic derecho o botón ⋯) ----------

let menuAbierto = null;

export function cerrarMenu() {
  menuAbierto?.remove();
  menuAbierto = null;
}

// opciones: [{ texto, accion, peligro }] o "-" para una línea separadora.
export function abrirMenu(x, y, opciones) {
  cerrarMenu();
  const menu = crear("div", { class: "menu", role: "menu" });
  for (const opcion of opciones) {
    if (opcion === "-") {
      menu.append(crear("div", { class: "menu__separador", role: "separator" }));
      continue;
    }
    menu.append(
      crear("button", {
        type: "button",
        role: "menuitem",
        class: `menu__opcion${opcion.peligro ? " menu__opcion--peligro" : ""}`,
        text: opcion.texto,
        onclick: () => {
          cerrarMenu();
          opcion.accion();
        },
      }),
    );
  }
  document.body.append(menu);
  menuAbierto = menu;

  // Lo colocamos donde se hizo clic, sin que se salga de la pantalla.
  const { width, height } = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(x, innerWidth - width - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(y, innerHeight - height - 8))}px`;
  menu.querySelector("button")?.focus();

  // Flechas para moverse por el menú y Escape para cerrarlo.
  menu.addEventListener("keydown", (evento) => {
    const botones = [...menu.querySelectorAll("button")];
    const actual = botones.indexOf(document.activeElement);
    if (evento.key === "Escape") cerrarMenu();
    else if (evento.key === "ArrowDown") botones[(actual + 1) % botones.length].focus();
    else if (evento.key === "ArrowUp") botones[(actual - 1 + botones.length) % botones.length].focus();
    else return;
    evento.preventDefault();
  });
}

// Cualquier clic fuera del menú, o mover la ventana, lo cierra.
document.addEventListener("pointerdown", (evento) => {
  if (menuAbierto && !menuAbierto.contains(evento.target)) cerrarMenu();
});
addEventListener("resize", cerrarMenu);
addEventListener("blur", cerrarMenu);
