// Pantalla de inicio: la lista de proyectos en tarjetas, con crear, importar,
// abrir, renombrar, duplicar y borrar.

import { crearProyecto, duplicarProyecto, importarJson } from "./copias.js";
import * as db from "./db.js";
import { abrirDialogo, abrirMenu, confirmar, notificar, pedirTexto } from "./dialogos.js";
import { archivosPlantilla } from "./plantilla.js";
import { documentoMiniatura } from "./vista-previa.js";
import { $, crear, formatearFecha, plural } from "./util.js";

export function iniciarProyectos() {
  $("#boton-nuevo-proyecto").addEventListener("click", dialogoNuevoProyecto);
  $("#boton-importar").addEventListener("click", () => $("#entrada-importar").click());
  $("#entrada-importar").addEventListener("change", async (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = ""; // para poder importar el mismo archivo otra vez
    if (!archivo) return;
    try {
      const proyecto = await importarJson(archivo);
      notificar(`«${proyecto.nombre}» importado`);
      await mostrarProyectos(proyecto.id);
    } catch (error) {
      notificar(error.message, "error");
    }
  });
}

// Pinta las tarjetas. Si se indica un id, esa tarjeta se resalta un momento.
export async function mostrarProyectos(resaltar = null) {
  const [proyectos, archivos, misiones] = await Promise.all([db.leerTodo("proyectos"), db.leerTodo("archivos"), db.leerTodo("misiones")]);
  proyectos.sort((a, b) => b.modificado - a.modificado);

  // Agrupamos archivos y misiones por proyecto.
  const archivosDe = new Map();
  for (const a of archivos) {
    if (!archivosDe.has(a.proyectoId)) archivosDe.set(a.proyectoId, new Map());
    archivosDe.get(a.proyectoId).set(a.ruta, a.contenido);
  }
  const misionesDe = (id) => misiones.filter((m) => m.proyectoId === id);

  const rejilla = $("#lista-proyectos");
  $("#contador-proyectos").textContent = proyectos.length ? String(proyectos.length) : "";
  if (!proyectos.length) {
    rejilla.replaceChildren(
      crear("div", { class: "proyectos__vacio" }, [
        crear("div", { class: "proyectos__vacio-icono", html: '<svg class="icono" aria-hidden="true"><use href="#i-codigo"/></svg>' }),
        crear("h3", { text: "Aún no tienes proyectos" }),
        crear("p", { text: "Crea el primero con la plantilla básica: en un minuto verás tu página funcionando." }),
        crear("button", { type: "button", class: "boton boton--principal", text: "+ Crear mi primer proyecto", onclick: dialogoNuevoProyecto }),
      ]),
    );
    return;
  }

  rejilla.replaceChildren(...proyectos.map((p) => tarjeta(p, archivosDe.get(p.id) ?? new Map(), misionesDe(p.id))));
  if (resaltar) {
    const elegida = rejilla.querySelector(`[data-id="${CSS.escape(resaltar)}"]`);
    elegida?.classList.add("tarjeta-proyecto--nueva");
    elegida?.scrollIntoView({ block: "nearest" });
  }
}

function tarjeta(proyecto, archivos, misiones) {
  const pendientes = misiones.filter((m) => m.estado === "pendiente").length;
  const enCurso = misiones.filter((m) => m.estado === "en-curso").length;

  // Miniatura: la página del proyecto en pequeño (sin scripts, solo HTML y CSS).
  const html = documentoMiniatura((ruta) => archivos.get(ruta), [...archivos.keys()]);
  const miniatura = crear("div", { class: "miniatura", "aria-hidden": "true" });
  if (html) miniatura.append(crear("iframe", { sandbox: "", srcdoc: html, tabindex: "-1", loading: "lazy", title: `Miniatura de ${proyecto.nombre}` }));
  else miniatura.append(crear("div", { class: "miniatura__vacia", text: archivos.size ? "Sin página .html" : "Proyecto vacío" }));

  const datos = crear("p", { class: "tarjeta-proyecto__datos" }, [
    crear("span", { text: plural(archivos.size, "archivo", "archivos") }),
    crear("span", { class: `pastilla pastilla--${pendientes ? "pendiente" : "nada"}`, text: `${plural(pendientes, "misión pendiente", "misiones pendientes")}` }),
    enCurso ? crear("span", { class: "pastilla pastilla--en-curso", text: `${enCurso} en curso` }) : null,
  ]);

  return crear("article", { class: "tarjeta-proyecto", "data-id": proyecto.id }, [
    miniatura,
    crear("div", { class: "tarjeta-proyecto__info" }, [
      // El enlace se estira por CSS para que toda la tarjeta se pueda pulsar.
      crear("h3", { class: "tarjeta-proyecto__nombre" }, crear("a", { href: `#/proyecto/${encodeURIComponent(proyecto.id)}`, class: "tarjeta-proyecto__enlace", text: proyecto.nombre })),
      crear("p", { class: "tarjeta-proyecto__fecha", title: new Date(proyecto.modificado).toLocaleString("es-ES"), text: `Último cambio: ${formatearFecha(proyecto.modificado)}` }),
      datos,
    ]),
    crear("button", {
      type: "button",
      class: "tarjeta-proyecto__menu boton boton--icono",
      "aria-label": `Opciones de ${proyecto.nombre}`,
      text: "⋯",
      onclick: (evento) => {
        const caja = evento.currentTarget.getBoundingClientRect();
        menuProyecto(proyecto, caja.right - 180, caja.bottom + 4);
      },
    }),
  ]);
}

