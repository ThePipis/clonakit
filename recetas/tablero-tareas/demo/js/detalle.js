// Ventana de detalle de una tarjeta: título, descripción, checklist, etiquetas, fecha, mover, duplicar y borrar.
// Cada cambio se guarda al momento con cambiar(); el tablero de detrás se repinta solo.

import { ETIQUETAS, buscarTablero, buscarTarjeta, cambiar, moverTarjeta, nuevaTarjeta, tocar } from "./estado.js";
import { avisar, cerrarAlPulsarFuera, confirmar } from "./dialogos.js";
import { $, el, estadoFecha, fechaCorta, iconos, nuevoId, textoConEnlaces } from "./util.js";

const dialogo = $("dialogo-detalle");
let actual = null; // { tableroId, tarjetaId } de la tarjeta abierta
let editandoNombres = false;

// Busca otra vez la tarjeta cada vez: así nunca trabajamos con datos viejos.
function contexto() {
  if (!actual) return null;
  const tablero = buscarTablero(actual.tableroId);
  const encontrada = tablero && buscarTarjeta(tablero, actual.tarjetaId);
  return encontrada ? { tablero, ...encontrada } : null;
}

// Atajo: aplica un cambio a la tarjeta abierta y marca la fecha de "último cambio".
function cambiarTarjeta(mutacion) {
  const c = contexto();
  if (!c) return;
  cambiar(() => {
    mutacion(c);
    tocar(c.tablero, c.tarjeta);
  });
}

export function abrirDetalle(tableroId, tarjetaId) {
  actual = { tableroId, tarjetaId };
  editandoNombres = false;
  salirDeDescripcion();
  pintarTodo();
  if (!dialogo.open) dialogo.showModal();
  dialogo.scrollTop = 0; // cada tarjeta se abre por arriba, aunque la anterior se quedara desplazada
  // Enfocamos el botón de cerrar y no el título: en el móvil, enfocar un campo abriría el teclado.
  $("detalle-cerrar").focus();
  ajustarAltura($("detalle-titulo"));
}

export function cerrarDetalle() {
  if (dialogo.open) dialogo.close();
}

function pintarTodo() {
  pintarCabecera();
  pintarDescripcion();
  pintarChecklist();
  pintarEtiquetas();
  pintarFecha();
  pintarMover();
}

/* ---------- Cabecera: título y "en la lista X" ---------- */

// Los textarea no crecen solos: ajustamos su altura al contenido.
function ajustarAltura(campo) {
  campo.style.height = "auto";
  campo.style.height = `${campo.scrollHeight}px`;
}

function pintarCabecera() {
  const { tablero, tarjeta, lista } = contexto();
  const titulo = $("detalle-titulo");
  if (document.activeElement !== titulo) titulo.value = tarjeta.titulo;
  $("detalle-lista").textContent = lista.nombre;
  $("detalle-puntos").replaceChildren(
    ...ETIQUETAS.filter((e) => tarjeta.etiquetas.includes(e.id)).map((e) =>
      el("span", { class: "punto grande", style: { "--c": e.valor }, title: tablero.etiquetas[e.id] || e.nombre }, tablero.etiquetas[e.id] || ""),
    ),
  );
}

/* ---------- Descripción ---------- */

const vista = $("descripcion-vista");
const edicion = $("descripcion-edicion");

function pintarDescripcion() {
  const { tarjeta } = contexto();
  if (!edicion.hidden) return; // mientras se escribe no tocamos el campo
  vista.classList.toggle("vacia", !tarjeta.descripcion.trim());
  // Fuera de edición, las direcciones web se convierten en enlaces que se pueden pulsar.
  vista.replaceChildren(tarjeta.descripcion.trim() ? textoConEnlaces(tarjeta.descripcion) : "Añade una descripción: dirección, teléfono, notas…");
}

