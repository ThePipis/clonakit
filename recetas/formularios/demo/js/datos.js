// Datos de Pregunta: cómo es un formulario por dentro, el ejemplo
// "Pide tu presupuesto" y dónde se guarda todo.
// No hay servidor: todo vive en localStorage (el almacén del navegador).

// Los 7 tipos de pregunta. "pista" es la frase que se ve en el menú de añadir.
export const TIPOS = {
  corto: { nombre: "Texto corto", pista: "Nombre, empresa, ciudad…" },
  largo: { nombre: "Texto largo", pista: "Comentarios y explicaciones" },
  email: { nombre: "Email", pista: "Comprueba que esté bien escrito" },
  unica: { nombre: "Opción única", pista: "Elegir una entre varias" },
  multiple: { nombre: "Opción múltiple", pista: "Elegir todas las que quiera" },
  escala: { nombre: "Escala del 1 al 10", pista: "Satisfacción, recomendación…" },
  sino: { nombre: "Sí / No", pista: "Una respuesta rápida" },
};
export const ORDEN_TIPOS = Object.keys(TIPOS);
export const ACENTO_INICIAL = "#3D4BA8";

/** Identificador único, por ejemplo "p_lx3k9a7f2". El prefijo dice qué es (f=formulario, p=pregunta…). */
export function nuevoId(prefijo) {
  return `${prefijo}_${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 7)}`;
}

export function nuevaOpcion(texto = "") {
  // "salto" vacío significa "ir a la siguiente pregunta".
  return { id: nuevoId("o"), texto, salto: "" };
}

export function nuevaPregunta(tipo) {
  const pregunta = { id: nuevoId("p"), tipo, titulo: "", ayuda: "", obligatoria: false };
  if (tipo === "unica" || tipo === "multiple") pregunta.opciones = [nuevaOpcion("Opción 1"), nuevaOpcion("Opción 2")];
  if (tipo === "escala") pregunta.etiquetas = { min: "Nada probable", max: "Muy probable" };
  if (tipo === "sino") pregunta.saltos = { si: "", no: "" };
  return pregunta;
}

export function nuevoFormulario(titulo = "Formulario sin título") {
  const ahora = new Date().toISOString();
  return {
    id: nuevoId("f"),
    titulo,
    acento: ACENTO_INICIAL,
    webhook: "",
    bienvenida: { titulo: "", texto: "", privacidad: "", privacidadUrl: "" },
    preguntas: [],
    final: { titulo: "¡Gracias!", texto: "Gracias por dedicarnos un momento.", botonTexto: "", botonUrl: "" },
    creado: ahora,
    actualizado: ahora,
  };
}

/** El ejemplo listo para usar: un formulario para pedir presupuestos, con saltos. */
export function formularioEjemplo() {
  const form = nuevoFormulario("Pide tu presupuesto");
  const pregunta = (tipo, titulo, extra = {}) => Object.assign(nuevaPregunta(tipo), { titulo }, extra);
  const conOpciones = (p, textos) => Object.assign(p, { opciones: textos.map((t) => nuevaOpcion(t)) });

  const nombre = pregunta("corto", "¿Cómo te llamas?", { obligatoria: true });
  const email = pregunta("email", "¿A qué email te envío el presupuesto?", {
    ayuda: "Solo lo usaré para responderte.",
    obligatoria: true,
  });
  const necesidad = conOpciones(pregunta("unica", "¿Qué necesitas?", { obligatoria: true }), ["Web", "Tienda online", "Otra cosa"]);
  const productos = conOpciones(pregunta("unica", "¿Cuántos productos venderás?", { ayuda: "Una idea aproximada es suficiente." }), [
    "Menos de 20",
    "Entre 20 y 100",
    "Más de 100",
  ]);
  const detalles = pregunta("largo", "Cuéntame más", { ayuda: "Qué quieres conseguir, webs que te gusten, plazos… Todo ayuda." });
  const cuando = conOpciones(pregunta("unica", "¿Cuándo quieres empezar?"), ["Cuanto antes", "En 1 a 3 meses", "Todavía no lo sé"]);

  // Saltos: la pregunta de productos solo la ve quien quiere una tienda online.
  necesidad.opciones[0].salto = detalles.id; // Web → Cuéntame más
  necesidad.opciones[2].salto = detalles.id; // Otra cosa → Cuéntame más

  form.preguntas = [nombre, email, necesidad, productos, detalles, cuando];
  form.bienvenida = {
    titulo: "Pide tu presupuesto",
    texto: "Unas pocas preguntas rápidas y te respondo en menos de 48 horas con una propuesta a tu medida.",
    privacidad: "Usaré tus datos solo para preparar y enviarte el presupuesto.",
    privacidadUrl: "",
  };
  form.final = {
    titulo: "¡Gracias! Ya tengo tu petición",
    texto: "Te escribo en menos de 48 horas con tu presupuesto.",
    botonTexto: "Visita mi web",
    botonUrl: "",
  };
  return form;
}

