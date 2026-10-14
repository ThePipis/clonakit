// Los bloques de un email (título, texto, imagen...) y cómo se convierten en el
// HTML final. Los emails se maquetan con tablas y estilos "en línea"
// (style="..." en cada etiqueta) porque muchos programas de correo ignoran las
// hojas de estilo y el diseño moderno con flex o grid.

import { estado, todosLosCampos, valorCampo } from "./estado.js";
import { formatoFecha } from "./ui.js";

// Cada tipo de bloque con su nombre, su icono y sus propiedades iniciales.
export const TIPOS_BLOQUE = {
  titulo: { nombre: "Título", icono: "titulo", props: () => ({ html: "Escribe aquí tu título", alineacion: "left", color: "#2A2124", tamano: 28 }) },
  texto: { nombre: "Texto", icono: "texto", props: () => ({ html: "Escribe aquí tu mensaje.", alineacion: "left", color: "#3D3236", tamano: 16 }) },
  imagen: { nombre: "Imagen", icono: "imagen", props: () => ({ url: "", alt: "", ancho: 100, alineacion: "center", enlace: "" }) },
  boton: { nombre: "Botón", icono: "boton", props: () => ({ texto: "Ver más", url: "https://", fondo: "#E3A23B", colorTexto: "#2A2124", alineacion: "center" }) },
  separador: { nombre: "Separador", icono: "separador", props: () => ({ color: "#E6DCD2", grosor: 1 }) },
  espacio: { nombre: "Espacio", icono: "espacio", props: () => ({ altura: 24 }) },
  pie: { nombre: "Pie legal", icono: "pie", props: () => ({ texto: "Recibes este email porque te apuntaste a nuestra lista.", alineacion: "center" }) },
};

