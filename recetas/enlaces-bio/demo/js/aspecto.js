// Sección 3 del editor: temas y personalización (colores, forma de botones y letra).

import { estado, cambiar } from "./estado.js";
import {
  TEMAS, FORMAS, LETRAS, CONTRASTE_MINIMO,
  estiloDeTema, temaActivo, contraste, colorTextoPagina, mejorTextoPara, colorBorde, buscarForma, buscarLetra, formatoContraste,
} from "./temas.js";
import { $ } from "./ui.js";

// Qué campo de color del formulario corresponde a cada propiedad del estilo.
const CAMPOS_COLOR = { "color-fondo": "fondo", "color-boton": "boton", "color-texto-boton": "textoBoton" };

// Crea las muestras de los temas y las opciones de forma y letra (una sola vez, al arrancar).
function crearControles() {
  $("temas").replaceChildren(
    ...TEMAS.map((tema) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "muestra-tema";
      boton.dataset.tema = tema.id;
      // Variables CSS con los colores del tema para dibujar la muestra en miniatura.
      boton.style.setProperty("--m-fondo", tema.fondo);
      boton.style.setProperty("--m-boton", tema.boton);
      boton.style.setProperty("--m-texto", colorTextoPagina(tema.fondo));
      boton.style.setProperty("--m-borde", colorBorde(tema));
      boton.style.setProperty("--m-radio", tema.forma === "recta" ? "0" : tema.forma === "pildora" ? "99px" : "3px");
      boton.innerHTML =
        '<span class="muestra-dibujo" aria-hidden="true"><span class="muestra-circulo"></span>' +
        '<span class="muestra-barra"></span><span class="muestra-barra"></span><span class="muestra-barra"></span></span>' +
        `<span class="muestra-nombre">${tema.nombre}</span>`;
      return boton;
    }),
  );

  $("formas").replaceChildren(...FORMAS.map((forma) => crearOpcion("forma", forma.id, forma.nombre, `<span class="dibujo-forma" style="border-radius:${forma.radio === "999px" ? "99px" : forma.radio === "0" ? "0" : "5px"}"></span>`)));
  $("letras").replaceChildren(...LETRAS.map((letra) => crearOpcion("letra", letra.id, letra.nombre, `<span class="dibujo-letra" style='font-family:${letra.css}'>Aa</span>`)));
}

// Botón de opción (radio) con un dibujo y un nombre; se ven como botones segmentados.
function crearOpcion(grupo, valor, nombre, dibujo) {
  const etiqueta = document.createElement("label");
  etiqueta.className = "opcion-segmento";
  etiqueta.innerHTML = `<input type="radio" name="${grupo}" value="${valor}">${dibujo}<span>${nombre}</span>`;
  return etiqueta;
}

// Pone el formulario de acuerdo con el estado (al arrancar, al cambiar de tema o al abrir un proyecto).
export function pintarAspecto() {
  const { estilo } = estado;
  const activo = temaActivo(estilo);
  for (const muestra of $("temas").children) {
    muestra.setAttribute("aria-pressed", String(muestra.dataset.tema === activo));
  }
  for (const [id, propiedad] of Object.entries(CAMPOS_COLOR)) {
    $(id).value = estilo[propiedad].toLowerCase();
    $(id + "-valor").textContent = estilo[propiedad].toUpperCase();
  }
  document.querySelector(`input[name="forma"][value="${buscarForma(estilo.forma).id}"]`).checked = true;
  document.querySelector(`input[name="letra"][value="${buscarLetra(estilo.letra).id}"]`).checked = true;
  $("tema-personalizado").hidden = Boolean(activo);
  pintarAvisosContraste();
}

// Comprueba si los textos se leen bien y, si no, enseña un aviso con un arreglo de un clic.
function pintarAvisosContraste() {
  const { estilo } = estado;
  const enBoton = contraste(estilo.textoBoton, estilo.boton);
  const enFondo = contraste(colorTextoPagina(estilo.fondo), estilo.fondo);
  const avisoBoton = $("aviso-contraste-boton");
  const avisoFondo = $("aviso-contraste-fondo");

  const botonMal = enBoton < CONTRASTE_MINIMO;
  avisoBoton.hidden = !botonMal;
  if (botonMal) {
    const sugerido = mejorTextoPara(estilo.boton);
    $("texto-aviso-boton").textContent =
      `El texto de los botones se lee mal sobre su color (contraste ${formatoContraste(enBoton)}:1; lo recomendable es al menos 4,5:1).`;
    $("arreglar-contraste").textContent = sugerido === "#FFFFFF" ? "Usar texto blanco" : "Usar texto oscuro";
    $("arreglar-contraste").dataset.color = sugerido;
  }

  const fondoMal = enFondo < CONTRASTE_MINIMO;
  avisoFondo.hidden = !fondoMal;
  if (fondoMal) {
    avisoFondo.querySelector("span").textContent =
      `Tu nombre y tu bio se leerán mal sobre este fondo (contraste ${formatoContraste(enFondo)}:1). Prueba un fondo más claro o más oscuro.`;
  }

  const bien = $("contraste-ok");
  bien.hidden = botonMal || fondoMal;
  bien.textContent = `✓ Se lee bien (contraste de los botones ${formatoContraste(enBoton)}:1)`;
}

export function iniciarAspecto() {
  crearControles();

  $("temas").addEventListener("click", (evento) => {
    const muestra = evento.target.closest(".muestra-tema");
    if (!muestra) return;
    estado.estilo = { tema: muestra.dataset.tema, ...estiloDeTema(muestra.dataset.tema) };
    pintarAspecto();
    cambiar();
  });

  // "input" salta mientras se mueve el selector de color: la vista previa cambia en directo.
  for (const [id, propiedad] of Object.entries(CAMPOS_COLOR)) {
    $(id).addEventListener("input", (evento) => {
      estado.estilo[propiedad] = evento.target.value.toUpperCase();
      estado.estilo.tema = temaActivo(estado.estilo) || "personalizado";
      pintarAspecto();
      cambiar();
    });
  }

  $("formas").addEventListener("change", (evento) => {
    estado.estilo.forma = evento.target.value;
    cambiar();
  });
  $("letras").addEventListener("change", (evento) => {
    estado.estilo.letra = evento.target.value;
    cambiar();
  });

  $("arreglar-contraste").addEventListener("click", (evento) => {
    estado.estilo.textoBoton = evento.currentTarget.dataset.color;
    estado.estilo.tema = temaActivo(estado.estilo) || "personalizado";
    pintarAspecto();
    cambiar();
    $("color-texto-boton").focus();
  });
}
