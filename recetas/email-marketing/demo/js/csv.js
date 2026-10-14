// Lector y escritor de CSV hecho a mano (sin librerías).
// Un CSV es una tabla en texto: una fila por línea y las columnas separadas
// por coma o por punto y coma (Excel en español suele usar punto y coma).
// Si un valor lleva el separador o saltos de línea, va entre comillas, y una
// comilla dentro de un valor se escribe doble: "Dijo ""hola""".

// Mira la primera línea y elige el separador que más aparece fuera de comillas.
function detectarSeparador(texto) {
  const cuenta = { ",": 0, ";": 0, "\t": 0 };
  let dentroDeComillas = false;
  for (const letra of texto) {
    if (letra === '"') dentroDeComillas = !dentroDeComillas;
    else if (!dentroDeComillas && (letra === "\n" || letra === "\r")) break;
    else if (!dentroDeComillas && letra in cuenta) cuenta[letra]++;
  }
  if (cuenta[";"] > cuenta[","] && cuenta[";"] >= cuenta["\t"]) return ";";
  if (cuenta["\t"] > cuenta[","]) return "\t";
  return ",";
}

// Devuelve { separador, filas } donde filas es una lista de listas de textos.
export function leerCSV(texto) {
  texto = texto.replace(/^﻿/, ""); // quita la marca invisible que añade Excel
  const separador = detectarSeparador(texto);
  const filas = [];
  let fila = [];
  let valor = "";
  let dentroDeComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const letra = texto[i];
    if (dentroDeComillas) {
      if (letra === '"' && texto[i + 1] === '"') {
        valor += '"'; // comilla doble = una comilla dentro del valor
        i++;
      } else if (letra === '"') {
        dentroDeComillas = false;
      } else {
        valor += letra;
      }
    } else if (letra === '"') {
      dentroDeComillas = true;
    } else if (letra === separador) {
      fila.push(valor);
      valor = "";
    } else if (letra === "\n" || letra === "\r") {
      if (letra === "\r" && texto[i + 1] === "\n") i++; // fin de línea de Windows
      fila.push(valor);
      filas.push(fila);
      fila = [];
      valor = "";
    } else {
      valor += letra;
    }
  }
  if (valor !== "" || fila.length) {
    fila.push(valor);
    filas.push(fila);
  }
  // Las filas completamente vacías no cuentan.
  return { separador, filas: filas.filter((f) => f.some((v) => v.trim() !== "")) };
}

// Convierte una tabla (lista de listas) en texto CSV.
export function escribirCSV(filas, separador = ";") {
  const escapar = (v) => {
    const texto = String(v ?? "");
    return /["\n\r]/.test(texto) || texto.includes(separador) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  return filas.map((fila) => fila.map(escapar).join(separador)).join("\r\n");
}