function menuProyecto(proyecto, x, y) {
  abrirMenu(x, y, [
    { texto: "Abrir", accion: () => (location.hash = `#/proyecto/${encodeURIComponent(proyecto.id)}`) },
    { texto: "Renombrar", accion: () => renombrarProyecto(proyecto) },
    { texto: "Duplicar", accion: () => duplicar(proyecto) },
    "-",
    { texto: "Borrar", peligro: true, accion: () => borrarProyecto(proyecto) },
  ]);
}

async function renombrarProyecto(proyecto) {
  const nombre = await pedirTexto({
    titulo: "Renombrar proyecto",
    etiqueta: "Nombre del proyecto",
    valor: proyecto.nombre,
    aceptar: "Renombrar",
    validar: (n) => (n ? null : "Escribe un nombre."),
  });
  if (!nombre || nombre === proyecto.nombre) return;
  await db.guardar("proyectos", { ...proyecto, nombre, modificado: Date.now() });
  await mostrarProyectos(proyecto.id);
}

async function duplicar(proyecto) {
  const copia = await duplicarProyecto(proyecto.id);
  notificar(`Creado «${copia.nombre}»`);
  await mostrarProyectos(copia.id);
}

async function borrarProyecto(proyecto) {
  const seguro = await confirmar(`¿Borrar «${proyecto.nombre}»?`, "Se borrarán sus archivos y sus misiones de este navegador. No se puede deshacer. Si quieres conservar una copia, ábrelo antes y exporta el .json.");
  if (!seguro) return;
  await db.borrarProyecto(proyecto.id);
  notificar("Proyecto borrado");
  await mostrarProyectos();
}

// Ventana "Nuevo proyecto": nombre y elegir entre plantilla básica o vacío.
async function dialogoNuevoProyecto() {
  const nombre = crear("input", { class: "campo", type: "text", value: "Mi proyecto", autocomplete: "off", maxlength: "80" });
  const error = crear("p", { class: "dialogo__error", role: "alert" });
  const opcion = (valor, titulo, texto, marcada) =>
    crear("label", { class: "opcion-tarjeta" }, [
      crear("input", { type: "radio", name: "inicio", value: valor, checked: marcada }),
      crear("span", { class: "opcion-tarjeta__titulo", text: titulo }),
      crear("span", { class: "opcion-tarjeta__texto", text: texto }),
    ]);
  const cuerpo = crear("div", { class: "nuevo-proyecto" }, [
    crear("label", { class: "dialogo__etiqueta" }, [crear("span", { text: "Nombre" }), nombre, error]),
    crear("div", { class: "opciones-tarjeta", role: "radiogroup", "aria-label": "Cómo empezar" }, [
      opcion("plantilla", "Plantilla básica", "index.html, style.css y app.js con una página de ejemplo.", true),
      opcion("vacio", "Vacío", "Sin archivos. Empiezas desde cero.", false),
    ]),
  ]);

  const respuesta = await abrirDialogo({
    titulo: "Nuevo proyecto",
    cuerpo,
    botones: [
      { texto: "Cancelar", valor: "" },
      { texto: "Crear proyecto", valor: "crear", clase: "boton--principal" },
    ],
    alAbrir: () => nombre.select(),
    validar: () => {
      error.textContent = nombre.value.trim() ? "" : "Escribe un nombre.";
      return Boolean(nombre.value.trim());
    },
  });
  if (respuesta !== "crear") return;

  const titulo = nombre.value.trim();
  const conPlantilla = cuerpo.querySelector('input[name="inicio"]:checked').value === "plantilla";
  const proyecto = await crearProyecto({ nombre: titulo, archivos: conPlantilla ? archivosPlantilla(titulo) : [] });
  location.hash = `#/proyecto/${encodeURIComponent(proyecto.id)}`;
}
