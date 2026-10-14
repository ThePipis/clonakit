// Estado compartido del proyecto abierto y un pequeño sistema de avisos.
//
// Los paneles (árbol, editor, vista previa, misiones) no se llaman entre sí:
// cuando algo cambia, se "avisa" con un nombre de evento y cada panel que
// lo escucha se actualiza. Así cada archivo se entiende por separado.

export const estado = {
  proyecto: null, // registro del proyecto: nombre, carpetas, pestañas abiertas, zonas...
  archivos: new Map(), // ruta → { contenido (lo que hay en el editor), guardado (lo que hay en la base de datos) }
  misiones: [], // lista ordenada por prioridad (la primera es la más importante)
};

// Eventos que se usan:
//   "arbol"       cambió la lista de archivos o carpetas
//   "contenido"   cambió el texto de un archivo (dato: ruta)
//   "sucio"       un archivo pasó de guardado a sin guardar o al revés (dato: ruta)
//   "activo"      cambió el archivo abierto en el editor (dato: ruta)
//   "renombrado"  se renombró algo (dato: función que traduce rutas viejas a nuevas)
//   "borrado"     se borró algo (dato: función que dice si una ruta se ha borrado)
//   "reemplazado" se pisaron archivos al arrastrar otros iguales (dato: lista de rutas)
//   "misiones"    cambió alguna misión
const oyentes = new Map();

export function escuchar(evento, funcion) {
  if (!oyentes.has(evento)) oyentes.set(evento, []);
  oyentes.get(evento).push(funcion);
}

export function avisar(evento, dato) {
  for (const funcion of oyentes.get(evento) ?? []) funcion(dato);
}

// Un archivo está "sucio" si lo escrito todavía no se ha guardado.
export function estaSucio(ruta) {
  const archivo = estado.archivos.get(ruta);
  return Boolean(archivo) && archivo.contenido !== archivo.guardado;
}

// ¿Existe ya un archivo o carpeta con esta ruta?
export function existe(ruta) {
  if (estado.archivos.has(ruta)) return true;
  if (estado.proyecto.carpetas.includes(ruta)) return true;
  return [...estado.archivos.keys()].some((r) => r.startsWith(`${ruta}/`));
}

export const esCarpeta = (ruta) => !estado.archivos.has(ruta) && existe(ruta);
