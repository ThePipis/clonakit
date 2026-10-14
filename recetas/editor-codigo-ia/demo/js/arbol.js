// El árbol de archivos: carpetas y archivos con su icono, buscador, menú ⋯
// (o clic derecho) para renombrar y borrar, y arrastrar archivos desde el ordenador.

import { crearArchivo, crearCarpeta, renombrar, borrarRuta, anadirDesdeOrdenador } from "./archivos.js";
import { abrirMenu, confirmar, pedirTexto, notificar } from "./dialogos.js";
import { abrirArchivo, descargarArchivo } from "./editor.js";
import { estado, escuchar, existe, esCarpeta } from "./estado.js";
import { esqueletoHtml } from "./plantilla.js";
import { $, crear, iconoArchivo, nombreDe, carpetaDe, unirRuta, extension, normalizar, problemaConNombre, plural, LISTA_EXTENSIONES } from "./util.js";

const plegadas = new Set(); // carpetas que la persona ha cerrado
let filtro = "";

const ICONO_CARPETA = `<svg class="icono-carpeta" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3.5a1 1 0 0 1 1-1h3.6l1.6 1.6h5.8a1 1 0 0 1 1 1v7.4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/></svg>`;

export function iniciarArbol() {
  $("#boton-nuevo-archivo").addEventListener("click", () => nuevoArchivo(""));
  $("#boton-nueva-carpeta").addEventListener("click", () => nuevaCarpeta(""));
  $("#editor-vacio-nuevo").addEventListener("click", () => nuevoArchivo(""));
  $("#buscador").addEventListener("input", (evento) => {
    filtro = normalizar(evento.target.value.trim());
    pintarArbol();
  });

  const arbol = $("#arbol");
  arbol.addEventListener("click", (evento) => {
    const fila = evento.target.closest(".arbol__fila");
    if (!fila) return;
    const mas = evento.target.closest(".arbol__mas");
    if (mas) {
      const caja = mas.getBoundingClientRect();
      menuDe(fila.dataset.ruta, caja.left, caja.bottom + 4);
    } else activarFila(fila);
  });
  arbol.addEventListener("contextmenu", (evento) => {
    evento.preventDefault();
    const fila = evento.target.closest(".arbol__fila");
    if (fila) menuDe(fila.dataset.ruta, evento.clientX, evento.clientY);
    else {
      abrirMenu(evento.clientX, evento.clientY, [
        { texto: "Nuevo archivo", accion: () => nuevoArchivo("") },
        { texto: "Nueva carpeta", accion: () => nuevaCarpeta("") },
      ]);
    }
  });
  // Teclado: Intro abre, F2 renombra, Suprimir borra.
  arbol.addEventListener("keydown", (evento) => {
    const fila = evento.target.closest(".arbol__fila");
    if (!fila) return;
    if (evento.key === "Enter" || evento.key === " ") activarFila(fila);
    else if (evento.key === "F2") pedirRenombrar(fila.dataset.ruta);
    else if (evento.key === "Delete") pedirBorrar(fila.dataset.ruta);
    else if (evento.key === "ContextMenu" || (evento.shiftKey && evento.key === "F10")) {
      const caja = fila.getBoundingClientRect();
      menuDe(fila.dataset.ruta, caja.left + 24, caja.bottom);
    } else return;
    evento.preventDefault();
  });

  configurarSoltar();
  escuchar("arbol", pintarArbol);
  escuchar("activo", marcarActivo);
  escuchar("renombrado", (traducir) => {
    const nuevas = [...plegadas].map(traducir);
    plegadas.clear();
    nuevas.forEach((c) => plegadas.add(c));
  });
}

// Al abrir un proyecto, el árbol empieza sin filtro y con todo desplegado.
export function cargarArbol() {
  plegadas.clear();
  filtro = "";
  $("#buscador").value = "";
  pintarArbol();
}

function activarFila(fila) {
  if (fila.dataset.tipo === "carpeta") {
    const ruta = fila.dataset.ruta;
    if (plegadas.has(ruta)) plegadas.delete(ruta);
    else plegadas.add(ruta);
    pintarArbol();
    $(`.arbol__fila[data-ruta="${CSS.escape(ruta)}"]`)?.focus();
  } else {
    abrirArchivo(fila.dataset.ruta);
    document.dispatchEvent(new CustomEvent("taller:archivo-elegido")); // en el móvil, salta al editor
  }
}

