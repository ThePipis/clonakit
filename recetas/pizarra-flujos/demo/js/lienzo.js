// Dibujo en <canvas>: la cuadrícula, los elementos y las ayudas visuales
// (selección, tiradores, recuadro y forma resaltada).
// `dibujarElemento` también la usa la exportación a PNG.

import { estado, seleccionados, buscar } from "./estado.js";
import { ACENTO, TEMAS, colorTrazo, colorRelleno, patronDiscontinuo } from "./constantes.js";
import { trazadosDe, contornoExacto, trazarEnCanvas } from "./trazo-a-mano.js";
import { limites, cajaEtiqueta, lineasDeTexto, fuente, tiradoresPara, normalizar } from "./geometria.js";

/** Tema (colores del lienzo) según la preferencia de modo oscuro. */
export function temaActual() {
  return estado.preferencias.oscuro ? TEMAS.oscuro : TEMAS.claro;
}

/** Ajusta el tamaño interno del canvas a la ventana y a la densidad de píxeles de la pantalla. */
export function ajustarTamano(canvas) {
  // En pantallas "retina" hay 2 o 3 píxeles reales por cada píxel CSS:
  // si no lo tenemos en cuenta, el dibujo se ve borroso.
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

/** Dibuja toda la pantalla. Se llama como mucho una vez por fotograma. */
export function dibujarPantalla(ctx) {
  const dpr = window.devicePixelRatio || 1;
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  const tema = temaActual();
  const { x, y, zoom } = estado.camara;

  // 1. Fondo y cuadrícula, en píxeles de pantalla.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = tema.fondo;
  ctx.fillRect(0, 0, ancho, alto);
  if (estado.preferencias.cuadricula) dibujarCuadricula(ctx, tema, ancho, alto);

  // 2. La "cámara": a partir de aquí dibujamos en coordenadas del mundo
  //    y setTransform se encarga del desplazamiento y el zoom.
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * x, dpr * y);

  // Parte del mundo que se ve, para no perder tiempo con lo que queda fuera.
  const margen = 50;
  const visible = { x1: -x / zoom - margen, y1: -y / zoom - margen, x2: (ancho - x) / zoom + margen, y2: (alto - y) / zoom + margen };
  for (const el of estado.elementos) {
    const b = limites(el);
    if (b.x2 < visible.x1 || b.x1 > visible.x2 || b.y2 < visible.y1 || b.y1 > visible.y2) continue;
    ctx.globalAlpha = estado.borrando.has(el.id) ? 0.25 : 1; // lo que la goma va a borrar se ve tenue
    // Mientras se escribe, el texto lo muestra el cuadro de edición, no el canvas.
    dibujarElemento(ctx, el, tema, el.id === estado.editando);
  }
  ctx.globalAlpha = 1;

  // 3. Ayudas visuales encima de todo.
  const resaltado = estado.resaltado && buscar(estado.resaltado);
  if (resaltado) dibujarResaltado(ctx, resaltado, zoom);
  if (!estado.editando) dibujarSeleccion(ctx, zoom);
  if (estado.recuadro) dibujarRecuadro(ctx, estado.recuadro, zoom);
}

