// Sección 1 del editor: foto, nombre y bio.

import { estado, cambiar, MAX_BIO } from "./estado.js";
import { $, avisar } from "./ui.js";

const LADO_FOTO = 320;

// Abre la imagen elegida. createImageBitmap es lo más rápido; si el navegador no sabe
// abrir ese formato así (pasa con algunos SVG), lo intentamos con una etiqueta <img>.
async function abrirImagen(archivo) {
  try {
    return await createImageBitmap(archivo);
  } catch {
    const url = URL.createObjectURL(archivo);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// Recorta la foto al centro en cuadrado y la reduce a 320 × 320 px en JPEG.
// Así pesa poco (unos 20-40 KB) y cabe sin problema en el almacenamiento del navegador.
export async function prepararFoto(archivo) {
  if (!archivo.type.startsWith("image/")) throw new Error("Ese archivo no es una imagen.");
  const imagen = await abrirImagen(archivo);
  const ancho = imagen.width;
  const alto = imagen.height;
  const lado = Math.min(ancho, alto);
  const lienzo = document.createElement("canvas");
  lienzo.width = LADO_FOTO;
  lienzo.height = LADO_FOTO;
  const ctx = lienzo.getContext("2d");
  // Fondo blanco: el JPEG no tiene transparencia y, sin esto, las zonas transparentes saldrían negras.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, LADO_FOTO, LADO_FOTO);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imagen, (ancho - lado) / 2, (alto - lado) / 2, lado, lado, 0, 0, LADO_FOTO, LADO_FOTO);
  if (imagen.close) imagen.close();
  return lienzo.toDataURL("image/jpeg", 0.85);
}

// Pinta en el formulario lo que hay en el estado (al arrancar o al abrir un proyecto).
export function pintarPerfil() {
  $("nombre").value = estado.perfil.nombre;
  $("bio").value = estado.perfil.bio;
  pintarFoto();
  pintarContador();
}

function pintarFoto() {
  const hayFoto = Boolean(estado.perfil.foto);
  $("avatar").classList.toggle("con-foto", hayFoto);
  // Sin foto quitamos el atributo src para que el navegador no intente cargar nada.
  if (hayFoto) $("avatar-img").src = estado.perfil.foto;
  else $("avatar-img").removeAttribute("src");
  $("quitar-foto").hidden = !hayFoto;
  $("cambiar-foto").textContent = hayFoto ? "Cambiar foto" : "Subir foto";
}

function pintarContador() {
  const usados = estado.perfil.bio.length;
  const contador = $("contador-bio");
  contador.textContent = `${usados}/${MAX_BIO}`;
  // A partir de 140 se pone en naranja para avisar de que queda poco.
  contador.classList.toggle("casi-lleno", usados >= MAX_BIO - 20);
}

export function iniciarPerfil() {
  $("nombre").addEventListener("input", (evento) => {
    estado.perfil.nombre = evento.target.value;
    cambiar();
  });

  $("bio").addEventListener("input", (evento) => {
    estado.perfil.bio = evento.target.value.slice(0, MAX_BIO);
    pintarContador();
    cambiar();
  });

  // El botón y el círculo de la foto abren el selector de archivos (que está oculto).
  $("cambiar-foto").addEventListener("click", () => $("foto-archivo").click());
  $("avatar").addEventListener("click", () => $("foto-archivo").click());

  $("foto-archivo").addEventListener("change", async (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = ""; // Permite volver a elegir el mismo archivo después.
    if (!archivo) return;
    try {
      estado.perfil.foto = await prepararFoto(archivo);
      pintarFoto();
      cambiar();
      avisar("Foto lista: recortada y reducida a 320 × 320 px.", { tipo: "exito" });
    } catch {
      avisar("No he podido abrir esa imagen. Prueba con una foto JPG o PNG.", { tipo: "error" });
    }
  });

  $("quitar-foto").addEventListener("click", () => {
    estado.perfil.foto = "";
    pintarFoto();
    cambiar();
    $("cambiar-foto").focus();
  });
}
