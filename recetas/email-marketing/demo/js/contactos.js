// Pantalla de Contactos: tabla con búsqueda, selección múltiple, acciones en
// bloque, ficha lateral para editar y exportación a CSV.

import { estado, borrarDe, contarEtiquetas, guardarContacto, guardarContactos, nuevoId } from "./estado.js";
import { segmentosDe } from "./condiciones.js";
import { escribirCSV } from "./csv.js";
import { abrirImportador } from "./importar.js";
import { abrirCampos } from "./campos.js";
import {
  abrirModal, aviso, boton, campo, campoEtiquetas, confirmar, descargar, esEmailValido, formatoFecha,
  formatoNumero, h, hoyISO, icono, limpiarEtiqueta, normalizar, pildora, plural, rellenar, vacio,
} from "./ui.js";

// Pintamos como mucho 200 filas de golpe para que la tabla vaya fluida con
// miles de contactos; el botón "Mostrar más" pinta las siguientes.
const POR_PAGINA = 200;
let busqueda = "";
let limite = POR_PAGINA;
const seleccion = new Set();
let raiz = null;

export const vistaContactos = {
  pintar(contenedor) {
    raiz = contenedor;
    limite = POR_PAGINA;
    pintarTodo();
  },
  // Cuando cambian los datos (importación, ficha guardada...) repintamos la tabla.
  actualizar() {
    for (const id of seleccion) if (!estado.contactos.some((c) => c.id === id)) seleccion.delete(id);
    pintarTodo();
  },
};

// Contactos que coinciden con la búsqueda (nombre, email o etiqueta).
function filtrados() {
  const texto = normalizar(busqueda);
  const lista = !texto ? estado.contactos : estado.contactos.filter((c) =>
    normalizar(c.email).includes(texto) || normalizar(c.nombre).includes(texto) || (c.etiquetas ?? []).some((e) => normalizar(e).includes(texto)));
  // Los más recientes primero.
  return [...lista].sort((a, b) => (b.alta ?? "").localeCompare(a.alta ?? "") || a.email.localeCompare(b.email));
}

function pintarTodo() {
  if (!raiz) return;
  const total = estado.contactos.length;
  const enfocado = document.activeElement?.id === "buscador-contactos";
  const cabecera = h("header", { class: "cabecera-vista" },
    h("div", {},
      h("h1", {}, "Contactos"),
      h("p", { class: "subtitulo" }, total ? h("strong", { class: "total" }, plural(total, "contacto")) : "Todavía no hay ninguno", total ? ` · ${plural(contarEtiquetas().size, "etiqueta")}` : null)),
    h("div", { class: "fila-botones" },
      boton("Campos", abrirCampos, { icono: "columnas", titulo: "Crear campos personalizados y elegir columnas" }),
      boton("Exportar CSV", exportarCSV, { icono: "exportar", disabled: !total }),
      boton("Importar CSV", abrirImportador, { icono: "importar" }),
      boton("Añadir contacto", () => abrirFicha(null), { clase: "primario", icono: "mas" })));

  if (!total) {
    raiz.replaceChildren(cabecera, vacio({
      icono: "contactos",
      titulo: "Empieza por tu lista",
      texto: "Importa un CSV desde Excel, Google Sheets o tu herramienta actual, o añade tus contactos a mano.",
      acciones: [boton("Importar CSV", abrirImportador, { icono: "importar" }), boton("Añadir contacto", () => abrirFicha(null), { clase: "primario", icono: "mas" })],
    }));
    return;
  }

  const buscador = h("label", { class: "buscador" }, icono("buscar", 18),
    h("input", { id: "buscador-contactos", type: "search", placeholder: "Buscar por nombre, email o etiqueta", value: busqueda, "aria-label": "Buscar contactos", oninput: (e) => {
      busqueda = e.target.value;
      limite = POR_PAGINA;
      pintarTabla();
    } }));

  raiz.replaceChildren(cabecera, h("div", { class: "barra-herramientas" }, buscador), h("div", { id: "barra-seleccion" }), h("div", { id: "zona-tabla" }));
  if (enfocado) raiz.querySelector("#buscador-contactos").focus();
  pintarTabla();
}

