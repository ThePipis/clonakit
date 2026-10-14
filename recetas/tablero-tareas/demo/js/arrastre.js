// Arrastrar y soltar tarjetas y listas con la API nativa del navegador (Drag and Drop de HTML).
// Mientras se arrastra, una línea de color marca el hueco exacto donde caerá lo que llevas.

let arrastre = null; // qué se está arrastrando: { tipo: "tarjeta" | "lista", id, nodo }
let destino = null; // dónde caería: { listaId, antesDeId } (antesDeId = null significa "al final")

// La línea se dibuja encima de todo con position: fixed para no mover las tarjetas de sitio.
const linea = document.createElement("div");
linea.className = "linea-destino";
linea.setAttribute("aria-hidden", "true");

function mostrarLinea(x, y, ancho, alto) {
  if (!linea.isConnected) document.body.append(linea);
  Object.assign(linea.style, { left: `${x}px`, top: `${y}px`, width: `${ancho}px`, height: `${alto}px` });
  linea.hidden = false;
}

function limpiar() {
  arrastre?.nodo.classList.remove("arrastrando");
  document.body.classList.remove("arrastrando-tarjeta", "arrastrando-lista");
  linea.hidden = true;
  arrastre = null;
  destino = null;
}

// Para tarjetas: busca la primera tarjeta visible cuyo centro esté por debajo del puntero.
function calcularHuecoTarjeta(lista, y) {
  const contenedor = lista.querySelector(".lista-tarjetas");
  const tarjetas = [...contenedor.querySelectorAll(".tarjeta:not([hidden])")];
  const indice = tarjetas.findIndex((t) => {
    const r = t.getBoundingClientRect();
    return y < r.top + r.height / 2;
  });
  const siguiente = indice === -1 ? null : tarjetas[indice];
  const caja = contenedor.getBoundingClientRect();
  // La línea va en mitad del espacio entre la tarjeta de antes y la de después.
  let lineaY;
  if (siguiente && indice > 0) lineaY = (tarjetas[indice - 1].getBoundingClientRect().bottom + siguiente.getBoundingClientRect().top) / 2;
  else if (siguiente) lineaY = siguiente.getBoundingClientRect().top - 4;
  else if (tarjetas.length) lineaY = tarjetas.at(-1).getBoundingClientRect().bottom + 4;
  else lineaY = caja.top + 6;
  lineaY = Math.min(Math.max(lineaY, caja.top + 1), caja.bottom - 2); // que no se salga de la lista
  mostrarLinea(caja.left + 8, lineaY - 1.5, caja.width - 16, 3);
  return { listaId: lista.dataset.id, antesDeId: siguiente?.dataset.id ?? null };
}

// Para listas: busca la primera lista cuyo centro esté a la derecha del puntero.
function calcularHuecoLista(zona, x) {
  const listas = [...zona.querySelectorAll(".lista")];
  if (!listas.length) return null;
  const indice = listas.findIndex((l) => {
    const r = l.getBoundingClientRect();
    return x < r.left + r.width / 2;
  });
  const siguiente = indice === -1 ? null : listas[indice];
  const referencia = (siguiente ?? listas.at(-1)).getBoundingClientRect();
  let lineaX;
  if (siguiente && indice > 0) lineaX = (listas[indice - 1].getBoundingClientRect().right + referencia.left) / 2;
  else if (siguiente) lineaX = referencia.left - 6;
  else lineaX = referencia.right + 6;
  mostrarLinea(lineaX - 2, referencia.top, 4, Math.max(referencia.height, 80));
  return { antesDeId: siguiente?.dataset.id ?? null };
}

// Si el puntero se acerca a un borde de la zona de listas, desplazamos para ver más.
function desplazarCercaDelBorde(zona, x) {
  const r = zona.getBoundingClientRect();
  const margen = 60;
  if (x < r.left + margen) zona.scrollLeft -= 14;
  else if (x > r.right - margen) zona.scrollLeft += 14;
}

// Activa el arrastre en la zona de listas. Los eventos se escuchan en la zona (no en cada tarjeta),
// así sigue funcionando aunque las tarjetas se vuelvan a pintar.
export function activarArrastre(zona, { alSoltarTarjeta, alSoltarLista }) {
  zona.addEventListener("dragstart", (e) => {
    const tarjeta = e.target.closest?.(".tarjeta");
    const cabecera = e.target.closest?.(".lista-cabecera");
    if (tarjeta) {
      arrastre = { tipo: "tarjeta", id: tarjeta.dataset.id, nodo: tarjeta };
    } else if (cabecera) {
      const lista = cabecera.closest(".lista");
      arrastre = { tipo: "lista", id: lista.dataset.id, nodo: lista };
      // Que la "foto" que sigue al puntero sea la lista entera y no solo su cabecera.
      const r = lista.getBoundingClientRect();
      e.dataTransfer.setDragImage(lista, e.clientX - r.left, e.clientY - r.top);
    } else {
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", arrastre.id); // algunos navegadores no arrastran si no hay datos
    document.body.classList.add(arrastre.tipo === "tarjeta" ? "arrastrando-tarjeta" : "arrastrando-lista");
    // Atenuamos el original un instante después; si no, la "foto" que se arrastra saldría atenuada.
    const nodo = arrastre.nodo;
    requestAnimationFrame(() => arrastre?.nodo === nodo && nodo.classList.add("arrastrando"));
  });

  zona.addEventListener("dragover", (e) => {
    if (!arrastre) return;
    desplazarCercaDelBorde(zona, e.clientX);
    if (arrastre.tipo === "tarjeta") {
      const lista = e.target.closest(".lista");
      if (!lista) {
        linea.hidden = true;
        destino = null;
        return;
      }
      destino = calcularHuecoTarjeta(lista, e.clientY);
    } else {
      destino = calcularHuecoLista(zona, e.clientX);
    }
    e.preventDefault(); // sin esto el navegador no permite soltar aquí
    e.dataTransfer.dropEffect = "move";
  });

  zona.addEventListener("drop", (e) => {
    if (!arrastre) return;
    e.preventDefault();
    const { tipo, id } = arrastre;
    const hueco = destino;
    limpiar();
    if (!hueco) return;
    if (tipo === "tarjeta") alSoltarTarjeta(id, hueco.listaId, hueco.antesDeId);
    else alSoltarLista(id, hueco.antesDeId);
  });

  // Si se suelta fuera o se pulsa Esc, todo vuelve a su sitio.
  document.addEventListener("dragend", limpiar);
  document.addEventListener("dragover", (e) => {
    if (arrastre && !zona.contains(e.target)) {
      linea.hidden = true;
      destino = null;
    }
  });
}
