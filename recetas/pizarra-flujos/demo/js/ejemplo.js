// Diagrama de ejemplo que se muestra en la primera visita, para no empezar con la pizarra en blanco.
// Las flechas se recolocan solas en el borde de sus formas al cargar (recalcularFlechas).

import { VERSION_FORMATO } from "./constantes.js";

const TINTA = "#1E2A3A";
const SALVIA = "#5B8C5A";
const TERRACOTA = "#C8553D";
const AZUL = "#2F6690";

const forma = (id, tipo, x, y, ancho, alto, texto, trazo = TINTA, relleno = "ninguno") => ({
  id, tipo, x, y, ancho, alto, texto, trazo, relleno, grosor: 2, linea: "continua", tamano: 20, semilla: 1000 + id.length * 97 + x,
});

const flecha = (id, desde, hasta, texto = "") => ({
  id, tipo: "flecha", desde, hasta, x1: 0, y1: 0, x2: 0, y2: 0, texto, trazo: TINTA, relleno: "ninguno", grosor: 2, linea: "continua", tamano: 18, semilla: 2000 + id.length * 31,
});

export const EJEMPLO = {
  formato: "trazo",
  version: VERSION_FORMATO,
  elementos: [
    forma("titulo", "texto", 420, 70, 260, 40, "Flujo de un pedido", AZUL),
    forma("pedido", "rectangulo", 440, 150, 220, 80, "Llega el pedido"),
    forma("stock", "rombo", 450, 300, 200, 130, "¿Hay stock?"),
    forma("enviar", "rectangulo", 220, 510, 220, 80, "Preparar y enviar", SALVIA, "suave"),
    forma("avisar", "rectangulo", 660, 510, 220, 80, "Avisar al cliente", TERRACOTA, "suave"),
    forma("fin", "elipse", 470, 670, 160, 70, "Cliente feliz"),
    flecha("f1", "pedido", "stock"),
    flecha("f2", "stock", "enviar", "Sí"),
    flecha("f3", "stock", "avisar", "No"),
    flecha("f4", "enviar", "fin"),
    flecha("f5", "avisar", "fin"),
  ],
};