/** Dibuja un elemento con los colores de `tema`. */
export function dibujarElemento(ctx, el, tema, ocultarTexto = false) {
  const color = colorTrazo(el.trazo, tema);
  if (el.tipo !== "texto") {
    const t = trazadosDe(el);
    if (t.relleno && el.relleno === "suave") {
      ctx.fillStyle = colorRelleno(el.trazo, tema);
      trazarEnCanvas(ctx, t.relleno);
      ctx.fill();
    }
    ctx.save();
    if (el.tipo === "flecha" && el.texto) recortarEtiqueta(ctx, el);
    ctx.strokeStyle = color;
    ctx.lineWidth = el.grosor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(el.linea === "discontinua" ? patronDiscontinuo(el.grosor) : []);
    trazarEnCanvas(ctx, t.trazo);
    ctx.stroke();
    if (t.punta) {
      ctx.setLineDash([]); // la punta siempre continua: discontinua no se entendería
      trazarEnCanvas(ctx, t.punta);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (el.texto && !ocultarTexto) dibujarTexto(ctx, el, color);
}

function dibujarTexto(ctx, el, color) {
  const { alinear, lineas } = lineasDeTexto(el);
  ctx.font = fuente(el.tamano);
  ctx.fillStyle = color;
  ctx.textAlign = alinear;
  ctx.textBaseline = "middle";
  for (const linea of lineas) ctx.fillText(linea.texto, linea.x, linea.y);
}

// Deja fuera de la zona de dibujo el hueco de la etiqueta, para que la línea
// de la flecha no tache el texto. La regla "evenodd" convierte el segundo
// rectángulo en un agujero dentro del primero.
function recortarEtiqueta(ctx, flecha) {
  const b = limites(flecha);
  const c = cajaEtiqueta(flecha);
  ctx.beginPath();
  ctx.rect(b.x1 - 100, b.y1 - 100, b.x2 - b.x1 + 200, b.y2 - b.y1 + 200);
  ctx.rect(c.x1, c.y1, c.x2 - c.x1, c.y2 - c.y1);
  ctx.clip("evenodd");
}

// Cuadrícula de puntos. Al alejar, los puntos se espacian para que no formen una mancha.
function dibujarCuadricula(ctx, tema, ancho, alto) {
  const { x, y, zoom } = estado.camara;
  let paso = 20 * zoom; // separación en píxeles de pantalla
  while (paso < 12) paso *= 2;
  const inicioX = ((x % paso) + paso) % paso;
  const inicioY = ((y % paso) + paso) % paso;
  const lado = 1.5;
  ctx.fillStyle = tema.puntos;
  for (let px = inicioX; px < ancho; px += paso) {
    for (let py = inicioY; py < alto; py += paso) ctx.fillRect(px - lado / 2, py - lado / 2, lado, lado);
  }
}

// Borde terracota alrededor de la forma a la que se va a enganchar una flecha.
function dibujarResaltado(ctx, forma, zoom) {
  const d = 5 / zoom;
  const ampliada = { ...forma, x: forma.x - d, y: forma.y - d, ancho: forma.ancho + 2 * d, alto: forma.alto + 2 * d };
  ctx.save();
  ctx.strokeStyle = ACENTO;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 3 / zoom;
  trazarEnCanvas(ctx, contornoExacto(ampliada));
  ctx.stroke();
  ctx.restore();
}

// Recuadro y tiradores de la selección. Los tamaños se dividen por el zoom
// para que en pantalla midan siempre lo mismo.
function dibujarSeleccion(ctx, zoom) {
  const sel = seleccionados();
  if (sel.length === 0) return;
  ctx.save();
  ctx.strokeStyle = ACENTO;
  ctx.lineWidth = 1.5 / zoom;

  if (sel.length === 1 && sel[0].tipo === "flecha") {
    // Una flecha sola: se marca su recorrido con una franja suave.
    const f = sel[0];
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = f.grosor + 8 / zoom;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(f.x1, f.y1);
    ctx.lineTo(f.x2, f.y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5 / zoom;
  } else if (sel.length > 1) {
    // Varios: cada uno con un contorno discontinuo fino.
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    const m = 3 / zoom;
    for (const el of sel) {
      const b = limites(el);
      ctx.strokeRect(b.x1 - m, b.y1 - m, b.x2 - b.x1 + 2 * m, b.y2 - b.y1 + 2 * m);
    }
    ctx.setLineDash([]);
  }

  const { caja, tiradores } = tiradoresPara(sel, zoom);
  if (caja) ctx.strokeRect(caja.x1, caja.y1, caja.x2 - caja.x1, caja.y2 - caja.y1);
  const lado = 8 / zoom;
  ctx.fillStyle = "#FFFFFF";
  for (const t of tiradores) {
    ctx.beginPath();
    if (t.redondo) ctx.arc(t.x, t.y, lado * 0.65, 0, Math.PI * 2);
    else ctx.rect(t.x - lado / 2, t.y - lado / 2, lado, lado);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function dibujarRecuadro(ctx, recuadro, zoom) {
  const r = normalizar(recuadro);
  ctx.save();
  ctx.fillStyle = "rgba(200, 85, 61, 0.08)";
  ctx.strokeStyle = ACENTO;
  ctx.lineWidth = 1 / zoom;
  ctx.fillRect(r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1);
  ctx.strokeRect(r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1);
  ctx.restore();
}
