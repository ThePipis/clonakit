// vistas.js — Pinta la pantalla a partir de los datos: barra lateral, canal, mensajes, hilo y búsqueda.
//
// Cada vez que algo cambia se vuelve a pintar todo desde cero. Es la forma más sencilla de que la
// pantalla nunca se quede desfasada y, con los mensajes de una demo, es instantáneo.

import * as D from "./datos.js";
import { ui, $, guardarSesion } from "./estado-ui.js";
import { escapar, formatearMensaje, quitarFormato, resaltar, normalizar, hora, fechaHora, etiquetaDia, claveDia, iniciales, listaNombres } from "./formato.js";
import { icono } from "./iconos.js";

const CINCO_MINUTOS = 5 * 60 * 1000;
export const DURACION_DESTELLO = 2000;
const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// ---------- Personas y avatares ----------

// Si la persona se borró, sus mensajes se quedan y se firman como "Persona eliminada".
export function autor(id) {
  return D.persona(id) ?? { id, nombre: "Persona eliminada", color: "#A2AAA6", eliminada: true };
}

export function htmlAvatar(persona, clase = "") {
  const letras = persona.eliminada ? "?" : iniciales(persona.nombre);
  return `<span class="avatar ${clase}" style="--color:${persona.color}" aria-hidden="true">${escapar(letras)}</span>`;
}

// ---------- Pintar todo ----------

// Si la persona o el canal de esta pestaña ya no existen (borrados en otra pestaña), elegimos otros.
export function asegurarSeleccion() {
  if (!D.persona(ui.persona)) {
    ui.persona = D.estado.personas[0].id;
    ui.lecturaPendiente = false;
  }
  if (!D.canal(ui.canal)) {
    ui.canal = (D.estado.canales.find((c) => !c.archivado) ?? D.estado.canales[0]).id;
    ui.corte = null;
    ui.desplazar = "inicio";
  }
  if (ui.panel?.tipo === "hilo" && !D.mensaje(ui.panel.id)) {
    ui.panel = ui.volverABusqueda ? { tipo: "busqueda" } : null;
  }
  if (ui.editando && !D.mensaje(ui.editando.id)) ui.editando = null;
  guardarSesion();
}

// Mirar un canal lo marca como leído... salvo justo después de cambiar de persona (hay que abrirlo).
function marcarLeidoSiProcede() {
  if (ui.lecturaPendiente || document.visibilityState === "hidden") return false;
  if (D.noLeidos(ui.canal, ui.persona) === 0) return false;
  D.marcarLeido(ui.persona, ui.canal); // guarda y provoca otra pintada completa
  return true;
}

export function renderTodo() {
  if (!D.estado) return;
  asegurarSeleccion();
  if (marcarLeidoSiProcede()) return;
  // Si estabas editando un mensaje, tras repintar devolvemos el cursor a la caja de edición.
  if (ui.editando && document.activeElement?.matches?.("[data-edicion]")) ui.editando.enfocar = true;
  renderLateral();
  renderCanal();
  renderPanel();
}

// ---------- Barra lateral ----------

function htmlCanalItem(c) {
  const sinLeer = c.archivado ? 0 : D.noLeidos(c.id, ui.persona);
  const activo = c.id === ui.canal;
  const clases = ["canal-item", activo && "activo", sinLeer && "no-leido", c.archivado && "archivado"].filter(Boolean).join(" ");
  return `<li><button type="button" class="${clases}" data-canal="${c.id}"${activo ? ' aria-current="page"' : ""}>
    <span class="almohadilla">#</span><span class="canal-item-nombre">${escapar(c.nombre)}</span>
    ${sinLeer ? `<span class="contador" title="${plural(sinLeer, "mensaje sin leer", "mensajes sin leer")}">${sinLeer}</span>` : ""}
  </button></li>`;
}

