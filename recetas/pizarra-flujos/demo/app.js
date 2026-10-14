// Trazo: pizarra web para dibujar diagramas de flujo con aspecto de boceto a mano.
//
// Este archivo arranca la app y traduce lo que hace la persona (ratón, trackpad,
// dedos y teclado) en cambios del dibujo. El resto vive en la carpeta js/:
//   estado.js        lo que la app recuerda (elementos, selección, cámara...)
//   trazo-a-mano.js  el aspecto de boceto (líneas irregulares que no tiemblan)
//   geometria.js     dónde está cada cosa y dónde se enganchan las flechas
//   lienzo.js        dibujar en el <canvas>
//   acciones.js      duplicar, borrar, deshacer, zoom, abrir, guardar...
//   editor-texto.js  escribir dentro de formas y flechas
//   exportar.js      PNG, SVG y portapapeles
//   archivos.js      guardado automático y archivos .json
//   historial.js     deshacer y rehacer
//   interfaz.js      paneles y botones
//   avisos.js        mensajes y preguntas

import { estado, alCambiar, cambio, aMundo, aPantalla, buscar, seleccionados, crearElemento } from "./js/estado.js";
import { HERRAMIENTAS, FORMAS, ALTO_LINEA, TAMANO_TEXTO } from "./js/constantes.js";
import { elementoEn, formaEn, limites, limitesDe, normalizar, recalcularFlechas, tiradoresPara, ajustarAlTexto } from "./js/geometria.js";
import { iniciarHistorial, ultimoConfirmado } from "./js/historial.js";
import { cargarDelNavegador, guardarEnNavegador, empaquetar, leerDibujo } from "./js/archivos.js";
import { EJEMPLO } from "./js/ejemplo.js";
import { ajustarTamano, dibujarPantalla } from "./js/lienzo.js";
import { editarTexto, terminarEdicion, colocarEditor } from "./js/editor-texto.js";
import { prepararInterfaz, actualizarInterfaz, menuAbierto, cerrarMenu } from "./js/interfaz.js";
import { avisar } from "./js/avisos.js";
import * as acciones from "./js/acciones.js";

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

// ---------------------------------------------------------------------------
// Redibujar y guardar
// ---------------------------------------------------------------------------

// Muchos cambios seguidos (por ejemplo, al arrastrar) se juntan en un solo
// dibujo por fotograma gracias a requestAnimationFrame.
let dibujoPendiente = false;
function pedirDibujo() {
  if (dibujoPendiente) return;
  dibujoPendiente = true;
  requestAnimationFrame(() => {
    dibujoPendiente = false;
    dibujarPantalla(ctx);
    actualizarInterfaz();
    colocarEditor();
    actualizarCursor();
  });
}

// Guardado automático en el navegador, como mucho una vez por segundo
// para no ralentizar mientras se arrastra.
let temporizadorGuardado = null;
let avisoDeGuardadoMostrado = false;
function programarGuardado() {
  if (temporizadorGuardado) return; // ya hay uno en marcha: guardará también este cambio
  temporizadorGuardado = setTimeout(guardarAhora, 1000);
}

function guardarAhora() {
  clearTimeout(temporizadorGuardado);
  temporizadorGuardado = null;
  const bien = guardarEnNavegador(empaquetar(estado, true));
  if (!bien && !avisoDeGuardadoMostrado) {
    avisoDeGuardadoMostrado = true;
    avisar("Este navegador no deja guardar el dibujo (¿ventana privada o sin espacio?). Usa Menú → Guardar archivo.");
  }
}

alCambiar(() => {
  pedirDibujo();
  programarGuardado();
});

// Al cerrar o esconder la pestaña se guarda ya, sin esperar al segundo.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") guardarAhora();
});
window.addEventListener("pagehide", guardarAhora);

// ---------------------------------------------------------------------------
// Puntero: ratón, lápiz y dedos (Pointer Events los trata a todos igual)
// ---------------------------------------------------------------------------

