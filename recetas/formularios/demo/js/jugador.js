// El formulario tal como lo ve quien responde: una pregunta por pantalla,
// grande y centrada, que se maneja con el ratón, el dedo o el teclado.
// Las mismas piezas sirven para la vista previa del constructor.

import { h, icono, colorTextoSobre, urlSegura } from "./ui.js";
import { construirPares, guardarRespuesta, nuevoId } from "./datos.js";
import { crearCarga, enviarConReintento } from "./webhook.js";

const PAUSA_AUTOAVANCE = 450; // ms: deja ver la opción elegida antes de pasar a la siguiente
const SEGUNDOS_QUIOSCO = 10; // en modo quiosco, tiempo antes de volver a empezar

/** Variables CSS con el color de acento del formulario y un color de texto que se lea encima. */
export function estiloAcento(color) {
  return `--acento:${color};--acento-texto:${colorTextoSobre(color)}`;
}

// --- Pantallas (piezas compartidas con la vista previa) ----------------------------

function pantallaBienvenida(form, { alEmpezar } = {}) {
  const b = form.bienvenida;
  const politica = urlSegura(b.privacidadUrl);
  return h(
    "section",
    { class: "pantalla bienvenida", tabindex: "-1" },
    h("h1", { class: "titulo-pantalla" }, b.titulo || form.titulo || "Formulario sin título"),
    b.texto && h("p", { class: "texto-pantalla" }, b.texto),
    h(
      "div",
      { class: "acciones" },
      h("button", { type: "button", class: "boton-acento boton-empezar", onclick: alEmpezar }, "Empezar", icono("derecha")),
      h("span", { class: "pista" }, "o pulsa ", h("kbd", {}, "Intro ↵")),
    ),
    (b.privacidad || politica) &&
      h(
        "p",
        { class: "privacidad" },
        icono("candado"),
        h(
          "span",
          {},
          b.privacidad,
          politica && [b.privacidad ? " " : "", h("a", { href: politica, target: "_blank", rel: "noopener" }, "Política de privacidad")],
        ),
      ),
  );
}

/** Pista de teclado que aparece junto al botón de continuar, según el tipo. */
function pistaTeclado(tipo) {
  if (tipo === "largo") return ["", h("kbd", {}, "Mayús + Intro"), " para nueva línea"];
  if (tipo === "escala") return ["o pulsa ", h("kbd", {}, "1–9"), " y ", h("kbd", {}, "0"), " para el 10"];
  if (tipo === "sino") return ["o pulsa ", h("kbd", {}, "S"), " o ", h("kbd", {}, "N")];
  return ["o pulsa ", h("kbd", {}, "Intro ↵")];
}

function campoTexto(p, valor, { interactivo, alCambiar, alEnviar }) {
  const comunes = {
    class: "campo-respuesta",
    placeholder: p.tipo === "email" ? "nombre@ejemplo.com" : "Escribe tu respuesta aquí…",
    "aria-label": p.titulo || "Tu respuesta",
    "aria-required": p.obligatoria ? "true" : null,
  };
  const campo =
    p.tipo === "largo"
      ? h("textarea", { ...comunes, rows: "2" })
      : h("input", {
          ...comunes,
          type: p.tipo === "email" ? "email" : "text",
          autocomplete: p.tipo === "email" ? "email" : "off",
          inputmode: p.tipo === "email" ? "email" : null,
          enterkeyhint: "next",
        });
  campo.value = valor ?? "";
  if (!interactivo) return campo;
  const ajustarAltura = () => {
    if (p.tipo !== "largo") return;
    campo.style.height = "auto";
    campo.style.height = `${campo.scrollHeight}px`;
  };
  campo.addEventListener("input", () => {
    ajustarAltura();
    alCambiar(campo.value);
  });
  campo.addEventListener("keydown", (evento) => {
    // Intro avanza; en el texto largo, Mayús + Intro hace un salto de línea.
    if (evento.key !== "Enter" || evento.isComposing) return;
    if (p.tipo === "largo" && evento.shiftKey) return;
    evento.preventDefault();
    alEnviar();
  });
  requestAnimationFrame(ajustarAltura);
  return campo;
}

