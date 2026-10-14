// El espacio de trabajo: abre un proyecto, reparte las cuatro zonas (árbol,
// editor, vista previa y misiones), deja cambiar su tamaño arrastrando los bordes
// y conecta los botones de la barra superior.

import { guardarCopiaDeRescate, guardarTodo, guardarProyecto } from "./archivos.js";
import { cargarArbol, iniciarArbol } from "./arbol.js";
import { descargarZip, exportarJson } from "./copias.js";
import * as db from "./db.js";
import { notificar } from "./dialogos.js";
import { cargarEnEditor, iniciarEditor, enfocarEditor } from "./editor.js";
import { estado, escuchar } from "./estado.js";
import { cargarMisiones, guardarMisionPendiente, iniciarMisiones, misionSinGuardar } from "./misiones.js";
import { cargarVistaPrevia, detenerVistaPrevia, iniciarVistaPrevia } from "./vista-previa.js";
import { $, $$ } from "./util.js";

// Tamaños iniciales y límites (en píxeles) de las zonas que se pueden redimensionar.
const TAMANOS = {
  arbol: { inicial: 230, minimo: 160, maximo: 480 },
  previa: { inicial: 460, minimo: 260, maximo: 1400 },
  misiones: { inicial: 330, minimo: 260, maximo: 560 },
  consola: { inicial: 170, minimo: 70, maximo: 700 },
};
const MINIMO_EDITOR = 280;

export function iniciarEspacio() {
  iniciarEditor();
  iniciarArbol();
  iniciarVistaPrevia();
  iniciarMisiones();

  $("#boton-volver").addEventListener("click", () => (location.hash = "#/"));
  $("#boton-zip").addEventListener("click", async () => {
    await guardarTodo();
    const nombre = descargarZip(estado.proyecto, listaDeArchivos());
    notificar(`Descargando ${nombre}`);
  });
  $("#boton-json").addEventListener("click", async () => {
    await guardarTodo();
    const nombre = exportarJson(estado.proyecto, listaDeArchivos(), estado.misiones);
    notificar(`Descargando ${nombre}`);
  });
  $("#boton-misiones").addEventListener("click", () => mostrarMisiones(!estado.proyecto.verMisiones));
  $("#boton-cerrar-misiones").addEventListener("click", () => mostrarMisiones(false));
  escuchar("misiones", pintarContadorMisiones);

  configurarSeparadores();
  configurarMovil();

  // Ctrl/Cmd+S guarda (y evita que el navegador intente guardar la página).
  document.addEventListener("keydown", async (evento) => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "s") {
      evento.preventDefault();
      if (!estado.proyecto) return;
      await guardarTodo();
      notificar("Guardado");
    }
  });
  // Si se cierra o se oculta la pestaña, guardamos lo pendiente.
  const guardarAlSalir = () => {
    if (!estado.proyecto) return;
    guardarCopiaDeRescate(misionSinGuardar()); // al instante, por si la página se cierra ya
    guardarMisionPendiente();
    // Si la página sigue viva y todo llegó a IndexedDB, la copia de rescate ya no hace falta.
    guardarTodo().then(() => estado.proyecto && guardarCopiaDeRescate(misionSinGuardar()));
  };
  addEventListener("pagehide", guardarAlSalir);
  document.addEventListener("visibilitychange", () => document.hidden && guardarAlSalir());
}

const listaDeArchivos = () => [...estado.archivos].map(([ruta, archivo]) => ({ ruta, contenido: archivo.contenido }));

// Carga un proyecto de la base de datos y lo pinta. Devuelve false si no existe.
export async function abrirProyecto(id) {
  const proyecto = await db.leer("proyectos", id);
  if (!proyecto) return false;
  const [archivos, misiones] = await Promise.all([db.leerDeProyecto("archivos", id), db.leerDeProyecto("misiones", id)]);

  // Valores por defecto por si el registro es antiguo o viene de una importación.
  proyecto.carpetas ??= [];
  proyecto.abiertas ??= [];
  proyecto.zonas ??= {};
  estado.proyecto = proyecto;
  estado.archivos = new Map(archivos.map((a) => [a.ruta, { contenido: a.contenido, guardado: a.contenido }]));
  estado.misiones = misiones.sort((a, b) => a.orden - b.orden);

  $("#nombre-proyecto").textContent = proyecto.nombre;
  document.title = `${proyecto.nombre} · Taller`;
  aplicarZonas();
  aplicarMisiones();
  cargarArbol();
  cargarEnEditor();
  cargarMisiones();
  cargarVistaPrevia();
  pintarContadorMisiones();
  vistaMovil(proyecto.activa ? "codigo" : "archivos");
  return true;
}

