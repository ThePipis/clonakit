// iconos.js — Iconos SVG dibujados a mano (sin librerías externas) y el logo de Corrillo.
// Usan currentColor: toman el color del texto que los rodea, así se adaptan solos al fondo.

const TRAZOS = {
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  volver: '<path d="M15 18l-6-6 6-6"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
  derecha: '<path d="m9 6 6 6-6 6"/>',
  emoji: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/>',
  hilo: '<path d="M20 11.5a7.5 7.5 0 0 1-10.8 6.7L4 19.5l1.4-4.4A7.5 7.5 0 1 1 20 11.5z"/><path d="M8.5 10h7M8.5 13h4.5"/>',
  editar: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
  borrar: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5A.5.5 0 0 1 9.5 4h5a.5.5 0 0 1 .5.5V7"/>',
  negrita: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  cursiva: '<path d="M10 5h8M6 19h8M14.5 5l-5 14"/>',
  enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  enviar: '<path d="M21 3 10 14"/><path d="M21 3 14.5 21l-4.5-7-7-4.5z"/>',
  archivar: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4"/>',
  equipo: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14a6 6 0 0 1 3 6"/>',
  descargar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  subir: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  aviso: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
};

export function icono(nombre, clase = "") {
  return `<svg class="icono ${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAZOS[nombre] ?? ""}</svg>`;
}

// Logo: dos bocadillos superpuestos. El de delante (claro) dibuja una "C" abierta hacia el bocadillo coral.
export function logo(clase = "") {
  return `<svg class="logo ${clase}" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M22 4h8a7 7 0 0 1 7 7v5a7 7 0 0 1-5 6.7V28l-5.2-4.6H22a7 7 0 0 1-7-7V11a7 7 0 0 1 7-7z" fill="#F07B5A"/>
    <path d="M24.4 16.6A10 10 0 1 0 24.4 29.4" fill="none" stroke="currentColor" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M6.2 28.6 3.6 37.4l8.8-4.6z" fill="currentColor"/>
  </svg>`;
}

// Pinta los iconos y logos que el HTML marca con data-icono="nombre" o data-logo.
export function pintarIconos(raiz = document) {
  raiz.querySelectorAll("[data-icono]").forEach((hueco) => {
    hueco.outerHTML = icono(hueco.dataset.icono, hueco.className);
  });
  raiz.querySelectorAll("[data-logo]").forEach((hueco) => {
    hueco.outerHTML = logo(hueco.className);
  });
}
