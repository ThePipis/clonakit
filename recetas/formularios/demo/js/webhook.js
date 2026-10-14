// Envío de respuestas a tu automatización (n8n, Make, Zapier…).
// Es un POST con el cuerpo en JSON hecho desde el navegador de quien responde.

const ESPERA_MAXIMA = 10000; // 10 s: si tarda más, lo damos por fallido
const PAUSA_REINTENTO = 1500; // antes de reintentar, por si fue un corte momentáneo

/** Devuelve un mensaje si la URL no sirve, o "" si está bien (o vacía). */
export function revisarUrlWebhook(url) {
  if (!url) return "";
  let direccion;
  try {
    direccion = new URL(url);
  } catch {
    return "Esa dirección no es válida. Copia la URL completa de tu webhook, empezando por https://";
  }
  if (direccion.protocol !== "https:" && direccion.protocol !== "http:") {
    return "La dirección del webhook debe empezar por https://";
  }
  if (location.protocol === "https:" && direccion.protocol === "http:") {
    return "Tu web usa https, así que el webhook también debe empezar por https:// (el navegador bloquea los envíos a http).";
  }
  return "";
}

/** El JSON que recibe tu automatización. */
export function crearCarga(form, pares, { prueba = false, fecha = new Date().toISOString() } = {}) {
  return {
    formulario: { id: form.id, titulo: form.titulo },
    fecha,
    prueba,
    respuestas: pares.map(({ id, pregunta, respuesta }) => ({ id, pregunta, respuesta })),
  };
}

/** Una respuesta inventada para el botón "Enviar una prueba". Va marcada con prueba: true. */
export function cargaDePrueba(form) {
  const ejemplo = (p) => {
    switch (p.tipo) {
      case "corto":
        return "Respuesta de ejemplo";
      case "largo":
        return "Esto es una respuesta de prueba enviada desde Pregunta.";
      case "email":
        return "prueba@example.com";
      case "unica":
        return p.opciones[0]?.texto ?? "";
      case "multiple":
        return p.opciones
          .slice(0, 2)
          .map((o) => o.texto)
          .join(", ");
      case "escala":
        return 8;
      default:
        return "Sí";
    }
  };
  const pares = form.preguntas.map((p) => ({ id: p.id, pregunta: p.titulo || "Pregunta sin título", respuesta: ejemplo(p) }));
  return crearCarga(form, pares, { prueba: true });
}

/** Un intento de envío. Nunca lanza errores: devuelve { ok, tipo, estado }. */
export async function enviarAlWebhook(url, carga) {
  const problema = revisarUrlWebhook(url);
  if (!url || problema) return { ok: false, tipo: "url", mensaje: problema || "Falta la URL del webhook." };
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ESPERA_MAXIMA);
  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(carga),
      signal: control.signal,
    });
    return respuesta.ok ? { ok: true, estado: respuesta.status } : { ok: false, tipo: "http", estado: respuesta.status };
  } catch (error) {
    // El navegador no distingue "no existe" de "bloqueado por CORS": ambos llegan aquí.
    return { ok: false, tipo: error.name === "AbortError" ? "tiempo" : "red" };
  } finally {
    clearTimeout(reloj);
  }
}

/** Envía y, si falla, reintenta una vez más tras una pequeña pausa. */
export async function enviarConReintento(url, carga) {
  const primero = await enviarAlWebhook(url, carga);
  if (primero.ok || primero.tipo === "url") return primero;
  await new Promise((listo) => setTimeout(listo, PAUSA_REINTENTO));
  return enviarAlWebhook(url, carga);
}

/** Explica con palabras sencillas por qué no ha llegado. */
export function explicarFallo(resultado) {
  switch (resultado.tipo) {
    case "url":
      return resultado.mensaje;
    case "http":
      return `Tu automatización ha contestado con un error (código ${resultado.estado}). Revisa que la URL sea la de producción y que el flujo esté activo.`;
    case "tiempo":
      return "Tu automatización ha tardado más de 10 segundos en contestar. Revisa que el flujo esté activo y vuelve a probar.";
    default:
      return (
        "No ha llegado. O la dirección no existe, o tu automatización no acepta envíos desde esta web " +
        `(el navegador lo bloquea por seguridad: es lo que se llama CORS). En n8n, permite el origen ${location.origin} ` +
        "en las opciones del nodo Webhook y vuelve a probar."
      );
  }
}
