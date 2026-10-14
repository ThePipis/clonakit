// Piezas de interfaz que usan todas las pantallas: crear elementos, iconos,
// avisos, ventanas modales, panel lateral, descargas y pequeños formatos.

export const $ = (selector, raiz = document) => raiz.querySelector(selector);

// Crea un elemento HTML de forma segura. Ejemplo:
//   h("button", { class: "boton", onclick: guardar }, "Guardar")
// Los textos se añaden como texto (nunca como HTML), así nadie puede colar
// código en la página escribiendo un nombre de contacto raro.
export function h(etiqueta, props, ...hijos) {
  const el = document.createElement(etiqueta);
  aplicarProps(el, props);
  añadirHijos(el, hijos);
  // value y checked se ponen al final: un <select> necesita tener ya sus opciones.
  if (props && "value" in props && props.value != null) el.value = props.value;
  if (props && "checked" in props) el.checked = !!props.checked;
  return el;
}

// Igual que h(), pero para dibujos SVG (necesitan su propio "espacio de nombres").
export function svg(etiqueta, props, ...hijos) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", etiqueta);
  for (const [clave, valor] of Object.entries(props ?? {})) {
    if (valor != null) el.setAttribute(clave, valor);
  }
  añadirHijos(el, hijos);
  return el;
}

function aplicarProps(el, props) {
  for (const [clave, valor] of Object.entries(props ?? {})) {
    if (valor == null || valor === false || clave === "value" || clave === "checked") continue;
    if (clave === "class") el.className = valor;
    else if (clave === "text") el.textContent = valor;
    else if (clave === "html") el.innerHTML = valor; // solo para HTML que ya hemos limpiado
    else if (clave === "dataset") Object.assign(el.dataset, valor);
    else if (clave === "style" && typeof valor === "object") Object.assign(el.style, valor);
    else if (clave.startsWith("on") && typeof valor === "function") el.addEventListener(clave.slice(2), valor);
    else el.setAttribute(clave, valor === true ? "" : valor);
  }
}

// Vacía un elemento y le pone hijos nuevos, saltándose los null (a diferencia
// de replaceChildren, que escribiría la palabra "null" en pantalla).
export function rellenar(el, ...hijos) {
  el.replaceChildren();
  añadirHijos(el, hijos);
  return el;
}

function añadirHijos(el, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo == null || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : String(hijo));
  }
}

