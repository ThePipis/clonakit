// Asistente de importación de contactos desde un CSV, en cuatro pasos:
// 1) elegir archivo · 2) asignar columnas · 3) etiquetas para todos · 4) resumen.

import { estado, crearCampo, guardarContactos, nuevoId } from "./estado.js";
import { leerCSV } from "./csv.js";
import { abrirModal, aviso, campo, campoEtiquetas, esEmailValido, fechaISO, formatoNumero, h, icono, limpiarEtiqueta, normalizar, plural } from "./ui.js";

const PASOS = ["Archivo", "Columnas", "Etiquetas", "Resumen"];

export function abrirImportador() {
  // Todo lo que el asistente va recordando entre pasos.
  const datos = { paso: 1, archivo: null, cabeceras: [], filas: [], asignaciones: [], etiquetas: [], resultado: null, error: "" };
  const modal = abrirModal({ titulo: "Importar contactos", clase: "modal-ancho", contenido: h("div") });

  function pintar() {
    const indicador = h("ol", { class: "pasos" }, PASOS.map((nombre, i) => h("li", { class: i + 1 === datos.paso ? "actual" : i + 1 < datos.paso ? "hecho" : "" },
      h("span", { class: "pasos-numero" }, i + 1 < datos.paso ? icono("check", 14) : i + 1), h("span", {}, nombre))));
    const contenido = [pintarPaso1, pintarPaso2, pintarPaso3, pintarPaso4][datos.paso - 1]();
    modal.cuerpo.replaceChildren(indicador, contenido);
  }

  // ---------- Paso 1: elegir el archivo ----------
  function pintarPaso1() {
    const entrada = h("input", { type: "file", accept: ".csv,.txt,text/csv", class: "oculto-accesible", id: "archivo-csv", onchange: (e) => leerArchivo(e.target.files[0]) });
    const zona = h("label", { class: "zona-archivo", for: "archivo-csv" },
      icono("archivo", 30),
      h("strong", {}, datos.archivo ? datos.archivo.name : "Elige tu archivo CSV"),
      h("span", { class: "tenue" }, datos.archivo ? `${plural(datos.filas.length, "fila")} de datos · separador «${datos.separador === "\t" ? "tabulador" : datos.separador}»` : "o arrástralo aquí. Vale con coma o con punto y coma."),
      entrada);
    // Arrastrar y soltar el archivo encima de la zona.
    zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("encima"); });
    zona.addEventListener("dragleave", () => zona.classList.remove("encima"));
    zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("encima"); leerArchivo(e.dataTransfer.files[0]); });

    modal.ponerBotones([
      { texto: "Cancelar", clase: "secundario", accion: () => modal.cerrar() },
      { texto: "Siguiente", clase: "primario", desactivado: !datos.filas.length, accion: () => { datos.paso = 2; pintar(); } },
    ]);
    return h("div", { class: "paso-contenido" },
      h("div", { class: "nota-legal" }, icono("candado", 18), h("p", {}, h("strong", {}, "Importa solo contactos que hayan aceptado recibir tus emails"), " (lo exige el RGPD). Los datos se quedan en este navegador y no se envían a ningún sitio. Esto no es asesoría legal.")),
      zona,
      datos.error ? h("p", { class: "campo-error" }, datos.error) : null);
  }

  async function leerArchivo(archivo) {
    if (!archivo) return;
    const { separador, filas } = leerCSV(await archivo.text());
    datos.error = "";
    if (filas.length < 2) {
      Object.assign(datos, { archivo, filas: [], error: "El archivo necesita una fila de títulos y al menos una fila de datos." });
      return pintar();
    }
    // La primera fila son los títulos de las columnas.
    const ancho = Math.max(...filas.map((f) => f.length));
    const cabeceras = Array.from({ length: ancho }, (_, i) => (filas[0][i] ?? "").trim() || `Columna ${i + 1}`);
    Object.assign(datos, { archivo, separador, cabeceras, filas: filas.slice(1) });
    datos.asignaciones = sugerirAsignaciones();
    pintar();
  }

  // Propone a qué campo va cada columna mirando su título y sus valores.
  function sugerirAsignaciones() {
    let hayEmail = false;
    let hayNombre = false;
    const asignaciones = datos.cabeceras.map((cabecera, i) => {
      const n = normalizar(cabecera);
      const valores = datos.filas.slice(0, 50).map((f) => (f[i] ?? "").trim()).filter(Boolean);
      if (!hayEmail && (/e-?mail|correo/.test(n))) { hayEmail = true; return { destino: "email" }; }
      if (!hayNombre && ["nombre", "name", "nombre completo", "first name"].includes(n)) { hayNombre = true; return { destino: "nombre" }; }
      const existente = estado.campos.find((c) => normalizar(c.nombre) === n);
      if (existente) return { destino: existente.id };
      return { destino: "nuevo", nombreNuevo: cabecera, tipoNuevo: adivinarTipo(valores) };
    });
    // Si ningún título dice "email", buscamos la columna con arrobas.
    if (!hayEmail) {
      const i = datos.cabeceras.findIndex((_, col) => datos.filas.slice(0, 20).some((f) => esEmailValido(f[col])));
      if (i !== -1) asignaciones[i] = { destino: "email" };
    }
    return asignaciones;
  }

  function adivinarTipo(valores) {
    if (!valores.length) return "texto";
    if (valores.every((v) => /^-?\d+([.,]\d+)?$/.test(v))) return "numero";
    if (valores.every((v) => fechaISO(v))) return "fecha";
    return "texto";
  }

  // ---------- Paso 2: asignar columnas ----------
  function pintarPaso2() {
    const opcionesCampo = [
      h("option", { value: "no" }, "No importar"),
      h("option", { value: "email" }, "Email (obligatorio)"),
      h("option", { value: "nombre" }, "Nombre"),
      estado.campos.length ? h("optgroup", { label: "Tus campos" }, estado.campos.map((c) => h("option", { value: c.id }, c.nombre))) : null,
      h("option", { value: "nuevo" }, "Campo nuevo…"),
    ];
    const cabecerasTabla = datos.cabeceras.map((cabecera, i) => {
      const a = datos.asignaciones[i];
      const selector = h("select", { class: "entrada", "aria-label": `Destino de la columna ${cabecera}`, value: a.destino, onchange: (e) => {
        datos.asignaciones[i] = { destino: e.target.value, nombreNuevo: cabecera, tipoNuevo: adivinarTipo(datos.filas.slice(0, 50).map((f) => (f[i] ?? "").trim()).filter(Boolean)) };
        pintar();
      } }, opcionesCampo.map((o) => o?.cloneNode(true)));
      const extra = a.destino === "nuevo" ? h("div", { class: "campo-nuevo" },
        h("input", { class: "entrada", type: "text", "aria-label": "Nombre del campo nuevo", value: a.nombreNuevo, oninput: (e) => { a.nombreNuevo = e.target.value; validar(); } }),
        h("select", { class: "entrada", "aria-label": "Tipo del campo nuevo", value: a.tipoNuevo, onchange: (e) => (a.tipoNuevo = e.target.value) },
          h("option", { value: "texto" }, "Texto"), h("option", { value: "numero" }, "Número"), h("option", { value: "fecha" }, "Fecha"))) : null;
      return h("th", { class: a.destino === "no" ? "columna-ignorada" : "" }, h("span", { class: "columna-titulo" }, cabecera), selector, extra);
    });
    const muestra = datos.filas.slice(0, 5).map((fila) => h("tr", {}, datos.cabeceras.map((_, i) => h("td", { class: datos.asignaciones[i].destino === "no" ? "columna-ignorada" : "" }, fila[i] ?? ""))));
    const mensaje = h("p", { class: "campo-error", role: "alert" });

    function validar() {
      const destinos = datos.asignaciones.map((a) => a.destino).filter((d) => d !== "no" && d !== "nuevo");
      const nuevos = datos.asignaciones.filter((a) => a.destino === "nuevo").map((a) => normalizar(a.nombreNuevo));
      let texto = "";
      if (!destinos.includes("email")) texto = "Elige qué columna contiene el email: es obligatoria.";
      else if (new Set(destinos).size !== destinos.length) texto = "Hay dos columnas asignadas al mismo campo.";
      else if (nuevos.some((n) => !n)) texto = "Ponle nombre a cada campo nuevo.";
      else if (new Set(nuevos).size !== nuevos.length || nuevos.some((n) => ["email", "nombre"].includes(n))) texto = "Hay dos campos nuevos con el mismo nombre.";
      mensaje.textContent = texto;
      modal.pie.querySelector(".primario").disabled = !!texto;
    }

    modal.ponerBotones([
      { texto: "Atrás", clase: "secundario", accion: () => { datos.paso = 1; pintar(); } },
      { texto: "Siguiente", clase: "primario", accion: () => { datos.paso = 3; pintar(); } },
    ]);
    queueMicrotask(validar);
    return h("div", { class: "paso-contenido" },
      h("p", {}, `Estas son las primeras ${Math.min(5, datos.filas.length)} filas de `, h("strong", {}, plural(datos.filas.length, "fila")), ". Elige a qué campo va cada columna."),
      h("div", { class: "tabla-marco tabla-importacion" }, h("table", { class: "tabla" }, h("thead", {}, h("tr", {}, cabecerasTabla)), h("tbody", {}, muestra))),
      mensaje);
  }

  // ---------- Paso 3: etiquetas para todos ----------
  function pintarPaso3() {
    const tags = campoEtiquetas({ etiquetas: datos.etiquetas, alCambiar: (lista) => (datos.etiquetas = lista), placeholder: "Por ejemplo: feria-2026" });
    modal.ponerBotones([
      { texto: "Atrás", clase: "secundario", accion: () => { datos.paso = 2; pintar(); } },
      { texto: `Importar ${plural(datos.filas.length, "fila")}`, clase: "primario", icono: "importar", accion: (e) => {
        const pendiente = modal.cuerpo.querySelector(".campo-etiquetas-entrada");
        if (pendiente?.value.trim()) tags.añadir(pendiente.value);
        e.currentTarget.disabled = true;
        importar();
      } },
    ]);
    return h("div", { class: "paso-contenido" },
      h("p", {}, "¿Quieres poner alguna etiqueta a todos los contactos de este archivo? Te servirá para encontrarlos y crear segmentos. Es opcional."),
      campo("Etiquetas para todos los importados", tags.elemento, "Escribe y pulsa Enter. Si un contacto ya existía, conserva sus etiquetas y suma estas."));
  }

  async function importar() {
    // 1) Creamos los campos nuevos que haya pedido la persona.
    const destinos = [];
    for (const a of datos.asignaciones) {
      if (a.destino === "nuevo") destinos.push((await crearCampo(a.nombreNuevo, a.tipoNuevo)).id);
      else destinos.push(a.destino);
    }
    const tipos = Object.fromEntries(estado.campos.map((c) => [c.id, c.tipo]));
    const columnaEmail = destinos.indexOf("email");

    // 2) Recorremos las filas: si el email ya existe se actualiza; si no, se crea.
    const porEmail = new Map(estado.contactos.map((c) => [c.email, c]));
    const cambiados = new Map();
    const nuevos = new Set();
    const actualizados = new Set();
    const descartados = [];
    const ahora = new Date().toISOString();

    datos.filas.forEach((fila, i) => {
      const bruto = (fila[columnaEmail] ?? "").trim();
      const email = bruto.toLowerCase();
      if (!esEmailValido(email)) {
        descartados.push({ fila: i + 2, valor: bruto, motivo: bruto ? "Email no válido" : "Sin email" });
        return;
      }
      let contacto = cambiados.get(porEmail.get(email)?.id);
      if (!contacto) {
        const existente = porEmail.get(email);
        contacto = existente ? structuredClone(existente) : { id: nuevoId("c"), email, nombre: "", etiquetas: [], campos: {}, alta: ahora, origen: `Importado de ${datos.archivo.name}` };
        if (existente) actualizados.add(contacto.id);
        else nuevos.add(contacto.id);
        contacto.campos ??= {};
        porEmail.set(email, contacto);
        cambiados.set(contacto.id, contacto);
      }
      destinos.forEach((destino, col) => {
        const valor = (fila[col] ?? "").trim();
        if (!valor || destino === "no" || destino === "email") return; // una celda vacía no borra lo que ya había
        if (destino === "nombre") contacto.nombre = valor;
        else if (tipos[destino] === "fecha") contacto.campos[destino] = fechaISO(valor) || valor;
        else if (tipos[destino] === "numero") contacto.campos[destino] = valor.replace(",", ".");
        else contacto.campos[destino] = valor;
      });
      contacto.etiquetas = [...new Set([...(contacto.etiquetas ?? []), ...datos.etiquetas.map(limpiarEtiqueta)])];
    });

    await guardarContactos([...cambiados.values()]);
    datos.resultado = { nuevos: nuevos.size, actualizados: actualizados.size, descartados };
    datos.paso = 4;
    pintar();
    aviso("Importación terminada");
  }

  // ---------- Paso 4: resumen ----------
  function pintarPaso4() {
    const r = datos.resultado;
    modal.ponerBotones([{ texto: "Ver mis contactos", clase: "primario", accion: () => { modal.cerrar(); location.hash = "#/contactos"; } }]);
    return h("div", { class: "paso-contenido" },
      h("div", { class: "resumen-importacion" },
        cifra(r.nuevos, "nuevos", "ok"),
        cifra(r.actualizados, "actualizados", "info", "ya existían con el mismo email"),
        cifra(r.descartados.length, "descartados", r.descartados.length ? "mal" : "", "por email no válido")),
      datos.etiquetas.length ? h("p", {}, "Etiquetas puestas: ", datos.etiquetas.map((e) => h("code", { class: "codigo-suave" }, e)).reduce((a, b) => [a, " ", b])) : null,
      r.descartados.length ? h("div", { class: "descartados" }, h("h3", { class: "ficha-subtitulo" }, "Filas descartadas"),
        h("ul", {}, r.descartados.map((d) => h("li", {}, h("span", { class: "tenue" }, `Fila ${d.fila}`), h("code", {}, d.valor || "(vacío)"), h("span", {}, d.motivo))))) : null);
  }

  function cifra(numero, texto, clase, detalle) {
    return h("div", { class: `cifra cifra-${clase}` }, h("strong", {}, formatoNumero(numero)), h("span", {}, texto), detalle ? h("small", {}, detalle) : null);
  }

  pintar();
}
