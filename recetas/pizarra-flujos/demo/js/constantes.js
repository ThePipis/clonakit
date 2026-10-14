// Valores fijos de Trazo: colores de la identidad, medidas y nombres que usan varios archivos.
// Tenerlos en un solo sitio permite cambiar el aspecto de la app tocando solo este archivo.

/** Las 8 herramientas, en el orden de sus atajos de teclado (1 a 8). */
export const HERRAMIENTAS = ["seleccionar", "mano", "rectangulo", "rombo", "elipse", "flecha", "texto", "goma"];

/** Herramientas que crean algo nuevo: con ellas activas se muestra el panel de estilo. */
export const HERRAMIENTAS_DE_DIBUJO = ["rectangulo", "rombo", "elipse", "flecha", "texto"];

/** Tipos de elemento que son "formas": se pueden rellenar y las flechas se enganchan a ellas. */
export const FORMAS = ["rectangulo", "rombo", "elipse"];

// Colores de la identidad (sección 8 de la ficha).
export const TINTA = "#1E2A3A";
export const ACENTO = "#C8553D";

export const PALETA = [
  { nombre: "Tinta", color: "#1E2A3A" },
  { nombre: "Terracota", color: "#C8553D" },
  { nombre: "Salvia", color: "#5B8C5A" },
  { nombre: "Azul mar", color: "#2F6690" },
  { nombre: "Mostaza", color: "#D4A017" },
  { nombre: "Gris", color: "#8A8F98" },
];

/** Grosores de línea en píxeles: fino, medio y grueso. */
export const GROSORES = [1, 2, 4];

// Cada tema dice cómo se ve el lienzo. La tinta cambia en modo oscuro porque
// el azul noche no se vería sobre fondo oscuro; los demás colores se mantienen.
export const TEMAS = {
  claro: {
    fondo: "#FBF7EE",
    tinta: "#1E2A3A",
    baseRelleno: "#FFFFFF", // los rellenos son el color mezclado con blanco: tonos muy claros
    fuerzaRelleno: 0.2,
    puntos: "rgba(30, 42, 58, 0.18)",
  },
  oscuro: {
    fondo: "#1B1E24",
    tinta: "#E9E4D8",
    baseRelleno: "#1B1E24", // en oscuro se mezcla con el fondo para que el relleno no deslumbre
    fuerzaRelleno: 0.3,
    puntos: "rgba(233, 228, 216, 0.16)",
  },
};

// Texto del dibujo: fuentes manuscritas que suelen venir con el sistema (Windows, Mac),
// con "cursive" como respaldo. Así no hay que descargar ninguna fuente.
export const FUENTE_DIBUJO = "'Segoe Print', 'Bradley Hand', 'Chalkboard SE', 'Comic Sans MS', 'Marker Felt', cursive";
export const TAMANO_TEXTO = 20; // en píxeles del mundo (a zoom 100 %)
export const ALTO_LINEA = 1.25; // separación entre líneas, como múltiplo del tamaño

// Cámara
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;
/** Escalones de los botones + y − (de 10 % a 400 %). */
export const PASOS_ZOOM = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];

// Datos y archivos
export const CLAVE_GUARDADO = "trazo:dibujo"; // nombre del hueco en localStorage
export const VERSION_FORMATO = 1; // súbelo si cambia la forma de guardar los datos
export const MAX_HISTORIAL = 100; // pasos de deshacer
export const MARGEN_EXPORTAR = 24; // aire alrededor del dibujo al exportar
export const DESPLAZAMIENTO_DUPLICADO = 10;

/** Color con el que se ve un trazo en el tema actual (la tinta se aclara en modo oscuro). */
export function colorTrazo(color, tema) {
  return color.toUpperCase() === TINTA ? tema.tinta : color;
}

/** Relleno "suave": el color del trazo mezclado con la base del tema. */
export function colorRelleno(color, tema) {
  return mezclar(colorTrazo(color, tema), tema.baseRelleno, tema.fuerzaRelleno);
}

/** Patrón de guiones para la línea discontinua: más largo cuanto más gruesa es la línea. */
export function patronDiscontinuo(grosor) {
  return [grosor * 4 + 4, grosor * 3 + 6];
}

// Mezcla dos colores "#RRGGBB": fuerza 1 = solo el primero, 0 = solo el segundo.
function mezclar(color, base, fuerza) {
  const a = hexARgb(color);
  const b = hexARgb(base);
  const canal = (i) => Math.round(a[i] * fuerza + b[i] * (1 - fuerza));
  return `rgb(${canal(0)}, ${canal(1)}, ${canal(2)})`;
}

function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
