// El editor: pestañas con los archivos abiertos, el área de código con números
// de línea y la barra de estado (línea, columna, tipo y si está guardado).
//
// Cada pestaña tiene su propio <textarea>. Así cada archivo conserva su
// historial de deshacer (Ctrl/Cmd+Z) y su posición al cambiar de pestaña.

import { cambiarContenido, guardarArchivo, guardarProyecto } from "./archivos.js";
import { estado, escuchar, avisar, estaSucio } from "./estado.js";
import { hacerReordenable } from "./reordenar.js";
import { $, crear, iconoArchivo, nombreDe, tipoDe, extension, descargar } from "./util.js";

const SANGRIA = "  "; // dos espacios por nivel
const areas = new Map(); // ruta → <textarea>
let tabSaleDelEditor = false; // tras pulsar Escape, Tab vuelve a mover el foco (accesibilidad)

const areaActiva = () => areas.get(estado.proyecto?.activa) ?? null;

export function iniciarEditor() {
  const contenedor = $("#areas");
  // Escuchamos en el contenedor (y no en cada textarea) para no repetir código.
  contenedor.addEventListener("input", (evento) => {
    const area = evento.target;
    cambiarContenido(area.dataset.ruta, area.value);
    pintarNumeros();
    actualizarPosicion();
  });
  contenedor.addEventListener("keydown", alPulsarTecla);
  contenedor.addEventListener("scroll", sincronizarDesplazamiento, true); // el scroll no "sube", por eso true
  for (const tipo of ["keyup", "mouseup", "focus", "select"]) contenedor.addEventListener(tipo, actualizarPosicion, true);
  document.addEventListener("selectionchange", () => {
    if (document.activeElement === areaActiva()) actualizarPosicion();
  });

  // Pestañas: clic para activar, × para cerrar, botón central del ratón también cierra.
  const pestanas = $("#pestanas");
  pestanas.addEventListener("click", (evento) => {
    const pestana = evento.target.closest(".pestana");
    if (!pestana) return;
    if (evento.target.closest(".pestana__cerrar")) cerrarPestana(pestana.dataset.ruta);
    else abrirArchivo(pestana.dataset.ruta);
  });
  pestanas.addEventListener("auxclick", (evento) => {
    const pestana = evento.target.closest(".pestana");
    if (pestana && evento.button === 1) cerrarPestana(pestana.dataset.ruta);
  });
  pestanas.addEventListener("keydown", (evento) => {
    const pestana = evento.target.closest(".pestana");
    if (pestana && (evento.key === "Enter" || evento.key === " ")) {
      evento.preventDefault();
      abrirArchivo(pestana.dataset.ruta);
    }
  });
  hacerReordenable(pestanas, {
    selector: ".pestana",
    eje: "x",
    clave: (el) => el.dataset.ruta,
    alTerminar: (orden) => {
      estado.proyecto.abiertas = orden;
      guardarProyecto();
      pintarPestanas();
    },
  });

  $("#boton-descargar-archivo").addEventListener("click", () => descargarArchivo(estado.proyecto.activa));

  // Lo que pasa en otros paneles y afecta al editor.
  escuchar("sucio", () => {
    pintarPestanas();
    actualizarBarraEstado();
  });
  escuchar("arbol", pintarPestanas);
  escuchar("renombrado", (traducir) => {
    for (const [ruta, area] of [...areas]) {
      const nueva = traducir(ruta);
      if (nueva === ruta) continue;
      areas.delete(ruta);
      areas.set(nueva, area);
      area.dataset.ruta = nueva;
      area.setAttribute("aria-label", `Código de ${nueva}`);
    }
    mostrarActiva();
  });
  escuchar("borrado", (afectada) => {
    for (const [ruta, area] of [...areas]) {
      if (afectada(ruta)) {
        area.remove();
        areas.delete(ruta);
      }
    }
    mostrarActiva();
    avisar("activo", estado.proyecto.activa);
  });
  // Si se reemplaza un archivo abierto (arrastrando otro igual), mostramos el texto nuevo.
  escuchar("reemplazado", (rutas) => {
    for (const ruta of rutas) {
      const area = areas.get(ruta);
      if (area) area.value = estado.archivos.get(ruta).contenido;
    }
    pintarNumeros();
  });
}

