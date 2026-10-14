// Operaciones con los archivos del proyecto abierto: escribir, guardar, crear,
// renombrar, borrar y añadir desde el ordenador. Todo se guarda en IndexedDB.

import * as db from "./db.js";
import { confirmar } from "./dialogos.js";
import { estado, avisar, estaSucio, existe } from "./estado.js";
import { alParar, carpetaDe, unirRuta, esPermitido, problemaConNombre } from "./util.js";

const ESPERA_GUARDADO = 1000; // la ficha pide guardar 1 segundo después de dejar de escribir
const TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB: más que suficiente para un archivo de código

const guardadosPendientes = new Map(); // ruta → guardado programado

// El registro del proyecto (pestañas, tamaños, carpetas...) se guarda poco después de cada cambio.
export const guardarProyecto = alParar(() => {
  if (estado.proyecto) db.guardar("proyectos", estado.proyecto);
}, 400);

// Apunta la fecha del último cambio del proyecto (se ve en la lista de proyectos).
export function anotarCambio() {
  if (!estado.proyecto) return; // un guardado que termina justo después de cerrar el proyecto
  estado.proyecto.modificado = Date.now();
  guardarProyecto();
}

// Lo llama el editor cada vez que se escribe.
export function cambiarContenido(ruta, texto) {
  const archivo = estado.archivos.get(ruta);
  if (!archivo || archivo.contenido === texto) return;
  const estabaSucio = estaSucio(ruta);
  archivo.contenido = texto;
  if (estaSucio(ruta) !== estabaSucio) avisar("sucio", ruta);
  avisar("contenido", ruta);

  if (!guardadosPendientes.has(ruta)) guardadosPendientes.set(ruta, alParar(() => guardarArchivo(ruta), ESPERA_GUARDADO));
  guardadosPendientes.get(ruta)();
}

export async function guardarArchivo(ruta) {
  guardadosPendientes.get(ruta)?.cancelar();
  const archivo = estado.archivos.get(ruta);
  if (!archivo || !estaSucio(ruta)) return;
  const texto = archivo.contenido;
  await db.guardar("archivos", { proyectoId: estado.proyecto.id, ruta, contenido: texto });
  archivo.guardado = texto; // si se siguió escribiendo mientras tanto, seguirá "sin guardar"
  anotarCambio();
  avisar("sucio", ruta);
}

// ---------- Copia de rescate ----------
// Si la página se cierra o se recarga antes del guardado automático, IndexedDB no siempre
// llega a terminar. localStorage, en cambio, guarda al instante: dejamos ahí lo pendiente
// y lo pasamos a IndexedDB la próxima vez que se abra Taller.
const CLAVE_RESCATE = "taller-rescate";

export function guardarCopiaDeRescate(misionSinGuardar = null) {
  try {
    const sucios = [...estado.archivos.keys()].filter(estaSucio);
    if (!sucios.length && !misionSinGuardar && !guardarProyecto.pendiente()) {
      localStorage.removeItem(CLAVE_RESCATE);
      return;
    }
    const proyectoId = estado.proyecto.id;
    localStorage.setItem(
      CLAVE_RESCATE,
      JSON.stringify({
        proyecto: estado.proyecto,
        archivos: sucios.map((ruta) => ({ proyectoId, ruta, contenido: estado.archivos.get(ruta).contenido })),
        mision: misionSinGuardar,
      }),
    );
  } catch {
    /* almacenamiento lleno o bloqueado: no podemos hacer más */
  }
}

export async function recuperarCopiaDeRescate() {
  let copia = null;
  try {
    copia = JSON.parse(localStorage.getItem(CLAVE_RESCATE));
  } catch {
    /* copia ilegible: la ignoramos */
  }
  // Solo si el proyecto sigue existiendo (si se borró, no lo resucitamos).
  if (copia?.proyecto && (await db.leer("proyectos", copia.proyecto.id))) {
    await db.enLote([
      { poner: copia.proyecto, en: "proyectos" },
      ...copia.archivos.map((archivo) => ({ poner: archivo, en: "archivos" })),
      ...(copia.mision ? [{ poner: copia.mision, en: "misiones" }] : []),
    ]);
  }
  try {
    localStorage.removeItem(CLAVE_RESCATE);
  } catch {
    /* nada que borrar */
  }
}

export async function guardarTodo() {
  const sucios = [...estado.archivos.keys()].filter(estaSucio);
  await Promise.all(sucios.map(guardarArchivo));
  guardarProyecto.ahora();
}

export async function crearArchivo(ruta, contenido = "") {
  estado.archivos.set(ruta, { contenido, guardado: contenido });
  await db.guardar("archivos", { proyectoId: estado.proyecto.id, ruta, contenido });
  anotarCambio();
  avisar("arbol");
}

export function crearCarpeta(ruta) {
  estado.proyecto.carpetas.push(ruta);
  anotarCambio();
  avisar("arbol");
}

