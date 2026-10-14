// Pantalla de Automatizaciones: un diagrama vertical con un disparador arriba
// y pasos debajo. Las cajas son HTML; las líneas que las unen, un dibujo SVG
// que se calcula después de colocar las cajas.
//
// Estructura de datos de una automatización:
//   { id, nombre, estado: "borrador"|"lista", disparador: {...}, pasos: [ ... ] }
// Un paso "condicion" lleva dentro dos listas de pasos: si: [...] y no: [...].
// Una condición siempre es el último paso de su lista: debajo se abren sus ramas.

import { estado, borrarDe, contarEtiquetas, guardarAutomatizacion, nuevoId } from "./estado.js";
import { condicionNueva, filaCondicion } from "./condiciones.js";
import { nombreEmail, nombreSegmento, preguntaCondicion, simular, textoEspera } from "./simulador.js";
import { aviso, boton, campo, confirmar, descargar, elegir, entradaTitulo, formatoFecha, h, icono, menuFlotante, pedirTexto, plural, rellenar, slug, svg, vacio } from "./ui.js";

let raiz = null;
let auto = null;
let elegido = null; // id de la caja elegida ("disparador" o id de un paso)
let prueba = null; // estado de la prueba con un contacto
let dibujo = { columnas: [], ramas: [] }; // qué líneas hay que dibujar

const TIPOS_PASO = {
  espera: { nombre: "Esperar", icono: "reloj" },
  email: { nombre: "Enviar email", icono: "enviar" },
  condicion: { nombre: "Condición", icono: "condicion" },
  etiqueta: { nombre: "Etiqueta", icono: "etiqueta" },
  fin: { nombre: "Fin", icono: "fin" },
};

export const vistaAutomatizaciones = {
  pintar(contenedor, id) {
    raiz = contenedor;
    auto = id ? estado.automatizaciones.find((a) => a.id === id) : null;
    if (id && !auto) return (location.hash = "#/automatizaciones");
    elegido = null;
    pararPrueba();
    if (auto) {
      raiz.classList.add("vista-editor", "editor-auto");
      pintarEditor();
    } else pintarLista();
  },
  actualizar() {
    if (!auto) pintarLista();
  },
  salir() {
    pararPrueba();
  },
};

export async function crearAutomatizacion() {
  const nombre = await pedirTexto({ titulo: "Nueva automatización", etiqueta: "Nombre", valor: "" });
  if (!nombre) return;
  const nueva = { id: nuevoId("au"), nombre, estado: "borrador", disparador: { tipo: "etiqueta", etiqueta: "", segmentoId: "" }, pasos: [], creado: new Date().toISOString(), actualizado: new Date().toISOString() };
  await guardarAutomatizacion(nueva);
  location.hash = `#/automatizaciones/${nueva.id}`;
}

// Cuenta los pasos de una lista, incluidos los que hay dentro de las ramas.
function contarPasos(pasos) {
  return pasos.reduce((n, p) => n + 1 + (p.tipo === "condicion" ? contarPasos(p.si) + contarPasos(p.no) : 0), 0);
}

// ---------- Lista ----------
function pintarLista() {
  const cabecera = h("header", { class: "cabecera-vista" },
    h("div", {}, h("h1", {}, "Automatizaciones"), h("p", { class: "subtitulo" }, "Dibuja tus secuencias de bienvenida o de venta. Aquí se diseñan y se prueban; el envío real se conecta más adelante.")),
    estado.automatizaciones.length ? boton("Nueva automatización", crearAutomatizacion, { clase: "primario", icono: "mas" }) : null);
  if (!estado.automatizaciones.length) {
    raiz.replaceChildren(cabecera, vacio({
      icono: "automatizaciones",
      titulo: "Planifica tu primera secuencia",
      texto: "Por ejemplo: cuando alguien recibe la etiqueta «feria-2026», esperar un día, enviarle un email de agradecimiento y, si no compra, un cupón.",
      acciones: [boton("Crear automatización", crearAutomatizacion, { clase: "primario", icono: "mas" })],
    }));
    return;
  }
  raiz.replaceChildren(cabecera, h("div", { class: "rejilla-tarjetas" }, estado.automatizaciones.map((a) => h("a", { class: "tarjeta tarjeta-enlace tarjeta-auto", href: `#/automatizaciones/${a.id}` },
    h("div", { class: "tarjeta-auto-cabeza" }, h("span", { class: "nodo-icono" }, icono("rayo", 16)), h("span", { class: `estado-chip estado-${a.estado}` }, a.estado === "lista" ? "Lista para conectar" : "Borrador")),
    h("h3", {}, a.nombre),
    h("p", { class: "tenue" }, describirDisparador(a.disparador)),
    h("p", { class: "meta" }, `${plural(contarPasos(a.pasos), "paso")} · editada el ${formatoFecha(a.actualizado)}`)))));
}

