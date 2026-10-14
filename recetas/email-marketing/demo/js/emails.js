// Pantalla de Emails: la lista de emails guardados y el editor por bloques.
// El editor tiene tres zonas: tipos de bloque (izquierda), el email a 600 px
// (centro) y las propiedades del bloque elegido (derecha).

import { estado, borrarDe, guardarEmail, nuevoId } from "./estado.js";
import { TIPOS_BLOQUE, bloqueNuevo, htmlDelEmail, limpiarHTML, urlSegura, variablesDisponibles } from "./bloques.js";
import { panelPropiedades } from "./propiedades.js";
import { abrirVistaPrevia, exportarEmail } from "./vista-previa.js";
import { aviso, boton, confirmar, entradaTitulo, formatoFecha, h, icono, pedirTexto, plural, vacio } from "./ui.js";

let raiz = null;
let email = null; // email abierto en el editor
let seleccionado = null; // id del bloque elegido
let ultimoEditable = null; // última casilla donde estuvo el cursor (para insertar campos)
let rangoGuardado = null; // posición del cursor dentro de un texto editable

export const vistaEmails = {
  pintar(contenedor, id) {
    raiz = contenedor;
    email = id ? estado.emails.find((e) => e.id === id) : null;
    if (id && !email) return (location.hash = "#/emails");
    seleccionado = null;
    ultimoEditable = null;
    if (email) {
      raiz.classList.add("vista-editor", "editor-email");
      pintarEditor();
    } else pintarLista();
  },
  actualizar() {
    if (!email) pintarLista();
  },
};

export async function crearEmail() {
  const nombre = await pedirTexto({ titulo: "Nuevo email", etiqueta: "Nombre del email (solo lo ves tú)", valor: "" });
  if (!nombre) return;
  const nuevo = { id: nuevoId("em"), nombre, asunto: nombre, vistaPrevia: "", bloques: ["titulo", "texto", "pie"].map(bloqueNuevo), creado: new Date().toISOString(), actualizado: new Date().toISOString() };
  await guardarEmail(nuevo);
  location.hash = `#/emails/${nuevo.id}`;
}

// ---------- Lista ----------
function pintarLista() {
  const cabecera = h("header", { class: "cabecera-vista" },
    h("div", {}, h("h1", {}, "Emails"), h("p", { class: "subtitulo" }, "Diseña tus emails por bloques y expórtalos en HTML para tu servicio de envío.")),
    estado.emails.length ? boton("Nuevo email", crearEmail, { clase: "primario", icono: "mas" }) : null);
  if (!estado.emails.length) {
    raiz.replaceChildren(cabecera, vacio({
      icono: "emails",
      titulo: "Tu primer email",
      texto: "Apila bloques de título, texto, imagen y botón, personaliza con {{nombre}} y revisa cómo se ve en el móvil.",
      acciones: [boton("Crear un email", crearEmail, { clase: "primario", icono: "mas" })],
    }));
    return;
  }
  const tarjetas = [...estado.emails].sort((a, b) => (b.actualizado ?? "").localeCompare(a.actualizado ?? "")).map((e) => {
    // Miniatura: el propio email dentro de un iframe reducido.
    // sandbox sin "allow-scripts": dentro no se puede ejecutar nada.
    const mini = h("iframe", { class: "miniatura-iframe", sandbox: "allow-same-origin", tabindex: "-1", "aria-hidden": "true", loading: "lazy", title: "" });
    mini.srcdoc = htmlDelEmail(e);
    const sinPie = !e.bloques.some((b) => b.tipo === "pie");
    return h("article", { class: "tarjeta tarjeta-email" },
      h("a", { class: "miniatura", href: `#/emails/${e.id}`, "aria-label": `Abrir ${e.nombre}` }, mini),
      h("div", { class: "tarjeta-email-texto" },
        h("h3", {}, h("a", { href: `#/emails/${e.id}` }, e.nombre)),
        h("p", { class: "tenue asunto-linea" }, e.asunto || "Sin asunto"),
        h("p", { class: "meta" }, `${plural(e.bloques.length, "bloque")} · editado el ${formatoFecha(e.actualizado)}`, sinPie ? h("span", { class: "chip-aviso" }, icono("alerta", 12), "sin pie legal") : null)),
      h("div", { class: "tarjeta-acciones" },
        boton("Exportar", () => exportarEmail(e).then((r) => r === "añadir-pie" && añadirPieYAbrir(e)), { icono: "exportar", clase: "fantasma" }),
        h("button", { class: "boton-icono", "aria-label": `Borrar ${e.nombre}`, title: "Borrar email", onclick: () => borrarEmail(e) }, icono("borrar", 16))));
  });
  raiz.replaceChildren(cabecera, h("div", { class: "rejilla-emails" }, tarjetas));
}

