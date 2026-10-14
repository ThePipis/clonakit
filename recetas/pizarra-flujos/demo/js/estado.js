// Todo lo que la app "recuerda" en un momento dado vive en un solo objeto: `estado`.
// Los demás archivos lo leen y lo cambian; después llaman a `cambio()` para que
// la pantalla se redibuje y el dibujo se guarde.

import { TINTA, TAMANO_TEXTO } from "./constantes.js";
import { nuevaSemilla } from "./trazo-a-mano.js";

export const estado = {
  // Lo que hay dibujado, de atrás hacia delante (el último se pinta encima de todos).
  elementos: [],
  // Ids de los elementos seleccionados. Un Set no admite repetidos.
  seleccion: new Set(),
  herramienta: "seleccionar",
  // La cámara: desplazamiento en píxeles de pantalla y zoom (1 = 100 %).
  camara: { x: 0, y: 0, zoom: 1 },
  // Estilo con el que se crean los elementos nuevos.
  estilo: { trazo: TINTA, relleno: "ninguno", grosor: 2, linea: "continua" },
  preferencias: { cuadricula: true, oscuro: false },
  editando: null, // id del elemento cuyo texto se está escribiendo
  resaltado: null, // id de la forma a la que se engancharía la flecha
  recuadro: null, // recuadro de selección mientras se arrastra en vacío
  borrando: new Set(), // elementos que la goma va a borrar al soltar
};

// Funciones que quieren enterarse de cada cambio (redibujar, guardar...).
const oyentes = [];

export function alCambiar(funcion) {
  oyentes.push(funcion);
}

/** Avisa de que algo ha cambiado. */
export function cambio() {
  for (const funcion of oyentes) funcion();
}

// El dibujo vive en el "mundo" (coordenadas que no cambian al hacer zoom) y se ve
// en la "pantalla". Estas dos funciones pasan de una a otra usando la cámara.
export function aMundo(xPantalla, yPantalla) {
  const { x, y, zoom } = estado.camara;
  return { x: (xPantalla - x) / zoom, y: (yPantalla - y) / zoom };
}

export function aPantalla(xMundo, yMundo) {
  const { x, y, zoom } = estado.camara;
  return { x: xMundo * zoom + x, y: yMundo * zoom + y };
}

export function buscar(id) {
  return estado.elementos.find((el) => el.id === id) ?? null;
}

export function seleccionados() {
  return estado.elementos.filter((el) => estado.seleccion.has(el.id));
}

/** Identificador único y corto para cada elemento. */
export function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Crea un elemento nuevo con el estilo actual. `propiedades` añade o cambia lo que haga falta. */
export function crearElemento(tipo, propiedades) {
  return {
    id: nuevoId(),
    tipo,
    ...estado.estilo,
    texto: "",
    tamano: TAMANO_TEXTO,
    semilla: nuevaSemilla(),
    ...propiedades,
  };
}
