// El formulario viaja DENTRO del enlace, así no hace falta guardarlo en ningún servidor.
// Pasos: formulario → texto JSON → comprimido (si el navegador sabe) → base64url → #f=...
// Todo va después de "#" (el fragmento): esa parte de la URL nunca se envía al servidor.

import { normalizarFormulario } from "./datos.js";

// Prefijos para saber al leer cómo se guardó: "z." comprimido, "j." JSON sin comprimir.
const COMPRIMIDO = "z.";
const SIN_COMPRIMIR = "j.";

/** Solo lo que necesita quien responde: sin fechas internas del constructor. */
function paraCompartir(form) {
  const { id, titulo, acento, webhook, bienvenida, preguntas, final } = form;
  return { id, titulo, acento, webhook, bienvenida, preguntas, final };
}

/** Crea el enlace para compartir. Con quiosco, al terminar vuelve a empezar solo. */
export async function crearEnlace(form, { quiosco = false } = {}) {
  const datos = await codificar(paraCompartir(form));
  const base = location.origin + location.pathname;
  return `${base}#f=${datos}${quiosco ? "&quiosco=1" : ""}`;
}

async function codificar(objeto) {
  const bytes = new TextEncoder().encode(JSON.stringify(objeto));
  if ("CompressionStream" in window) {
    try {
      return COMPRIMIDO + aBase64url(await transformar(bytes, new CompressionStream("deflate-raw")));
    } catch {
      // Navegador antiguo que no conoce "deflate-raw": seguimos sin comprimir.
    }
  }
  return SIN_COMPRIMIR + aBase64url(bytes);
}

/** Lee el texto que va tras #f= y devuelve el formulario ya revisado. */
export async function leerFormularioDeEnlace(texto) {
  if (!texto || texto.length > 300000) throw new Error("Enlace vacío o demasiado largo");
  let bytes;
  if (texto.startsWith(COMPRIMIDO)) {
    if (!("DecompressionStream" in window)) throw new Error("Este navegador no sabe descomprimir el enlace");
    bytes = await transformar(deBase64url(texto.slice(2)), new DecompressionStream("deflate-raw"));
  } else if (texto.startsWith(SIN_COMPRIMIR)) {
    bytes = deBase64url(texto.slice(2));
  } else {
    throw new Error("Formato de enlace desconocido");
  }
  return normalizarFormulario(JSON.parse(new TextDecoder().decode(bytes)));
}

/** Pasa unos bytes por un flujo de compresión o descompresión. */
async function transformar(bytes, flujo) {
  const salida = new Blob([bytes]).stream().pipeThrough(flujo);
  return new Uint8Array(await new Response(salida).arrayBuffer());
}

// base64url es base64 con "-" y "_" en vez de "+" y "/", y sin "=" al final:
// así el texto se puede poner en una URL sin que nada se rompa.
function aBase64url(bytes) {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64url(texto) {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}