// ---------- Pintar ----------

// Convierte la lista plana de rutas en un árbol: { ruta, carpetas: Map, archivos: [] }.
function construirNodos() {
  const raiz = { ruta: "", carpetas: new Map(), archivos: [] };
  const asegurar = (ruta) => {
    let nodo = raiz;
    for (const parte of ruta.split("/")) {
      if (!nodo.carpetas.has(parte)) nodo.carpetas.set(parte, { ruta: unirRuta(nodo.ruta, parte), carpetas: new Map(), archivos: [] });
      nodo = nodo.carpetas.get(parte);
    }
    return nodo;
  };
  for (const carpeta of estado.proyecto.carpetas) asegurar(carpeta);
  for (const ruta of estado.archivos.keys()) {
    const carpeta = carpetaDe(ruta);
    (carpeta ? asegurar(carpeta) : raiz).archivos.push(ruta);
  }
  return raiz;
}

const comparar = (a, b) => nombreDe(a).localeCompare(nombreDe(b), "es", { numeric: true, sensitivity: "base" });
const coincide = (ruta) => !filtro || normalizar(nombreDe(ruta)).includes(filtro);
const tieneCoincidencias = (nodo) => nodo.archivos.some(coincide) || [...nodo.carpetas.values()].some(tieneCoincidencias);

export function pintarArbol() {
  if (!estado.proyecto) return;
  const filas = [];
  const recorrer = (nodo, nivel) => {
    // Primero las carpetas y después los archivos, cada grupo por orden alfabético.
    for (const hijo of [...nodo.carpetas.values()].sort((a, b) => comparar(a.ruta, b.ruta))) {
      if (filtro && !tieneCoincidencias(hijo)) continue;
      const abierta = Boolean(filtro) || !plegadas.has(hijo.ruta);
      filas.push(filaCarpeta(hijo.ruta, nivel, abierta));
      if (abierta) recorrer(hijo, nivel + 1);
    }
    for (const ruta of nodo.archivos.sort(comparar)) {
      if (coincide(ruta)) filas.push(filaArchivo(ruta, nivel));
    }
  };
  recorrer(construirNodos(), 0);

  if (!filas.length) {
    const texto = filtro ? "Ningún archivo coincide con la búsqueda." : "Proyecto vacío. Crea un archivo con + o arrastra aquí los tuyos.";
    filas.push(crear("p", { class: "arbol__vacio", text: texto }));
  }
  $("#arbol").replaceChildren(...filas);
  marcarActivo();
}

function filaArchivo(ruta, nivel) {
  return crear(
    "div",
    { class: "arbol__fila", role: "treeitem", tabindex: "0", title: ruta, "data-ruta": ruta, "data-tipo": "archivo", style: `--nivel:${nivel}` },
    [
      crear("span", { class: "arbol__flecha" }),
      iconoArchivo(ruta),
      crear("span", { class: "arbol__nombre", text: nombreDe(ruta) }),
      crear("button", { type: "button", class: "arbol__mas", "aria-label": `Opciones de ${nombreDe(ruta)}`, tabindex: "-1", text: "⋯" }),
    ],
  );
}

function filaCarpeta(ruta, nivel, abierta) {
  return crear(
    "div",
    {
      class: `arbol__fila arbol__fila--carpeta${abierta ? " abierta" : ""}`,
      role: "treeitem",
      tabindex: "0",
      "aria-expanded": String(abierta),
      title: ruta,
      "data-ruta": ruta,
      "data-tipo": "carpeta",
      style: `--nivel:${nivel}`,
    },
    [
      crear("span", { class: "arbol__flecha", "aria-hidden": "true" }),
      crear("span", { class: "arbol__icono", html: ICONO_CARPETA }),
      crear("span", { class: "arbol__nombre", text: nombreDe(ruta) }),
      crear("button", { type: "button", class: "arbol__mas", "aria-label": `Opciones de la carpeta ${nombreDe(ruta)}`, tabindex: "-1", text: "⋯" }),
    ],
  );
}

