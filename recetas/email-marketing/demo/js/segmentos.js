// Pantalla de Segmentos: grupos guardados de contactos definidos por condiciones.
// El número de contactos que cumplen se recalcula mientras se edita.

import { estado, borrarDe, guardarSegmento, nuevoId } from "./estado.js";
import { condicionCompleta, condicionNueva, contactosDe, describirCondicion, filaCondicion } from "./condiciones.js";
import { abrirFicha } from "./contactos.js";
import { aviso, boton, confirmar, entradaTitulo, formatoNumero, h, icono, pedirTexto, pildora, plural, rellenar, vacio } from "./ui.js";

let raiz = null;
let abierto = null; // segmento que se está editando (o null en la lista)

export const vistaSegmentos = {
  pintar(contenedor, id) {
    raiz = contenedor;
    abierto = id ? estado.segmentos.find((s) => s.id === id) : null;
    if (id && !abierto) return (location.hash = "#/segmentos");
    abierto ? pintarEditor() : pintarLista();
  },
  // En la lista repintamos todo; en el editor solo los resultados (para no
  // quitarle el foco a la casilla donde se está escribiendo).
  actualizar() {
    abierto ? pintarResultados() : pintarLista();
  },
};

export async function crearSegmento() {
  const nombre = await pedirTexto({ titulo: "Nuevo segmento", etiqueta: "Nombre del segmento", valor: "" });
  if (!nombre) return;
  const segmento = { id: nuevoId("seg"), nombre, modo: "todas", condiciones: [condicionNueva("etiqueta")], creado: new Date().toISOString() };
  await guardarSegmento(segmento);
  location.hash = `#/segmentos/${segmento.id}`;
}

