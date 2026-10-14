// El "trazo a mano": convierte cada elemento en líneas un poco irregulares.
//
// La idea: cada lado de una forma es una curva que se desvía unos píxeles de la línea recta
// y se repasa una segunda vez con desviaciones distintas, como cuando dibujas con boli.
// Las desviaciones salen de un generador pseudoaleatorio con la SEMILLA guardada en el
// elemento: con la misma semilla salen siempre los mismos números, así que la forma
// no "tiembla" al redibujar ni al exportar.
//
// Este archivo no dibuja: devuelve listas de órdenes de dibujo (mover, curva, línea...).
// Así las mismas órdenes sirven para el <canvas> de la pantalla, para el PNG y para el SVG.
//   ["M", x, y]                     mover el lápiz sin pintar
//   ["L", x, y]                     línea recta
//   ["Q", cx, cy, x, y]             curva con un punto de control
//   ["C", c1x, c1y, c2x, c2y, x, y] curva con dos puntos de control
//   ["Z"]                           cerrar la figura

/** Generador pseudoaleatorio (mulberry32): misma semilla, misma serie de números entre 0 y 1. */
export function crearAzar(semilla) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla nueva para un elemento recién creado. */
export function nuevaSemilla() {
  return Math.floor(Math.random() * 2 ** 31);
}

/**
 * Órdenes de dibujo de un elemento:
 *   relleno: silueta exacta para pintar el relleno (o null)
 *   trazo:   líneas a mano del contorno
 *   punta:   la punta de una flecha (se pinta aparte para que nunca sea discontinua)
 */
export function trazadosDe(el) {
  // Se crea el generador en cada dibujo para que empiece siempre por el mismo número.
  const azar = crearAzar(el.semilla);
  // Una línea discontinua repasada dos veces queda confusa: se dibuja una sola pasada.
  const pasadas = el.linea === "discontinua" ? 1 : 2;

  if (el.tipo === "rectangulo" || el.tipo === "rombo") {
    return { relleno: contornoExacto(el), trazo: poligonoAMano(esquinas(el), azar, pasadas), punta: null };
  }
  if (el.tipo === "elipse") {
    const cx = el.x + el.ancho / 2;
    const cy = el.y + el.alto / 2;
    const trazo = [];
    for (let i = 0; i < pasadas; i++) trazo.push(...pasadaDeElipse(cx, cy, el.ancho / 2, el.alto / 2, azar));
    return { relleno: contornoExacto(el), trazo, punta: null };
  }
  if (el.tipo === "flecha") {
    const trazo = lineaAMano(el.x1, el.y1, el.x2, el.y2, azar, pasadas);
    return { relleno: null, trazo, punta: puntaDeFlecha(el, azar, pasadas) };
  }
  return { relleno: null, trazo: [], punta: null }; // el texto no tiene trazo
}

/** Silueta geométrica exacta (sin temblor): se usa para el relleno y para resaltar formas. */
export function contornoExacto(el) {
  if (el.tipo === "elipse") return elipseExacta(el.x + el.ancho / 2, el.y + el.alto / 2, el.ancho / 2, el.alto / 2);
  const puntos = esquinas(el);
  return [["M", ...puntos[0]], ...puntos.slice(1).map((p) => ["L", ...p]), ["Z"]];
}

/** Pasa las órdenes a un contexto de <canvas>. Después hay que llamar a fill() o stroke(). */
export function trazarEnCanvas(ctx, ordenes) {
  ctx.beginPath();
  for (const o of ordenes) {
    if (o[0] === "M") ctx.moveTo(o[1], o[2]);
    else if (o[0] === "L") ctx.lineTo(o[1], o[2]);
    else if (o[0] === "Q") ctx.quadraticCurveTo(o[1], o[2], o[3], o[4]);
    else if (o[0] === "C") ctx.bezierCurveTo(o[1], o[2], o[3], o[4], o[5], o[6]);
    else if (o[0] === "Z") ctx.closePath();
  }
}

/** Pasa las órdenes al atributo "d" de un <path> de SVG (con 2 decimales para que pese poco). */
export function ordenesASVG(ordenes) {
  return ordenes.map(([letra, ...numeros]) => letra + numeros.map((n) => Math.round(n * 100) / 100).join(" ")).join(" ");
}

/** Órdenes del logo de Trazo (dos cuadraditos unidos por una línea ondulada) en una caja de 64 × 64. */
export function trazadosDelLogo() {
  const azar = crearAzar(2024); // semilla fija: el logo sale siempre igual
  const cuadrados = [
    ...poligonoAMano([[6, 26], [20, 26], [20, 40], [6, 40]], azar, 2),
    ...poligonoAMano([[44, 24], [58, 24], [58, 38], [44, 38]], azar, 2),
  ];
  const onda = [...ondaAMano(20, 33, 44, 31, azar), ...ondaAMano(20, 33, 44, 31, azar)];
  return { cuadrados, onda };
}

// ---------------------------------------------------------------------------
// Piezas internas
// ---------------------------------------------------------------------------

