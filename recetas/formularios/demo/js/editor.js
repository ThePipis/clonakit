// Zona central del constructor: el editor de la pantalla elegida
// (bienvenida, una pregunta o el final).
//
// Avisa al constructor de cada cambio con eventos.alCambiar(tipo, ajustes):
//  - "texto": solo cambian textos → se guarda y se refrescan la lista y la vista previa.
//  - "estructura": cambian opciones u orden → además se vuelve a pintar este editor.

import { h, icono, hacerOrdenable, urlSegura } from "./ui.js";
import { TIPOS, nuevaOpcion } from "./datos.js";

export function pintarEditor(form, seleccion, eventos) {
  if (seleccion === "bienvenida") return editorBienvenida(form, eventos);
  if (seleccion === "final") return editorFinal(form, eventos);
  const indice = form.preguntas.findIndex((p) => p.id === seleccion);
  if (indice < 0) return editorBienvenida(form, eventos);
  return editorPregunta(form, indice, eventos);
}

// --- Piezas pequeñas ----------------------------------------------------------------

/** Etiqueta + campo de texto. alEscribir recibe el texto en cada pulsación. */
function campo({ id, etiqueta, valor, alEscribir, multilinea = false, tipo = "text", placeholder = "", nota = "", clase = "" }) {
  const control = multilinea
    ? h("textarea", { id, class: `campo ${clase}`, rows: "3", placeholder })
    : h("input", { id, type: tipo, class: `campo ${clase}`, placeholder, autocomplete: "off" });
  control.value = valor ?? "";
  control.addEventListener("input", () => alEscribir(control.value));
  return h("div", { class: "grupo" }, h("label", { class: "etiqueta", for: id }, etiqueta), control, nota && h("p", { class: "nota" }, nota));
}

/** Campo para una dirección web que avisa si no empieza por http:// o https://. */
function campoUrl({ id, etiqueta, valor, alEscribir, placeholder, nota }) {
  const mensaje = h("p", { class: "nota nota-error", hidden: true }, "Escribe la dirección completa, empezando por https://");
  const revisar = (texto) => {
    mensaje.hidden = !texto || Boolean(urlSegura(texto));
  };
  const grupo = campo({
    id,
    etiqueta,
    valor,
    tipo: "url",
    placeholder,
    nota,
    alEscribir: (texto) => {
      revisar(texto);
      alEscribir(texto.trim());
    },
  });
  grupo.append(mensaje);
  revisar(valor);
  return grupo;
}

/** Interruptor de sí/no (por ejemplo, "Obligatoria"). */
function interruptor({ id, etiqueta, marcado, alCambiar }) {
  const casilla = h("input", { type: "checkbox", id, role: "switch", class: "interruptor-casilla", checked: marcado });
  casilla.addEventListener("change", () => alCambiar(casilla.checked));
  return h("label", { class: "interruptor", for: id }, casilla, h("span", { class: "interruptor-pista", "aria-hidden": "true" }), h("span", {}, etiqueta));
}

function botonIcono(nombre, etiqueta, accion, { desactivado = false, clase = "" } = {}) {
  return h(
    "button",
    { type: "button", class: `boton-icono ${clase}`.trim(), "aria-label": etiqueta, title: etiqueta, disabled: desactivado, onclick: accion },
    icono(nombre),
  );
}

function cabecera({ chip, sobre, titulo, texto, acciones = null }) {
  return h(
    "div",
    { class: "editor-cabecera" },
    chip,
    h("div", { class: "editor-cabecera-textos" }, sobre && h("p", { class: "editor-sobre" }, sobre), h("h2", { class: "editor-titulo" }, titulo), texto && h("p", { class: "nota" }, texto)),
    acciones && h("div", { class: "editor-acciones" }, acciones),
  );
}

export function chipTipo(tipo) {
  return h("span", { class: `chip-tipo tipo-${tipo}`, title: TIPOS[tipo]?.nombre ?? "" }, icono(`tipo-${tipo}`));
}

// --- Bienvenida y final -----------------------------------------------------------

function editorBienvenida(form, { alCambiar }) {
  const b = form.bienvenida;
  return h(
    "div",
    { class: "editor" },
    cabecera({ chip: h("span", { class: "chip-tipo chip-pantalla" }, icono("bandera")), titulo: "Bienvenida", texto: "Lo primero que ve quien abre tu enlace." }),
    campo({
      id: "ed-bienvenida-titulo",
      etiqueta: "Título",
      valor: b.titulo,
      placeholder: form.titulo,
      nota: "Si lo dejas vacío, se usa el título del formulario.",
      alEscribir: (v) => {
        b.titulo = v;
        alCambiar("texto");
      },
    }),
    campo({
      id: "ed-bienvenida-texto",
      etiqueta: "Texto",
      valor: b.texto,
      multilinea: true,
      placeholder: "Cuenta en una o dos frases para qué es el formulario y cuánto se tarda.",
      alEscribir: (v) => {
        b.texto = v;
        alCambiar("texto");
      },
    }),
    campo({
      id: "ed-bienvenida-privacidad",
      etiqueta: "Aviso de privacidad (opcional)",
      valor: b.privacidad,
      multilinea: true,
      placeholder: "Usaré tus datos solo para…",
      nota: "Si preguntas nombre o email, explica para qué usarás los datos.",
      alEscribir: (v) => {
        b.privacidad = v;
        alCambiar("texto");
      },
    }),
    campoUrl({
      id: "ed-bienvenida-politica",
      etiqueta: "Enlace a tu política de privacidad (opcional)",
      valor: b.privacidadUrl,
      placeholder: "https://tu-web.com/privacidad",
      alEscribir: (v) => {
        b.privacidadUrl = v;
        alCambiar("texto");
      },
    }),
  );
}

