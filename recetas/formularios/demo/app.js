// Punto de entrada de Pregunta. Decide qué pantalla enseñar según lo que hay
// después de "#" en la dirección:
//   #f=...           → el formulario para responder (el enlace que se comparte)
//   #editar=<id>     → el constructor
//   #respuestas=<id> → la tabla de respuestas
//   (nada)           → Mis formularios
// Usar "#" hace que todo funcione en un servidor estático, sin configurar rutas.

import { h, icono, logo } from "./js/ui.js";
import { leerFormularioDeEnlace } from "./js/enlace.js";
import { montarInicio } from "./js/inicio.js";
import { montarConstructor } from "./js/constructor.js";
import { montarRespuestas } from "./js/respuestas.js";
import { montarJugador } from "./js/jugador.js";

const vista = document.getElementById("app");
let desmontar = null; // limpia la pantalla anterior (atajos de teclado, temporizadores…)
let turno = 0; // si la dirección cambia mientras se abre un enlace, gana la última

function pantallaEnlaceRoto() {
  return h(
    "main",
    { class: "enlace-roto" },
    logo(),
    h("h1", {}, "Este enlace no se puede abrir"),
    h("p", {}, "Puede que se haya cortado al copiarlo o pegarlo. Pide a quien te lo envió que te lo mande otra vez."),
    h("a", { class: "boton", href: "./" }, icono("volver"), "Ir a Pregunta"),
  );
}

async function enrutar() {
  const miTurno = ++turno;
  desmontar?.();
  desmontar = null;
  const parametros = new URLSearchParams(location.hash.slice(1));
  const esFormulario = parametros.has("f");
  document.body.classList.toggle("modo-formulario", esFormulario);
  window.scrollTo(0, 0);

  if (esFormulario) {
    try {
      const form = await leerFormularioDeEnlace(parametros.get("f"));
      if (miTurno !== turno) return;
      document.title = form.titulo;
      const jugador = montarJugador(vista, form, { quiosco: parametros.get("quiosco") === "1" });
      desmontar = () => jugador.destruir();
    } catch {
      if (miTurno !== turno) return;
      document.title = "Enlace no válido · Pregunta";
      vista.replaceChildren(pantallaEnlaceRoto());
    }
    return;
  }
  if (parametros.has("editar")) desmontar = montarConstructor(vista, parametros.get("editar"));
  else if (parametros.has("respuestas")) desmontar = montarRespuestas(vista, parametros.get("respuestas"));
  else desmontar = montarInicio(vista);
}

window.addEventListener("hashchange", enrutar);
enrutar();