/** Copia una pregunta con identificadores nuevos (los saltos se mantienen). */
export function duplicarPregunta(pregunta) {
  const copia = structuredClone(pregunta);
  copia.id = nuevoId("p");
  copia.titulo = pregunta.titulo ? `${pregunta.titulo} (copia)` : "";
  if (copia.opciones) copia.opciones = copia.opciones.map((o) => ({ ...o, id: nuevoId("o") }));
  return copia;
}

/**
 * Los saltos solo pueden ir hacia delante. Tras mover o borrar preguntas,
 * los que ya no son válidos vuelven a "la siguiente". Devuelve cuántos se arreglaron.
 */
export function sanearSaltos(form) {
  let arreglados = 0;
  form.preguntas.forEach((pregunta, indice) => {
    const valido = (destino) =>
      destino === "" || destino === "final" || form.preguntas.findIndex((q) => q.id === destino) > indice;
    if (pregunta.tipo === "unica") {
      for (const opcion of pregunta.opciones) {
        if (!valido(opcion.salto)) {
          opcion.salto = "";
          arreglados++;
        }
      }
    }
    if (pregunta.tipo === "sino") {
      for (const clave of ["si", "no"]) {
        if (!valido(pregunta.saltos[clave])) {
          pregunta.saltos[clave] = "";
          arreglados++;
        }
      }
    }
  });
  return arreglados;
}

/** ¿Tiene esta pregunta algún salto configurado? (para marcarla en la lista) */
export function tieneSaltos(pregunta) {
  if (pregunta.tipo === "unica") return pregunta.opciones.some((o) => o.salto);
  if (pregunta.tipo === "sino") return Boolean(pregunta.saltos.si || pregunta.saltos.no);
  return false;
}

// --- Limpieza de datos -------------------------------------------------------
// Los formularios llegan del almacén o de un enlace que cualquiera puede escribir,
// así que antes de usarlos se comprueba que tienen la forma esperada.

const texto = (valor, maximo = 4000) => (typeof valor === "string" ? valor.slice(0, maximo) : "");

function normalizarPregunta(dato) {
  const pregunta = nuevaPregunta(dato.tipo);
  pregunta.id = texto(dato.id, 60) || pregunta.id;
  pregunta.titulo = texto(dato.titulo, 500);
  pregunta.ayuda = texto(dato.ayuda, 1000);
  pregunta.obligatoria = dato.obligatoria === true;
  if (pregunta.opciones) {
    const opciones = Array.isArray(dato.opciones) ? dato.opciones.filter((o) => o && typeof o === "object") : [];
    pregunta.opciones = opciones.slice(0, 50).map((o) => ({
      id: texto(o.id, 60) || nuevoId("o"),
      texto: texto(o.texto, 300),
      salto: texto(o.salto, 60),
    }));
    if (!pregunta.opciones.length) pregunta.opciones = [nuevaOpcion("Opción 1")];
  }
  if (pregunta.etiquetas) {
    pregunta.etiquetas = { min: texto(dato.etiquetas?.min, 80), max: texto(dato.etiquetas?.max, 80) };
  }
  if (pregunta.saltos) {
    pregunta.saltos = { si: texto(dato.saltos?.si, 60), no: texto(dato.saltos?.no, 60) };
  }
  return pregunta;
}

export function normalizarFormulario(dato) {
  if (!dato || typeof dato !== "object") throw new Error("No es un formulario");
  const form = nuevoFormulario();
  form.id = texto(dato.id, 60) || form.id;
  form.titulo = texto(dato.titulo, 200) || "Formulario sin título";
  form.acento = /^#[0-9a-f]{6}$/i.test(dato.acento) ? dato.acento : ACENTO_INICIAL;
  form.webhook = texto(dato.webhook, 1000);
  const b = dato.bienvenida ?? {};
  form.bienvenida = {
    titulo: texto(b.titulo, 200),
    texto: texto(b.texto, 2000),
    privacidad: texto(b.privacidad, 1000),
    privacidadUrl: texto(b.privacidadUrl, 1000),
  };
  const f = dato.final ?? {};
  form.final = {
    titulo: texto(f.titulo, 200),
    texto: texto(f.texto, 2000),
    botonTexto: texto(f.botonTexto, 80),
    botonUrl: texto(f.botonUrl, 1000),
  };
  const preguntas = Array.isArray(dato.preguntas) ? dato.preguntas : [];
  form.preguntas = preguntas.filter((p) => p && TIPOS[p.tipo]).slice(0, 200).map(normalizarPregunta);
  form.creado = texto(dato.creado, 40) || form.creado;
  form.actualizado = texto(dato.actualizado, 40) || form.actualizado;
  sanearSaltos(form);
  return form;
}

