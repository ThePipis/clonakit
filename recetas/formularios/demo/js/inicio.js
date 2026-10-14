// Pantalla "Mis formularios": tarjetas con cada formulario y botón para crear uno nuevo.

import { h, icono, aviso, confirmar, copiarTexto, cabeceraApp, plural } from "./ui.js";
import {
  leerFormularios,
  guardarFormulario,
  borrarFormulario,
  duplicarFormulario,
  contarRespuestas,
  nuevoFormulario,
  formularioEjemplo,
  formulariosAjenosConRespuestas,
} from "./datos.js";
import { crearEnlace } from "./enlace.js";
import { estiloAcento } from "./jugador.js";

export function montarInicio(vista) {
  const controlador = new AbortController();
  document.title = "Pregunta · Formularios de una pregunta por pantalla";

  function crear(desdeEjemplo) {
    const form = desdeEjemplo ? formularioEjemplo() : nuevoFormulario();
    if (!guardarFormulario(form)) return aviso("Este navegador no deja guardar datos. Prueba en una ventana normal (no privada).", "error");
    location.hash = `editar=${form.id}`;
  }

  /** Botón "Nuevo formulario" con su menú: en blanco o desde el ejemplo. */
  function menuNuevo() {
    const menu = h(
      "div",
      { class: "menu-nuevo", role: "menu", hidden: true },
      h("button", { type: "button", role: "menuitem", class: "opcion-menu", onclick: () => crear(false) }, h("span", { class: "chip-tipo chip-pantalla" }, icono("mas")), h("span", {}, h("strong", {}, "En blanco"), h("small", {}, "Empieza desde cero"))),
      h(
        "button",
        { type: "button", role: "menuitem", class: "opcion-menu", onclick: () => crear(true) },
        h("span", { class: "chip-tipo tipo-unica" }, icono("salto")),
        h("span", {}, h("strong", {}, "Ejemplo: Pide tu presupuesto"), h("small", {}, "6 preguntas con saltos, listo para adaptar")),
      ),
    );
    const boton = h("button", { type: "button", class: "boton boton-primario boton-grande", "aria-haspopup": "menu", "aria-expanded": "false" }, icono("mas"), "Nuevo formulario");
    boton.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      boton.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener(
      "click",
      (e) => {
        if (!e.target.closest?.(".zona-nuevo")) {
          menu.hidden = true;
          boton.setAttribute("aria-expanded", "false");
        }
      },
      { signal: controlador.signal },
    );
    return h("div", { class: "zona-nuevo" }, boton, menu);
  }

  function tarjeta(form) {
    const respuestas = contarRespuestas(form.id);
    const primera = form.preguntas[0];
    const copiarEnlace = async () => {
      const ok = await copiarTexto(await crearEnlace(form));
      aviso(ok ? "Enlace copiado" : "No he podido copiar el enlace. Ábrelo en Compartir y cópialo a mano.", ok ? "ok" : "error");
    };
    const duplicar = () => {
      duplicarFormulario(form.id);
      aviso("Formulario duplicado", "ok");
      pintar();
    };
    const borrar = async () => {
      const seguro = await confirmar({
        titulo: `¿Borrar «${form.titulo}»?`,
        texto: `Se borrará de este navegador junto con ${plural(respuestas, "respuesta guardada", "respuestas guardadas")} aquí. Los enlaces que ya compartiste seguirán funcionando.`,
        aceptar: "Borrar formulario",
      });
      if (!seguro) return;
      borrarFormulario(form.id);
      aviso("Formulario borrado", "ok");
      pintar();
    };
    return h(
      "article",
      { class: "tarjeta", "data-id": form.id },
      // Miniatura: la primera pregunta con el color de acento del formulario.
      h(
        "a",
        { class: "tarjeta-mini lienzo-mini", href: `#editar=${form.id}`, style: estiloAcento(form.acento), tabindex: "-1", "aria-hidden": "true" },
        h("span", { class: "mini-numero" }, primera ? "1 →" : "¿?"),
        h("span", { class: "mini-titulo" }, primera?.titulo || form.bienvenida.titulo || form.titulo),
        h("span", { class: "mini-boton" }, primera ? "Continuar" : "Empezar"),
        h("span", { class: "mini-progreso" }),
      ),
      h(
        "div",
        { class: "tarjeta-cuerpo" },
        h("h2", { class: "tarjeta-titulo" }, h("a", { href: `#editar=${form.id}` }, form.titulo || "Formulario sin título")),
        h("p", { class: "tarjeta-datos" }, plural(form.preguntas.length, "pregunta"), " · ", plural(respuestas, "respuesta"), " en este navegador"),
      ),
      h(
        "div",
        { class: "tarjeta-acciones" },
        h("a", { class: "boton boton-pequeno boton-primario", href: `#editar=${form.id}` }, "Editar"),
        h("a", { class: "boton boton-pequeno", href: `#respuestas=${form.id}` }, icono("tabla"), "Respuestas"),
        h("button", { type: "button", class: "boton boton-pequeno", onclick: copiarEnlace }, icono("enlace"), "Copiar enlace"),
        h("span", { class: "separador" }),
        h("button", { type: "button", class: "boton-icono", "aria-label": `Duplicar ${form.titulo}`, title: "Duplicar", onclick: duplicar }, icono("duplicar")),
        h("button", { type: "button", class: "boton-icono peligro", "aria-label": `Borrar ${form.titulo}`, title: "Borrar", onclick: borrar }, icono("papelera")),
      ),
    );
  }

  function estadoVacio() {
    return h(
      "section",
      { class: "vacio" },
      h("div", { class: "vacio-dibujo", "aria-hidden": "true" }, h("span", { class: "burbuja b1" }, "¿"), h("span", { class: "burbuja b2" }, "?"), h("span", { class: "burbuja b3" }, icono("check"))),
      h("h2", {}, "Crea tu primer formulario"),
      h("p", {}, "Una pregunta por pantalla, se comparte con un enlace y las respuestas pueden llegar a tu hoja de cálculo, tu CRM o tu email."),
      h(
        "div",
        { class: "fila-botones centrada" },
        h("button", { type: "button", class: "boton boton-primario boton-grande", onclick: () => crear(true) }, icono("salto"), "Usar el ejemplo «Pide tu presupuesto»"),
        h("button", { type: "button", class: "boton boton-grande", onclick: () => crear(false) }, icono("mas"), "Empezar en blanco"),
      ),
    );
  }

  /** Formularios rellenados aquí pero creados en otro sitio (por ejemplo, la tableta en modo quiosco). */
  function seccionAjenos(ajenos) {
    return h(
      "section",
      { class: "seccion-ajenos" },
      h("h2", { class: "subtitulo-seccion" }, "Respuestas rellenadas en este dispositivo"),
      h("p", { class: "nota" }, "Formularios que se han rellenado aquí aunque se crearon en otro sitio, por ejemplo en una tableta en modo quiosco."),
      h(
        "div",
        { class: "lista-ajenos" },
        ajenos.map((a) =>
          h(
            "a",
            { class: "fila-ajeno", href: `#respuestas=${encodeURIComponent(a.id)}` },
            h("span", { class: "chip-tipo chip-pantalla" }, icono("tabla")),
            h("span", { class: "fila-ajeno-texto" }, h("strong", {}, a.titulo), h("small", {}, plural(a.total, "respuesta"))),
            h("span", { class: "fila-ajeno-accion" }, "Ver respuestas", icono("derecha")),
          ),
        ),
      ),
    );
  }

  function pintar() {
    const formularios = leerFormularios().sort((a, b) => b.actualizado.localeCompare(a.actualizado));
    const ajenos = formulariosAjenosConRespuestas();
    vista.replaceChildren(
      cabeceraApp(h("span", { class: "lema" }, "Formularios de una pregunta por pantalla")),
      h(
        "main",
        { class: "contenedor inicio" },
        h(
          "section",
          { class: "portada" },
          h("div", {}, h("h1", { class: "titulo-grande" }, "Mis formularios"), h("p", { class: "subtitulo" }, "Créalos, compártelos con un enlace y recibe las respuestas donde quieras.")),
          formularios.length > 0 && menuNuevo(),
        ),
        // En una tableta de quiosco no hay formularios propios: lo importante son sus respuestas.
        !formularios.length && ajenos.length > 0 && seccionAjenos(ajenos),
        formularios.length ? h("div", { class: "rejilla" }, formularios.map(tarjeta)) : estadoVacio(),
        formularios.length > 0 && ajenos.length > 0 && seccionAjenos(ajenos),
      ),
      h("footer", { class: "pie-app contenedor" }, "Tus formularios y las respuestas rellenadas aquí se guardan solo en este navegador."),
    );
  }

  pintar();
  return () => controlador.abort();
}
