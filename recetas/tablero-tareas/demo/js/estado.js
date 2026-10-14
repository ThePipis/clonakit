// Los datos de la app (tableros, listas y tarjetas) y todas las operaciones que los cambian.
// Regla de oro: la interfaz nunca toca localStorage; llama a cambiar() y este módulo guarda y avisa.

import { clonar, nuevoId } from "./util.js";

export const CLAVE_DATOS = "columnas:datos"; // nombre del "cajón" de localStorage
export const VERSION_FORMATO = 1;

// Colores de fondo que se pueden elegir para un tablero.
export const COLORES_TABLERO = [
  { nombre: "Verde azulado", valor: "#1F7A74" },
  { nombre: "Teja", valor: "#B5553C" },
  { nombre: "Oliva", valor: "#6B7A3A" },
  { nombre: "Ciruela", valor: "#6E4A6B" },
  { nombre: "Pizarra", valor: "#3C4A5C" },
  { nombre: "Arena oscura", valor: "#A89068" },
];

// Las 6 etiquetas fijas de cada tablero. El nombre ("Urgente"...) lo pone la persona.
export const ETIQUETAS = [
  { id: "verde", nombre: "Verde", valor: "#4CAF7A" },
  { id: "amarillo", nombre: "Amarillo", valor: "#E9C46A" },
  { id: "naranja", nombre: "Naranja", valor: "#F4A261" },
  { id: "rojo", nombre: "Rojo", valor: "#E76F51" },
  { id: "lila", nombre: "Lila", valor: "#9B7BD4" },
  { id: "azul", nombre: "Azul", valor: "#4A90C2" },
];

export const LISTAS_EJEMPLO = ["Pendiente", "En marcha", "Terminado"];

// Todo el estado vive en este objeto. Se carga del navegador al arrancar.
export const datos = cargar();

function cargar() {
  const vacio = { version: VERSION_FORMATO, tableros: [], ultimaCopia: null };
  try {
    const texto = localStorage.getItem(CLAVE_DATOS);
    if (!texto) return vacio;
    const guardado = JSON.parse(texto);
    if (!Array.isArray(guardado.tableros)) throw new Error("Formato desconocido");
    return { ...vacio, ...guardado };
  } catch (error) {
    // Si lo guardado está roto no lo borramos: lo apartamos para poder rescatarlo a mano.
    console.warn("No se pudieron leer los datos guardados:", error);
    try {
      const roto = localStorage.getItem(CLAVE_DATOS);
      if (roto) localStorage.setItem(`${CLAVE_DATOS}:rescate`, roto);
    } catch {}
    return vacio;
  }
}

/* ---------- Guardar y avisar a la interfaz ---------- */

const oyentes = [];
export const alCambiar = (funcion) => oyentes.push(funcion);

// Aplica un cambio, lo guarda y (salvo que se pida lo contrario) vuelve a pintar la pantalla.
// Ejemplo: cambiar(() => { tarjeta.titulo = "Nuevo título"; });
export function cambiar(mutacion, { repintar = true } = {}) {
  const resultado = mutacion();
  guardar();
  if (repintar) oyentes.forEach((funcion) => funcion());
  return resultado;
}

export function guardar() {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
    return true;
  } catch (error) {
    // Pasa si el navegador está lleno o en modo privado estricto.
    console.error("No se pudo guardar:", error);
    window.dispatchEvent(new CustomEvent("columnas:error-guardar"));
    return false;
  }
}

/* ---------- Búsquedas ---------- */

export const buscarTablero = (id) => datos.tableros.find((t) => t.id === id) ?? null;

// Devuelve la tarjeta junto con la lista en la que está y su posición.
export function buscarTarjeta(tablero, tarjetaId) {
  for (const lista of tablero.listas) {
    const indice = lista.tarjetas.findIndex((t) => t.id === tarjetaId);
    if (indice !== -1) return { lista, tarjeta: lista.tarjetas[indice], indice };
  }
  return null;
}

export const contarTarjetas = (tablero) => tablero.listas.reduce((suma, lista) => suma + lista.tarjetas.length, 0);