const punteros = new Map(); // punteros apoyados ahora mismo: id -> posición en pantalla
let accion = null; // lo que se está haciendo al arrastrar (dibujar, mover, redimensionar...)
let espacioPulsado = false;
let ultimoClic = { tiempo: 0, x: 0, y: 0 }; // para reconocer el doble clic (también con el dedo)
let ultimaPosicion = null; // última posición del puntero, para elegir el cursor
let tipoDePuntero = "mouse";

// Margen para "acertar" a un elemento: más generoso con el dedo.
const tolerancia = () => (tipoDePuntero === "touch" ? 12 : 6) / estado.camara.zoom;

lienzo.addEventListener("pointerdown", alPulsar);
lienzo.addEventListener("pointermove", alMover);
lienzo.addEventListener("pointerup", alSoltar);
lienzo.addEventListener("pointercancel", alCancelar);
// El lienzo nunca necesita el foco: así un clic (o un toque, que el navegador convierte
// en clic de ratón después de soltar) no le quita el foco al cuadro de texto recién abierto.
lienzo.addEventListener("mousedown", (e) => e.preventDefault());
lienzo.addEventListener("pointerleave", () => {
  if (!accion && estado.resaltado) {
    estado.resaltado = null;
    pedirDibujo();
  }
});

function alPulsar(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return; // solo el botón principal
  tipoDePuntero = e.pointerType;
  // Si se estaba escribiendo, un clic fuera solo termina el texto.
  if (estado.editando) {
    terminarEdicion();
    return;
  }
  // Un puntero "principal" (el ratón, o el primer dedo) significa que no hay otro apoyado:
  // si quedaba algo a medias porque el navegador no avisó al soltar, se descarta.
  if (e.isPrimary) {
    punteros.clear();
    if (accion) revertirAccion();
  }
  lienzo.setPointerCapture(e.pointerId); // seguimos recibiendo el arrastre aunque salga del lienzo
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });

  // Dos dedos: desplazar y pellizcar para el zoom.
  if (punteros.size === 2) {
    empezarGesto();
    return;
  }
  if (punteros.size > 2 || accion) return;

  const p = aMundo(e.clientX, e.clientY);
  const doble = esDobleClic(e);

  // Mano (herramienta o barra espaciadora): arrastrar mueve la vista.
  if (estado.herramienta === "mano" || espacioPulsado) {
    accion = { tipo: "desplazar", ultimo: { x: e.clientX, y: e.clientY } };
    actualizarCursor();
    return;
  }

  switch (estado.herramienta) {
    case "seleccionar":
      pulsarConSeleccionar(e, p, doble);
      break;
    case "rectangulo":
    case "rombo":
    case "elipse":
      empezarForma(p);
      break;
    case "flecha":
      empezarFlecha(p);
      break;
    case "texto":
      // Se escribe al soltar: así el cuadro de texto no pierde el foco con el propio clic.
      accion = { tipo: "escribir", objetivo: elementoEn(estado.elementos, p.x, p.y, tolerancia()), punto: p };
      break;
    case "goma":
      accion = { tipo: "borrar", ultimo: p };
      marcarParaBorrar(p, p);
      break;
  }
}

function alMover(e) {
  if (punteros.has(e.pointerId)) punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  ultimaPosicion = { x: e.clientX, y: e.clientY };
  if (!accion) {
    pasarPorEncima(e);
    return;
  }
  if (!punteros.has(e.pointerId)) return;
  const p = aMundo(e.clientX, e.clientY);

  switch (accion.tipo) {
    case "gesto":
      moverGesto();
      break;
    case "desplazar":
      acciones.desplazar(e.clientX - accion.ultimo.x, e.clientY - accion.ultimo.y);
      accion.ultimo = { x: e.clientX, y: e.clientY };
      break;
    case "dibujar":
      dibujarForma(p, e.shiftKey);
      break;
    case "flecha":
      moverExtremo(accion.id, "fin", p);
      break;
    case "extremo":
      moverExtremo(accion.id, accion.cual, p);
      break;
    case "mover":
      moverSeleccionados(p);
      break;
    case "redimensionar":
      redimensionar(p);
      break;
    case "recuadro":
      actualizarRecuadro(p);
      break;
    case "borrar":
      marcarParaBorrar(accion.ultimo, p);
      accion.ultimo = p;
      break;
  }
}

