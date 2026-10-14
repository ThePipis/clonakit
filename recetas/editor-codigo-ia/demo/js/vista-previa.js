// La vista previa: la página del proyecto funcionando dentro de un <iframe>,
// con selector de tamaño y una consola que recoge sus mensajes y errores.
//
// El iframe usa srcdoc (le pasamos el HTML como texto) y sandbox="allow-scripts allow-forms":
// los scripts de la página se ejecutan, pero aislados de Taller. Por eso no
// pueden leer tus proyectos ni usar el almacenamiento del navegador.
// (allow-forms hace falta para que los formularios lancen su evento "submit";
// el puente de abajo evita que un envío saque a la vista previa de la página.)

import { irALinea, abrirArchivo } from "./editor.js";
import { estado, escuchar } from "./estado.js";
import { guardarProyecto } from "./archivos.js";
import { $, $$, crear, alParar, extension, carpetaDe } from "./util.js";

const TAMANOS = {
  escritorio: null, // ocupa todo el panel
  tableta: { ancho: 768, alto: 1024 },
  movil: { ancho: 390, alto: 844 },
};
const MAXIMO_MENSAJES = 500;

let numeroVista = 0; // cada recarga lleva un número para ignorar mensajes de la vista anterior
let mapaLineas = []; // qué líneas del documento montado vienen de qué archivo
let ultimoHtml = null; // el último .html que se abrió en el editor
let htmlMostrado = null;
const recargaProgramada = alParar(recargar, 500); // medio segundo después de dejar de escribir

export function iniciarVistaPrevia() {
  $("#boton-recargar").addEventListener("click", recargar);
  for (const boton of $$("[data-tamano]")) {
    boton.addEventListener("click", () => {
      estado.proyecto.tamanoPrevia = boton.dataset.tamano;
      guardarProyecto();
      aplicarTamano();
    });
  }
  new ResizeObserver(() => aplicarTamano()).observe($("#previa-escenario"));

  $("#boton-vaciar-consola").addEventListener("click", vaciarConsola);
  $("#boton-plegar-consola").addEventListener("click", () => {
    estado.proyecto.consolaAbierta = !estado.proyecto.consolaAbierta;
    guardarProyecto();
    aplicarConsola();
  });
  $("#consola-lista").addEventListener("click", (evento) => {
    const donde = evento.target.closest(".consola__donde");
    if (donde) irALinea(donde.dataset.archivo, Number(donde.dataset.linea));
  });

  escuchar("contenido", () => recargaProgramada());
  escuchar("arbol", () => recargaProgramada());
  escuchar("activo", () => {
    if (htmlParaPrevia() !== htmlMostrado) recargar();
  });
  escuchar("renombrado", (traducir) => {
    if (ultimoHtml) ultimoHtml = traducir(ultimoHtml);
  });

  // Mensajes que llegan desde dentro del iframe (consola y enlaces).
  addEventListener("message", (evento) => {
    const datos = evento.data;
    if (evento.source !== $("#previa-marco").contentWindow || !datos || datos.vista !== numeroVista) return;
    if (datos.tipo === "consola") anotar(datos);
    else if (datos.tipo === "enlace") seguirEnlace(datos.destino);
  });
}

// Al abrir un proyecto: tamaño, consola y primera carga.
export function cargarVistaPrevia() {
  ultimoHtml = null;
  aplicarTamano();
  aplicarConsola();
  recargar();
}

export function detenerVistaPrevia() {
  recargaProgramada.cancelar();
  numeroVista++;
  ponerDocumento("");
}

// Qué HTML enseñamos: el que está abierto en el editor, si no index.html, si no el primero que haya.
function htmlParaPrevia() {
  const { activa, abiertas } = estado.proyecto;
  if (activa && extension(activa) === "html") ultimoHtml = activa;
  if (ultimoHtml && abiertas.includes(ultimoHtml) && estado.archivos.has(ultimoHtml)) return ultimoHtml;
  if (estado.archivos.has("index.html")) return "index.html";
  return [...estado.archivos.keys()].filter((r) => extension(r) === "html").sort()[0] ?? null;
}