// ---------- Iconos ----------
// Dibujos propios de trazo fino en una cuadrícula de 24×24.
const ICONOS = {
  logo: ["M3.5 6h17", "M7 12h10", "M10.5 18h3"],
  contactos: ["M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6", "M16 4.6a3.3 3.3 0 0 1 0 6.4", "M18 14.3c2.1.6 3.5 2.6 3.5 5.7"],
  segmentos: ["M3.5 5h17l-6.5 7.5v5.5l-4 2.5v-8z"],
  emails: ["M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5z", "M3.6 6.4l8.4 6.4 8.4-6.4"],
  automatizaciones: ["M6 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", "M6 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", "M17 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", "M6 7v10", "M17 7v1a4 4 0 0 1-4 4H6"],
  ajustes: ["M4 7h9", "M19 7h1", "M16 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", "M4 17h1", "M11 17h9", "M8 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"],
  buscar: ["M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z", "M16 16l4.5 4.5"],
  mas: ["M12 5v14", "M5 12h14"],
  subir: ["M12 19V5", "M6.5 10.5L12 5l5.5 5.5"],
  bajar: ["M12 5v14", "M6.5 13.5L12 19l5.5-5.5"],
  duplicar: ["M9.5 8h9A1.5 1.5 0 0 1 20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 18.5v-9A1.5 1.5 0 0 1 9.5 8z", "M5 16h-.5A1.5 1.5 0 0 1 3 14.5v-9A1.5 1.5 0 0 1 4.5 4h9A1.5 1.5 0 0 1 15 5.5V6"],
  borrar: ["M4 7h16", "M10 3.5h4", "M6.5 7l1 12.5A1.6 1.6 0 0 0 9 21h6a1.6 1.6 0 0 0 1.5-1.5L17.5 7", "M10 11v6", "M14 11v6"],
  arrastrar: ["M9 6h.01", "M15 6h.01", "M9 12h.01", "M15 12h.01", "M9 18h.01", "M15 18h.01"],
  cerrar: ["M6 6l12 12", "M18 6L6 18"],
  importar: ["M12 15V4", "M7 9l5-5 5 5", "M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"],
  exportar: ["M12 4v11", "M7 10l5 5 5-5", "M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"],
  etiqueta: ["M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2-8.8 8.8z", "M8 7.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z"],
  escritorio: ["M4 4.5h16A1 1 0 0 1 21 5.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z", "M9 20h6", "M12 15.5V20"],
  movil: ["M7.5 2.5h9A1.5 1.5 0 0 1 18 4v16a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V4a1.5 1.5 0 0 1 1.5-1.5z", "M11 18.5h2"],
  reloj: ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z", "M12 7.5V12l3 2"],
  enviar: ["M21 3L10.5 13.5", "M21 3l-6.5 18-4-7.5-7.5-4z"],
  condicion: ["M12 3l9 9-9 9-9-9z", "M10 10a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.4", "M12 15.6v.1"],
  fin: ["M5.5 21V4", "M5.5 4h12l-2.5 4.5 2.5 4.5h-12"],
  rayo: ["M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"],
  probar: ["M7.5 4.8v14.4a.6.6 0 0 0 .9.5l11.2-7.2a.6.6 0 0 0 0-1L8.4 4.3a.6.6 0 0 0-.9.5z"],
  candado: ["M6.5 10.5h11A1.5 1.5 0 0 1 19 12v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V12a1.5 1.5 0 0 1 1.5-1.5z", "M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"],
  titulo: ["M6 5v14", "M18 5v14", "M6 12h12"],
  texto: ["M4 6h16", "M4 10h16", "M4 14h16", "M4 18h10"],
  imagen: ["M4.5 4.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z", "M9 7.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z", "M20.5 15.5l-5-5-11 9"],
  boton: ["M5.5 7h13A2.5 2.5 0 0 1 21 9.5v4a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 13.5v-4A2.5 2.5 0 0 1 5.5 7z", "M8 11.5h8"],
  separador: ["M3 12h18", "M8 6.5h8", "M8 17.5h8"],
  espacio: ["M12 4v16", "M8.5 7.5L12 4l3.5 3.5", "M8.5 16.5L12 20l3.5-3.5"],
  pie: ["M5 3.5h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z", "M4 14.5h16", "M7.5 17.5h9"],
  ojo: ["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", "M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z"],
  alerta: ["M12 3.5L2.5 20h19z", "M12 10v4.5", "M12 17.3v.1"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  atras: ["M19 12H5", "M11 6l-6 6 6 6"],
  archivo: ["M6.5 3h7.5l4.5 4.5V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M14 3v4.5h4.5"],
  restaurar: ["M4.5 12a7.5 7.5 0 1 0 2.4-5.5", "M4.5 4v4.5H9"],
  columnas: ["M4.5 4.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z", "M10 4.5v15"],
  variable: ["M8.5 4C6.5 4 6 5 6 7v2c0 1.6-1 3-2.5 3C5 12 6 13.4 6 15v2c0 2 .5 3 2.5 3", "M15.5 4c2 0 2.5 1 2.5 3v2c0 1.6 1 3 2.5 3-1.5 0-2.5 1.4-2.5 3v2c0 2-.5 3-2.5 3"],
  usuario: ["M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"],
  editar: ["M4 20h4L19.3 8.7a2.1 2.1 0 0 0-3-3L5 17z", "M14.5 7.5l3 3"],
  enlace: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
};

export function icono(nombre, tamano = 18) {
  const trazos = ICONOS[nombre] ?? ICONOS.alerta;
  return svg(
    "svg",
    { class: `icono icono-${nombre}`, width: tamano, height: tamano, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": nombre === "logo" ? 2.6 : 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    trazos.map((d) => svg("path", { d })),
  );
}

// ---------- Avisos breves (abajo a la derecha) ----------
export function aviso(texto, tipo = "ok") {
  const caja = h("div", { class: `aviso aviso-${tipo}`, role: tipo === "error" ? "alert" : "status" }, icono(tipo === "error" ? "alerta" : "check", 16), h("span", {}, texto));
  const zona = $("#avisos");
  zona.append(caja);
  // Como mucho tres avisos a la vez: los más antiguos se van.
  while (zona.children.length > 3) zona.firstElementChild.remove();
  setTimeout(() => caja.classList.add("saliendo"), 3200);
  setTimeout(() => caja.remove(), 3600);
}

// ---------- Ventanas modales y panel lateral ----------
// Guardamos una pila para que la tecla Escape cierre solo la ventana de arriba.
const pila = [];

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pila.length) {
    e.preventDefault();
    pila.at(-1).cerrar();
  }
});