function campoOpciones(p, valor, { interactivo, alElegir }) {
  const multiple = p.tipo === "multiple";
  const elegidas = multiple ? (valor ?? []) : [valor];
  return h(
    "div",
    { class: "opciones", role: "group", "aria-label": p.titulo || "Opciones" },
    multiple && h("p", { class: "nota-opciones" }, "Elige todas las que quieras"),
    p.opciones.map((o, i) =>
      h(
        "button",
        {
          type: "button",
          class: "opcion",
          "data-valor": o.id,
          "aria-pressed": String(elegidas.includes(o.id)),
          onclick: interactivo ? () => alElegir(o.id) : null,
        },
        h("kbd", {}, i < 9 ? String(i + 1) : "·"),
        h("span", { class: "texto-opcion" }, o.texto || `Opción ${i + 1}`),
        icono("check", "marca-opcion"),
      ),
    ),
  );
}

function campoEscala(p, valor, { interactivo, alElegir }) {
  const numeros = Array.from({ length: 10 }, (_, i) => i + 1);
  return h(
    "div",
    { class: "escala" },
    h(
      "div",
      { class: "numeros-escala", role: "group", "aria-label": p.titulo || "Escala del 1 al 10" },
      numeros.map((n) =>
        h(
          "button",
          {
            type: "button",
            class: "opcion-escala",
            "data-valor": String(n),
            "aria-pressed": String(valor === n),
            onclick: interactivo ? () => alElegir(n) : null,
          },
          String(n),
        ),
      ),
    ),
    (p.etiquetas.min || p.etiquetas.max) &&
      h(
        "div",
        { class: "etiquetas-escala" },
        h("span", {}, p.etiquetas.min && `1 · ${p.etiquetas.min}`),
        h("span", {}, p.etiquetas.max && `${p.etiquetas.max} · 10`),
      ),
  );
}

function campoSiNo(p, valor, { interactivo, alElegir }) {
  const boton = (clave, letra, texto) =>
    h(
      "button",
      {
        type: "button",
        class: "opcion opcion-sino",
        "data-valor": clave,
        "aria-pressed": String(valor === clave),
        onclick: interactivo ? () => alElegir(clave) : null,
      },
      h("kbd", {}, letra),
      h("span", { class: "texto-opcion" }, texto),
      icono("check", "marca-opcion"),
    );
  return h("div", { class: "opciones opciones-sino", role: "group", "aria-label": p.titulo || "Sí o no" }, boton("si", "S", "Sí"), boton("no", "N", "No"));
}

function pantallaPregunta(form, indice, valor, opciones = {}) {
  const p = form.preguntas[indice];
  const interactivo = Boolean(opciones.interactivo);
  const ajustes = { interactivo, ...opciones };
  let campo;
  if (p.tipo === "unica" || p.tipo === "multiple") campo = campoOpciones(p, valor, ajustes);
  else if (p.tipo === "escala") campo = campoEscala(p, valor, ajustes);
  else if (p.tipo === "sino") campo = campoSiNo(p, valor, ajustes);
  else campo = campoTexto(p, valor, ajustes);

  const idTitulo = `titulo-${p.id}`;
  return h(
    "section",
    { class: `pantalla pregunta tipo-${p.tipo}`, tabindex: "-1", "aria-labelledby": idTitulo },
    h("p", { class: "numero-pregunta" }, String(indice + 1), icono("derecha")),
    h(
      "h2",
      { class: "titulo-pantalla", id: idTitulo },
      p.titulo || "Pregunta sin título",
      p.obligatoria && h("span", { class: "asterisco", title: "Obligatoria" }, " *"),
    ),
    p.ayuda && h("p", { class: "ayuda" }, p.ayuda),
    campo,
    h("p", { class: "error", role: "alert" }),
    h(
      "div",
      { class: "acciones" },
      h(
        "button",
        { type: "button", class: "boton-acento continuar", onclick: opciones.alEnviar },
        h("span", { class: "texto-continuar" }, opciones.esUltima ? "Enviar" : "Continuar"),
        icono(opciones.esUltima ? "enviar" : "check"),
      ),
      h("span", { class: "pista" }, pistaTeclado(p.tipo)),
    ),
  );
}

