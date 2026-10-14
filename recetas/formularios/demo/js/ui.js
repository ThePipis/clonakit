// Herramientas de interfaz que usan todas las pantallas: crear elementos,
// iconos, avisos flotantes, ventanas de confirmación, portapapeles y fechas.

/**
 * Crea un elemento HTML sin escribir HTML a mano.
 * Ejemplo: h("button", { class: "boton", onclick: guardar }, "Guardar")
 * Los textos se añaden siempre como texto, nunca como HTML: así, si alguien
 * escribe "<script>" en un formulario, se ve tal cual y no se ejecuta.
 */
export function h(etiqueta, atributos = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);
  let valorInicial;
  for (const [clave, valor] of Object.entries(atributos ?? {})) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (clave.startsWith("on") && typeof valor === "function") elemento.addEventListener(clave.slice(2), valor);
    else if (clave === "class") elemento.className = valor;
    else if (clave === "value") valorInicial = valor; // se pone al final, cuando ya existen las <option>
    else if (clave === "svg") elemento.innerHTML = valor; // solo para nuestros iconos fijos
    else elemento.setAttribute(clave, valor === true ? "" : valor);
  }
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false || hijo === "") continue;
    elemento.append(hijo instanceof Node ? hijo : String(hijo));
  }
  if (valorInicial !== undefined) elemento.value = valorInicial;
  return elemento;
}

// Iconos dibujados para Pregunta (trazos SVG de 24×24). Se pintan con el color del texto.
const TRAZOS = {
  mas: '<path d="M12 5v14M5 12h14"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  papelera: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  duplicar: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  arriba: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  abajo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  volver: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  derecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12.5 9.5 17 19 7"/>',
  externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  descargar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  jugar: '<path d="M8 5.5v13l10.5-6.5z"/>',
  compartir: '<path d="M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M12 3v12M7 8l5-5 5 5"/>',
  enviar: '<path d="M4 12 20 4l-5 16-3.5-6.5z"/><path d="M11.5 13.5 20 4"/>',
  asa: '<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  candado: '<rect x="5.5" y="11" width="13" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  bandera: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  meta: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3 11 14.8l4.6-5"/>',
  tabla: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M10 10v9"/>',
  salto: '<path d="M6 4v7a4 4 0 0 0 4 4h8M14 11l4 4-4 4"/>',
  aviso: '<path d="M12 4 21 20H3z"/><path d="M12 10v4M12 17v.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>',
  paleta: '<path d="M12 4a8 8 0 1 0 0 16c1.1 0 1.6-.8 1.3-1.7-.4-1.2.2-2.3 1.5-2.3H17a3 3 0 0 0 3-3c0-5-3.6-9-8-9z"/><circle cx="8" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="11" r="1" fill="currentColor"/>',
  // Un icono por cada tipo de pregunta.
  "tipo-corto": '<path d="M5 9h14M5 15h8"/>',
  "tipo-largo": '<path d="M5 6h14M5 10h14M5 14h14M5 18h9"/>',
  "tipo-email": '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m4.5 7.5 7.5 6 7.5-6"/>',
  "tipo-unica": '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
  "tipo-multiple": '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  "tipo-escala": '<path d="M5 20v-4M10 20v-7M15 20v-10M20 20V4"/>',
  "tipo-sino": '<rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="16" cy="12" r="2.6" fill="currentColor"/>',
};