function describirDisparador(d) {
  if (d.tipo === "segmento") return d.segmentoId ? `Entra en el segmento «${nombreSegmento(d.segmentoId) ?? "(borrado)"}»` : "Elige un segmento";
  if (d.tipo === "alta") return "Se crea un contacto";
  return d.etiqueta ? `Se añade la etiqueta «${d.etiqueta}»` : "Elige una etiqueta";
}

// ---------- Editor ----------
function guardar() {
  auto.actualizado = new Date().toISOString();
  guardarAutomatizacion(auto);
}

function pintarEditor() {
  const nombre = entradaTitulo({ valor: auto.nombre, etiqueta: "Nombre de la automatización", alCambiar: (texto) => { auto.nombre = texto || "Automatización sin nombre"; guardar(); } });
  const estadoSel = h("div", { class: "segmentado", role: "radiogroup", "aria-label": "Estado" },
    [["borrador", "Borrador"], ["lista", "Lista para conectar"]].map(([valor, texto]) => h("button", { type: "button", role: "radio", class: auto.estado === valor ? "activo" : "", "aria-checked": String(auto.estado === valor), onclick: () => cambiarEstado(valor) }, texto)));

  raiz.replaceChildren(
    h("header", { class: "editor-barra" },
      h("div", { class: "cabecera-editor-titulo" }, h("a", { class: "boton-icono", href: "#/automatizaciones", "aria-label": "Volver a automatizaciones", title: "Volver" }, icono("atras")), nombre),
      h("div", { class: "fila-botones" },
        estadoSel,
        boton("Probar con un contacto", abrirPrueba, { icono: "probar", id: "boton-probar" }),
        boton("Exportar .json", exportarJSON, { icono: "exportar" }),
        h("button", { class: "boton-icono", "aria-label": "Borrar automatización", title: "Borrar automatización", onclick: borrarAutomatizacion }, icono("borrar", 18)))),
    h("div", { class: "auto-cuerpo" },
      h("div", { class: "diagrama-marco" }, h("div", { class: "diagrama", id: "diagrama" })),
      h("aside", { class: "panel-auto", id: "panel-auto" })));
  pintarDiagrama();
  pintarPanel();
  // Si el diagrama es más ancho que la pantalla (móvil), lo centramos en el disparador.
  requestAnimationFrame(() => {
    const marco = raiz.querySelector(".diagrama-marco");
    const disparador = raiz.querySelector('[data-nodo="disparador"]');
    if (!marco || !disparador) return;
    const r = disparador.getBoundingClientRect();
    const m = marco.getBoundingClientRect();
    marco.scrollLeft += r.left + r.width / 2 - (m.left + m.width / 2);
  });
}

function cambiarEstado(valor) {
  if (valor === "lista" && pasosIncompletos().length) aviso("Ojo: hay pasos sin completar (marcados con !).", "error");
  auto.estado = valor;
  raiz.querySelectorAll('[aria-label="Estado"] button').forEach((b, i) => {
    const activo = (i === 0 ? "borrador" : "lista") === valor;
    b.classList.toggle("activo", activo);
    b.setAttribute("aria-checked", String(activo));
  });
  guardar();
}

// ---------- Diagrama ----------
function pintarDiagrama() {
  const diagrama = raiz.querySelector("#diagrama");
  dibujo = { columnas: [], ramas: [] };
  const columna = h("div", { class: "col col-raiz" });
  const disparador = cajaNodo("disparador");
  columna.append(disparador);
  pintarPasos(auto.pasos, columna, [disparador], "raiz", "neutro");
  diagrama.replaceChildren(svg("svg", { class: "conectores", "aria-hidden": "true" }), columna);
  requestAnimationFrame(dibujarLineas);
}

