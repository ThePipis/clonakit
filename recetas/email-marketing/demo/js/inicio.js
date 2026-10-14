// Portada: qué es Embudo, qué NO hace esta versión y cuánto hay de verdad
// (sin números de ejemplo: solo se cuenta lo que existe en este navegador).

import { estado, contarEtiquetas } from "./estado.js";
import { boton, formatoNumero, h, icono } from "./ui.js";

let raizInicio = null;

export const vistaInicio = {
  actualizar() {
    if (raizInicio) vistaInicio.pintar(raizInicio);
  },
  pintar(raiz) {
    raizInicio = raiz;
    const etiquetas = contarEtiquetas().size;
    const secciones = [
      { ruta: "contactos", icono: "contactos", titulo: "Contactos", cifra: estado.contactos.length, unidad: ["contacto", "contactos"], extra: `${formatoNumero(etiquetas)} ${etiquetas === 1 ? "etiqueta" : "etiquetas"}`, texto: "Importa tu CSV, limpia la lista y etiqueta." },
      { ruta: "segmentos", icono: "segmentos", titulo: "Segmentos", cifra: estado.segmentos.length, unidad: ["segmento", "segmentos"], texto: "Decide a quién escribir con filtros guardados." },
      { ruta: "emails", icono: "emails", titulo: "Emails", cifra: estado.emails.length, unidad: ["email", "emails"], texto: "Maqueta por bloques y exporta el HTML." },
      { ruta: "automatizaciones", icono: "automatizaciones", titulo: "Automatizaciones", cifra: estado.automatizaciones.length, unidad: ["automatización", "automatizaciones"], texto: "Dibuja tus secuencias y pruébalas." },
    ];
    const empezado = secciones.some((s) => s.cifra > 0);

    raiz.replaceChildren(
      h("section", { class: "portada" },
        h("div", { class: "portada-texto" },
          h("p", { class: "antetitulo" }, "Taller de email marketing"),
          h("h1", { class: "portada-titulo" }, "Prepara tu email marketing con calma, ", h("em", {}, "en tu navegador.")),
          h("p", { class: "portada-entradilla" }, "Ordena tus contactos, agrúpalos en segmentos, diseña tus emails por bloques y dibuja tus automatizaciones. Cuando estés listo, lo exportas todo para conectarlo a un servicio de envío."),
          h("div", { class: "fila-botones" },
            boton(empezado ? "Ir a mis contactos" : "Importar mis contactos", () => (location.hash = "#/contactos"), { clase: "primario", icono: empezado ? "contactos" : "importar" }),
            boton("Diseñar un email", () => (location.hash = "#/emails"), { icono: "emails" }))),
        h("div", { class: "portada-dibujo", "aria-hidden": "true" },
          h("span", { class: "linea-embudo l1" }), h("span", { class: "linea-embudo l2" }), h("span", { class: "linea-embudo l3" }),
          h("span", { class: "sobre s1" }, icono("emails", 22)), h("span", { class: "sobre s2" }, icono("emails", 18)), h("span", { class: "sobre s3" }, icono("emails", 16)))),

      h("div", { class: "rejilla-portada" }, secciones.map((s) => h("a", { class: "tarjeta tarjeta-enlace tarjeta-seccion", href: `#/${s.ruta}` },
        h("span", { class: "tarjeta-seccion-icono" }, icono(s.icono, 22)),
        h("h2", {}, s.titulo),
        h("p", { class: "cifra-grande" }, h("strong", {}, formatoNumero(s.cifra)), ` ${s.cifra === 1 ? s.unidad[0] : s.unidad[1]}`, s.extra ? h("span", { class: "tenue" }, ` · ${s.extra}`) : null),
        h("p", { class: "tenue" }, s.texto)))),

      h("section", { class: "tarjeta aviso-version" },
        h("div", { class: "aviso-version-icono" }, icono("alerta", 22)),
        h("div", {},
          h("h2", {}, "Lo que esta versión no hace"),
          h("ul", {},
            h("li", {}, h("strong", {}, "No envía emails."), " Los diseñas y los exportas en HTML; el envío real se conecta más adelante con un servicio como Resend o Brevo."),
            h("li", {}, h("strong", {}, "No mide aperturas, clics ni ventas."), " Esos datos solo existen cuando hay envíos reales, así que aquí no verás gráficas inventadas."),
            h("li", {}, h("strong", {}, "No ejecuta las automatizaciones."), " Las dibujas, las pruebas con un contacto y las exportas en .json para montarlas después.")))),

      h("p", { class: "pie-portada" }, icono("candado", 15), h("span", {}, "Tus datos están solo en este navegador. Haz copias de seguridad en ", h("a", { href: "#/ajustes" }, "Ajustes"), ".")));
  },
};
