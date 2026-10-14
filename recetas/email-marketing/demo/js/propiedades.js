// Panel de propiedades del editor de emails: los controles cambian según el
// tipo de bloque elegido (alineación, colores, enlace, tamaño de imagen...).

import { estado } from "./estado.js";
import { TIPOS_BLOQUE } from "./bloques.js";
import { campo, h, icono } from "./ui.js";

// alCambiar(): se llama tras cada cambio para repintar el bloque y guardar.
export function panelPropiedades(bloque, { alCambiar, alCerrar }) {
  const p = bloque.props;
  const def = TIPOS_BLOQUE[bloque.tipo];

  // Atajos para crear controles enlazados a una propiedad del bloque.
  const texto = (clave, etiqueta, { ayuda, ...extra } = {}) => campo(etiqueta, h("input", { class: "entrada", type: "text", value: p[clave] ?? "", ...extra, oninput: (e) => { p[clave] = e.target.value; alCambiar(); } }), ayuda);
  const areaTexto = (clave, etiqueta) => campo(etiqueta, h("textarea", { class: "entrada", rows: 3, value: p[clave] ?? "", oninput: (e) => { p[clave] = e.target.value; alCambiar(); } }));
  const color = (clave, etiqueta) => {
    const muestra = h("span", { class: "color-valor" }, p[clave]);
    return h("label", { class: "campo campo-color" }, h("span", { class: "campo-etiqueta" }, etiqueta),
      h("span", { class: "color-fila" }, h("input", { type: "color", value: p[clave], "aria-label": etiqueta, oninput: (e) => { p[clave] = e.target.value; muestra.textContent = e.target.value; alCambiar(); } }), muestra));
  };
  const deslizador = (clave, etiqueta, min, max, unidad, paso = 1) => {
    const valor = h("output", { class: "deslizador-valor" }, `${p[clave]} ${unidad}`);
    return h("label", { class: "campo" }, h("span", { class: "campo-etiqueta campo-etiqueta-fila" }, etiqueta, valor),
      h("input", { type: "range", min, max, step: paso, value: p[clave], "aria-label": etiqueta, oninput: (e) => { p[clave] = Number(e.target.value); valor.textContent = `${p[clave]} ${unidad}`; alCambiar(); } }));
  };
  const alineacion = () => h("div", { class: "campo" }, h("span", { class: "campo-etiqueta" }, "Alineación"),
    h("div", { class: "segmentado segmentado-ancho", role: "radiogroup", "aria-label": "Alineación" },
      [["left", "Izquierda"], ["center", "Centro"], ["right", "Derecha"]].map(([valor, nombre]) => h("button", { type: "button", role: "radio", "aria-checked": String(p.alineacion === valor), class: p.alineacion === valor ? "activo" : "", onclick: (e) => {
        p.alineacion = valor;
        e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => { b.classList.toggle("activo", b === e.currentTarget); b.setAttribute("aria-checked", String(b === e.currentTarget)); });
        alCambiar();
      } }, nombre))));

  let controles;
  switch (bloque.tipo) {
    case "titulo":
    case "texto":
      controles = [
        h("p", { class: "nota-panel" }, icono("editar", 15), "Escribe directamente sobre el email. Ctrl/⌘ + B pone negrita."),
        alineacion(),
        color("color", "Color del texto"),
        deslizador("tamano", "Tamaño de letra", bloque.tipo === "titulo" ? 18 : 12, bloque.tipo === "titulo" ? 48 : 24, "px"),
      ];
      break;
    case "imagen":
      controles = [
        texto("url", "Dirección web de la imagen", { type: "url", placeholder: "https://…/foto.jpg", ayuda: "Súbela antes a tu web o a un servicio de imágenes." }),
        texto("alt", "Texto alternativo", { placeholder: "Describe la imagen", ayuda: "Lo leen los lectores de pantalla y se ve si la imagen no carga." }),
        deslizador("ancho", "Tamaño de la imagen", 20, 100, "%", 5),
        alineacion(),
        texto("enlace", "Enlace al pulsarla (opcional)", { type: "url", placeholder: "https://" }),
      ];
      break;
    case "boton":
      controles = [
        texto("texto", "Texto del botón", { "data-variables": "" }),
        texto("url", "Dirección del enlace", { type: "url", placeholder: "https://tu-web.com/catalogo" }),
        color("fondo", "Color del botón"),
        color("colorTexto", "Color del texto"),
        alineacion(),
      ];
      break;
    case "separador":
      controles = [color("color", "Color de la línea"), deslizador("grosor", "Grosor", 1, 6, "px")];
      break;
    case "espacio":
      controles = [deslizador("altura", "Altura", 8, 96, "px", 4)];
      break;
    case "pie": {
      const r = estado.remitente;
      controles = [
        areaTexto("texto", "Por qué recibe este email"),
        alineacion(),
        h("div", { class: "remitente-resumen" },
          h("h3", { class: "ficha-subtitulo" }, "Datos del remitente"),
          h("p", {}, r.negocio || h("em", { class: "tenue" }, "Falta el nombre del negocio")),
          h("p", {}, r.direccion || h("em", { class: "tenue" }, "Falta la dirección postal")),
          h("p", {}, r.enlaceBaja || h("em", { class: "tenue" }, "Falta el enlace de baja")),
          h("a", { href: "#/ajustes", class: "enlace" }, "Editar en Ajustes →")),
        h("p", { class: "nota-panel" }, icono("alerta", 15), "El pie legal es obligatorio: quién envía, su dirección y cómo darse de baja."),
      ];
      break;
    }
    default:
      controles = [];
  }

  return h("div", { class: "panel-propiedades" },
    h("div", { class: "panel-propiedades-cabecera" },
      h("span", { class: "panel-propiedades-icono" }, icono(def.icono, 18)),
      h("h2", { class: "zona-titulo" }, def.nombre),
      h("button", { type: "button", class: "boton-icono cerrar-propiedades", "aria-label": "Cerrar propiedades", title: "Listo", onclick: alCerrar }, icono("cerrar", 16))),
    controles);
}
