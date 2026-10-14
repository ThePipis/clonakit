// Vista previa en vivo: un teléfono dibujado con la página dentro.
// Usa un <iframe srcdoc> con el MISMO HTML que se exporta, así que lo que ves es lo que publicas.

import { estado } from "./estado.js";
import { generarPagina } from "./pagina.js";
import { $, avisar } from "./ui.js";

let ultimoHtml = "";
let pendiente = false;
let scrollGuardado = 0;

// Agrupa varios cambios seguidos en un solo redibujo por fotograma (unas 60 veces por segundo como mucho).
export function pedirRedibujo() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => {
    pendiente = false;
    redibujar();
  });
}

function redibujar() {
  const html = generarPagina(estado);
  if (html === ultimoHtml) return; // Nada ha cambiado: no recargamos.
  ultimoHtml = html;
  const marco = $("marco-previa");
  // Recordamos hasta dónde se había bajado dentro del teléfono para no volver arriba con cada tecla.
  scrollGuardado = marco.contentWindow?.scrollY || 0;
  marco.srcdoc = html;
}

// El iframe se dibuja con 390 px de ancho (lo que mide un móvil típico) y se encoge para caber en el
// teléfono dibujado. Si no, en una pantalla estrecha la página se vería más apretada que en un móvil real.
const ANCHO_MOVIL = 390;
function ajustarEscala(pantalla, marco) {
  const { width, height } = pantalla.getBoundingClientRect();
  if (!width) return; // Está escondida (vista previa cerrada en el móvil).
  const escala = width / ANCHO_MOVIL;
  marco.style.width = ANCHO_MOVIL + "px";
  marco.style.height = height / escala + "px";
  marco.style.transform = `scale(${escala})`;
}

// Abrir y cerrar la vista previa a pantalla completa en el móvil.
function abrirEnMovil() {
  document.body.classList.add("previa-abierta");
  $("cerrar-previa").focus();
}

function cerrarEnMovil() {
  document.body.classList.remove("previa-abierta");
  $("ver-previa").focus();
}

export function iniciarVistaPrevia() {
  const marco = $("marco-previa");
  marco.addEventListener("load", () => {
    const ventana = marco.contentWindow;
    ventana.scrollTo(0, scrollGuardado);
    // En la vista previa los botones no navegan (se quedaría la otra web dentro del teléfono):
    // en su lugar contamos adónde llevarán en la página publicada.
    marco.contentDocument.addEventListener("click", (evento) => {
      const enlace = evento.target.closest?.("a[href]");
      if (!enlace) return;
      evento.preventDefault();
      avisar(`Vista previa: en tu página publicada, este botón abrirá ${enlace.getAttribute("href")}`);
    });
  });

  // Cada vez que cambia el tamaño del teléfono (ventana más grande o más pequeña), recalculamos la escala.
  const pantalla = $("pantalla-previa");
  new ResizeObserver(() => ajustarEscala(pantalla, marco)).observe(pantalla);

  $("ver-previa").addEventListener("click", abrirEnMovil);
  $("cerrar-previa").addEventListener("click", cerrarEnMovil);
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && document.body.classList.contains("previa-abierta")) cerrarEnMovil();
  });

  redibujar();
}