function renderLateral() {
  const yo = autor(ui.persona);
  $("persona-avatar").innerHTML = htmlAvatar(yo);
  $("persona-nombre").textContent = yo.nombre;

  const canales = [...D.estado.canales].sort(porNombre);
  const activos = canales.filter((c) => !c.archivado);
  const archivados = canales.filter((c) => c.archivado);
  $("lista-canales").innerHTML = activos.length
    ? activos.map(htmlCanalItem).join("")
    : '<li class="lateral-vacio">No hay canales activos.</li>';
  $("zona-archivados").innerHTML = archivados.length
    ? `<button type="button" class="archivados-toggle" data-accion="ver-archivados" aria-expanded="${ui.verArchivados}">
        ${icono(ui.verArchivados ? "abajo" : "derecha")}<span>Archivados (${archivados.length})</span>
      </button>
      ${ui.verArchivados ? `<ul class="lista-canales archivados">${archivados.map(htmlCanalItem).join("")}</ul>` : ""}`
    : "";

  $("lista-equipo").innerHTML = D.estado.personas
    .map((p) => {
      const actual = p.id === ui.persona;
      return `<li><button type="button" class="persona-item${actual ? " actual" : ""}" data-persona="${p.id}" title="${actual ? "Estás escribiendo como" : "Escribir como"} ${escapar(p.nombre)}">
        ${htmlAvatar(p, "mini")}<span class="persona-item-nombre">${escapar(p.nombre)}</span>${actual ? '<span class="insignia-tu">tú</span>' : ""}
      </button></li>`;
    })
    .join("");

  $("menu-personas").innerHTML = `
    <p class="menu-titulo">¿Con quién escribes?</p>
    ${D.estado.personas
      .map((p) => `<button type="button" class="menu-opcion" role="option" data-persona="${p.id}" aria-selected="${p.id === ui.persona}">
        ${htmlAvatar(p, "mini")}<span>${escapar(p.nombre)}</span>${p.id === ui.persona ? icono("check", "marca") : ""}
      </button>`)
      .join("")}
    <hr>
    <button type="button" class="menu-opcion" data-accion="gestionar-equipo">${icono("equipo")}<span>Gestionar el equipo</span></button>`;
}

// ---------- Canal ----------

function renderCanal() {
  const c = D.canal(ui.canal);
  $("canal-nombre").innerHTML = `<span class="almohadilla">#</span>${escapar(c.nombre)}`;
  $("canal-descripcion").textContent = c.descripcion || "Sin descripción";
  $("aviso-archivado").hidden = !c.archivado;
  $("btn-archivar-canal").hidden = c.archivado;
  const pendientes = D.estado.canales.filter((x) => !x.archivado).reduce((suma, x) => suma + D.noLeidos(x.id, ui.persona), 0);
  document.title = `${pendientes ? `(${pendientes}) ` : ""}#${c.nombre} · Corrillo`;
  prepararCompositor("canal", { activo: !c.archivado, pista: c.archivado ? "Este canal está archivado" : `Mensaje en #${c.nombre}` });

  const lista = $("lista-mensajes");
  const mensajes = D.mensajesDelCanal(c.id);
  const estabaAbajo = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
  const posicion = lista.scrollTop;
  lista.innerHTML = htmlIntroCanal(c, mensajes.length) + htmlMensajes(mensajes, { donde: "canal", soloLectura: c.archivado, corte: ui.corte });

  // Al abrir un canal vamos a la línea "Nuevos" (si la hay) o al final; si no, respetamos dónde estabas.
  if (ui.desplazar === "inicio") {
    const nuevos = lista.querySelector(".separador-nuevos");
    lista.scrollTop = nuevos ? nuevos.offsetTop - lista.clientHeight / 3 : lista.scrollHeight;
  } else if (ui.desplazar === "final" || estabaAbajo) {
    lista.scrollTop = lista.scrollHeight;
  } else {
    lista.scrollTop = posicion;
  }
  ui.desplazar = null;
  enfocarEdicion("canal");
}

