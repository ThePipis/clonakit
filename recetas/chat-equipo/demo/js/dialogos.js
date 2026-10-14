// dialogos.js — Las ventanas de Corrillo: bienvenida, modo demo, crear o editar canal,
// gestionar el equipo, ajustes (exportar, importar, borrar) e insertar enlace.
// Usamos <dialog>, que ya trae de serie el fondo oscuro, cerrar con Esc y mantener el foco dentro.

import * as D from "./datos.js";
import { crearEjemplo, crearVacio } from "./ejemplo.js";
import { ui, $, guardarSesion, olvidarSesion } from "./estado-ui.js";
import { aviso, confirmar } from "./avisos.js";
import { abrirCanal, archivarCanal } from "./acciones.js";
import { escapar, normalizar } from "./formato.js";
import { htmlAvatar } from "./vistas.js";
import { icono } from "./iconos.js";

function abrir(id) {
  const dialogo = $(id);
  if (!dialogo.open) dialogo.showModal();
}

function cerrar(id) {
  const dialogo = $(id);
  if (dialogo.open) dialogo.close();
}

function mostrarError(id, texto) {
  const parrafo = $(id);
  parrafo.textContent = texto;
  parrafo.hidden = !texto;
}

export function iniciarDialogos() {
  // Los botones con data-cerrar y el clic en el fondo oscuro cierran la ventana (salvo la bienvenida).
  document.querySelectorAll("dialog.dialogo").forEach((dialogo) => {
    dialogo.addEventListener("click", (evento) => {
      if (evento.target.closest("[data-cerrar]")) dialogo.close();
      else if (evento.target === dialogo && dialogo.id !== "dlg-bienvenida") dialogo.close();
    });
  });
  iniciarBienvenida();
  iniciarCanal();
  iniciarEquipo();
  iniciarAjustes();
  iniciarEnlace();
}

// Cuando cambian los datos, las ventanas abiertas que los muestran se ponen al día.
export function refrescarDialogos() {
  if ($("dlg-equipo").open) renderEquipo();
  if ($("dlg-ajustes").open) renderResumenDatos();
}

// ---------- Bienvenida (primera visita) ----------

function iniciarBienvenida() {
  const dialogo = $("dlg-bienvenida");
  dialogo.addEventListener("cancel", (evento) => evento.preventDefault()); // hay que elegir una opción
  // Por si el navegador la cierra igualmente (pulsando Esc varias veces): sin datos, vuelve a salir.
  dialogo.addEventListener("close", () => {
    if (!D.estado) setTimeout(mostrarBienvenida, 0);
  });
  $("btn-empezar-ejemplo").addEventListener("click", () => empezar(crearEjemplo(), "p-ana", "c-ventas", "Ejemplo cargado: ahora eres Ana"));
  $("btn-empezar-vacio").addEventListener("click", () => empezar(crearVacio(), "p-tu", "c-avisos", "¡Listo! Crea tu equipo y tus canales"));
}

function empezar(datos, persona, canal, mensaje) {
  ui.persona = persona;
  ui.canal = canal;
  ui.panel = null;
  ui.editando = null;
  guardarSesion();
  D.reemplazar(datos);
  cerrar("dlg-bienvenida");
  abrirCanal(canal);
  aviso(mensaje);
}

export function mostrarBienvenida() {
  olvidarSesion();
  document.querySelectorAll("dialog[open]").forEach((d) => d.id !== "dlg-bienvenida" && d.close());
  abrir("dlg-bienvenida");
}

export const cerrarBienvenida = () => cerrar("dlg-bienvenida");

export const abrirInfoDemo = () => abrir("dlg-demo");

// ---------- Crear o editar canal ----------

let canalEditando = null; // null = estamos creando uno nuevo

