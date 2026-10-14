// Pantalla de un tablero: barra superior, listas, tarjetas, crear cosas nuevas y el filtro.

import { ETIQUETAS, buscarTablero, cambiar, moverLista, moverTarjeta, nombreEtiqueta, nuevaLista, nuevaTarjeta, tocar } from "./estado.js";
import { abrirMenu, alternarPanel, confirmar, avisar } from "./dialogos.js";
import { exportarTablero } from "./copias.js";
import { abrirDetalle } from "./detalle.js";
import { activarArrastre } from "./arrastre.js";
import { $, el, estadoFecha, fechaCorta, iconos, normalizar, plural } from "./util.js";

let tableroId = null;

// Estado de la interfaz que no se guarda: qué cuadro de texto está abierto y qué filtro hay puesto.
const ui = {
  composer: null, // id de la lista donde se está escribiendo una tarjeta nueva
  nuevaLista: false, // ¿está abierto el cuadro para crear una lista?
  filtroTexto: "",
  filtroEtiquetas: new Set(),
};

const zona = $("zona-listas");
const tableroActual = () => buscarTablero(tableroId);

export function abrirTablero(id) {
  if (id !== tableroId) {
    // Al cambiar de tablero empezamos sin filtros ni cuadros abiertos.
    tableroId = id;
    ui.composer = null;
    ui.nuevaLista = false;
    ui.filtroTexto = "";
    ui.filtroEtiquetas.clear();
    $("buscador").value = "";
    zona.scrollLeft = 0;
  }
  pintarTablero();
}

export function cerrarTablero() {
  tableroId = null;
}

export function pintarTablero() {
  const tablero = tableroActual();
  if (!tablero) return;
  document.title = `${tablero.nombre} · Columnas`;
  $("pantalla-tablero").style.setProperty("--color-tablero", tablero.color);
  // En el móvil, la barra del navegador toma el color del tablero.
  document.querySelector('meta[name="theme-color"]').content = tablero.color;
  const nombre = $("nombre-tablero");
  nombre.textContent = tablero.nombre;
  nombre.setAttribute("aria-label", `Nombre del tablero: ${tablero.nombre}. Pulsa para cambiarlo`);
  pintarListas();
}

/* ---------- Listas ---------- */

function pintarListas() {
  const tablero = tableroActual();
  // Guardamos dónde estaba el desplazamiento para que la vista no "salte" al repintar.
  const scrollX = zona.scrollLeft;
  const scrollsY = new Map([...zona.querySelectorAll(".lista")].map((l) => [l.dataset.id, l.querySelector(".lista-tarjetas").scrollTop]));

  zona.replaceChildren(...tablero.listas.map((lista) => pintarLista(tablero, lista)), pintarHuecoNuevaLista(tablero));

  zona.scrollLeft = scrollX;
  for (const lista of zona.querySelectorAll(".lista")) {
    lista.querySelector(".lista-tarjetas").scrollTop = scrollsY.get(lista.dataset.id) ?? 0;
  }
  aplicarFiltro();

  // Si había un cuadro de texto abierto, lo dejamos listo para seguir escribiendo.
  if (ui.composer) {
    const lista = zona.querySelector(`.lista[data-id="${ui.composer}"]`);
    const tarjetas = lista?.querySelector(".lista-tarjetas");
    if (tarjetas) tarjetas.scrollTop = tarjetas.scrollHeight;
    lista?.querySelector(".composer-texto")?.focus();
  } else if (ui.nuevaLista) {
    zona.querySelector(".nueva-lista input")?.focus();
  }
}

function pintarLista(tablero, lista) {
  const idNombre = `nombre-lista-${lista.id}`;
  return el(
    "section",
    { class: "lista", dataset: { id: lista.id }, "aria-labelledby": idNombre },
    el(
      "header",
      { class: "lista-cabecera", draggable: "true", title: "Arrastra para mover la lista" },
      el(
        "h2",
        { class: "lista-nombre" },
        el(
          "button",
          { id: idNombre, class: "editable", type: "button", title: "Pulsa para cambiar el nombre", onclick: (e) => renombrarLista(e.currentTarget, lista) },
          lista.nombre,
        ),
      ),
      el("span", { class: "lista-cuenta", title: plural(lista.tarjetas.length, "tarjeta", "tarjetas") }, String(lista.tarjetas.length)),
      el("button", {
        class: "boton-icono lista-menu",
        type: "button",
        "aria-label": `Opciones de la lista ${lista.nombre}`,
        "aria-haspopup": "true",
        "aria-expanded": "false",
        html: iconos.puntos,
        onclick: (e) => menuLista(e.currentTarget, lista),
      }),
    ),
    el("div", { class: "lista-tarjetas" }, lista.tarjetas.map((tarjeta) => pintarTarjeta(tablero, tarjeta))),
    el(
      "footer",
      { class: "lista-pie" },
      ui.composer === lista.id ? composer(lista) : botonAnadir(lista),
    ),
  );
}