export function bloqueNuevo(tipo) {
  return { id: `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, tipo, props: TIPOS_BLOQUE[tipo].props() };
}

// Ancho útil del email: 600 px menos 32 px de margen a cada lado.
export const ANCHO_EMAIL = 600;
export const ANCHO_UTIL = ANCHO_EMAIL - 64;

// ---------- Seguridad ----------
export function escaparHTML(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Solo dejamos enlaces web, de correo, de teléfono o campos variables.
export function urlSegura(url) {
  const u = String(url ?? "").trim();
  return /^(https?:\/\/|mailto:|tel:|#|\{\{)/i.test(u) ? u : "";
}

export function colorSeguro(color, porDefecto) {
  return /^#[0-9a-f]{3,8}$/i.test(String(color ?? "")) ? color : porDefecto;
}

const numero = (valor, min, max, porDefecto) => {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : porDefecto;
};

// Limpia el HTML que sale de un texto editable: solo deja negrita, cursiva,
// subrayado, saltos de línea y enlaces. Así no se cuela nada raro al pegar.
export function limpiarHTML(html) {
  const plantilla = document.createElement("template");
  plantilla.innerHTML = String(html ?? ""); // una <template> no ejecuta ni carga nada
  const salida = document.createElement("div");
  const copiar = (origen, destino) => {
    for (const nodo of origen.childNodes) {
      if (nodo.nodeType === Node.TEXT_NODE) destino.append(nodo.textContent);
      if (nodo.nodeType !== Node.ELEMENT_NODE) continue;
      const etiqueta = nodo.tagName.toLowerCase();
      if (etiqueta === "br") destino.append(document.createElement("br"));
      else if (["b", "strong", "i", "em", "u"].includes(etiqueta)) {
        const nuevo = document.createElement({ strong: "b", em: "i" }[etiqueta] ?? etiqueta);
        copiar(nodo, nuevo);
        destino.append(nuevo);
      } else if (etiqueta === "a" && urlSegura(nodo.getAttribute("href"))) {
        const enlace = document.createElement("a");
        enlace.setAttribute("href", urlSegura(nodo.getAttribute("href")));
        copiar(nodo, enlace);
        destino.append(enlace);
      } else if (etiqueta === "div" || etiqueta === "p") {
        // Un párrafo nuevo se convierte en salto de línea.
        if (destino.childNodes.length && destino.lastChild?.nodeName !== "BR") destino.append(document.createElement("br"));
        copiar(nodo, destino);
      } else if (!["script", "style", "template", "iframe", "object"].includes(etiqueta)) {
        copiar(nodo, destino); // cualquier otra etiqueta: nos quedamos solo con su texto
      }
    }
  };
  copiar(plantilla.content, salida);
  // El navegador convierte algunos espacios en "&nbsp;" mientras se escribe;
  // entre dos palabras lo devolvemos a un espacio normal.
  return salida.innerHTML.replace(/([^\s>;])&nbsp;(?=[^\s<&])/g, "$1 ").replace(/(<br>)+$/, "");
}

// ---------- Campos variables ----------
// {{nombre}}, {{email}}, {{alta}} y la clave de cada campo personalizado.
export function variablesDisponibles() {
  return todosLosCampos().map((c) => ({ clave: c.clave, nombre: c.nombre }));
}

// Cambia {{clave}} por el dato del contacto. Sin contacto, deja las llaves tal
// cual: así el servicio de envío podrá rellenarlas más adelante.
export function sustituir(texto, contacto, { comoHTML = true } = {}) {
  if (!contacto) return String(texto ?? "");
  return String(texto ?? "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (todo, clave) => {
    const campo = todosLosCampos().find((c) => c.clave === clave.toLowerCase());
    if (!campo) return todo;
    const valor = campo.tipo === "fecha" ? formatoFecha(valorCampo(contacto, campo.id)) : valorCampo(contacto, campo.id);
    return comoHTML ? escaparHTML(valor) : valor;
  });
}

// ---------- HTML final ----------
const FUENTE = "Helvetica, Arial, sans-serif";
const FUENTE_TITULO = "Georgia, 'Times New Roman', serif";

function celda(contenido, { arriba = 8, abajo = 8, alineacion = "left" } = {}) {
  return `<tr><td class="relleno" align="${alineacion}" style="padding:${arriba}px 32px ${abajo}px 32px;text-align:${alineacion};">${contenido}</td></tr>`;
}

function htmlBloque(bloque, remitente, contacto) {
  const p = bloque.props;
  const alineacion = ["left", "center", "right"].includes(p.alineacion) ? p.alineacion : "left";
  switch (bloque.tipo) {
    case "titulo":
      return celda(`<h1 style="margin:0;font-family:${FUENTE_TITULO};font-size:${numero(p.tamano, 16, 56, 28)}px;line-height:1.25;font-weight:bold;color:${colorSeguro(p.color, "#2A2124")};">${sustituir(limpiarHTML(p.html), contacto)}</h1>`, { arriba: 24, abajo: 8, alineacion });
    case "texto":
      return celda(`<div style="font-family:${FUENTE};font-size:${numero(p.tamano, 12, 28, 16)}px;line-height:1.6;color:${colorSeguro(p.color, "#3D3236")};">${sustituir(limpiarHTML(p.html), contacto)}</div>`, { alineacion });
    case "imagen": {
      if (!urlSegura(p.url)) return "";
      const ancho = Math.round((ANCHO_UTIL * numero(p.ancho, 10, 100, 100)) / 100);
      const imagen = `<img src="${escaparHTML(urlSegura(p.url))}" alt="${escaparHTML(p.alt)}" width="${ancho}" style="width:${ancho}px;max-width:100%;height:auto;border:0;display:inline-block;">`;
      const enlace = urlSegura(p.enlace);
      return celda(enlace ? `<a href="${escaparHTML(sustituir(enlace, contacto, { comoHTML: false }))}">${imagen}</a>` : imagen, { arriba: 12, abajo: 12, alineacion });
    }
    case "boton": {
      const fondo = colorSeguro(p.fondo, "#E3A23B");
      const href = escaparHTML(sustituir(urlSegura(p.url) || "#", contacto, { comoHTML: false }));
      return celda(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${alineacion}"><tr><td bgcolor="${fondo}" style="border-radius:8px;background:${fondo};"><a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${FUENTE};font-size:16px;font-weight:bold;color:${colorSeguro(p.colorTexto, "#2A2124")};text-decoration:none;border-radius:8px;">${escaparHTML(sustituir(p.texto, contacto, { comoHTML: false }))}</a></td></tr></table>`, { arriba: 16, abajo: 16, alineacion });
    }
    case "separador":
      return celda(`<div style="border-top:${numero(p.grosor, 1, 8, 1)}px solid ${colorSeguro(p.color, "#E6DCD2")};font-size:0;line-height:0;">&nbsp;</div>`, { arriba: 16, abajo: 16 });
    case "espacio": {
      const alto = numero(p.altura, 4, 160, 24);
      return `<tr><td style="height:${alto}px;line-height:${alto}px;font-size:0;">&nbsp;</td></tr>`;
    }
    case "pie": {
      const negocio = escaparHTML(remitente.negocio || "[Nombre de tu negocio]");
      const direccion = escaparHTML(remitente.direccion || "[Dirección postal]");
      const baja = escaparHTML(urlSegura(remitente.enlaceBaja) || "#");
      return celda(`<div style="font-family:${FUENTE};font-size:12px;line-height:1.6;color:#8A7B74;">${escaparHTML(sustituir(p.texto, contacto, { comoHTML: false }))}<br><strong style="color:#5E5054;">${negocio}</strong> · ${direccion}<br><a href="${baja}" style="color:#6B2737;text-decoration:underline;">Darse de baja</a></div>`, { arriba: 24, abajo: 28, alineacion });
    }
    default:
      return "";
  }
}

// Documento HTML completo del email. Con "contacto" rellena los campos variables.
// vistaPrevia: true abre los enlaces en otra pestaña (solo para la vista previa).
export function htmlDelEmail(email, { contacto = null, vistaPrevia = false } = {}) {
  const remitente = estado.remitente;
  const asunto = escaparHTML(sustituir(email.asunto, contacto, { comoHTML: false }));
  const preheader = escaparHTML(sustituir(email.vistaPrevia, contacto, { comoHTML: false }));
  const filas = email.bloques.map((b) => htmlBloque(b, remitente, contacto)).filter(Boolean).join("\n");
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${asunto}</title>${vistaPrevia ? '\n<base target="_blank">' : ""}
<style>
  body { margin: 0; padding: 0; }
  img { -ms-interpolation-mode: bicubic; }
  @media (max-width: 480px) { .relleno { padding-left: 20px !important; padding-right: 20px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:#F3ECE3;">
<!-- Hecho con Embudo -->
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3ECE3;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="${ANCHO_EMAIL}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${ANCHO_EMAIL}px;background:#FFFFFF;border-radius:12px;">
${filas}
</table>
</td></tr>
</table>
</body>
</html>`;
}