/** Devuelve un icono listo para meter en un botón o un texto. */
export function icono(nombre, clase = "") {
  const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TRAZOS[nombre] ?? ""}</svg>`;
  return h("span", { class: `icono ${clase}`.trim(), "aria-hidden": "true", svg });
}

// El logo de Pregunta: un signo «¿» dentro de un círculo índigo, con el punto en amarillo maíz.
export const SVG_LOGO =
  '<svg viewBox="0 0 32 32" width="100%" height="100%"><circle cx="16" cy="16" r="15" fill="#3D4BA8"/>' +
  '<circle cx="16" cy="8.6" r="2.1" fill="#F2C14E"/>' +
  '<path d="M16 12.8v2.6c0 1.6-1 2.4-2.3 3.1-1.5.8-2.4 1.8-2.4 3.3 0 2.1 1.8 3.5 4.2 3.5 1.9 0 3.3-.8 4.1-2.3" fill="none" stroke="#FFF8F0" stroke-width="2.6" stroke-linecap="round"/></svg>';

export function logo() {
  return h("span", { class: "logo-marca", "aria-hidden": "true", svg: SVG_LOGO });
}

/** Cabecera común de las pantallas de gestión (Mis formularios y Respuestas). */
export function cabeceraApp(...extra) {
  return h(
    "header",
    { class: "cabecera-app contenedor" },
    h("a", { class: "logo", href: "#", "aria-label": "Pregunta, ir a Mis formularios" }, logo(), h("span", {}, "Pregunta")),
    ...extra,
  );
}

/** Aviso flotante que desaparece solo (por ejemplo, "Enlace copiado"). */
export function aviso(texto, tipo = "info") {
  let zona = document.getElementById("avisos");
  if (!zona) {
    zona = h("div", { id: "avisos", class: "avisos", role: "status", "aria-live": "polite" });
    document.body.append(zona);
  }
  // Si hay una ventana modal abierta, el aviso va dentro para que se vea por encima.
  const dialogo = document.querySelector("dialog[open]");
  if (dialogo && zona.parentElement !== dialogo) dialogo.append(zona);
  if (!dialogo && zona.parentElement !== document.body) document.body.append(zona);

  const nombreIcono = tipo === "ok" ? "check" : tipo === "error" ? "aviso" : "info";
  const nodo = h("div", { class: `aviso aviso-${tipo}` }, icono(nombreIcono), h("span", {}, texto));
  zona.append(nodo);
  // Como mucho dos avisos a la vez: el más antiguo se va.
  while (zona.children.length > 2) zona.firstElementChild.remove();
  setTimeout(() => {
    nodo.classList.add("saliendo");
    setTimeout(() => nodo.remove(), 300);
  }, 3200);
}

/**
 * Ventana para confirmar acciones que no se pueden deshacer.
 * Devuelve una promesa: true si la persona acepta, false si cancela.
 */
export function confirmar({ titulo, texto = "", aceptar = "Aceptar", peligro = true }) {
  return new Promise((resolver) => {
    const dialogo = h(
      "dialog",
      { class: "dialogo dialogo-confirmar", "aria-labelledby": "titulo-confirmar" },
      // method="dialog" cierra la ventana y guarda el value del botón pulsado en returnValue.
      h(
        "form",
        { method: "dialog", class: "dialogo-cuerpo" },
        h("h2", { id: "titulo-confirmar", class: "dialogo-titulo" }, titulo),
        texto && h("p", { class: "dialogo-texto" }, texto),
        h(
          "div",
          { class: "dialogo-botones" },
          h("button", { value: "no", class: "boton", autofocus: true }, "Cancelar"),
          h("button", { value: "si", class: `boton ${peligro ? "boton-peligro" : "boton-primario"}` }, aceptar),
        ),
      ),
    );
    dialogo.addEventListener("close", () => {
      resolver(dialogo.returnValue === "si");
      dialogo.remove();
    });
    document.body.append(dialogo);
    dialogo.showModal();
  });
}

/** Copia un texto al portapapeles. Si el navegador no deja, prueba el método antiguo. */
export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = h("textarea", { class: "fuera-de-vista", readonly: true });
    area.value = texto;
    (document.querySelector("dialog[open]") ?? document.body).append(area);
    area.select();
    let copiado = false;
    try {
      copiado = document.execCommand("copy");
    } catch {
      copiado = false;
    }
    area.remove();
    return copiado;
  }
}

/** Solo deja pasar direcciones web normales (http o https), nunca "javascript:" ni otras. */
export function urlSegura(texto) {
  try {
    const url = new URL(String(texto ?? "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

/** Elige texto blanco u oscuro para que se lea bien sobre el color de acento. */
export function colorTextoSobre(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  if (Number.isNaN(n)) return "#FFFFFF";
  const canales = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminancia = 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
  return luminancia > 0.45 ? "#2A2333" : "#FFFFFF";
}

/** "2026-10-13T18:05:00Z" → "13/10/2026 20:05" (hora del dispositivo). */
export function formatearFecha(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

/** "3 preguntas", "1 pregunta"… */
export function plural(n, singular, pluralTexto = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

/**
 * Permite reordenar una lista arrastrando (API Drag and Drop de HTML).
 * - selectorItem: cada elemento que se puede mover (lleva data-indice).
 * - selectorAsa: de dónde se agarra (si es null, de todo el elemento).
 * - alMover(desde, hasta): se llama al soltar con las posiciones.
 */
export function hacerOrdenable(lista, selectorItem, selectorAsa, alMover) {
  let arrastrado = null;
  const limpiar = () => {
    lista.querySelectorAll(".encima, .arrastrando").forEach((el) => el.classList.remove("encima", "arrastrando"));
  };
  lista.addEventListener("dragstart", (evento) => {
    const origen = selectorAsa ? evento.target.closest?.(selectorAsa) : evento.target;
    const item = origen?.closest?.(selectorItem);
    if (!item || !lista.contains(item)) return;
    arrastrado = item;
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", item.dataset.indice);
    // Que se vea la fila entera al arrastrar, aunque se agarre por el asa.
    if (selectorAsa) evento.dataTransfer.setDragImage(item, 24, 20);
    item.classList.add("arrastrando");
  });
  lista.addEventListener("dragover", (evento) => {
    const sobre = evento.target.closest?.(selectorItem);
    if (!arrastrado || !sobre || !lista.contains(sobre)) return;
    evento.preventDefault(); // sin esto el navegador no deja soltar aquí
    evento.dataTransfer.dropEffect = "move";
    lista.querySelectorAll(".encima").forEach((el) => el !== sobre && el.classList.remove("encima"));
    if (sobre !== arrastrado) sobre.classList.add("encima");
  });
  lista.addEventListener("drop", (evento) => {
    const sobre = evento.target.closest?.(selectorItem);
    if (!arrastrado || !sobre || !lista.contains(sobre)) return;
    evento.preventDefault();
    const desde = Number(arrastrado.dataset.indice);
    const hasta = Number(sobre.dataset.indice);
    arrastrado = null;
    limpiar();
    if (desde !== hasta) alMover(desde, hasta);
  });
  lista.addEventListener("dragend", () => {
    arrastrado = null;
    limpiar();
  });
}

/** Descarga un archivo creado en el navegador (por ejemplo, el CSV de respuestas). */
export function descargarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = h("a", { href: url, download: nombre, class: "fuera-de-vista" });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Convierte un título en un nombre de archivo sencillo: "Pide tu presupuesto" → "pide-tu-presupuesto". */
export function nombreArchivo(texto) {
  return (
    String(texto)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "formulario"
  );
}