function marcarActivo() {
  const activa = estado.proyecto?.activa;
  for (const fila of document.querySelectorAll(".arbol__fila")) {
    const es = fila.dataset.tipo === "archivo" && fila.dataset.ruta === activa;
    fila.classList.toggle("arbol__fila--activa", es);
    fila.setAttribute("aria-selected", String(es));
  }
}

// ---------- Menú y acciones ----------

function menuDe(ruta, x, y) {
  if (esCarpeta(ruta)) {
    abrirMenu(x, y, [
      { texto: "Nuevo archivo aquí", accion: () => nuevoArchivo(ruta) },
      { texto: "Nueva carpeta aquí", accion: () => nuevaCarpeta(ruta) },
      { texto: "Renombrar", accion: () => pedirRenombrar(ruta) },
      "-",
      { texto: "Borrar carpeta", peligro: true, accion: () => pedirBorrar(ruta) },
    ]);
  } else {
    abrirMenu(x, y, [
      { texto: "Abrir", accion: () => abrirArchivo(ruta) },
      { texto: "Renombrar", accion: () => pedirRenombrar(ruta) },
      { texto: "Descargar", accion: () => descargarArchivo(ruta) },
      "-",
      { texto: "Borrar", peligro: true, accion: () => pedirBorrar(ruta) },
    ]);
  }
}

const yaExiste = (carpeta, nombre) => (existe(unirRuta(carpeta, nombre)) ? `Ya hay algo llamado «${nombre}» aquí.` : null);

export async function nuevoArchivo(carpeta) {
  const nombre = await pedirTexto({
    titulo: carpeta ? `Nuevo archivo en ${carpeta}` : "Nuevo archivo",
    etiqueta: `Nombre con su extensión (${LISTA_EXTENSIONES})`,
    placeholder: "contacto.html",
    aceptar: "Crear",
    validar: (n) => problemaConNombre(n) ?? yaExiste(carpeta, n),
  });
  if (!nombre) return;
  const ruta = unirRuta(carpeta, nombre);
  plegadas.delete(carpeta);
  // Un .html nuevo trae un esqueleto mínimo, con el nombre como título ("contacto" → "Contacto").
  const titulo = nombre.replace(/\.html$/i, "").replace(/^./, (letra) => letra.toUpperCase());
  await crearArchivo(ruta, extension(ruta) === "html" ? esqueletoHtml(titulo) : "");
  abrirArchivo(ruta);
  document.dispatchEvent(new CustomEvent("taller:archivo-elegido"));
}

async function nuevaCarpeta(carpeta) {
  const nombre = await pedirTexto({
    titulo: carpeta ? `Nueva carpeta en ${carpeta}` : "Nueva carpeta",
    etiqueta: "Nombre de la carpeta",
    placeholder: "imagenes",
    aceptar: "Crear",
    validar: (n) => problemaConNombre(n, { esCarpeta: true }) ?? yaExiste(carpeta, n),
  });
  if (!nombre) return;
  plegadas.delete(carpeta);
  crearCarpeta(unirRuta(carpeta, nombre));
}

async function pedirRenombrar(ruta) {
  const carpeta = esCarpeta(ruta);
  const actual = nombreDe(ruta);
  const punto = carpeta ? -1 : actual.lastIndexOf(".");
  const nombre = await pedirTexto({
    titulo: carpeta ? "Renombrar carpeta" : "Renombrar archivo",
    etiqueta: "Nombre nuevo",
    valor: actual,
    aceptar: "Renombrar",
    seleccion: punto > 0 ? [0, punto] : null, // selecciona el nombre sin la extensión
    validar: (n) => problemaConNombre(n, { esCarpeta: carpeta }) ?? (n !== actual ? yaExiste(carpetaDe(ruta), n) : null),
  });
  if (!nombre || nombre === actual) return;
  await renombrar(ruta, nombre);
  notificar(`Ahora se llama ${nombre}`);
}

