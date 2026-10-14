// Panel de misiones: los encargos que le haces a la IA.
// Cada misión tiene título, objetivo, "está hecha cuando…", archivos implicados,
// notas y estado (pendiente, en curso o hecha). Se reordenan arrastrándolas.

import { anotarCambio } from "./archivos.js";
import * as db from "./db.js";
import { abrirDialogo, confirmar, notificar } from "./dialogos.js";
import { estado, escuchar, avisar } from "./estado.js";
import { hacerReordenable } from "./reordenar.js";
import { $, crear, alParar, iconoArchivo, nuevoId, plural, tipoDe } from "./util.js";

export const ESTADOS = {
  pendiente: "Pendiente",
  "en-curso": "En curso",
  hecha: "Hecha",
};

let filtro = "todas";
let abierta = null; // id de la misión que se está editando (null = se ve la lista)

const porId = (id) => estado.misiones.find((m) => m.id === id);

export function iniciarMisiones() {
  // Si cambian los archivos (renombrar, borrar...), se actualizan las casillas y los contadores.
  escuchar("arbol", () => {
    if (!estado.proyecto) return;
    if (abierta && porId(abierta)) pintarCasillas(porId(abierta));
    else pintarMisiones();
  });
}

export function cargarMisiones() {
  filtro = "todas";
  abierta = null;
  pintarMisiones();
}

export function pintarMisiones() {
  if (abierta && porId(abierta)) pintarDetalle(porId(abierta));
  else {
    abierta = null;
    pintarLista();
  }
}

// ---------- Lista ----------

function pintarLista() {
  const cuenta = (e) => estado.misiones.filter((m) => m.estado === e).length;
  const filtros = [
    ["todas", "Todas", estado.misiones.length],
    ["pendiente", "Pendientes", cuenta("pendiente")],
    ["en-curso", "En curso", cuenta("en-curso")],
    ["hecha", "Hechas", cuenta("hecha")],
  ];
  const barra = crear(
    "div",
    { class: "misiones__filtros", role: "group", "aria-label": "Filtrar por estado" },
    filtros.map(([valor, texto, numero]) =>
      crear("button", { type: "button", class: `filtro filtro--${valor}`, "aria-pressed": String(filtro === valor), "data-filtro": valor, onclick: () => cambiarFiltro(valor) }, [
        crear("span", { text: texto }),
        crear("span", { class: "filtro__numero", text: numero }),
      ]),
    ),
  );

  const visibles = estado.misiones.filter((m) => filtro === "todas" || m.estado === filtro);
  const lista = crear("div", { class: "misiones__lista", role: "list" });
  for (const mision of visibles) {
    const archivos = mision.archivos.length;
    lista.append(
      crear("div", { class: `mision mision--${mision.estado}`, role: "listitem", "data-id": mision.id }, [
        crear("span", { class: "mision__asa", title: "Arrastra para cambiar la prioridad", "aria-hidden": "true" }),
        crear("button", { type: "button", class: "mision__abrir", onclick: () => abrirMision(mision.id) }, [
          crear("span", { class: `mision__titulo${mision.titulo ? "" : " mision__titulo--vacio"}`, text: mision.titulo || "Sin título" }),
          crear("span", { class: "mision__meta" }, [
            crear("span", { class: `pastilla pastilla--${mision.estado}`, text: ESTADOS[mision.estado] }),
            crear("span", { class: "mision__archivos", text: plural(archivos, "archivo", "archivos") }),
          ]),
        ]),
      ]),
    );
  }
  if (!visibles.length) {
    lista.append(
      crear("div", { class: "misiones__vacio" }, [
        crear("p", {
          text: estado.misiones.length
            ? "No hay misiones con este estado."
            : "Una misión es un encargo para la IA: qué quieres conseguir, cuándo estará hecho y qué archivos toca. Crea la primera y cópiala en tu asistente.",
        }),
      ]),
    );
  }
  hacerReordenable(lista, { selector: ".mision", eje: "y", clave: (el) => el.dataset.id, alTerminar: reordenar });

  const nueva = crear("button", { type: "button", class: "boton boton--principal boton--ancho", id: "boton-nueva-mision", text: "+ Nueva misión", onclick: nuevaMision });
  $("#misiones").replaceChildren(barra, lista, nueva);
}

function cambiarFiltro(valor) {
  filtro = valor;
  pintarLista();
}

