// El "estado" es todo lo que la persona ha creado: perfil, enlaces y aspecto.
// Vive en un único objeto. Cada vez que cambia, se guarda en el navegador (localStorage)
// y se avisa a quien escuche (por ejemplo, la vista previa) para que se redibuje.

import { ID_ICONOS } from "./iconos.js";
import { FORMAS, LETRAS, estiloDeTema } from "./temas.js";

const CLAVE = "mienlace.proyecto";
export const MAX_NOMBRE = 60;
export const MAX_BIO = 160;
export const MAX_TITULO = 60;
const MAX_ENLACES = 100;

// Identificador corto y único para cada enlace (sirve para encontrarlo al arrastrar o editar).
export function nuevoId() {
  return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Proyecto vacío: lo que queda al pulsar "Empezar desde cero".
export function proyectoVacio() {
  return {
    esEjemplo: false,
    perfil: { nombre: "", bio: "", foto: "" },
    enlaces: [],
    estilo: { tema: "arena", ...estiloDeTema("arena") },
    firma: true,
  };
}

// Ilustración propia para el ejemplo (un sol y dos colinas). Es SVG, así que no pesa casi nada.
const FOTO_EJEMPLO =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">' +
      '<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9D8"/>' +
      '<stop offset="1" stop-color="#FBC2A0"/></linearGradient></defs>' +
      '<rect width="320" height="320" fill="url(#c)"/>' +
      '<circle cx="198" cy="128" r="54" fill="#F07F3C"/>' +
      '<path d="M0 222 Q80 150 160 212 T320 190 V320 H0z" fill="#B2573A"/>' +
      '<path d="M0 266 Q100 214 200 260 T320 250 V320 H0z" fill="#7A3E2B"/>' +
      "</svg>",
  );

// Ejemplo ya relleno que se ve la primera vez, para entender cómo queda la página.
export function proyectoEjemplo() {
  const web = "https://luciarios.example.com";
  return {
    esEjemplo: true,
    perfil: {
      nombre: "Lucía Ríos · Ilustración",
      bio: "Dibujo cuentos infantiles y carteles con mucho color. Aquí tienes mi tienda de láminas, mis talleres y cómo encargarme algo.",
      foto: FOTO_EJEMPLO,
    },
    enlaces: [
      { id: nuevoId(), titulo: "Tienda de láminas", url: web + "/tienda", icono: "tienda", visible: true },
      { id: nuevoId(), titulo: "Talleres de dibujo", url: web + "/talleres", icono: "calendario", visible: true },
      { id: nuevoId(), titulo: "Mi portfolio", url: web + "/", icono: "foto", visible: true },
      { id: nuevoId(), titulo: "Escríbeme", url: "mailto:hola@luciarios.example.com", icono: "correo", visible: true },
      { id: nuevoId(), titulo: "Boletín (muy pronto)", url: web + "/boletin", icono: "estrella", visible: false },
    ],
    estilo: { tema: "melocoton", ...estiloDeTema("melocoton") },
    firma: true,
  };
}

// ---------- Limpieza de datos ----------
// Todo lo que llega de fuera (localStorage o un .json) se revisa campo a campo antes de usarlo.

const esTexto = (valor) => typeof valor === "string";
const esColor = (valor) => esTexto(valor) && /^#[0-9a-f]{6}$/i.test(valor);
// Solo fotos incrustadas como imagen (nada de direcciones externas ni otros tipos de archivo)
// y de un tamaño razonable (unos 1,5 MB como mucho), para que quepan en el navegador.
const esFoto = (valor) =>
  esTexto(valor) && valor.length < 2_000_000 && /^data:image\/(jpeg|png|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(valor);

export function sanearProyecto(datos) {
  if (!datos || typeof datos !== "object" || (!datos.perfil && !Array.isArray(datos.enlaces))) {
    throw new Error("Este archivo no es un proyecto de MiEnlace.");
  }
  const base = proyectoVacio();
  const perfil = datos.perfil || {};
  const estilo = datos.estilo || {};
  const enlaces = Array.isArray(datos.enlaces) ? datos.enlaces : [];
  return {
    esEjemplo: datos.esEjemplo === true,
    perfil: {
      nombre: esTexto(perfil.nombre) ? perfil.nombre.slice(0, MAX_NOMBRE) : "",
      bio: esTexto(perfil.bio) ? perfil.bio.slice(0, MAX_BIO) : "",
      foto: esFoto(perfil.foto) ? perfil.foto : "",
    },
    enlaces: enlaces.slice(0, MAX_ENLACES).filter((e) => e && typeof e === "object").map((e) => ({
      id: nuevoId(),
      titulo: esTexto(e.titulo) ? e.titulo.slice(0, MAX_TITULO) : "",
      url: esTexto(e.url) ? e.url.slice(0, 2000) : "",
      icono: ID_ICONOS.includes(e.icono) ? e.icono : "ninguno",
      visible: e.visible !== false,
    })),
    estilo: {
      tema: esTexto(estilo.tema) ? estilo.tema : base.estilo.tema,
      fondo: esColor(estilo.fondo) ? estilo.fondo : base.estilo.fondo,
      boton: esColor(estilo.boton) ? estilo.boton : base.estilo.boton,
      textoBoton: esColor(estilo.textoBoton) ? estilo.textoBoton : base.estilo.textoBoton,
      forma: FORMAS.some((f) => f.id === estilo.forma) ? estilo.forma : base.estilo.forma,
      letra: LETRAS.some((l) => l.id === estilo.letra) ? estilo.letra : base.estilo.letra,
    },
    firma: datos.firma !== false,
  };
}

// ---------- Estado compartido y guardado automático ----------

function cargarDelNavegador() {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto) return sanearProyecto(JSON.parse(texto));
  } catch (error) {
    console.warn("No se pudo leer el proyecto guardado; empezamos con el ejemplo.", error);
  }
  return proyectoEjemplo();
}

// "estado" es un objeto que los demás módulos leen y modifican directamente.
export const estado = cargarDelNavegador();

const oyentes = [];
let temporizador = null;

// Para que otros módulos reaccionen a los cambios: alCambiar(() => redibujar()).
export function alCambiar(funcion) {
  oyentes.push(funcion);
}

// Hay que llamarla después de modificar "estado". El guardado espera un momento
// para no escribir en el navegador con cada tecla.
export function cambiar() {
  clearTimeout(temporizador);
  temporizador = setTimeout(guardarYa, 250);
  oyentes.forEach((funcion) => funcion());
}

// Sustituye todo el proyecto (al abrir un .json o empezar de cero).
export function reemplazarProyecto(nuevo) {
  Object.assign(estado, nuevo);
  cambiar();
}

export function guardarYa() {
  clearTimeout(temporizador);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    document.dispatchEvent(new CustomEvent("guardado", { detail: { ok: true } }));
  } catch (error) {
    // Puede fallar si el navegador está en modo privado o sin espacio.
    console.warn("No se pudo guardar en el navegador.", error);
    document.dispatchEvent(new CustomEvent("guardado", { detail: { ok: false } }));
  }
}

// Si se cierra la pestaña justo después de escribir, guardamos lo pendiente.
window.addEventListener("pagehide", guardarYa);