// Pinta una lista de pasos en una columna. "elementos" guarda, en orden, todo
// lo que hay que unir con líneas en esta columna. "clave" identifica la lista:
// "raiz" para la principal y "<id de la condición>-si" / "-no" para las ramas.
function pintarPasos(pasos, columna, elementos, clave, color) {
  dibujo.columnas.push({ elementos, color });
  pasos.forEach((paso, i) => {
    const ranura = botonMas(pasos, i, clave);
    columna.append(ranura);
    elementos.push(ranura);
    const caja = cajaNodo(paso);
    elementos.push(caja);
    if (paso.tipo !== "condicion") return columna.append(caja);
    // La condición abre dos columnas, "Sí" y "No", que siguen hacia abajo.
    const ramas = h("div", { class: "ramas" });
    for (const [rama, texto] of [["si", "Sí"], ["no", "No"]]) {
      const etiqueta = h("span", { class: `etiqueta-rama rama-${rama} ${marcada(`rama:${paso.id}-${rama}`)}`, dataset: { ref: `rama:${paso.id}-${rama}` } }, texto);
      const colRama = h("div", { class: `col col-rama col-${rama}` }, etiqueta);
      dibujo.ramas.push({ desde: caja, hasta: etiqueta, color: rama });
      pintarPasos(paso[rama], colRama, [etiqueta], `${paso.id}-${rama}`, rama);
      ramas.append(colRama);
    }
    columna.append(h("div", { class: "envoltura-condicion" }, caja, ramas));
  });
  const ultimo = pasos.at(-1);
  if (ultimo?.tipo === "condicion" || ultimo?.tipo === "fin") return;
  // Final abierto: un "+" para seguir añadiendo y un punto que marca el final.
  const ranura = botonMas(pasos, pasos.length, clave);
  const final = h("div", { class: `final-rama ${marcada(`fin:${clave}`)}`, dataset: { fin: clave, ref: `fin:${clave}` }, title: "Aquí termina el recorrido" });
  columna.append(ranura, final);
  elementos.push(ranura, final);
}

function cajaNodo(pasoOId) {
  const esDisparador = pasoOId === "disparador";
  const id = esDisparador ? "disparador" : pasoOId.id;
  const info = esDisparador ? { icono: "rayo", titulo: "Disparador", detalle: describirDisparador(auto.disparador), incompleto: disparadorIncompleto() } : describirPaso(pasoOId);
  const nota = prueba?.notas.get(id);
  const clases = ["nodo", `nodo-${esDisparador ? "disparador" : pasoOId.tipo}`];
  if (id === elegido) clases.push("elegido");
  if (info.incompleto) clases.push("incompleto");
  if (prueba?.visitados.has(id)) clases.push("recorrido");
  if (prueba?.actual === id) clases.push("actual");
  return h("button", { type: "button", class: clases.join(" "), dataset: { nodo: id }, onclick: () => elegirCaja(id) },
    h("span", { class: "nodo-icono" }, icono(info.icono, 18)),
    h("span", { class: "nodo-texto" }, h("span", { class: "nodo-titulo" }, info.titulo), h("span", { class: "nodo-detalle" }, info.detalle)),
    info.incompleto ? h("span", { class: "nodo-alerta", title: "Falta completar este paso" }, "!") : null,
    nota ? h("span", { class: `nodo-nota ${nota.rama ? `nota-${nota.rama}` : ""}` }, nota.texto) : null);
}

function describirPaso(p) {
  const tipo = TIPOS_PASO[p.tipo];
  if (p.tipo === "espera") return { icono: tipo.icono, titulo: "Esperar", detalle: textoEspera(p), incompleto: !(Number(p.cantidad) > 0) };
  if (p.tipo === "email") {
    const nombre = nombreEmail(p.emailId);
    return { icono: tipo.icono, titulo: "Enviar email", detalle: nombre ? `«${nombre}»` : "Elige un email", incompleto: !nombre };
  }
  if (p.tipo === "etiqueta") return { icono: tipo.icono, titulo: p.accion === "quitar" ? "Quitar etiqueta" : "Poner etiqueta", detalle: p.etiqueta ? `«${p.etiqueta}»` : "Elige una etiqueta", incompleto: !p.etiqueta };
  if (p.tipo === "condicion") return { icono: tipo.icono, titulo: "Condición", detalle: preguntaCondicion(p), incompleto: condicionIncompleta(p) };
  return { icono: tipo.icono, titulo: "Fin", detalle: "Termina el recorrido" };
}