// Prepara el editor para el proyecto recién abierto: recupera sus pestañas.
export function cargarEnEditor() {
  for (const area of areas.values()) area.remove();
  areas.clear();
  const p = estado.proyecto;
  p.abiertas = p.abiertas.filter((ruta) => estado.archivos.has(ruta));
  if (!p.abiertas.includes(p.activa)) p.activa = p.abiertas[0] ?? null;
  mostrarActiva();
}

export function abrirArchivo(ruta) {
  if (!estado.archivos.has(ruta)) return;
  const p = estado.proyecto;
  if (!p.abiertas.includes(ruta)) p.abiertas.push(ruta);
  const cambia = p.activa !== ruta;
  p.activa = ruta;
  guardarProyecto();
  mostrarActiva();
  $(".pestana--activa")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  if (cambia) avisar("activo", ruta);
}

export function cerrarPestana(ruta) {
  guardarArchivo(ruta); // si tenía cambios sin guardar, se guardan al cerrar
  const p = estado.proyecto;
  const posicion = p.abiertas.indexOf(ruta);
  p.abiertas.splice(posicion, 1);
  areas.get(ruta)?.remove();
  areas.delete(ruta);
  if (p.activa === ruta) p.activa = p.abiertas[Math.min(posicion, p.abiertas.length - 1)] ?? null;
  guardarProyecto();
  mostrarActiva();
  avisar("activo", p.activa); // la vista previa decide si cambia de página (quizá era el HTML que enseñaba)
}

// Lleva el cursor a una línea concreta (por ejemplo, al pulsar un error de la consola).
export function irALinea(ruta, linea) {
  abrirArchivo(ruta);
  const area = areas.get(ruta);
  if (!area) return;
  const lineas = area.value.split("\n");
  const numero = Math.min(Math.max(1, linea), lineas.length);
  const posicion = lineas.slice(0, numero - 1).reduce((suma, l) => suma + l.length + 1, 0);
  area.focus();
  area.setSelectionRange(posicion, posicion + lineas[numero - 1].length);
  area.scrollTop = Math.max(0, (numero - 6) * altoDeLinea(area));
  actualizarPosicion();
}

export function enfocarEditor() {
  areaActiva()?.focus();
}

function areaPara(ruta) {
  if (!areas.has(ruta)) {
    const area = crear("textarea", {
      class: "editor__texto",
      "data-ruta": ruta,
      "aria-label": `Código de ${ruta}`,
      spellcheck: "false",
      wrap: "off",
      autocapitalize: "off",
      autocomplete: "off",
      autocorrect: "off",
    });
    area.value = estado.archivos.get(ruta).contenido;
    area.setSelectionRange(0, 0); // el cursor empieza arriba, no al final
    $("#areas").append(area);
    areas.set(ruta, area);
  }
  return areas.get(ruta);
}

function mostrarActiva() {
  const activa = estado.proyecto.activa;
  if (activa) areaPara(activa);
  // Las inactivas se esconden con una clase (no con display:none) para que no pierdan su scroll.
  for (const [ruta, area] of areas) area.classList.toggle("editor__texto--oculto", ruta !== activa);
  $("#editor").classList.toggle("editor--vacio", !activa);
  $("#boton-descargar-archivo").disabled = !activa;
  pintarPestanas();
  pintarNumeros();
  sincronizarDesplazamiento();
  actualizarBarraEstado();
}

function pintarPestanas() {
  const contenedor = $("#pestanas");
  const rutas = estado.proyecto.abiertas;
  const actuales = [...contenedor.children].map((el) => el.dataset.ruta);
  // Solo se rehacen las pestañas si cambian (y nunca mientras se arrastra una).
  if (!contenedor.classList.contains("reordenando") && actuales.join("\n") !== rutas.join("\n")) {
    contenedor.replaceChildren(
      ...rutas.map((ruta) =>
        crear("div", { class: "pestana", role: "tab", tabindex: "0", "data-ruta": ruta }, [
          iconoArchivo(ruta),
          crear("span", { class: "pestana__nombre", text: nombreDe(ruta) }),
          crear("button", { type: "button", class: "pestana__cerrar", "aria-label": `Cerrar ${nombreDe(ruta)}`, tabindex: "-1" }),
        ]),
      ),
    );
  }
  // Marcamos la activa y las que tienen cambios sin guardar (el punto).
  for (const pestana of contenedor.children) {
    const ruta = pestana.dataset.ruta;
    const activa = ruta === estado.proyecto.activa;
    const sucia = estaSucio(ruta);
    pestana.classList.toggle("pestana--activa", activa);
    pestana.classList.toggle("pestana--sucia", sucia);
    pestana.setAttribute("aria-selected", String(activa));
    pestana.title = sucia ? `${ruta} · sin guardar` : ruta;
  }
}