function alSoltar(e) {
  if (!punteros.has(e.pointerId)) return;
  punteros.delete(e.pointerId);
  if (!accion) return;
  // Tras un gesto de dos dedos, se espera a que se levanten todos antes de hacer nada más.
  if (accion.tipo === "gesto" || accion.tipo === "esperar") {
    accion = punteros.size === 0 ? null : { tipo: "esperar" };
    return;
  }
  terminarAccion(aMundo(e.clientX, e.clientY));
  accion = null;
  actualizarCursor();
}

function alCancelar(e) {
  // El sistema ha interrumpido el puntero (por ejemplo, una llamada en el móvil): se deshace lo que iba a medias.
  punteros.delete(e.pointerId);
  if (accion && accion.tipo !== "gesto" && accion.tipo !== "esperar") revertirAccion();
  accion = punteros.size === 0 ? null : { tipo: "esperar" };
}

/** Termina el arrastre en curso (al soltar). */
function terminarAccion(p) {
  switch (accion.tipo) {
    case "dibujar": {
      const el = buscar(accion.id);
      if (!el) break;
      if (el.ancho < 3 && el.alto < 3) {
        // Un clic sin arrastrar no dibuja nada: se quita y la herramienta sigue activa.
        quitar(el.id);
        cambio();
      } else {
        estado.herramienta = "seleccionar"; // al soltar, la herramienta vuelve a seleccionar
        acciones.confirmarCambio();
      }
      break;
    }
    case "flecha": {
      estado.resaltado = null;
      const arrastre = Math.hypot(p.x - accion.inicio.x, p.y - accion.inicio.y) * estado.camara.zoom;
      if (arrastre < 5) {
        quitar(accion.id);
        cambio();
      } else {
        estado.herramienta = "seleccionar";
        acciones.confirmarCambio();
      }
      break;
    }
    case "extremo":
      estado.resaltado = null;
      acciones.confirmarCambio();
      break;
    case "mover":
      if (accion.seMovio) acciones.confirmarCambio();
      else if (!accion.conMayus && estado.seleccion.size > 1) {
        // Clic (sin arrastrar) en un elemento de una selección múltiple: se queda solo ese.
        estado.seleccion = new Set([accion.clicEn]);
        cambio();
      }
      break;
    case "redimensionar":
      // Si una forma ha quedado más pequeña que su texto, crece hasta que quepa.
      for (const el of seleccionados()) if (FORMAS.includes(el.tipo)) ajustarAlTexto(el);
      recalcularFlechas(estado.elementos);
      acciones.confirmarCambio();
      break;
    case "recuadro":
      estado.recuadro = null;
      cambio();
      break;
    case "borrar":
      acciones.borrarElementos(estado.borrando);
      estado.borrando = new Set();
      cambio();
      break;
    case "escribir":
      if (accion.objetivo) editarTexto(accion.objetivo);
      else crearTextoEn(accion.punto);
      break;
  }
}

/** Cancela lo que se estaba haciendo y vuelve al último estado confirmado. */
function revertirAccion() {
  estado.elementos = ultimoConfirmado();
  const existen = new Set(estado.elementos.map((el) => el.id));
  estado.seleccion = new Set([...estado.seleccion].filter((id) => existen.has(id)));
  estado.recuadro = null;
  estado.resaltado = null;
  estado.borrando = new Set();
  accion = null;
  cambio();
}

function quitar(id) {
  estado.elementos = estado.elementos.filter((el) => el.id !== id);
  estado.seleccion.delete(id);
}

// Doble clic hecho a mano (con Pointer Events) para que también funcione con el dedo.
function esDobleClic(e) {
  const cerca = Math.hypot(e.clientX - ultimoClic.x, e.clientY - ultimoClic.y) < 10;
  const doble = e.timeStamp - ultimoClic.tiempo < 400 && cerca;
  ultimoClic = doble ? { tiempo: 0, x: 0, y: 0 } : { tiempo: e.timeStamp, x: e.clientX, y: e.clientY };
  return doble;
}

