// Archivos de la "plantilla básica" con la que se puede empezar un proyecto,
// y el esqueleto que reciben los archivos .html nuevos.

import { escaparHtml } from "./util.js";

export function archivosPlantilla(nombreProyecto) {
  const titulo = escaparHtml(nombreProyecto);
  return [
    {
      ruta: "index.html",
      contenido: `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="tarjeta">
    <h1>${titulo}</h1>
    <p>Edita <code>index.html</code>, <code>style.css</code> y <code>app.js</code>. La vista previa se actualiza sola.</p>
    <button id="boton">Púlsame</button>
    <p id="mensaje"></p>
  </main>

  <script src="app.js"></script>
</body>
</html>
`,
    },
    {
      ruta: "style.css",
      contenido: `/* Estilos de la página. Prueba a cambiar los colores. */
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #fdf6e9;
  color: #2b2118;
}

.tarjeta {
  max-width: 420px;
  margin: 24px;
  padding: 32px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

h1 {
  margin-top: 0;
  color: #c2410c;
}

button {
  font: inherit;
  padding: 10px 18px;
  border: none;
  border-radius: 999px;
  background: #c2410c;
  color: #ffffff;
  cursor: pointer;
}
`,
    },
    {
      ruta: "app.js",
      contenido: `// Este código se ejecuta cuando carga la página.
const boton = document.getElementById("boton");
const mensaje = document.getElementById("mensaje");
let veces = 0;

boton.addEventListener("click", () => {
  veces = veces + 1;
  mensaje.textContent = "Has pulsado " + veces + (veces === 1 ? " vez." : " veces.");
  console.log("Clic número", veces);
});

console.log("¡La página está lista!");
`,
    },
  ];
}

// Un archivo .html nuevo no empieza vacío: trae lo mínimo para verse en la vista previa.
export function esqueletoHtml(titulo) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escaparHtml(titulo)}</title>
</head>
<body>
  <h1>${escaparHtml(titulo)}</h1>

</body>
</html>
`;
}
