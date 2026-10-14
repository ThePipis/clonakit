// ejemplo.js — Los dos puntos de partida de la bienvenida: "empezar vacío" o "cargar un ejemplo".

const MINUTO = 60 * 1000;
const DIA = 24 * 60 * MINUTO;

// Empezar vacío: solo la persona "Tú" y el canal #avisos.
export function crearVacio() {
  return {
    personas: [{ id: "p-tu", nombre: "Tú", color: "#F07B5A" }],
    canales: [{ id: "c-avisos", nombre: "avisos", descripcion: "Anuncios importantes para todo el equipo", archivado: false, creado: Date.now() }],
    mensajes: [],
    lecturas: { "p-tu": {} },
  };
}

// Ejemplo: 3 personas, 3 canales y mensajes repartidos en varios días, con hilos y reacciones.
// Las fechas se calculan desde "ahora" para que siempre salgan separadores como "Hoy" y "Ayer".
export function crearEjemplo() {
  const ahora = Date.now();
  const diaA = (diasAtras, horas, minutos) => new Date(ahora - diasAtras * DIA).setHours(horas, minutos, 0, 0);
  const hace = (minutos) => ahora - minutos * MINUTO;
  const tras = (fecha, minutos) => fecha + minutos * MINUTO;

  let contador = 0;
  const mensajes = [];
  // Añade un mensaje y lo devuelve (para poder colgarle respuestas).
  const escribir = (canal, autor, fecha, texto, reacciones = {}, padre = null) => {
    const m = { id: `m-ej${++contador}`, canal, autor, fecha, texto, editado: false, padre, reacciones };
    mensajes.push(m);
    return m;
  };
  const responder = (original, autor, minutosDespues, texto, reacciones = {}) =>
    escribir(original.canal, autor, tras(original.fecha, minutosDespues), texto, reacciones, original.id);

  const ANA = "p-ana";
  const LUIS = "p-luis";
  const MARTA = "p-marta";

  // #avisos
  escribir("c-avisos", ANA, diaA(6, 9, 5), "¡Hola, equipo! 👋 Estrenamos *Corrillo* para ordenar la comunicación: avisos aquí, pedidos y clientes en #ventas y todo lo demás en #charla.", { "🎉": [LUIS, MARTA], "❤️": [MARTA] });
  const cierre = escribir("c-avisos", ANA, diaA(1, 8, 30), "Recordad: el viernes cerramos a las 14:00 por inventario.", { "👍": [LUIS, MARTA] });
  responder(cierre, MARTA, 20, "¿Hace falta que venga alguien por la tarde?");
  responder(cierre, ANA, 34, "No, lo terminamos el lunes temprano. ¡Gracias, Marta!");

  // #ventas
  const feria = escribir("c-ventas", MARTA, diaA(5, 11, 20), "Os paso el _presupuesto_ de la feria de abril: 1.850 € con stand y folletos.", { "👀": [ANA] });
  responder(feria, LUIS, 15, "¿Y si quitamos los folletos? Así el presupuesto baja bastante.");
  responder(feria, MARTA, 48, "Hablado con ellos: sin folletos se queda en *1.500 €*. ¡Acordado! 🤝", { "🙌": [LUIS, ANA] });
  escribir("c-ventas", LUIS, diaA(1, 12, 10), "Nuevo pedido web: 3 cajas regalo para el 20 de octubre 📦", { "🙌": [ANA] });
  escribir("c-ventas", LUIS, diaA(1, 12, 12), "Lo he apuntado en la hoja de pedidos: https://ejemplo.com/pedidos");
  const floristeria = escribir("c-ventas", ANA, hace(95), "¿Quién envía hoy el presupuesto a *Floristería Rosa*? Lo esperan antes de las 18:00.", { "✅": [MARTA] });
  responder(floristeria, MARTA, 6, "Yo me encargo, lo mando después de comer.");

  // #charla
  const cafe = escribir("c-charla", MARTA, diaA(1, 16, 45), "¿Alguien se apunta a un café el jueves? ☕", { "☕": [ANA, LUIS] });
  responder(cafe, LUIS, 3, "¡Yo!");
  responder(cafe, ANA, 10, "Contad conmigo 🙌");
  escribir("c-charla", LUIS, hace(40), "He traído bizcocho, está en la cocina 🍰", { "😍": [MARTA] });
  escribir("c-charla", LUIS, hace(38), "_Ojo_: es de limón 🍋");

  const canales = [
    { id: "c-avisos", nombre: "avisos", descripcion: "Anuncios importantes para todo el equipo", archivado: false, creado: diaA(7, 9, 0) },
    { id: "c-ventas", nombre: "ventas", descripcion: "Pedidos, presupuestos y clientes", archivado: false, creado: diaA(7, 9, 0) },
    { id: "c-charla", nombre: "charla", descripcion: "Para todo lo que no es trabajo (o casi)", archivado: false, creado: diaA(7, 9, 0) },
  ];

  // Todos lo han leído todo, salvo Ana, que tiene pendiente #charla (así se ve un canal en negrita).
  const todoLeido = () => Object.fromEntries(canales.map((c) => [c.id, ahora]));
  const lecturas = {
    [ANA]: { ...todoLeido(), "c-charla": tras(cafe.fecha, 11) },
    [LUIS]: todoLeido(),
    [MARTA]: todoLeido(),
  };

  return {
    personas: [
      { id: ANA, nombre: "Ana", color: "#F07B5A" },
      { id: LUIS, nombre: "Luis", color: "#4F7CAC" },
      { id: MARTA, nombre: "Marta", color: "#5E9C76" },
    ],
    canales,
    mensajes,
    lecturas,
  };
}