// --- Seleccionar, mover y redimensionar -------------------------------------

function pulsarConSeleccionar(e, p, doble) {
  // Doble clic: escribir en el elemento o, en vacío, crear un texto suelto (al soltar).
  if (doble) {
    accion = { tipo: "escribir", objetivo: elementoEn(estado.elementos, p.x, p.y, tolerancia()), punto: p };
    return;
  }

  // ¿Un tirador de la selección?
  const tirador = tiradorEn(e.clientX, e.clientY);
  if (tirador) {
    const sel = seleccionados();
    if (tirador.nombre === "inicio" || tirador.nombre === "fin") {
      accion = { tipo: "extremo", id: sel[0].id, cual: tirador.nombre };
    } else {
      accion = { tipo: "redimensionar", tirador: tirador.nombre, caja: limitesDe(sel), inicio: p, originales: structuredClone(sel), empezado: false };
    }
    return;
  }

  // ¿Un elemento?
  const el = elementoEn(estado.elementos, p.x, p.y, tolerancia());
  if (el) {
    if (e.shiftKey && estado.seleccion.has(el.id)) {
      // Mayús + clic en algo ya seleccionado: se quita de la selección.
      estado.seleccion.delete(el.id);
      cambio();
      return;
    }
    if (e.shiftKey) estado.seleccion.add(el.id);
    else if (!estado.seleccion.has(el.id)) estado.seleccion = new Set([el.id]);
    accion = { tipo: "mover", inicio: p, originales: structuredClone(seleccionados()), seMovio: false, clicEn: el.id, conMayus: e.shiftKey };
    cambio();
    return;
  }

  // En vacío: recuadro de selección (con Mayús se suma a lo que ya había).
  if (!e.shiftKey) estado.seleccion.clear();
  accion = { tipo: "recuadro", inicio: p, base: new Set(estado.seleccion) };
  estado.recuadro = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
  cambio();
}

/** Tirador bajo el puntero (en píxeles de pantalla), o null. */
function tiradorEn(xPantalla, yPantalla) {
  if (estado.herramienta !== "seleccionar" || estado.editando) return null;
  const { tiradores } = tiradoresPara(seleccionados(), estado.camara.zoom);
  const radio = tipoDePuntero === "touch" ? 14 : 8;
  return (
    tiradores.find((t) => {
      const s = aPantalla(t.x, t.y);
      return Math.abs(s.x - xPantalla) <= radio && Math.abs(s.y - yPantalla) <= radio;
    }) ?? null
  );
}

function moverSeleccionados(p) {
  const dx = p.x - accion.inicio.x;
  const dy = p.y - accion.inicio.y;
  // Un pequeño margen evita mover sin querer al hacer clic.
  if (!accion.seMovio) {
    if (Math.hypot(dx, dy) * estado.camara.zoom < 3) return;
    accion.seMovio = true;
    acciones.soltarFlechasQueSeMuevenSolas();
  }
  for (const original of accion.originales) {
    const el = buscar(original.id);
    if (!el) continue;
    if (el.tipo === "flecha") {
      el.x1 = original.x1 + dx;
      el.y1 = original.y1 + dy;
      el.x2 = original.x2 + dx;
      el.y2 = original.y2 + dy;
    } else {
      el.x = original.x + dx;
      el.y = original.y + dy;
    }
  }
  recalcularFlechas(estado.elementos); // las flechas enganchadas siguen a sus formas al momento
  cambio();
}

/**
 * Redimensionar con los 8 tiradores. Se calcula la caja nueva moviendo los bordes
 * del tirador y se "estira" cada elemento de la caja vieja a la nueva.
 */