function htmlIntroCanal(c, cuantos) {
  return `<div class="intro-canal">
    <div class="intro-icono" aria-hidden="true">#</div>
    <h2>Este es el principio de #${escapar(c.nombre)}</h2>
    <p>${c.descripcion ? escapar(c.descripcion) : "Este canal todavía no tiene descripción."}</p>
    ${cuantos === 0 && !c.archivado ? '<p class="intro-pista">Escribe el primer mensaje abajo. Prueba con <code>*negrita*</code>, <code>_cursiva_</code> o pega una dirección web.</p>' : ""}
  </div>`;
}

// Lista de mensajes con separadores de día, línea "Nuevos" y agrupación de mensajes seguidos.
// diaPrevio: en un hilo, la fecha del mensaje original (así no se repite "Hoy" si la respuesta es del mismo día).
function htmlMensajes(mensajes, opciones) {
  let html = "";
  let anterior = null;
  let diaPrevio = opciones.diaPrevio ? claveDia(opciones.diaPrevio) : null;
  let lineaNuevosPuesta = false;
  for (const m of mensajes) {
    const otroDia = diaPrevio !== claveDia(m.fecha);
    if (otroDia) html += `<div class="separador-dia" role="separator"><span>${etiquetaDia(m.fecha)}</span></div>`;
    diaPrevio = claveDia(m.fecha);
    let trasLinea = false;
    if (opciones.corte != null && !lineaNuevosPuesta && m.fecha > opciones.corte && m.autor !== ui.persona) {
      html += '<div class="separador-nuevos" role="separator"><span>Nuevos</span></div>';
      lineaNuevosPuesta = trasLinea = true;
    }
    // Misma persona, mismo día y menos de 5 minutos: se agrupa sin repetir avatar ni nombre.
    const compacto = Boolean(anterior) && !otroDia && !trasLinea && anterior.autor === m.autor && m.fecha - anterior.fecha < CINCO_MINUTOS;
    html += htmlMensaje(m, { ...opciones, compacto });
    anterior = m;
  }
  return html;
}

function htmlMensaje(m, { compacto = false, donde = "canal", soloLectura = false } = {}) {
  const persona = autor(m.autor);
  const mio = m.autor === ui.persona;
  const enHilo = donde === "hilo";
  const editando = ui.editando?.id === m.id && ui.editando.donde === donde;
  // El destello dura 2 s aunque se repinte a mitad: retrasamos la animación lo que ya lleve.
  const transcurrido = ui.destello?.id === m.id ? Date.now() - ui.destello.desde : Infinity;
  const brilla = transcurrido < DURACION_DESTELLO;
  const clases = ["mensaje", compacto && "compacto", mio && "mio", brilla && "destello", editando && "editando"].filter(Boolean).join(" ");
  const iso = new Date(m.fecha).toISOString();
  return `<article class="${clases}" data-id="${m.id}" tabindex="-1"${brilla ? ` style="animation-delay:-${transcurrido}ms"` : ""}>
    <div class="mensaje-lado">
      ${compacto ? `<time class="hora-lado" datetime="${iso}" title="${fechaHora(m.fecha)}">${hora(m.fecha)}</time>` : htmlAvatar(persona)}
    </div>
    <div class="mensaje-cuerpo">
      ${compacto ? "" : `<div class="mensaje-cabecera">
        <strong class="mensaje-autor${persona.eliminada ? " eliminada" : ""}">${escapar(persona.nombre)}</strong>
        <time datetime="${iso}" title="${fechaHora(m.fecha)}">${hora(m.fecha)}</time>
      </div>`}
      ${editando ? htmlEdicion() : `<div class="mensaje-texto">${formatearMensaje(m.texto)}${m.editado ? ' <span class="editado">(editado)</span>' : ""}</div>`}
      ${htmlReacciones(m, soloLectura)}
      ${enHilo ? "" : htmlResumenHilo(m)}
    </div>
    ${soloLectura || editando ? "" : htmlAcciones(mio, enHilo)}
  </article>`;
}

