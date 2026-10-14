// Permite reordenar los elementos de una lista arrastrándolos (con ratón o con el dedo).
// Lo usan las pestañas del editor (en horizontal) y las misiones (en vertical).
//
// Usamos "pointer events" en vez del arrastrar y soltar nativo porque funcionan
// igual con ratón y con pantallas táctiles.

export function hacerReordenable(lista, { selector, asa = null, eje = "y", clave, alTerminar }) {
  let arrastrado = null;
  let inicio = null;
  let moviendo = false;
  let ignorarClic = false;

  lista.addEventListener("pointerdown", (evento) => {
    if (evento.button !== 0) return;
    const elemento = evento.target.closest(selector);
    if (!elemento || !lista.contains(elemento)) return;
    if (asa && !evento.target.closest(asa)) return; // solo se arrastra desde el asa (⋮⋮)
    arrastrado = elemento;
    inicio = { x: evento.clientX, y: evento.clientY };
    moviendo = false;
    addEventListener("pointermove", alMover);
    addEventListener("pointerup", alSoltar);
    addEventListener("pointercancel", alSoltar);
  });

  function alMover(evento) {
    if (!arrastrado) return;
    // Si la lista se ha vuelto a pintar mientras tanto, abandonamos el arrastre.
    if (!lista.isConnected || arrastrado.parentNode !== lista) {
      alSoltar();
      return;
    }
    const distancia = Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y);
    // Hasta que no se mueve unos píxeles, lo tratamos como un clic normal.
    if (!moviendo) {
      if (distancia < 6) return;
      moviendo = true;
      arrastrado.classList.add("arrastrando");
      lista.classList.add("reordenando");
    }
    evento.preventDefault();
    const posicion = eje === "y" ? evento.clientY : evento.clientX;
    // Colocamos el elemento delante del primer hermano cuyo centro queda después del puntero.
    const hermanos = [...lista.querySelectorAll(selector)].filter((el) => el !== arrastrado);
    const siguiente = hermanos.find((el) => {
      const caja = el.getBoundingClientRect();
      const centro = eje === "y" ? caja.top + caja.height / 2 : caja.left + caja.width / 2;
      return posicion < centro;
    });
    if (siguiente) {
      if (arrastrado.nextElementSibling !== siguiente) siguiente.before(arrastrado);
    } else if (hermanos.length && hermanos.at(-1).nextElementSibling !== arrastrado) {
      hermanos.at(-1).after(arrastrado);
    }
  }

  function alSoltar() {
    removeEventListener("pointermove", alMover);
    removeEventListener("pointerup", alSoltar);
    removeEventListener("pointercancel", alSoltar);
    if (arrastrado && moviendo) {
      arrastrado.classList.remove("arrastrando");
      lista.classList.remove("reordenando");
      // El "clic" que manda el navegador al soltar llega justo después, en la misma tanda de eventos.
      ignorarClic = true;
      setTimeout(() => (ignorarClic = false), 0);
      if (arrastrado.parentNode === lista) alTerminar([...lista.querySelectorAll(selector)].map(clave));
    }
    arrastrado = null;
  }

  // Al soltar, el navegador manda un "clic": lo ignoramos para no abrir lo que se arrastró.
  lista.addEventListener(
    "click",
    (evento) => {
      if (ignorarClic) {
        evento.stopPropagation();
        evento.preventDefault();
      }
    },
    true,
  );
}