export function abrirDialogoCanal(modo) {
  const c = modo === "editar" ? D.canal(ui.canal) : null;
  canalEditando = c?.id ?? null;
  $("dlg-canal-titulo").textContent = c ? "Editar canal" : "Crear canal";
  $("btn-canal-guardar").textContent = c ? "Guardar cambios" : "Crear canal";
  $("canal-campo-nombre").value = c?.nombre ?? "";
  $("canal-campo-descripcion").value = c?.descripcion ?? "";
  $("btn-dlg-archivar").hidden = !c;
  $("btn-dlg-archivar").textContent = c?.archivado ? "Desarchivar" : "Archivar canal";
  mostrarError("canal-error", "");
  actualizarAyudaNombre();
  abrir("dlg-canal");
  $("canal-campo-nombre").focus();
}

// Mientras escribes el nombre, te enseñamos cómo quedará (#pedidos-web).
function actualizarAyudaNombre() {
  const escrito = $("canal-campo-nombre").value.trim();
  const limpio = D.nombreCanalLimpio(escrito);
  $("canal-ayuda-nombre").innerHTML = limpio && limpio !== escrito
    ? `Se guardará como <strong>#${escapar(limpio)}</strong>`
    : "En minúsculas y sin espacios. Por ejemplo: pedidos-web.";
}

function iniciarCanal() {
  $("canal-campo-nombre").addEventListener("input", actualizarAyudaNombre);
  $("form-canal").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nombre = D.nombreCanalLimpio($("canal-campo-nombre").value);
    const descripcion = $("canal-campo-descripcion").value.trim();
    if (!nombre) return mostrarError("canal-error", "Ponle un nombre al canal.");
    if (D.estado.canales.some((c) => c.nombre === nombre && c.id !== canalEditando)) {
      return mostrarError("canal-error", `Ya existe un canal llamado #${nombre}.`);
    }
    cerrar("dlg-canal");
    if (canalEditando) {
      D.editarCanal(canalEditando, { nombre, descripcion });
      aviso("Canal actualizado");
    } else {
      const nuevo = D.crearCanal(nombre, descripcion);
      abrirCanal(nuevo.id);
      aviso(`Canal #${nombre} creado`);
    }
  });
  $("btn-dlg-archivar").addEventListener("click", () => {
    const c = D.canal(canalEditando);
    cerrar("dlg-canal");
    if (c) archivarCanal(c.id, !c.archivado);
  });
}

// ---------- Gestionar el equipo ----------

let personaEditando = null;

export function abrirEquipo() {
  personaEditando = null;
  prepararNueva();
  renderEquipo();
  abrir("dlg-equipo");
}

function htmlPaleta(grupo, elegido) {
  return D.PALETA.map(({ nombre, color }) => `<label class="muestra" style="--color:${color}" title="${nombre}">
    <input type="radio" name="${grupo}" value="${color}"${color === elegido ? " checked" : ""} aria-label="${nombre}"><span></span>
  </label>`).join("");
}

// Para cada persona nueva proponemos un color que nadie use todavía.
function siguienteColor() {
  const usados = new Set(D.estado.personas.map((p) => p.color));
  return (D.PALETA.find((x) => !usados.has(x.color)) ?? D.PALETA[D.estado.personas.length % D.PALETA.length]).color;
}

function prepararNueva() {
  $("nueva-nombre").value = "";
  $("nueva-paleta").innerHTML = htmlPaleta("color-nueva", siguienteColor());
  mostrarError("nueva-error", "");
  previaNueva();
}

function previaNueva() {
  const color = document.querySelector('input[name="color-nueva"]:checked')?.value ?? D.PALETA[0].color;
  $("nueva-previa").innerHTML = htmlAvatar({ nombre: $("nueva-nombre").value.trim() || "?", color });
}

// Comprueba el nombre: que no esté vacío ni repetido (sin mirar mayúsculas ni tildes).
function errorNombre(nombre, idPropio = null) {
  if (!nombre) return "Escribe un nombre.";
  if (D.estado.personas.some((p) => p.id !== idPropio && normalizar(p.nombre) === normalizar(nombre))) {
    return `Ya hay alguien llamado ${nombre} en el equipo.`;
  }
  return "";
}