function htmlEdicion() {
  return `<div class="edicion">
    <textarea class="edicion-texto" data-edicion rows="1" maxlength="4000" aria-label="Editar mensaje">${escapar(ui.editando.texto)}</textarea>
    <div class="edicion-pie">
      <span class="edicion-ayuda"><kbd>Intro</kbd> guarda · <kbd>Esc</kbd> cancela</span>
      <button type="button" class="boton secundario pequeno" data-accion="cancelar-edicion">Cancelar</button>
      <button type="button" class="boton primario pequeno" data-accion="guardar-edicion">Guardar</button>
    </div>
  </div>`;
}

// Reacciones: un botón por emoji con su contador; el title dice quién ha reaccionado.
function htmlReacciones(m, soloLectura) {
  const entradas = Object.entries(m.reacciones);
  if (!entradas.length) return "";
  const botones = entradas
    .map(([emoji, ids]) => {
      const mia = ids.includes(ui.persona);
      const quienes = listaNombres(ids.map((id) => autor(id).nombre));
      const titulo = `${quienes} ${ids.length === 1 ? "reaccionó" : "reaccionaron"} con ${emoji}`;
      return `<button type="button" class="reaccion${mia ? " mia" : ""}" data-accion="reaccion" data-emoji="${escapar(emoji)}" title="${escapar(titulo)}" aria-pressed="${mia}"${soloLectura ? " disabled" : ""}>
        <span class="reaccion-emoji">${escapar(emoji)}</span><span class="reaccion-num">${ids.length}</span>
      </button>`;
    })
    .join("");
  const anadir = soloLectura ? "" : `<button type="button" class="reaccion reaccion-nueva" data-accion="reaccionar" title="Añadir reacción" aria-label="Añadir reacción">${icono("emoji")}</button>`;
  return `<div class="reacciones">${botones}${anadir}</div>`;
}

// Bajo el mensaje original: iniciales de quien ha respondido y número de respuestas.
function htmlResumenHilo(m) {
  const respuestas = D.respuestas(m.id);
  if (!respuestas.length) return "";
  const quienes = [...new Set(respuestas.map((r) => r.autor))].slice(0, 4);
  const ultima = respuestas[respuestas.length - 1].fecha;
  return `<button type="button" class="resumen-hilo" data-accion="hilo">
    <span class="mini-avatares">${quienes.map((id) => htmlAvatar(autor(id), "diminuto")).join("")}</span>
    <span class="resumen-num">${plural(respuestas.length, "respuesta", "respuestas")}</span>
    <span class="resumen-ultima">Última: ${etiquetaDia(ultima).toLowerCase()} a las ${hora(ultima)}</span>
    <span class="resumen-ver">Ver hilo ${icono("derecha")}</span>
  </button>`;
}

// Barra de acciones que aparece al pasar el puntero (o al tocar el mensaje en el móvil).
function htmlAcciones(mio, enHilo) {
  return `<div class="acciones" role="toolbar" aria-label="Acciones del mensaje">
    <button type="button" data-accion="reaccionar" title="Reaccionar" aria-label="Reaccionar">${icono("emoji")}</button>
    ${enHilo ? "" : `<button type="button" data-accion="hilo" title="Responder en hilo" aria-label="Responder en hilo">${icono("hilo")}</button>`}
    ${mio ? `<button type="button" data-accion="editar" title="Editar" aria-label="Editar">${icono("editar")}</button>
    <button type="button" class="peligro" data-accion="borrar" title="Borrar" aria-label="Borrar">${icono("borrar")}</button>` : ""}
  </div>`;
}

// ---------- Panel derecho: hilo o búsqueda ----------

function renderPanel() {
  const abierto = Boolean(ui.panel);
  $("panel").hidden = !abierto;
  $("cuerpo").classList.toggle("con-panel", abierto);
  if (!abierto) return;
  if (ui.panel.tipo === "hilo") renderHilo();
  else renderBusqueda();
}

// Repinta el contenido del panel. desplazar: "final", "arriba" o null (te deja donde estabas;
// si estabas abajo del todo, sigues abajo para ver lo que llega).
function pintarCuerpoPanel(html, desplazar) {
  const cuerpo = $("panel-cuerpo");
  const estabaAbajo = cuerpo.scrollHeight - cuerpo.scrollTop - cuerpo.clientHeight < 80;
  const posicion = cuerpo.scrollTop;
  cuerpo.innerHTML = html;
  if (desplazar === "arriba") cuerpo.scrollTop = 0;
  else if (desplazar === "final" || estabaAbajo) cuerpo.scrollTop = cuerpo.scrollHeight;
  else cuerpo.scrollTop = posicion;
  ui.desplazarPanel = null;
}