function pintarLista() {
  const cabecera = h("header", { class: "cabecera-vista" },
    h("div", {}, h("h1", {}, "Segmentos"), h("p", { class: "subtitulo" }, "Grupos de contactos que se actualizan solos según sus etiquetas y campos.")),
    estado.segmentos.length ? boton("Nuevo segmento", crearSegmento, { clase: "primario", icono: "mas" }) : null);

  if (!estado.segmentos.length) {
    raiz.replaceChildren(cabecera, vacio({
      icono: "segmentos",
      titulo: "Decide a quién escribir",
      texto: "Un segmento reúne a los contactos que cumplen unas condiciones: por ejemplo, quien tiene la etiqueta «feria-2026» y le interesa la cerámica.",
      acciones: [boton("Crear mi primer segmento", crearSegmento, { clase: "primario", icono: "mas" })],
    }));
    return;
  }

  const tarjetas = [...estado.segmentos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((s) => {
    const n = contactosDe(s).length;
    const completas = s.condiciones.filter(condicionCompleta);
    return h("a", { class: "tarjeta tarjeta-enlace tarjeta-segmento", href: `#/segmentos/${s.id}` },
      h("div", { class: "tarjeta-segmento-cifra" }, h("strong", {}, formatoNumero(n)), h("span", {}, n === 1 ? "contacto" : "contactos")),
      h("div", { class: "tarjeta-segmento-texto" },
        h("h3", {}, s.nombre),
        h("p", { class: "tenue" }, completas.length ? completas.map(describirCondicion).join(s.modo === "alguna" ? " · o · " : " · y · ") : "Sin condiciones: incluye a todos")));
  });
  raiz.replaceChildren(cabecera, h("div", { class: "rejilla-tarjetas" }, tarjetas));
}

function guardar() {
  guardarSegmento(abierto).then(() => marcarGuardado());
}

function marcarGuardado() {
  const indicador = raiz.querySelector(".guardado");
  if (!indicador) return;
  indicador.classList.add("visible");
  clearTimeout(indicador._t);
  indicador._t = setTimeout(() => indicador.classList.remove("visible"), 1400);
}

function pintarEditor() {
  const s = abierto;
  const filas = h("div", { class: "lista-condiciones" });

  function pintarFilas() {
    filas.replaceChildren(...s.condiciones.map((c, i) => filaCondicion(c, {
      alCambiar: () => { guardar(); pintarResultados(); },
      alBorrar: () => { s.condiciones.splice(i, 1); pintarFilas(); guardar(); pintarResultados(); },
    })));
    if (!s.condiciones.length) filas.append(h("p", { class: "tenue" }, "Sin condiciones: el segmento incluye a todos tus contactos."));
  }
  pintarFilas();

  // Interruptor "todas / alguna".
  const interruptor = h("div", { class: "segmentado", role: "radiogroup", "aria-label": "Cómo se combinan las condiciones" },
    [["todas", "todas"], ["alguna", "alguna"]].map(([valor, texto]) => h("button", { type: "button", role: "radio", "aria-checked": String(s.modo === valor), class: s.modo === valor ? "activo" : "", onclick: (e) => {
      s.modo = valor;
      interruptor.querySelectorAll("button").forEach((b) => { b.classList.toggle("activo", b === e.currentTarget); b.setAttribute("aria-checked", String(b === e.currentTarget)); });
      guardar();
      pintarResultados();
    } }, texto)));

  const nombre = entradaTitulo({ valor: s.nombre, etiqueta: "Nombre del segmento", alCambiar: (texto) => { s.nombre = texto || "Segmento sin nombre"; guardar(); } });

  raiz.replaceChildren(
    h("header", { class: "cabecera-vista cabecera-editor" },
      h("div", { class: "cabecera-editor-titulo" },
        h("a", { class: "boton-icono", href: "#/segmentos", "aria-label": "Volver a segmentos", title: "Volver" }, icono("atras")),
        nombre, h("span", { class: "guardado" }, icono("check", 14), "Guardado")),
      boton("Borrar", borrarSegmento, { clase: "peligro-suave", icono: "borrar" })),
    h("section", { class: "tarjeta" },
      h("div", { class: "frase-condiciones" }, h("span", {}, "Incluir a los contactos que cumplan"), interruptor, h("span", {}, "estas condiciones:")),
      filas,
      boton("Añadir condición", () => { s.condiciones.push(condicionNueva("etiqueta")); pintarFilas(); guardar(); filas.querySelector(".condicion:last-child select")?.focus(); }, { icono: "mas", clase: "fantasma" })),
    h("section", { class: "tarjeta", id: "resultados-segmento" }));
  pintarResultados();
}

// Recalcula y pinta cuántos contactos cumplen y cuáles son.
function pintarResultados() {
  const zona = raiz?.querySelector("#resultados-segmento");
  if (!zona || !abierto) return;
  const lista = contactosDe(abierto);
  const MAX = 100;
  rellenar(zona,
    h("div", { class: "resultado-cifra" },
      h("strong", { id: "cuenta-segmento" }, formatoNumero(lista.length)),
      h("span", {}, `${lista.length === 1 ? "contacto cumple" : "contactos cumplen"} ahora mismo`, h("small", { class: "tenue" }, ` de ${plural(estado.contactos.length, "contacto")} en total`))),
    lista.length ? h("div", { class: "tabla-marco" }, h("table", { class: "tabla tabla-compacta" },
      h("thead", {}, h("tr", {}, h("th", {}, "Email"), h("th", {}, "Nombre"), h("th", {}, "Etiquetas"))),
      h("tbody", {}, lista.slice(0, MAX).map((c) => h("tr", { onclick: () => abrirFicha(c) },
        h("td", { "data-etiqueta": "Email" }, c.email),
        h("td", { "data-etiqueta": "Nombre" }, c.nombre || "—"),
        h("td", { class: "celda-etiquetas", "data-etiqueta": "Etiquetas" }, (c.etiquetas ?? []).map((e) => pildora(e)))))))) : h("p", { class: "tenue" }, estado.contactos.length ? "Ningún contacto cumple estas condiciones." : "Todavía no tienes contactos. Impórtalos en la sección Contactos."),
    lista.length > MAX ? h("p", { class: "tenue" }, `Y ${formatoNumero(lista.length - MAX)} más.`) : null);
}

async function borrarSegmento() {
  const usado = estado.automatizaciones.some((a) => JSON.stringify(a).includes(`"${abierto.id}"`));
  const ok = await confirmar({
    titulo: "Borrar segmento",
    texto: `Se borrará «${abierto.nombre}». Los contactos no se borran.${usado ? " Ojo: alguna automatización usa este segmento y quedará incompleta." : ""}`,
    aceptar: "Borrar segmento",
    peligro: true,
  });
  if (!ok) return;
  await borrarDe("segmentos", [abierto.id]);
  aviso("Segmento borrado");
  location.hash = "#/segmentos";
}