function condicionIncompleta(p) {
  if (p.criterio === "segmento") return !nombreSegmento(p.segmentoId);
  if (p.criterio === "campo") return !String(p.regla?.valor ?? "").trim();
  return !p.etiqueta;
}

function disparadorIncompleto() {
  const d = auto.disparador;
  return d.tipo === "etiqueta" ? !d.etiqueta : d.tipo === "segmento" ? !nombreSegmento(d.segmentoId) : false;
}

function pasosIncompletos(pasos = auto.pasos, lista = disparadorIncompleto() ? ["disparador"] : []) {
  for (const p of pasos) {
    if (describirPaso(p).incompleto) lista.push(p.id);
    if (p.tipo === "condicion") { pasosIncompletos(p.si, lista); pasosIncompletos(p.no, lista); }
  }
  return lista;
}

// Clase "recorrido" para lo que ya ha pasado la prueba con un contacto.
function marcada(ref) {
  return prueba?.visitados.has(ref) ? "recorrido" : "";
}

function botonMas(lista, indice, clave) {
  const ref = `mas:${clave}:${indice}`;
  return h("button", { type: "button", class: `ranura ${marcada(ref)}`, dataset: { ref }, "aria-label": "Insertar un paso aquí", title: "Insertar un paso", onclick: (e) => {
    const alFinal = indice === lista.length;
    const opciones = [
      { icono: "reloj", texto: "Esperar", accion: () => insertar(lista, indice, "espera") },
      { icono: "enviar", texto: "Enviar email", accion: () => insertar(lista, indice, "email") },
      { icono: "condicion", texto: "Condición (sí / no)", accion: () => insertar(lista, indice, "condicion") },
      { icono: "etiqueta", texto: "Poner etiqueta", accion: () => insertar(lista, indice, "etiqueta", "poner") },
      { icono: "etiqueta", texto: "Quitar etiqueta", accion: () => insertar(lista, indice, "etiqueta", "quitar") },
    ];
    // "Fin" solo tiene sentido al final de una rama.
    if (alFinal) opciones.push({ icono: "fin", texto: "Fin", accion: () => insertar(lista, indice, "fin") });
    menuFlotante(e.currentTarget, opciones);
  } }, icono("mas", 14));
}

function pasoNuevo(tipo, accion) {
  const base = { id: nuevoId("p"), tipo };
  if (tipo === "espera") return { ...base, cantidad: 1, unidad: "dias" };
  if (tipo === "email") return { ...base, emailId: estado.emails.length === 1 ? estado.emails[0].id : "" };
  if (tipo === "etiqueta") return { ...base, accion, etiqueta: "" };
  if (tipo === "condicion") return { ...base, criterio: "etiqueta", etiqueta: "", regla: condicionNueva("nombre"), segmentoId: "", si: [], no: [] };
  return base;
}

function insertar(lista, indice, tipo, accion) {
  pararPrueba();
  const paso = pasoNuevo(tipo, accion);
  if (tipo === "condicion" && indice < lista.length) {
    // Lo que había debajo pasa a la rama "Sí" (una condición siempre cierra su columna).
    paso.si = lista.splice(indice);
    aviso("Los pasos de debajo han pasado a la rama «Sí».", "info");
  }
  lista.splice(indice, 0, paso);
  elegido = paso.id;
  guardar();
  pintarDiagrama();
  pintarPanel();
}

// Busca un paso por su id en cualquier rama. Devuelve la lista que lo contiene.
function buscar(pasos, id) {
  for (let i = 0; i < pasos.length; i++) {
    if (pasos[i].id === id) return { lista: pasos, indice: i, paso: pasos[i] };
    if (pasos[i].tipo === "condicion") {
      const dentro = buscar(pasos[i].si, id) ?? buscar(pasos[i].no, id);
      if (dentro) return dentro;
    }
  }
  return null;
}