function redimensionar(p) {
  if (!accion.empezado) {
    accion.empezado = true;
    acciones.soltarFlechasQueSeMuevenSolas();
  }
  const { caja, tirador, originales } = accion;
  const dx = p.x - accion.inicio.x;
  const dy = p.y - accion.inicio.y;
  const nueva = { ...caja };
  if (tirador.includes("w")) nueva.x1 += dx;
  if (tirador.includes("e")) nueva.x2 += dx;
  if (tirador.includes("n")) nueva.y1 += dy;
  if (tirador.includes("s")) nueva.y2 += dy;
  const anchoAntes = caja.x2 - caja.x1;
  const altoAntes = caja.y2 - caja.y1;
  // Cuánto se estira en cada eje (negativo si se arrastra más allá del borde contrario).
  const sx = anchoAntes > 0.01 ? (nueva.x2 - nueva.x1) / anchoAntes : 1;
  const sy = altoAntes > 0.01 ? (nueva.y2 - nueva.y1) / altoAntes : 1;
  const enX = (x) => nueva.x1 + (x - caja.x1) * sx;
  const enY = (y) => nueva.y1 + (y - caja.y1) * sy;
  const cambiaAlto = tirador.includes("n") || tirador.includes("s");

  for (const original of originales) {
    const el = buscar(original.id);
    if (!el) continue;
    if (el.tipo === "flecha") {
      el.x1 = enX(original.x1);
      el.y1 = enY(original.y1);
      el.x2 = enX(original.x2);
      el.y2 = enY(original.y2);
    } else if (el.tipo === "texto") {
      // Un texto no se deforma: cambia el tamaño de la letra y se recoloca por su centro.
      const escala = Math.abs(cambiaAlto ? sy : sx);
      el.tamano = Math.min(400, Math.max(6, original.tamano * escala));
      ajustarAlTexto(el);
      el.x = enX(original.x + original.ancho / 2) - el.ancho / 2;
      el.y = enY(original.y + original.alto / 2) - el.alto / 2;
    } else {
      const ax = enX(original.x);
      const bx = enX(original.x + original.ancho);
      const ay = enY(original.y);
      const by = enY(original.y + original.alto);
      el.x = Math.min(ax, bx);
      el.y = Math.min(ay, by);
      el.ancho = Math.abs(bx - ax);
      el.alto = Math.abs(by - ay);
    }
  }
  recalcularFlechas(estado.elementos);
  cambio();
}

function actualizarRecuadro(p) {
  estado.recuadro = { x1: accion.inicio.x, y1: accion.inicio.y, x2: p.x, y2: p.y };
  const r = normalizar(estado.recuadro);
  // Quedan elegidos los elementos que caben enteros dentro del recuadro.
  const dentro = estado.elementos.filter((el) => {
    const b = limites(el);
    return b.x1 >= r.x1 && b.x2 <= r.x2 && b.y1 >= r.y1 && b.y2 <= r.y2;
  });
  estado.seleccion = new Set([...accion.base, ...dentro.map((el) => el.id)]);
  cambio();
}

// --- Dibujar formas, flechas y textos ---------------------------------------

function empezarForma(p) {
  const el = crearElemento(estado.herramienta, { x: p.x, y: p.y, ancho: 0, alto: 0 });
  estado.elementos.push(el);
  estado.seleccion = new Set([el.id]);
  accion = { tipo: "dibujar", id: el.id, inicio: p };
  cambio();
}

function dibujarForma(p, conMayus) {
  const el = buscar(accion.id);
  if (!el) return;
  let dx = p.x - accion.inicio.x;
  let dy = p.y - accion.inicio.y;
  if (conMayus) {
    // Con Mayús, mismo ancho que alto: cuadrado, rombo regular o círculo.
    const lado = Math.max(Math.abs(dx), Math.abs(dy));
    dx = (dx < 0 ? -1 : 1) * lado;
    dy = (dy < 0 ? -1 : 1) * lado;
  }
  el.x = Math.min(accion.inicio.x, accion.inicio.x + dx);
  el.y = Math.min(accion.inicio.y, accion.inicio.y + dy);
  el.ancho = Math.abs(dx);
  el.alto = Math.abs(dy);
  cambio();
}

