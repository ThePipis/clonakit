// Pantalla de inicio: la cuadrícula de tableros, crear uno nuevo y el menú "⋯" de cada tablero.

import { COLORES_TABLERO, borrarTablero, cambiar, contarTarjetas, crearTablero, datos, duplicarTablero, tocar } from "./estado.js";
import { abrirMenu, avisar, cerrarAlPulsarFuera, cerrarMenu, confirmar, pedirTexto } from "./dialogos.js";
import { exportarTodo, importarArchivo } from "./copias.js";
import { $, el, fechaCorta, hoyISO, iconos, plural } from "./util.js";

export function pintarInicio() {
  document.title = "Columnas · Mis tableros";
  document.querySelector('meta[name="theme-color"]').content = "#F1ECE2";
  const fichas = datos.tableros.map(fichaTablero);
  // La última casilla, con borde discontinuo, sirve para crear un tablero nuevo.
  fichas.push(
    el(
      "li",
      {},
      el(
        "button",
        { class: "ficha-nueva", type: "button", onclick: abrirNuevoTablero },
        el("span", { class: "ficha-nueva-icono", html: iconos.mas }),
        datos.tableros.length ? "Crear tablero" : "Crea tu primer tablero",
      ),
    ),
  );
  $("rejilla-tableros").replaceChildren(...fichas);
  $("bienvenida").hidden = datos.tableros.length > 0;

  // Recordatorio de copia de seguridad: los datos solo viven en este navegador.
  const ultima = datos.ultimaCopia ? `Tu última copia es del ${fechaCorta(hoyISO(new Date(datos.ultimaCopia)))}.` : "Aún no has guardado ninguna copia.";
  $("nota-copia").textContent = `Tus tableros se guardan solos, pero solo en este navegador. Exporta una copia de vez en cuando. ${ultima}`;
}

// Una ficha de color con el nombre, el número de tarjetas y un mini dibujo de sus listas.
function fichaTablero(tablero) {
  const tarjetas = contarTarjetas(tablero);
  const mini = el(
    "span",
    { class: "ficha-mini", "aria-hidden": "true" },
    tablero.listas.slice(0, 7).map((lista) => el("i", { style: { "--alto": `${Math.min(100, 22 + lista.tarjetas.length * 13)}%` } })),
  );
  return el(
    "li",
    { class: "ficha", style: { "--color": tablero.color } },
    el(
      "a",
      { class: "ficha-enlace", href: `#/tablero/${tablero.id}` },
      el("span", { class: "ficha-nombre" }, tablero.nombre),
      el("span", { class: "ficha-info" }, `${plural(tarjetas, "tarjeta", "tarjetas")} · ${plural(tablero.listas.length, "lista", "listas")}`),
      mini,
    ),
    el("button", {
      class: "boton-icono claro ficha-menu",
      type: "button",
      "aria-label": `Opciones de ${tablero.nombre}`,
      "aria-haspopup": "true",
      "aria-expanded": "false",
      html: iconos.puntos,
      onclick: (e) => menuTablero(e.currentTarget, tablero),
    }),
  );
}

function menuTablero(boton, tablero) {
  // Fila de muestras de color dentro del propio menú: un clic y el tablero cambia de color.
  const colores = el(
    "div",
    { class: "menu-colores", role: "group", "aria-label": "Cambiar color" },
    el("span", { class: "menu-subtitulo" }, el("span", { class: "icono", html: iconos.paleta }), "Cambiar color"),
    el(
      "div",
      { class: "muestras pequenas" },
      COLORES_TABLERO.map((c) =>
        el("button", {
          class: "muestra",
          type: "button",
          title: c.nombre,
          "aria-label": c.nombre,
          "aria-pressed": String(c.valor === tablero.color),
          style: { "--muestra": c.valor },
          onclick: () => {
            cerrarMenu();
            cambiar(() => {
              tablero.color = c.valor;
              tocar(tablero);
            });
          },
        }),
      ),
    ),
  );

  abrirMenu(
    boton,
    [
      { texto: "Renombrar", icono: iconos.lapiz, accion: () => renombrar(tablero) },
      colores,
      { texto: "Duplicar", icono: iconos.copiar, accion: () => duplicar(tablero) },
      { texto: "Borrar", icono: iconos.papelera, peligro: true, accion: () => borrar(tablero) },
    ],
    tablero.nombre,
  );
}

async function renombrar(tablero) {
  const nombre = await pedirTexto("Renombrar tablero", tablero.nombre, "Nombre del tablero");
  if (!nombre || nombre === tablero.nombre) return;
  cambiar(() => {
    tablero.nombre = nombre;
    tocar(tablero);
  });
}

function duplicar(tablero) {
  const copia = duplicarTablero(tablero.id);
  if (copia) avisar(`Creado «${copia.nombre}».`, "exito");
}

async function borrar(tablero) {
  const tarjetas = contarTarjetas(tablero);
  const ok = await confirmar(
    `¿Borrar «${tablero.nombre}»?`,
    `Se borrarán sus ${plural(tablero.listas.length, "lista", "listas")} y ${plural(tarjetas, "tarjeta", "tarjetas")}. No se puede deshacer.`,
    "Borrar tablero",
  );
  if (!ok) return;
  borrarTablero(tablero.id);
  avisar(`Tablero «${tablero.nombre}» borrado.`);
}

/* ---------- Ventana "Nuevo tablero" ---------- */

const dialogo = $("dialogo-nuevo-tablero");
const formulario = $("form-nuevo-tablero");
const campoNombre = $("nuevo-nombre");

function abrirNuevoTablero() {
  formulario.reset();
  // Las muestras de color son botones de opción (radio): solo se puede elegir uno.
  $("nuevo-colores").replaceChildren(
    ...COLORES_TABLERO.map((c, i) =>
      el(
        "label",
        { class: "muestra", title: c.nombre, style: { "--muestra": c.valor } },
        el("input", { type: "radio", name: "color", value: c.valor, checked: i === 0, "aria-label": c.nombre }),
      ),
    ),
  );
  actualizarVistaPrevia();
  dialogo.returnValue = "";
  dialogo.showModal();
  campoNombre.focus();
}

// La miniatura de arriba cambia de color y de nombre mientras se rellena el formulario.
function actualizarVistaPrevia() {
  const datosFormulario = new FormData(formulario);
  $("vista-previa").style.setProperty("--color", datosFormulario.get("color") ?? COLORES_TABLERO[0].valor);
  $("vista-previa-nombre").textContent = campoNombre.value.trim() || "Nuevo tablero";
  $("vista-previa").classList.toggle("vacio", datosFormulario.get("inicio") === "vacio");
}

export function prepararInicio() {
  formulario.addEventListener("input", actualizarVistaPrevia);
  formulario.addEventListener("change", actualizarVistaPrevia);
  cerrarAlPulsarFuera(dialogo);
  dialogo.addEventListener("close", () => {
    if (dialogo.returnValue !== "crear") return;
    const valores = new FormData(formulario);
    const nombre = String(valores.get("nombre")).trim() || "Tablero sin nombre";
    const tablero = crearTablero(nombre, valores.get("color"), valores.get("inicio") === "ejemplo");
    location.hash = `#/tablero/${tablero.id}`; // abrimos el tablero recién creado
  });

  $("boton-exportar-todo").addEventListener("click", exportarTodo);
  $("boton-importar").addEventListener("click", () => $("archivo-importar").click());
  $("archivo-importar").addEventListener("change", async (e) => {
    const archivo = e.target.files[0];
    e.target.value = ""; // así se puede volver a elegir el mismo archivo
    if (archivo) await importarArchivo(archivo);
  });
}
