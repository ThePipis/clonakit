// Punto de entrada de Celda. Carga las bases guardadas en el navegador y
// decide qué pantalla pintar según la dirección:
//   #/             → inicio (tus bases)
//   #/base/<id>    → dentro de una base
// El resto del código vive en la carpeta js/, un módulo por tema.

import { alCambiar, buscarBase, cargarBases } from "./js/almacen.js";
import { pintarInicio } from "./js/inicio.js";
import { abrirPantallaBase, actualizarGuardado, pintar as pintarBase } from "./js/pantalla-base.js";
import { cerrarPanel } from "./js/ui.js";
import { el } from "./js/util.js";

const app = document.getElementById("app");
let pantalla = null; // "inicio" o "base"

function rutear() {
  const coincide = location.hash.match(/^#\/base\/([\w-]+)/);
  pantalla = coincide ? "base" : "inicio";
  // Al cambiar de pantalla se cierran los paneles y ventanas que quedaran abiertos.
  cerrarPanel();
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  if (coincide) {
    const base = buscarBase(coincide[1]);
    document.title = base ? `${base.nombre} · Celda` : "Celda";
    abrirPantallaBase(app, coincide[1]);
  } else {
    document.title = "Celda · tus datos en tablas con superpoderes";
    pintarInicio(app);
  }
}

// Cada vez que cambian los datos, repintamos la pantalla actual.
alCambiar((tipo) => {
  if (tipo === "guardado") return actualizarGuardado();
  if (pantalla === "base") pintarBase();
  else if (pantalla === "inicio") pintarInicio(app);
});

try {
  await cargarBases();
  window.addEventListener("hashchange", rutear);
  rutear();
} catch (error) {
  console.error(error);
  app.replaceChildren(
    el(
      "div",
      { class: "estado-vacio" },
      el("h3", {}, "No se pueden abrir tus datos"),
      el("p", {}, "Este navegador no deja usar su almacenamiento (IndexedDB). Si estás en una ventana privada, prueba en una normal."),
    ),
  );
}