function renderHilo() {
  const original = D.mensaje(ui.panel.id);
  const c = D.canal(original.canal);
  const respuestas = D.respuestas(original.id);
  $("panel").dataset.tipo = "hilo";
  $("panel-titulo").textContent = "Hilo";
  $("panel-subtitulo").innerHTML = `en <span class="almohadilla">#</span>${escapar(c.nombre)}`;
  $("btn-panel-volver").hidden = !ui.volverABusqueda;
  $("panel-filtros").hidden = true;
  $("compositor-hilo").hidden = false;
  prepararCompositor("hilo", { activo: !c.archivado, pista: c.archivado ? "Este canal está archivado" : "Responder en el hilo…" });
  pintarCuerpoPanel(
    `<div class="hilo-original">${htmlMensaje(original, { donde: "hilo", soloLectura: c.archivado })}</div>
    <div class="separador-respuestas" role="separator"><span>${respuestas.length ? plural(respuestas.length, "respuesta", "respuestas") : "Todavía no hay respuestas"}</span></div>
    ${htmlMensajes(respuestas, { donde: "hilo", soloLectura: c.archivado, corte: null, diaPrevio: original.fecha })}`,
    ui.desplazarPanel,
  );
  enfocarEdicion("hilo");
}

// Busca en todos los canales e hilos, sin distinguir mayúsculas ni tildes. Lo más nuevo, primero.
export function resultadosBusqueda() {
  const consulta = normalizar(ui.busqueda.texto.trim());
  if (!consulta) return [];
  return D.estado.mensajes
    .filter((m) => normalizar(m.texto).includes(consulta))
    .filter((m) => !ui.busqueda.canal || m.canal === ui.busqueda.canal)
    .filter((m) => !ui.busqueda.persona || m.autor === ui.busqueda.persona)
    .sort((a, b) => b.fecha - a.fecha);
}

function renderBusqueda() {
  const resultados = resultadosBusqueda();
  $("panel").dataset.tipo = "busqueda";
  $("panel-titulo").textContent = "Búsqueda";
  $("panel-subtitulo").textContent = `«${ui.busqueda.texto}» · ${plural(resultados.length, "resultado", "resultados")}`;
  $("btn-panel-volver").hidden = true;
  $("panel-filtros").hidden = false;
  $("compositor-hilo").hidden = true;
  rellenarFiltros();
  const conFiltros = ui.busqueda.canal || ui.busqueda.persona;
  pintarCuerpoPanel(
    resultados.length
      ? `<ul class="resultados">${resultados.map(htmlResultado).join("")}</ul>`
      : `<div class="sin-resultados">${icono("buscar")}
          <p>No hay mensajes con «${escapar(ui.busqueda.texto)}»${conFiltros ? " con estos filtros" : ""}.</p>
          <p class="pista">La búsqueda no distingue mayúsculas ni tildes.</p>
        </div>`,
    ui.desplazarPanel,
  );
}

function rellenarFiltros() {
  const filtroCanal = $("filtro-canal");
  const filtroPersona = $("filtro-persona");
  filtroCanal.innerHTML = '<option value="">Todos los canales</option>' + [...D.estado.canales].sort(porNombre)
    .map((c) => `<option value="${c.id}">#${escapar(c.nombre)}${c.archivado ? " (archivado)" : ""}</option>`).join("");
  filtroPersona.innerHTML = '<option value="">Todas las personas</option>' + D.estado.personas
    .map((p) => `<option value="${p.id}">${escapar(p.nombre)}</option>`).join("");
  // Si el filtro elegido ya no existe (canal o persona borrados), volvemos a "todos".
  filtroCanal.value = ui.busqueda.canal;
  if (filtroCanal.value !== ui.busqueda.canal) ui.busqueda.canal = filtroCanal.value = "";
  filtroPersona.value = ui.busqueda.persona;
  if (filtroPersona.value !== ui.busqueda.persona) ui.busqueda.persona = filtroPersona.value = "";
}

