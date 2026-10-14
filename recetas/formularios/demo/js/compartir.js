// Ventana de compartir: el enlace (con el formulario dentro), copiarlo o abrirlo,
// el modo quiosco y el webhook para enviar las respuestas a tu automatización.

import { h, icono, aviso, copiarTexto } from "./ui.js";
import { crearEnlace } from "./enlace.js";
import { revisarUrlWebhook, enviarAlWebhook, cargaDePrueba, explicarFallo } from "./webhook.js";

const LIMITE_ENLACE = 2000; // a partir de aquí, algunas apps cortan los enlaces

export function abrirCompartir(form, { alGuardar }) {
  let quiosco = false;
  let turno = 0; // evita que un enlace antiguo (más lento de crear) pise a uno nuevo

  const campoEnlace = h("input", { id: "enlace-compartir", class: "campo campo-enlace", readonly: true, "aria-label": "Enlace del formulario" });
  const longitud = h("span", { class: "nota longitud-enlace" });
  const avisoLargo = h("p", { class: "alerta", hidden: true });
  const casillaQuiosco = h("input", { type: "checkbox", id: "casilla-quiosco" });
  const campoWebhook = h("input", {
    id: "campo-webhook",
    type: "url",
    class: "campo",
    placeholder: "https://tu-n8n.com/webhook/…",
    value: form.webhook,
    autocomplete: "off",
    spellcheck: "false",
  });
  const estadoWebhook = h("p", { class: "estado-webhook", role: "status", hidden: true });
  const botonPrueba = h("button", { type: "button", class: "boton", id: "boton-prueba-webhook" }, icono("enviar"), "Enviar una prueba");

  const dialogo = h(
    "dialog",
    { class: "dialogo dialogo-compartir", "aria-labelledby": "titulo-compartir" },
    h(
      "div",
      { class: "dialogo-cuerpo" },
      h(
        "div",
        { class: "dialogo-encabezado" },
        h("h2", { id: "titulo-compartir", class: "dialogo-titulo" }, "Compartir «", form.titulo, "»"),
        h("button", { type: "button", class: "boton-icono", "aria-label": "Cerrar", title: "Cerrar", onclick: () => dialogo.close() }, icono("cerrar")),
      ),
      h("p", { class: "dialogo-texto" }, "El formulario va dentro del enlace. Si lo cambias, vuelve aquí y comparte el enlace nuevo: los enlaces antiguos siguen mostrando la versión anterior."),
      h("label", { class: "etiqueta", for: "enlace-compartir" }, "Enlace para compartir"),
      campoEnlace,
      h(
        "div",
        { class: "fila-botones" },
        h("button", { type: "button", class: "boton boton-primario", id: "boton-copiar-enlace", onclick: copiar }, icono("enlace"), "Copiar enlace"),
        h("button", { type: "button", class: "boton", id: "boton-abrir-enlace", onclick: () => window.open(campoEnlace.value, "_blank", "noopener") }, icono("externo"), "Abrir en pestaña nueva"),
        longitud,
      ),
      avisoLargo,
      h(
        "label",
        { class: "casilla", for: "casilla-quiosco" },
        casillaQuiosco,
        h("span", {}, h("strong", {}, "Modo quiosco"), " · Al terminar, el formulario vuelve a empezar solo a los 10 segundos. Útil en una tableta en tu mostrador."),
      ),
      h(
        "section",
        { class: "seccion seccion-webhook" },
        h("h3", { class: "seccion-titulo" }, "Enviar respuestas a tu automatización ", h("span", { class: "opcional" }, "(opcional)")),
        h(
          "p",
          { class: "nota" },
          "Pega la URL del webhook de n8n, Make o Zapier: cada respuesta llegará allí en JSON al terminar. ",
          "Esta URL va dentro del enlace y cualquiera puede verla, así que no pongas nada secreto en ella.",
        ),
        h("label", { class: "etiqueta", for: "campo-webhook" }, "URL del webhook"),
        h("div", { class: "fila-webhook" }, campoWebhook, botonPrueba),
        estadoWebhook,
      ),
    ),
  );

  async function actualizarEnlace() {
    const miTurno = ++turno;
    const enlace = await crearEnlace(form, { quiosco });
    if (miTurno !== turno) return;
    campoEnlace.value = enlace;
    longitud.textContent = `${enlace.length.toLocaleString("es-ES")} caracteres`;
    avisoLargo.hidden = enlace.length <= LIMITE_ENLACE;
    avisoLargo.replaceChildren(
      icono("aviso"),
      h(
        "span",
        {},
        `Este enlace pasa de 2.000 caracteres. Algunas apps (mensajería, redes, email) cortan los enlaces largos: `,
        "pruébalo antes de publicarlo o acorta los textos del formulario.",
      ),
    );
  }

  async function copiar() {
    if (await copiarTexto(campoEnlace.value)) {
      aviso("Enlace copiado. Ya puedes pegarlo en tu web o tus redes.", "ok");
    } else {
      campoEnlace.select();
      aviso("No he podido copiarlo. Está seleccionado: cópialo con Cmd+C o Ctrl+C.", "error");
    }
  }

  function pintarEstado(tipo, texto) {
    estadoWebhook.hidden = !texto;
    estadoWebhook.className = `estado-webhook estado-${tipo}`;
    const nombreIcono = { ok: "check", error: "aviso", cargando: "enviar" }[tipo] ?? "info";
    estadoWebhook.replaceChildren(icono(nombreIcono), h("span", {}, texto));
  }

  // Al escribir la URL: si es válida (o se borra), se guarda y el enlace se actualiza.
  campoWebhook.addEventListener("input", () => {
    const url = campoWebhook.value.trim();
    estadoWebhook.hidden = true;
    if (revisarUrlWebhook(url)) return;
    form.webhook = url;
    alGuardar();
    actualizarEnlace();
  });
  // Al salir del campo, si la URL no vale, se explica por qué.
  campoWebhook.addEventListener("change", () => {
    const problema = revisarUrlWebhook(campoWebhook.value.trim());
    if (problema) pintarEstado("error", problema);
  });

  botonPrueba.addEventListener("click", async () => {
    const url = campoWebhook.value.trim();
    if (!url) return pintarEstado("error", "Pega primero la URL de tu webhook.");
    const problema = revisarUrlWebhook(url);
    if (problema) return pintarEstado("error", problema);
    botonPrueba.disabled = true;
    pintarEstado("cargando", "Enviando una respuesta de prueba…");
    const resultado = await enviarAlWebhook(url, cargaDePrueba(form));
    botonPrueba.disabled = false;
    if (resultado.ok) pintarEstado("ok", "Recibido. Tu automatización ha recibido una respuesta de ejemplo (marcada con \"prueba\": true).");
    else pintarEstado("error", explicarFallo(resultado));
  });

  casillaQuiosco.addEventListener("change", () => {
    quiosco = casillaQuiosco.checked;
    actualizarEnlace();
  });

  dialogo.addEventListener("close", () => dialogo.remove());
  // Pulsar en el fondo oscuro (fuera de la ventana) también la cierra.
  dialogo.addEventListener("click", (evento) => {
    if (evento.target === dialogo) dialogo.close();
  });
  document.body.append(dialogo);
  dialogo.showModal();
  actualizarEnlace();
}