function pintarTabla() {
  const lista = filtrados();
  const visibles = estado.campos.filter((c) => c.visible);
  const todosMarcados = lista.length > 0 && lista.every((c) => seleccion.has(c.id));

  const marcarTodos = h("input", { type: "checkbox", "aria-label": "Seleccionar todos", checked: todosMarcados, onchange: (e) => {
    for (const c of lista) e.target.checked ? seleccion.add(c.id) : seleccion.delete(c.id);
    pintarTabla();
  } });

  const filas = lista.slice(0, limite).map((c) => h("tr", { class: seleccion.has(c.id) ? "marcada" : "", dataset: { id: c.id }, onclick: (e) => {
    if (e.target.closest("input, button, .celda-check")) return;
    abrirFicha(c);
  } },
    h("td", { class: "celda-check" }, h("input", { type: "checkbox", "aria-label": `Seleccionar ${c.email}`, checked: seleccion.has(c.id), onchange: (e) => {
      e.target.checked ? seleccion.add(c.id) : seleccion.delete(c.id);
      pintarTabla();
    } })),
    h("td", { class: "celda-email", "data-etiqueta": "Email" }, h("span", { class: "avatar" }, (c.nombre || c.email).charAt(0).toUpperCase()), h("span", {}, c.email)),
    // "celda-vacia" permite ocultar en el móvil los datos que no existen.
    h("td", { class: c.nombre ? "" : "celda-vacia", "data-etiqueta": "Nombre" }, c.nombre || h("span", { class: "tenue" }, "—")),
    h("td", { class: `celda-etiquetas ${(c.etiquetas ?? []).length ? "" : "celda-vacia"}`, "data-etiqueta": "Etiquetas" }, (c.etiquetas ?? []).length ? c.etiquetas.map((e) => pildora(e)) : h("span", { class: "tenue" }, "—")),
    h("td", { class: "celda-fecha", "data-etiqueta": "Alta" }, formatoFecha(c.alta)),
    visibles.map((campoDef) => h("td", { class: c.campos?.[campoDef.id] ? "" : "celda-vacia", "data-etiqueta": campoDef.nombre }, mostrarValor(c.campos?.[campoDef.id], campoDef.tipo)))));

  const tabla = h("div", { class: "tabla-marco" }, h("table", { class: "tabla tabla-contactos" },
    h("thead", {}, h("tr", {},
      h("th", { class: "celda-check" }, marcarTodos),
      h("th", {}, "Email"), h("th", {}, "Nombre"), h("th", {}, "Etiquetas"), h("th", {}, "Alta"),
      visibles.map((c) => h("th", {}, c.nombre)))),
    h("tbody", {}, filas)));

  const zona = document.getElementById("zona-tabla");
  rellenar(zona,
    busqueda ? h("p", { class: "nota-busqueda" }, `${plural(lista.length, "resultado")} de ${formatoNumero(estado.contactos.length)}`) : null,
    lista.length ? tabla : h("p", { class: "sin-resultados" }, "Ningún contacto coincide con la búsqueda."),
    lista.length > limite ? h("div", { class: "centrado" }, boton(`Mostrar más (quedan ${formatoNumero(lista.length - limite)})`, () => { limite += POR_PAGINA; pintarTabla(); })) : null);
  pintarBarraSeleccion();
}

function mostrarValor(valor, tipo) {
  if (valor == null || valor === "") return h("span", { class: "tenue" }, "—");
  return tipo === "fecha" ? formatoFecha(valor) : String(valor);
}

// Barra que aparece con filas marcadas: añadir/quitar etiqueta o borrar.
function pintarBarraSeleccion() {
  const barra = document.getElementById("barra-seleccion");
  if (!barra) return;
  if (!seleccion.size) {
    barra.replaceChildren();
    barra.className = "";
    return;
  }
  barra.className = "barra-seleccion";
  barra.replaceChildren(
    h("strong", {}, plural(seleccion.size, "seleccionado")),
    h("div", { class: "fila-botones" },
      boton("Añadir etiqueta", () => etiquetarEnBloque("añadir"), { icono: "etiqueta" }),
      boton("Quitar etiqueta", () => etiquetarEnBloque("quitar"), { icono: "etiqueta" }),
      boton("Borrar", borrarEnBloque, { clase: "peligro-suave", icono: "borrar" }),
      h("button", { class: "boton-icono", "aria-label": "Quitar la selección", title: "Quitar la selección", onclick: () => { seleccion.clear(); pintarTabla(); } }, icono("cerrar", 16))));
}

