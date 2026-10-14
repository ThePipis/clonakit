// El constructor: tres zonas.
//  - Izquierda: la lista de pantallas (bienvenida, preguntas y final) y el botón de añadir.
//  - Centro: el editor de lo elegido (está en editor.js).
//  - Derecha: la vista previa en vivo, tal como la verá quien responde.
// En el móvil las tres zonas se convierten en pestañas.

import { h, icono, aviso, confirmar, hacerOrdenable, plural } from "./ui.js";
import { TIPOS, ORDEN_TIPOS, obtenerFormulario, guardarFormulario, nuevaPregunta, duplicarPregunta, sanearSaltos, tieneSaltos } from "./datos.js";
import { pintarEditor, chipTipo } from "./editor.js";
import { pintarVistaPrevia, montarJugador } from "./jugador.js";
import { abrirCompartir } from "./compartir.js";

export function montarConstructor(vista, formId) {
  const form = obtenerFormulario(formId);
  if (!form) {
    aviso("No encuentro ese formulario en este navegador.", "error");
    location.hash = "";
    return null;
  }
  const controlador = new AbortController(); // quita los oyentes globales al salir
  let seleccion = "bienvenida";
  let prueba = null; // el formulario en modo prueba, cuando está abierto
  document.title = `${form.titulo} · Pregunta`;

  // --- Barra superior ---
  const indicador = h("span", { class: "indicador-guardado", "aria-live": "polite" }, icono("check"), "Guardado");
  const campoTitulo = h("input", { class: "campo-titulo-form", value: form.titulo, "aria-label": "Título del formulario", maxlength: "200" });
  campoTitulo.addEventListener("input", () => {
    form.titulo = campoTitulo.value;
    document.title = `${form.titulo || "Formulario"} · Pregunta`;
    guardar();
    refrescarVista();
  });
  campoTitulo.addEventListener("blur", () => {
    if (!campoTitulo.value.trim()) {
      form.titulo = campoTitulo.value = "Formulario sin título";
      guardar();
      refrescarVista();
    }
  });
  const campoColor = h("input", { type: "color", class: "campo-color", value: form.acento.toLowerCase(), "aria-label": "Color de acento", title: "Color de acento" });
  campoColor.addEventListener("input", () => {
    form.acento = campoColor.value;
    guardar();
    refrescarVista();
  });
  const botonProbar = h("button", { type: "button", class: "boton", "aria-label": "Probar", onclick: abrirPrueba, title: "Rellenar el formulario sin enviar ni guardar nada" }, icono("jugar"), h("span", { class: "solo-ancho" }, "Probar"));
  const botonCompartir = h("button", { type: "button", class: "boton boton-primario", "aria-label": "Compartir", onclick: () => abrirCompartir(form, { alGuardar: guardar }) }, icono("compartir"), h("span", { class: "solo-ancho" }, "Compartir"));
  const barra = h(
    "header",
    { class: "barra-constructor" },
    h("a", { class: "boton-icono volver", href: "#", "aria-label": "Volver a Mis formularios", title: "Mis formularios" }, icono("volver")),
    h("div", { class: "titulo-y-estado" }, campoTitulo, indicador),
    h("label", { class: "selector-color", title: "Color de acento" }, icono("paleta", "solo-ancho"), campoColor),
    botonProbar,
    botonCompartir,
  );

  // --- Zonas ---
  const lista = h("ol", { class: "lista-pantallas" });
  hacerOrdenable(lista, ".item-pregunta", null, (desde, hasta) => moverPregunta(desde, hasta));
  const menuTipos = h(
    "div",
    { class: "menu-tipos", role: "menu", hidden: true },
    ORDEN_TIPOS.map((tipo) =>
      h(
        "button",
        { type: "button", role: "menuitem", class: "opcion-menu", "data-tipo": tipo, onclick: () => anadirPregunta(tipo) },
        chipTipo(tipo),
        h("span", {}, h("strong", {}, TIPOS[tipo].nombre), h("small", {}, TIPOS[tipo].pista)),
      ),
    ),
  );
  const botonAnadir = h("button", { type: "button", class: "boton-anadir", "aria-expanded": "false", "aria-haspopup": "menu", onclick: alternarMenu }, icono("mas"), "Añadir pregunta");
  const panelLista = h(
    "aside",
    { class: "panel panel-lista", "data-zona": "pantallas", "aria-label": "Pantallas del formulario" },
    h("h2", { class: "panel-titulo" }, "Pantallas"),
    lista,
    h("div", { class: "zona-anadir" }, botonAnadir, menuTipos),
  );
  const panelEditor = h("section", { class: "panel panel-editor", "data-zona": "editar", "aria-label": "Editor" });
  const marcoVista = h("div", { class: "marco-vista" });
  const panelVista = h("section", { class: "panel-vista", "data-zona": "vista", "aria-label": "Vista previa" }, h("h2", { class: "panel-titulo" }, "Vista previa"), marcoVista);

  const pestanas = [
    ["pantallas", "Pantallas"],
    ["editar", "Editar"],
    ["vista", "Vista previa"],
  ].map(([zona, texto]) => h("button", { type: "button", role: "tab", class: "pestana", "data-zona": zona, onclick: () => cambiarPestana(zona) }, texto));
  const raiz = h(
    "div",
    { class: "constructor", "data-pestana": "editar" },
    barra,
    h("nav", { class: "pestanas-constructor", role: "tablist", "aria-label": "Zonas del constructor" }, pestanas),
    h("div", { class: "zonas" }, panelLista, panelEditor, panelVista),
  );
  vista.replaceChildren(raiz);

  // Cerrar el menú de tipos al pulsar fuera o con Escape.
  document.addEventListener("click", (e) => !e.target.closest?.(".zona-anadir") && cerrarMenu(), { signal: controlador.signal });
  document.addEventListener("keydown", (e) => e.key === "Escape" && !prueba && cerrarMenu(), { signal: controlador.signal });

  // --- Guardar y refrescar ---
  let relojIndicador = null;
  function guardar() {
    form.actualizado = new Date().toISOString();
    const ok = guardarFormulario(form);
    indicador.classList.toggle("error", !ok);
    indicador.lastChild.textContent = ok ? "Guardado" : "No se ha podido guardar";
    indicador.classList.add("visible");
    clearTimeout(relojIndicador);
    relojIndicador = setTimeout(() => indicador.classList.remove("visible"), 1600);
  }

  function refrescarLista() {
    const item = (clave, contenido, extra = {}) =>
      h(
        "div",
        {
          class: `item-pantalla${seleccion === clave ? " elegido" : ""} ${extra.clase ?? ""}`,
          role: "button",
          tabindex: "0",
          "aria-current": seleccion === clave ? "true" : null,
          "data-clave": clave,
          ...extra.atributos,
          onclick: () => elegir(clave),
          onkeydown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              elegir(clave);
            }
          },
        },
        contenido,
      );
    lista.replaceChildren(
      h("li", {}, item("bienvenida", [h("span", { class: "chip-tipo chip-pantalla" }, icono("bandera")), h("span", { class: "texto-item" }, "Bienvenida")])),
      ...form.preguntas.map((p, i) =>
        h(
          "li",
          {},
          item(
            p.id,
            [
              h("span", { class: "asa", "aria-hidden": "true" }, icono("asa")),
              h("span", { class: "numero-item" }, String(i + 1)),
              chipTipo(p.tipo),
              h("span", { class: `texto-item${p.titulo ? "" : " vacio"}` }, p.titulo || "Pregunta sin título"),
              tieneSaltos(p) && h("span", { class: "marca-salto", title: "Tiene saltos" }, icono("salto")),
            ],
            { clase: "item-pregunta", atributos: { draggable: "true", "data-indice": String(i), title: "Arrastra para reordenar" } },
          ),
        ),
      ),
      form.preguntas.length === 0 ? h("li", { class: "lista-vacia" }, "Todavía no hay preguntas: añade la primera con el botón de abajo.") : "",
      h("li", {}, item("final", [h("span", { class: "chip-tipo chip-pantalla" }, icono("meta")), h("span", { class: "texto-item" }, "Final")])),
    );
  }

  function refrescarEditor(ajustes = {}) {
    panelEditor.replaceChildren(pintarEditor(form, seleccion, { alCambiar: cambio, alAccion: accionPregunta }));
    if (ajustes.enfocar) {
      const objetivo = panelEditor.querySelector(ajustes.enfocar);
      objetivo?.focus();
      if (ajustes.seleccionar) objetivo?.select?.();
    }
  }

  function refrescarVista() {
    marcoVista.replaceChildren(pintarVistaPrevia(form, seleccion));
  }

  function refrescarTodo(ajustes) {
    refrescarLista();
    refrescarEditor(ajustes);
    refrescarVista();
  }

  /** Lo llama el editor en cada cambio. */
  function cambio(tipo, ajustes = {}) {
    if (tipo === "estructura") {
      const arreglados = sanearSaltos(form);
      if (arreglados) aviso(`${plural(arreglados, "salto")} apuntaba${arreglados === 1 ? "" : "n"} hacia atrás y ahora va${arreglados === 1 ? "" : "n"} a la siguiente pregunta.`);
      guardar();
      refrescarTodo(ajustes);
      return;
    }
    guardar();
    refrescarLista();
    refrescarVista();
  }

  function elegir(clave) {
    seleccion = clave;
    refrescarTodo();
    cambiarPestana("editar");
  }

  function cambiarPestana(zona) {
    raiz.dataset.pestana = zona;
    pestanas.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.zona === zona)));
  }

  // --- Preguntas: añadir, mover, duplicar y borrar ---
  function alternarMenu() {
    const abrir = menuTipos.hidden;
    menuTipos.hidden = !abrir;
    botonAnadir.setAttribute("aria-expanded", String(abrir));
    if (abrir) menuTipos.querySelector("button")?.focus();
  }

  function cerrarMenu() {
    if (menuTipos.hidden) return;
    menuTipos.hidden = true;
    botonAnadir.setAttribute("aria-expanded", "false");
  }

  function anadirPregunta(tipo) {
    const pregunta = nuevaPregunta(tipo);
    // Se añade justo después de la pregunta elegida; si no hay ninguna elegida, al final.
    const elegida = form.preguntas.findIndex((p) => p.id === seleccion);
    form.preguntas.splice(elegida >= 0 ? elegida + 1 : form.preguntas.length, 0, pregunta);
    seleccion = pregunta.id;
    cerrarMenu();
    cambiarPestana("editar");
    cambio("estructura", { enfocar: "#ed-pregunta-titulo" });
  }

  function moverPregunta(desde, hasta) {
    if (hasta < 0 || hasta >= form.preguntas.length || desde === hasta) return;
    const [pregunta] = form.preguntas.splice(desde, 1);
    form.preguntas.splice(hasta, 0, pregunta);
    cambio("estructura");
  }

  async function accionPregunta(accion) {
    const indice = form.preguntas.findIndex((p) => p.id === seleccion);
    if (indice < 0) return;
    const pregunta = form.preguntas[indice];
    if (accion === "subir") moverPregunta(indice, indice - 1);
    if (accion === "bajar") moverPregunta(indice, indice + 1);
    if (accion === "duplicar") {
      const copia = duplicarPregunta(pregunta);
      form.preguntas.splice(indice + 1, 0, copia);
      seleccion = copia.id;
      cambio("estructura");
      aviso("Pregunta duplicada", "ok");
    }
    if (accion === "borrar") {
      const seguro = await confirmar({
        titulo: "¿Borrar esta pregunta?",
        texto: `«${pregunta.titulo || "Pregunta sin título"}» desaparecerá del formulario.`,
        aceptar: "Borrar pregunta",
      });
      if (!seguro) return;
      form.preguntas.splice(indice, 1);
      seleccion = form.preguntas[indice]?.id ?? form.preguntas[indice - 1]?.id ?? "bienvenida";
      cambio("estructura");
      aviso("Pregunta borrada", "ok");
    }
  }

  // --- Probar: el formulario entero, sin enviar ni guardar nada ---
  function abrirPrueba() {
    if (prueba) return;
    const capa = h("div", { class: "capa-prueba", role: "dialog", "aria-modal": "true", "aria-label": "Probar el formulario" });
    document.body.append(capa);
    document.body.classList.add("sin-desplazar");
    // Se prueba una copia: nada de lo que pase en la prueba toca el formulario guardado.
    const jugador = montarJugador(capa, structuredClone(form), { modo: "prueba", alCerrar: cerrarPrueba });
    prueba = { capa, jugador };
  }

  function cerrarPrueba() {
    if (!prueba) return;
    prueba.jugador.destruir();
    prueba.capa.remove();
    prueba = null;
    document.body.classList.remove("sin-desplazar");
    botonProbar.focus();
  }

  cambiarPestana("editar");
  refrescarTodo();

  return () => {
    cerrarPrueba();
    controlador.abort();
    document.querySelectorAll("dialog.dialogo-compartir").forEach((d) => d.close());
  };
}
