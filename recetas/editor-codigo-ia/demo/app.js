// Punto de entrada de Taller. Decide qué pantalla se ve según la dirección:
//   #/                → lista de proyectos
//   #/proyecto/<id>   → espacio de trabajo de ese proyecto
// Usar la dirección (el "hash") hace que al recargar sigas en el mismo sitio
// y que el botón Atrás del navegador funcione.

import { recuperarCopiaDeRescate } from "./js/archivos.js";
import { pedirAlmacenPersistente } from "./js/db.js";
import { abrirDialogo, notificar } from "./js/dialogos.js";
import { abrirProyecto, cerrarProyecto, iniciarEspacio } from "./js/espacio.js";
import { iniciarProyectos, mostrarProyectos } from "./js/proyectos.js";
import { $, $$, crear, LOGO_SVG, LISTA_EXTENSIONES } from "./js/util.js";

function mostrarPantalla(nombre) {
  $("#pantalla-proyectos").hidden = nombre !== "proyectos";
  $("#pantalla-espacio").hidden = nombre !== "espacio";
}

// Las navegaciones se encadenan para que dos cambios rápidos no se pisen.
// Lo primero, recuperar lo que no se llegó a guardar la última vez (si hay algo).
let cola = recuperarCopiaDeRescate();
function enrutar() {
  // .catch: si una navegación falla, las siguientes tienen que seguir funcionando.
  cola = cola.catch(() => {}).then(async () => {
    const id = location.hash.match(/^#\/proyecto\/(.+)$/)?.[1];
    await cerrarProyecto();
    if (id && (await abrirProyecto(decodeURIComponent(id)))) {
      mostrarPantalla("espacio");
      return;
    }
    if (id) {
      notificar("Ese proyecto ya no existe en este navegador.", "error");
      history.replaceState(null, "", "#/");
    }
    await mostrarProyectos();
    mostrarPantalla("proyectos");
    document.title = "Taller";
  });
  return cola;
}

// Ayuda breve con los límites de esta versión (la ficha pide explicarlos).
function mostrarAyuda() {
  const punto = (titulo, texto) => crear("li", {}, [crear("strong", { text: titulo }), crear("span", { text: texto })]);
  abrirDialogo({
    titulo: "Cómo funciona Taller",
    clase: "dialogo--ancho",
    cuerpo: crear("div", { class: "ayuda" }, [
      crear("ul", { class: "ayuda__lista" }, [
        punto("Se guarda solo.", " Cada archivo se guarda un segundo después de dejar de escribir, y al momento con Ctrl/Cmd+S. Todo vive en este navegador: nada sale de tu ordenador salvo lo que copies tú."),
        punto("Solo archivos de texto.", ` Taller trabaja con ${LISTA_EXTENSIONES}. Puedes arrastrarlos desde tu ordenador al árbol.`),
        punto("Qué enseña la vista previa.", " El index.html del proyecto, o la página .html que tengas abierta. Se recarga sola medio segundo después de dejar de escribir."),
        punto("Sin almacenamiento en la vista previa.", " Por seguridad, dentro de la vista previa no funcionan localStorage, IndexedDB ni las cookies. Para probarlos, descarga el .zip y ábrelo con npm run probar."),
        punto("Misiones.", " Apunta lo que le pides a la IA. «Copiar para la IA» junta el objetivo, el criterio de hecho y el código actual de los archivos marcados."),
        punto("Haz copias.", " Si borras los datos del navegador, se borran tus proyectos. Descarga el .zip para publicar o el .json para tener una copia que puedes volver a importar."),
      ]),
      crear("p", { class: "ayuda__atajos" }, [
        crear("kbd", { text: "Ctrl/Cmd+S" }),
        crear("span", { text: " guardar · " }),
        crear("kbd", { text: "Tab" }),
        crear("span", { text: " / " }),
        crear("kbd", { text: "Mayús+Tab" }),
        crear("span", { text: " sangría · " }),
        crear("kbd", { text: "Esc" }),
        crear("span", { text: " y luego Tab para salir del editor" }),
      ]),
    ]),
    botones: [{ texto: "Entendido", valor: "ok", clase: "boton--principal" }],
  });
}

// Arranque.
for (const lugar of $$("[data-logo]")) lugar.innerHTML = LOGO_SVG;
for (const boton of $$("[data-ayuda]")) boton.addEventListener("click", mostrarAyuda);
pedirAlmacenPersistente();
iniciarProyectos();
iniciarEspacio();
addEventListener("hashchange", enrutar);
enrutar();