function pantallaFinal(form, { aviso = "", extra = null } = {}) {
  const f = form.final;
  const url = urlSegura(f.botonUrl);
  return h(
    "section",
    { class: "pantalla final", tabindex: "-1" },
    h("div", { class: "sello" }, icono("check")),
    h("h1", { class: "titulo-pantalla" }, f.titulo || "¡Gracias!"),
    f.texto && h("p", { class: "texto-pantalla" }, f.texto),
    url && h("a", { class: "boton-acento", href: url, target: "_blank", rel: "noopener" }, f.botonTexto || "Continuar", icono("externo")),
    aviso && h("p", { class: "aviso-envio", role: "status" }, icono("info"), h("span", {}, aviso)),
    extra,
  );
}

/** Barra de progreso amarilla con los botones de anterior y siguiente. */
function piezasPie() {
  const relleno = h("div", { class: "progreso-relleno" });
  const barra = h("div", { class: "progreso", role: "progressbar", "aria-label": "Progreso", "aria-valuemin": "0", "aria-valuemax": "100" }, relleno);
  const anterior = h("button", { type: "button", class: "nav-boton", "aria-label": "Pregunta anterior", title: "Anterior" }, icono("arriba"));
  const siguiente = h("button", { type: "button", class: "nav-boton", "aria-label": "Siguiente pregunta", title: "Siguiente" }, icono("abajo"));
  return { barra, relleno, anterior, siguiente };
}

function ponerProgreso(piezas, porcentaje) {
  piezas.relleno.style.width = `${porcentaje}%`;
  piezas.barra.setAttribute("aria-valuenow", String(porcentaje));
}

/** Vista previa (sin interacción) de una pantalla para el constructor. */
export function pintarVistaPrevia(form, seleccion) {
  const lienzo = h("div", { class: "lienzo es-vista", style: estiloAcento(form.acento) });
  lienzo.inert = true; // se ve, pero no se puede pulsar ni enfocar
  const indice = form.preguntas.findIndex((p) => p.id === seleccion);
  let pantalla;
  if (indice >= 0) pantalla = pantallaPregunta(form, indice, undefined, { esUltima: indice === form.preguntas.length - 1 });
  else if (seleccion === "final") pantalla = pantallaFinal(form);
  else pantalla = pantallaBienvenida(form);
  lienzo.append(h("div", { class: "escena" }, pantalla));
  if (indice >= 0) {
    const piezas = piezasPie();
    ponerProgreso(piezas, Math.round((indice / form.preguntas.length) * 100));
    lienzo.append(h("footer", { class: "pie-jugador" }, piezas.barra, h("div", { class: "nav" }, piezas.anterior, piezas.siguiente)));
  }
  return lienzo;
}

// --- El formulario en marcha ------------------------------------------------------

/** Adónde va cada respuesta: a la siguiente, a una pregunta posterior o al final. */
function siguientePaso(form, indice, valor) {
  const p = form.preguntas[indice];
  let salto = "";
  if (p.tipo === "unica") salto = p.opciones.find((o) => o.id === valor)?.salto ?? "";
  if (p.tipo === "sino" && valor) salto = p.saltos[valor] ?? "";
  if (salto === "final") return "final";
  if (salto) {
    const destino = form.preguntas.findIndex((q) => q.id === salto);
    if (destino > indice) return destino; // solo hacia delante: así no hay bucles
  }
  return indice + 1 < form.preguntas.length ? indice + 1 : "final";
}