// ---------- Números de línea y línea actual ----------

const altoDeLinea = (area) => parseFloat(getComputedStyle(area).lineHeight) || 22;

function pintarNumeros() {
  const area = areaActiva();
  const columna = $("#numeros-interior");
  const total = area ? area.value.split("\n").length : 0;
  // Solo regeneramos la columna si cambia el número de líneas.
  if (columna.childElementCount !== total) {
    let html = "";
    for (let i = 1; i <= total; i++) html += `<div>${i}</div>`;
    columna.innerHTML = html;
  }
  actualizarPosicion();
}

function sincronizarDesplazamiento() {
  const area = areaActiva();
  const arriba = area ? area.scrollTop : 0;
  $("#numeros-interior").style.transform = `translateY(${-arriba}px)`;
  colocarLineaActual();
}

let lineaMarcada = 0;

function actualizarPosicion() {
  const area = areaActiva();
  if (!area) return;
  const antes = area.value.slice(0, area.selectionStart);
  const linea = antes.split("\n").length;
  const columna = area.selectionStart - (antes.lastIndexOf("\n") + 1) + 1;
  $("#estado-posicion").textContent = `Línea ${linea}, columna ${columna}`;
  const numeros = $("#numeros-interior");
  const numero = numeros.children[linea - 1];
  if (numero && !numero.classList.contains("actual")) {
    numeros.querySelector(".actual")?.classList.remove("actual");
    numero.classList.add("actual");
  }
  lineaMarcada = linea;
  colocarLineaActual();
}

// La franja que resalta la línea del cursor se mueve con el scroll.
function colocarLineaActual() {
  const area = areaActiva();
  const franja = $("#linea-actual");
  if (!area) {
    franja.hidden = true;
    return;
  }
  const estilo = getComputedStyle(area);
  franja.hidden = false;
  franja.style.height = `${altoDeLinea(area)}px`;
  franja.style.transform = `translateY(${parseFloat(estilo.paddingTop) + (lineaMarcada - 1) * altoDeLinea(area) - area.scrollTop}px)`;
}

function actualizarBarraEstado() {
  const ruta = estado.proyecto?.activa;
  const sucio = Boolean(ruta) && estaSucio(ruta);
  $("#estado-tipo").textContent = ruta ? tipoDe(ruta).nombre : "";
  const guardado = $("#estado-guardado");
  guardado.textContent = ruta ? (sucio ? "Sin guardar" : "Guardado") : "";
  guardado.classList.toggle("estado-guardado--sucio", sucio);
  if (!ruta) $("#estado-posicion").textContent = "";
  actualizarPosicion();
}

// ---------- Teclado: Tab, Mayús+Tab e Intro ----------

function alPulsarTecla(evento) {
  const area = evento.target;
  if (evento.isComposing) return; // escribiendo con acentos o teclados asiáticos
  if (evento.key === "Escape") {
    tabSaleDelEditor = true;
    return;
  }
  if (evento.key === "Tab" && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
    if (tabSaleDelEditor) {
      tabSaleDelEditor = false;
      return; // dejamos que el navegador mueva el foco
    }
    evento.preventDefault();
    if (evento.shiftKey) quitarSangria(area);
    else ponerSangria(area);
    return;
  }
  tabSaleDelEditor = false;
  if (evento.key === "Enter" && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
    evento.preventDefault();
    nuevaLinea(area);
  }
}