// Al soltar una misión: las visibles toman el orden nuevo y las ocultas (por el filtro) no se mueven.
async function reordenar(idsVisibles) {
  const visibles = new Set(idsVisibles);
  let siguiente = 0;
  estado.misiones = estado.misiones.map((m) => (visibles.has(m.id) ? porId(idsVisibles[siguiente++]) : m));
  estado.misiones.forEach((m, i) => (m.orden = i));
  await db.enLote(estado.misiones.map((m) => ({ poner: m, en: "misiones" })));
  anotarCambio();
  pintarLista();
}

async function nuevaMision() {
  const mision = {
    id: nuevoId(),
    proyectoId: estado.proyecto.id,
    titulo: "",
    objetivo: "",
    hecho: "",
    archivos: [],
    notas: "",
    estado: "pendiente",
    orden: estado.misiones.length,
    creada: Date.now(),
  };
  estado.misiones.push(mision);
  abrirMision(mision.id); // se ve al momento; se guarda justo después
  avisar("misiones");
  await db.guardar("misiones", mision);
  anotarCambio();
}

function abrirMision(id) {
  abierta = id;
  pintarDetalle(porId(id));
  const titulo = $("#mision-titulo");
  if (!titulo.value) titulo.focus();
}

// ---------- Detalle (editar una misión) ----------

// Cada misión se guarda sola poco después de dejar de escribir.
let sinGuardar = null; // la misión con cambios que aún no han llegado a la base de datos
const guardarMision = alParar(async (mision) => {
  await db.guardar("misiones", mision);
  if (sinGuardar === mision && !guardarMision.pendiente()) sinGuardar = null;
  anotarCambio();
}, 400);

// Al salir del proyecto, guardamos ya lo que estuviera pendiente.
export function guardarMisionPendiente() {
  guardarMision.ahora();
}

export const misionSinGuardar = () => sinGuardar;

function pintarDetalle(mision) {
  const campo = (etiqueta, nombre, filas, ayuda) =>
    crear("label", { class: "grupo" }, [
      crear("span", { class: "grupo__etiqueta", text: etiqueta }),
      crear("textarea", { class: "campo campo--area", name: nombre, rows: filas, placeholder: ayuda, text: mision[nombre] }),
    ]);

  const estados = crear(
    "div",
    { class: "segmentado segmentado--estado", role: "radiogroup", "aria-label": "Estado" },
    Object.entries(ESTADOS).map(([valor, texto]) =>
      crear("label", { class: `segmentado__opcion segmentado__opcion--${valor}` }, [
        crear("input", { type: "radio", name: "estado", value: valor, checked: mision.estado === valor }),
        crear("span", { text: texto }),
      ]),
    ),
  );

  const formulario = crear("form", { class: "mision-detalle", onsubmit: (e) => e.preventDefault() }, [
    crear("button", { type: "button", class: "enlace-volver", text: "← Todas las misiones", onclick: volverALista }),
    crear("label", { class: "grupo" }, [
      crear("span", { class: "grupo__etiqueta", text: "Título" }),
      crear("input", { class: "campo campo--titulo", id: "mision-titulo", name: "titulo", value: mision.titulo, placeholder: "Por ejemplo: Añadir un formulario de reservas", autocomplete: "off" }),
    ]),
    crear("div", { class: "grupo" }, [crear("span", { class: "grupo__etiqueta", text: "Estado" }), estados]),
    campo("Objetivo: qué quieres conseguir", "objetivo", 3, "Describe el resultado que esperas, con tus palabras."),
    campo("Está hecha cuando…", "hecho", 2, "Por ejemplo: se ve bien en el móvil y valida el email."),
    crear("fieldset", { class: "grupo grupo--archivos" }, [
      crear("legend", { class: "grupo__etiqueta", text: "Archivos implicados" }),
      crear("div", { class: "casillas", id: "mision-casillas" }),
    ]),
    campo("Notas", "notas", 3, "Qué se cambió, qué falta, ideas…"),
    crear("div", { class: "mision-detalle__acciones" }, [
      crear("button", { type: "button", class: "boton boton--principal", id: "boton-copiar-mision", text: "Copiar para la IA", onclick: () => copiarMision(mision) }),
      crear("button", { type: "button", class: "boton boton--peligro-suave", text: "Borrar", onclick: () => borrarMision(mision) }),
    ]),
    crear("p", { class: "mision-detalle__nota", text: "Los cambios se guardan solos. «Copiar» incluye el objetivo, el criterio y el contenido actual de los archivos marcados." }),
  ]);

  // Cualquier cambio en el formulario se apunta en la misión y se guarda.
  formulario.addEventListener("input", (evento) => {
    const { name, value, type } = evento.target;
    if (type === "checkbox") mision.archivos = [...formulario.querySelectorAll(".casillas input:checked")].map((c) => c.value);
    else if (name in mision) mision[name] = value;
    sinGuardar = mision;
    guardarMision(mision);
    if (name === "estado" || type === "checkbox") avisar("misiones");
  });

  $("#misiones").replaceChildren(formulario);
  pintarCasillas(mision);
}

