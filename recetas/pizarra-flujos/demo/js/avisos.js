// Mensajes para la persona: avisos breves que desaparecen solos y preguntas de sí o no.

const caja = document.getElementById("aviso");
let temporizador = null;

/** Muestra un aviso abajo de la pantalla durante unos segundos. */
export function avisar(mensaje) {
  caja.textContent = mensaje;
  caja.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    caja.hidden = true;
  }, 4000);
}

/**
 * Pregunta algo con una ventana propia (más amable que el confirm() del navegador).
 * Devuelve una promesa que se cumple con true si la persona acepta.
 */
export function preguntar(mensaje, textoAceptar = "Aceptar") {
  const dialogo = document.getElementById("dialogo-preguntar");
  if (dialogo.open) return Promise.resolve(false);
  document.getElementById("pregunta-texto").textContent = mensaje;
  document.getElementById("pregunta-si").textContent = textoAceptar;
  dialogo.returnValue = "";
  dialogo.showModal();
  // El formulario usa method="dialog": al pulsar un botón, la ventana se cierra
  // y su "returnValue" es el value del botón ("si" o "no"). Esc la cierra sin valor.
  return new Promise((resolver) => {
    dialogo.addEventListener("close", () => resolver(dialogo.returnValue === "si"), { once: true });
  });
}