// Abre una ventana. Devuelve { cuerpo, pie, cerrar } para que quien la abre
// pueda rellenarla o cambiar su contenido (como el asistente de importación).
// lateral: true la convierte en un panel que entra por la derecha.
export function abrirModal({ titulo, contenido, botones = [], clase = "", lateral = false, antesDeCerrar, alCerrar }) {
  const focoAnterior = document.activeElement;
  const cuerpo = h("div", { class: "modal-cuerpo" }, contenido);
  const pie = h("div", { class: "modal-pie" });
  const tituloEl = h("h2", { class: "modal-titulo" }, titulo);
  const caja = h("div", { class: `modal ${lateral ? "modal-lateral" : ""} ${clase}`, role: "dialog", "aria-modal": "true", "aria-label": titulo },
    h("div", { class: "modal-cabecera" }, tituloEl, h("button", { class: "boton-icono", "aria-label": "Cerrar", title: "Cerrar", onclick: () => api.cerrar() }, icono("cerrar"))),
    cuerpo,
    pie,
  );
  const fondo = h("div", { class: `modal-fondo ${lateral ? "fondo-lateral" : ""}` }, caja);
  // Cerrar al pulsar fuera de la caja (solo si se pulsa y se suelta fuera).
  let pulsadoFuera = false;
  fondo.addEventListener("pointerdown", (e) => (pulsadoFuera = e.target === fondo));
  fondo.addEventListener("click", (e) => { if (e.target === fondo && pulsadoFuera) api.cerrar(); });

  const api = {
    caja, cuerpo, pie, tituloEl,
    async cerrar(forzar = false) {
      if (!forzar && antesDeCerrar && !(await antesDeCerrar())) return;
      const i = pila.indexOf(api);
      if (i !== -1) pila.splice(i, 1);
      fondo.classList.add("cerrando");
      setTimeout(() => fondo.remove(), 160);
      alCerrar?.();
      if (focoAnterior?.isConnected) focoAnterior.focus({ preventScroll: true });
    },
    ponerBotones(lista) {
      pie.replaceChildren(...lista.map((b) => (b instanceof Node ? b : h("button", { class: `boton ${b.clase ?? ""}`, onclick: b.accion, disabled: b.desactivado }, b.icono ? icono(b.icono, 16) : null, b.texto))));
      pie.hidden = lista.length === 0;
    },
  };
  api.ponerBotones(botones);
  pila.push(api);
  $("#capa-modales").append(fondo);
  // Ponemos el foco en el primer campo para poder escribir sin usar el ratón.
  requestAnimationFrame(() => {
    const primero = caja.querySelector("[autofocus], .modal-cuerpo input:not([type=checkbox]):not([type=file]), .modal-cuerpo textarea, .modal-cuerpo select") ?? caja.querySelector(".modal-pie .primario") ?? caja;
    if (!caja.contains(document.activeElement)) primero.focus?.({ preventScroll: true });
  });
  return api;
}

// Pregunta de sí o no. Devuelve una promesa con true o false.
export function confirmar({ titulo, texto, aceptar = "Aceptar", cancelar = "Cancelar", peligro = false }) {
  return new Promise((resolver) => {
    let respuesta = false;
    const modal = abrirModal({
      titulo, clase: "modal-pequeno", contenido: h("p", { class: "texto-modal" }, texto),
      alCerrar: () => resolver(respuesta),
    });
    modal.ponerBotones([
      { texto: cancelar, clase: "secundario", accion: () => modal.cerrar() },
      { texto: aceptar, clase: peligro ? "peligro" : "primario", accion: () => { respuesta = true; modal.cerrar(); } },
    ]);
  });
}

// Pregunta con varias opciones (por ejemplo, qué rama conservar).
export function elegir({ titulo, texto, opciones }) {
  return new Promise((resolver) => {
    let respuesta = null;
    const modal = abrirModal({ titulo, clase: "modal-pequeno", contenido: h("p", { class: "texto-modal" }, texto), alCerrar: () => resolver(respuesta) });
    modal.ponerBotones([
      { texto: "Cancelar", clase: "secundario", accion: () => modal.cerrar() },
      ...opciones.map((o) => ({ texto: o.texto, clase: o.clase ?? "secundario", accion: () => { respuesta = o.valor; modal.cerrar(); } })),
    ]);
  });
}

