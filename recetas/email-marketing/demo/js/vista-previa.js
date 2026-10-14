// Vista previa de un email (escritorio a 600 px y móvil a 375 px) y exportación
// del HTML. La vista previa usa un <iframe srcdoc>: una mini página aislada
// donde se pinta el HTML final, igual que lo vería un programa de correo.

import { estado } from "./estado.js";
import { htmlDelEmail, sustituir } from "./bloques.js";
import { abrirModal, aviso, copiarTexto, descargar, elegir, h, icono, slug } from "./ui.js";

const ANCHOS = { escritorio: 600, movil: 375 };

export function abrirVistaPrevia(email, modoInicial = "escritorio") {
  let modo = modoInicial;
  let contacto = null;

  // Elegir un contacto real para ver el email con sus datos.
  const contactos = [...estado.contactos].sort((a, b) => (a.nombre || a.email).localeCompare(b.nombre || b.email, "es")).slice(0, 1000);
  const selectorContacto = h("select", { class: "entrada", "aria-label": "Ver con los datos de", onchange: (e) => {
    contacto = estado.contactos.find((c) => c.id === e.target.value) ?? null;
    pintar();
  } }, h("option", { value: "" }, "Sin contacto (se ven los {{campos}})"), contactos.map((c) => h("option", { value: c.id }, c.nombre ? `${c.nombre} · ${c.email}` : c.email)));

  const botonesModo = Object.keys(ANCHOS).map((m) => h("button", { type: "button", dataset: { modo: m }, onclick: () => { modo = m; pintar(); } }, icono(m, 16), h("span", {}, m === "movil" ? "Móvil" : "Escritorio")));
  const bandeja = h("div", { class: "bandeja" });
  const iframe = h("iframe", { class: "vista-previa-iframe", title: "Vista previa del email", sandbox: "allow-same-origin allow-popups allow-popups-to-escape-sandbox" });
  const marco = h("div", { class: "vista-previa-marco" }, iframe);
  const escenario = h("div", { class: "vista-previa-escenario" }, marco);

  // Ajusta el alto del iframe a su contenido y lo encoge si no cabe a lo ancho.
  function ajustar() {
    const doc = iframe.contentDocument;
    if (!doc?.documentElement) return;
    const ancho = ANCHOS[modo];
    const alto = doc.documentElement.scrollHeight;
    const disponible = escenario.clientWidth - (modo === "movil" ? 28 : 0);
    const escala = Math.min(1, disponible / ancho);
    iframe.style.width = `${ancho}px`;
    iframe.style.height = `${alto}px`;
    iframe.style.transform = escala < 1 ? `scale(${escala})` : "";
    marco.style.width = `${ancho * escala + (modo === "movil" ? 24 : 0)}px`;
    marco.style.height = `${alto * escala + (modo === "movil" ? 24 : 0)}px`;
  }
  iframe.addEventListener("load", ajustar);

  function pintar() {
    botonesModo.forEach((b) => b.classList.toggle("activo", b.dataset.modo === modo));
    marco.className = `vista-previa-marco marco-${modo}`;
    bandeja.replaceChildren(
      h("span", { class: "bandeja-avatar" }, (estado.remitente.negocio || "T").charAt(0).toUpperCase()),
      h("div", { class: "bandeja-texto" },
        h("div", { class: "bandeja-de" }, h("strong", {}, estado.remitente.negocio || "Tu negocio"), h("span", { class: "tenue" }, "ahora")),
        h("div", { class: "bandeja-asunto" }, sustituir(email.asunto, contacto, { comoHTML: false }) || "(sin asunto)"),
        h("div", { class: "bandeja-preheader" }, sustituir(email.vistaPrevia, contacto, { comoHTML: false }) || "Sin texto de vista previa")));
    iframe.style.width = `${ANCHOS[modo]}px`;
    iframe.srcdoc = htmlDelEmail(email, { contacto, vistaPrevia: true });
  }

  const observador = new ResizeObserver(() => ajustar());
  const modal = abrirModal({
    titulo: `Vista previa · ${email.nombre}`,
    clase: "modal-vista-previa",
    alCerrar: () => observador.disconnect(),
    contenido: [
      h("div", { class: "vista-previa-controles" },
        h("div", { class: "segmentado", role: "group", "aria-label": "Tamaño de pantalla" }, botonesModo),
        h("label", { class: "campo campo-linea" }, h("span", { class: "campo-etiqueta" }, "Ver con los datos de"), selectorContacto)),
      bandeja,
      escenario,
    ],
  });
  observador.observe(escenario);
  modal.ponerBotones([{ texto: "Cerrar", clase: "secundario", accion: () => modal.cerrar() }]);
  pintar();
}

// Exporta el HTML del email. Si falta el pie legal, avisa antes.
// Devuelve "añadir-pie" si la persona prefiere añadirlo ahora.
export async function exportarEmail(email) {
  if (!email.bloques.some((b) => b.tipo === "pie")) {
    const respuesta = await elegir({
      titulo: "Falta el pie legal",
      texto: "Todo email comercial debe decir quién lo envía, su dirección postal y cómo darse de baja. Este email no tiene el bloque «Pie legal».",
      opciones: [{ valor: "seguir", texto: "Exportar sin pie" }, { valor: "añadir-pie", texto: "Añadir pie legal", clase: "primario" }],
    });
    if (respuesta !== "seguir") return respuesta;
  }
  const html = htmlDelEmail(email);
  const r = estado.remitente;
  const faltanDatos = !r.negocio || !r.direccion || !r.enlaceBaja;
  const nombreArchivo = `${slug(email.nombre, "-") || "email"}.html`;
  const modal = abrirModal({
    titulo: `Exportar «${email.nombre}»`,
    clase: "modal-ancho",
    contenido: [
      h("p", {}, "HTML con tablas y estilos en línea, listo para pegarlo en tu servicio de envío. Los campos como ", h("code", {}, "{{nombre}}"), " se quedan tal cual para que el servicio los rellene con cada contacto."),
      faltanDatos ? h("p", { class: "nota-legal nota-aviso" }, icono("alerta", 18), h("span", {}, "Faltan datos del remitente para el pie legal. ", h("a", { href: "#/ajustes", onclick: () => modal.cerrar() }, "Complétalos en Ajustes"), ".")) : null,
      h("textarea", { class: "entrada codigo", readonly: true, rows: 12, "aria-label": "Código HTML del email", value: html }),
    ],
  });
  modal.ponerBotones([
    { texto: "Copiar HTML", clase: "secundario", icono: "duplicar", accion: () => copiarTexto(html) },
    { texto: `Descargar ${nombreArchivo}`, clase: "primario", icono: "exportar", accion: () => { descargar(nombreArchivo, html, "text/html;charset=utf-8"); aviso("HTML descargado"); } },
  ]);
}
