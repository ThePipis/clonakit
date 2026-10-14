// Cálculos geométricos: dónde está cada cosa, qué hay bajo el puntero,
// dónde se enganchan las flechas y cuánto ocupa un texto.
// Todo trabaja en coordenadas del "mundo" (las del dibujo, sin zoom).

import { FORMAS, FUENTE_DIBUJO, ALTO_LINEA } from "./constantes.js";

export const esForma = (el) => FORMAS.includes(el.tipo);

// ---------------------------------------------------------------------------
// Límites y centros
// ---------------------------------------------------------------------------

/** Rectángulo que ocupa un elemento: { x1, y1, x2, y2 } (esquina superior izquierda e inferior derecha). */
export function limites(el) {
  if (el.tipo === "flecha") {
    let caja = {
      x1: Math.min(el.x1, el.x2),
      y1: Math.min(el.y1, el.y2),
      x2: Math.max(el.x1, el.x2),
      y2: Math.max(el.y1, el.y2),
    };
    if (el.texto) caja = unir(caja, cajaEtiqueta(el));
    return caja;
  }
  return { x1: el.x, y1: el.y, x2: el.x + el.ancho, y2: el.y + el.alto };
}

/** Rectángulo que abarca varios elementos, o null si la lista está vacía. */
export function limitesDe(lista) {
  if (lista.length === 0) return null;
  return lista.map(limites).reduce(unir);
}

function unir(a, b) {
  return { x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1), x2: Math.max(a.x2, b.x2), y2: Math.max(a.y2, b.y2) };
}

/** Centro de un elemento (en las flechas, su punto medio: ahí va la etiqueta). */
export function centro(el) {
  if (el.tipo === "flecha") return { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2 };
  return { x: el.x + el.ancho / 2, y: el.y + el.alto / 2 };
}

/** Pone un rectángulo "del derecho" aunque se haya arrastrado hacia arriba o a la izquierda. */
export function normalizar(r) {
  return { x1: Math.min(r.x1, r.x2), y1: Math.min(r.y1, r.y2), x2: Math.max(r.x1, r.x2), y2: Math.max(r.y1, r.y2) };
}

// ---------------------------------------------------------------------------
// ¿Qué hay bajo el puntero?
// ---------------------------------------------------------------------------

/** ¿El punto (x, y) toca el elemento? `tolerancia` da un poco de margen para no tener que acertar al píxel. */
export function tocaElemento(el, x, y, tolerancia) {
  if (el.tipo === "rectangulo" || el.tipo === "texto") {
    return x >= el.x - tolerancia && x <= el.x + el.ancho + tolerancia && y >= el.y - tolerancia && y <= el.y + el.alto + tolerancia;
  }
  if (el.tipo === "rombo") {
    // Un rombo cumple |dx| / medio ancho + |dy| / medio alto <= 1.
    const c = centro(el);
    return Math.abs(x - c.x) / (el.ancho / 2 + tolerancia) + Math.abs(y - c.y) / (el.alto / 2 + tolerancia) <= 1;
  }
  if (el.tipo === "elipse") {
    // Ecuación de la elipse: (dx / rx)² + (dy / ry)² <= 1.
    const c = centro(el);
    return ((x - c.x) / (el.ancho / 2 + tolerancia)) ** 2 + ((y - c.y) / (el.alto / 2 + tolerancia)) ** 2 <= 1;
  }
  if (el.tipo === "flecha") {
    if (distanciaASegmento(x, y, el.x1, el.y1, el.x2, el.y2) <= tolerancia + el.grosor / 2) return true;
    if (!el.texto) return false;
    const c = cajaEtiqueta(el);
    return x >= c.x1 && x <= c.x2 && y >= c.y1 && y <= c.y2;
  }
  return false;
}

/** El elemento más alto (el que se ve encima) bajo el punto, o null. */
export function elementoEn(elementos, x, y, tolerancia) {
  for (let i = elementos.length - 1; i >= 0; i--) {
    if (tocaElemento(elementos[i], x, y, tolerancia)) return elementos[i];
  }
  return null;
}

/** Igual, pero solo formas (para enganchar flechas). `excluirId` evita enganchar una flecha a la misma forma por los dos lados. */
export function formaEn(elementos, x, y, tolerancia, excluirId = null) {
  for (let i = elementos.length - 1; i >= 0; i--) {
    const el = elementos[i];
    if (esForma(el) && el.id !== excluirId && tocaElemento(el, x, y, tolerancia)) return el;
  }
  return null;
}