function renderEquipo() {
  const solo = D.estado.personas.length === 1;
  $("equipo-lista").innerHTML = D.estado.personas
    .map((p) => {
      const nombre = escapar(p.nombre);
      if (p.id === personaEditando) {
        return `<li class="equipo-fila editando"><form class="equipo-edicion" data-editar="${p.id}">
          <span class="equipo-previa">${htmlAvatar(p)}</span>
          <input class="campo-texto" name="nombre" value="${nombre}" maxlength="30" aria-label="Nombre" autocomplete="off">
          <div class="paleta" role="radiogroup" aria-label="Color">${htmlPaleta("color-editar", p.color)}</div>
          <p class="campo-error" role="alert" hidden></p>
          <div class="equipo-botones">
            <button type="button" class="boton secundario pequeno" data-equipo="cancelar">Cancelar</button>
            <button type="submit" class="boton primario pequeno">Guardar</button>
          </div>
        </form></li>`;
      }
      const escritos = D.estado.mensajes.filter((m) => m.autor === p.id).length;
      return `<li class="equipo-fila">
        ${htmlAvatar(p)}
        <span class="equipo-nombre">${nombre}${p.id === ui.persona ? ' <span class="insignia-tu">tú</span>' : ""}
          <small>${escritos === 1 ? "1 mensaje" : `${escritos} mensajes`}</small></span>
        <button type="button" class="boton-icono claro" data-equipo="editar" data-id="${p.id}" title="Editar a ${nombre}" aria-label="Editar a ${nombre}">${icono("editar")}</button>
        <button type="button" class="boton-icono claro peligro" data-equipo="borrar" data-id="${p.id}" aria-label="Borrar a ${nombre}"
          title="${solo ? "Tiene que quedar al menos una persona" : `Borrar a ${nombre}`}"${solo ? " disabled" : ""}>${icono("borrar")}</button>
      </li>`;
    })
    .join("");
}

async function borrarPersona(id) {
  const p = D.persona(id);
  if (!p || D.estado.personas.length === 1) return;
  const confirmado = await confirmar({
    titulo: `¿Borrar a ${p.nombre}?`,
    texto: "Sus mensajes se quedarán en los canales, firmados como «Persona eliminada». No se puede deshacer.",
    boton: "Borrar persona",
  });
  if (!confirmado) return;
  // Si borras a la persona con la que escribes, pasas a escribir como otra.
  if (id === ui.persona) {
    ui.persona = D.estado.personas.find((x) => x.id !== id).id;
    guardarSesion();
  }
  D.borrarPersona(id);
  aviso(`${p.nombre} ya no está en el equipo`);
}

function iniciarEquipo() {
  $("nueva-nombre").addEventListener("input", previaNueva);
  $("nueva-paleta").addEventListener("change", previaNueva);
  $("form-persona-nueva").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nombre = $("nueva-nombre").value.trim();
    const error = errorNombre(nombre);
    if (error) return mostrarError("nueva-error", error);
    const color = document.querySelector('input[name="color-nueva"]:checked')?.value ?? siguienteColor();
    D.crearPersona(nombre, color);
    aviso(`${nombre} se ha unido al equipo`);
    prepararNueva();
    $("nueva-nombre").focus();
  });

  const lista = $("equipo-lista");
  lista.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-equipo]");
    if (!boton) return;
    const accion = boton.dataset.equipo;
    if (accion === "editar") {
      personaEditando = boton.dataset.id;
      renderEquipo();
      lista.querySelector('input[name="nombre"]')?.select();
    } else if (accion === "cancelar") {
      personaEditando = null;
      renderEquipo();
    } else if (accion === "borrar") {
      borrarPersona(boton.dataset.id);
    }
  });
  // Vista previa del avatar mientras editas nombre o color.
  lista.addEventListener("input", (evento) => {
    const formulario = evento.target.closest("form[data-editar]");
    if (!formulario) return;
    const color = formulario.querySelector('input[name="color-editar"]:checked').value;
    formulario.querySelector(".equipo-previa").innerHTML = htmlAvatar({ nombre: formulario.elements.nombre.value.trim() || "?", color });
  });
  lista.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const formulario = evento.target;
    const id = formulario.dataset.editar;
    const nombre = formulario.elements.nombre.value.trim();
    const error = errorNombre(nombre, id);
    if (error) {
      const parrafo = formulario.querySelector(".campo-error");
      parrafo.textContent = error;
      parrafo.hidden = false;
      return;
    }
    personaEditando = null;
    D.editarPersona(id, { nombre, color: formulario.querySelector('input[name="color-editar"]:checked').value });
    aviso("Cambios guardados");
  });
}

