// Punto de entrada de Columnas: prepara las pantallas y decide cuál se ve según la dirección (#/...).
// El resto del código está repartido en módulos dentro de js/ (cada uno explica su parte).

import { CLAVE_DATOS, alCambiar, buscarTablero } from "./js/estado.js";
import { avisar } from "./js/dialogos.js";
import { pintarInicio, prepararInicio } from "./js/inicio.js";
import { abrirTablero, cerrarTablero, pintarTablero, prepararTablero } from "./js/tablero.js";
import { cerrarDetalle, prepararDetalle } from "./js/detalle.js";
import { $, iconos } from "./js/util.js";

// Los iconos del HTML se marcan con data-icono="nombre" y aquí se rellenan con su dibujo SVG.
for (const hueco of document.querySelectorAll("[data-icono]")) hueco.innerHTML = iconos[hueco.dataset.icono] ?? "";

let pantalla = "inicio";

// Rutas: "#/" es el inicio y "#/tablero/<id>" un tablero. Guardarlo en la dirección
// permite recargar la página (o usar el botón Atrás) sin perder dónde estabas.
function mostrarPantalla() {
  const ruta = location.hash.match(/^#\/tablero\/(.+)$/);
  const id = ruta ? decodeURIComponent(ruta[1]) : null;
  cerrarDetalle();

  if (id && buscarTablero(id)) {
    pantalla = "tablero";
    $("pantalla-inicio").hidden = true;
    $("pantalla-tablero").hidden = false;
    abrirTablero(id);
    return;
  }
  if (id) {
    avisar("Ese tablero ya no existe.");
    history.replaceState(null, "", "#/");
  }
  pantalla = "inicio";
  cerrarTablero();
  $("pantalla-tablero").hidden = true;
  $("pantalla-inicio").hidden = false;
  pintarInicio();
}

// Cada vez que cambian los datos, se vuelve a pintar la pantalla que se está viendo.
alCambiar(() => {
  if (pantalla === "tablero" && !buscarTablero(decodeURIComponent(location.hash.replace("#/tablero/", "")))) return mostrarPantalla();
  if (pantalla === "tablero") pintarTablero();
  else pintarInicio();
});

window.addEventListener("hashchange", mostrarPantalla);

// Si la app está abierta en dos pestañas y cambias algo en la otra, esta se recarga
// con los datos nuevos. Así una pestaña antigua nunca pisa lo que guardó la otra.
window.addEventListener("storage", (e) => {
  if (e.key === CLAVE_DATOS) location.reload();
});
window.addEventListener("columnas:error-guardar", () =>
  avisar("No se ha podido guardar en este navegador (¿está lleno o en modo privado?). Exporta una copia para no perder nada.", "error"),
);

prepararInicio();
prepararTablero();
prepararDetalle();
mostrarPantalla();