// Cambia un trozo del texto. execCommand conserva el historial de deshacer (Ctrl/Cmd+Z);
// si el navegador no lo admite, usamos setRangeText.
function reemplazar(area, inicio, fin, texto) {
  area.focus();
  area.setSelectionRange(inicio, fin);
  const hecho = texto ? document.execCommand("insertText", false, texto) : document.execCommand("delete");
  if (!hecho) {
    area.setRangeText(texto, inicio, fin, "end");
    area.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// Principio y final de las líneas que toca la selección.
function lineasSeleccionadas(valor, inicio, fin) {
  const desde = valor.lastIndexOf("\n", inicio - 1) + 1;
  // Si la selección acaba justo al empezar una línea, esa línea no cuenta.
  const ultima = fin > inicio && valor[fin - 1] === "\n" ? fin - 1 : fin;
  const salto = valor.indexOf("\n", ultima);
  return { desde, hasta: salto === -1 ? valor.length : salto };
}

function ponerSangria(area) {
  const { value: valor, selectionStart: inicio, selectionEnd: fin } = area;
  // Sin selección de varias líneas: Tab escribe dos espacios.
  if (!valor.slice(inicio, fin).includes("\n")) {
    reemplazar(area, inicio, fin, SANGRIA);
    return;
  }
  const { desde, hasta } = lineasSeleccionadas(valor, inicio, fin);
  const bloque = valor
    .slice(desde, hasta)
    .split("\n")
    .map((linea) => (linea ? SANGRIA + linea : linea))
    .join("\n");
  reemplazar(area, desde, hasta, bloque);
  area.setSelectionRange(desde, desde + bloque.length);
}

function quitarSangria(area) {
  const { value: valor, selectionStart: inicio, selectionEnd: fin } = area;
  const { desde, hasta } = lineasSeleccionadas(valor, inicio, fin);
  const original = valor.slice(desde, hasta);
  const lineas = original.split("\n");
  let quitadoEnPrimera = 0;
  const bloque = lineas
    .map((linea, i) => {
      const quitar = linea.startsWith("\t") ? 1 : (linea.match(/^ {1,2}/)?.[0].length ?? 0);
      if (i === 0) quitadoEnPrimera = quitar;
      return linea.slice(quitar);
    })
    .join("\n");
  if (bloque === original) return;
  reemplazar(area, desde, hasta, bloque);
  if (lineas.length > 1) area.setSelectionRange(desde, desde + bloque.length);
  else area.setSelectionRange(Math.max(desde, inicio - quitadoEnPrimera), Math.max(desde, fin - quitadoEnPrimera));
}

// Etiquetas HTML que no se cierran: tras ellas no hay que sangrar.
const ETIQUETAS_VACIAS = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

function abreBloque(textoAntes) {
  if (/[{[(]$/.test(textoAntes)) return true;
  const etiqueta = textoAntes.match(/<([a-zA-Z][\w-]*)\b[^<>]*>$/);
  return Boolean(etiqueta) && !textoAntes.endsWith("/>") && !ETIQUETAS_VACIAS.test(etiqueta[1]);
}

// Intro mantiene la sangría de la línea y añade un nivel tras {, [, ( o una etiqueta que abre.
function nuevaLinea(area) {
  const { value: valor, selectionStart: inicio, selectionEnd: fin } = area;
  const principio = valor.lastIndexOf("\n", inicio - 1) + 1;
  const lineaAntes = valor.slice(principio, inicio);
  const sangria = lineaAntes.match(/^[ \t]*/)[0];
  const finDeLinea = valor.indexOf("\n", fin);
  const despues = valor.slice(fin, finDeLinea === -1 ? valor.length : finDeLinea).trimStart();
  const abre = abreBloque(lineaAntes.trimEnd());
  const cierra = /^([}\])]|<\/)/.test(despues);

  let texto = `\n${sangria}${abre ? SANGRIA : ""}`;
  const cursor = inicio + texto.length;
  // Entre {} o <div></div>: el cierre baja a su propia línea y el cursor queda en medio.
  if (abre && cierra) texto += `\n${sangria}`;
  reemplazar(area, inicio, fin, texto);
  area.setSelectionRange(cursor, cursor);
}

// ---------- Descargar el archivo abierto ----------

const TIPOS_MIME = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  md: "text/markdown",
  txt: "text/plain",
};

export function descargarArchivo(ruta) {
  if (!ruta || !estado.archivos.has(ruta)) return;
  descargar(nombreDe(ruta), estado.archivos.get(ruta).contenido, TIPOS_MIME[extension(ruta)] ?? "text/plain");
}
