// Temas, formas de botón, tipos de letra y cálculo de contraste.

// Los 5 temas propios de MiEnlace. Cada uno trae colores, forma y letra para tener personalidad.
export const TEMAS = [
  { id: "arena", nombre: "Arena", fondo: "#F5EFE6", boton: "#2B2B2B", textoBoton: "#FFFFFF", forma: "redondeada", letra: "remates" },
  { id: "noche", nombre: "Noche", fondo: "#141824", boton: "#F2C46D", textoBoton: "#141824", forma: "pildora", letra: "sin-remates" },
  { id: "mar", nombre: "Mar", fondo: "#DDEFF2", boton: "#0F5563", textoBoton: "#FFFFFF", forma: "pildora", letra: "redondeada" },
  { id: "melocoton", nombre: "Melocotón", fondo: "#FFE8DC", boton: "#7A3E2B", textoBoton: "#FFFFFF", forma: "redondeada", letra: "redondeada" },
  // En "Mínimo" el botón es del mismo color que el fondo; por eso se le dibuja un borde (ver colorBorde).
  { id: "minimo", nombre: "Mínimo", fondo: "#FFFFFF", boton: "#FFFFFF", textoBoton: "#111111", forma: "recta", letra: "sin-remates" },
];

export const FORMAS = [
  { id: "redondeada", nombre: "Redondeados", radio: "14px" },
  { id: "pildora", nombre: "Píldora", radio: "999px" },
  { id: "recta", nombre: "Rectos", radio: "0" },
];

// Solo letras del sistema: no se descarga nada y la página carga al instante.
export const LETRAS = [
  { id: "sin-remates", nombre: "Sin remates", css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "remates", nombre: "Con remates", css: 'Georgia, "Times New Roman", serif' },
  { id: "redondeada", nombre: "Redondeada", css: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif' },
];

export function buscarForma(id) {
  return FORMAS.find((forma) => forma.id === id) || FORMAS[0];
}

export function buscarLetra(id) {
  return LETRAS.find((letra) => letra.id === id) || LETRAS[0];
}

// Copia los valores de un tema dentro del estilo guardado.
export function estiloDeTema(id) {
  const tema = TEMAS.find((t) => t.id === id) || TEMAS[0];
  return { fondo: tema.fondo, boton: tema.boton, textoBoton: tema.textoBoton, forma: tema.forma, letra: tema.letra };
}

// ¿Los colores actuales coinciden con algún tema? Sirve para marcar su muestra como activa.
export function temaActivo(estilo) {
  const igual = (a, b) => a.toLowerCase() === b.toLowerCase();
  const tema = TEMAS.find((t) => igual(t.fondo, estilo.fondo) && igual(t.boton, estilo.boton) && igual(t.textoBoton, estilo.textoBoton));
  return tema ? tema.id : null;
}

// ---------- Contraste (norma WCAG 2) ----------

// Luminancia relativa de un color #RRGGBB: cuánto "brilla" para el ojo, de 0 (negro) a 1 (blanco).
function luminancia(hex) {
  const canales = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canales.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Relación de contraste entre dos colores: de 1 (iguales) a 21 (negro sobre blanco).
export function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

// La norma pide al menos 4,5:1 para texto normal.
export const CONTRASTE_MINIMO = 4.5;

const TEXTO_OSCURO = "#1F1F23";
const TEXTO_CLARO = "#FFFFFF";

// El nombre y la bio no tienen selector propio: elegimos oscuro o claro según el fondo.
export function colorTextoPagina(fondo) {
  return contraste(TEXTO_OSCURO, fondo) >= contraste(TEXTO_CLARO, fondo) ? TEXTO_OSCURO : TEXTO_CLARO;
}

// El mejor color de texto (oscuro o claro) para un botón: lo usa el arreglo rápido del aviso.
export function mejorTextoPara(fondoBoton) {
  return contraste("#111111", fondoBoton) >= contraste(TEXTO_CLARO, fondoBoton) ? "#111111" : TEXTO_CLARO;
}

// Si el botón casi no se distingue del fondo (como en "Mínimo"), le ponemos un borde del color de su texto.
export function colorBorde(estilo) {
  return contraste(estilo.boton, estilo.fondo) < 1.5 ? estilo.textoBoton : estilo.boton;
}

// Formatea un número de contraste a la española: 4.5 -> "4,5".
export function formatoContraste(valor) {
  return valor.toFixed(1).replace(".", ",");
}