async function pedirBorrar(ruta) {
  const carpeta = esCarpeta(ruta);
  const dentro = [...estado.archivos.keys()].filter((r) => r.startsWith(`${ruta}/`)).length;
  const mensaje = !carpeta
    ? "Se borrará el archivo. No se puede deshacer."
    : dentro
      ? `Se borrará la carpeta y ${plural(dentro, "archivo", "archivos")} que hay dentro. No se puede deshacer.`
      : "Se borrará la carpeta. No se puede deshacer.";
  if (!(await confirmar(`¿Borrar ${nombreDe(ruta)}?`, mensaje))) return;
  await borrarRuta(ruta);
  notificar(`${nombreDe(ruta)} se ha borrado`);
}

// ---------- Arrastrar archivos desde el ordenador ----------

function configurarSoltar() {
  const pantalla = $("#pantalla-espacio");
  const zona = $("#zona-arbol");
  const llevaArchivos = (evento) => [...(evento.dataTransfer?.types ?? [])].includes("Files");
  let dentro = 0; // dragenter/dragleave saltan también al pasar por los hijos: los contamos

  const limpiar = () => {
    dentro = 0;
    zona.classList.remove("soltando");
    document.querySelector(".arbol__fila--destino")?.classList.remove("arbol__fila--destino");
  };
  pantalla.addEventListener("dragenter", (evento) => {
    if (!llevaArchivos(evento)) return;
    dentro++;
    zona.classList.add("soltando");
  });
  pantalla.addEventListener("dragleave", (evento) => {
    if (llevaArchivos(evento) && --dentro <= 0) limpiar();
  });
  // Sin preventDefault, el navegador abriría el archivo y saldríamos de Taller.
  pantalla.addEventListener("dragover", (evento) => {
    if (!llevaArchivos(evento)) return;
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "copy";
    const destino = filaDestino(evento.target);
    const marcada = document.querySelector(".arbol__fila--destino");
    if (marcada !== destino) {
      marcada?.classList.remove("arbol__fila--destino");
      destino?.classList.add("arbol__fila--destino");
    }
  });
  pantalla.addEventListener("drop", async (evento) => {
    if (!llevaArchivos(evento)) return;
    evento.preventDefault();
    const destino = filaDestino(evento.target);
    const carpeta = destino ? destino.dataset.ruta : "";
    const pendiente = leerSoltados(evento.dataTransfer); // hay que leerlos antes de cualquier await
    limpiar();
    const { anadidos, saltados } = await anadirDesdeOrdenador(await pendiente, carpeta);
    if (anadidos) notificar(`${plural(anadidos, "archivo añadido", "archivos añadidos")}${carpeta ? ` en ${carpeta}` : ""}`);
    if (saltados.length) notificar(`No se añadieron: ${saltados.join(", ")}. Solo archivos de texto (${LISTA_EXTENSIONES}).`, "error");
  });
}

// Si se suelta encima de una carpeta del árbol (o de un archivo dentro de ella), va ahí.
function filaDestino(elemento) {
  const fila = elemento.closest?.(".arbol__fila");
  if (!fila) return null;
  if (fila.dataset.tipo === "carpeta") return fila;
  const carpeta = carpetaDe(fila.dataset.ruta);
  return carpeta ? document.querySelector(`.arbol__fila[data-ruta="${CSS.escape(carpeta)}"]`) : null;
}

// Lee lo soltado. Si son carpetas, entra en ellas y conserva sus rutas.
function leerSoltados(datos) {
  const entradas = [...(datos.items ?? [])].map((item) => item.kind === "file" && item.webkitGetAsEntry?.()).filter(Boolean);
  if (!entradas.length) return Promise.resolve([...datos.files].map((file) => ({ ruta: file.name, file })));
  return recorrerEntradas(entradas, "");
}

async function recorrerEntradas(entradas, prefijo) {
  const lista = [];
  for (const entrada of entradas) {
    if (entrada.isFile) {
      const file = await new Promise((ok, mal) => entrada.file(ok, mal));
      lista.push({ ruta: prefijo + entrada.name, file });
    } else if (entrada.isDirectory) {
      const lector = entrada.createReader();
      const hijos = [];
      let lote;
      do {
        lote = await new Promise((ok, mal) => lector.readEntries(ok, mal));
        hijos.push(...lote);
      } while (lote.length);
      lista.push(...(await recorrerEntradas(hijos, `${prefijo}${entrada.name}/`)));
    }
  }
  return lista;
}
