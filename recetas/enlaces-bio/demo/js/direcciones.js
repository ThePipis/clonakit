// Convierte lo que escribe la persona en una dirección segura para un enlace.
// Acepta webs (https:// o http://), emails y teléfonos. Cualquier otra cosa se rechaza,
// porque un enlace "javascript:" o "data:" en la página publicada podría ser peligroso.

const ESQUEMAS_PERMITIDOS = ["https:", "http:", "mailto:", "tel:"];

// Un email sencillo: algo@algo.algo, sin espacios.
const PATRON_EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
// Un teléfono: dígitos con espacios, puntos, guiones o paréntesis y, opcionalmente, un + delante.
const PATRON_TELEFONO = /^\+?[\d\s().-]+$/;

// Resultado: { ok: true, href, tipo: "web" | "correo" | "telefono" } o { ok: false, error }.
export function normalizarDireccion(texto) {
  const valor = String(texto ?? "").trim();
  if (!valor) return { ok: false, error: "Falta la dirección." };

  // ¿Empieza por un "esquema" (lo que va antes de los dos puntos, como https: o mailto:)?
  // Si lo que sigue a los dos puntos es un número, es un puerto (ejemplo.com:8080), no un esquema.
  const esquema = valor.match(/^([a-z][a-z0-9+.-]*):(?!\d)/i);
  if (esquema && !esquema[1].includes(".")) {
    const nombre = esquema[1].toLowerCase() + ":";
    if (!ESQUEMAS_PERMITIDOS.includes(nombre)) {
      return { ok: false, error: `Las direcciones «${esquema[1]}:» no están permitidas. Usa una web (https://), un email o un teléfono.` };
    }
    if (nombre === "mailto:") return comprobarEmail(valor.slice(7));
    if (nombre === "tel:") return comprobarTelefono(valor.slice(4));
    return comprobarWeb(valor);
  }

  if (valor.includes("@") && !valor.includes("/")) return comprobarEmail(valor);
  if (PATRON_TELEFONO.test(valor) && contarDigitos(valor) >= 6) return comprobarTelefono(valor);

  // Si no lleva esquema, damos por hecho que es una web y le añadimos https:// nosotros.
  return comprobarWeb("https://" + valor.replace(/^\/+/, ""));
}

function comprobarEmail(email) {
  const limpio = decodeURIComponentSeguro(email.split("?")[0]).trim();
  if (!PATRON_EMAIL.test(limpio)) return { ok: false, error: "Ese email no parece completo (ejemplo: hola@tudominio.com)." };
  return { ok: true, href: "mailto:" + limpio, tipo: "correo" };
}

function comprobarTelefono(telefono) {
  // En un enlace tel: solo sirven los dígitos y el + inicial.
  const limpio = telefono.trim().replace(/(?!^\+)[^\d]/g, "");
  if (contarDigitos(limpio) < 6) return { ok: false, error: "Ese teléfono es demasiado corto." };
  return { ok: true, href: "tel:" + limpio, tipo: "telefono" };
}

function comprobarWeb(texto) {
  let url;
  try {
    // El objeto URL del navegador valida la dirección por nosotros: si es imposible, lanza un error.
    url = new URL(texto);
  } catch {
    return { ok: false, error: "Esa dirección no es válida (ejemplo: tutienda.com)." };
  }
  if (!["https:", "http:"].includes(url.protocol)) return { ok: false, error: "Solo se aceptan webs con https:// o http://." };
  // Un dominio de verdad termina en un punto y unas letras (tutienda.com, tienda.es).
  // Así evitamos que "hola" o "2024" pasen por direcciones web.
  if (!/\.(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i.test(url.hostname)) {
    return { ok: false, error: "Falta el final de la dirección (por ejemplo .com o .es)." };
  }
  return { ok: true, href: url.href, tipo: "web" };
}

function contarDigitos(texto) {
  return (texto.match(/\d/g) || []).length;
}

function decodeURIComponentSeguro(texto) {
  try {
    return decodeURIComponent(texto);
  } catch {
    return texto;
  }
}

// Texto corto para enseñar debajo del campo y en gris en la tarjeta.
export function describirDireccion(resultado) {
  if (!resultado.ok) return resultado.error;
  if (resultado.tipo === "correo") return "Abrirá el correo para escribir a " + resultado.href.slice(7);
  if (resultado.tipo === "telefono") return "Abrirá la app de llamadas para marcar " + resultado.href.slice(4);
  return "Abrirá " + resultado.href;
}