// Pide un texto corto (por ejemplo, el nombre de un segmento nuevo).
export function pedirTexto({ titulo, etiqueta, valor = "", aceptar = "Crear" }) {
  return new Promise((resolver) => {
    let respuesta = null;
    const entrada = h("input", { type: "text", class: "entrada", value: valor, autofocus: true });
    const aceptarYCerrar = () => {
      if (!entrada.value.trim()) return entrada.focus();
      respuesta = entrada.value.trim();
      modal.cerrar();
    };
    entrada.addEventListener("keydown", (e) => { if (e.key === "Enter") aceptarYCerrar(); });
    const modal = abrirModal({ titulo, clase: "modal-pequeno", contenido: h("label", { class: "campo" }, h("span", { class: "campo-etiqueta" }, etiqueta), entrada), alCerrar: () => resolver(respuesta) });
    modal.ponerBotones([
      { texto: "Cancelar", clase: "secundario", accion: () => modal.cerrar() },
      { texto: aceptar, clase: "primario", accion: aceptarYCerrar },
    ]);
    requestAnimationFrame(() => entrada.select());
  });
}

// Menú flotante junto a un botón (por ejemplo, el "+" del diagrama).
export function menuFlotante(ancla, opciones) {
  document.querySelector(".menu-flotante")?.remove();
  const menu = h("div", { class: "menu-flotante", role: "menu" },
    opciones.map((o) => h("button", { class: "menu-flotante-opcion", role: "menuitem", onclick: () => { cerrarMenu(); o.accion(); } }, icono(o.icono, 16), h("span", {}, o.texto))));
  document.body.append(menu);
  const r = ancla.getBoundingClientRect();
  const ancho = menu.offsetWidth, alto = menu.offsetHeight;
  menu.style.left = `${Math.max(8, Math.min(window.innerWidth - ancho - 8, r.left + r.width / 2 - ancho / 2))}px`;
  menu.style.top = `${r.bottom + alto + 8 > window.innerHeight ? Math.max(8, r.top - alto - 6) : r.bottom + 6}px`;
  menu.querySelector("button")?.focus();
  const fuera = (e) => { if (!menu.contains(e.target)) cerrarMenu(); };
  const tecla = (e) => { if (e.key === "Escape") cerrarMenu(); };
  function cerrarMenu() {
    menu.remove();
    document.removeEventListener("pointerdown", fuera, true);
    document.removeEventListener("keydown", tecla, true);
  }
  setTimeout(() => {
    document.addEventListener("pointerdown", fuera, true);
    document.addEventListener("keydown", tecla, true);
  });
}

// ---------- Descargas y portapapeles ----------
// Creamos un archivo en memoria (Blob) y simulamos un clic en un enlace de descarga.
export function descargar(nombreArchivo, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = h("a", { href: url, download: nombreArchivo, hidden: true });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    aviso("Copiado al portapapeles");
  } catch {
    aviso("El navegador no ha dejado copiar. Usa «Descargar» en su lugar.", "error");
  }
}