function editorFinal(form, { alCambiar }) {
  const f = form.final;
  const poner = (clave) => (v) => {
    f[clave] = v;
    alCambiar("texto");
  };
  return h(
    "div",
    { class: "editor" },
    cabecera({ chip: h("span", { class: "chip-tipo chip-pantalla" }, icono("meta")), titulo: "Pantalla final", texto: "Se ve al terminar, después de enviar la respuesta." }),
    campo({ id: "ed-final-titulo", etiqueta: "Título", valor: f.titulo, placeholder: "¡Gracias!", alEscribir: poner("titulo") }),
    campo({ id: "ed-final-texto", etiqueta: "Texto de agradecimiento", valor: f.texto, multilinea: true, placeholder: "Te responderé muy pronto.", alEscribir: poner("texto") }),
    h(
      "div",
      { class: "dos-columnas" },
      campo({ id: "ed-final-boton", etiqueta: "Texto del botón (opcional)", valor: f.botonTexto, placeholder: "Visita mi web", alEscribir: poner("botonTexto") }),
      campoUrl({ id: "ed-final-url", etiqueta: "Dirección del botón", valor: f.botonUrl, placeholder: "https://tu-web.com", alEscribir: poner("botonUrl") }),
    ),
    h("p", { class: "nota" }, "El botón solo aparece si escribes una dirección."),
  );
}

// --- Preguntas --------------------------------------------------------------------

function editorPregunta(form, indice, eventos) {
  const { alCambiar, alAccion } = eventos;
  const p = form.preguntas[indice];
  const ultima = indice === form.preguntas.length - 1;
  const acciones = [
    botonIcono("arriba", "Subir pregunta", () => alAccion("subir"), { desactivado: indice === 0 }),
    botonIcono("abajo", "Bajar pregunta", () => alAccion("bajar"), { desactivado: ultima }),
    botonIcono("duplicar", "Duplicar pregunta", () => alAccion("duplicar")),
    botonIcono("papelera", "Borrar pregunta", () => alAccion("borrar"), { clase: "peligro" }),
  ];
  const editor = h(
    "div",
    { class: "editor" },
    cabecera({ chip: chipTipo(p.tipo), sobre: `Pregunta ${indice + 1}`, titulo: TIPOS[p.tipo].nombre, acciones }),
    campo({
      id: "ed-pregunta-titulo",
      etiqueta: "Pregunta",
      valor: p.titulo,
      clase: "campo-grande",
      placeholder: "Escribe tu pregunta…",
      alEscribir: (v) => {
        p.titulo = v;
        alCambiar("texto");
      },
    }),
    campo({
      id: "ed-pregunta-ayuda",
      etiqueta: "Ayuda (opcional)",
      valor: p.ayuda,
      placeholder: "Un texto en gris bajo la pregunta",
      alEscribir: (v) => {
        p.ayuda = v;
        alCambiar("texto");
      },
    }),
    interruptor({
      id: "ed-pregunta-obligatoria",
      etiqueta: "Obligatoria",
      marcado: p.obligatoria,
      alCambiar: (v) => {
        p.obligatoria = v;
        alCambiar("texto");
      },
    }),
  );
  if (p.tipo === "unica" || p.tipo === "multiple") editor.append(seccionOpciones(p, eventos, editor));
  if (p.tipo === "escala") editor.append(seccionEscala(p, eventos));
  if (p.tipo === "unica" || p.tipo === "sino") editor.append(seccionSaltos(form, indice, eventos));
  return editor;
}