function entrarEnDescripcion() {
  const { tarjeta } = contexto();
  edicion.value = tarjeta.descripcion;
  vista.hidden = true;
  edicion.hidden = false;
  ajustarAltura(edicion);
  edicion.focus();
}

function salirDeDescripcion() {
  edicion.hidden = true;
  vista.hidden = false;
  if (contexto()) pintarDescripcion();
}

/* ---------- Checklist ---------- */

function pintarChecklist() {
  const { tarjeta } = contexto();
  const total = tarjeta.checklist.length;
  const hechos = tarjeta.checklist.filter((e) => e.hecha).length;
  const porcentaje = total ? Math.round((hechos / total) * 100) : 0;

  $("progreso-texto").textContent = `${porcentaje}%`;
  $("progreso-relleno").style.width = `${total ? (hechos / total) * 100 : 0}%`;
  $("progreso-barra").setAttribute("aria-valuenow", String(porcentaje));
  $("progreso-barra").classList.toggle("completa", total > 0 && hechos === total);

  $("checklist").replaceChildren(
    ...tarjeta.checklist.map((elemento) =>
      el(
        "li",
        { class: `elemento${elemento.hecha ? " hecho" : ""}` },
        el(
          "label",
          { class: "casilla" },
          el("input", {
            type: "checkbox",
            checked: elemento.hecha,
            onchange: (e) => {
              cambiarTarjeta(() => (elemento.hecha = e.target.checked));
              pintarChecklist();
              // Tras repintar, el foco vuelve a la misma casilla para poder seguir con el teclado.
              $("checklist").children[contexto().tarjeta.checklist.indexOf(elemento)]?.querySelector("input")?.focus();
            },
          }),
          el("span", {}, elemento.texto),
        ),
        el("button", {
          class: "boton-icono pequeno borrar-elemento",
          type: "button",
          "aria-label": `Quitar «${elemento.texto}»`,
          html: iconos.cerrar,
          onclick: () => {
            cambiarTarjeta(({ tarjeta: t }) => (t.checklist = t.checklist.filter((x) => x.id !== elemento.id)));
            pintarChecklist();
            $("nuevo-elemento").focus();
          },
        }),
      ),
    ),
  );
}

/* ---------- Etiquetas ---------- */

function pintarEtiquetas() {
  const { tablero, tarjeta } = contexto();
  $("detalle-etiquetas").replaceChildren(
    ...ETIQUETAS.map((e) => {
      if (editandoNombres) {
        // Modo "poner nombres": un campo por color. El nombre vale para todo el tablero.
        return el(
          "label",
          { class: "etiqueta-fila" },
          el("span", { class: "muestra-etiqueta", style: { "--c": e.valor } }),
          el("input", {
            class: "campo campo-pequeno",
            value: tablero.etiquetas[e.id],
            maxlength: "30",
            placeholder: e.nombre,
            "aria-label": `Nombre de la etiqueta ${e.nombre}`,
            oninput: (ev) => {
              cambiar(() => {
                tablero.etiquetas[e.id] = ev.target.value;
                tocar(tablero);
              });
              pintarCabecera();
            },
          }),
        );
      }
      const puesta = tarjeta.etiquetas.includes(e.id);
      return el(
        "button",
        {
          class: "etiqueta-boton",
          type: "button",
          "aria-pressed": String(puesta),
          style: { "--c": e.valor },
          onclick: (ev) => {
            cambiarTarjeta(({ tarjeta: t }) => {
              const nuevas = puesta ? t.etiquetas.filter((x) => x !== e.id) : [...t.etiquetas, e.id];
              t.etiquetas = ETIQUETAS.map((x) => x.id).filter((id) => nuevas.includes(id)); // siempre en el mismo orden
            });
            pintarEtiquetas();
            pintarCabecera();
            $("detalle-etiquetas").children[ETIQUETAS.indexOf(e)]?.focus();
          },
        },
        el("span", { class: "etiqueta-check", html: iconos.check }),
        el("span", { class: tablero.etiquetas[e.id] ? "" : "sin-nombre" }, tablero.etiquetas[e.id] || e.nombre),
      );
    }),
  );
  $("editar-nombres").textContent = editandoNombres ? "Listo" : "Poner nombre a las etiquetas";
}

