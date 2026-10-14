// Exportar imagen: PNG (dibujando en un <canvas> aparte) o SVG (escrito como texto),
// recortado al contenido con un margen, y la ventana de exportar con su vista previa.
//
// La exportación usa siempre los colores "de papel" (fondo crema y tinta azul noche),
// aunque estés en modo oscuro: así la imagen respeta los colores que elegiste.

import { estado, seleccionados } from "./estado.js";
import { TEMAS, MARGEN_EXPORTAR, FUENTE_DIBUJO, colorTrazo, colorRelleno, patronDiscontinuo } from "./constantes.js";
import { limites, limitesDe, cajaEtiqueta, lineasDeTexto } from "./geometria.js";
import { trazadosDe, ordenesASVG } from "./trazo-a-mano.js";
import { dibujarElemento } from "./lienzo.js";
import { descargar, fechaHoy } from "./archivos.js";
import { avisar } from "./avisos.js";

const TEMA = TEMAS.claro;
// Límite de píxeles por imagen: algunos navegadores (sobre todo en móvil) no crean canvas más grandes.
const MAX_PIXELES = 16_000_000;

// ---------------------------------------------------------------------------
// Crear las imágenes
// ---------------------------------------------------------------------------

// Zona a exportar: lo que ocupan los elementos + margen, en números enteros.
function zonaExportar(elementos) {
  const b = limitesDe(elementos);
  const m = MARGEN_EXPORTAR + 4; // + 4: el temblor del trazo puede salirse un poco de la forma
  const x1 = Math.floor(b.x1 - m);
  const y1 = Math.floor(b.y1 - m);
  return { x: x1, y: y1, ancho: Math.ceil(b.x2 + m) - x1, alto: Math.ceil(b.y2 + m) - y1 };
}

