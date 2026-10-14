// Guardado en IndexedDB, la base de datos que trae el navegador.
// Usamos IndexedDB y no localStorage porque una lista de miles de contactos
// no cabe bien en localStorage (tiene un límite de unos 5 MB y es solo texto).

const NOMBRE_BD = "embudo";
const VERSION_BD = 1;

// Un "almacén" por tipo de dato. Todos usan el campo "id" como clave.
export const ALMACENES = ["contactos", "campos", "segmentos", "emails", "automatizaciones", "ajustes"];

let bd = null;

// Abre (o crea la primera vez) la base de datos.
export function abrirBD() {
  return new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(NOMBRE_BD, VERSION_BD);
    // Solo se ejecuta la primera vez (o al subir VERSION_BD): crea los almacenes.
    peticion.onupgradeneeded = () => {
      const base = peticion.result;
      for (const nombre of ALMACENES) {
        if (!base.objectStoreNames.contains(nombre)) base.createObjectStore(nombre, { keyPath: "id" });
      }
    };
    peticion.onsuccess = () => {
      bd = peticion.result;
      resolver(bd);
    };
    peticion.onerror = () => rechazar(peticion.error);
  });
}

// Envuelve una transacción en una promesa: así podemos usar "await".
// La promesa se cumple cuando el navegador confirma que todo está escrito.
function transaccion(almacen, modo, trabajo) {
  return new Promise((resolver, rechazar) => {
    const tx = bd.transaction(almacen, modo);
    const resultado = trabajo(tx.objectStore(almacen));
    tx.oncomplete = () => resolver(resultado?.result ?? resultado);
    tx.onerror = () => rechazar(tx.error);
    tx.onabort = () => rechazar(tx.error);
  });
}

export function leerTodo(almacen) {
  return transaccion(almacen, "readonly", (store) => store.getAll());
}

// Guarda (crea o reemplaza) varios objetos en una sola transacción: mucho más
// rápido que uno a uno cuando importamos cientos de contactos.
export function guardarVarios(almacen, objetos) {
  return transaccion(almacen, "readwrite", (store) => {
    for (const objeto of objetos) store.put(objeto);
  });
}

export function borrarVarios(almacen, ids) {
  return transaccion(almacen, "readwrite", (store) => {
    for (const id of ids) store.delete(id);
  });
}

export function vaciar(almacen) {
  return transaccion(almacen, "readwrite", (store) => store.clear());
}