async function borrarPaso(id) {
  const encontrado = buscar(auto.pasos, id);
  if (!encontrado) return;
  const { lista, indice, paso } = encontrado;
  if (paso.tipo === "condicion" && (paso.si.length || paso.no.length)) {
    const respuesta = await elegir({
      titulo: "Borrar condición",
      texto: "Al quitar la condición solo puede quedar un camino. ¿Qué rama quieres conservar?",
      opciones: [
        { valor: "ninguna", texto: "Borrar las dos", clase: "peligro-suave" },
        { valor: "no", texto: `Conservar «No» (${plural(contarPasos(paso.no), "paso")})` },
        { valor: "si", texto: `Conservar «Sí» (${plural(contarPasos(paso.si), "paso")})`, clase: "primario" },
      ],
    });
    if (!respuesta) return;
    lista.splice(indice, 1, ...(respuesta === "ninguna" ? [] : paso[respuesta]));
  } else {
    lista.splice(indice, 1);
  }
  pararPrueba();
  elegido = null;
  guardar();
  pintarDiagrama();
  pintarPanel();
  aviso("Paso borrado");
}

function elegirCaja(id) {
  if (prueba?.corriendo) return;
  pararPrueba();
  elegido = id;
  pintarDiagrama();
  pintarPanel();
}

// Dibuja las líneas SVG entre las cajas ya colocadas.
function dibujarLineas() {
  const diagrama = raiz?.querySelector("#diagrama");
  const capa = diagrama?.querySelector("svg.conectores");
  if (!capa) return;
  const base = diagrama.getBoundingClientRect();
  capa.setAttribute("width", diagrama.scrollWidth);
  capa.setAttribute("height", diagrama.scrollHeight);
  const punto = (el, lado) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: (lado === "arriba" ? r.top : r.bottom) - base.top };
  };
  const recorrido = (el) => el.classList.contains("recorrido");
  const trazos = [];
  for (const { elementos, color } of dibujo.columnas) {
    for (let i = 0; i < elementos.length - 1; i++) {
      const a = punto(elementos[i], "abajo");
      const b = punto(elementos[i + 1], "arriba");
      trazos.push({ d: `M${a.x} ${a.y} L${b.x} ${b.y}`, color, activo: recorrido(elementos[i]) && recorrido(elementos[i + 1]) });
    }
  }
  for (const { desde, hasta, color } of dibujo.ramas) {
    const a = punto(desde, "abajo");
    const b = punto(hasta, "arriba");
    const medio = (a.y + b.y) / 2;
    trazos.push({ d: `M${a.x} ${a.y} C${a.x} ${medio} ${b.x} ${medio} ${b.x} ${b.y}`, color, activo: recorrido(desde) && recorrido(hasta) });
  }
  // Primero las líneas normales y encima las del camino de la prueba.
  trazos.sort((x, y) => x.activo - y.activo);
  capa.replaceChildren(...trazos.map((t) => svg("path", { d: t.d, class: `linea linea-${t.color} ${t.activo ? "linea-activa" : ""}` })));
}

// Redibujar las líneas si cambia el tamaño de la ventana.
window.addEventListener("resize", () => { if (auto && raiz?.isConnected) dibujarLineas(); });

// ---------- Panel lateral ----------
function pintarPanel() {
  const panel = raiz.querySelector("#panel-auto");
  if (prueba) return pintarPanelPrueba(panel);
  panel.classList.remove("en-prueba");
  panel.classList.toggle("abierto", !!elegido);
  if (!elegido) {
    panel.replaceChildren(h("div", { class: "propiedades-vacio" }, icono("automatizaciones", 24),
      h("p", {}, "Pulsa una caja para editarla."),
      h("p", { class: "tenue" }, "Usa los botones «+» entre cajas para insertar pasos: esperas, emails, condiciones, etiquetas o el final.")));
    return;
  }
  const cambio = () => { guardar(); pintarDiagrama(); };
  let titulo;
  let controles;
  if (elegido === "disparador") {
    titulo = "Disparador";
    controles = editorDisparador(cambio);
  } else {
    const encontrado = buscar(auto.pasos, elegido);
    if (!encontrado) { elegido = null; return pintarPanel(); }
    const paso = encontrado.paso;
    titulo = describirPaso(paso).titulo;
    controles = [editorPaso(paso, cambio), h("div", { class: "panel-auto-pie" }, boton("Borrar este paso", () => borrarPaso(paso.id), { clase: "peligro-suave", icono: "borrar" }))];
  }
  rellenar(panel, h("div", { class: "panel-propiedades-cabecera" },
    h("h2", { class: "zona-titulo" }, titulo),
    h("button", { type: "button", class: "boton-icono cerrar-propiedades", "aria-label": "Cerrar panel", title: "Listo", onclick: () => { elegido = null; pintarDiagrama(); pintarPanel(); } }, icono("cerrar", 16))), controles);
}