// Esquinas de un rectángulo o de un rombo (los rombos tienen las esquinas en el centro de cada lado).
function esquinas(el) {
  const { x, y, ancho: w, alto: h } = el;
  if (el.tipo === "rombo") return [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]];
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

// Número entre -d y d.
function desvio(azar, d) {
  return (azar() * 2 - 1) * d;
}

// Una pasada de línea a mano: los extremos se mueven un poco y el centro se "comba".
function pasadaDeLinea(x1, y1, x2, y2, azar) {
  const largo = Math.hypot(x2 - x1, y2 - y1) || 1;
  const d = Math.min(2.4, 0.5 + largo / 160); // en líneas largas se nota más el pulso, pero con tope
  const comba = desvio(azar, Math.min(largo * 0.03, 4));
  // Vector perpendicular a la línea (de largo 1), para combar hacia un lado.
  const nx = -(y2 - y1) / largo;
  const ny = (x2 - x1) / largo;
  const t = 0.35 + azar() * 0.3; // el punto de control no siempre está en el centro exacto
  const cx = x1 + (x2 - x1) * t + nx * comba + desvio(azar, d);
  const cy = y1 + (y2 - y1) * t + ny * comba + desvio(azar, d);
  return [
    ["M", x1 + desvio(azar, d * 0.7), y1 + desvio(azar, d * 0.7)],
    ["Q", cx, cy, x2 + desvio(azar, d * 0.7), y2 + desvio(azar, d * 0.7)],
  ];
}

/** Línea a mano entre dos puntos, repasada las veces indicadas. */
export function lineaAMano(x1, y1, x2, y2, azar, pasadas = 2) {
  const ordenes = [];
  for (let i = 0; i < pasadas; i++) ordenes.push(...pasadaDeLinea(x1, y1, x2, y2, azar));
  return ordenes;
}

// Un polígono cerrado (rectángulo, rombo) lado a lado.
function poligonoAMano(puntos, azar, pasadas) {
  const ordenes = [];
  puntos.forEach(([ax, ay], i) => {
    const [bx, by] = puntos[(i + 1) % puntos.length];
    ordenes.push(...lineaAMano(ax, ay, bx, by, azar, pasadas));
  });
  return ordenes;
}

// Una vuelta de elipse a mano: 10 puntos alrededor con el radio un poco alterado,
// unidos por curvas suaves que pasan entre ellos.
function pasadaDeElipse(cx, cy, rx, ry, azar) {
  const n = 10;
  const inicio = azar() * Math.PI * 2; // cada pasada empieza en un sitio distinto
  const d = Math.min(3, 0.6 + Math.max(rx, ry) * 0.03);
  const puntos = [];
  for (let i = 0; i < n; i++) {
    const angulo = inicio + (i / n) * Math.PI * 2;
    // 1,025: las curvas suaves "recortan" un poco la figura; así compensamos.
    puntos.push([
      cx + Math.cos(angulo) * (rx * 1.025 + desvio(azar, d)),
      cy + Math.sin(angulo) * (ry * 1.025 + desvio(azar, d)),
    ]);
  }
  const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const ordenes = [["M", ...medio(puntos[n - 1], puntos[0])]];
  for (let i = 0; i < n; i++) {
    const p = puntos[i];
    ordenes.push(["Q", p[0], p[1], ...medio(p, puntos[(i + 1) % n])]);
  }
  return ordenes;
}

// Elipse exacta con 4 curvas (0,5523 es la constante que hace que parezca un círculo perfecto).
function elipseExacta(cx, cy, rx, ry) {
  const k = 0.5523;
  return [
    ["M", cx + rx, cy],
    ["C", cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry],
    ["C", cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy],
    ["C", cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry],
    ["C", cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy],
    ["Z"],
  ];
}

// Punta de flecha: dos rayitas que salen del extremo final hacia atrás.
function puntaDeFlecha(el, azar, pasadas) {
  const dx = el.x2 - el.x1;
  const dy = el.y2 - el.y1;
  const largo = Math.hypot(dx, dy);
  if (largo < 1) return null;
  const tamano = Math.min(largo * 0.4, 10 + el.grosor * 3);
  const angulo = Math.atan2(dy, dx);
  const abertura = Math.PI / 7; // unos 25 grados a cada lado
  const ordenes = [];
  for (const lado of [-1, 1]) {
    const a = angulo + Math.PI + lado * abertura;
    ordenes.push(...lineaAMano(el.x2, el.y2, el.x2 + Math.cos(a) * tamano, el.y2 + Math.sin(a) * tamano, azar, pasadas));
  }
  return ordenes;
}

// Línea ondulada del logo: una ola hacia arriba y otra hacia abajo.
function ondaAMano(x1, y1, x2, y2, azar) {
  const j = () => desvio(azar, 0.8);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return [
    ["M", x1 + j(), y1 + j()],
    ["Q", (x1 + mx) / 2 + j(), my - 10 + j(), mx + j(), my + j()],
    ["Q", (mx + x2) / 2 + j(), my + 10 + j(), x2 + j(), y2 + j()],
  ];
}
