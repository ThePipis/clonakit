// Punto de entrada de MiEnlace: arranca cada sección del editor y las conecta con el estado.
// Cada sección vive en su propio archivo dentro de js/ para que sea fácil de leer.

import { estado, alCambiar } from "./estado.js";
import { iniciarPerfil, pintarPerfil } from "./perfil.js";
import { iniciarEnlaces, pintarEnlaces } from "./enlaces.js";
import { iniciarAspecto, pintarAspecto } from "./aspecto.js";
import { iniciarPublicar, pintarPublicar } from "./publicar.js";
import { iniciarVistaPrevia, pedirRedibujo } from "./vista-previa.js";
import { svgLogo } from "./iconos.js";
import { $ } from "./ui.js";

// Vuelve a pintar todo el formulario a partir del estado (al arrancar o al abrir otro proyecto).
function pintarTodo() {
  pintarPerfil();
  pintarEnlaces();
  pintarAspecto();
  pintarPublicar();
  pedirRedibujo();
}

// Logo en la barra superior (el de la pestaña ya va dentro de index.html).
$("logo").innerHTML = svgLogo(30);

iniciarPerfil();
iniciarEnlaces();
iniciarAspecto();
iniciarPublicar();
iniciarVistaPrevia();
pintarTodo();

// Cualquier cambio en el estado redibuja la vista previa.
alCambiar(pedirRedibujo);
document.addEventListener("proyecto-cargado", pintarTodo);

// Indicador de guardado automático en la barra superior.
document.addEventListener("guardado", (evento) => {
  const indicador = $("estado-guardado");
  indicador.textContent = evento.detail.ok ? "Guardado en este navegador" : "No se pudo guardar en este navegador";
  indicador.classList.toggle("con-error", !evento.detail.ok);
});

// Si alguien abre la consola, le dejamos una pista de cómo está hecho.
console.info(`MiEnlace listo: ${estado.enlaces.length} enlaces cargados. El código está en la carpeta js/.`);