export function recargar() {
  recargaProgramada.cancelar();
  const ruta = htmlParaPrevia();
  htmlMostrado = ruta;
  numeroVista++;
  vaciarConsola();
  $("#previa-archivo").textContent = ruta ?? "sin HTML";
  if (!ruta) {
    mapaLineas = [];
    ponerDocumento(PAGINA_SIN_HTML);
    return;
  }
  const leer = (r) => estado.archivos.get(r)?.contenido;
  const { html, mapa } = construirDocumento(ruta, leer, { vista: numeroVista });
  mapaLineas = mapa;
  ponerDocumento(html);
}

// Cada recarga usa un <iframe> nuevo. Si cambiáramos el srcdoc del mismo, el navegador
// apuntaría cada recarga en su historial y el botón Atrás no volvería a la lista de proyectos.
function ponerDocumento(html) {
  const viejo = $("#previa-marco");
  const nuevo = viejo.cloneNode(false); // mismo id, sandbox y tamaño
  nuevo.srcdoc = html;
  viejo.replaceWith(nuevo);
}

const PAGINA_SIN_HTML = `<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#1D2027;color:#9EA2AE;font:15px system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box"><p>Este proyecto todavía no tiene ninguna página <b style="color:#E6E3DA">.html</b>.<br>Crea un <b style="color:#B8E05A">index.html</b> y aparecerá aquí.</p></body>`;

// ---------- Montar el documento ----------