// Nombre que se enseña de una etiqueta: el que le puso la persona o, si no tiene, el del color.
export function nombreEtiqueta(tablero, colorId) {
  const etiqueta = ETIQUETAS.find((e) => e.id === colorId);
  return tablero.etiquetas[colorId]?.trim() || etiqueta?.nombre || colorId;
}

/* ---------- Crear objetos nuevos ---------- */

const ahora = () => new Date().toISOString();

const etiquetasVacias = () => Object.fromEntries(ETIQUETAS.map((e) => [e.id, ""]));

export function nuevoTablero(nombre, color, conEjemplo) {
  return {
    id: nuevoId(),
    nombre,
    color,
    etiquetas: etiquetasVacias(),
    listas: conEjemplo ? LISTAS_EJEMPLO.map(nuevaLista) : [],
    creado: ahora(),
    modificado: ahora(),
  };
}

export const nuevaLista = (nombre) => ({ id: nuevoId(), nombre, tarjetas: [] });

export const nuevaTarjeta = (titulo) => ({
  id: nuevoId(),
  titulo,
  descripcion: "",
  etiquetas: [],
  fecha: null,
  cumplida: false,
  checklist: [],
  creada: ahora(),
  modificada: ahora(),
});

// Marca una tarjeta (y su tablero) como modificados ahora mismo.
export function tocar(tablero, tarjeta) {
  if (tarjeta) tarjeta.modificada = ahora();
  if (tablero) tablero.modificado = ahora();
}

// Copia un tablero dándole identificadores nuevos a todo, para que no choque con el original.
export function copiarConIdsNuevos(tablero, nombre = tablero.nombre) {
  const copia = clonar(tablero);
  copia.id = nuevoId();
  copia.nombre = nombre;
  copia.creado = copia.modificado = ahora();
  for (const lista of copia.listas) {
    lista.id = nuevoId();
    for (const tarjeta of lista.tarjetas) {
      tarjeta.id = nuevoId();
      tarjeta.checklist.forEach((elemento) => (elemento.id = nuevoId()));
    }
  }
  return copia;
}

/* ---------- Operaciones de tableros ---------- */

export function crearTablero(nombre, color, conEjemplo) {
  return cambiar(() => {
    const tablero = nuevoTablero(nombre, color, conEjemplo);
    datos.tableros.push(tablero);
    return tablero;
  });
}

export function duplicarTablero(id) {
  const original = buscarTablero(id);
  if (!original) return null;
  return cambiar(() => {
    const copia = copiarConIdsNuevos(original, `${original.nombre} (copia)`);
    // La copia aparece justo detrás del original.
    datos.tableros.splice(datos.tableros.indexOf(original) + 1, 0, copia);
    return copia;
  });
}

export function borrarTablero(id) {
  cambiar(() => {
    datos.tableros = datos.tableros.filter((t) => t.id !== id);
  });
}

/* ---------- Operaciones de listas y tarjetas ---------- */

// Mueve un elemento de un array para dejarlo justo antes de otro (o al final si antesDeId es null).
function recolocar(origen, destino, id, antesDeId) {
  if (id === antesDeId) return; // soltarlo encima de sí mismo no cambia nada
  const desde = origen.findIndex((x) => x.id === id);
  if (desde === -1) return;
  const [elemento] = origen.splice(desde, 1);
  const hasta = antesDeId ? destino.findIndex((x) => x.id === antesDeId) : -1;
  if (hasta === -1) destino.push(elemento);
  else destino.splice(hasta, 0, elemento);
}

export function moverLista(tablero, listaId, antesDeId) {
  cambiar(() => {
    recolocar(tablero.listas, tablero.listas, listaId, antesDeId);
    tocar(tablero);
  });
}

export function moverTarjeta(tablero, tarjetaId, listaDestinoId, antesDeId) {
  const encontrada = buscarTarjeta(tablero, tarjetaId);
  const destino = tablero.listas.find((l) => l.id === listaDestinoId);
  if (!encontrada || !destino) return;
  cambiar(() => {
    recolocar(encontrada.lista.tarjetas, destino.tarjetas, tarjetaId, antesDeId);
    tocar(tablero, encontrada.tarjeta);
  });
}