/* ---------- Fecha límite ---------- */

function pintarFecha() {
  const { tarjeta } = contexto();
  const campo = $("detalle-fecha");
  if (document.activeElement !== campo) campo.value = tarjeta.fecha ?? "";
  $("detalle-cumplida").checked = tarjeta.cumplida;
  $("detalle-cumplida").disabled = !tarjeta.fecha;
  $("quitar-fecha").hidden = !tarjeta.fecha;
  const estado = estadoFecha(tarjeta.fecha, tarjeta.cumplida);
  const caja = $("detalle-estado-fecha");
  caja.className = `estado-fecha ${estado?.clase ?? "sin-fecha"}`;
  caja.textContent = estado ? `${fechaCorta(tarjeta.fecha)} · ${estado.texto}` : "Sin fecha límite";
}

/* ---------- Mover a otra lista o posición (alternativa a arrastrar, útil en el móvil y con teclado) ---------- */

function pintarMover() {
  const { tablero, lista } = contexto();
  $("mover-lista").replaceChildren(
    ...tablero.listas.map((l) => el("option", { value: l.id, selected: l.id === lista.id }, l.id === lista.id ? `${l.nombre} (actual)` : l.nombre)),
  );
  pintarPosiciones();
}

function pintarPosiciones() {
  const { tablero, lista, indice } = contexto();
  const destino = tablero.listas.find((l) => l.id === $("mover-lista").value) ?? lista;
  const misma = destino.id === lista.id;
  // En otra lista hay un hueco más (el final); en la misma, tantos como tarjetas.
  const huecos = destino.tarjetas.length + (misma ? 0 : 1);
  const elegida = misma ? indice : huecos - 1;
  $("mover-posicion").replaceChildren(
    ...Array.from({ length: huecos }, (_, i) => el("option", { value: String(i), selected: i === elegida }, i === elegida && misma ? `${i + 1} (actual)` : String(i + 1))),
  );
}

function mover() {
  const { tablero, tarjeta, lista, indice } = contexto();
  const destino = tablero.listas.find((l) => l.id === $("mover-lista").value);
  const posicion = Number($("mover-posicion").value);
  if (!destino || (destino.id === lista.id && posicion === indice)) return;
  // Calculamos delante de qué tarjeta tiene que quedar (sin contarse a sí misma).
  const otras = destino.tarjetas.filter((t) => t.id !== tarjeta.id);
  moverTarjeta(tablero, tarjeta.id, destino.id, otras[posicion]?.id ?? null);
  pintarCabecera();
  pintarMover();
  avisar(`Tarjeta movida a «${destino.nombre}», posición ${posicion + 1}.`, "exito");
}

/* ---------- Preparar la ventana (una sola vez al arrancar) ---------- */