// Cara visible de una tarjeta: etiquetas, título y una fila de indicadores.
function pintarTarjeta(tablero, tarjeta) {
  const fecha = estadoFecha(tarjeta.fecha, tarjeta.cumplida);
  const hechos = tarjeta.checklist.filter((e) => e.hecha).length;
  const total = tarjeta.checklist.length;
  const tieneDescripcion = tarjeta.descripcion.trim() !== "";
  const etiquetas = ETIQUETAS.filter((e) => tarjeta.etiquetas.includes(e.id));

  const abrir = () => abrirDetalle(tablero.id, tarjeta.id);
  return el(
    "article",
    {
      class: "tarjeta",
      draggable: "true",
      tabindex: "0",
      role: "button",
      dataset: { id: tarjeta.id },
      onclick: abrir,
      onkeydown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir();
        }
      },
    },
    etiquetas.length
      ? el(
          "div",
          { class: "tarjeta-etiquetas" },
          // El nombre de la etiqueta aparece al pasar el puntero (title).
          etiquetas.map((e) =>
            el("span", { class: "punto", role: "img", title: nombreEtiqueta(tablero, e.id), "aria-label": `Etiqueta ${nombreEtiqueta(tablero, e.id)}`, style: { "--c": e.valor } }),
          ),
        )
      : null,
    el("p", { class: "tarjeta-titulo" }, tarjeta.titulo),
    fecha || total || tieneDescripcion
      ? el(
          "div",
          { class: "tarjeta-indicadores" },
          fecha
            ? el(
                "span",
                { class: `indicador fecha ${fecha.clase}`, title: `Fecha límite: ${fecha.texto}` },
                el("span", { class: "icono", html: tarjeta.cumplida ? iconos.check : iconos.reloj }),
                fechaCorta(tarjeta.fecha),
              )
            : null,
          total
            ? el(
                "span",
                { class: `indicador progreso-checklist${hechos === total ? " completa" : ""}`, title: `Checklist: ${hechos} de ${total}` },
                el("span", { class: "icono", html: iconos.checklist }),
                `${hechos}/${total}`,
              )
            : null,
          tieneDescripcion ? el("span", { class: "indicador", title: "Tiene descripción", "aria-label": "Tiene descripción", html: iconos.texto }) : null,
        )
      : null,
  );
}

/* ---------- Crear tarjetas (el "composer") ---------- */

function composer(lista) {
  const texto = el("textarea", {
    class: "composer-texto",
    rows: "2",
    maxlength: "300",
    placeholder: "Título de la tarjeta… (Intro para crear)",
    "aria-label": `Título de la nueva tarjeta en ${lista.nombre}`,
  });
  texto.addEventListener("keydown", (e) => {
    // Intro crea la tarjeta y deja el cuadro listo para otra; Esc cancela.
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      crearTarjeta(lista.id, texto.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cerrarComposer(false, true);
    }
  });
  return el(
    "form",
    {
      class: "composer",
      onsubmit: (e) => {
        e.preventDefault();
        crearTarjeta(lista.id, texto.value);
      },
    },
    texto,
    el(
      "div",
      { class: "composer-botones" },
      el("button", { class: "boton principal pequeno", type: "submit" }, "Añadir tarjeta"),
      el("button", { class: "boton-icono", type: "button", "aria-label": "Cancelar", html: iconos.cerrar, onclick: () => cerrarComposer(false, true) }),
    ),
  );
}

const botonAnadir = (lista) =>
  el("button", { class: "boton-anadir", type: "button", onclick: () => abrirComposer(lista.id) }, el("span", { class: "icono", html: iconos.mas }), "Añadir tarjeta");