function htmlResultado(m) {
  const persona = autor(m.autor);
  const c = D.canal(m.canal);
  return `<li><button type="button" class="resultado" data-ir="${m.id}">
    ${htmlAvatar(persona, "mini")}
    <span class="resultado-contenido">
      <span class="resultado-meta">
        <strong>${escapar(persona.nombre)}</strong>
        <span class="resultado-canal">#${escapar(c.nombre)}${m.padre ? " · en un hilo" : ""}</span>
        <time datetime="${new Date(m.fecha).toISOString()}">${fechaHora(m.fecha)}</time>
      </span>
      <span class="resultado-texto">${resaltar(quitarFormato(m.texto), ui.busqueda.texto, 220)}</span>
    </span>
  </button></li>`;
}

// ---------- Cuadro de escribir ----------

export function htmlCompositor(destino) {
  return `<form class="compositor" id="compositor-${destino}" data-destino="${destino}" autocomplete="off">
    <div class="compositor-caja">
      <textarea id="texto-${destino}" rows="1" maxlength="4000" aria-label="${destino === "hilo" ? "Responder en el hilo" : "Escribir un mensaje"}"></textarea>
      <div class="compositor-barra">
        <button type="button" class="boton-formato" data-formato="negrita" title="Negrita: *texto*" aria-label="Negrita">${icono("negrita")}</button>
        <button type="button" class="boton-formato" data-formato="cursiva" title="Cursiva: _texto_" aria-label="Cursiva">${icono("cursiva")}</button>
        <button type="button" class="boton-formato" data-formato="enlace" title="Insertar enlace" aria-label="Insertar enlace">${icono("enlace")}</button>
        <span class="barra-separador" aria-hidden="true"></span>
        <button type="button" class="boton-formato" data-formato="emoji" title="Emojis" aria-label="Emojis">${icono("emoji")}</button>
        <button type="submit" class="boton-enviar" title="Enviar (Intro)" aria-label="Enviar" disabled>${icono("enviar")}</button>
      </div>
    </div>
    <p class="compositor-ayuda">
      <span>Escribes como <strong data-yo></strong></span>
      <span class="atajos"><kbd>Intro</kbd> envía · <kbd>Mayús</kbd>+<kbd>Intro</kbd> nueva línea</span>
    </p>
  </form>`;
}

function prepararCompositor(destino, { activo, pista }) {
  const formulario = $(`compositor-${destino}`);
  const texto = $(`texto-${destino}`);
  texto.disabled = !activo;
  texto.placeholder = pista;
  formulario.classList.toggle("desactivado", !activo);
  formulario.querySelector("[data-yo]").textContent = autor(ui.persona).nombre;
  formulario.querySelectorAll(".boton-formato").forEach((b) => (b.disabled = !activo));
  actualizarBotonEnviar(destino);
}

export function actualizarBotonEnviar(destino) {
  const texto = $(`texto-${destino}`);
  $(`compositor-${destino}`).querySelector(".boton-enviar").disabled = texto.disabled || !texto.value.trim();
}

// La caja de texto crece con lo que escribes (hasta un máximo) en vez de mostrar una barra de desplazamiento.
export function ajustarAltura(caja) {
  caja.style.height = "auto";
  caja.style.height = `${Math.min(caja.scrollHeight, 200)}px`;
}

function enfocarEdicion(donde) {
  if (!ui.editando?.enfocar || ui.editando.donde !== donde) return;
  const caja = $(donde === "hilo" ? "panel-cuerpo" : "lista-mensajes").querySelector("[data-edicion]");
  if (!caja) return;
  ui.editando.enfocar = false;
  ajustarAltura(caja);
  caja.focus({ preventScroll: true });
  caja.setSelectionRange(caja.value.length, caja.value.length);
}
