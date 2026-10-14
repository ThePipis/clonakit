// Genera la página final (el index.html que se publica) como un texto.
// La MISMA función alimenta la vista previa y la descarga: así lo que ves es exactamente lo que publicas.
// La página no lleva JavaScript: solo HTML y estilos, para que sea ligera, segura y funcione en cualquier sitio.

import { svgIcono } from "./iconos.js";
import { normalizarDireccion } from "./direcciones.js";
import { buscarForma, buscarLetra, colorBorde, colorTextoPagina } from "./temas.js";

// Convierte los caracteres especiales de HTML en texto inofensivo.
// Sin esto, alguien podría escribir "<script>" en su bio y se ejecutaría en la página publicada.
export function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Enlaces que de verdad salen en la página: visibles, con título y con una dirección válida.
export function enlacesPublicables(estado) {
  return estado.enlaces
    .filter((enlace) => enlace.visible && enlace.titulo.trim())
    .map((enlace) => ({ ...enlace, direccion: normalizarDireccion(enlace.url) }))
    .filter((enlace) => enlace.direccion.ok);
}

// Favicon (el iconito de la pestaña): un círculo con la inicial del nombre en los colores del tema.
function favicon(nombre, estilo) {
  const inicial = escaparHtml((nombre.trim()[0] || "★").toUpperCase());
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${estilo.boton}"/>` +
    `<text x="32" y="43" font-family="system-ui,sans-serif" font-size="32" font-weight="700" text-anchor="middle" fill="${estilo.textoBoton}">${inicial}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export function generarPagina(estado) {
  const { perfil, estilo } = estado;
  const nombre = perfil.nombre.trim();
  const bio = perfil.bio.trim();
  const titulo = nombre || "Mis enlaces";
  const descripcion = bio || (nombre ? `Todos los enlaces de ${nombre} en un solo sitio.` : "Todos mis enlaces en un solo sitio.");
  const textoPagina = colorTextoPagina(estilo.fondo);

  const foto = perfil.foto
    ? `<img class="foto" src="${escaparHtml(perfil.foto)}" alt="${escaparHtml(nombre ? "Foto de " + nombre : "Foto de perfil")}" width="112" height="112">`
    : "";

  const botones = enlacesPublicables(estado)
    .map((enlace) => {
      const icono = svgIcono(enlace.icono, 22);
      return (
        `      <li><a class="boton" href="${escaparHtml(enlace.direccion.href)}">` +
        `<span class="icono">${icono}</span><span class="texto">${escaparHtml(enlace.titulo.trim())}</span>` +
        `<span class="icono"></span></a></li>`
      );
    })
    .join("\n");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escaparHtml(titulo)}</title>
  <meta name="description" content="${escaparHtml(descripcion)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escaparHtml(titulo)}">
  <meta property="og:description" content="${escaparHtml(descripcion)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="${estilo.fondo}">
  <link rel="icon" href="${escaparHtml(favicon(nombre, estilo))}">
  <style>
    :root {
      --fondo: ${estilo.fondo};
      --texto: ${textoPagina};
      --boton: ${estilo.boton};
      --texto-boton: ${estilo.textoBoton};
      --borde-boton: ${colorBorde(estilo)};
      --radio: ${buscarForma(estilo.forma).radio};
      --letra: ${buscarLetra(estilo.letra).css};
    }
    * { box-sizing: border-box; }
    html { background: var(--fondo); }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 56px 20px 28px;
      background: var(--fondo);
      color: var(--texto);
      font-family: var(--letra);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .pagina { width: 100%; max-width: 560px; text-align: center; flex: 1; }
    .foto {
      display: block;
      width: 112px;
      height: 112px;
      margin: 0 auto 18px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 6px 24px rgba(0, 0, 0, .12);
    }
    h1 { margin: 0; font-size: 1.45rem; line-height: 1.25; font-weight: 700; overflow-wrap: anywhere; text-wrap: balance; }
    .bio { margin: 10px auto 0; max-width: 34em; font-size: 1rem; overflow-wrap: anywhere; text-wrap: pretty; }
    .enlaces { list-style: none; margin: 32px 0 0; padding: 0; display: grid; gap: 14px; }
    .boton {
      display: grid;
      grid-template-columns: 24px 1fr 24px;
      align-items: center;
      gap: 12px;
      min-height: 58px;
      padding: 12px 18px;
      border: 2px solid var(--borde-boton);
      border-radius: var(--radio);
      background: var(--boton);
      color: var(--texto-boton);
      font-weight: 600;
      font-size: 1.02rem;
      text-decoration: none;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .boton:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0, 0, 0, .14); }
    .boton:focus-visible { outline: 3px solid var(--texto); outline-offset: 3px; }
    .icono { display: flex; width: 24px; height: 24px; align-items: center; justify-content: center; }
    .texto { overflow-wrap: anywhere; }
    .firma { margin-top: 44px; font-size: .78rem; opacity: .7; }
    @media (prefers-reduced-motion: reduce) { .boton { transition: none; } .boton:hover { transform: none; } }
  </style>
</head>
<body>
  <main class="pagina">
    ${foto}
    ${nombre ? `<h1>${escaparHtml(nombre)}</h1>` : ""}
    ${bio ? `<p class="bio">${escaparHtml(bio)}</p>` : ""}
    <ul class="enlaces">
${botones}
    </ul>
  </main>
${estado.firma ? '  <footer class="firma">Hecho con MiEnlace</footer>\n' : ""}</body>
</html>
`;
}