function abrirComposer(listaId) {
  const pendiente = textoPendiente();
  ui.composer = listaId;
  ui.nuevaLista = false;
  if (!guardarPendiente(pendiente)) pintarListas(); // si se guardó algo, ya se ha repintado
}

function crearTarjeta(listaId, titulo) {
  const tablero = tableroActual();
  const lista = tablero.listas.find((l) => l.id === listaId);
  titulo = titulo.trim();
  if (!lista || !titulo) return;
  cambiar(() => {
    lista.tarjetas.push(nuevaTarjeta(titulo));
    tocar(tablero);
  });
  if (ui.filtroTexto || ui.filtroEtiquetas.size) avisar("Tarjeta creada. No se ve porque hay un filtro activo.");
}

// Lo que haya escrito en el cuadro abierto (de tarjeta o de lista), para no perderlo al cerrarlo.
function textoPendiente() {
  return {
    listaId: ui.composer,
    tarjeta: zona.querySelector(".composer-texto")?.value.trim() ?? "",
    lista: ui.nuevaLista ? (zona.querySelector(".nueva-lista input")?.value.trim() ?? "") : "",
  };
}

// Convierte el texto pendiente en tarjeta o lista. Devuelve true si creó algo.
function guardarPendiente({ listaId, tarjeta, lista }) {
  if (listaId && tarjeta) crearTarjeta(listaId, tarjeta);
  else if (lista) crearLista(lista);
  else return false;
  return true;
}

function cerrarComposer(guardar = true, enfocar = false) {
  const pendiente = textoPendiente();
  const habiaLista = ui.nuevaLista;
  ui.composer = null;
  ui.nuevaLista = false;
  // Se crea con los cuadros ya cerrados: así el repintado no los vuelve a abrir.
  if (guardar && guardarPendiente(pendiente)) return;
  // Sin nada que guardar, cerramos el cuadro "en el sitio", sin repintar el tablero entero
  // (repintar a mitad de un clic podría deshacer lo que ese clic acaba de abrir).
  const tablero = tableroActual();
  const lista = tablero?.listas.find((l) => l.id === pendiente.listaId);
  const boton = lista ? botonAnadir(lista) : null;
  if (boton) zona.querySelector(".composer")?.replaceWith(boton);
  const hueco = habiaLista && tablero ? pintarHuecoNuevaLista(tablero) : null;
  if (hueco) zona.querySelector(".nueva-lista")?.replaceWith(hueco);
  // Con Esc o "Cancelar" el foco vuelve al botón, para seguir usando el teclado.
  if (enfocar) (boton ?? hueco?.querySelector("button"))?.focus();
}

/* ---------- Crear, renombrar y borrar listas ---------- */

function pintarHuecoNuevaLista(tablero) {
  if (!ui.nuevaLista) {
    return el(
      "div",
      { class: "nueva-lista" },
      el(
        "button",
        { class: "boton-nueva-lista", type: "button", onclick: () => abrirNuevaLista() },
        el("span", { class: "icono", html: iconos.mas }),
        tablero.listas.length ? "Añadir otra lista" : "Añadir una lista",
      ),
    );
  }
  const entrada = el("input", { class: "campo", maxlength: "80", autocomplete: "off", placeholder: "Nombre de la lista…", "aria-label": "Nombre de la nueva lista" });
  entrada.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cerrarComposer(false, true);
    }
  });
  return el(
    "div",
    { class: "nueva-lista abierta" },
    el(
      "form",
      {
        onsubmit: (e) => {
          e.preventDefault();
          if (crearLista(entrada.value)) zona.scrollLeft = zona.scrollWidth; // que se vea la lista nueva
        },
      },
      entrada,
      el(
        "div",
        { class: "composer-botones" },
        el("button", { class: "boton principal pequeno", type: "submit" }, "Añadir lista"),
        el("button", { class: "boton-icono", type: "button", "aria-label": "Cancelar", html: iconos.cerrar, onclick: () => cerrarComposer(false, true) }),
      ),
    ),
  );
}

function abrirNuevaLista() {
  const pendiente = textoPendiente();
  ui.composer = null;
  ui.nuevaLista = true;
  if (!guardarPendiente(pendiente)) pintarListas();
  zona.scrollLeft = zona.scrollWidth;
}

