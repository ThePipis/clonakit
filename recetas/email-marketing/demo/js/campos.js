// Ventana "Campos personalizados": crear campos (texto, número o fecha),
// elegir cuáles se ven como columnas en la tabla y borrarlos.

import { estado, borrarCampo, crearCampo, guardarCampos } from "./estado.js";
import { abrirModal, aviso, boton, campo, confirmar, h, icono } from "./ui.js";

const NOMBRES_TIPO = { texto: "Texto", numero: "Número", fecha: "Fecha" };

export function abrirCampos() {
  const lista = h("div", { class: "lista-campos" });
  const entradaNombre = h("input", { type: "text", class: "entrada", placeholder: "Por ejemplo: Ciudad, Interés, Cumpleaños" });
  const selectorTipo = h("select", { class: "entrada", "aria-label": "Tipo de campo" }, Object.entries(NOMBRES_TIPO).map(([v, t]) => h("option", { value: v }, t)));

  async function añadir() {
    const nombre = entradaNombre.value.trim();
    if (!nombre) return entradaNombre.focus();
    if (["email", "nombre", "fecha de alta", "etiqueta", "etiquetas"].includes(nombre.toLowerCase()) || estado.campos.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      return aviso("Ya existe un campo con ese nombre.", "error");
    }
    const nuevo = await crearCampo(nombre, selectorTipo.value);
    entradaNombre.value = "";
    pintar();
    aviso(`Campo «${nuevo.nombre}» creado. En los emails se usa como {{${nuevo.clave}}}`);
  }
  entradaNombre.addEventListener("keydown", (e) => { if (e.key === "Enter") añadir(); });

  function pintar() {
    lista.replaceChildren(...(estado.campos.length ? estado.campos.map((c) => h("div", { class: "fila-campo" },
      h("div", { class: "fila-campo-info" }, h("strong", {}, c.nombre), h("span", { class: "tenue" }, `${NOMBRES_TIPO[c.tipo]} · `, h("code", {}, `{{${c.clave}}}`))),
      h("label", { class: "interruptor-texto" }, h("input", { type: "checkbox", checked: c.visible, onchange: async (e) => {
        await guardarCampos([{ ...c, visible: e.target.checked }]);
        pintar();
      } }), "Columna en la tabla"),
      h("button", { class: "boton-icono", "aria-label": `Borrar campo ${c.nombre}`, title: "Borrar campo", onclick: async () => {
        const ok = await confirmar({ titulo: "Borrar campo", texto: `Se borrará el campo «${c.nombre}» y su valor en todos los contactos.`, aceptar: "Borrar campo", peligro: true });
        if (!ok) return;
        await borrarCampo(c.id);
        pintar();
      } }, icono("borrar", 16))))
      : [h("p", { class: "tenue" }, "Aún no hay campos personalizados. Email, nombre y fecha de alta existen siempre.")]));
  }
  pintar();

  const modal = abrirModal({
    titulo: "Campos personalizados",
    contenido: [
      lista,
      h("div", { class: "nuevo-campo" }, h("h3", { class: "ficha-subtitulo" }, "Nuevo campo"),
        h("div", { class: "fila-formulario" }, campo("Nombre", entradaNombre), campo("Tipo", selectorTipo), boton("Añadir", añadir, { clase: "primario", icono: "mas" }))),
    ],
  });
  modal.ponerBotones([{ texto: "Hecho", clase: "primario", accion: () => modal.cerrar() }]);
}