function empezarFlecha(p) {
  // Si empieza sobre una forma, la flecha queda enganchada a ella.
  const forma = formaEn(estado.elementos, p.x, p.y, tolerancia());
  const el = crearElemento("flecha", { x1: p.x, y1: p.y, x2: p.x, y2: p.y, desde: forma ? forma.id : null, hasta: null });
  estado.elementos.push(el);
  estado.seleccion = new Set([el.id]);
  accion = { tipo: "flecha", id: el.id, inicio: p };
  cambio();
}

/** Mueve un extremo de flecha y lo engancha a la forma que haya debajo (resaltándola). */
function moverExtremo(id, cual, p) {
  const flecha = buscar(id);
  if (!flecha) return;
  const otroExtremo = cual === "fin" ? flecha.desde : flecha.hasta;
  const forma = formaEn(estado.elementos, p.x, p.y, tolerancia(), otroExtremo);
  if (cual === "fin") {
    flecha.x2 = p.x;
    flecha.y2 = p.y;
    flecha.hasta = forma ? forma.id : null;
  } else {
    flecha.x1 = p.x;
    flecha.y1 = p.y;
    flecha.desde = forma ? forma.id : null;
  }
  estado.resaltado = forma ? forma.id : null;
  recalcularFlechas(estado.elementos);
  cambio();
}

function crearTextoEn(p) {
  // El clic marca el centro de la primera línea.
  const el = crearElemento("texto", { x: p.x, y: p.y - (TAMANO_TEXTO * ALTO_LINEA) / 2, ancho: 0, alto: 0 });
  ajustarAlTexto(el);
  estado.elementos.push(el);
  editarTexto(el);
}

// --- Goma ---------------------------------------------------------------------

// Marca lo que toca la goma entre dos posiciones (en pasos pequeños, para no saltarse
// nada si el puntero va rápido). Se borra todo junto al soltar.
function marcarParaBorrar(desde, hasta) {
  const paso = 4 / estado.camara.zoom;
  const pasos = Math.max(1, Math.ceil(Math.hypot(hasta.x - desde.x, hasta.y - desde.y) / paso));
  for (let i = 0; i <= pasos; i++) {
    const x = desde.x + ((hasta.x - desde.x) * i) / pasos;
    const y = desde.y + ((hasta.y - desde.y) * i) / pasos;
    const el = elementoEn(estado.elementos, x, y, tolerancia());
    if (el) estado.borrando.add(el.id);
  }
  pedirDibujo();
}

// --- Gestos con dos dedos -----------------------------------------------------

const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function empezarGesto() {
  // Si el primer dedo había empezado a dibujar o mover algo, se cancela.
  if (accion && accion.tipo !== "desplazar") revertirAccion();
  const [a, b] = [...punteros.values()];
  accion = { tipo: "gesto", medio: medio(a, b), distancia: Math.max(1, distancia(a, b)) };
}

function moverGesto() {
  const [a, b] = [...punteros.values()];
  const m = medio(a, b);
  const d = Math.max(1, distancia(a, b));
  // Desplazar con el punto medio entre los dedos...
  estado.camara.x += m.x - accion.medio.x;
  estado.camara.y += m.y - accion.medio.y;
  // ...y acercar o alejar según se separan o se juntan, hacia ese punto medio.
  acciones.zoomHacia(estado.camara.zoom * (d / accion.distancia), m);
  accion.medio = m;
  accion.distancia = d;
}

// --- Puntero sin pulsar: cursor y forma resaltada ---------------------------

function pasarPorEncima(e) {
  if (e.pointerType === "touch") return;
  tipoDePuntero = e.pointerType;
  if (estado.herramienta === "flecha") {
    // Con la flecha activa, la forma bajo el puntero se resalta: ahí se engancharía.
    const p = aMundo(e.clientX, e.clientY);
    const forma = formaEn(estado.elementos, p.x, p.y, tolerancia());
    const id = forma ? forma.id : null;
    if (id !== estado.resaltado) {
      estado.resaltado = id;
      pedirDibujo();
    }
  }
  actualizarCursor();
}