// --- Respuestas -------------------------------------------------------------------

/** Convierte lo elegido en texto legible: el id de una opción → "Tienda online". */
export function textoRespuesta(pregunta, valor) {
  if (valor === undefined || valor === null || valor === "") return "";
  switch (pregunta.tipo) {
    case "unica":
      return pregunta.opciones.find((o) => o.id === valor)?.texto ?? "";
    case "multiple":
      return pregunta.opciones
        .filter((o) => valor.includes(o.id))
        .map((o) => o.texto)
        .join(", ");
    case "escala":
      return Number(valor);
    case "sino":
      return valor === "si" ? "Sí" : "No";
    default:
      return String(valor).trim();
  }
}

/**
 * Lista de pares pregunta → respuesta, con todas las preguntas en orden.
 * Las que la persona no ha visto (por un salto) van vacías, así las columnas
 * de tu hoja de cálculo siempre cuadran.
 */
export function construirPares(form, valores, idsVistos) {
  return form.preguntas.map((p) => ({
    id: p.id,
    pregunta: p.titulo || "Pregunta sin título",
    respuesta: idsVistos.has(p.id) ? textoRespuesta(p, valores[p.id]) : "",
  }));
}

// --- Almacén (localStorage) ---------------------------------------------------------

const CLAVE_FORMULARIOS = "pregunta:formularios";
const CLAVE_RESPUESTAS = "pregunta:respuestas";

function leer(clave, porDefecto) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : porDefecto;
  } catch {
    return porDefecto; // datos rotos o almacén bloqueado: empezamos de cero sin romper la app
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false; // almacén lleno o bloqueado (por ejemplo, en algunas ventanas privadas)
  }
}

export function leerFormularios() {
  const lista = leer(CLAVE_FORMULARIOS, []);
  if (!Array.isArray(lista)) return [];
  return lista
    .map((dato) => {
      try {
        return normalizarFormulario(dato);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function obtenerFormulario(id) {
  return leerFormularios().find((f) => f.id === id) ?? null;
}

/** Guarda (crea o actualiza) un formulario. Devuelve false si el navegador no deja guardar. */
export function guardarFormulario(form) {
  const lista = leerFormularios();
  const posicion = lista.findIndex((f) => f.id === form.id);
  if (posicion >= 0) lista[posicion] = form;
  else lista.push(form);
  return escribir(CLAVE_FORMULARIOS, lista);
}

export function borrarFormulario(id) {
  escribir(
    CLAVE_FORMULARIOS,
    leerFormularios().filter((f) => f.id !== id),
  );
  borrarRespuestasDe(id);
}

export function duplicarFormulario(id) {
  const original = obtenerFormulario(id);
  if (!original) return null;
  const copia = structuredClone(original);
  const ahora = new Date().toISOString();
  Object.assign(copia, { id: nuevoId("f"), titulo: `${original.titulo} (copia)`, creado: ahora, actualizado: ahora });
  guardarFormulario(copia);
  return copia;
}

export function leerRespuestas(formId) {
  const todas = leer(CLAVE_RESPUESTAS, []);
  if (!Array.isArray(todas)) return [];
  const validas = todas.filter((r) => r && typeof r === "object" && Array.isArray(r.pares));
  return formId ? validas.filter((r) => r.formId === formId) : validas;
}

export function contarRespuestas(formId) {
  return leerRespuestas(formId).length;
}

export function guardarRespuesta(registro) {
  const todas = leerRespuestas();
  todas.push(registro);
  return escribir(CLAVE_RESPUESTAS, todas);
}

export function borrarRespuesta(id) {
  escribir(
    CLAVE_RESPUESTAS,
    leerRespuestas().filter((r) => r.id !== id),
  );
}

export function borrarRespuestasDe(formId) {
  escribir(
    CLAVE_RESPUESTAS,
    leerRespuestas().filter((r) => r.formId !== formId),
  );
}

/**
 * Formularios que se han rellenado en este navegador pero no se crearon aquí
 * (por ejemplo, la tableta del mostrador en modo quiosco).
 */
export function formulariosAjenosConRespuestas() {
  const propios = new Set(leerFormularios().map((f) => f.id));
  const ajenos = new Map();
  for (const r of leerRespuestas()) {
    if (propios.has(r.formId)) continue;
    const actual = ajenos.get(r.formId) ?? { id: r.formId, titulo: r.formTitulo || "Formulario", total: 0 };
    actual.total++;
    actual.titulo = r.formTitulo || actual.titulo; // nos quedamos con el título más reciente
    ajenos.set(r.formId, actual);
  }
  return [...ajenos.values()];
}