// ---------- Textos, fechas y etiquetas ----------
// Quita mayúsculas y acentos: así "Cerámica" y "ceramica" se consideran iguales.
export function normalizar(texto) {
  return String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Convierte un nombre en algo apto para variables y archivos: "Interés" → "interes".
export function slug(texto, separador = "_") {
  return normalizar(texto).replace(/[^a-z0-9]+/g, separador).replace(new RegExp(`^\\${separador}+|\\${separador}+$`, "g"), "");
}

export function urlValida(url) {
  return /^(https?:\/\/[^\s.]+\.\S+|mailto:\S+@\S+)$/i.test(String(url ?? "").trim());
}

export function esEmailValido(email) {
  return /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[a-z]{2,}$/i.test(String(email ?? "").trim());
}

// Las etiquetas se guardan en minúsculas y sin espacios sobrantes para que
// "Cliente" y "cliente " no acaben siendo dos etiquetas distintas.
export function limpiarEtiqueta(texto) {
  return String(texto ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/,/g, "");
}

export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Acepta 2026-03-15, 15/03/2026 o 15-03-2026 y devuelve 2026-03-15 (o "" si no es fecha).
export function fechaISO(texto) {
  const t = String(texto ?? "").trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

// "2026-03-15..." → "15/03/2026"
export function formatoFecha(iso) {
  const f = fechaISO(iso);
  if (!f) return iso || "";
  const [a, m, d] = f.split("-");
  return `${d}/${m}/${a}`;
}

export function formatoNumero(n) {
  return new Intl.NumberFormat("es-ES").format(n);
}

// Plural sencillo: plural(3, "contacto") → "3 contactos"
export function plural(n, singular, pluralTexto = `${singular}s`) {
  return `${formatoNumero(n)} ${n === 1 ? singular : pluralTexto}`;
}

// Cada etiqueta recibe siempre el mismo color (calculado a partir de sus letras).
const COLORES_ETIQUETA = ["#F3D9C4", "#D9E8D5", "#D6E3EF", "#EADCF0", "#F6E7B0"];
export function colorEtiqueta(etiqueta) {
  let suma = 0;
  for (const letra of etiqueta) suma = (suma * 31 + letra.charCodeAt(0)) >>> 0;
  return COLORES_ETIQUETA[suma % COLORES_ETIQUETA.length];
}

export function pildora(etiqueta, alQuitar) {
  return h("span", { class: "pildora", style: { background: colorEtiqueta(etiqueta) } },
    h("span", {}, etiqueta),
    alQuitar ? h("button", { type: "button", class: "pildora-quitar", "aria-label": `Quitar etiqueta ${etiqueta}`, onclick: (e) => { e.stopPropagation(); alQuitar(etiqueta); } }, "×") : null);
}

// Campo para escribir etiquetas: se añaden con Enter o coma y se ven como pastillas.
// Usa la lista global de sugerencias (#lista-etiquetas) que mantiene app.js.
export function campoEtiquetas({ etiquetas = [], alCambiar = () => {}, placeholder = "Escribe una etiqueta y pulsa Enter" } = {}) {
  const lista = [...etiquetas];
  const entrada = h("input", { type: "text", class: "campo-etiquetas-entrada", list: "lista-etiquetas", placeholder, "aria-label": "Añadir etiqueta", autocomplete: "off", autocapitalize: "none", spellcheck: "false" });
  const caja = h("div", { class: "campo-etiquetas", onclick: () => entrada.focus() });
  function pintar() {
    caja.replaceChildren(...lista.map((e) => pildora(e, quitar)), entrada);
  }
  function añadir(texto) {
    const etiqueta = limpiarEtiqueta(texto);
    entrada.value = "";
    if (!etiqueta || lista.includes(etiqueta)) return;
    lista.push(etiqueta);
    pintar();
    entrada.focus();
    alCambiar([...lista]);
  }
  function quitar(etiqueta) {
    lista.splice(lista.indexOf(etiqueta), 1);
    pintar();
    alCambiar([...lista]);
  }
  entrada.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      añadir(entrada.value);
    } else if (e.key === "Backspace" && !entrada.value && lista.length) {
      quitar(lista.at(-1));
    }
  });
  // Elegir una sugerencia de la lista desplegable la añade directamente.
  entrada.addEventListener("input", (e) => {
    if (!e.inputType || e.inputType === "insertReplacementText") añadir(entrada.value);
  });
  // Si alguien escribe una etiqueta y sale del campo sin pulsar Enter, no la perdemos.
  entrada.addEventListener("blur", () => { if (entrada.value.trim()) añadir(entrada.value); });
  pintar();
  return { elemento: caja, valor: () => [...lista], añadir };
}

// Casilla de título que crece con el texto: el atributo "size" mide en letras.
export function entradaTitulo({ valor, etiqueta, alCambiar }) {
  const entrada = h("input", { class: "entrada-titulo", value: valor, "aria-label": etiqueta, size: Math.max(8, valor.length + 1) });
  entrada.addEventListener("input", () => {
    entrada.size = Math.max(8, entrada.value.length + 1);
    alCambiar(entrada.value.trim());
  });
  return entrada;
}

// Etiqueta + control, el bloque básico de cualquier formulario.
// Si el control lleva botones dentro (como las pastillas de etiquetas) usamos un
// <div>: un <label> reenviaría cualquier clic a su primer botón.
export function campo(texto, control, ayuda) {
  const conBotones = control?.classList?.contains("campo-etiquetas") || control?.querySelector?.("button");
  return h(conBotones ? "div" : "label", { class: "campo" }, h("span", { class: "campo-etiqueta" }, texto), control, ayuda ? h("span", { class: "campo-ayuda" }, ayuda) : null);
}

// Estado vacío bonito para cuando todavía no hay nada que enseñar.
export function vacio({ icono: nombreIcono, titulo, texto, acciones = [] }) {
  return h("div", { class: "vacio-grande" },
    h("div", { class: "vacio-icono" }, icono(nombreIcono, 34)),
    h("h3", {}, titulo),
    h("p", {}, texto),
    acciones.length ? h("div", { class: "fila-botones centrado" }, acciones) : null);
}

export function boton(texto, accion, { clase = "secundario", icono: nombreIcono, titulo, ...resto } = {}) {
  return h("button", { type: "button", class: `boton ${clase}`, onclick: accion, title: titulo, ...resto }, nombreIcono ? icono(nombreIcono, 16) : null, texto ? h("span", {}, texto) : null);
}