/** Crea un PNG. Devuelve una promesa con el archivo (Blob). */
export function crearPNG(elementos, { fondo, escala }) {
  const zona = zonaExportar(elementos);
  // Si la imagen fuera enorme, se reduce la escala para que el navegador pueda crearla.
  const escalaReal = Math.min(escala, Math.sqrt(MAX_PIXELES / (zona.ancho * zona.alto)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(zona.ancho * escalaReal));
  canvas.height = Math.max(1, Math.round(zona.alto * escalaReal));
  const ctx = canvas.getContext("2d");
  if (fondo) {
    ctx.fillStyle = TEMA.fondo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // Misma idea que la cámara de la pantalla: escala y desplazamiento para que la zona empiece en (0, 0).
  ctx.setTransform(escalaReal, 0, 0, escalaReal, -zona.x * escalaReal, -zona.y * escalaReal);
  for (const el of elementos) dibujarElemento(ctx, el, TEMA);
  return new Promise((resolver, rechazar) => {
    canvas.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo crear el PNG"))), "image/png");
  });
}

/** Crea un SVG (texto). Se ve nítido a cualquier tamaño y se puede editar en otros programas. */
export function crearSVG(elementos, { fondo }) {
  const zona = zonaExportar(elementos);
  const partes = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${zona.ancho}" height="${zona.alto}" viewBox="${zona.x} ${zona.y} ${zona.ancho} ${zona.alto}">`,
  ];
  if (fondo) partes.push(`<rect x="${zona.x}" y="${zona.y}" width="${zona.ancho}" height="${zona.alto}" fill="${TEMA.fondo}"/>`);
  elementos.forEach((el, i) => partes.push(elementoASVG(el, i)));
  partes.push("</svg>");
  return partes.join("\n");
}

function elementoASVG(el, indice) {
  const color = colorTrazo(el.trazo, TEMA);
  let svg = "";
  if (el.tipo !== "texto") {
    const t = trazadosDe(el); // las mismas órdenes que en pantalla: el dibujo sale idéntico
    if (t.relleno && el.relleno === "suave") svg += `<path d="${ordenesASVG(t.relleno)}" fill="${colorRelleno(el.trazo, TEMA)}"/>`;
    const lapiz = `fill="none" stroke="${color}" stroke-width="${el.grosor}" stroke-linecap="round" stroke-linejoin="round"`;
    const guiones = el.linea === "discontinua" ? ` stroke-dasharray="${patronDiscontinuo(el.grosor).join(" ")}"` : "";
    let mascara = "";
    if (el.tipo === "flecha" && el.texto) {
      // Igual que en pantalla, la línea no pasa por debajo de la etiqueta:
      // una máscara blanca (se ve) con un agujero negro (no se ve) donde va el texto.
      const id = `etiqueta-${indice}`;
      const b = limites(el);
      const c = cajaEtiqueta(el);
      svg +=
        `<mask id="${id}" maskUnits="userSpaceOnUse" x="${b.x1 - 100}" y="${b.y1 - 100}" width="${b.x2 - b.x1 + 200}" height="${b.y2 - b.y1 + 200}">` +
        `<rect x="${b.x1 - 100}" y="${b.y1 - 100}" width="${b.x2 - b.x1 + 200}" height="${b.y2 - b.y1 + 200}" fill="white"/>` +
        `<rect x="${c.x1}" y="${c.y1}" width="${c.x2 - c.x1}" height="${c.y2 - c.y1}" fill="black"/></mask>`;
      mascara = ` mask="url(#${id})"`;
    }
    svg += `<g${mascara}><path d="${ordenesASVG(t.trazo)}" ${lapiz}${guiones}/>`;
    if (t.punta) svg += `<path d="${ordenesASVG(t.punta)}" ${lapiz}/>`;
    svg += "</g>";
  }
  if (el.texto) {
    const { alinear, lineas } = lineasDeTexto(el);
    const ancla = alinear === "center" ? "middle" : "start";
    for (const linea of lineas) {
      svg +=
        `<text x="${redondear(linea.x)}" y="${redondear(linea.y)}" font-family="${FUENTE_DIBUJO}" font-size="${el.tamano}" ` +
        `fill="${color}" text-anchor="${ancla}" dominant-baseline="central" xml:space="preserve">${escapar(linea.texto)}</text>`;
    }
  }
  return svg;
}

const redondear = (n) => Math.round(n * 100) / 100;

// Los símbolos < > & y comillas tienen significado en SVG: se escriben "escapados".
function escapar(texto) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** ¿Deja este navegador copiar imágenes al portapapeles? (necesita https o localhost) */
export function puedeCopiarImagen() {
  return Boolean(window.isSecureContext && navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
}

// ---------------------------------------------------------------------------
// Ventana de exportar
// ---------------------------------------------------------------------------

const dialogo = document.getElementById("dialogo-exportar");
const formulario = document.getElementById("formulario-exportar");
const vistaPrevia = document.getElementById("vista-previa");
const mensaje = document.getElementById("exportar-mensaje");
const botonDescargar = document.getElementById("exportar-descargar");
const botonCopiar = document.getElementById("exportar-copiar");
const opcionSeleccion = formulario.querySelector('input[name="alcance"][value="seleccion"]');
const grupoEscala = document.getElementById("grupo-escala");

let urlVistaPrevia = null;
let turno = 0; // para ignorar vistas previas antiguas si las opciones cambian rápido

/** Opciones elegidas en la ventana. */
function opciones() {
  const datos = new FormData(formulario);
  return {
    formato: datos.get("formato"),
    alcance: datos.get("alcance"),
    fondo: datos.get("fondo") === "con",
    escala: Number(datos.get("escala")) || 1,
  };
}

function elementosAExportar(o) {
  return o.alcance === "seleccion" ? seleccionados() : estado.elementos;
}

export function abrirExportar() {
  // "Solo la selección" solo tiene sentido si hay algo seleccionado.
  const haySeleccion = estado.seleccion.size > 0;
  opcionSeleccion.disabled = !haySeleccion;
  if (!haySeleccion) formulario.querySelector('input[name="alcance"][value="todo"]').checked = true;
  // Si el navegador no permite copiar imágenes, el botón no aparece.
  botonCopiar.hidden = !puedeCopiarImagen();
  mensaje.textContent = "";
  dialogo.showModal();
  actualizarVistaPrevia();
}

async function actualizarVistaPrevia() {
  const miTurno = ++turno;
  // La escala solo cuenta en PNG. Se decide antes de leer las opciones porque
  // un grupo desactivado no entra en el formulario.
  grupoEscala.disabled = new FormData(formulario).get("formato") !== "png";
  const o = opciones();
  const elementos = elementosAExportar(o);
  const vacio = elementos.length === 0;
  botonDescargar.disabled = vacio;
  botonCopiar.disabled = vacio;
  if (vacio) {
    vistaPrevia.hidden = true;
    mensaje.textContent = "Todavía no hay nada que exportar: dibuja algo primero.";
    return;
  }
  mensaje.textContent = "";
  try {
    const archivo = await crearArchivo(o, elementos);
    if (miTurno !== turno) return; // mientras tanto se cambió alguna opción
    if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
    urlVistaPrevia = URL.createObjectURL(archivo);
    vistaPrevia.src = urlVistaPrevia;
    vistaPrevia.hidden = false;
  } catch {
    mensaje.textContent = "No se ha podido preparar la vista previa.";
  }
}

async function crearArchivo(o, elementos) {
  if (o.formato === "svg") return new Blob([crearSVG(elementos, o)], { type: "image/svg+xml" });
  return crearPNG(elementos, o);
}

formulario.addEventListener("change", actualizarVistaPrevia);

botonDescargar.addEventListener("click", async () => {
  const o = opciones();
  const elementos = elementosAExportar(o);
  if (elementos.length === 0) return;
  try {
    const archivo = await crearArchivo(o, elementos);
    descargar(archivo, `trazo-${fechaHoy()}.${o.formato}`);
    dialogo.close();
    avisar("Imagen descargada.");
  } catch {
    mensaje.textContent = "No se ha podido crear la imagen. Prueba con una escala más pequeña.";
  }
});

botonCopiar.addEventListener("click", async () => {
  const o = opciones();
  const elementos = elementosAExportar(o);
  if (elementos.length === 0) return;
  const opcionesPNG = { fondo: o.fondo, escala: o.escala };
  try {
    // Safari exige crear el ClipboardItem en el mismo clic, con la imagen como "promesa".
    await navigator.clipboard.write([new ClipboardItem({ "image/png": crearPNG(elementos, opcionesPNG) })]);
  } catch {
    // Algunos navegadores no aceptan promesas: segundo intento con la imagen ya creada.
    try {
      const blob = await crearPNG(elementos, opcionesPNG);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      mensaje.textContent = "El navegador no ha dejado copiar la imagen. Puedes descargarla en su lugar.";
      return;
    }
  }
  dialogo.close();
  avisar("Imagen PNG copiada. Ya puedes pegarla en un documento o un correo.");
});

// Al cerrar la ventana se libera la memoria de la vista previa.
dialogo.addEventListener("close", () => {
  turno++;
  if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
  urlVistaPrevia = null;
  vistaPrevia.removeAttribute("src");
});