const CURSORES_TIRADOR = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  inicio: "crosshair",
  fin: "crosshair",
};

function actualizarCursor() {
  const herramienta = estado.herramienta;
  let cursor = "default";
  if (accion && accion.tipo === "desplazar") cursor = "grabbing";
  else if (espacioPulsado || herramienta === "mano") cursor = "grab";
  else if (FORMAS.includes(herramienta) || herramienta === "flecha") cursor = "crosshair";
  else if (herramienta === "texto") cursor = "text";
  else if (herramienta === "goma") cursor = "cell";
  else if (accion && accion.tipo === "mover") cursor = "move";
  else if (ultimaPosicion) {
    const tirador = tiradorEn(ultimaPosicion.x, ultimaPosicion.y);
    const p = aMundo(ultimaPosicion.x, ultimaPosicion.y);
    if (tirador) cursor = CURSORES_TIRADOR[tirador.nombre];
    else if (elementoEn(estado.elementos, p.x, p.y, tolerancia())) cursor = "move";
  }
  lienzo.style.cursor = cursor;
}

// ---------------------------------------------------------------------------
// Rueda del ratón y trackpad
// ---------------------------------------------------------------------------

let gestoSafari = false;

lienzo.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault(); // sin esto, el navegador haría zoom o scroll de la página entera
    // La rueda puede medir en píxeles, en líneas o en páginas: lo pasamos todo a píxeles.
    const unidad = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const dx = e.deltaX * unidad;
    const dy = e.deltaY * unidad;
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + rueda, o pellizcar en el trackpad (el navegador lo envía con ctrlKey).
      if (gestoSafari) return;
      const paso = Math.max(-10, Math.min(10, dy)); // con tope, para que una rueda brusca no salte demasiado
      acciones.zoomHacia(estado.camara.zoom * Math.exp(-paso * 0.01), { x: e.clientX, y: e.clientY });
    } else if (e.shiftKey && dx === 0) {
      acciones.desplazar(-dy, 0); // Mayús + rueda: desplazamiento horizontal con ratón normal
    } else {
      acciones.desplazar(-dx, -dy); // dos dedos en el trackpad o rueda: desplazar
    }
  },
  { passive: false }, // necesario para poder llamar a preventDefault
);

// Safari en Mac envía el pellizco del trackpad con sus propios eventos "gesture".
// No son estándar, pero sin ellos Safari haría zoom de toda la página.
let escalaGesto = 1;
window.addEventListener("gesturestart", (e) => {
  e.preventDefault();
  gestoSafari = true;
  escalaGesto = 1;
});
window.addEventListener("gesturechange", (e) => {
  e.preventDefault();
  if (punteros.size >= 2) return; // en pantallas táctiles ya lo gestionan los Pointer Events
  acciones.zoomHacia(estado.camara.zoom * (e.scale / escalaGesto), { x: e.clientX, y: e.clientY });
  escalaGesto = e.scale;
});
window.addEventListener("gestureend", (e) => {
  e.preventDefault();
  gestoSafari = false;
});

// ---------------------------------------------------------------------------
// Teclado
// ---------------------------------------------------------------------------

const esCampoDeTexto = (destino) => destino instanceof Element && Boolean(destino.closest("textarea, input"));

const FLECHAS_TECLADO = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

