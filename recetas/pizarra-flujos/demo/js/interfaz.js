// Los paneles flotantes: barra de herramientas, panel de estilo, zoom, deshacer y menú.
// `prepararInterfaz` conecta cada botón con su acción una sola vez;
// `actualizarInterfaz` pone cada botón en su estado (activo, desactivado...) tras cada cambio.

import { estado, seleccionados } from "./estado.js";
import { PALETA, TINTA, ACENTO, TEMAS, FORMAS, HERRAMIENTAS_DE_DIBUJO } from "./constantes.js";
import { trazadosDelLogo, trazarEnCanvas } from "./trazo-a-mano.js";
import { puedeDeshacer, puedeRehacer } from "./historial.js";
import { abrirExportar } from "./exportar.js";
import * as acciones from "./acciones.js";

const $ = (id) => document.getElementById(id);

const panelEstilo = $("panel-estilo");
const listaMenu = $("menu-lista");
const botonMenu = $("boton-menu");
const entradaArchivo = $("entrada-archivo");

export function prepararInterfaz() {
  // Barra de herramientas
  for (const boton of document.querySelectorAll("[data-herramienta]")) {
    boton.addEventListener("click", () => acciones.elegirHerramienta(boton.dataset.herramienta));
  }

  // Muestras de color: se crean desde la paleta para no repetir los colores en el HTML.
  const colores = $("colores");
  for (const { nombre, color } of PALETA) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "muestra";
    boton.dataset.estilo = "trazo";
    boton.dataset.valor = color;
    boton.title = nombre;
    boton.setAttribute("aria-label", nombre);
    // La tinta se ve clara en modo oscuro: la muestra usa la variable CSS que cambia con el tema.
    boton.style.setProperty("--muestra", color === TINTA ? "var(--tinta)" : color);
    colores.append(boton);
  }

  // Botones de estilo (color, relleno, grosor, línea): todos llevan data-estilo y data-valor.
  for (const boton of document.querySelectorAll("[data-estilo]")) {
    boton.addEventListener("click", () => {
      const { estilo, valor } = boton.dataset;
      acciones.aplicarEstilo(estilo, estilo === "grosor" ? Number(valor) : valor);
    });
  }

  // Acciones sobre la selección
  $("accion-duplicar").addEventListener("click", acciones.duplicar);
  $("accion-borrar").addEventListener("click", acciones.borrarSeleccion);
  $("accion-frente").addEventListener("click", acciones.traerAlFrente);
  $("accion-fondo").addEventListener("click", acciones.enviarAlFondo);

  // Zoom, deshacer y rehacer
  $("zoom-menos").addEventListener("click", () => acciones.zoomPaso(-1));
  $("zoom-mas").addEventListener("click", () => acciones.zoomPaso(1));
  $("zoom-valor").addEventListener("click", acciones.zoomAl100);
  $("deshacer").addEventListener("click", acciones.deshacer);
  $("rehacer").addEventListener("click", acciones.rehacer);

  // Menú
  botonMenu.addEventListener("click", () => (menuAbierto() ? cerrarMenu() : abrirMenu()));
  listaMenu.addEventListener("click", (evento) => {
    const opcion = evento.target.closest("[data-menu]");
    if (!opcion) return;
    cerrarMenu();
    switch (opcion.dataset.menu) {
      case "abrir":
        entradaArchivo.click();
        break;
      case "guardar":
        acciones.guardarArchivo();
        break;
      case "exportar":
        abrirExportar();
        break;
      case "cuadricula":
        acciones.alternarCuadricula();
        break;
      case "oscuro":
        acciones.alternarModoOscuro();
        break;
      case "vaciar":
        acciones.vaciarLienzo();
        break;
    }
  });
  // Un clic fuera del menú lo cierra.
  document.addEventListener("pointerdown", (evento) => {
    if (menuAbierto() && !evento.target.closest(".menu")) cerrarMenu();
  });

  // Abrir archivo con el selector del sistema
  entradaArchivo.addEventListener("change", () => {
    const archivo = entradaArchivo.files[0];
    entradaArchivo.value = ""; // así se puede volver a elegir el mismo archivo
    if (archivo) acciones.abrirArchivo(archivo);
  });

  pintarLogos();
}