function etiquetarEnBloque(modo) {
  const elegidos = estado.contactos.filter((c) => seleccion.has(c.id));
  let contenido;
  let leerEtiquetas;
  if (modo === "añadir") {
    const campoTags = campoEtiquetas({ placeholder: "Etiqueta para los seleccionados" });
    contenido = campo("Etiquetas que se añadirán", campoTags.elemento, "Escribe y pulsa Enter. Puedes añadir varias.");
    leerEtiquetas = campoTags.valor;
  } else {
    // Solo ofrecemos las etiquetas que tienen de verdad los seleccionados.
    const presentes = [...new Set(elegidos.flatMap((c) => c.etiquetas ?? []))].sort();
    if (!presentes.length) return aviso("Los contactos seleccionados no tienen etiquetas.", "error");
    const selector = h("select", { class: "entrada" }, presentes.map((e) => h("option", { value: e }, e)));
    contenido = campo("Etiqueta que se quitará", selector);
    leerEtiquetas = () => [selector.value];
  }
  const modal = abrirModal({ titulo: modo === "añadir" ? "Añadir etiqueta" : "Quitar etiqueta", clase: "modal-pequeno", contenido: [h("p", { class: "texto-modal" }, `A ${plural(elegidos.length, "contacto seleccionado", "contactos seleccionados")}.`), contenido] });
  modal.ponerBotones([
    { texto: "Cancelar", clase: "secundario", accion: () => modal.cerrar() },
    { texto: modo === "añadir" ? "Añadir" : "Quitar", clase: "primario", accion: async () => {
      // Si alguien escribió una etiqueta y no pulsó Enter, también cuenta.
      const pendiente = modal.cuerpo.querySelector(".campo-etiquetas-entrada");
      const etiquetas = [...leerEtiquetas(), ...(pendiente?.value.trim() ? [limpiarEtiqueta(pendiente.value)] : [])];
      if (!etiquetas.length) return aviso("Escribe al menos una etiqueta.", "error");
      const cambiados = elegidos.map((c) => ({ ...c, etiquetas: modo === "añadir" ? [...new Set([...(c.etiquetas ?? []), ...etiquetas])] : (c.etiquetas ?? []).filter((e) => !etiquetas.includes(e)) }));
      await guardarContactos(cambiados);
      modal.cerrar();
      aviso(`${modo === "añadir" ? "Etiqueta añadida a" : "Etiqueta quitada de"} ${plural(cambiados.length, "contacto")}`);
    } },
  ]);
}

async function borrarEnBloque() {
  const n = seleccion.size;
  const ok = await confirmar({ titulo: "Borrar contactos", texto: `Se borrarán ${plural(n, "contacto")} de este navegador. No se puede deshacer.`, aceptar: `Borrar ${plural(n, "contacto")}`, peligro: true });
  if (!ok) return;
  await borrarDe("contactos", [...seleccion]);
  seleccion.clear();
  aviso(`${plural(n, "contacto borrado", "contactos borrados")}`);
}

function exportarCSV() {
  const lista = filtrados();
  const campos = estado.campos;
  const cabecera = ["email", "nombre", "etiquetas", "fecha_alta", "origen", ...campos.map((c) => c.nombre)];
  const filas = lista.map((c) => [c.email, c.nombre, (c.etiquetas ?? []).join(", "), (c.alta ?? "").slice(0, 10), c.origen ?? "", ...campos.map((campoDef) => c.campos?.[campoDef.id] ?? "")]);
  // Punto y coma y la marca BOM: así Excel en español lo abre con columnas y acentos bien.
  descargar(`contactos-${hoyISO()}.csv`, "﻿" + escribirCSV([cabecera, ...filas], ";"), "text/csv;charset=utf-8");
  aviso(`Exportados ${plural(lista.length, "contacto")}`);
}

