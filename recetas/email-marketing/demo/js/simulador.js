// "Probar con un contacto": recorre la automatización como si el contacto
// entrara en ella y apunta qué camino seguiría. No espera ni envía nada:
// solo calcula y describe cada paso.

import { estado } from "./estado.js";
import { cumpleCondicion, cumpleSegmento, describirCondicion } from "./condiciones.js";
import { limpiarEtiqueta } from "./ui.js";

export function textoEspera(paso) {
  const n = Number(paso.cantidad) || 0;
  if (paso.unidad === "horas") return `${n} ${n === 1 ? "hora" : "horas"}`;
  return `${n} ${n === 1 ? "día" : "días"}`;
}

export function nombreEmail(id) {
  return estado.emails.find((e) => e.id === id)?.nombre;
}

export function nombreSegmento(id) {
  return estado.segmentos.find((s) => s.id === id)?.nombre;
}

// ¿Se cumple la condición de un paso "condición" para este contacto?
export function evaluarCondicion(paso, contacto) {
  if (paso.criterio === "segmento") {
    const segmento = estado.segmentos.find((s) => s.id === paso.segmentoId);
    return segmento ? cumpleSegmento(contacto, segmento) : false;
  }
  if (paso.criterio === "campo") return cumpleCondicion(contacto, paso.regla);
  return (contacto.etiquetas ?? []).includes(limpiarEtiqueta(paso.etiqueta));
}

export function preguntaCondicion(paso) {
  if (paso.criterio === "segmento") return `¿Está en el segmento «${nombreSegmento(paso.segmentoId) ?? "?"}»?`;
  if (paso.criterio === "campo") return `¿${describirCondicion(paso.regla)}?`.replace("¿condición sin completar?", "Condición sin completar");
  return paso.etiqueta ? `¿Tiene la etiqueta «${paso.etiqueta}»?` : "Elige una etiqueta";
}

// Devuelve la lista de pasos recorridos: { nodo, fin, texto, nota }.
//  nodo: id de la caja que se ilumina ("disparador" o el id del paso)
//  fin:  clave del final de rama cuando se acaba sin un paso "Fin"
//  nota: frase corta que se pinta dentro de la caja
export function simular(auto, contactoReal) {
  const contacto = structuredClone(contactoReal); // copia: las etiquetas que "ponga" la prueba no tocan al contacto real
  contacto.etiquetas ??= [];
  const nombre = contacto.nombre || contacto.email;
  const recorrido = [];
  let horas = 0;
  const tiempo = () => (horas === 0 ? "al momento" : horas % 24 === 0 ? `día ${horas / 24}` : `día ${Math.floor(horas / 24)}, +${horas % 24} h`);

  // 1) El disparador: ¿cumple ya la condición de entrada?
  const d = auto.disparador;
  let textoEntrada;
  if (d.tipo === "segmento") {
    const segmento = estado.segmentos.find((s) => s.id === d.segmentoId);
    const dentro = segmento && cumpleSegmento(contacto, segmento);
    textoEntrada = dentro ? `${nombre} está en el segmento «${segmento.nombre}»: entra en la automatización.` : `${nombre} todavía no está en el segmento «${segmento?.nombre ?? "?"}». Simulamos qué pasaría cuando entre.`;
  } else if (d.tipo === "alta") {
    textoEntrada = `Entra en cuanto se crea el contacto de ${nombre}.`;
  } else {
    const etiqueta = limpiarEtiqueta(d.etiqueta);
    textoEntrada = contacto.etiquetas.includes(etiqueta)
      ? `${nombre} tiene la etiqueta «${etiqueta}»: entra en la automatización.`
      : `${nombre} todavía no tiene la etiqueta «${etiqueta}». Simulamos qué pasaría al ponérsela.`;
    if (etiqueta && !contacto.etiquetas.includes(etiqueta)) contacto.etiquetas.push(etiqueta);
  }
  recorrido.push({ nodo: "disparador", texto: textoEntrada, nota: "Entra aquí" });

  // 2) Los pasos, en orden. En una condición seguimos solo por la rama que toca.
  function recorrer(pasos, claveFin) {
    for (const paso of pasos) {
      if (paso.tipo === "espera") {
        horas += (Number(paso.cantidad) || 0) * (paso.unidad === "horas" ? 1 : 24);
        recorrido.push({ nodo: paso.id, texto: `Aquí esperaría ${textoEspera(paso)} (sin esperar de verdad). Ahora: ${tiempo()}.`, nota: `Aquí esperaría ${textoEspera(paso)}` });
      } else if (paso.tipo === "email") {
        const titulo = nombreEmail(paso.emailId);
        recorrido.push({ nodo: paso.id, texto: titulo ? `Recibiría el email «${titulo}» (${tiempo()}). No se envía nada.` : "Aquí recibiría un email, pero el paso no tiene ninguno elegido.", nota: titulo ? "Recibiría este email" : "Falta elegir el email" });
      } else if (paso.tipo === "etiqueta") {
        const etiqueta = limpiarEtiqueta(paso.etiqueta);
        if (paso.accion === "quitar") contacto.etiquetas = contacto.etiquetas.filter((e) => e !== etiqueta);
        else if (etiqueta && !contacto.etiquetas.includes(etiqueta)) contacto.etiquetas.push(etiqueta);
        recorrido.push({ nodo: paso.id, texto: `${paso.accion === "quitar" ? "Se le quitaría" : "Se le pondría"} la etiqueta «${etiqueta}».`, nota: paso.accion === "quitar" ? "Se le quitaría" : "Se le pondría" });
      } else if (paso.tipo === "condicion") {
        const si = evaluarCondicion(paso, contacto);
        recorrido.push({ nodo: paso.id, texto: `${preguntaCondicion(paso)} → ${si ? "Sí" : "No"}. Sigue por la rama «${si ? "Sí" : "No"}».`, nota: si ? "Sí → rama Sí" : "No → rama No", rama: si ? "si" : "no" });
        return recorrer(si ? paso.si : paso.no, `${paso.id}-${si ? "si" : "no"}`);
      } else if (paso.tipo === "fin") {
        recorrido.push({ nodo: paso.id, texto: "Fin: aquí termina el recorrido.", nota: "Termina aquí" });
        return;
      }
    }
    // Rama terminada sin un paso "Fin".
    recorrido.push({ fin: claveFin, texto: "Aquí se acaba esta rama: termina el recorrido." });
  }
  recorrer(auto.pasos, "raiz");
  return { recorrido, horas, nombre };
}
