// Deshacer y rehacer.
// Cada vez que se termina un cambio se guarda una "foto" (copia en texto JSON) de todos
// los elementos. Deshacer es volver a la foto anterior; rehacer, a la siguiente.
// El historial vive solo en memoria: al recargar la página empieza de cero.

import { MAX_HISTORIAL } from "./constantes.js";

let fotos = [];
let posicion = -1; // qué foto es la actual

/** Empieza el historial con el dibujo inicial. */
export function iniciarHistorial(elementos) {
  fotos = [JSON.stringify(elementos)];
  posicion = 0;
}

/** Guarda una foto si el dibujo ha cambiado desde la anterior. */
export function confirmar(elementos) {
  const foto = JSON.stringify(elementos);
  if (foto === fotos[posicion]) return; // nada nuevo: no gastamos un paso
  // Si se había deshecho algo, lo "rehacible" se pierde al hacer un cambio nuevo.
  fotos = fotos.slice(0, posicion + 1);
  fotos.push(foto);
  // MAX_HISTORIAL pasos de deshacer = una foto más (la del punto de partida).
  if (fotos.length > MAX_HISTORIAL + 1) fotos.shift();
  posicion = fotos.length - 1;
}

/** Devuelve los elementos de la foto anterior, o null si no hay. */
export function deshacer() {
  if (posicion <= 0) return null;
  posicion -= 1;
  return JSON.parse(fotos[posicion]);
}

/** Devuelve los elementos de la foto siguiente, o null si no hay. */
export function rehacer() {
  if (posicion >= fotos.length - 1) return null;
  posicion += 1;
  return JSON.parse(fotos[posicion]);
}

/** Copia del último estado confirmado (sirve para cancelar un arrastre a medias). */
export function ultimoConfirmado() {
  return JSON.parse(fotos[posicion]);
}

export const puedeDeshacer = () => posicion > 0;
export const puedeRehacer = () => posicion < fotos.length - 1;
