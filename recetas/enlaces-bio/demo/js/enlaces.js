// Sección 2 del editor: la lista de enlaces.
// Cada enlace es una tarjeta que se despliega para editarla, se puede ocultar,
// borrar y cambiar de orden arrastrando el asa (⋮⋮) o con los botones de subir y bajar.

import { estado, cambiar, nuevoId, MAX_TITULO } from "./estado.js";
import { ICONOS, SVG_NINGUNO, svgIcono } from "./iconos.js";
import { normalizarDireccion, describirDireccion } from "./direcciones.js";
import { $, avisar, anunciar } from "./ui.js";

let abiertoId = null; // Tarjeta desplegada ahora mismo (solo una a la vez, para no perderse).
let arrastrandoId = null; // Tarjeta que se está arrastrando.

const buscarIndice = (id) => estado.enlaces.findIndex((enlace) => enlace.id === id);
const nombreDe = (enlace) => enlace.titulo.trim() || "Enlace sin título";

// Dirección resumida para la tarjeta: sin "https://" ni "mailto:", que ya se sobreentienden.
function direccionCorta(resultado) {
  return resultado.href.replace(/^(https?:\/\/|mailto:|tel:)/, "").replace(/\/$/, "");
}

// ---------- Dibujar ----------

export function pintarEnlaces() {
  const lista = $("lista-enlaces");
  lista.replaceChildren(...estado.enlaces.map(crearTarjeta));
  $("enlaces-vacio").hidden = estado.enlaces.length > 0;
}

function crearTarjeta(enlace, indice) {
  const tarjeta = $("plantilla-tarjeta").content.firstElementChild.cloneNode(true);
  const abierta = enlace.id === abiertoId;
  tarjeta.dataset.id = enlace.id;
  tarjeta.classList.toggle("abierta", abierta);
  tarjeta.classList.toggle("oculta", !enlace.visible);

  // Ids únicos para unir cada <label> con su campo.
  const sufijo = enlace.id;
  tarjeta.querySelector(".campo-titulo").id = "titulo-" + sufijo;
  tarjeta.querySelector(".etiqueta-titulo").htmlFor = "titulo-" + sufijo;
  tarjeta.querySelector(".campo-url").id = "url-" + sufijo;
  tarjeta.querySelector(".etiqueta-url").htmlFor = "url-" + sufijo;
  tarjeta.querySelector(".ayuda-url").id = "ayuda-" + sufijo;
  tarjeta.querySelector(".campo-url").setAttribute("aria-describedby", "ayuda-" + sufijo);
  tarjeta.querySelector(".tarjeta-edicion").id = "edicion-" + sufijo;

  const resumen = tarjeta.querySelector(".tarjeta-resumen");
  resumen.setAttribute("aria-expanded", String(abierta));
  resumen.setAttribute("aria-controls", "edicion-" + sufijo);
  tarjeta.querySelector(".tarjeta-edicion").hidden = !abierta;

  tarjeta.querySelector(".campo-titulo").value = enlace.titulo;
  tarjeta.querySelector(".campo-titulo").maxLength = MAX_TITULO;
  tarjeta.querySelector(".campo-url").value = enlace.url;

  const interruptor = tarjeta.querySelector(".interruptor input");
  interruptor.checked = enlace.visible;

  tarjeta.querySelector(".subir").disabled = indice === 0;
  tarjeta.querySelector(".bajar").disabled = indice === estado.enlaces.length - 1;

  // Rejilla de iconos: un grupo de botones de opción (radio), uno por icono.
  const rejilla = tarjeta.querySelector(".rejilla-iconos");
  for (const icono of ICONOS) {
    const opcion = document.createElement("label");
    opcion.className = "opcion-icono";
    opcion.title = icono.nombre;
    opcion.innerHTML =
      `<input type="radio" name="icono-${sufijo}" value="${icono.id}">` +
      `<span class="opcion-dibujo">${icono.id === "ninguno" ? SVG_NINGUNO : svgIcono(icono.id)}</span>` +
      `<span class="opcion-nombre">${icono.nombre}</span>`;
    opcion.querySelector("input").checked = enlace.icono === icono.id;
    rejilla.append(opcion);
  }

  actualizarCabecera(tarjeta, enlace);
  return tarjeta;
}