function crearLista(nombre) {
  const tablero = tableroActual();
  nombre = nombre.trim();
  if (!nombre) return false;
  cambiar(() => {
    tablero.listas.push(nuevaLista(nombre));
    tocar(tablero);
  });
  return true;
}

// Edición "en el sitio": el texto se convierte en un campo; Intro o salir guarda y Esc cancela.
function editarEnSitio(boton, alGuardar) {
  const original = boton.textContent;
  const entrada = el("input", { class: "campo-en-sitio", value: original, maxlength: "80", "aria-label": "Nuevo nombre" });
  const arrastrable = boton.closest("[draggable]");
  if (arrastrable) arrastrable.draggable = false; // si no, no se podría seleccionar el texto con el ratón
  boton.replaceWith(entrada);
  entrada.select();

  let terminado = false;
  const terminar = (guardar) => {
    if (terminado) return;
    terminado = true;
    const valor = entrada.value.trim();
    entrada.replaceWith(boton);
    if (arrastrable) arrastrable.draggable = true;
    if (guardar && valor && valor !== original) {
      boton.textContent = valor;
      alGuardar(valor);
    }
  };
  entrada.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      terminar(e.key === "Enter");
      boton.focus();
    }
  });
  entrada.addEventListener("blur", () => terminar(true));
}

function renombrarLista(boton, lista) {
  const tablero = tableroActual();
  // No repintamos todo: solo cambia este nombre (y así no se pierde el clic que hizo salir del campo).
  editarEnSitio(boton, (nombre) =>
    cambiar(
      () => {
        lista.nombre = nombre;
        tocar(tablero);
      },
      { repintar: false },
    ),
  );
}

function menuLista(boton, lista) {
  const tablero = tableroActual();
  const posicion = tablero.listas.indexOf(lista);
  // Mover a izquierda o derecha: la alternativa a arrastrar listas en el móvil y con teclado.
  const mover = (salto) => {
    const vecina = tablero.listas[posicion + salto];
    // Para ir a la derecha se coloca delante de la que va dos puestos después (o al final).
    moverLista(tablero, lista.id, salto < 0 ? vecina.id : (tablero.listas[posicion + 2]?.id ?? null));
    zona.querySelector(`.lista[data-id="${CSS.escape(lista.id)}"] .lista-menu`)?.focus();
  };
  abrirMenu(
    boton,
    [
      { texto: "Cambiar el nombre", icono: iconos.lapiz, accion: () => renombrarLista(zona.querySelector(`#nombre-lista-${CSS.escape(lista.id)}`), lista) },
      posicion > 0 ? { texto: "Mover a la izquierda", icono: iconos.izquierda, accion: () => mover(-1) } : null,
      posicion < tablero.listas.length - 1 ? { texto: "Mover a la derecha", icono: iconos.mover, accion: () => mover(1) } : null,
      {
        texto: "Borrar lista",
        icono: iconos.papelera,
        peligro: true,
        accion: async () => {
          const n = lista.tarjetas.length;
          const mensaje = n ? `También se borrarán sus ${plural(n, "tarjeta", "tarjetas")}. No se puede deshacer.` : "La lista está vacía. No se puede deshacer.";
          if (!(await confirmar(`¿Borrar la lista «${lista.nombre}»?`, mensaje, "Borrar lista"))) return;
          cambiar(() => {
            tablero.listas = tablero.listas.filter((l) => l.id !== lista.id);
            tocar(tablero);
          });
          avisar(`Lista «${lista.nombre}» borrada.`);
        },
      },
    ],
    lista.nombre,
  );
}

/* ---------- Filtro y búsqueda ---------- */