window.addEventListener("keydown", (e) => {
  // Mientras se escribe en un campo de texto o hay una ventana abierta, el teclado es suyo.
  if (esCampoDeTexto(e.target) || document.querySelector("dialog[open]")) return;
  const conModificador = e.ctrlKey || e.metaKey; // Ctrl en Windows/Linux, Cmd en Mac
  const tecla = e.key.toLowerCase();

  if (e.key === " ") {
    e.preventDefault(); // que la barra no "pulse" el botón que tenga el foco
    if (!espacioPulsado) {
      espacioPulsado = true;
      actualizarCursor();
    }
    return;
  }
  if (accion) {
    // Durante un arrastre solo vale Esc (cancelar).
    if (e.key === "Escape") revertirAccion();
    return;
  }

  if (conModificador) {
    // Anulamos lo que haría el navegador (Ctrl+D = favoritos, Ctrl+A = seleccionar la página...).
    if (tecla === "z") {
      e.preventDefault();
      if (e.shiftKey) acciones.rehacer();
      else acciones.deshacer();
    } else if (tecla === "d") {
      e.preventDefault();
      acciones.duplicar();
    } else if (tecla === "a") {
      e.preventDefault();
      acciones.seleccionarTodo();
    }
    return; // el resto de atajos del navegador (copiar, imprimir...) se respetan
  }

  if (e.key === "Delete" || e.key === "Backspace") {
    // En los teclados de Mac la tecla de borrar es "Backspace".
    e.preventDefault();
    acciones.borrarSeleccion();
  } else if (FLECHAS_TECLADO[e.key]) {
    e.preventDefault();
    const [x, y] = FLECHAS_TECLADO[e.key];
    const paso = e.shiftKey ? 10 : 1; // 1 px del dibujo, o 10 px con Mayús
    acciones.moverSeleccion(x * paso, y * paso);
  } else if (e.key === "Escape") {
    if (menuAbierto()) cerrarMenu();
    else if (estado.seleccion.size > 0) {
      estado.seleccion.clear();
      cambio();
    } else acciones.elegirHerramienta("seleccionar");
  } else if (/^[1-8]$/.test(e.key) && !e.altKey) {
    acciones.elegirHerramienta(HERRAMIENTAS[Number(e.key) - 1]);
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === " ") {
    espacioPulsado = false;
    actualizarCursor();
  }
  // Mover con las flechas del teclado cuenta como un solo paso de deshacer por pulsación.
  if (FLECHAS_TECLADO[e.key] && !esCampoDeTexto(e.target) && !accion) acciones.confirmarCambio();
});

// Si la ventana pierde el foco con la barra pulsada, no nos enteraríamos de que se soltó.
window.addEventListener("blur", () => {
  espacioPulsado = false;
});

// ---------------------------------------------------------------------------
// Arrastrar un archivo .json a la pizarra
// ---------------------------------------------------------------------------

const capaSoltar = document.getElementById("capa-soltar");
const traeArchivos = (e) => e.dataTransfer && [...e.dataTransfer.types].includes("Files");

window.addEventListener("dragover", (e) => {
  if (!traeArchivos(e)) return;
  e.preventDefault(); // sin esto el navegador no permite soltar (y abriría el archivo él mismo)
  e.dataTransfer.dropEffect = "copy";
  capaSoltar.hidden = false;
});
window.addEventListener("dragleave", (e) => {
  if (!e.relatedTarget) capaSoltar.hidden = true; // ha salido de la ventana
});
window.addEventListener("drop", (e) => {
  if (!traeArchivos(e)) return;
  e.preventDefault();
  capaSoltar.hidden = true;
  const archivo = e.dataTransfer.files[0];
  if (!archivo) return;
  terminarEdicion();
  acciones.abrirArchivo(archivo);
});

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

function arrancar() {
  const guardado = cargarDelNavegador();
  if (guardado) {
    estado.elementos = guardado.elementos;
    if (guardado.camara) Object.assign(estado.camara, guardado.camara);
    if (guardado.preferencias) Object.assign(estado.preferencias, guardado.preferencias);
  } else {
    // Primera visita: modo oscuro si el sistema lo usa y un diagrama de ejemplo para no empezar en blanco.
    estado.preferencias.oscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const ejemplo = leerDibujo(JSON.stringify(EJEMPLO));
    if (ejemplo.ok) estado.elementos = ejemplo.elementos;
  }
  for (const el of estado.elementos) ajustarAlTexto(el);
  recalcularFlechas(estado.elementos);
  iniciarHistorial(estado.elementos);

  ajustarTamano(lienzo);
  window.addEventListener("resize", () => {
    ajustarTamano(lienzo);
    pedirDibujo();
  });
  prepararInterfaz();
  pedirDibujo();
}

arrancar();