export function menuAbierto() {
  return !listaMenu.hidden;
}

export function abrirMenu() {
  listaMenu.hidden = false;
  botonMenu.setAttribute("aria-expanded", "true");
}

export function cerrarMenu() {
  listaMenu.hidden = true;
  botonMenu.setAttribute("aria-expanded", "false");
}

/** Pone cada control en su sitio según el estado. Se llama tras cada cambio. */
export function actualizarInterfaz() {
  // Tema claro u oscuro: el CSS cambia de colores con el atributo data-tema.
  const tema = estado.preferencias.oscuro ? "oscuro" : "claro";
  if (document.documentElement.dataset.tema !== tema) {
    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]').content = TEMAS[tema].fondo;
    pintarLogos();
  }

  // Herramienta activa
  for (const boton of document.querySelectorAll("[data-herramienta]")) {
    boton.setAttribute("aria-pressed", String(boton.dataset.herramienta === estado.herramienta));
  }

  // Panel de estilo: visible con algo seleccionado o con una herramienta de dibujo.
  const sel = seleccionados();
  const tipos = new Set(sel.map((el) => el.tipo));
  // Las herramientas de dibujo se llaman igual que el tipo de elemento que crean.
  if (sel.length === 0 && HERRAMIENTAS_DE_DIBUJO.includes(estado.herramienta)) tipos.add(estado.herramienta);
  panelEstilo.hidden = tipos.size === 0;
  if (!panelEstilo.hidden) {
    const hayForma = [...tipos].some((tipo) => FORMAS.includes(tipo));
    const hayLineas = hayForma || tipos.has("flecha");
    $("grupo-relleno").hidden = !hayForma;
    $("grupo-grosor").hidden = !hayLineas;
    $("grupo-linea").hidden = !hayLineas;
    $("grupo-acciones").hidden = sel.length === 0;
    for (const boton of panelEstilo.querySelectorAll("[data-estilo]")) {
      const actual = valorActual(sel, boton.dataset.estilo);
      boton.setAttribute("aria-pressed", String(String(actual) === boton.dataset.valor));
    }
  }

  // Zoom, deshacer y rehacer
  $("zoom-valor").textContent = `${Math.round(estado.camara.zoom * 100)} %`;
  $("deshacer").disabled = !puedeDeshacer();
  $("rehacer").disabled = !puedeRehacer();

  // Casillas del menú
  $("menu-cuadricula").setAttribute("aria-checked", String(estado.preferencias.cuadricula));
  $("menu-oscuro").setAttribute("aria-checked", String(estado.preferencias.oscuro));
}

// Valor que muestra el panel: el del primer elemento seleccionado que tenga esa
// propiedad o, si no hay ninguno, el estilo de los elementos nuevos.
function valorActual(sel, propiedad) {
  const el = sel.find((x) => acciones.admiteEstilo(x, propiedad));
  return el ? el[propiedad] : estado.estilo[propiedad];
}

// Logo de Trazo dibujado con el mismo trazo a mano: en la esquina y como icono de la pestaña.
function pintarLogos() {
  const oscuro = estado.preferencias.oscuro;
  pintarLogo($("logo"), 28, oscuro ? TEMAS.oscuro.tinta : TINTA, false);
  const icono = document.createElement("canvas");
  pintarLogo(icono, 64, TINTA, true, 1);
  $("favicon").href = icono.toDataURL("image/png");
}

function pintarLogo(canvas, tamano, tinta, conFondo, dpr = window.devicePixelRatio || 1) {
  canvas.width = Math.round(tamano * dpr);
  canvas.height = Math.round(tamano * dpr);
  const ctx = canvas.getContext("2d");
  const escala = (tamano * dpr) / 64; // el logo está diseñado en una caja de 64 × 64
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  if (conFondo) {
    ctx.fillStyle = TEMAS.claro.fondo;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, 64, 64, 14);
    else ctx.rect(0, 0, 64, 64);
    ctx.fill();
  }
  const { cuadrados, onda } = trazadosDelLogo();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = tinta;
  trazarEnCanvas(ctx, cuadrados);
  ctx.stroke();
  ctx.strokeStyle = ACENTO;
  trazarEnCanvas(ctx, onda);
  ctx.stroke();
}