// Convierte un enlace relativo ("../css/a.css") en una ruta del proyecto ("css/a.css").
// Devuelve null si es externo (https://, data:, //cdn...).
export function resolverRuta(carpeta, enlace) {
  let limpio = enlace.trim().split(/[?#]/)[0];
  try {
    limpio = decodeURIComponent(limpio);
  } catch {
    /* si no se puede decodificar, lo usamos tal cual */
  }
  if (!limpio || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(limpio)) return null;
  const partes = limpio.startsWith("/") || !carpeta ? [] : carpeta.split("/");
  for (const trozo of limpio.split("/")) {
    if (!trozo || trozo === ".") continue;
    if (trozo === "..") partes.pop();
    else partes.push(trozo);
  }
  return partes.join("/");
}

// Lee un atributo de una etiqueta: atributo('<script src="a.js">', "src") → "a.js".
function atributo(etiqueta, nombre) {
  const encontrado = etiqueta.match(new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return encontrado ? (encontrado[1] ?? encontrado[2] ?? encontrado[3]) : null;
}

const contarSaltos = (texto) => texto.split("\n").length - 1;

// Mete dentro del HTML el CSS y el JS del proyecto (el iframe no puede pedirlos por su cuenta).
// Además apunta de qué archivo y línea viene cada trozo, para que los errores digan "app.js:3".
export function construirDocumento(rutaHtml, leer, { vista = 0, puente = true } = {}) {
  const carpeta = carpetaDe(rutaHtml);
  // Los SVG del proyecto usados en <img> se convierten en "data URLs" (no cambian el número de líneas).
  const fuente = leer(rutaHtml).replace(/<img\b[^>]*>/gi, (etiqueta) => {
    const src = atributo(etiqueta, "src");
    const ruta = src && resolverRuta(carpeta, src);
    const svg = ruta && extension(ruta) === "svg" ? leer(ruta) : undefined;
    return svg === undefined ? etiqueta : etiqueta.replace(src, () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  });

  const trozos = []; // { texto, archivo, linea }
  const diferidos = []; // scripts con defer/async: van al final del <body>
  const avisos = [];
  let ultimo = 0;
  const lineaDe = (indice) => contarSaltos(fuente.slice(0, indice)) + 1;

  for (const encontrado of fuente.matchAll(/<link\b[^>]*>|<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const etiqueta = encontrado[0];
    const esScript = /^<script/i.test(etiqueta);
    const apertura = esScript ? `<script${encontrado[1]}>` : etiqueta;
    const enlace = esScript ? atributo(apertura, "src") : /\srel\s*=\s*["']?stylesheet/i.test(etiqueta) ? atributo(etiqueta, "href") : null;
    const ruta = enlace && resolverRuta(carpeta, enlace);
    if (!ruta) continue; // sin enlace o externo: se queda tal cual

    const linea = lineaDe(encontrado.index);
    trozos.push({ texto: fuente.slice(ultimo, encontrado.index), archivo: rutaHtml, linea: lineaDe(ultimo) });
    ultimo = encontrado.index + etiqueta.length;
    let contenido = leer(ruta);
    if (contenido === undefined) {
      avisos.push({ texto: `No encuentro «${ruta}» en el proyecto (lo pide ${rutaHtml}).`, archivo: rutaHtml, linea });
      continue;
    }
    if (!contenido.endsWith("\n")) contenido += "\n"; // así la etiqueta de cierre va en su propia línea
    if (!esScript) {
      trozos.push(
        { texto: "<style>\n", archivo: rutaHtml, linea },
        { texto: contenido.replace(/<\/style/gi, "<\\/style"), archivo: ruta, linea: 1 },
        { texto: "</style>", archivo: rutaHtml, linea },
      );
      continue;
    }
    const esModulo = /\stype\s*=\s*["']?module/i.test(apertura);
    const grupo = [
      { texto: esModulo ? '<script type="module">\n' : "<script>\n", archivo: rutaHtml, linea },
      { texto: contenido.replace(/<\/script/gi, "<\\/script"), archivo: ruta, linea: 1 },
      { texto: "</script>", archivo: rutaHtml, linea },
    ];
    // "defer" y "async" esperan a que cargue el HTML: los movemos al final del <body>.
    if (!esModulo && /\s(defer|async)(\s|=|>)/i.test(apertura)) diferidos.push(...grupo);
    else trozos.push(...grupo);
  }
  trozos.push({ texto: fuente.slice(ultimo), archivo: rutaHtml, linea: lineaDe(ultimo) });

  if (diferidos.length) {
    const i = trozos.findLastIndex((t) => t.archivo === rutaHtml && /<\/body/i.test(t.texto));
    if (i === -1) trozos.push(...diferidos);
    else {
      const t = trozos[i];
      const corte = t.texto.toLowerCase().lastIndexOf("</body");
      const antes = t.texto.slice(0, corte);
      trozos.splice(i, 1, { ...t, texto: antes }, ...diferidos, { texto: t.texto.slice(corte), archivo: rutaHtml, linea: t.linea + contarSaltos(antes) });
    }
  }

  // Juntamos los trozos y apuntamos en qué línea del documento empieza cada uno.
  let html = "";
  let lineaDocumento = 1;
  const mapa = [];
  for (const trozo of trozos) {
    if (!trozo.texto) continue;
    // Si el trozo empieza a mitad de una línea, esa línea se la queda el trozo anterior.
    const aMitad = html !== "" && !html.endsWith("\n");
    mapa.push({ desde: lineaDocumento + (aMitad ? 1 : 0), archivo: trozo.archivo, linea: trozo.linea + (aMitad ? 1 : 0) });
    html += trozo.texto;
    lineaDocumento += contarSaltos(trozo.texto);
  }

  // El "puente" va en la primera línea, sin saltos, para no descolocar los números de línea.
  if (puente) {
    const datos = JSON.stringify({ vista, avisos }).replace(/</g, "\\u003c");
    const codigo = `<script>(${puenteConsola.toString().replace(/\s*\n\s*/g, " ")})(${datos});</script>`;
    const doctype = /^\s*<!doctype[^>]*>/i;
    html = doctype.test(html) ? html.replace(doctype, (inicio) => inicio + codigo) : codigo + html;
  }
  return { html, mapa };
}

/* Este código se ejecuta DENTRO de la vista previa. Reenvía a Taller lo que pasa por
   la consola, los errores y los clics en enlaces. Solo usa comentarios de bloque como
   este porque se mete entero en una sola línea. */
function puenteConsola(datos) {
  var enviar = function (mensaje) {
    mensaje.vista = datos.vista;
    parent.postMessage(mensaje, "*");
  };
  var formatear = function (valor) {
    if (typeof valor === "string") return valor;
    if (valor instanceof Error) return valor.name + ": " + valor.message;
    if (valor === undefined) return "undefined";
    if (typeof valor === "function") return "función " + (valor.name || "anónima");
    if (valor && valor.nodeType === 1) return "<" + valor.tagName.toLowerCase() + (valor.id ? "#" + valor.id : "") + ">";
    try {
      var texto = JSON.stringify(valor);
      return texto === undefined ? String(valor) : texto;
    } catch (e) {
      return String(valor);
    }
  };
  ["log", "info", "debug", "warn", "error"].forEach(function (nivel) {
    var original = console[nivel];
    console[nivel] = function () {
      /* La pila de llamadas dice en qué línea se llamó a console.log. */
      var marcos = String(new Error().stack || "").split("\n").filter(function (l) { return /:\d+:\d+\)?\s*$/.test(l); });
      var linea = marcos[1] && marcos[1].match(/:(\d+):\d+\)?\s*$/);
      enviar({ tipo: "consola", nivel: nivel, texto: Array.prototype.map.call(arguments, formatear).join(" "), linea: linea ? Number(linea[1]) : null });
      original.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (e) {
    enviar({ tipo: "consola", nivel: "error", texto: e.message || "Error", linea: e.lineno || null });
  });
  window.addEventListener("unhandledrejection", function (e) {
    enviar({ tipo: "consola", nivel: "error", texto: "Promesa rechazada sin capturar: " + formatear(e.reason), linea: null });
  });
  /* Las ventanas del navegador están bloqueadas en la vista previa: avisamos en la consola. */
  window.alert = function (texto) { enviar({ tipo: "consola", nivel: "info", texto: "alert(): " + formatear(texto), linea: null }); };
  window.confirm = function () { enviar({ tipo: "consola", nivel: "warn", texto: "confirm() no funciona en la vista previa: responde que sí.", linea: null }); return true; };
  window.prompt = function () { enviar({ tipo: "consola", nivel: "warn", texto: "prompt() no funciona en la vista previa: responde vacío.", linea: null }); return null; };
  document.addEventListener("click", function (e) {
    var enlace = e.target.closest ? e.target.closest("a[href]") : null;
    if (!enlace || e.defaultPrevented) return;
    var destino = enlace.getAttribute("href");
    if (/^javascript:/i.test(destino)) return;
    e.preventDefault();
    if (destino.charAt(0) === "#") {
      var objetivo = destino.length > 1 ? document.getElementById(decodeURIComponent(destino.slice(1))) : null;
      if (objetivo) objetivo.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    enviar({ tipo: "enlace", destino: destino });
  });
  /* Un formulario que nadie gestiona con JavaScript no se envía: la vista previa se iría de la página. */
  document.addEventListener("submit", function (e) {
    if (e.defaultPrevented) return;
    e.preventDefault();
    enviar({ tipo: "consola", nivel: "info", texto: "Formulario enviado (en la vista previa no sale de la página). Gestiónalo con JavaScript escuchando el evento submit.", linea: null });
  });
  datos.avisos.forEach(function (a) { enviar({ tipo: "consola", nivel: "warn", texto: a.texto, archivo: a.archivo, linea: a.linea }); });
}

// Un enlace a otra página del proyecto la abre en el editor (y así se ve en la vista previa).
function seguirEnlace(destino) {
  const ruta = resolverRuta(carpetaDe(htmlMostrado ?? ""), destino);
  if (ruta === null) {
    anotar({ nivel: "info", texto: `Los enlaces externos no se abren en la vista previa: ${destino}` });
  } else {
    const pagina = estado.archivos.has(ruta) ? ruta : estado.archivos.has(`${ruta}/index.html`) ? `${ruta}/index.html` : null;
    if (pagina && extension(pagina) === "html") abrirArchivo(pagina);
    else anotar({ nivel: "warn", texto: `El enlace lleva a «${ruta || "/"}», pero no hay ninguna página con ese nombre en el proyecto.` });
  }
}

// ---------- Tamaños ----------

function aplicarTamano() {
  if (!estado.proyecto) return;
  const nombre = TAMANOS[estado.proyecto.tamanoPrevia] !== undefined ? estado.proyecto.tamanoPrevia : "escritorio";
  for (const boton of $$("[data-tamano]")) boton.setAttribute("aria-pressed", String(boton.dataset.tamano === nombre));
  const escenario = $("#previa-escenario");
  const caja = $("#previa-caja");
  const iframe = $("#previa-marco");
  const medida = TAMANOS[nombre];
  escenario.dataset.tamano = nombre;
  if (!medida) {
    caja.style.width = caja.style.height = iframe.style.width = iframe.style.height = "";
    iframe.style.transform = "";
    $("#previa-medida").textContent = "";
    return;
  }
  // Si el dispositivo no cabe en el panel, lo encogemos (sin cambiar su tamaño "real").
  const escala = Math.min(1, (escenario.clientWidth - 32) / medida.ancho, (escenario.clientHeight - 52) / medida.alto);
  iframe.style.width = `${medida.ancho}px`;
  iframe.style.height = `${medida.alto}px`;
  iframe.style.transform = `scale(${escala})`;
  caja.style.width = `${Math.round(medida.ancho * escala)}px`;
  caja.style.height = `${Math.round(medida.alto * escala)}px`;
  $("#previa-medida").textContent = `${medida.ancho} × ${medida.alto}${escala < 1 ? ` · ${Math.round(escala * 100)} %` : ""}`;
}

// ---------- Consola ----------

function aplicarConsola() {
  const abierta = estado.proyecto.consolaAbierta !== false;
  $("#consola").classList.toggle("consola--plegada", !abierta);
  $("#boton-plegar-consola").setAttribute("aria-expanded", String(abierta));
}

// Traduce una línea del documento montado a archivo + línea original.
function ubicar(lineaDocumento) {
  let tramo = null;
  for (const t of mapaLineas) {
    if (t.desde <= lineaDocumento) tramo = t;
    else break;
  }
  return tramo ? { archivo: tramo.archivo, linea: tramo.linea + (lineaDocumento - tramo.desde) } : null;
}

const contadores = { error: 0, warn: 0 };

function anotar({ nivel, texto, linea, archivo }) {
  const tipo = nivel === "error" ? "error" : nivel === "warn" ? "aviso" : "normal";
  const donde = archivo ? { archivo, linea } : linea ? ubicar(linea) : null;
  const lista = $("#consola-lista");
  const fila = crear("div", { class: `consola__linea consola__linea--${tipo}` }, [
    crear("span", { class: "consola__texto", text: texto }),
    donde && estado.archivos.has(donde.archivo)
      ? crear("button", {
          type: "button",
          class: "consola__donde",
          "data-archivo": donde.archivo,
          "data-linea": donde.linea,
          title: "Ir a esta línea",
          text: `${donde.archivo}:${donde.linea}`,
        })
      : null,
  ]);
  lista.append(fila);
  if (lista.childElementCount > MAXIMO_MENSAJES) lista.firstElementChild.remove();
  lista.scrollTop = lista.scrollHeight;
  if (nivel in contadores) contadores[nivel]++;
  pintarContadores();
}

export function vaciarConsola() {
  $("#consola-lista").replaceChildren();
  contadores.error = contadores.warn = 0;
  pintarContadores();
}

function pintarContadores() {
  const errores = $("#consola-errores");
  const avisos = $("#consola-avisos");
  errores.hidden = !contadores.error;
  errores.textContent = contadores.error;
  errores.title = `${contadores.error} errores`;
  avisos.hidden = !contadores.warn;
  avisos.textContent = contadores.warn;
  avisos.title = `${contadores.warn} avisos`;
  $("#consola-vacia").hidden = $("#consola-lista").childElementCount > 0;
}

// Para las miniaturas de la lista de proyectos: el HTML montado, sin puente ni scripts.
export function documentoMiniatura(leer, rutas) {
  const ruta = rutas.includes("index.html") ? "index.html" : rutas.filter((r) => extension(r) === "html").sort()[0];
  if (!ruta) return null;
  // Sin scripts: la miniatura solo enseña el aspecto (y así el navegador no avisa de scripts bloqueados).
  return construirDocumento(ruta, leer, { puente: false }).html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, "");
}

