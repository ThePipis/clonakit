// Pantalla "Respuestas": tabla con las respuestas rellenadas en ESTE dispositivo,
// exportación a CSV (coma o punto y coma) y borrado.

import { h, icono, aviso, confirmar, cabeceraApp, formatearFecha, descargarArchivo, nombreArchivo, plural } from "./ui.js";
import { obtenerFormulario, leerRespuestas, borrarRespuesta, borrarRespuestasDe } from "./datos.js";

/**
 * Columnas de la tabla: primero las preguntas actuales del formulario (si se creó aquí)
 * y después las que solo aparecen en respuestas antiguas (preguntas ya borradas).
 */
function calcularColumnas(form, respuestas) {
  const columnas = new Map();
  form?.preguntas.forEach((p) => columnas.set(p.id, p.titulo || "Pregunta sin título"));
  for (const r of respuestas) {
    for (const par of r.pares) if (!columnas.has(par.id)) columnas.set(par.id, par.pregunta);
  }
  return [...columnas].map(([id, titulo]) => ({ id, titulo }));
}

function valorDe(respuesta, idPregunta) {
  const par = respuesta.pares.find((p) => p.id === idPregunta);
  return par ? par.respuesta : "";
}

/** Prepara una celda de CSV: comillas si hace falta y sin fórmulas peligrosas. */
function celdaCSV(valor, separador) {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  // Excel ejecuta como fórmula lo que empieza por =, @, + o -: un apóstrofo lo evita.
  // (Se respetan teléfonos y números como "+34 600…" o "-5".)
  if (/^[=@\t\r]/.test(texto) || /^[+-][^\d\s.,]/.test(texto)) texto = `'${texto}`;
  if (texto.includes(separador) || /["\r\n]/.test(texto)) texto = `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function montarRespuestas(vista, formId) {
  const form = obtenerFormulario(formId);

  function pintar() {
    const respuestas = leerRespuestas(formId).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    const titulo = form?.titulo || respuestas[0]?.formTitulo || "Formulario";
    document.title = `Respuestas · ${titulo} · Pregunta`;
    const columnas = calcularColumnas(form, respuestas);

    const selectorSeparador = h(
      "select",
      { class: "campo campo-separador", id: "separador-csv", "aria-label": "Separador del CSV" },
      h("option", { value: ";" }, "Punto y coma (Excel en español)"),
      h("option", { value: "," }, "Coma (Google Sheets, Numbers…)"),
    );

    function exportar() {
      const separador = selectorSeparador.value;
      // En el CSV, de la más antigua a la más reciente, como en una hoja de cálculo.
      const filas = [...respuestas].reverse().map((r) => [formatearFecha(r.fecha), ...columnas.map((c) => valorDe(r, c.id))]);
      const lineas = [["Fecha", ...columnas.map((c) => c.titulo)], ...filas].map((fila) => fila.map((c) => celdaCSV(c, separador)).join(separador));
      // El BOM (﻿) al principio hace que Excel lea bien las tildes y la ñ.
      const contenido = "﻿" + lineas.join("\r\n") + "\r\n";
      const hoy = new Date().toISOString().slice(0, 10);
      descargarArchivo(new Blob([contenido], { type: "text/csv;charset=utf-8" }), `respuestas-${nombreArchivo(titulo)}-${hoy}.csv`);
      aviso("CSV descargado", "ok");
    }

    async function borrarUna(respuesta) {
      const seguro = await confirmar({ titulo: "¿Borrar esta respuesta?", texto: `La del ${formatearFecha(respuesta.fecha)}. No se puede deshacer.`, aceptar: "Borrar respuesta" });
      if (!seguro) return;
      borrarRespuesta(respuesta.id);
      aviso("Respuesta borrada", "ok");
      pintar();
    }

    async function borrarTodas() {
      const seguro = await confirmar({
        titulo: "¿Borrar todas las respuestas?",
        texto: `Se borrarán ${plural(respuestas.length, "respuesta")} de este dispositivo. Exporta antes el CSV si las necesitas.`,
        aceptar: "Borrar todas",
      });
      if (!seguro) return;
      borrarRespuestasDe(formId);
      aviso("Respuestas borradas", "ok");
      pintar();
    }

    const tabla = h(
      "div",
      { class: "envoltorio-tabla", tabindex: "0", role: "region", "aria-label": "Tabla de respuestas" },
      h(
        "table",
        { class: "tabla-respuestas" },
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Fecha"), columnas.map((c) => h("th", { scope: "col" }, c.titulo)), h("th", { scope: "col" }, h("span", { class: "fuera-de-vista" }, "Acciones")))),
        h(
          "tbody",
          {},
          respuestas.map((r) =>
            h(
              "tr",
              {},
              h("td", { class: "celda-fecha" }, formatearFecha(r.fecha)),
              columnas.map((c) => {
                const valor = valorDe(r, c.id);
                return h("td", { class: valor === "" ? "celda-vacia" : "" }, valor === "" ? "—" : String(valor));
              }),
              h("td", { class: "celda-acciones" }, h("button", { type: "button", class: "boton-icono peligro", "aria-label": "Borrar esta respuesta", title: "Borrar", onclick: () => borrarUna(r) }, icono("papelera"))),
            ),
          ),
        ),
      ),
    );

    vista.replaceChildren(
      cabeceraApp(),
      h(
        "main",
        { class: "contenedor pagina-respuestas" },
        h("a", { class: "enlace-volver", href: "#" }, icono("volver"), "Mis formularios"),
        h(
          "section",
          { class: "portada" },
          h("div", {}, h("p", { class: "antetitulo" }, "Respuestas"), h("h1", { class: "titulo-grande" }, titulo), h("p", { class: "subtitulo" }, plural(respuestas.length, "respuesta"))),
          form && h("a", { class: "boton", href: `#editar=${form.id}` }, "Editar formulario"),
        ),
        h(
          "p",
          { class: "aviso-honesto" },
          icono("info"),
          h(
            "span",
            {},
            "Estas son las respuestas rellenadas en este dispositivo. Las que se rellenan en otros móviles u ordenadores se guardan allí; para tenerlas todas juntas, envíalas a tu automatización con un webhook (en Compartir).",
          ),
        ),
        respuestas.length
          ? [
              h(
                "div",
                { class: "barra-herramientas" },
                h("div", { class: "grupo-separador" }, h("label", { class: "etiqueta-en-linea", for: "separador-csv" }, "Separador"), selectorSeparador),
                h(
                  "div",
                  { class: "grupo-botones" },
                  h("button", { type: "button", class: "boton boton-primario", id: "boton-exportar", onclick: exportar }, icono("descargar"), "Exportar CSV"),
                  h("button", { type: "button", class: "boton boton-peligro-suave", onclick: borrarTodas }, icono("papelera"), "Borrar todas"),
                ),
              ),
              tabla,
            ]
          : h(
              "div",
              { class: "vacio vacio-pequeno" },
              h("div", { class: "vacio-dibujo", "aria-hidden": "true" }, h("span", { class: "burbuja b1" }, icono("tabla"))),
              h("h2", {}, "Todavía no hay respuestas en este dispositivo"),
              h("p", {}, "Cuando alguien rellene el formulario aquí, verás cada respuesta en una fila."),
            ),
      ),
    );
  }

  pintar();
  return null;
}