// ---------- Ficha lateral de un contacto ----------
// contacto = null para crear uno nuevo.
export function abrirFicha(contacto) {
  const esNuevo = !contacto;
  const borrador = esNuevo
    ? { id: nuevoId("c"), email: "", nombre: "", etiquetas: [], campos: {}, alta: new Date().toISOString(), origen: "Añadido a mano" }
    : structuredClone(contacto);
  borrador.campos ??= {};
  const original = JSON.stringify(borrador);

  const entradaEmail = h("input", { type: "email", class: "entrada", value: borrador.email, autocomplete: "off", oninput: (e) => { borrador.email = e.target.value; error.textContent = ""; } });
  const error = h("span", { class: "campo-error", role: "alert" });
  const entradaNombre = h("input", { type: "text", class: "entrada", value: borrador.nombre, autocomplete: "off", oninput: (e) => (borrador.nombre = e.target.value) });
  const tags = campoEtiquetas({ etiquetas: borrador.etiquetas, alCambiar: (lista) => (borrador.etiquetas = lista) });

  const camposPersonalizados = estado.campos.map((def) => campo(def.nombre,
    h("input", { class: "entrada", type: { numero: "number", fecha: "date", texto: "text" }[def.tipo], step: def.tipo === "numero" ? "any" : null, value: borrador.campos[def.id] ?? "", oninput: (e) => {
      if (e.target.value === "") delete borrador.campos[def.id];
      else borrador.campos[def.id] = e.target.value;
    } })));

  const enSegmentos = esNuevo ? [] : segmentosDe(contacto);
  const contenido = h("div", { class: "ficha" },
    h("div", { class: "ficha-cabeza" }, h("span", { class: "avatar avatar-grande" }, esNuevo ? icono("usuario", 22) : (borrador.nombre || borrador.email).charAt(0).toUpperCase()),
      h("div", {}, h("strong", {}, esNuevo ? "Contacto nuevo" : borrador.nombre || borrador.email), esNuevo ? null : h("span", { class: "tenue" }, borrador.email))),
    campo("Email *", h("div", {}, entradaEmail, error)),
    campo("Nombre", entradaNombre),
    campo("Etiquetas", tags.elemento),
    camposPersonalizados.length ? h("div", { class: "ficha-grupo" }, h("h3", { class: "ficha-subtitulo" }, "Campos personalizados"), camposPersonalizados) : null,
    h("dl", { class: "ficha-datos" },
      h("dt", {}, "Fecha de alta"), h("dd", {}, formatoFecha(borrador.alta)),
      h("dt", {}, "Origen"), h("dd", {}, borrador.origen || "—")),
    esNuevo ? null : h("div", { class: "ficha-grupo" }, h("h3", { class: "ficha-subtitulo" }, "Está en estos segmentos"),
      enSegmentos.length
        ? h("div", { class: "lista-pildoras" }, enSegmentos.map((s) => h("a", { class: "pildora pildora-segmento", href: `#/segmentos/${s.id}`, onclick: () => modal.cerrar(true) }, icono("segmentos", 13), s.nombre)))
        : h("p", { class: "tenue" }, estado.segmentos.length ? "En ninguno de tus segmentos." : "Todavía no has creado segmentos.")));

  const modal = abrirModal({
    titulo: esNuevo ? "Añadir contacto" : "Ficha del contacto",
    lateral: true,
    contenido,
    // Si hay cambios sin guardar, preguntamos antes de cerrar.
    antesDeCerrar: async () => JSON.stringify(borrador) === original || confirmar({ titulo: "Cambios sin guardar", texto: "¿Quieres cerrar la ficha sin guardar los cambios?", aceptar: "Cerrar sin guardar", peligro: true }),
  });

  async function guardar() {
    // Una etiqueta escrita sin pulsar Enter también se guarda.
    const pendiente = contenido.querySelector(".campo-etiquetas-entrada");
    if (pendiente.value.trim()) tags.añadir(pendiente.value);
    borrador.email = borrador.email.trim().toLowerCase();
    borrador.nombre = borrador.nombre.trim();
    if (!esEmailValido(borrador.email)) {
      error.textContent = "Escribe un email válido, por ejemplo nombre@dominio.com";
      return entradaEmail.focus();
    }
    if (estado.contactos.some((c) => c.email === borrador.email && c.id !== borrador.id)) {
      error.textContent = "Ya hay otro contacto con este email.";
      return entradaEmail.focus();
    }
    await guardarContacto(borrador);
    aviso(esNuevo ? "Contacto añadido" : "Cambios guardados");
    modal.cerrar(true);
  }

  modal.ponerBotones([
    esNuevo ? null : h("button", { class: "boton peligro-suave", onclick: async () => {
      if (!(await confirmar({ titulo: "Borrar contacto", texto: `Se borrará ${contacto.email}. No se puede deshacer.`, aceptar: "Borrar", peligro: true }))) return;
      await borrarDe("contactos", [contacto.id]);
      seleccion.delete(contacto.id);
      aviso("Contacto borrado");
      modal.cerrar(true);
    } }, icono("borrar", 16), "Borrar"),
    h("span", { class: "espaciador" }),
    { texto: "Cancelar", clase: "secundario", accion: () => modal.cerrar() },
    { texto: esNuevo ? "Añadir contacto" : "Guardar", clase: "primario", accion: guardar },
  ].filter(Boolean));
  contenido.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("input.entrada")) guardar(); });
}
