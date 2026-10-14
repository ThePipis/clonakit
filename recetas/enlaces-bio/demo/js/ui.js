// Pequeñas ayudas de interfaz que usan varios módulos: avisos flotantes, anuncios y ventanas.

// Atajo para coger elementos del HTML por su id: $("nombre").
export const $ = (id) => document.getElementById(id);

// Aviso flotante abajo de la pantalla. Opcionalmente con un botón (por ejemplo "Deshacer").
let temporizadorAviso = null;
export function avisar(mensaje, { tipo = "info", accion = null, duracion = 4000 } = {}) {
  const caja = $("aviso");
  caja.className = "aviso visible aviso-" + tipo;
  caja.replaceChildren();
  const texto = document.createElement("span");
  texto.textContent = mensaje;
  caja.append(texto);
  if (accion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = accion.texto;
    boton.addEventListener("click", () => {
      caja.classList.remove("visible");
      accion.alPulsar();
    });
    caja.append(boton);
  }
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => caja.classList.remove("visible"), duracion);
}

// Anuncio solo para lectores de pantalla (por ejemplo, al mover un enlace).
export function anunciar(mensaje) {
  const zona = $("anuncio");
  zona.textContent = "";
  // Un pequeño retraso hace que el lector lo lea aunque el texto se repita.
  setTimeout(() => (zona.textContent = mensaje), 50);
}

// Abre un <dialog> como ventana modal; el navegador se encarga del foco y de la tecla Esc.
export function abrirDialogo(id) {
  const dialogo = $(id);
  if (!dialogo.open) dialogo.showModal();
}

// Descarga un texto como archivo sin pasar por ningún servidor.
export function descargarArchivo(nombreArchivo, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  // Liberamos la memoria del archivo cuando el navegador ya lo ha cogido.
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}