// Oculta las tarjetas que no cumplen el filtro (sin repintar nada) y actualiza el contador.
function aplicarFiltro() {
  const tablero = tableroActual();
  if (!tablero) return;
  const texto = normalizar(ui.filtroTexto.trim());
  const etiquetas = ui.filtroEtiquetas;
  const activo = texto !== "" || etiquetas.size > 0;
  const porId = new Map(tablero.listas.flatMap((l) => l.tarjetas.map((t) => [t.id, t])));

  let visibles = 0;
  for (const nodo of zona.querySelectorAll(".tarjeta")) {
    const t = porId.get(nodo.dataset.id);
    const cumpleTexto = !texto || normalizar(`${t.titulo}\n${t.descripcion}`).includes(texto);
    // Con varias etiquetas marcadas basta con que la tarjeta tenga una de ellas.
    const cumpleEtiquetas = !etiquetas.size || t.etiquetas.some((e) => etiquetas.has(e));
    nodo.hidden = !(cumpleTexto && cumpleEtiquetas);
    if (!nodo.hidden) visibles++;
  }

  $("pantalla-tablero").classList.toggle("filtrando", activo);
  $("estado-filtro").hidden = !activo;
  $("texto-filtro").textContent = `Mostrando ${visibles} de ${plural(porId.size, "tarjeta", "tarjetas")}`;
  const cuenta = $("filtro-cuenta");
  cuenta.hidden = etiquetas.size === 0;
  cuenta.textContent = String(etiquetas.size);
  $("boton-filtro").classList.toggle("activo", etiquetas.size > 0);
}

function construirPanelFiltro() {
  const tablero = tableroActual();
  const todas = tablero.listas.flatMap((l) => l.tarjetas);
  $("panel-filtro").replaceChildren(
    el("p", { class: "menu-titulo" }, "Filtrar por etiquetas"),
    ...ETIQUETAS.map((e) =>
      el(
        "label",
        { class: "opcion-etiqueta" },
        el("input", {
          type: "checkbox",
          checked: ui.filtroEtiquetas.has(e.id),
          onchange: (ev) => {
            if (ev.target.checked) ui.filtroEtiquetas.add(e.id);
            else ui.filtroEtiquetas.delete(e.id);
            aplicarFiltro();
          },
        }),
        el("span", { class: "muestra-etiqueta", style: { "--c": e.valor } }),
        el("span", { class: "opcion-etiqueta-nombre" }, nombreEtiqueta(tablero, e.id)),
        el("span", { class: "opcion-etiqueta-cuenta" }, String(todas.filter((t) => t.etiquetas.includes(e.id)).length)),
      ),
    ),
    el("p", { class: "menu-nota" }, "Se ven las tarjetas que tengan alguna de las etiquetas marcadas."),
  );
}

function quitarFiltro() {
  ui.filtroTexto = "";
  ui.filtroEtiquetas.clear();
  $("buscador").value = "";
  const panel = $("panel-filtro");
  if (panel.matches(":popover-open")) panel.hidePopover();
  aplicarFiltro();
}

/* ---------- Preparar la pantalla (una sola vez al arrancar) ---------- */

export function prepararTablero() {
  $("nombre-tablero").addEventListener("click", (e) => {
    const tablero = tableroActual();
    editarEnSitio(e.currentTarget, (nombre) =>
      cambiar(
        () => {
          tablero.nombre = nombre;
          tocar(tablero);
          document.title = `${nombre} · Columnas`;
        },
        { repintar: false },
      ),
    );
  });

  $("buscador").addEventListener("input", (e) => {
    ui.filtroTexto = e.target.value;
    aplicarFiltro();
  });
  $("buscador").addEventListener("keydown", (e) => {
    if (e.key === "Escape" && e.target.value) quitarFiltro();
  });
  $("boton-filtro").addEventListener("click", (e) => alternarPanel($("panel-filtro"), e.currentTarget, construirPanelFiltro));
  $("quitar-filtro").addEventListener("click", quitarFiltro);
  $("boton-menu-tablero").addEventListener("click", (e) =>
    abrirMenu(e.currentTarget, [{ texto: "Exportar este tablero", icono: iconos.descargar, accion: () => exportarTablero(tableroActual()) }]),
  );

  // Al pulsar fuera de un cuadro de "nueva tarjeta" o "nueva lista", se cierra (guardando lo escrito).
  // Escuchamos el clic cuando ya ha terminado, para no "robárselo" al botón que se pulsó.
  document.addEventListener("click", (e) => {
    if (!tableroId) return;
    if (ui.composer && !e.target.closest(".composer, .boton-anadir")) cerrarComposer(true);
    else if (ui.nuevaLista && !e.target.closest(".nueva-lista")) cerrarComposer(true);
  });

  activarArrastre(zona, {
    alSoltarTarjeta: (tarjetaId, listaId, antesDeId) => moverTarjeta(tableroActual(), tarjetaId, listaId, antesDeId),
    alSoltarLista: (listaId, antesDeId) => moverLista(tableroActual(), listaId, antesDeId),
  });
}
