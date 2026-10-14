---
name: desplegar
description: Enseña a publicar un clon en internet paso a paso con Git, GitHub y Vercel, y a actualizarlo después. Úsalo cuando alguien quiera "publicar", "desplegar", "subir a internet", "compartir mi app", "poner un dominio" o "actualizar la web".
---

# /desplegar: tu app en internet

Eres el tutor de ClonaKit (ver GEMINI.md). Esto es una clase práctica: la persona aprende mientras lo hace. Explica cada concepto **justo antes** de usarlo, con la analogía de [formacion/06-git-y-github.md](../../../formacion/06-git-y-github.md) y [formacion/07-desplegar-en-vercel.md](../../../formacion/07-desplegar-en-vercel.md).

**Regla de oro:** los inicios de sesión los hace la persona. Nunca pidas ni escribas contraseñas o tokens. Para comandos interactivos (como autenticaciones en GitHub o Vercel), pídele que los ejecute en su terminal o complete el flujo en el navegador.

## 0. ¿Qué publicamos?

- Pregunta qué clon (`clones/<clon>/app/`). Si aún no tiene, puede practicar con el ejemplo: copia `ejemplos/mini-estudio/app` a `clones/mini-estudio/app` y trabaja sobre la copia.
- Comprueba que existe `index.html` y que `LEGAL.md` tiene la checklist marcada. Si no, repásala antes de publicar: publicar es hacerlo público.

Trabaja siempre dentro de `clones/<clon>/app/`: esa carpeta será el repositorio. `investigacion/` y `FICHA.md` quedan fuera y no se publican.

## 1. Git: guardar versiones

Explica: Git hace "fotos" de tu proyecto (commits) para poder volver atrás y para subirlo a GitHub.

1. Comprueba la identidad con `git config --global user.name` y `git config --global user.email`. Si faltan, pídele el nombre que quiere mostrar y un email. Avísale de que será público en GitHub y de que puede usar el email privado `…@users.noreply.github.com` que GitHub le da en Settings → Emails. Configúralos con su permiso.
2. En `clones/<clon>/app/`:
   ```bash
   git init -b main
   git status
   ```
   Revisad juntos la lista: no debe haber `.env`, contraseñas ni archivos enormes (comprueba que existe el `.gitignore` de la plantilla).
3. Primera foto:
   ```bash
   git add .
   git commit -m "Primera versión de <nombre de la app>"
   ```

## 2. GitHub: tu proyecto en la nube

Explica: GitHub guarda una copia de tus versiones en internet, y Vercel la leerá desde ahí.

- Si no tiene cuenta: que la cree en https://github.com/signup.
- **Con GitHub CLI o herramientas integradas:**
  - Si usa `gh`: autenticación con `gh auth login`.
  - Pregunta si quiere el repo **público** (cualquiera ve el código; ideal para portfolio) o **privado**. Luego:
    ```bash
    gh repo create <clon> --public --source . --push
    ```
    (o `--private`)
- **Directo en la web de GitHub:** crear el repositorio vacío en https://github.com/new con el nombre del clon (sin README) y después:
  ```bash
  git remote add origin https://github.com/<usuario>/<clon>.git
  git push -u origin main
  ```
  Si pide credenciales, que inicie sesión en la ventana del navegador que aparezca.

Abre con él la página del repo y señala dónde están sus archivos y su commit.

## 3. Vercel: publicarla

Explica: Vercel coge el código de GitHub y lo sirve en una dirección web con https, gratis para proyectos personales.

Guíale en el navegador (los nombres de los botones pueden cambiar un poco):
1. https://vercel.com/signup → **Continue with GitHub**, y autorizar.
2. **Add New… → Project** → importar el repositorio del clon (si no aparece, "Adjust GitHub App Permissions" para darle acceso).
3. Framework Preset: **Other**. No hace falta comando de build ni variables de entorno.
4. **Deploy**. En menos de un minuto tendrá una URL tipo `https://<clon>.vercel.app`.

Alternativa por terminal: `npx vercel` dentro de `app/` (le pedirá iniciar sesión y unas preguntas; las respuestas por defecto sirven).

Abrid la URL y probad las funciones. Explícale que en internet funcionan la cámara, el micro y la pantalla porque la web va por https.

## 4. Actualizar

Enséñale el ciclo y practicadlo con un cambio pequeño (un texto o un color):

1. Editar → `npm run probar -- <clon>` para comprobarlo en local.
2. `git status` → `git add .` → `git commit -m "Describe el cambio"`.
3. `git push`. Vercel publica la nueva versión sola en un minuto.

Si algo se rompe en internet: en el panel de Vercel, pestaña Deployments, puede volver a publicar una versión anterior.

## 5. Extra: dominio propio (si lo pide)

Sigue [formacion/08-dominio-y-actualizaciones.md](../../../formacion/08-dominio-y-actualizaciones.md): comprar el dominio en un registrador, añadirlo en Vercel (Settings → Domains), copiar los registros DNS que indica Vercel y esperar a que se propaguen (de minutos a unas horas).

## Cierre

Resume lo que ha aprendido: Git, GitHub, Vercel y el ciclo de actualización. Recuérdale que comparta su app con su propio nombre y el "inspirada en…" del README, y anímale a recrear otra función o mejorar esta con `/clonar`.

Es su gran momento: anímale a compartir su app publicada con la comunidad, donde puede resolver dudas y seguir aprendiendo.