function seccionOpciones(p, { alCambiar }, editor) {
  const mover = (desde, hasta) => {
    if (hasta < 0 || hasta >= p.opciones.length) return;
    const [opcion] = p.opciones.splice(desde, 1);
    p.opciones.splice(hasta, 0, opcion);
    alCambiar("estructura", { enfocar: `.fila-opcion[data-indice="${hasta}"] .campo-opcion` });
  };
  const filas = p.opciones.map((o, i) => {
    const entrada = h("input", { class: "campo campo-opcion", "aria-label": `Texto de la opción ${i + 1}`, placeholder: `Opción ${i + 1}`, autocomplete: "off" });
    entrada.value = o.texto;
    entrada.addEventListener("input", () => {
      o.texto = entrada.value;
      // Si la opción sale en los saltos, su nombre se actualiza también allí.
      editor.querySelectorAll(`[data-opcion="${o.id}"]`).forEach((el) => (el.textContent = `«${o.texto || `Opción ${i + 1}`}»`));
      alCambiar("texto");
    });
    entrada.addEventListener("keydown", (evento) => {
      // Intro en la última opción crea otra: más rápido para escribir listas.
      if (evento.key === "Enter" && i === p.opciones.length - 1) {
        evento.preventDefault();
        anadir();
      }
    });
    return h(
      "li",
      { class: "fila-opcion", "data-indice": String(i) },
      h("span", { class: "asa", draggable: "true", title: "Arrastra para ordenar" }, icono("asa")),
      h("span", { class: "numero-opcion", "aria-hidden": "true" }, String(i + 1)),
      entrada,
      botonIcono("arriba", `Subir opción ${i + 1}`, () => mover(i, i - 1), { desactivado: i === 0 }),
      botonIcono("abajo", `Bajar opción ${i + 1}`, () => mover(i, i + 1), { desactivado: i === p.opciones.length - 1 }),
      botonIcono(
        "papelera",
        `Borrar opción ${i + 1}`,
        () => {
          p.opciones.splice(i, 1);
          alCambiar("estructura");
        },
        { desactivado: p.opciones.length <= 1, clase: "peligro" },
      ),
    );
  });
  const lista = h("ol", { class: "lista-opciones" }, filas);
  hacerOrdenable(lista, ".fila-opcion", ".asa", mover);
  function anadir() {
    p.opciones.push(nuevaOpcion(`Opción ${p.opciones.length + 1}`));
    alCambiar("estructura", { enfocar: ".fila-opcion:last-child .campo-opcion", seleccionar: true });
  }
  return h(
    "section",
    { class: "seccion" },
    h("h3", { class: "seccion-titulo" }, "Opciones"),
    h("p", { class: "nota" }, "Arrastra por los puntitos o usa las flechas para ordenarlas."),
    lista,
    h("button", { type: "button", class: "boton boton-suave", onclick: anadir }, icono("mas"), "Añadir opción"),
  );
}

function seccionEscala(p, { alCambiar }) {
  return h(
    "section",
    { class: "seccion" },
    h("h3", { class: "seccion-titulo" }, "Etiquetas de los extremos"),
    h(
      "div",
      { class: "dos-columnas" },
      campo({
        id: "ed-escala-min",
        etiqueta: "Junto al 1",
        valor: p.etiquetas.min,
        placeholder: "Nada probable",
        alEscribir: (v) => {
          p.etiquetas.min = v;
          alCambiar("texto");
        },
      }),
      campo({
        id: "ed-escala-max",
        etiqueta: "Junto al 10",
        valor: p.etiquetas.max,
        placeholder: "Muy probable",
        alEscribir: (v) => {
          p.etiquetas.max = v;
          alCambiar("texto");
        },
      }),
    ),
  );
}

/** "Si responde X → ir a…". Solo se ofrecen preguntas posteriores: así no hay bucles. */
function seccionSaltos(form, indice, { alCambiar }) {
  const p = form.preguntas[indice];
  const destinos = [
    { valor: "", texto: "La siguiente pregunta" },
    ...form.preguntas.slice(indice + 1).map((q, k) => ({ valor: q.id, texto: `${indice + k + 2}. ${q.titulo || "Pregunta sin título"}` })),
    { valor: "final", texto: "El final (enviar)" },
  ];
  const reglas =
    p.tipo === "unica"
      ? p.opciones.map((o, i) => ({ clave: o.id, texto: o.texto || `Opción ${i + 1}`, leer: () => o.salto, poner: (v) => (o.salto = v) }))
      : [
          { clave: "si", texto: "Sí", leer: () => p.saltos.si, poner: (v) => (p.saltos.si = v) },
          { clave: "no", texto: "No", leer: () => p.saltos.no, poner: (v) => (p.saltos.no = v) },
        ];
  return h(
    "section",
    { class: "seccion" },
    h("h3", { class: "seccion-titulo" }, icono("salto"), "Saltos"),
    h("p", { class: "nota" }, "Elige adónde lleva cada respuesta. Solo se puede saltar hacia delante."),
    reglas.map((regla) => {
      const selector = h(
        "select",
        { class: "campo campo-salto", "aria-label": `Si responde ${regla.texto}, ir a` },
        destinos.map((d) => h("option", { value: d.valor }, d.texto)),
      );
      selector.value = regla.leer();
      selector.addEventListener("change", () => {
        regla.poner(selector.value);
        alCambiar("texto");
      });
      return h(
        "div",
        { class: "fila-salto" },
        h("span", { class: "si-responde" }, "Si responde ", h("strong", { "data-opcion": regla.clave }, `«${regla.texto}»`)),
        icono("derecha", "flecha-salto"),
        selector,
      );
    }),
  );
}
