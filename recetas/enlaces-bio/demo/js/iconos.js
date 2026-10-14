// Iconos propios dibujados a mano en SVG (24 × 24).
// Son genéricos a propósito: no usamos logotipos de redes sociales ni de otras marcas.
// Se guardan como texto para poder meterlos tanto en el editor como en la página exportada.

// Trazos de cada icono. Todos se pintan con "currentColor", así toman el color del texto del botón.
const TRAZOS = {
  web: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  tienda: '<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2"/>',
  correo: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7.5 8 6 8-6"/>',
  telefono: '<path d="M6.6 3.5h2.8l1.6 4-2.1 1.4a11 11 0 0 0 6.2 6.2l1.4-2.1 4 1.6v2.8a2 2 0 0 1-2.1 2A16 16 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z"/>',
  chat: '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M8 9.5h8M8 12.5h5"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  musica: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  foto: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  documento: '<path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4M8.5 12h7M8.5 16h7"/>',
  mapa: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  estrella: '<path d="m12 3.2 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.4-4.2 6-.9z"/>',
};

// Lista ordenada con su nombre en español: es lo que se ve en la rejilla de iconos.
export const ICONOS = [
  { id: "ninguno", nombre: "Ninguno" },
  { id: "web", nombre: "Web" },
  { id: "tienda", nombre: "Tienda" },
  { id: "calendario", nombre: "Calendario" },
  { id: "correo", nombre: "Correo" },
  { id: "telefono", nombre: "Teléfono" },
  { id: "chat", nombre: "Chat" },
  { id: "video", nombre: "Vídeo" },
  { id: "musica", nombre: "Música" },
  { id: "foto", nombre: "Foto" },
  { id: "documento", nombre: "Documento" },
  { id: "mapa", nombre: "Mapa" },
  { id: "estrella", nombre: "Estrella" },
];

export const ID_ICONOS = ICONOS.map((icono) => icono.id);

// Devuelve el <svg> de un icono como texto, o "" si es "ninguno" o no existe.
export function svgIcono(id, tamano = 22) {
  const trazos = TRAZOS[id];
  if (!trazos) return "";
  return (
    `<svg width="${tamano}" height="${tamano}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trazos}</svg>`
  );
}

// Icono "ninguno" para la rejilla: un círculo tachado.
export const SVG_NINGUNO =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m6.5 17.5 11-11"/></svg>';

// Logo de MiEnlace: dos eslabones de cadena que, cruzados, dibujan un corazón.
export function svgLogo(tamano = 32, color = "#F07F3C") {
  return (
    `<svg width="${tamano}" height="${tamano}" viewBox="0 0 32 32" fill="none" stroke="${color}" ` +
    'stroke-width="3" aria-hidden="true">' +
    '<rect x="7.5" y="4.5" width="11" height="21" rx="5.5" transform="rotate(-45 13 15)"/>' +
    '<rect x="13.5" y="4.5" width="11" height="21" rx="5.5" transform="rotate(45 19 15)"/>' +
    "</svg>"
  );
}