async function añadirPieYAbrir(e) {
  e.bloques.push(bloqueNuevo("pie"));
  await guardarEmail(e);
  location.hash = `#/emails/${e.id}`;
}

async function borrarEmail(e) {
  const usado = estado.automatizaciones.filter((a) => JSON.stringify(a.pasos).includes(`"${e.id}"`));
  const ok = await confirmar({ titulo: "Borrar email", texto: `Se borrará «${e.nombre}».${usado.length ? ` Lo usa ${plural(usado.length, "automatización", "automatizaciones")}: ese paso quedará sin email.` : ""}`, aceptar: "Borrar", peligro: true });
  if (!ok) return;
  await borrarDe("emails", [e.id]);
  aviso("Email borrado");
}

// ---------- Editor ----------
function guardar() {
  email.actualizado = new Date().toISOString();
  guardarEmail(email).then(() => {
    const indicador = raiz.querySelector(".guardado");
    if (!indicador) return;
    indicador.classList.add("visible");
    clearTimeout(indicador._t);
    indicador._t = setTimeout(() => indicador.classList.remove("visible"), 1400);
  });
}

function pintarEditor() {
  const entradaNombre = entradaTitulo({ valor: email.nombre, etiqueta: "Nombre del email", alCambiar: (texto) => { email.nombre = texto || "Email sin nombre"; guardar(); } });
  const entradaAsunto = h("input", { class: "entrada", id: "asunto", type: "text", value: email.asunto, "data-variables": "", placeholder: "¿Qué verá en la bandeja de entrada?", oninput: (e) => { email.asunto = e.target.value; guardar(); } });
  const entradaPreheader = h("input", { class: "entrada", id: "vista-previa-texto", type: "text", value: email.vistaPrevia, "data-variables": "", placeholder: "Frase corta que aparece junto al asunto", oninput: (e) => { email.vistaPrevia = e.target.value; guardar(); } });

  // Desplegable para insertar {{campos}} donde esté el cursor.
  const insertar = h("select", { class: "entrada selector-variable", "aria-label": "Insertar campo variable", onchange: (e) => {
    if (e.target.value) insertarVariable(e.target.value);
    e.target.value = "";
  } }, h("option", { value: "" }, "Insertar campo…"), variablesDisponibles().map((v) => h("option", { value: v.clave }, `${v.nombre}  {{${v.clave}}}`)));

  raiz.replaceChildren(
    h("header", { class: "editor-barra" },
      h("div", { class: "cabecera-editor-titulo" },
        h("a", { class: "boton-icono", href: "#/emails", "aria-label": "Volver a emails", title: "Volver" }, icono("atras")),
        entradaNombre, h("span", { class: "guardado" }, icono("check", 14), "Guardado")),
      h("div", { class: "fila-botones" },
        h("div", { class: "segmentado", role: "group", "aria-label": "Vista previa" },
          h("button", { type: "button", onclick: () => abrirVistaPrevia(email, "escritorio"), title: "Vista previa de escritorio (600 px)" }, icono("escritorio", 16), h("span", {}, "Escritorio")),
          h("button", { type: "button", onclick: () => abrirVistaPrevia(email, "movil"), title: "Vista previa de móvil (375 px)" }, icono("movil", 16), h("span", {}, "Móvil"))),
        boton("Exportar", exportar, { clase: "primario", icono: "exportar" }))),
    h("div", { class: "editor-meta" },
      h("label", { class: "campo" }, h("span", { class: "campo-etiqueta" }, "Asunto"), entradaAsunto),
      h("label", { class: "campo" }, h("span", { class: "campo-etiqueta" }, "Texto de vista previa"), entradaPreheader),
      h("label", { class: "campo campo-variable" }, h("span", { class: "campo-etiqueta" }, icono("variable", 13), " Campo variable"), insertar)),
    h("div", { class: "editor-zonas" },
      h("aside", { class: "paleta", "aria-label": "Añadir bloques" },
        h("h2", { class: "zona-titulo" }, "Bloques"),
        h("div", { class: "paleta-lista" }, Object.entries(TIPOS_BLOQUE).map(([tipo, def]) => h("button", { type: "button", class: "paleta-boton", dataset: { tipo }, onclick: () => añadirBloque(tipo) }, icono(def.icono, 20), h("span", {}, def.nombre)))),
        h("p", { class: "paleta-ayuda" }, "Se añade debajo del bloque elegido.")),
      h("div", { class: "lienzo-marco" }, h("div", { class: "lienzo", id: "lienzo" })),
      h("aside", { class: "propiedades", id: "propiedades", "aria-label": "Propiedades del bloque" })));
  pintarLienzo();
  pintarPropiedades();
}

