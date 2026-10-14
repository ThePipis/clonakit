// Punto de entrada de Embudo. Carga los datos guardados, decide qué pantalla
// mostrar según la dirección (#/contactos, #/emails/…) y mantiene al día el menú.

import { estado, alCambiarDatos, cargarEstado, contarEtiquetas } from "./js/estado.js";
import { vistaInicio } from "./js/inicio.js";
import { vistaContactos } from "./js/contactos.js";
import { vistaSegmentos } from "./js/segmentos.js";
import { vistaEmails } from "./js/emails.js";
import { vistaAutomatizaciones } from "./js/automatizaciones.js";
import { vistaAjustes } from "./js/ajustes.js";
import { $, aviso, formatoNumero, h, icono } from "./js/ui.js";

// Cada sección de la barra lateral y la pantalla que la pinta.
const VISTAS = {
  inicio: vistaInicio,
  contactos: vistaContactos,
  segmentos: vistaSegmentos,
  emails: vistaEmails,
  automatizaciones: vistaAutomatizaciones,
  ajustes: vistaAjustes,
};

let vistaActual = null;

// Lee la dirección: "#/emails/em-123" → sección "emails", id "em-123".
// Usamos "#" para que la app funcione en cualquier servidor estático (Vercel incluido).
function leerRuta() {
  const [seccion, id] = location.hash.replace(/^#\/?/, "").split("/");
  return { seccion: VISTAS[seccion] ? seccion : "inicio", id: id ? decodeURIComponent(id) : null };
}

function navegar() {
  const { seccion, id } = leerRuta();
  vistaActual?.salir?.();
  vistaActual = VISTAS[seccion];
  // Cerramos ventanas o menús que quedasen abiertos de la pantalla anterior.
  document.querySelector(".menu-flotante")?.remove();
  const raiz = $("#vista");
  raiz.className = `vista vista-${seccion}`;
  raiz.replaceChildren();
  vistaActual.pintar(raiz, id);
  document.querySelectorAll(".menu-item").forEach((a) => a.classList.toggle("activo", a.dataset.seccion === seccion));
  document.title = `${{ inicio: "Inicio", contactos: "Contactos", segmentos: "Segmentos", emails: "Emails", automatizaciones: "Automatizaciones", ajustes: "Ajustes" }[seccion]} · Embudo`;
  window.scrollTo(0, 0);
}

// Números reales junto a cada sección del menú.
function actualizarMenu() {
  const cuentas = { contactos: estado.contactos.length, segmentos: estado.segmentos.length, emails: estado.emails.length, automatizaciones: estado.automatizaciones.length };
  for (const [seccion, n] of Object.entries(cuentas)) {
    const insignia = document.querySelector(`.menu-item[data-seccion="${seccion}"] .insignia`);
    if (insignia) {
      insignia.textContent = n ? formatoNumero(n) : "";
      insignia.hidden = !n;
    }
  }
  // Sugerencias para cualquier casilla de etiqueta (un único <datalist> compartido).
  $("#lista-etiquetas").replaceChildren(...[...contarEtiquetas().keys()].map((e) => h("option", { value: e })));
}

async function arrancar() {
  // Los iconos del menú se dibujan desde ui.js para no repetir los SVG en el HTML.
  document.querySelectorAll("[data-icono]").forEach((el) => el.replaceWith(icono(el.dataset.icono, el.closest(".menu") ? 20 : 14)));
  try {
    await cargarEstado();
  } catch (error) {
    console.error(error);
    $("#vista").replaceChildren(h("div", { class: "vacio-grande" }, h("h3", {}, "No se han podido abrir tus datos"), h("p", {}, "Este navegador no permite guardar datos (¿modo privado?). Prueba en una ventana normal.")));
    return;
  }
  alCambiarDatos(() => {
    actualizarMenu();
    vistaActual?.actualizar?.();
  });
  window.addEventListener("hashchange", navegar);
  actualizarMenu();
  navegar();
}

// Si algo falla sin control, al menos lo contamos en pantalla además de en la consola.
window.addEventListener("unhandledrejection", (e) => {
  console.error(e.reason);
  aviso("Algo ha fallado al guardar. Vuelve a intentarlo.", "error");
});

arrancar();