// ---------- Ajustes y datos ----------

export function abrirAjustes() {
  renderResumenDatos();
  abrir("dlg-ajustes");
}

function renderResumenDatos() {
  const { personas, canales, mensajes } = D.estado;
  const dato = (n, uno, varios) => `<span><strong>${n}</strong> ${n === 1 ? uno : varios}</span>`;
  $("resumen-datos").innerHTML = dato(personas.length, "persona", "personas") + dato(canales.length, "canal", "canales") + dato(mensajes.length, "mensaje", "mensajes");
}

function iniciarAjustes() {
  // Exportar: creamos un archivo en memoria (Blob) y simulamos un clic en un enlace de descarga.
  $("btn-exportar").addEventListener("click", () => {
    const archivo = new Blob([D.exportar()], { type: "application/json" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `corrillo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    aviso("Copia descargada");
  });

  $("archivo-importar").addEventListener("change", async (evento) => {
    const archivo = evento.target.files[0];
    evento.target.value = ""; // así se puede volver a elegir el mismo archivo
    if (!archivo) return;
    let datos;
    try {
      datos = D.validar(JSON.parse(await archivo.text()));
    } catch (error) {
      aviso(error instanceof SyntaxError ? "Ese archivo no es un JSON válido." : error.message, "error");
      return;
    }
    const confirmado = await confirmar({
      titulo: "¿Importar este archivo?",
      texto: `Sustituirá todo lo que hay ahora en la demo por ${datos.personas.length} personas, ${datos.canales.length} canales y ${datos.mensajes.length} mensajes.`,
      boton: "Importar",
    });
    if (!confirmado) return;
    D.reemplazar(datos);
    cerrar("dlg-ajustes");
    abrirCanal(ui.canal); // vistas.js ya ha elegido un canal y una persona válidos
    aviso("Datos importados");
  });

  $("btn-borrar-demo").addEventListener("click", async () => {
    const confirmado = await confirmar({
      titulo: "¿Borrar la demo?",
      texto: "Se eliminarán todas las personas, canales y mensajes de este navegador (también en las otras pestañas abiertas). Si quieres conservarlos, exporta antes una copia.",
      boton: "Borrar todo",
    });
    if (!confirmado) return;
    cerrar("dlg-ajustes");
    D.borrarTodo(); // app.js lo detecta y vuelve a enseñar la bienvenida
  });
}

// ---------- Insertar enlace ----------

let resolverEnlace = null;

// Devuelve una promesa con la dirección escrita (o null si se cancela).
export function pedirEnlace(inicial = "") {
  $("enlace-url").value = inicial;
  mostrarError("enlace-error", "");
  abrir("dlg-enlace");
  $("enlace-url").focus();
  $("enlace-url").select();
  return new Promise((resolver) => {
    resolverEnlace = resolver;
  });
}

function iniciarEnlace() {
  $("form-enlace").addEventListener("submit", (evento) => {
    evento.preventDefault();
    let url = $("enlace-url").value.trim();
    if (!url) return mostrarError("enlace-error", "Escribe una dirección web.");
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (/\s/.test(url) || !/^https?:\/\/[^/\s]+\.[^/\s]{2,}/i.test(url)) {
      return mostrarError("enlace-error", "No parece una dirección web. Ejemplo: https://ejemplo.com");
    }
    const resolver = resolverEnlace;
    resolverEnlace = null;
    cerrar("dlg-enlace");
    resolver?.(url);
  });
  $("dlg-enlace").addEventListener("close", () => {
    const resolver = resolverEnlace;
    resolverEnlace = null;
    resolver?.(null);
  });
}