function pintarLienzo() {
  const lienzo = raiz.querySelector("#lienzo");
  lienzo.replaceChildren(...email.bloques.map((b, i) => elementoBloque(b, i)));
  if (!email.bloques.length) lienzo.append(h("div", { class: "lienzo-vacio" }, icono("mas", 26), h("p", {}, "Añade bloques desde la columna «Bloques».")));
}

function elementoBloque(b, i) {
  const ultimo = i === email.bloques.length - 1;
  // stopPropagation: un clic en estas herramientas no cuenta como "elegir el bloque".
  const herramientas = h("div", { class: "bloque-herramientas", onclick: (e) => e.stopPropagation() },
    h("button", { type: "button", class: "asa", "aria-label": "Arrastrar para mover", title: "Arrastra para mover", onpointerdown: (e) => arrastrar(e, b.id) }, icono("arrastrar", 16)),
    h("span", { class: "bloque-nombre" }, TIPOS_BLOQUE[b.tipo].nombre),
    h("button", { type: "button", "aria-label": "Subir bloque", title: "Subir", disabled: i === 0, onclick: () => mover(b.id, -1) }, icono("subir", 15)),
    h("button", { type: "button", "aria-label": "Bajar bloque", title: "Bajar", disabled: ultimo, onclick: () => mover(b.id, 1) }, icono("bajar", 15)),
    h("button", { type: "button", "aria-label": "Duplicar bloque", title: "Duplicar", onclick: () => duplicar(b.id) }, icono("duplicar", 15)),
    h("button", { type: "button", "aria-label": "Borrar bloque", title: "Borrar", onclick: () => borrarBloque(b.id) }, icono("borrar", 15)));
  return h("div", { class: `bloque bloque-${b.tipo} ${b.id === seleccionado ? "elegido" : ""}`, dataset: { id: b.id }, onclick: () => seleccionar(b.id) },
    herramientas, contenidoBloque(b));
}

// Cómo se ve cada bloque dentro del editor (parecido al HTML final).
function contenidoBloque(b) {
  const p = b.props;
  const caja = h("div", { class: "b-contenido", style: { textAlign: p.alineacion ?? "left" } });
  if (b.tipo === "titulo" || b.tipo === "texto") {
    caja.append(textoEditable(b));
  } else if (b.tipo === "imagen") {
    if (urlSegura(p.url)) {
      const img = h("img", { src: urlSegura(p.url), alt: p.alt, style: { width: `${p.ancho}%` } });
      img.addEventListener("error", () => img.replaceWith(h("div", { class: "imagen-vacia error" }, icono("alerta", 22), h("span", {}, "No se ha podido cargar la imagen. Revisa la dirección."))));
      caja.append(img);
    } else {
      caja.append(h("div", { class: "imagen-vacia" }, icono("imagen", 26), h("span", {}, "Pega la dirección web de una imagen en el panel de propiedades")));
    }
  } else if (b.tipo === "boton") {
    caja.append(h("span", { class: "b-boton", style: { background: p.fondo, color: p.colorTexto } }, p.texto || "Botón"));
  } else if (b.tipo === "separador") {
    caja.append(h("div", { class: "b-separador", style: { borderTop: `${p.grosor}px solid ${p.color}` } }));
  } else if (b.tipo === "espacio") {
    caja.append(h("div", { class: "b-espacio", style: { height: `${p.altura}px` } }, h("span", {}, `Espacio · ${p.altura} px`)));
  } else if (b.tipo === "pie") {
    const r = estado.remitente;
    const faltan = !r.negocio || !r.direccion || !r.enlaceBaja;
    caja.append(h("div", { class: "b-pie" },
      h("span", {}, p.texto), h("br"),
      h("strong", {}, r.negocio || "[Nombre de tu negocio]"), ` · ${r.direccion || "[Dirección postal]"}`, h("br"),
      h("span", { class: "b-pie-baja" }, "Darse de baja"),
      faltan ? h("br") : null,
      faltan ? h("a", { class: "chip-aviso", href: "#/ajustes" }, icono("alerta", 12), "Completa los datos del remitente en Ajustes") : null));
  }
  return caja;
}