// Casillas con todos los archivos del proyecto (marcadas las que usa la misión).
function pintarCasillas(mision) {
  const caja = $("#mision-casillas");
  if (!caja) return;
  const rutas = [...estado.archivos.keys()].sort((a, b) => a.localeCompare(b, "es"));
  caja.replaceChildren(
    ...rutas.map((ruta) =>
      crear("label", { class: "casilla" }, [
        crear("input", { type: "checkbox", value: ruta, checked: mision.archivos.includes(ruta) }),
        iconoArchivo(ruta),
        crear("span", { class: "casilla__ruta", text: ruta }),
      ]),
    ),
  );
  if (!rutas.length) caja.append(crear("p", { class: "casillas__vacio", text: "El proyecto aún no tiene archivos." }));
}

function volverALista() {
  guardarMision.ahora();
  abierta = null;
  pintarLista();
}

async function borrarMision(mision) {
  if (!(await confirmar("¿Borrar esta misión?", `«${mision.titulo || "Sin título"}» desaparecerá de la lista. No se puede deshacer.`))) return;
  guardarMision.cancelar();
  estado.misiones = estado.misiones.filter((m) => m.id !== mision.id);
  await db.borrar("misiones", mision.id);
  anotarCambio();
  avisar("misiones");
  abierta = null;
  pintarLista();
  notificar("Misión borrada");
}

// ---------- Copiar para la IA ----------

export function textoParaIA(mision) {
  const partes = [
    `# Misión: ${mision.titulo || "Sin título"}`,
    "",
    `Proyecto «${estado.proyecto.nombre}»: una web estática hecha con HTML, CSS y JavaScript, sin build ni librerías.`,
    "",
    "## Objetivo",
    mision.objetivo.trim() || "(sin escribir)",
    "",
    "## Está hecha cuando",
    mision.hecho.trim() || "(sin escribir)",
  ];
  const archivos = mision.archivos.filter((ruta) => estado.archivos.has(ruta));
  if (archivos.length) {
    partes.push("", "## Archivos implicados (contenido actual)");
    for (const ruta of archivos) {
      const contenido = estado.archivos.get(ruta).contenido;
      // La "valla" de código tiene que ser más larga que cualquier fila de ` que haya dentro.
      const valla = "`".repeat(Math.max(3, ...[...contenido.matchAll(/`+/g)].map((m) => m[0].length + 1)));
      partes.push("", `### ${ruta}`, `${valla}${tipoDe(ruta).lenguaje}`, contenido.replace(/\n$/, ""), valla);
    }
  }
  partes.push("", "Cuando termines, dame el contenido completo de cada archivo que cambies.");
  return partes.join("\n");
}

async function copiarMision(mision) {
  guardarMision.ahora();
  const texto = textoParaIA(mision);
  try {
    await navigator.clipboard.writeText(texto);
    notificar("Misión copiada. Pégala en Antigravity o en tu asistente.");
  } catch {
    // Si el navegador no deja usar el portapapeles, enseñamos el texto para copiarlo a mano.
    const area = crear("textarea", { class: "campo campo--area campo--copia", readonly: true, rows: 12, text: texto });
    await abrirDialogo({
      titulo: "Copia el texto de la misión",
      cuerpo: crear("div", {}, [crear("p", { class: "dialogo__texto", text: "Tu navegador no ha dejado copiar automáticamente. Selecciona el texto y cópialo con Ctrl/Cmd+C." }), area]),
      botones: [{ texto: "Listo", valor: "ok", clase: "boton--principal" }],
      alAbrir: () => area.select(),
    });
  }
}
