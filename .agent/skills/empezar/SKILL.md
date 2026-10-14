---
name: empezar
description: Da la bienvenida a ClonaKit, abre las diapositivas de formación, comprueba que el ordenador tiene Node.js, Git y REA, instala lo que falte y explica el flujo. Úsalo la primera vez o cuando alguien diga "empezar", "instalar", "no sé por dónde empezar" o "qué es esto".
---

# /empezar: bienvenida, formación exprés y preparación

Eres el tutor de ClonaKit (ver GEMINI.md). Esta persona probablemente nunca ha programado y casi seguro tiene un negocio. Ve paso a paso y no avances sin que haya entendido.

## 1. Bienvenida (muy breve)

En 2–3 frases: ClonaKit sirve para crear **tu propia versión** de las herramientas que usas en tu negocio, desde cero y de forma legal, y publicarla en internet con tu marca. Tú (Antigravity) le acompañas en cada paso.

## 2. Formación exprés: las diapositivas

Dile que antes de nada verá 11 diapositivas (unos 5 minutos) sobre cómo clonar apps de forma legal, para uso personal y comercial. Ábrelas:

```bash
npm run diapositivas
```

Si `npm` aún no funciona (todavía no tiene Node.js), ábrelas directamente: `open formacion/diapositivas.html` en Mac o `start formacion\diapositivas.html` en Windows.

Dile que avance con la flecha → y que te avise cuando termine. Después pregúntale si le ha quedado alguna duda, sobre todo del **semáforo** (sí / con cuidado / nunca) y del **uso comercial**. Responde con ejemplos de su negocio si te lo cuenta.

## 3. Conocerle

Pregunta, de una en una:
- ¿A qué se dedica tu negocio?
- ¿Qué herramientas de pago usas a diario que te gustaría tener a tu manera?
- ¿Usas Mac o Windows? ¿Has programado alguna vez?

Adapta el resto a sus respuestas y guarda sus herramientas para proponerle luego una receta.

## 4. Comprobar el ordenador

Di que vas a revisar si tiene lo necesario y ejecuta:

```bash
npm run comprobar
```

- Si falla porque no existe `npm` o `node`: falta Node.js. Guíale con [formacion/01-preparar-tu-ordenador.md](../../../formacion/01-preparar-tu-ordenador.md) (versión LTS desde nodejs.org y **abrir una terminal nueva**). Espera a que confirme y repite.
- Si falta **REA**: explica que es la herramienta de investigación del kit y pide permiso para ejecutar `npm install`, que descarga unos 8 MB y tarda menos de un minuto.
- Si falta **Git**: indica cómo instalarlo según su sistema (Mac: `xcode-select --install`; Windows: git-scm.com). Hace falta para publicar, no para empezar.
- **Chrome** y **GitHub CLI** son opcionales: explica para qué sirven y que se pueden instalar más tarde.

Repite `npm run comprobar` hasta que lo imprescindible salga en ✅.

## 5. Ver un clon terminado

Propón ver el ejemplo incluido, **MiniEstudio**, un estudio de grabación web inspirado en OBS Studio:

```bash
npm run probar -- ejemplos/mini-estudio/app
```

Lánzalo en segundo plano. Cuéntale qué está viendo (escenas, fuentes, mezclador, grabar) y que salió del mismo flujo que va a seguir. Cuando termine de mirarlo, para el servidor.

## 6. Siguiente paso

- Si tiene clara la app que quiere: pasa a `/clonar`.
- Si prefiere ver el catálogo de recetas listas para elegir: enséñale [recetas/README.md](../../../recetas/README.md) y pasa a `/clonar`.
- Si quiere leer antes: recomiéndale [formacion/02-lo-legal.md](../../../formacion/02-lo-legal.md) y [formacion/03-investigar-una-app.md](../../../formacion/03-investigar-una-app.md).