function validar(p, valor) {
  const vacio = valor === undefined || valor === null || String(valor).trim() === "" || (Array.isArray(valor) && !valor.length);
  if (vacio) {
    if (!p.obligatoria) return "";
    const elegir = ["unica", "multiple", "escala", "sino"].includes(p.tipo);
    return elegir ? "Elige una respuesta para continuar." : "Esta pregunta es obligatoria.";
  }
  // type="email" ya sabe si hay @; además pedimos un punto en el dominio (nombre@dominio.es).
  if (p.tipo === "email") {
    const prueba = h("input", { type: "email" });
    prueba.value = String(valor).trim();
    if (!prueba.checkValidity() || !/@[^@.]+\.[^@.]/.test(prueba.value)) return "Ese email no parece correcto. Revisa que sea como nombre@ejemplo.com.";
  }
  return "";
}

/**
 * Pone el formulario en marcha dentro de "destino".
 * modo "real": guarda y envía; modo "prueba": no envía ni guarda nada.
 * quiosco: al llegar al final vuelve a empezar solo a los 10 segundos.
 */
export function montarJugador(destino, form, { modo = "real", quiosco = false, alCerrar = null } = {}) {
  const enPrueba = modo === "prueba";
  const controlador = new AbortController(); // para quitar los atajos de teclado al salir
  let estado = estadoInicial();
  let temporizador = null;
  let cuentaAtras = null;

  function estadoInicial() {
    return { paso: "bienvenida", historial: [], valores: {}, enviando: false, aviso: "" };
  }

  const escena = h("main", { class: "escena" });
  const piezas = piezasPie();
  piezas.anterior.addEventListener("click", () => retroceder());
  piezas.siguiente.addEventListener("click", () => avanzar());
  const pie = h(
    "footer",
    { class: "pie-jugador" },
    piezas.barra,
    h("div", { class: "nav" }, piezas.anterior, piezas.siguiente),
  );
  // Campo trampa: invisible para las personas. Los robots suelen rellenarlo todo.
  const trampa = h("input", { type: "text", name: "web", tabindex: "-1", autocomplete: "off", id: "campo-web" });
  const lienzo = h(
    "div",
    { class: `lienzo${enPrueba ? " en-prueba" : ""}`, style: estiloAcento(form.acento) },
    enPrueba &&
      h(
        "div",
        { class: "banda-prueba" },
        h("span", {}, icono("jugar"), h("strong", {}, "Modo prueba"), " · No se envía nada ni se guarda la respuesta"),
        h("button", { type: "button", class: "boton boton-pequeno", onclick: () => alCerrar?.() }, icono("cerrar"), "Salir de la prueba"),
      ),
    escena,
    pie,
    !enPrueba && !quiosco && h("a", { class: "hecho-con", href: "./" }, "Hecho con ", h("strong", {}, "Pregunta")),
    h("div", { class: "trampa", "aria-hidden": "true" }, h("label", { for: "campo-web" }, "Deja este campo vacío"), trampa),
  );
  destino.replaceChildren(lienzo);

  const preguntaActual = () => (typeof estado.paso === "number" ? form.preguntas[estado.paso] : null);

  function pintar(direccion = "adelante") {
    clearTimeout(temporizador);
    clearInterval(cuentaAtras);
    let pantalla;
    if (estado.paso === "bienvenida") {
      pantalla = pantallaBienvenida(form, { alEmpezar: () => avanzar() });
    } else if (estado.paso === "final") {
      pantalla = pantallaFinal(form, { aviso: estado.aviso, extra: extraFinal() });
    } else {
      const p = preguntaActual();
      pantalla = pantallaPregunta(form, estado.paso, estado.valores[p.id], {
        interactivo: true,
        esUltima: siguientePaso(form, estado.paso, estado.valores[p.id]) === "final",
        alCambiar: (texto) => {
          estado.valores[p.id] = texto;
          ponerError("");
        },
        alElegir: elegir,
        alEnviar: () => avanzar(),
      });
    }
    // Transición: la pantalla nueva entra desde abajo (o desde arriba si volvemos).
    pantalla.classList.add(direccion === "atras" ? "entra-arriba" : "entra-abajo");
    escena.replaceChildren(pantalla);
    requestAnimationFrame(() => requestAnimationFrame(() => pantalla.classList.remove("entra-arriba", "entra-abajo")));

    const enPregunta = typeof estado.paso === "number";
    pie.hidden = !enPregunta;
    if (enPregunta) ponerProgreso(piezas, Math.round((estado.paso / form.preguntas.length) * 100));
    // El foco va al campo para poder escribir directamente; si no hay campo, a la pantalla.
    const objetivo = pantalla.querySelector(".campo-respuesta") ?? pantalla;
    objetivo?.focus({ preventScroll: true });
    if (estado.paso === "final" && quiosco && !enPrueba) empezarCuentaAtras(pantalla);
  }

  function extraFinal() {
    if (enPrueba) {
      return h(
        "div",
        { class: "fin-prueba" },
        h("p", {}, "Fin de la prueba: no se ha enviado ni guardado nada."),
        h("button", { type: "button", class: "boton", onclick: reiniciar }, "Probar otra vez"),
      );
    }
    if (quiosco) return h("p", { class: "cuenta-atras", "aria-live": "polite" }, `Volvemos a empezar en ${SEGUNDOS_QUIOSCO} s`);
    return null;
  }

  function empezarCuentaAtras(pantalla) {
    let quedan = SEGUNDOS_QUIOSCO;
    const texto = pantalla.querySelector(".cuenta-atras");
    cuentaAtras = setInterval(() => {
      quedan--;
      if (texto) texto.textContent = `Volvemos a empezar en ${quedan} s`;
      if (quedan <= 0) reiniciar();
    }, 1000);
  }

  function reiniciar() {
    clearInterval(cuentaAtras);
    estado = estadoInicial();
    trampa.value = "";
    pintar();
  }

  function ponerError(mensaje) {
    const caja = escena.querySelector(".error");
    if (!caja) return;
    caja.textContent = mensaje;
    const pantalla = escena.querySelector(".pantalla");
    pantalla?.classList.toggle("con-error", Boolean(mensaje));
    if (mensaje) {
      // Reinicia la pequeña sacudida aunque el error se repita.
      pantalla?.classList.remove("sacudir");
      void pantalla?.offsetWidth;
      pantalla?.classList.add("sacudir");
    }
  }

  /** Marca lo elegido y actualiza el botón (puede pasar a "Enviar" según los saltos). */
  function actualizarSeleccion() {
    const p = preguntaActual();
    const valor = estado.valores[p.id];
    escena.querySelectorAll("[data-valor]").forEach((boton) => {
      const v = boton.dataset.valor;
      const elegido = Array.isArray(valor) ? valor.includes(v) : String(valor) === v;
      boton.setAttribute("aria-pressed", String(elegido));
    });
    const esUltima = siguientePaso(form, estado.paso, valor) === "final";
    const texto = escena.querySelector(".texto-continuar");
    if (texto) texto.textContent = esUltima ? "Enviar" : "Continuar";
    escena.querySelector(".continuar .icono")?.replaceWith(icono(esUltima ? "enviar" : "check"));
    return esUltima;
  }

  function elegir(valor) {
    const p = preguntaActual();
    if (!p || estado.enviando) return;
    ponerError("");
    if (p.tipo === "multiple") {
      const elegidas = new Set(estado.valores[p.id] ?? []);
      elegidas.has(valor) ? elegidas.delete(valor) : elegidas.add(valor);
      estado.valores[p.id] = p.opciones.map((o) => o.id).filter((id) => elegidas.has(id));
      actualizarSeleccion();
      return;
    }
    estado.valores[p.id] = valor;
    const esUltima = actualizarSeleccion();
    // Con una sola respuesta posible se avanza solo tras un instante.
    // En la última pregunta no: así nadie envía sin querer; se pulsa "Enviar".
    clearTimeout(temporizador);
    if (esUltima) {
      escena.querySelector(".continuar")?.focus({ preventScroll: true });
      return;
    }
    const pasoAlElegir = estado.paso;
    temporizador = setTimeout(() => {
      if (estado.paso === pasoAlElegir) avanzar();
    }, PAUSA_AUTOAVANCE);
  }

  async function avanzar() {
    if (estado.enviando) return;
    clearTimeout(temporizador);
    if (estado.paso === "bienvenida") {
      if (!form.preguntas.length) return finalizar();
      estado.paso = 0;
      return pintar();
    }
    if (estado.paso === "final") return;
    const p = preguntaActual();
    const error = validar(p, estado.valores[p.id]);
    if (error) return ponerError(error);
    const destinoSiguiente = siguientePaso(form, estado.paso, estado.valores[p.id]);
    if (destinoSiguiente === "final") return finalizar();
    estado.historial.push(estado.paso);
    estado.paso = destinoSiguiente;
    pintar();
  }

  function retroceder() {
    if (estado.enviando || typeof estado.paso !== "number") return;
    clearTimeout(temporizador);
    estado.paso = estado.historial.length ? estado.historial.pop() : "bienvenida";
    pintar("atras");
  }

  async function finalizar() {
    const vistas = [...estado.historial, estado.paso].filter((n) => typeof n === "number");
    const idsVistos = new Set(vistas.map((i) => form.preguntas[i].id));
    estado.aviso = "";
    // En modo prueba, o si un robot ha rellenado el campo trampa, no se guarda ni se envía nada.
    if (enPrueba || trampa.value.trim()) {
      estado.paso = "final";
      return pintar();
    }
    const fecha = new Date().toISOString();
    const pares = construirPares(form, estado.valores, idsVistos);
    // Primero se guarda en este dispositivo: así nunca se pierde, aunque falle el envío.
    const guardada = guardarRespuesta({ id: nuevoId("r"), formId: form.id, formTitulo: form.titulo, fecha, pares });
    if (form.webhook) {
      estado.enviando = true;
      const boton = escena.querySelector(".continuar");
      if (boton) {
        boton.disabled = true;
        boton.classList.add("cargando");
        boton.querySelector(".texto-continuar").textContent = "Enviando…";
      }
      const resultado = await enviarConReintento(form.webhook, crearCarga(form, pares, { fecha }));
      estado.enviando = false;
      if (!resultado.ok) {
        estado.aviso = guardada
          ? "No hemos podido enviar tu respuesta ahora mismo, pero la hemos guardado en este dispositivo. ¡Gracias por tu paciencia!"
          : "No hemos podido enviar tu respuesta ahora mismo. Por favor, inténtalo de nuevo más tarde.";
      }
    }
    estado.paso = "final";
    pintar();
  }

  // Atajos de teclado: Intro avanza, números eligen opción, S/N responden sí o no.
  document.addEventListener(
    "keydown",
    (evento) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey || evento.isComposing) return;
      if (enPrueba && evento.key === "Escape") return alCerrar?.();
      const objetivo = evento.target instanceof Element ? evento.target : null;
      if (objetivo?.matches("input, textarea, select, [contenteditable]")) return; // el campo ya se encarga
      const esOpcion = objetivo?.matches(".opcion, .opcion-escala");
      if (evento.key === "Enter") {
        if (objetivo?.matches("button, a") && !esOpcion) return; // Intro sobre un botón hace lo que dice el botón
        evento.preventDefault();
        avanzar();
        return;
      }
      const p = preguntaActual();
      if (!p) return;
      const tecla = evento.key.toLowerCase();
      if ((p.tipo === "unica" || p.tipo === "multiple") && /^[1-9]$/.test(tecla)) {
        const opcion = p.opciones[Number(tecla) - 1];
        if (opcion) {
          evento.preventDefault();
          elegir(opcion.id);
        }
      } else if (p.tipo === "escala" && /^[0-9]$/.test(tecla)) {
        evento.preventDefault();
        elegir(tecla === "0" ? 10 : Number(tecla));
      } else if (p.tipo === "sino" && (tecla === "s" || tecla === "n")) {
        evento.preventDefault();
        elegir(tecla === "s" ? "si" : "no");
      }
    },
    { signal: controlador.signal },
  );

  pintar();

  return {
    destruir() {
      controlador.abort();
      clearTimeout(temporizador);
      clearInterval(cuentaAtras);
    },
  };
}