function distanciaASegmento(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const largo2 = dx * dx + dy * dy;
  // t dice en qué parte del segmento cae la proyección del punto (0 = inicio, 1 = final).
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / largo2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ---------------------------------------------------------------------------
// Flechas enganchadas
// ---------------------------------------------------------------------------

/**
 * Punto del borde de una forma en la dirección de `hacia`, separado `hueco` píxeles.
 * Se traza una línea desde el centro de la forma hacia ese punto y se busca dónde cruza el borde.
 */
export function puntoEnBorde(forma, hacia, hueco = 0) {
  const c = centro(forma);
  let dx = hacia.x - c.x;
  let dy = hacia.y - c.y;
  const largo = Math.hypot(dx, dy);
  if (largo < 0.001) {
    dx = 1; // si el punto coincide con el centro, salimos hacia la derecha
    dy = 0;
  } else {
    dx /= largo;
    dy /= largo;
  }
  const a = Math.max(forma.ancho / 2, 0.5);
  const b = Math.max(forma.alto / 2, 0.5);
  let distancia; // del centro al borde en esa dirección
  if (forma.tipo === "rectangulo") distancia = Math.min(dx ? a / Math.abs(dx) : Infinity, dy ? b / Math.abs(dy) : Infinity);
  else if (forma.tipo === "rombo") distancia = 1 / (Math.abs(dx) / a + Math.abs(dy) / b);
  else distancia = 1 / Math.hypot(dx / a, dy / b);
  return { x: c.x + dx * (distancia + hueco), y: c.y + dy * (distancia + hueco) };
}

/**
 * Recoloca los extremos de todas las flechas enganchadas a formas.
 * Cada extremo enganchado apunta hacia el otro extremo (o hacia el centro de la otra forma)
 * y se queda en el borde, no en el centro. Se llama tras cualquier cambio.
 */
export function recalcularFlechas(elementos) {
  const porId = new Map(elementos.map((el) => [el.id, el]));
  for (const f of elementos) {
    if (f.tipo !== "flecha") continue;
    const a = f.desde ? porId.get(f.desde) : null;
    const b = f.hasta ? porId.get(f.hasta) : null;
    // Si la forma ya no existe (se borró), la flecha se suelta y se queda donde estaba.
    if (!a) f.desde = null;
    if (!b) f.hasta = null;
    if (!a && !b) continue;
    const haciaInicio = b ? centro(b) : { x: f.x2, y: f.y2 };
    const haciaFin = a ? centro(a) : { x: f.x1, y: f.y1 };
    const hueco = 4 + f.grosor; // un poco de aire para que la punta no se meta en la línea de la forma
    if (a) {
      const p = puntoEnBorde(a, haciaInicio, hueco);
      f.x1 = p.x;
      f.y1 = p.y;
    }
    if (b) {
      const p = puntoEnBorde(b, haciaFin, hueco);
      f.x2 = p.x;
      f.y2 = p.y;
    }
  }
}

// ---------------------------------------------------------------------------
// Tiradores de la selección
// ---------------------------------------------------------------------------

/**
 * Recuadro y tiradores de la selección. Con una sola flecha seleccionada,
 * los tiradores son sus dos extremos (redondos); en el resto de casos, 8 cuadrados.
 */
export function tiradoresPara(seleccion, zoom) {
  if (seleccion.length === 0) return { caja: null, tiradores: [] };
  if (seleccion.length === 1 && seleccion[0].tipo === "flecha") {
    const f = seleccion[0];
    return {
      caja: null,
      tiradores: [
        { nombre: "inicio", x: f.x1, y: f.y1, redondo: true },
        { nombre: "fin", x: f.x2, y: f.y2, redondo: true },
      ],
    };
  }
  const b = limitesDe(seleccion);
  const m = 8 / zoom; // separación de 8 px en pantalla, haga el zoom que haga
  const caja = { x1: b.x1 - m, y1: b.y1 - m, x2: b.x2 + m, y2: b.y2 + m };
  const cx = (caja.x1 + caja.x2) / 2;
  const cy = (caja.y1 + caja.y2) / 2;
  // Primero las esquinas: si la caja es pequeña y se solapan, ganan ellas.
  return {
    caja,
    tiradores: [
      { nombre: "nw", x: caja.x1, y: caja.y1 },
      { nombre: "ne", x: caja.x2, y: caja.y1 },
      { nombre: "se", x: caja.x2, y: caja.y2 },
      { nombre: "sw", x: caja.x1, y: caja.y2 },
      { nombre: "n", x: cx, y: caja.y1 },
      { nombre: "e", x: caja.x2, y: cy },
      { nombre: "s", x: cx, y: caja.y2 },
      { nombre: "w", x: caja.x1, y: cy },
    ],
  };
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

// Un <canvas> invisible que solo sirve para medir cuánto ocupa un texto.
const medidor = document.createElement("canvas").getContext("2d");

export function fuente(tamano) {
  return `${tamano}px ${FUENTE_DIBUJO}`;
}

/** Ancho y alto de un texto de varias líneas con el tamaño indicado. */
export function medirTexto(texto, tamano) {
  medidor.font = fuente(tamano);
  const lineas = texto.split("\n");
  const ancho = Math.max(...lineas.map((linea) => medidor.measureText(linea).width));
  return { ancho, alto: lineas.length * tamano * ALTO_LINEA };
}

/**
 * Posición de cada línea de texto de un elemento: alineado a la izquierda si es
 * un texto suelto; centrado si va dentro de una forma o en una flecha.
 */
export function lineasDeTexto(el) {
  const altoLinea = el.tamano * ALTO_LINEA;
  const lineas = el.texto.split("\n");
  let x;
  let yPrimera;
  let alinear;
  if (el.tipo === "texto") {
    x = el.x;
    yPrimera = el.y + altoLinea / 2;
    alinear = "left";
  } else {
    const c = centro(el);
    x = c.x;
    yPrimera = c.y - (lineas.length * altoLinea) / 2 + altoLinea / 2;
    alinear = "center";
  }
  return { alinear, lineas: lineas.map((texto, i) => ({ texto, x, y: yPrimera + i * altoLinea })) };
}

/** Hueco que ocupa la etiqueta de una flecha (la línea se corta ahí para que se lea bien). */
export function cajaEtiqueta(flecha) {
  const m = medirTexto(flecha.texto, flecha.tamano);
  const c = centro(flecha);
  const aire = 4;
  return { x1: c.x - m.ancho / 2 - aire, y1: c.y - m.alto / 2 - aire, x2: c.x + m.ancho / 2 + aire, y2: c.y + m.alto / 2 + aire };
}

/**
 * Hace que el texto quepa:
 *  - en un texto suelto, recalcula su ancho y alto;
 *  - en una forma, la agranda (desde su centro) si el texto no cabe dentro.
 */
export function ajustarAlTexto(el) {
  if (el.tipo === "texto") {
    const m = medirTexto(el.texto || " ", el.tamano);
    el.ancho = m.ancho;
    el.alto = m.alto;
    return;
  }
  if (!esForma(el) || !el.texto) return;
  const m = medirTexto(el.texto, el.tamano);
  const aire = 10;
  // Medio ancho y medio alto del rectángulo que necesita el texto.
  const a = m.ancho / 2 + aire;
  const b = m.alto / 2 + aire;
  let anchoMinimo = 2 * a;
  let altoMinimo = 2 * b;
  if (el.tipo === "rombo") {
    // En un rombo cabe un rectángulo si a / A + b / B <= 1 (A y B: medio ancho y medio alto del rombo).
    if (a / (el.ancho / 2) + b / (el.alto / 2) <= 1) return;
    anchoMinimo = 4 * a; // con el doble de ancho y de alto, cabe seguro
    altoMinimo = 4 * b;
  } else if (el.tipo === "elipse") {
    if ((a / (el.ancho / 2)) ** 2 + (b / (el.alto / 2)) ** 2 <= 1) return;
    anchoMinimo = 2 * a * Math.SQRT2;
    altoMinimo = 2 * b * Math.SQRT2;
  }
  // Crece hacia los dos lados por igual para que el texto siga donde estaba.
  if (el.ancho < anchoMinimo) {
    el.x -= (anchoMinimo - el.ancho) / 2;
    el.ancho = anchoMinimo;
  }
  if (el.alto < altoMinimo) {
    el.y -= (altoMinimo - el.alto) / 2;
    el.alto = altoMinimo;
  }
}