export function prepararDetalle() {
  cerrarAlPulsarFuera(dialogo);
  $("detalle-cerrar").addEventListener("click", cerrarDetalle);
  dialogo.addEventListener("close", () => {
    const id = actual?.tarjetaId;
    salirDeDescripcion();
    actual = null;
    // Devolvemos el foco a la tarjeta en el tablero (se ha vuelto a pintar, así que la buscamos).
    if (id) document.querySelector(`.tarjeta[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  });

  // Título: se guarda mientras se escribe; si se deja vacío, vuelve el anterior.
  const titulo = $("detalle-titulo");
  titulo.addEventListener("input", () => {
    ajustarAltura(titulo);
    const texto = titulo.value.replace(/\s*\n\s*/g, " ");
    if (texto.trim()) cambiarTarjeta(({ tarjeta }) => (tarjeta.titulo = texto.trim()));
  });
  titulo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // el título es de una sola línea
      titulo.blur();
    }
  });
  titulo.addEventListener("blur", () => {
    const c = contexto();
    if (c) titulo.value = c.tarjeta.titulo;
    ajustarAltura(titulo);
  });

  // Descripción: clic para editar (salvo si se pulsa un enlace), se guarda al escribir.
  vista.addEventListener("click", (e) => {
    if (!e.target.closest("a")) entrarEnDescripcion();
  });
  vista.addEventListener("keydown", (e) => {
    if (e.target === vista && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      entrarEnDescripcion();
    }
  });
  edicion.addEventListener("input", () => {
    ajustarAltura(edicion);
    cambiarTarjeta(({ tarjeta }) => (tarjeta.descripcion = edicion.value));
  });
  edicion.addEventListener("blur", salirDeDescripcion);

  // Checklist: añadir elementos y dejar el campo listo para el siguiente.
  $("form-checklist").addEventListener("submit", (e) => {
    e.preventDefault();
    const campo = $("nuevo-elemento");
    const texto = campo.value.trim();
    if (!texto) return campo.focus();
    cambiarTarjeta(({ tarjeta }) => tarjeta.checklist.push({ id: nuevoId(), texto, hecha: false }));
    campo.value = "";
    pintarChecklist();
    campo.focus();
  });

  $("editar-nombres").addEventListener("click", () => {
    editandoNombres = !editandoNombres;
    pintarEtiquetas();
    if (editandoNombres) $("detalle-etiquetas").querySelector("input")?.focus();
  });

  // Fecha: al quitarla, también se quita la marca de "cumplida".
  $("detalle-fecha").addEventListener("change", (e) => {
    cambiarTarjeta(({ tarjeta }) => {
      tarjeta.fecha = e.target.value || null;
      if (!tarjeta.fecha) tarjeta.cumplida = false;
    });
    pintarFecha();
  });
  $("detalle-cumplida").addEventListener("change", (e) => {
    cambiarTarjeta(({ tarjeta }) => (tarjeta.cumplida = e.target.checked));
    pintarFecha();
  });
  $("quitar-fecha").addEventListener("click", () => {
    cambiarTarjeta(({ tarjeta }) => {
      tarjeta.fecha = null;
      tarjeta.cumplida = false;
    });
    pintarFecha();
    $("detalle-fecha").focus();
  });

  $("mover-lista").addEventListener("change", pintarPosiciones);
  $("boton-mover").addEventListener("click", mover);

  $("boton-duplicar").addEventListener("click", () => {
    const { tablero, tarjeta, lista, indice } = contexto();
    cambiar(() => {
      // La copia lleva todo igual menos los identificadores y las fechas de creación y cambio.
      const { id, titulo, creada, modificada } = nuevaTarjeta(`${tarjeta.titulo} (copia)`);
      const copia = {
        ...structuredClone(tarjeta),
        id,
        titulo,
        creada,
        modificada,
        checklist: tarjeta.checklist.map((e) => ({ ...e, id: nuevoId() })),
      };
      lista.tarjetas.splice(indice + 1, 0, copia); // justo debajo de la original
      tocar(tablero);
    });
    pintarMover();
    avisar("Tarjeta duplicada justo debajo.", "exito");
  });

  $("boton-borrar-tarjeta").addEventListener("click", async () => {
    const { tarjeta } = contexto();
    if (!(await confirmar("¿Borrar esta tarjeta?", `«${tarjeta.titulo}» se borrará y no se puede deshacer.`, "Borrar tarjeta"))) return;
    const c = contexto();
    if (!c) return;
    cerrarDetalle();
    cambiar(() => {
      c.lista.tarjetas.splice(c.indice, 1);
      tocar(c.tablero);
    });
    avisar("Tarjeta borrada.");
  });
}