// Renombra un archivo o una carpeta (con todo lo que tenga dentro). Devuelve la ruta nueva.
export async function renombrar(ruta, nombreNuevo) {
  const nueva = unirRuta(carpetaDe(ruta), nombreNuevo);
  if (nueva === ruta) return ruta;
  await guardarTodo(); // así no queda ningún guardado pendiente con la ruta vieja

  // Traduce cualquier ruta vieja a la nueva (sirve también para lo que hay dentro de una carpeta).
  const traducir = (r) => (r === ruta ? nueva : r.startsWith(`${ruta}/`) ? nueva + r.slice(ruta.length) : r);
  const id = estado.proyecto.id;
  const operaciones = [];
  const nuevos = new Map();
  for (const [r, archivo] of estado.archivos) {
    const r2 = traducir(r);
    nuevos.set(r2, archivo);
    if (r2 !== r) {
      operaciones.push({ quitar: [id, r], en: "archivos" }, { poner: { proyectoId: id, ruta: r2, contenido: archivo.contenido }, en: "archivos" });
    }
  }
  estado.archivos = nuevos;

  const p = estado.proyecto;
  p.carpetas = p.carpetas.map(traducir);
  p.abiertas = p.abiertas.map(traducir);
  if (p.activa) p.activa = traducir(p.activa);
  for (const mision of estado.misiones) {
    const lista = mision.archivos.map(traducir);
    if (lista.join() !== mision.archivos.join()) {
      mision.archivos = lista;
      operaciones.push({ poner: mision, en: "misiones" });
    }
  }
  p.modificado = Date.now();
  operaciones.push({ poner: p, en: "proyectos" });
  await db.enLote(operaciones);

  avisar("renombrado", traducir);
  avisar("arbol");
  avisar("misiones");
  return nueva;
}

// Borra un archivo, o una carpeta con todo su contenido.
export async function borrarRuta(ruta) {
  const afectada = (r) => r === ruta || r.startsWith(`${ruta}/`);
  const id = estado.proyecto.id;
  const operaciones = [];
  for (const r of [...estado.archivos.keys()].filter(afectada)) {
    guardadosPendientes.get(r)?.cancelar();
    estado.archivos.delete(r);
    operaciones.push({ quitar: [id, r], en: "archivos" });
  }
  const p = estado.proyecto;
  p.carpetas = p.carpetas.filter((c) => !afectada(c));
  p.abiertas = p.abiertas.filter((r) => !afectada(r));
  if (p.activa && afectada(p.activa)) p.activa = p.abiertas.at(-1) ?? null;
  for (const mision of estado.misiones) {
    if (mision.archivos.some(afectada)) {
      mision.archivos = mision.archivos.filter((r) => !afectada(r));
      operaciones.push({ poner: mision, en: "misiones" });
    }
  }
  p.modificado = Date.now();
  operaciones.push({ poner: p, en: "proyectos" });
  await db.enLote(operaciones);

  avisar("borrado", afectada);
  avisar("arbol");
  avisar("misiones");
}

// Añade archivos arrastrados desde el ordenador. lista: [{ ruta relativa, file }].
// Devuelve cuántos se añadieron y cuáles se saltaron (por no ser de texto, por ejemplo).
export async function anadirDesdeOrdenador(lista, carpetaDestino = "") {
  const validos = [];
  const saltados = [];
  for (const { ruta, file } of lista) {
    // Limpiamos la ruta: nada de "..", ni barras al principio, ni nombres raros.
    const partes = ruta.split("/").filter((parte) => parte && parte !== "." && parte !== "..");
    const nombre = partes.at(-1) ?? "";
    const correcta = partes.every((parte, i) => !problemaConNombre(parte, { esCarpeta: i < partes.length - 1 }));
    if (!correcta || !esPermitido(nombre) || file.size > TAMANO_MAXIMO) {
      saltados.push(nombre || file.name);
      continue;
    }
    validos.push({ ruta: unirRuta(carpetaDestino, partes.join("/")), file });
  }

  // Si alguno ya existe, preguntamos antes de pisarlo.
  const repetidos = validos.filter((v) => estado.archivos.has(v.ruta));
  let reemplazar = false;
  if (repetidos.length) {
    reemplazar = await confirmar(
      repetidos.length === 1 ? "Ese archivo ya existe" : "Esos archivos ya existen",
      `${repetidos.map((r) => r.ruta).join(", ")}. ¿Quieres reemplazarlos por los que has arrastrado?`,
      { aceptar: "Reemplazar" },
    );
  }

  const operaciones = [];
  const reemplazados = [];
  for (const { ruta, file } of validos) {
    const yaExistia = estado.archivos.has(ruta);
    if (yaExistia && !reemplazar) continue;
    if (!yaExistia && existe(ruta)) {
      saltados.push(ruta); // hay una carpeta con ese nombre
      continue;
    }
    const contenido = await file.text();
    guardadosPendientes.get(ruta)?.cancelar();
    estado.archivos.set(ruta, { contenido, guardado: contenido });
    if (yaExistia) reemplazados.push(ruta);
    operaciones.push({ poner: { proyectoId: estado.proyecto.id, ruta, contenido }, en: "archivos" });
  }
  await db.enLote(operaciones);
  if (operaciones.length) {
    anotarCambio();
    for (const ruta of reemplazados) avisar("contenido", ruta);
    avisar("reemplazado", reemplazados);
    avisar("arbol");
  }
  return { anadidos: operaciones.length, saltados };
}