// Refresca solo la parte de arriba de la tarjeta (sin redibujar los campos mientras se escribe).
function actualizarCabecera(tarjeta, enlace) {
  const resultado = normalizarDireccion(enlace.url);
  tarjeta.querySelector(".tarjeta-icono").innerHTML = svgIcono(enlace.icono, 20);
  const titulo = tarjeta.querySelector(".tarjeta-titulo");
  titulo.textContent = nombreDe(enlace);
  titulo.classList.toggle("sin-titulo", !enlace.titulo.trim());

  const direccion = tarjeta.querySelector(".tarjeta-url");
  direccion.textContent = resultado.ok ? direccionCorta(resultado) : "⚠ " + resultado.error;
  direccion.classList.toggle("con-error", !resultado.ok);

  const ayuda = tarjeta.querySelector(".ayuda-url");
  ayuda.textContent = describirDireccion(resultado);
  ayuda.classList.toggle("con-error", !resultado.ok && enlace.url.trim() !== "");

  const nombre = nombreDe(enlace);
  tarjeta.querySelector(".asa").setAttribute("aria-label", `Mover «${nombre}». Arrastra o usa las flechas arriba y abajo`);
  tarjeta.querySelector(".interruptor input").setAttribute("aria-label", `Mostrar «${nombre}» en la página`);
  tarjeta.querySelector(".subir").setAttribute("aria-label", `Subir «${nombre}»`);
  tarjeta.querySelector(".bajar").setAttribute("aria-label", `Bajar «${nombre}»`);
  tarjeta.querySelector(".borrar").setAttribute("aria-label", `Borrar «${nombre}»`);
  tarjeta.querySelector(".etiqueta-oculto").hidden = enlace.visible;
}

// ---------- Acciones ----------

function anadirEnlace() {
  const enlace = { id: nuevoId(), titulo: "", url: "", icono: "web", visible: true };
  estado.enlaces.push(enlace);
  abiertoId = enlace.id;
  pintarEnlaces();
  cambiar();
  const campo = $("titulo-" + enlace.id);
  campo.scrollIntoView({ block: "center", behavior: "smooth" });
  campo.focus({ preventScroll: true });
}

function mover(desde, hasta, enfocar) {
  if (hasta < 0 || hasta >= estado.enlaces.length || desde === hasta) return;
  const [enlace] = estado.enlaces.splice(desde, 1);
  estado.enlaces.splice(hasta, 0, enlace);
  pintarEnlaces();
  cambiar();
  anunciar(`«${nombreDe(enlace)}» ahora está en la posición ${hasta + 1} de ${estado.enlaces.length}.`);
  // Devolvemos el foco al mismo control para poder seguir moviendo con el teclado.
  if (enfocar) {
    const tarjeta = $("lista-enlaces").querySelector(`[data-id="${enlace.id}"]`);
    let control = tarjeta.querySelector(enfocar);
    if (control.disabled) control = tarjeta.querySelector(enfocar === ".subir" ? ".bajar" : ".subir");
    control.focus();
  }
}

function borrar(indice) {
  const [enlace] = estado.enlaces.splice(indice, 1);
  if (abiertoId === enlace.id) abiertoId = null;
  pintarEnlaces();
  cambiar();
  // En lugar de preguntar "¿seguro?", dejamos deshacer durante unos segundos.
  avisar(`Has borrado «${nombreDe(enlace)}».`, {
    duracion: 7000,
    accion: {
      texto: "Deshacer",
      alPulsar: () => {
        estado.enlaces.splice(Math.min(indice, estado.enlaces.length), 0, enlace);
        pintarEnlaces();
        cambiar();
      },
    },
  });
  $("anadir-enlace").focus();
}

function alternarTarjeta(id) {
  abiertoId = abiertoId === id ? null : id;
  pintarEnlaces();
  const tarjeta = $("lista-enlaces").querySelector(`[data-id="${id}"]`);
  tarjeta.querySelector(".tarjeta-resumen").focus();
}

// ---------- Arrastrar y soltar (API Drag and Drop de HTML) ----------

// Calcula en qué hueco de la lista caería la tarjeta según la altura del puntero.
function huecoBajoPuntero(y) {
  const tarjetas = [...$("lista-enlaces").children];
  const indice = tarjetas.findIndex((tarjeta) => {
    const caja = tarjeta.getBoundingClientRect();
    return y < caja.top + caja.height / 2;
  });
  return indice === -1 ? tarjetas.length : indice;
}

function limpiarMarcas() {
  for (const tarjeta of $("lista-enlaces").children) tarjeta.classList.remove("soltar-arriba", "soltar-abajo", "arrastrando");
}