// Selector de etiqueta con sugerencias de las etiquetas que ya existen.
function entradaEtiqueta(valor, alCambiar) {
  return h("input", { class: "entrada", type: "text", list: "lista-etiquetas", placeholder: "por ejemplo: cliente", value: valor ?? "", oninput: (e) => alCambiar(e.target.value.trim().toLowerCase()) });
}

function selectorSegmento(valor, alCambiar) {
  if (!estado.segmentos.length) return h("p", { class: "tenue" }, "Todavía no tienes segmentos. ", h("a", { href: "#/segmentos" }, "Crea uno"), ".");
  return h("select", { class: "entrada", value: valor || "", onchange: (e) => alCambiar(e.target.value) },
    h("option", { value: "" }, "Elige un segmento…"), estado.segmentos.map((s) => h("option", { value: s.id }, s.nombre)));
}

function editorDisparador(cambio) {
  const d = auto.disparador;
  const detalle = h("div");
  const pintarDetalle = () => {
    if (d.tipo === "etiqueta") detalle.replaceChildren(campo("Etiqueta", entradaEtiqueta(d.etiqueta, (v) => { d.etiqueta = v; cambio(); }), contarEtiquetas().size ? "Empieza a escribir para ver tus etiquetas." : null));
    else if (d.tipo === "segmento") detalle.replaceChildren(campo("Segmento", selectorSegmento(d.segmentoId, (v) => { d.segmentoId = v; cambio(); })));
    else detalle.replaceChildren(h("p", { class: "tenue" }, "Empieza en cuanto se añade un contacto nuevo (a mano o al importar)."));
  };
  pintarDetalle();
  return [
    h("p", { class: "nota-panel" }, icono("rayo", 15), "Lo que hace que un contacto empiece este recorrido."),
    campo("Cuándo empieza", h("select", { class: "entrada", value: d.tipo, onchange: (e) => { d.tipo = e.target.value; pintarDetalle(); cambio(); } },
      h("option", { value: "etiqueta" }, "Se añade una etiqueta"),
      h("option", { value: "segmento" }, "Entra en un segmento"),
      h("option", { value: "alta" }, "Se crea un contacto"))),
    detalle,
  ];
}

function editorPaso(paso, cambio) {
  if (paso.tipo === "espera") {
    return h("div", { class: "fila-formulario" },
      campo("Cuánto", h("input", { class: "entrada", type: "number", min: 1, step: 1, value: paso.cantidad, oninput: (e) => { paso.cantidad = Math.max(0, Number(e.target.value)); cambio(); } })),
      campo("Unidad", h("select", { class: "entrada", value: paso.unidad, onchange: (e) => { paso.unidad = e.target.value; cambio(); } }, h("option", { value: "horas" }, "horas"), h("option", { value: "dias" }, "días"))));
  }
  if (paso.tipo === "email") {
    if (!estado.emails.length) return h("p", { class: "tenue" }, "Todavía no tienes emails. ", h("a", { href: "#/emails" }, "Crea uno"), " y vuelve aquí.");
    return h("div", {},
      campo("Email que se envía", h("select", { class: "entrada", value: paso.emailId, onchange: (e) => { paso.emailId = e.target.value; cambio(); pintarPanel(); } },
        h("option", { value: "" }, "Elige un email…"), estado.emails.map((em) => h("option", { value: em.id }, em.nombre)))),
      paso.emailId && nombreEmail(paso.emailId) ? h("a", { class: "enlace", href: `#/emails/${paso.emailId}` }, "Abrir en el editor →") : null);
  }
  if (paso.tipo === "etiqueta") {
    return h("div", {},
      campo("Acción", h("select", { class: "entrada", value: paso.accion, onchange: (e) => { paso.accion = e.target.value; cambio(); pintarPanel(); } }, h("option", { value: "poner" }, "Poner la etiqueta"), h("option", { value: "quitar" }, "Quitar la etiqueta"))),
      campo("Etiqueta", entradaEtiqueta(paso.etiqueta, (v) => { paso.etiqueta = v; cambio(); })));
  }
  if (paso.tipo === "condicion") {
    const detalle = h("div");
    const pintarDetalle = () => {
      if (paso.criterio === "segmento") detalle.replaceChildren(campo("Segmento", selectorSegmento(paso.segmentoId, (v) => { paso.segmentoId = v; cambio(); })));
      else if (paso.criterio === "campo") detalle.replaceChildren(h("div", { class: "campo" }, h("span", { class: "campo-etiqueta" }, "Regla"), filaCondicion(paso.regla, { alCambiar: cambio, soloCampos: true })));
      else detalle.replaceChildren(campo("Etiqueta", entradaEtiqueta(paso.etiqueta, (v) => { paso.etiqueta = v; cambio(); })));
    };
    pintarDetalle();
    return h("div", {},
      campo("Qué se comprueba", h("select", { class: "entrada", value: paso.criterio, onchange: (e) => { paso.criterio = e.target.value; pintarDetalle(); cambio(); } },
        h("option", { value: "etiqueta" }, "Tiene una etiqueta"),
        h("option", { value: "campo" }, "El valor de un campo"),
        h("option", { value: "segmento" }, "Está en un segmento"))),
      detalle,
      h("p", { class: "nota-panel" }, h("span", { class: "punto punto-si" }), " Si se cumple, sigue por «Sí». ", h("span", { class: "punto punto-no" }), " Si no, por «No»."));
  }
  return h("p", { class: "tenue" }, "Aquí termina el recorrido para quien llegue a este punto.");
}

