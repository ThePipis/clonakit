// emojis.js — El selector de emojis: sirve para escribirlos en un mensaje y para reaccionar.

// Unos 40 emojis frecuentes en un equipo de trabajo.
export const EMOJIS = [
  "😀", "😂", "😊", "😍", "🥰", "😉", "😎", "🤔", "😅", "😢",
  "😮", "😡", "👍", "👎", "👏", "🙌", "🙏", "💪", "👋", "👀",
  "🎉", "🔥", "✅", "❌", "❤️", "💯", "⭐", "☕", "🍰", "🚀",
  "💡", "📌", "📦", "💰", "📞", "📅", "✉️", "🛒", "🤝", "😋",
];

const caja = () => document.getElementById("selector-emojis");
let alElegir = null; // qué hacer con el emoji elegido (insertarlo o reaccionar)
let disparador = null; // botón que abrió el selector

export function abrirSelectorEmojis(boton, funcion, titulo = "Emojis frecuentes") {
  const selector = caja();
  // Pulsar otra vez el mismo botón cierra el selector.
  if (!selector.hidden && disparador === boton) return cerrarSelectorEmojis();
  alElegir = funcion;
  disparador = boton;
  selector.innerHTML = `
    <p class="selector-titulo">${titulo}</p>
    <div class="selector-rejilla">
      ${EMOJIS.map((e) => `<button type="button" data-emoji="${e}" aria-label="${e}">${e}</button>`).join("")}
    </div>`;
  selector.hidden = false;
  colocar(selector, boton);
}

export function cerrarSelectorEmojis() {
  caja().hidden = true;
  alElegir = null;
  disparador = null;
}

// Lo colocamos encima del botón (o debajo si no cabe), sin salirse de la pantalla.
function colocar(selector, boton) {
  const r = boton.getBoundingClientRect();
  const ancho = selector.offsetWidth;
  const alto = selector.offsetHeight;
  const margen = 8;
  let arriba = r.top - alto - 6;
  if (arriba < margen) arriba = Math.min(r.bottom + 6, innerHeight - alto - margen);
  let izquierda = r.left + r.width / 2 - ancho / 2;
  izquierda = Math.max(margen, Math.min(izquierda, innerWidth - ancho - margen));
  selector.style.top = `${Math.max(margen, arriba)}px`;
  selector.style.left = `${izquierda}px`;
}

export function iniciarSelectorEmojis() {
  const selector = caja();
  selector.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-emoji]");
    if (!boton) return;
    const funcion = alElegir;
    cerrarSelectorEmojis();
    funcion?.(boton.dataset.emoji);
  });
  // Clic fuera o tecla Esc: se cierra.
  document.addEventListener("pointerdown", (evento) => {
    if (selector.hidden || selector.contains(evento.target) || disparador?.contains(evento.target)) return;
    cerrarSelectorEmojis();
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !selector.hidden) {
      evento.stopPropagation();
      cerrarSelectorEmojis();
    }
  }, true);
  addEventListener("resize", cerrarSelectorEmojis);
}

export const selectorAbierto = () => !caja().hidden;