export async function cerrarProyecto() {
  if (!estado.proyecto) return;
  guardarMisionPendiente();
  await guardarTodo();
  detenerVistaPrevia();
  estado.proyecto = null;
  estado.archivos = new Map();
  estado.misiones = [];
  document.title = "Taller";
}

// ---------- Misiones (mostrar u ocultar la columna) ----------

function mostrarMisiones(ver) {
  estado.proyecto.verMisiones = ver;
  guardarProyecto();
  aplicarMisiones();
  if (ver) $("#zona-misiones").querySelector("button, input")?.focus();
  else enfocarEditor();
}

function aplicarMisiones() {
  const ver = Boolean(estado.proyecto.verMisiones);
  $("#zonas").dataset.misiones = ver ? "si" : "no";
  $("#boton-misiones").setAttribute("aria-pressed", String(ver));
}

function pintarContadorMisiones() {
  const porHacer = estado.misiones.filter((m) => m.estado !== "hecha").length;
  for (const contador of $$(".contador-misiones")) {
    contador.textContent = porHacer;
    contador.hidden = !porHacer;
  }
}

// ---------- Zonas redimensionables ----------

function aplicarZonas() {
  const zonas = $("#zonas");
  for (const [nombre, limites] of Object.entries(TAMANOS)) {
    zonas.style.setProperty(`--tam-${nombre}`, `${estado.proyecto.zonas[nombre] ?? limites.inicial}px`);
  }
}

function configurarSeparadores() {
  for (const separador of $$(".separador")) {
    const nombre = separador.dataset.zona;
    const vertical = nombre === "consola"; // la consola cambia de alto; el resto, de ancho
    // El árbol crece al arrastrar hacia la derecha; las zonas de la derecha (y la consola), al revés.
    const signo = nombre === "arbol" ? 1 : -1;
    const elemento = () => (vertical ? $("#consola") : $(`#zona-${nombre}`));

    const cambiar = (valor) => {
      const { minimo, maximo } = TAMANOS[nombre];
      // Límite extra: el editor (o la página de la vista previa) siempre conserva un mínimo de espacio.
      const hueco = vertical ? $("#zona-previa").offsetHeight - 160 : elemento().offsetWidth + $("#zona-editor").offsetWidth - MINIMO_EDITOR;
      const final = Math.round(Math.max(minimo, Math.min(valor, maximo, hueco)));
      estado.proyecto.zonas[nombre] = final;
      $("#zonas").style.setProperty(`--tam-${nombre}`, `${final}px`);
    };

    separador.addEventListener("pointerdown", (evento) => {
      evento.preventDefault();
      const inicio = vertical ? evento.clientY : evento.clientX;
      const tamanoInicial = vertical ? elemento().offsetHeight : elemento().offsetWidth;
      separador.setPointerCapture(evento.pointerId);
      document.body.classList.add("redimensionando", vertical ? "redimensionando--alto" : "redimensionando--ancho");
      const mover = (e) => cambiar(tamanoInicial + ((vertical ? e.clientY : e.clientX) - inicio) * signo);
      const soltar = () => {
        separador.removeEventListener("pointermove", mover);
        document.body.classList.remove("redimensionando", "redimensionando--alto", "redimensionando--ancho");
        guardarProyecto();
      };
      separador.addEventListener("pointermove", mover);
      separador.addEventListener("lostpointercapture", soltar, { once: true });
    });

    // Con el teclado: flechas para mover el borde de 20 en 20 píxeles.
    separador.addEventListener("keydown", (evento) => {
      const pasos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };
      if (!(evento.key in pasos)) return;
      evento.preventDefault();
      const actual = vertical ? elemento().offsetHeight : elemento().offsetWidth;
      cambiar(actual + pasos[evento.key] * 20 * signo);
      guardarProyecto();
    });

    // Doble clic: vuelve al tamaño inicial.
    separador.addEventListener("dblclick", () => {
      delete estado.proyecto.zonas[nombre];
      aplicarZonas();
      guardarProyecto();
    });
  }
}

// ---------- Móvil: una zona cada vez, con una barra de pestañas abajo ----------

function configurarMovil() {
  for (const boton of $$("[data-vista-movil]")) boton.addEventListener("click", () => vistaMovil(boton.dataset.vistaMovil));
  document.addEventListener("taller:archivo-elegido", () => vistaMovil("codigo"));
}

function vistaMovil(nombre) {
  $("#zonas").dataset.vista = nombre;
  for (const boton of $$("[data-vista-movil]")) boton.setAttribute("aria-pressed", String(boton.dataset.vistaMovil === nombre));
}