// ---------- Probar con un contacto ----------
function abrirPrueba() {
  if (!estado.contactos.length) return aviso("Necesitas al menos un contacto para probar.", "error");
  pararPrueba();
  prueba = { visitados: new Set(), notas: new Map(), actual: null, pasos: [], corriendo: false, contactoId: prueba?.contactoId ?? "" };
  elegido = null;
  pintarDiagrama();
  pintarPanel();
}

function pintarPanelPrueba(panel) {
  panel.classList.add("abierto", "en-prueba");
  const contactos = [...estado.contactos].sort((a, b) => (a.nombre || a.email).localeCompare(b.nombre || b.email, "es")).slice(0, 1000);
  const selector = h("select", { class: "entrada", id: "contacto-prueba", value: prueba.contactoId, onchange: (e) => (prueba.contactoId = e.target.value) },
    h("option", { value: "" }, "Elige un contacto…"), contactos.map((c) => h("option", { value: c.id }, c.nombre ? `${c.nombre} · ${c.email}` : c.email)));
  const registro = h("ol", { class: "registro-prueba", id: "registro-prueba" }, prueba.pasos.map((p, i) => h("li", { class: i === prueba.pasos.length - 1 && prueba.corriendo ? "nuevo" : "" }, p.texto)));
  rellenar(panel,
    h("div", { class: "panel-propiedades-cabecera" }, h("h2", { class: "zona-titulo" }, "Probar con un contacto"),
      h("button", { type: "button", class: "boton-icono", "aria-label": "Salir de la prueba", title: "Salir de la prueba", onclick: () => { pararPrueba(); pintarDiagrama(); pintarPanel(); } }, icono("cerrar", 16))),
    h("p", { class: "nota-panel" }, icono("candado", 15), "Solo es una simulación: no se espera ni se envía nada, y el contacto no cambia."),
    campo("Contacto", selector),
    boton(prueba.terminada ? "Repetir la prueba" : "Empezar", empezarPrueba, { clase: "primario", icono: "probar", id: "empezar-prueba", disabled: prueba.corriendo }),
    prueba.pasos.length ? h("h3", { class: "ficha-subtitulo" }, "Recorrido") : null,
    registro,
    prueba.terminada ? h("p", { class: "resumen-prueba", id: "resumen-prueba" }, icono("check", 16), `Recorrido completo: ${plural(prueba.pasos.length, "paso")}${prueba.horas ? `, ${prueba.horas % 24 === 0 ? plural(prueba.horas / 24, "día") : plural(prueba.horas, "hora")} de espera simulados` : ""}. No se ha enviado nada.`) : null);
  registro.lastElementChild?.scrollIntoView({ block: "nearest" });
}

