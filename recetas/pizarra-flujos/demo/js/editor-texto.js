// Escribir texto: un <textarea> transparente que se coloca justo encima del elemento.
// Así se aprovecha todo lo que ya sabe hacer el navegador (cursor, seleccionar, pegar,
// teclado del móvil...) y al terminar el texto se guarda en el elemento.

import { estado, cambio, buscar, aPantalla } from "./estado.js";
import { ALTO_LINEA, FUENTE_DIBUJO, colorTrazo } from "./constantes.js";
import { ajustarAlTexto, medirTexto, centro, recalcularFlechas } from "./geometria.js";
import { confirmarCambio } from "./acciones.js";
import { temaActual } from "./lienzo.js";

const editor = document.getElementById("editor-texto");

/** Empieza a escribir en un elemento (forma, flecha o texto suelto). */
export function editarTexto(el) {
  if (estado.editando) terminarEdicion();
  estado.editando = el.id;
  estado.herramienta = "seleccionar"; // al terminar se vuelve a seleccionar
  estado.seleccion = new Set([el.id]);
  editor.value = el.texto;
  editor.hidden = false;
  colocarEditor();
  editor.focus({ preventScroll: true });
  editor.setSelectionRange(editor.value.length, editor.value.length); // cursor al final
  cambio();
}

/** Termina de escribir (Esc, clic fuera o cambio de foco). */
export function terminarEdicion() {
  const id = estado.editando;
  if (!id) return;
  estado.editando = null; // primero, para que el "blur" de abajo no vuelva a entrar aquí
  editor.blur();
  editor.hidden = true;
  const el = buscar(id);
  if (el) {
    el.texto = el.texto.replace(/\s+$/, ""); // fuera espacios y saltos de línea sobrantes al final
    if (el.tipo === "texto" && el.texto.trim() === "") {
      // Un texto suelto vacío no sirve de nada: se quita.
      estado.elementos = estado.elementos.filter((x) => x.id !== id);
      estado.seleccion.delete(id);
    } else {
      ajustarAlTexto(el);
    }
  }
  recalcularFlechas(estado.elementos);
  confirmarCambio();
}

/** Coloca el cuadro de texto sobre el elemento. Se llama en cada redibujo (por si cambia el zoom). */
export function colocarEditor() {
  if (!estado.editando) return;
  const el = buscar(estado.editando);
  if (!el) {
    // El elemento ha desaparecido (por ejemplo, al deshacer): se cierra el editor.
    estado.editando = null;
    editor.hidden = true;
    return;
  }
  const zoom = estado.camara.zoom;
  const medida = medirTexto(editor.value || " ", el.tamano);
  const ancho = Math.max(medida.ancho, el.tamano * 0.6) * zoom + 6; // + 6: sitio para el cursor
  const alto = medida.alto * zoom;
  let izquierda;
  let arriba;
  if (el.tipo === "texto") {
    const p = aPantalla(el.x, el.y);
    izquierda = p.x;
    arriba = p.y;
  } else {
    // Dentro de una forma o en una flecha, el texto va centrado.
    const c = centro(el);
    const p = aPantalla(c.x, c.y);
    izquierda = p.x - ancho / 2;
    arriba = p.y - alto / 2;
  }
  editor.style.left = `${izquierda}px`;
  editor.style.top = `${arriba}px`;
  editor.style.width = `${ancho}px`;
  editor.style.height = `${alto}px`;
  editor.style.font = `${el.tamano * zoom}px ${FUENTE_DIBUJO}`;
  editor.style.lineHeight = String(ALTO_LINEA); // después de "font", que la reinicia
  editor.style.color = colorTrazo(el.trazo, temaActual());
  editor.style.textAlign = el.tipo === "texto" ? "left" : "center";
}

// Cada tecla actualiza el elemento al momento: la forma crece si el texto no cabe
// y las flechas enganchadas a ella se recolocan.
editor.addEventListener("input", () => {
  const el = buscar(estado.editando);
  if (!el) return;
  el.texto = editor.value;
  ajustarAlTexto(el);
  recalcularFlechas(estado.elementos);
  cambio();
});

editor.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    evento.preventDefault();
    terminarEdicion();
  }
});

editor.addEventListener("blur", () => terminarEdicion());
