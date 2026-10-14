// Crea un archivo .zip sin librerías.
//
// Un .zip es una lista de archivos, cada uno con una pequeña "cabecera" delante
// (nombre, tamaño, fecha y un código de comprobación llamado CRC32), y al final
// un índice con todos ellos. Usamos el método "store" (guardar sin comprimir):
// es el más sencillo y, como son archivos de texto pequeños, ocupa poco igualmente.

// Tabla precalculada para el CRC32 (la "huella" que comprueba que nada se ha estropeado).
const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// El formato zip guarda la fecha y la hora "al estilo MS-DOS", en dos números de 16 bits.
function fechaZip(fecha) {
  return {
    hora: (fecha.getHours() << 11) | (fecha.getMinutes() << 5) | (fecha.getSeconds() >> 1),
    dia: ((fecha.getFullYear() - 1980) << 9) | ((fecha.getMonth() + 1) << 5) | fecha.getDate(),
  };
}

// entradas: [{ ruta: "css/estilo.css", contenido: "..." }] y, para carpetas, { ruta: "css", contenido: null }.
// Devuelve un Blob listo para descargar.
export function crearZip(entradas) {
  const codificador = new TextEncoder();
  const { hora, dia } = fechaZip(new Date());
  const partes = []; // cabeceras locales + datos
  const indice = []; // directorio central (el índice del final)
  let posicion = 0;

  for (const entrada of entradas) {
    const esCarpeta = entrada.contenido === null || entrada.contenido === undefined;
    const nombre = codificador.encode(esCarpeta ? `${entrada.ruta.replace(/\/+$/, "")}/` : entrada.ruta);
    const datos = esCarpeta ? new Uint8Array(0) : codificador.encode(entrada.contenido);
    const crc = crc32(datos);

    // Cabecera local (30 bytes) delante de cada archivo.
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // firma "PK\3\4"
    local.setUint16(4, 20, true); // versión mínima para abrirlo (2.0)
    local.setUint16(6, 0x0800, true); // los nombres van en UTF-8 (para tildes y eñes)
    local.setUint16(8, 0, true); // método 0 = sin comprimir
    local.setUint16(10, hora, true);
    local.setUint16(12, dia, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true); // tamaño comprimido
    local.setUint32(22, datos.length, true); // tamaño real (iguales al no comprimir)
    local.setUint16(26, nombre.length, true);
    local.setUint16(28, 0, true); // sin campos extra
    partes.push(local, nombre, datos);

    // Entrada del índice final (46 bytes) que apunta a la cabecera local.
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true); // firma "PK\1\2"
    central.setUint16(4, 20, true); // creado con la versión 2.0
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, hora, true);
    central.setUint16(14, dia, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, datos.length, true);
    central.setUint32(24, datos.length, true);
    central.setUint16(28, nombre.length, true);
    central.setUint16(30, 0, true); // campo extra
    central.setUint16(32, 0, true); // comentario
    central.setUint16(34, 0, true); // número de disco
    central.setUint16(36, 0, true); // atributos internos
    central.setUint32(38, esCarpeta ? 0x10 : 0, true); // 0x10 = es una carpeta
    central.setUint32(42, posicion, true); // dónde empieza su cabecera local
    indice.push(central, nombre);

    posicion += 30 + nombre.length + datos.length;
  }

  const tamanoIndice = indice.reduce((suma, parte) => suma + parte.byteLength, 0);

  // Registro de cierre (22 bytes): cuántas entradas hay y dónde empieza el índice.
  const cierre = new DataView(new ArrayBuffer(22));
  cierre.setUint32(0, 0x06054b50, true); // firma "PK\5\6"
  cierre.setUint16(4, 0, true);
  cierre.setUint16(6, 0, true);
  cierre.setUint16(8, entradas.length, true);
  cierre.setUint16(10, entradas.length, true);
  cierre.setUint32(12, tamanoIndice, true);
  cierre.setUint32(16, posicion, true);
  cierre.setUint16(20, 0, true);

  return new Blob([...partes, ...indice, cierre], { type: "application/zip" });
}