// Título y texto se escriben directamente sobre el email (contenteditable).
function textoEditable(b) {
  const p = b.props;
  const el = h("div", {
    class: b.tipo === "titulo" ? "b-titulo" : "b-texto",
    contenteditable: "true",
    spellcheck: "true",
    role: "textbox",
    "aria-label": b.tipo === "titulo" ? "Texto del título" : "Texto del párrafo",
    "aria-multiline": String(b.tipo === "texto"),
    style: { color: p.color, fontSize: `${p.tamano}px` },
    html: limpiarHTML(p.html),
  });
  el.addEventListener("input", () => {
    // Guardamos el HTML limpio, pero no tocamos lo que se ve para no mover el cursor.
    p.html = limpiarHTML(el.innerHTML);
    guardar();
  });
  el.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Intro hace un salto de línea simple (<br>) en vez de crear otro párrafo.
    if (b.tipo === "texto" || e.shiftKey) document.execCommand("insertLineBreak");
  });
  // Al pegar, solo el texto: así no se cuelan estilos de Word o de otras webs.
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  });
  el.addEventListener("focus", () => seleccionar(b.id));
  // Recordamos dónde está el cursor tras cada tecla o clic, y al salir del
  // texto: así el desplegable de campos sabe dónde insertar {{nombre}}.
  for (const evento of ["input", "keyup", "mouseup", "blur"]) el.addEventListener(evento, () => guardarRango(el));
  return el;
}

// Repinta un solo bloque (por ejemplo, al cambiar su color en el panel).
function repintarBloque(id) {
  const viejo = raiz.querySelector(`.bloque[data-id="${id}"]`);
  const i = email.bloques.findIndex((b) => b.id === id);
  if (viejo && i !== -1) viejo.replaceWith(elementoBloque(email.bloques[i], i));
}

function seleccionar(id) {
  if (seleccionado === id) return;
  seleccionado = id;
  raiz.querySelectorAll(".bloque").forEach((el) => el.classList.toggle("elegido", el.dataset.id === id));
  pintarPropiedades();
}

function pintarPropiedades() {
  const zona = raiz.querySelector("#propiedades");
  const bloque = email.bloques.find((b) => b.id === seleccionado);
  zona.classList.toggle("abierta", !!bloque);
  zona.replaceChildren(bloque
    ? panelPropiedades(bloque, {
      alCambiar: () => { repintarBloque(bloque.id); guardar(); },
      alCerrar: () => { seleccionado = null; raiz.querySelectorAll(".bloque.elegido").forEach((el) => el.classList.remove("elegido")); pintarPropiedades(); },
    })
    : h("div", { class: "propiedades-vacio" }, icono("editar", 22), h("p", {}, "Pulsa un bloque del email para cambiar su alineación, colores, enlace o tamaño."), h("p", { class: "tenue" }, "Los textos se escriben directamente sobre el email.")));
}

