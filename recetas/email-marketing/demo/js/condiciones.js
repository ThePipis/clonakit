// Condiciones de filtrado: las usan los segmentos y las automatizaciones.
// Una condición es { campo, operador, valor }, por ejemplo:
//   { campo: "etiqueta", operador: "tiene", valor: "feria-2026" }
//   { campo: "<id del campo interés>", operador: "contiene", valor: "cerámica" }

import { estado, buscarCampo, todosLosCampos, valorCampo } from "./estado.js";
import { fechaISO, h, icono, limpiarEtiqueta, normalizar, rellenar } from "./ui.js";

// Qué operadores tiene sentido ofrecer según el tipo de dato.
export const OPERADORES = {
  etiqueta: [["tiene", "tiene la etiqueta"], ["no_tiene", "no tiene la etiqueta"]],
  texto: [["igual", "es igual a"], ["contiene", "contiene"]],
  numero: [["igual", "es igual a"], ["mayor", "es mayor que"], ["menor", "es menor que"]],
  fecha: [["anterior", "es anterior a"], ["posterior", "es posterior a"]],
};

export function tipoDe(campoId) {
  if (campoId === "etiqueta") return "etiqueta";
  return buscarCampo(campoId)?.tipo ?? "texto";
}

function aNumero(valor) {
  const n = parseFloat(String(valor ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Una condición a medio escribir (sin valor) no filtra: se ignora.
export function condicionCompleta(c) {
  if (!c?.campo || !c.operador || String(c.valor ?? "").trim() === "") return false;
  return c.campo === "etiqueta" || !!buscarCampo(c.campo);
}

export function cumpleCondicion(contacto, c) {
  const tipo = tipoDe(c.campo);
  const buscado = String(c.valor ?? "").trim();
  if (tipo === "etiqueta") {
    const tiene = (contacto.etiquetas ?? []).includes(limpiarEtiqueta(buscado));
    return c.operador === "no_tiene" ? !tiene : tiene;
  }
  const actual = valorCampo(contacto, c.campo);
  if (tipo === "numero") {
    const a = aNumero(actual);
    const b = aNumero(buscado);
    if (a === null || b === null) return false;
    return c.operador === "mayor" ? a > b : c.operador === "menor" ? a < b : a === b;
  }
  if (tipo === "fecha") {
    const a = fechaISO(actual);
    const b = fechaISO(buscado);
    if (!a || !b) return false;
    return c.operador === "anterior" ? a < b : a > b; // las fechas AAAA-MM-DD se comparan como texto
  }
  // Texto: sin distinguir mayúsculas ni acentos.
  return c.operador === "contiene" ? normalizar(actual).includes(normalizar(buscado)) : normalizar(actual) === normalizar(buscado);
}

// Un segmento sin condiciones completas incluye a todos los contactos.
export function cumpleSegmento(contacto, segmento) {
  const condiciones = (segmento?.condiciones ?? []).filter(condicionCompleta);
  if (!condiciones.length) return true;
  return segmento.modo === "alguna"
    ? condiciones.some((c) => cumpleCondicion(contacto, c))
    : condiciones.every((c) => cumpleCondicion(contacto, c));
}

export function contactosDe(segmento) {
  return estado.contactos.filter((c) => cumpleSegmento(c, segmento));
}

export function segmentosDe(contacto) {
  return estado.segmentos.filter((s) => cumpleSegmento(contacto, s));
}

// Frase legible: "interés contiene «cerámica»"
export function describirCondicion(c) {
  if (!condicionCompleta(c)) return "condición sin completar";
  const tipo = tipoDe(c.campo);
  const operador = OPERADORES[tipo].find(([v]) => v === c.operador)?.[1] ?? c.operador;
  const valor = tipo === "fecha" ? fechaISO(c.valor).split("-").reverse().join("/") : c.valor;
  if (tipo === "etiqueta") return `${operador} «${valor}»`;
  return `${buscarCampo(c.campo).nombre} ${operador} «${valor}»`;
}

export function condicionNueva(campo = "etiqueta") {
  return { campo, operador: OPERADORES[tipoDe(campo)][0][0], valor: "" };
}

// Fila editable: campo → operador → valor. El operador y el tipo de casilla
// del valor cambian según el tipo del campo elegido (texto, número o fecha).
// soloCampos: true oculta la opción "Etiqueta" (la usan las automatizaciones).
export function filaCondicion(c, { alCambiar, alBorrar, soloCampos = false }) {
  const fila = h("div", { class: "condicion" });

  function pintar() {
    const tipo = tipoDe(c.campo);
    const selectorCampo = h("select", { class: "entrada", "aria-label": "Campo", value: c.campo, onchange: (e) => {
      // Al cambiar de campo, el operador y el valor anteriores ya no sirven.
      Object.assign(c, condicionNueva(e.target.value));
      pintar();
      alCambiar();
    } },
      soloCampos ? null : h("option", { value: "etiqueta" }, "Etiqueta"),
      h("optgroup", { label: "Campos del contacto" }, todosLosCampos().map((campo) => h("option", { value: campo.id }, campo.nombre))));

    const selectorOperador = h("select", { class: "entrada", "aria-label": "Operador", value: c.operador, onchange: (e) => { c.operador = e.target.value; alCambiar(); } },
      OPERADORES[tipo].map(([valor, texto]) => h("option", { value: valor }, texto)));

    const atributos = { etiqueta: { type: "text", list: "lista-etiquetas", placeholder: "nombre de la etiqueta" }, numero: { type: "number", step: "any", placeholder: "número" }, fecha: { type: "date" }, texto: { type: "text", placeholder: "valor" } }[tipo];
    const entradaValor = h("input", { class: "entrada", "aria-label": "Valor", ...atributos, value: c.valor ?? "", oninput: (e) => { c.valor = e.target.value; alCambiar(); } });

    rellenar(fila, selectorCampo, selectorOperador, entradaValor,
      alBorrar ? h("button", { type: "button", class: "boton-icono", "aria-label": "Quitar condición", title: "Quitar condición", onclick: alBorrar }, icono("cerrar", 16)) : null);
  }
  pintar();
  return fila;
}
