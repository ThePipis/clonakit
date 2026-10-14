// estado-ui.js — Lo que ve ESTA pestaña: con quién escribes, qué canal miras, qué panel está abierto...
//
// La persona y el canal se guardan en sessionStorage, que es distinto en cada pestaña:
// así una pestaña puede ser Ana y otra Luis a la vez.

export const $ = (id) => document.getElementById(id);

function leerSesion(clave) {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribirSesion(clave, valor) {
  try {
    if (valor) sessionStorage.setItem(clave, valor);
    else sessionStorage.removeItem(clave);
  } catch {
    // Si el navegador lo bloquea, simplemente no se recuerda al recargar.
  }
}

export const ui = {
  persona: leerSesion("corrillo:persona"), // id de la persona con la que escribes
  canal: leerSesion("corrillo:canal"), // id del canal abierto
  panel: null, // panel derecho: null, { tipo: "hilo", id } o { tipo: "busqueda" }
  busqueda: { texto: "", canal: "", persona: "" },
  volverABusqueda: false, // el hilo se abrió desde un resultado: se puede volver a la lista
  editando: null, // { id, texto, donde: "canal" | "hilo" } mientras editas un mensaje
  lecturaPendiente: false, // al cambiar de persona, el canal abierto no cuenta como leído hasta que lo abras
  corte: null, // fecha desde la que se dibuja la línea "Nuevos"
  desplazar: null, // "inicio" (ir a lo nuevo) o "final" (ir abajo) en la próxima pintada del canal
  desplazarPanel: null, // lo mismo para el panel derecho ("final" o "arriba")
  destello: null, // { id, desde }: mensaje que se ilumina 2 segundos tras saltar a él
  verArchivados: false,
};

export function guardarSesion() {
  escribirSesion("corrillo:persona", ui.persona);
  escribirSesion("corrillo:canal", ui.canal);
}

export function olvidarSesion() {
  ui.persona = null;
  ui.canal = null;
  ui.panel = null;
  ui.editando = null;
  guardarSesion();
}

// En pantallas estrechas la barra lateral y los paneles se comportan distinto.
export const esMovil = () => matchMedia("(max-width: 760px)").matches;
