// Copias de seguridad: exportar tableros a un archivo .json e importarlos después.

import { COLORES_TABLERO, ETIQUETAS, VERSION_FORMATO, buscarTablero, cambiar, copiarConIdsNuevos, datos } from "./estado.js";
import { avisar, elegir } from "./dialogos.js";
import { clonar, hoyISO, nuevoId, plural } from "./util.js";

/* ---------- Exportar ---------- */

// Prepara el archivo y lo descarga. Sin servidor: el navegador crea el archivo en memoria (Blob).
function descargar(nombreArchivo, tableros) {
  const copia = {
    app: "columnas",
    formato: VERSION_FORMATO, // si algún día cambia la forma de los datos, este número dirá cómo leerlos
    exportado: new Date().toISOString(),
    tableros: clonar(tableros),
  };
  const archivo = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombreArchivo;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

export function exportarTodo() {
  if (!datos.tableros.length) return avisar("Todavía no hay tableros que exportar.");
  descargar(`columnas-${hoyISO()}.json`, datos.tableros);
  cambiar(() => (datos.ultimaCopia = new Date().toISOString()));
  avisar(`Copia descargada: ${plural(datos.tableros.length, "tablero", "tableros")}.`, "exito");
}

// Convierte "Pedidos de la tienda" en "pedidos-de-la-tienda" para el nombre del archivo.
const paraArchivo = (texto) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tablero";

export function exportarTablero(tablero) {
  descargar(`columnas-${paraArchivo(tablero.nombre)}-${hoyISO()}.json`, [tablero]);
  avisar(`Tablero «${tablero.nombre}» exportado.`, "exito");
}

/* ---------- Importar ---------- */

// Comprueba el archivo pieza a pieza. Si algo esencial falla lanza un error y no se toca nada.
// Los detalles opcionales que falten (una descripción, una fecha) se rellenan con valores vacíos.
function validar(contenido) {
  if (!contenido || typeof contenido !== "object" || contenido.app !== "columnas") throw new Error("No es una copia de Columnas");
  if (!Number.isInteger(contenido.formato) || contenido.formato > VERSION_FORMATO) throw new Error("Versión del formato desconocida");
  if (!Array.isArray(contenido.tableros) || !contenido.tableros.length) throw new Error("No hay tableros");

  const texto = (valor, porDefecto = "") => (typeof valor === "string" ? valor : porDefecto);
  const colores = COLORES_TABLERO.map((c) => c.valor.toLowerCase());
  const etiquetasValidas = ETIQUETAS.map((e) => e.id);
  const fechaValida = (f) => typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f);
  const ahora = new Date().toISOString();

  return contenido.tableros.map((t) => {
    if (!t || typeof t.nombre !== "string" || !Array.isArray(t.listas)) throw new Error("Tablero mal formado");
    return {
      id: texto(t.id) || nuevoId(),
      nombre: t.nombre.trim() || "Tablero sin nombre",
      color: colores.includes(texto(t.color).toLowerCase()) ? t.color : COLORES_TABLERO[0].valor,
      etiquetas: Object.fromEntries(etiquetasValidas.map((id) => [id, texto(t.etiquetas?.[id])])),
      creado: texto(t.creado, ahora),
      modificado: texto(t.modificado, ahora),
      listas: t.listas.map((l) => {
        if (!l || typeof l.nombre !== "string" || !Array.isArray(l.tarjetas)) throw new Error("Lista mal formada");
        return {
          id: texto(l.id) || nuevoId(),
          nombre: l.nombre,
          tarjetas: l.tarjetas.map((c) => {
            if (!c || typeof c.titulo !== "string") throw new Error("Tarjeta mal formada");
            return {
              id: texto(c.id) || nuevoId(),
              titulo: c.titulo,
              descripcion: texto(c.descripcion),
              etiquetas: Array.isArray(c.etiquetas) ? c.etiquetas.filter((e) => etiquetasValidas.includes(e)) : [],
              fecha: fechaValida(c.fecha) ? c.fecha : null,
              cumplida: c.cumplida === true,
              checklist: (Array.isArray(c.checklist) ? c.checklist : [])
                .filter((e) => e && typeof e.texto === "string")
                .map((e) => ({ id: texto(e.id) || nuevoId(), texto: e.texto, hecha: e.hecha === true })),
              creada: texto(c.creada, ahora),
              modificada: texto(c.modificada, ahora),
            };
          }),
        };
      }),
    };
  });
}

// Lee el archivo elegido, pregunta qué hacer con los tableros repetidos y, al final, lo aplica todo de golpe.
export async function importarArchivo(archivo) {
  let tableros;
  try {
    tableros = validar(JSON.parse(await archivo.text()));
  } catch (error) {
    console.info("Importación rechazada:", error.message); // pista para quien depure
    avisar("Ese archivo no es una copia válida de Columnas. No se ha cambiado nada.", "error");
    return false;
  }

  // Primero decidimos qué hacer con cada tablero; solo después cambiamos los datos.
  // Así, si la persona cancela a mitad, todo queda como estaba.
  const decisiones = [];
  const vistos = new Set();
  for (const tablero of tableros) {
    // Si el mismo archivo trae dos veces el mismo tablero, el segundo entra como copia.
    if (vistos.has(tablero.id)) {
      decisiones.push({ accion: "copia", tablero });
      continue;
    }
    vistos.add(tablero.id);
    const existente = buscarTablero(tablero.id);
    if (!existente) {
      decisiones.push({ accion: "anadir", tablero });
      continue;
    }
    const respuesta = await elegir(
      `«${existente.nombre}» ya existe`,
      "Este tablero ya está en tu navegador. ¿Quieres sustituirlo por el del archivo o guardar el del archivo como una copia?",
      [
        { texto: "Guardar una copia", valor: "copia", estilo: "principal" },
        { texto: "Sustituir", valor: "sustituir", estilo: "peligro" },
      ],
    );
    if (!respuesta) {
      avisar("Importación cancelada. No se ha cambiado nada.");
      return false;
    }
    decisiones.push({ accion: respuesta, tablero });
  }

  cambiar(() => {
    for (const { accion, tablero } of decisiones) {
      if (accion === "sustituir") {
        const indice = datos.tableros.findIndex((t) => t.id === tablero.id);
        datos.tableros[indice] = tablero;
      } else if (accion === "copia") {
        datos.tableros.push(copiarConIdsNuevos(tablero, `${tablero.nombre} (copia)`));
      } else {
        datos.tableros.push(tablero);
      }
    }
  });
  avisar(`Importado: ${plural(decisiones.length, "tablero", "tableros")}.`, "exito");
  return true;
}
