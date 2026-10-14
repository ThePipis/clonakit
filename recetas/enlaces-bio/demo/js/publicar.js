// Sección 4 del editor: exportar la página y guardar o abrir el proyecto (.json).

import { estado, cambiar, reemplazarProyecto, sanearProyecto, proyectoVacio } from "./estado.js";
import { generarPagina, enlacesPublicables } from "./pagina.js";
import { normalizarDireccion } from "./direcciones.js";
import { $, avisar, abrirDialogo, descargarArchivo } from "./ui.js";

// Convierte "Marta · Cerámica" en "marta-ceramica" para usarlo en nombres de archivo.
function nombreParaArchivo(texto) {
  const limpio = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return limpio || "mi-pagina";
}

function exportar() {
  const publicables = enlacesPublicables(estado);
  if (!estado.perfil.nombre.trim() && publicables.length === 0) {
    avisar("Tu página está vacía: escribe tu nombre o añade un enlace antes de exportarla.", { tipo: "error" });
    return;
  }
  descargarArchivo("index.html", generarPagina(estado), "text/html;charset=utf-8");

  // Contamos qué enlaces visibles se han quedado fuera y por qué, para que no haya sorpresas.
  const fuera = estado.enlaces
    .filter((enlace) => enlace.visible && (!enlace.titulo.trim() || !normalizarDireccion(enlace.url).ok))
    .map((enlace) => (enlace.titulo.trim() ? `«${enlace.titulo.trim()}» (dirección no válida)` : "un enlace sin título"));
  const avisoFuera = $("exportar-fuera");
  avisoFuera.hidden = fuera.length === 0;
  avisoFuera.textContent = fuera.length ? `Ojo: no se ha incluido ${fuera.join(", ")}. Corrígelo y vuelve a exportar.` : "";
  $("carpeta-sugerida").textContent = nombreParaArchivo(estado.perfil.nombre);
  abrirDialogo("dialogo-exportar");
}

function guardarProyecto() {
  // Guardamos solo lo necesario, con una marca para reconocer el archivo al abrirlo.
  const { perfil, enlaces, estilo, firma } = estado;
  const datos = {
    app: "MiEnlace",
    version: 1,
    guardado: new Date().toISOString(),
    perfil,
    enlaces: enlaces.map(({ titulo, url, icono, visible }) => ({ titulo, url, icono, visible })),
    estilo,
    firma,
  };
  const nombre = `mienlace-${nombreParaArchivo(perfil.nombre)}.json`;
  descargarArchivo(nombre, JSON.stringify(datos, null, 2), "application/json");
  avisar(`Proyecto guardado como ${nombre}. Ábrelo otro día con «Abrir proyecto».`, { tipo: "exito" });
}

async function abrirProyecto(archivo) {
  try {
    const datos = JSON.parse(await archivo.text());
    const proyecto = sanearProyecto(datos);
    proyecto.esEjemplo = false;
    reemplazarProyecto(proyecto);
    document.dispatchEvent(new Event("proyecto-cargado"));
    avisar(`Proyecto «${proyecto.perfil.nombre || archivo.name}» abierto.`, { tipo: "exito" });
  } catch (error) {
    // Es un fallo esperable (archivo equivocado): basta con explicarlo, no hace falta ensuciar la consola.
    const mensaje = error instanceof SyntaxError ? "Ese archivo no es un .json válido." : error.message;
    avisar(`No se pudo abrir: ${mensaje}`, { tipo: "error" });
  }
}

// Franja de "esto es un ejemplo": visible solo mientras el proyecto sea el de muestra.
export function pintarPublicar() {
  $("firma").checked = estado.firma;
  $("franja-ejemplo").hidden = !estado.esEjemplo;
}

export function iniciarPublicar() {
  $("exportar").addEventListener("click", exportar);
  $("guardar-proyecto").addEventListener("click", guardarProyecto);
  $("abrir-proyecto").addEventListener("click", () => $("archivo-proyecto").click());
  $("archivo-proyecto").addEventListener("change", (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (archivo) abrirProyecto(archivo);
  });

  $("firma").addEventListener("change", (evento) => {
    estado.firma = evento.target.checked;
    cambiar();
  });

  $("empezar-de-cero").addEventListener("click", () => {
    reemplazarProyecto(proyectoVacio());
    document.dispatchEvent(new Event("proyecto-cargado"));
    $("nombre").focus();
    avisar("Lienzo en blanco. Empieza por tu foto y tu nombre.", { tipo: "exito" });
  });
  $("quedarme-ejemplo").addEventListener("click", () => {
    estado.esEjemplo = false;
    cambiar();
    pintarPublicar();
  });

  $("cerrar-exportar").addEventListener("click", () => $("dialogo-exportar").close());
}
