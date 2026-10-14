// Pantalla de Ajustes: datos del remitente (para el pie legal) y copia de
// seguridad: descargarla, restaurarla o borrarlo todo.

import { estado, borrarTodo, crearCopia, guardarRemitente, restaurarCopia } from "./estado.js";
import { aviso, boton, campo, confirmar, descargar, h, hoyISO, icono, plural, urlValida } from "./ui.js";

let raizAjustes = null;

export const vistaAjustes = {
  // Tras restaurar o borrar, los totales cambian: repintamos.
  actualizar() {
    if (raizAjustes) vistaAjustes.pintar(raizAjustes);
  },
  pintar(raiz) {
    raizAjustes = raiz;
    const r = estado.remitente;
    const negocio = h("input", { class: "entrada", id: "ajuste-negocio", type: "text", value: r.negocio, placeholder: "Cerámicas Lumbre" });
    const direccion = h("input", { class: "entrada", id: "ajuste-direccion", type: "text", value: r.direccion, placeholder: "Calle, número, código postal y ciudad" });
    const baja = h("input", { class: "entrada", id: "ajuste-baja", type: "url", value: r.enlaceBaja, placeholder: "https://tu-web.com/baja" });
    const error = h("p", { class: "campo-error", role: "alert" });

    async function guardar(e) {
      e.preventDefault();
      if (baja.value.trim() && !urlValida(baja.value.trim())) {
        error.textContent = "El enlace de baja debe empezar por https:// o mailto:";
        return baja.focus();
      }
      error.textContent = "";
      await guardarRemitente({ negocio: negocio.value.trim(), direccion: direccion.value.trim(), enlaceBaja: baja.value.trim() });
      aviso("Datos del remitente guardados");
    }

    const entradaCopia = h("input", { type: "file", accept: ".json,application/json", class: "oculto-accesible", id: "archivo-copia", onchange: (e) => restaurar(e.target.files[0], e.target) });
    const totales = [
      plural(estado.contactos.length, "contacto"),
      plural(estado.segmentos.length, "segmento"),
      plural(estado.emails.length, "email"),
      plural(estado.automatizaciones.length, "automatización", "automatizaciones"),
    ].join(" · ");

    raiz.replaceChildren(
      h("header", { class: "cabecera-vista" }, h("div", {}, h("h1", {}, "Ajustes"), h("p", { class: "subtitulo" }, "Tus datos de remitente y tus copias de seguridad."))),
      h("div", { class: "rejilla-ajustes" },
        h("section", { class: "tarjeta" },
          h("h2", { class: "tarjeta-titulo" }, icono("pie", 20), "Datos del remitente"),
          h("p", { class: "tenue" }, "Aparecen en el bloque «Pie legal» de tus emails. La ley pide que cada email comercial diga quién lo envía, una dirección postal y una forma sencilla de darse de baja."),
          h("form", { class: "formulario", novalidate: true, onsubmit: guardar },
            campo("Nombre del negocio", negocio),
            campo("Dirección postal", direccion),
            campo("Enlace de baja", baja, "La página o el email donde alguien pide dejar de recibir tus emails."),
            error,
            h("div", { class: "fila-botones" }, h("button", { type: "submit", class: "boton primario" }, icono("check", 16), "Guardar datos")))),
        h("section", { class: "tarjeta" },
          h("h2", { class: "tarjeta-titulo" }, icono("archivo", 20), "Copia de seguridad"),
          h("p", { class: "tenue" }, "Todo vive en este navegador. Si borras los datos del navegador o cambias de ordenador, los pierdes: descarga una copia de vez en cuando."),
          h("p", { class: "totales" }, totales),
          h("div", { class: "fila-botones" },
            boton("Descargar copia (.json)", descargarCopia, { clase: "primario", icono: "exportar" }),
            h("label", { class: "boton secundario", for: "archivo-copia", tabindex: "0", onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") entradaCopia.click(); } }, icono("restaurar", 16), "Restaurar una copia", entradaCopia))),
        h("section", { class: "tarjeta tarjeta-peligro" },
          h("h2", { class: "tarjeta-titulo" }, icono("alerta", 20), "Borrar todo"),
          h("p", { class: "tenue" }, "Elimina de este navegador todos los contactos, campos, segmentos, emails, automatizaciones y datos del remitente."),
          boton("Borrar todos los datos", borrarDatos, { clase: "peligro", icono: "borrar" })),
        h("section", { class: "tarjeta tarjeta-nota" },
          h("h2", { class: "tarjeta-titulo" }, icono("candado", 20), "Privacidad"),
          h("p", {}, "Los emails y nombres de tus contactos son datos personales. Embudo los guarda solo en este navegador y no los envía a ningún sitio."),
          h("p", { class: "tenue" }, "Importa solo contactos que hayan aceptado recibir tus emails (RGPD). Esto no es asesoría legal."))));
  },
};

function descargarCopia() {
  descargar(`embudo-copia-${hoyISO()}.json`, JSON.stringify(crearCopia(), null, 2), "application/json");
  aviso("Copia descargada");
}

async function restaurar(archivo, entrada) {
  if (!archivo) return;
  entrada.value = ""; // para poder elegir otra vez el mismo archivo
  let copia;
  try {
    copia = JSON.parse(await archivo.text());
  } catch {
    return aviso("Ese archivo no es un .json válido.", "error");
  }
  const d = copia?.datos;
  const ok = await confirmar({
    titulo: "Restaurar copia",
    texto: `Se reemplazarán TODOS tus datos actuales por los de la copia${d?.contactos ? ` (${plural(d.contactos.length, "contacto")}, ${plural(d.emails?.length ?? 0, "email")})` : ""}.`,
    aceptar: "Reemplazar mis datos",
    peligro: true,
  });
  if (!ok) return;
  try {
    await restaurarCopia(copia);
    aviso("Copia restaurada");
  } catch (error) {
    aviso(error.message, "error");
  }
}

async function borrarDatos() {
  const ok = await confirmar({ titulo: "Borrar todos los datos", texto: "Se borrará todo lo que tienes en Embudo en este navegador. Si no tienes una copia, no se podrá recuperar.", aceptar: "Sí, borrarlo todo", peligro: true });
  if (!ok) return;
  await borrarTodo();
  aviso("Datos borrados");
}
