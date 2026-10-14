// Base de datos del navegador (IndexedDB). Aquí vive todo lo que guarda Taller.
// Usamos IndexedDB y no localStorage porque aguanta mucho más espacio y guarda objetos.
//
// Hay tres "almacenes" (como tablas):
//   proyectos → nombre, fechas, carpetas, pestañas abiertas y tamaño de las zonas
//   archivos  → un registro por archivo: { proyectoId, ruta, contenido }
//   misiones  → un registro por misión, con su proyectoId

const NOMBRE = "taller";
const VERSION = 1;
let conexion = null;

function abrir() {
  // Abrimos la base de datos una sola vez y reutilizamos la conexión.
  if (conexion) return conexion;
  conexion = new Promise((resolver, fallar) => {
    const peticion = indexedDB.open(NOMBRE, VERSION);
    // Solo se ejecuta la primera vez (o al subir VERSION): crea los almacenes.
    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      db.createObjectStore("proyectos", { keyPath: "id" });
      const archivos = db.createObjectStore("archivos", { keyPath: ["proyectoId", "ruta"] });
      archivos.createIndex("proyecto", "proyectoId");
      const misiones = db.createObjectStore("misiones", { keyPath: "id" });
      misiones.createIndex("proyecto", "proyectoId");
    };
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => fallar(peticion.error);
  });
  return conexion;
}

// IndexedDB avisa con eventos; esto lo convierte en una promesa para poder usar await.
const comoPromesa = (peticion) =>
  new Promise((resolver, fallar) => {
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => fallar(peticion.error);
  });

async function almacen(nombre, modo = "readonly") {
  const db = await abrir();
  return db.transaction(nombre, modo).objectStore(nombre);
}

export async function leerTodo(nombre) {
  return comoPromesa((await almacen(nombre)).getAll());
}

export async function leer(nombre, clave) {
  return comoPromesa((await almacen(nombre)).get(clave));
}

// Todos los archivos (o misiones) de un proyecto, gracias al índice "proyecto".
export async function leerDeProyecto(nombre, proyectoId) {
  return comoPromesa((await almacen(nombre)).index("proyecto").getAll(proyectoId));
}

export async function guardar(nombre, objeto) {
  return comoPromesa((await almacen(nombre, "readwrite")).put(objeto));
}

export async function borrar(nombre, clave) {
  return comoPromesa((await almacen(nombre, "readwrite")).delete(clave));
}

// Varios cambios juntos en una "transacción": o se guardan todos o ninguno.
// Cada operación es { poner: objeto, en: "almacen" } o { quitar: clave, en: "almacen" }.
export async function enLote(operaciones) {
  if (!operaciones.length) return;
  const db = await abrir();
  const nombres = [...new Set(operaciones.map((op) => op.en))];
  const transaccion = db.transaction(nombres, "readwrite");
  for (const op of operaciones) {
    const destino = transaccion.objectStore(op.en);
    if ("poner" in op) destino.put(op.poner);
    else destino.delete(op.quitar);
  }
  return new Promise((resolver, fallar) => {
    transaccion.oncomplete = () => resolver();
    transaccion.onerror = () => fallar(transaccion.error);
    transaccion.onabort = () => fallar(transaccion.error);
  });
}

// Borra un proyecto con todos sus archivos y misiones.
export async function borrarProyecto(id) {
  const [archivos, misiones] = await Promise.all([leerDeProyecto("archivos", id), leerDeProyecto("misiones", id)]);
  await enLote([
    { quitar: id, en: "proyectos" },
    ...archivos.map((a) => ({ quitar: [id, a.ruta], en: "archivos" })),
    ...misiones.map((m) => ({ quitar: m.id, en: "misiones" })),
  ]);
}

// Pide al navegador que no borre estos datos aunque falte espacio (si lo permite).
export function pedirAlmacenPersistente() {
  navigator.storage?.persist?.().catch(() => {});
}