// Ilumina el camino caja a caja, con una pequeña pausa para poder seguirlo.
async function empezarPrueba() {
  const contacto = estado.contactos.find((c) => c.id === prueba.contactoId);
  if (!contacto) return aviso("Elige primero un contacto.", "error");
  const { recorrido, horas } = simular(auto, contacto);
  const turno = Symbol("prueba"); // si se para o se repite, la animación anterior se detiene
  Object.assign(prueba, { visitados: new Set(), notas: new Map(), actual: null, pasos: [], corriendo: true, terminada: false, turno, horas });
  for (const paso of recorrido) {
    if (prueba?.turno !== turno) return;
    const destino = paso.nodo ?? null;
    if (destino) {
      prueba.visitados.add(destino);
      prueba.notas.set(destino, { texto: paso.nota, rama: paso.rama });
      prueba.actual = destino;
    }
    marcarHasta(paso);
    prueba.pasos.push(paso);
    pintarDiagrama();
    pintarPanel();
    raiz.querySelector(`[data-nodo="${destino}"], [data-fin="${paso.fin}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    await new Promise((r) => setTimeout(r, 650));
  }
  if (prueba?.turno !== turno) return;
  Object.assign(prueba, { corriendo: false, terminada: true, actual: null });
  pintarDiagrama();
  pintarPanel();
}

// Para iluminar también las líneas, marcamos el "+" (y la etiqueta de rama)
// que hay justo encima de cada caja visitada.
function marcarHasta(paso) {
  let clave;
  let indice;
  if (paso.fin) {
    clave = paso.fin;
    indice = listaPorClave(clave)?.length ?? 0;
    prueba.visitados.add(`fin:${clave}`);
  } else if (paso.nodo !== "disparador") {
    ({ clave, indice } = ubicar(auto.pasos, paso.nodo) ?? {});
  }
  if (clave == null) return;
  prueba.visitados.add(`mas:${clave}:${indice}`);
  if (indice === 0 && clave !== "raiz") prueba.visitados.add(`rama:${clave}`);
}

// En qué lista (clave) y en qué posición está un paso.
function ubicar(pasos, id, clave = "raiz") {
  for (let i = 0; i < pasos.length; i++) {
    if (pasos[i].id === id) return { clave, indice: i };
    if (pasos[i].tipo === "condicion") {
      const dentro = ubicar(pasos[i].si, id, `${pasos[i].id}-si`) ?? ubicar(pasos[i].no, id, `${pasos[i].id}-no`);
      if (dentro) return dentro;
    }
  }
  return null;
}

// La lista de pasos que corresponde a una clave ("raiz" o "<id>-si"/"<id>-no").
function listaPorClave(clave) {
  if (clave === "raiz") return auto.pasos;
  const corte = clave.lastIndexOf("-");
  return buscar(auto.pasos, clave.slice(0, corte))?.paso[clave.slice(corte + 1)];
}

function pararPrueba() {
  if (prueba) prueba.turno = null;
  prueba = null;
}

// ---------- Exportar y borrar ----------
function exportarJSON() {
  // Añadimos los nombres de emails y segmentos para que el archivo se entienda solo.
  const enriquecer = (pasos) => pasos.map((p) => {
    const copia = { ...p };
    if (p.tipo === "email") copia.email = { id: p.emailId, nombre: nombreEmail(p.emailId) ?? null, asunto: estado.emails.find((e) => e.id === p.emailId)?.asunto ?? null };
    if (p.tipo === "condicion") {
      if (p.criterio === "segmento") copia.segmento = nombreSegmento(p.segmentoId) ?? null;
      copia.si = enriquecer(p.si);
      copia.no = enriquecer(p.no);
    }
    return copia;
  });
  const datos = {
    app: "Embudo",
    tipo: "automatizacion",
    version: 1,
    exportado: new Date().toISOString(),
    nombre: auto.nombre,
    estado: auto.estado === "lista" ? "lista para conectar" : "borrador",
    disparador: { ...auto.disparador, descripcion: describirDisparador(auto.disparador), segmento: auto.disparador.tipo === "segmento" ? nombreSegmento(auto.disparador.segmentoId) ?? null : undefined },
    pasos: enriquecer(auto.pasos),
  };
  descargar(`automatizacion-${slug(auto.nombre, "-") || "sin-nombre"}.json`, JSON.stringify(datos, null, 2), "application/json");
  aviso("Automatización exportada en .json");
}

async function borrarAutomatizacion() {
  const ok = await confirmar({ titulo: "Borrar automatización", texto: `Se borrará «${auto.nombre}» con todos sus pasos.`, aceptar: "Borrar", peligro: true });
  if (!ok) return;
  await borrarDe("automatizaciones", [auto.id]);
  aviso("Automatización borrada");
  location.hash = "#/automatizaciones";
}