function añadirBloque(tipo) {
  const nuevo = bloqueNuevo(tipo);
  const i = email.bloques.findIndex((b) => b.id === seleccionado);
  // Debajo del bloque elegido o, si no hay ninguno, al final (pero antes del pie legal).
  const posicion = i !== -1 ? i + 1 : email.bloques.at(-1)?.tipo === "pie" && tipo !== "pie" ? email.bloques.length - 1 : email.bloques.length;
  email.bloques.splice(posicion, 0, nuevo);
  guardar();
  seleccionado = nuevo.id;
  pintarLienzo();
  pintarPropiedades();
  const el = raiz.querySelector(`.bloque[data-id="${nuevo.id}"]`);
  el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function mover(id, salto) {
  const i = email.bloques.findIndex((b) => b.id === id);
  const destino = i + salto;
  if (destino < 0 || destino >= email.bloques.length) return;
  const [bloque] = email.bloques.splice(i, 1);
  email.bloques.splice(destino, 0, bloque);
  guardar();
  pintarLienzo();
  raiz.querySelector(`.bloque[data-id="${id}"] [aria-label="${salto < 0 ? "Subir" : "Bajar"} bloque"]:not(:disabled)`)?.focus();
}

function duplicar(id) {
  const i = email.bloques.findIndex((b) => b.id === id);
  const copia = { ...structuredClone(email.bloques[i]), id: bloqueNuevo(email.bloques[i].tipo).id };
  email.bloques.splice(i + 1, 0, copia);
  seleccionado = copia.id;
  guardar();
  pintarLienzo();
  pintarPropiedades();
  aviso("Bloque duplicado");
}

function borrarBloque(id) {
  email.bloques = email.bloques.filter((b) => b.id !== id);
  if (seleccionado === id) seleccionado = null;
  guardar();
  pintarLienzo();
  pintarPropiedades();
}

// Arrastrar con el asa ⋮⋮: usamos eventos de puntero (sirven con ratón y con
// el dedo). Mientras se arrastra, una línea marca dónde caerá el bloque.
function arrastrar(evento, id) {
  evento.preventDefault();
  const lienzo = raiz.querySelector("#lienzo");
  const bloques = [...lienzo.querySelectorAll(".bloque")];
  const origen = bloques.findIndex((el) => el.dataset.id === id);
  const elemento = bloques[origen];
  const marca = h("div", { class: "marca-soltar" });
  let destino = origen;
  elemento.classList.add("arrastrando");
  document.body.classList.add("moviendo");

  const alMover = (e) => {
    destino = bloques.length;
    for (let i = 0; i < bloques.length; i++) {
      const r = bloques[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { destino = i; break; }
    }
    if (destino < bloques.length) lienzo.insertBefore(marca, bloques[destino]);
    else lienzo.append(marca);
    // Si nos acercamos al borde, desplazamos la zona para seguir arrastrando.
    const marco = lienzo.closest(".lienzo-marco");
    const rm = marco.getBoundingClientRect();
    if (e.clientY < rm.top + 40) marco.scrollBy(0, -12);
    else if (e.clientY > rm.bottom - 40) marco.scrollBy(0, 12);
  };
  const alSoltar = () => {
    window.removeEventListener("pointermove", alMover);
    window.removeEventListener("pointerup", alSoltar);
    window.removeEventListener("pointercancel", alSoltar);
    marca.remove();
    elemento.classList.remove("arrastrando");
    document.body.classList.remove("moviendo");
    // Si se suelta debajo de su posición, al sacarlo los de abajo suben uno.
    const final = destino > origen ? destino - 1 : destino;
    if (final === origen) return;
    const [bloque] = email.bloques.splice(origen, 1);
    email.bloques.splice(final, 0, bloque);
    guardar();
    pintarLienzo();
  };
  window.addEventListener("pointermove", alMover);
  window.addEventListener("pointerup", alSoltar);
  window.addEventListener("pointercancel", alSoltar);
}

// ---------- Campos variables ----------
// Recordamos dónde estaba el cursor, porque al abrir el desplegable el foco se va.
document.addEventListener("focusin", (e) => {
  const t = e.target;
  if (t.closest?.(".editor-email") && (t.matches("[data-variables]") || t.isContentEditable)) ultimoEditable = t;
});
function guardarRango(editable) {
  const seleccion = document.getSelection();
  if (seleccion.rangeCount && editable.contains(seleccion.getRangeAt(0).startContainer)) rangoGuardado = seleccion.getRangeAt(0).cloneRange();
}

function insertarVariable(clave) {
  const texto = `{{${clave}}}`;
  const destino = ultimoEditable?.isConnected ? ultimoEditable : null;
  if (!destino) return aviso("Primero haz clic donde quieras el campo: en el asunto, la vista previa o un texto del email.", "error");
  destino.focus();
  if (destino.isContentEditable) {
    let rango = rangoGuardado && destino.contains(rangoGuardado.startContainer) ? rangoGuardado : null;
    if (!rango) {
      rango = document.createRange();
      rango.selectNodeContents(destino);
      rango.collapse(false); // al final del texto
    }
    rango.deleteContents();
    const nodo = document.createTextNode(texto);
    rango.insertNode(nodo);
    rango.setStartAfter(nodo);
    rango.collapse(true);
    const seleccion = document.getSelection();
    seleccion.removeAllRanges();
    seleccion.addRange(rango);
  } else {
    const inicio = destino.selectionStart ?? destino.value.length;
    destino.setRangeText(texto, inicio, destino.selectionEnd ?? inicio, "end");
  }
  // Avisamos como si se hubiera escrito a mano, para que se guarde.
  destino.dispatchEvent(new Event("input", { bubbles: true }));
}

async function exportar() {
  const resultado = await exportarEmail(email);
  if (resultado === "añadir-pie") {
    const pie = bloqueNuevo("pie");
    email.bloques.push(pie);
    seleccionado = pie.id;
    guardar();
    pintarLienzo();
    pintarPropiedades();
    aviso("Pie legal añadido al final del email");
  }
}