function iniciarArrastre(lista) {
  lista.addEventListener("dragstart", (evento) => {
    const asa = evento.target.closest?.(".asa");
    if (!asa) return;
    const tarjeta = asa.closest(".tarjeta");
    arrastrandoId = tarjeta.dataset.id;
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", nombreDe(estado.enlaces[buscarIndice(arrastrandoId)]));
    // Que se vea la tarjeta entera bajo el puntero, no solo el asa.
    evento.dataTransfer.setDragImage(tarjeta, 24, 28);
    requestAnimationFrame(() => tarjeta.classList.add("arrastrando"));
  });

  lista.addEventListener("dragover", (evento) => {
    if (!arrastrandoId) return;
    evento.preventDefault(); // Sin esto, el navegador no deja soltar aquí.
    evento.dataTransfer.dropEffect = "move";
    const hueco = huecoBajoPuntero(evento.clientY);
    const tarjetas = [...lista.children];
    for (const tarjeta of tarjetas) tarjeta.classList.remove("soltar-arriba", "soltar-abajo");
    if (hueco < tarjetas.length) tarjetas[hueco].classList.add("soltar-arriba");
    else tarjetas[tarjetas.length - 1]?.classList.add("soltar-abajo");
  });

  lista.addEventListener("drop", (evento) => {
    if (!arrastrandoId) return;
    evento.preventDefault();
    const desde = buscarIndice(arrastrandoId);
    let hasta = huecoBajoPuntero(evento.clientY);
    // Al sacar la tarjeta de su sitio, los huecos de debajo se desplazan uno hacia arriba.
    if (hasta > desde) hasta -= 1;
    arrastrandoId = null;
    limpiarMarcas();
    mover(desde, hasta);
  });

  lista.addEventListener("dragend", () => {
    arrastrandoId = null;
    limpiarMarcas();
  });
}

// ---------- Eventos ----------

export function iniciarEnlaces() {
  const lista = $("lista-enlaces");
  $("anadir-enlace").addEventListener("click", anadirEnlace);

  // Un solo "escuchador" para toda la lista (delegación): sirve también para las tarjetas nuevas.
  lista.addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest(".tarjeta");
    if (!tarjeta) return;
    const indice = buscarIndice(tarjeta.dataset.id);
    if (evento.target.closest(".tarjeta-resumen")) alternarTarjeta(tarjeta.dataset.id);
    else if (evento.target.closest(".subir")) mover(indice, indice - 1, ".subir");
    else if (evento.target.closest(".bajar")) mover(indice, indice + 1, ".bajar");
    else if (evento.target.closest(".borrar")) borrar(indice);
    else if (evento.target.closest(".cerrar-edicion")) alternarTarjeta(tarjeta.dataset.id);
  });

  // Mientras se escribe solo actualizamos el estado y la cabecera, sin redibujar la tarjeta,
  // para no perder el cursor.
  lista.addEventListener("input", (evento) => {
    const tarjeta = evento.target.closest(".tarjeta");
    const enlace = estado.enlaces[buscarIndice(tarjeta.dataset.id)];
    if (evento.target.matches(".campo-titulo")) enlace.titulo = evento.target.value;
    else if (evento.target.matches(".campo-url")) enlace.url = evento.target.value;
    else return;
    actualizarCabecera(tarjeta, enlace);
    cambiar();
  });

  lista.addEventListener("change", (evento) => {
    const tarjeta = evento.target.closest(".tarjeta");
    const enlace = estado.enlaces[buscarIndice(tarjeta.dataset.id)];
    if (evento.target.matches(".campo-url")) {
      // Al salir del campo, enseñamos la dirección ya arreglada (con https:// o mailto: delante).
      const resultado = normalizarDireccion(enlace.url);
      if (resultado.ok && resultado.href !== enlace.url) {
        enlace.url = resultado.href;
        evento.target.value = resultado.href;
      } else if (!resultado.ok && enlace.url.trim()) {
        avisar(resultado.error, { tipo: "error" });
      }
    } else if (evento.target.matches(".interruptor input")) {
      enlace.visible = evento.target.checked;
      tarjeta.classList.toggle("oculta", !enlace.visible);
      anunciar(enlace.visible ? `«${nombreDe(enlace)}» vuelve a verse.` : `«${nombreDe(enlace)}» queda oculto, sin borrarse.`);
    } else if (evento.target.name?.startsWith("icono-")) {
      enlace.icono = evento.target.value;
    } else {
      return;
    }
    actualizarCabecera(tarjeta, enlace);
    cambiar();
  });

  // Teclado sobre el asa: las flechas mueven el enlace (alternativa a arrastrar).
  lista.addEventListener("keydown", (evento) => {
    if (!evento.target.matches(".asa")) return;
    const indice = buscarIndice(evento.target.closest(".tarjeta").dataset.id);
    if (evento.key === "ArrowUp" || evento.key === "ArrowDown") {
      evento.preventDefault();
      mover(indice, indice + (evento.key === "ArrowUp" ? -1 : 1), ".asa");
    }
  });

  iniciarArrastre(lista);
}
