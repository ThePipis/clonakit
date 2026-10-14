// MiniEstudio: escenas con fuentes colocadas a mano, compuestas en un canvas
// de 1920×1080 y grabadas con MediaRecorder.

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const FPS = 30;
const TRANSITION_MS = 300;
const SNAP_PX = 24;
const MIN_ITEM_W = 40;

const $ = (id) => document.getElementById(id);

// El canvas "programa" es lo que se graba; la vista previa le añade encima el recuadro de selección.
const program = document.createElement("canvas");
program.width = CANVAS_W;
program.height = CANVAS_H;
const programCtx = program.getContext("2d");
const preview = $("preview");
const previewCtx = preview.getContext("2d");

let nextId = 1;
const newId = () => nextId++;

const state = {
  scenes: [],
  currentSceneId: null,
  selectedItemId: null,
  transition: null, // { fromSceneId, start }
};

const currentScene = () => state.scenes.find((s) => s.id === state.currentSceneId);
const selectedItem = () =>
  currentScene()?.items.find((item) => item.id === state.selectedItemId) ?? null;

// ---------------------------------------------------------------------------
// Escenas

function createScene(name) {
  const scene = { id: newId(), name, items: [] };
  state.scenes.push(scene);
  return scene;
}

function switchScene(sceneId, { animate = true } = {}) {
  if (sceneId === state.currentSceneId) return;
  state.transition =
    animate && state.currentSceneId !== null
      ? { fromSceneId: state.currentSceneId, start: performance.now() }
      : null;
  state.currentSceneId = sceneId;
  state.selectedItemId = null;
  renderScenes();
  renderSources();
}

function addScene() {
  const scene = createScene(`Escena ${state.scenes.length + 1}`);
  switchScene(scene.id);
}

function removeCurrentScene() {
  if (state.scenes.length <= 1) return;
  const scene = currentScene();
  if (!confirm(`¿Eliminar la escena "${scene.name}"?`)) return;
  scene.items.forEach(releaseItem);
  state.scenes = state.scenes.filter((s) => s !== scene);
  switchScene(state.scenes[0].id, { animate: false });
}

function renameScene(scene) {
  const name = prompt("Nombre de la escena:", scene.name)?.trim();
  if (!name) return;
  scene.name = name;
  renderScenes();
}

// ---------------------------------------------------------------------------
// Fuentes. Cada elemento de la escena tiene su propia fuente; items[0] se dibuja encima.

const mediaPool = $("media-pool");

async function videoItem(name, kind, stream) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  mediaPool.append(video);
  await video.play();
  if (!video.videoWidth) {
    await new Promise((resolve) => video.addEventListener("loadedmetadata", resolve, { once: true }));
  }

  const aspect = video.videoWidth / video.videoHeight;
  const item = { kind, name, el: video, stream, aspect, offline: false };
  if (kind === "camera") {
    item.w = CANVAS_W * 0.25;
    item.h = item.w / aspect;
    item.x = CANVAS_W - item.w - 40;
    item.y = CANVAS_H - item.h - 40;
  } else {
    fitToCanvas(item);
  }

  // Si la persona pulsa "Dejar de compartir" en el navegador, la fuente se marca desconectada.
  stream.getVideoTracks()[0].addEventListener("ended", () => {
    item.offline = true;
    renderSources();
  });
  return item;
}

function pickImage() {
  const input = $("image-input");
  input.value = "";
  return new Promise((resolve) => {
    input.onchange = () => resolve(input.files[0] ?? null);
    input.click();
  });
}

async function imageItem(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();
  const aspect = img.naturalWidth / img.naturalHeight;
  const w = Math.min(img.naturalWidth, CANVAS_W * 0.4);
  return { kind: "image", name: file.name, el: img, aspect, x: 60, y: 60, w, h: w / aspect };
}

async function addSource(kind) {
  const scene = currentScene();
  let item;
  try {
    if (kind === "screen") {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: FPS },
        audio: true,
      });
      item = await videoItem("Captura de pantalla", kind, stream);
    } else if (kind === "camera") {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      item = await videoItem("Cámara", kind, stream);
    } else if (kind === "text") {
      const text = prompt("Texto:", "Hola desde MiniEstudio")?.trim();
      if (!text) return;
      item = { kind, name: `Texto: ${text}`, text, x: 80, y: 80, w: 0, h: 96 };
    } else if (kind === "image") {
      const file = await pickImage();
      if (!file) return;
      item = await imageItem(file);
    }
  } catch (err) {
    // NotAllowedError = la persona ha cancelado o denegado el permiso: no es un fallo.
    if (err.name !== "NotAllowedError") alert(`No se pudo añadir la fuente: ${err.message}`);
    return;
  }

  item.id = newId();
  item.visible = true;
  scene.items.unshift(item);
  state.selectedItemId = item.id;

  const audioTrack = item.stream?.getAudioTracks()[0];
  if (audioTrack) addAudioChannel("Audio de pantalla", new MediaStream([audioTrack]), item.id);

  renderSources();
}

function releaseItem(item) {
  item.stream?.getTracks().forEach((track) => track.stop());
  if (item.el instanceof HTMLVideoElement) item.el.remove();
  if (item.el instanceof HTMLImageElement) URL.revokeObjectURL(item.el.src);
  audio.channels.filter((ch) => ch.ownerItemId === item.id).forEach(removeAudioChannel);
}

function removeSelectedItem() {
  const scene = currentScene();
  const item = selectedItem();
  if (!item) return;
  releaseItem(item);
  scene.items = scene.items.filter((i) => i !== item);
  state.selectedItemId = null;
  renderSources();
}

function moveSelectedItem(delta) {
  const items = currentScene().items;
  const index = items.findIndex((i) => i.id === state.selectedItemId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
  renderSources();
}

function fitToCanvas(item) {
  const aspect = item.aspect ?? item.w / item.h;
  if (aspect >= CANVAS_W / CANVAS_H) {
    item.w = CANVAS_W;
    item.h = CANVAS_W / aspect;
  } else {
    item.h = CANVAS_H;
    item.w = CANVAS_H * aspect;
  }
  item.x = (CANVAS_W - item.w) / 2;
  item.y = (CANVAS_H - item.h) / 2;
}

// ---------------------------------------------------------------------------
// Composición

function drawItem(ctx, item) {
  if (!item.visible) return;

  if (item.kind === "text") {
    ctx.font = `600 ${item.h * 0.8}px -apple-system, system-ui, sans-serif`;
    ctx.textBaseline = "top";
    item.w = ctx.measureText(item.text).width;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgb(0 0 0 / 0.6)";
    ctx.shadowBlur = item.h * 0.08;
    ctx.fillText(item.text, item.x, item.y + item.h * 0.1);
    ctx.shadowBlur = 0;
    return;
  }

  if (item.offline) {
    ctx.fillStyle = "#2a1d1d";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = "#ff9c9c";
    ctx.font = "32px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("Fuente desconectada", item.x + 24, item.y + item.h / 2);
    return;
  }

  const ready = item.el instanceof HTMLVideoElement ? item.el.readyState >= 2 : item.el.complete;
  if (ready) ctx.drawImage(item.el, item.x, item.y, item.w, item.h);
}

function drawScene(ctx, scene) {
  if (!scene) return;
  for (let i = scene.items.length - 1; i >= 0; i--) drawItem(ctx, scene.items[i]);
}

function renderProgram(now) {
  programCtx.fillStyle = "#000";
  programCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const transition = state.transition;
  if (!transition) {
    drawScene(programCtx, currentScene());
    return;
  }
  // Fundido: la escena saliente se queda opaca y la entrante aparece encima poco a poco.
  const progress = Math.min(1, (now - transition.start) / TRANSITION_MS);
  drawScene(programCtx, state.scenes.find((s) => s.id === transition.fromSceneId));
  programCtx.globalAlpha = progress;
  drawScene(programCtx, currentScene());
  programCtx.globalAlpha = 1;
  if (progress >= 1) state.transition = null;
}

// Unidades del canvas por píxel de pantalla, para que el recuadro de selección se vea siempre igual.
const previewScale = () => CANVAS_W / preview.getBoundingClientRect().width;

function handleRect(item) {
  const size = 14 * previewScale();
  return { x: item.x + item.w - size / 2, y: item.y + item.h - size / 2, size };
}

function renderPreview() {
  previewCtx.drawImage(program, 0, 0);
  const item = selectedItem();
  if (!item?.visible) return;

  const scale = previewScale();
  previewCtx.strokeStyle = "#e33";
  previewCtx.lineWidth = 2 * scale;
  previewCtx.strokeRect(item.x, item.y, item.w, item.h);
  const handle = handleRect(item);
  previewCtx.fillStyle = "#e33";
  previewCtx.fillRect(handle.x, handle.y, handle.size, handle.size);
}

// Un worker marca el ritmo de fotogramas: a diferencia de requestAnimationFrame, sigue
// funcionando cuando la ventana queda detrás de otras apps, que es justo cuando grabas.
const ticker = new Worker(
  URL.createObjectURL(
    new Blob([`setInterval(() => postMessage(0), ${1000 / FPS});`], { type: "text/javascript" }),
  ),
);

let frames = 0;
let fpsWindowStart = performance.now();

ticker.onmessage = () => {
  const now = performance.now();
  renderProgram(now);
  renderPreview();

  frames++;
  if (now - fpsWindowStart >= 1000) {
    $("fps").textContent = `${Math.round((frames * 1000) / (now - fpsWindowStart))} FPS`;
    frames = 0;
    fpsWindowStart = now;
  }
};

// ---------------------------------------------------------------------------
// Vista previa: seleccionar, mover (con imán en los bordes) y redimensionar sin deformar.

let drag = null;

function canvasPoint(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * CANVAS_W) / rect.width,
    y: ((event.clientY - rect.top) * CANVAS_H) / rect.height,
  };
}

const contains = (r, p) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

function hitTest(point) {
  return currentScene().items.find((item) => item.visible && contains(item, point)) ?? null;
}

function snap(value, size, limit) {
  if (Math.abs(value) < SNAP_PX) return 0;
  if (Math.abs(value + size - limit) < SNAP_PX) return limit - size;
  return value;
}

preview.addEventListener("pointerdown", (event) => {
  const point = canvasPoint(event);
  const selected = selectedItem();
  const handle = selected && handleRect(selected);

  if (handle && contains({ x: handle.x, y: handle.y, w: handle.size, h: handle.size }, point)) {
    drag = { mode: "resize", item: selected, start: point, w: selected.w, h: selected.h };
  } else {
    const item = hitTest(point);
    state.selectedItemId = item?.id ?? null;
    renderSources();
    if (!item) return;
    drag = { mode: "move", item, start: point, x: item.x, y: item.y };
  }
  preview.setPointerCapture(event.pointerId);
});

preview.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const dx = point.x - drag.start.x;
  const dy = point.y - drag.start.y;
  const { item } = drag;

  if (drag.mode === "move") {
    item.x = snap(drag.x + dx, item.w, CANVAS_W);
    item.y = snap(drag.y + dy, item.h, CANVAS_H);
  } else {
    const aspect = drag.w / drag.h;
    item.w = Math.max(MIN_ITEM_W, drag.w + dx);
    item.h = item.w / aspect;
  }
});

preview.addEventListener("pointerup", () => {
  drag = null;
});

preview.addEventListener("dblclick", (event) => {
  const item = hitTest(canvasPoint(event));
  if (item && item.kind !== "text") fitToCanvas(item);
});

// ---------------------------------------------------------------------------
// Mezclador de audio: cada canal va a la grabación pasando por volumen (gain) → medidor (analyser).

const audio = { ctx: null, dest: null, channels: [] };

function ensureAudio() {
  if (!audio.ctx) {
    audio.ctx = new AudioContext();
    audio.dest = audio.ctx.createMediaStreamDestination();
  }
  audio.ctx.resume();
  return audio;
}

function addAudioChannel(name, stream, ownerItemId = null) {
  const { ctx, dest } = ensureAudio();
  const source = ctx.createMediaStreamSource(stream);
  const gain = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(gain);
  gain.connect(analyser);
  gain.connect(dest);

  const channel = {
    id: newId(),
    name,
    stream,
    source,
    gain,
    analyser,
    ownerItemId,
    muted: false,
    volume: 1,
    samples: new Float32Array(analyser.fftSize),
  };
  audio.channels.push(channel);
  renderMixer();
}

function removeAudioChannel(channel) {
  channel.source.disconnect();
  channel.gain.disconnect();
  if (channel.ownerItemId === null) channel.stream.getTracks().forEach((t) => t.stop());
  audio.channels = audio.channels.filter((ch) => ch !== channel);
  renderMixer();
}

async function addMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    addAudioChannel("Mic/Aux", stream);
  } catch (err) {
    if (err.name !== "NotAllowedError") alert(`No se pudo abrir el micrófono: ${err.message}`);
  }
}

function applyGain(channel) {
  channel.gain.gain.value = channel.muted ? 0 : channel.volume;
}

function renderMixer() {
  const mixer = $("mixer");
  if (!audio.channels.length) {
    mixer.innerHTML = '<p class="empty">Sin fuentes de audio</p>';
    return;
  }
  mixer.replaceChildren(
    ...audio.channels.map((channel) => {
      const row = document.createElement("div");
      row.className = "channel";
      row.innerHTML = `
        <div class="channel-head"><span></span><span class="db">-inf dB</span></div>
        <div class="meter"><div class="meter-mask"></div></div>
        <div class="channel-controls">
          <input type="range" min="0" max="100" aria-label="Volumen">
          <button class="mute" title="Silenciar">🔊</button>
          ${channel.ownerItemId === null ? '<button class="remove" title="Quitar">×</button>' : ""}
        </div>`;
      row.querySelector(".channel-head span").textContent = channel.name;

      const slider = row.querySelector("input");
      slider.value = String(Math.round(channel.volume * 100));
      slider.addEventListener("input", () => {
        channel.volume = slider.value / 100;
        applyGain(channel);
      });

      const mute = row.querySelector(".mute");
      const syncMute = () => {
        mute.textContent = channel.muted ? "🔇" : "🔊";
        mute.classList.toggle("muted", channel.muted);
      };
      syncMute();
      mute.addEventListener("click", () => {
        channel.muted = !channel.muted;
        applyGain(channel);
        syncMute();
      });

      row.querySelector(".remove")?.addEventListener("click", () => removeAudioChannel(channel));

      channel.meterMask = row.querySelector(".meter-mask");
      channel.dbLabel = row.querySelector(".db");
      return row;
    }),
  );
}

// Los medidores muestran el nivel medio (RMS) tras el volumen, en una escala de -60 a 0 dB.
function updateMeters() {
  for (const channel of audio.channels) {
    if (!channel.meterMask) continue;
    channel.analyser.getFloatTimeDomainData(channel.samples);
    let sum = 0;
    for (const s of channel.samples) sum += s * s;
    const db = 20 * Math.log10(Math.sqrt(sum / channel.samples.length) || 1e-6);
    const level = Math.min(1, Math.max(0, (db + 60) / 60));
    channel.meterMask.style.width = `${(1 - level) * 100}%`;
    channel.dbLabel.textContent = db <= -60 ? "-inf dB" : `${db.toFixed(1)} dB`;
  }
  requestAnimationFrame(updateMeters);
}

// ---------------------------------------------------------------------------
// Grabación

const recording = { recorder: null, startedAt: 0, timer: null, url: null };

// Preferimos MP4 (se abre en cualquier sitio); si el navegador no puede, WebM.
function pickMimeType() {
  const candidates = [
    "video/mp4;codecs=avc1.640028,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

const pad = (n) => String(n).padStart(2, "0");

function formatElapsed(ms) {
  const total = Math.floor(ms / 1000);
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

function fileTimestamp(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function startRecording() {
  const { dest } = ensureAudio();
  const videoTrack = program.captureStream(FPS).getVideoTracks()[0];
  const stream = new MediaStream([videoTrack, ...dest.stream.getAudioTracks()]);
  const recorder = new MediaRecorder(stream, {
    mimeType: pickMimeType(),
    videoBitsPerSecond: 8_000_000,
  });
  const chunks = [];
  const startedAt = new Date();

  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.onstop = () => {
    videoTrack.stop();
    const blob = new Blob(chunks, { type: recorder.mimeType });
    const ext = recorder.mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    if (recording.url) URL.revokeObjectURL(recording.url);
    recording.url = URL.createObjectURL(blob);

    const link = $("last-recording");
    link.href = recording.url;
    link.download = `MiniEstudio ${fileTimestamp(startedAt)}.${ext}`;
    link.hidden = false;
    link.click();
  };

  recorder.start(1000);
  recording.recorder = recorder;
  recording.startedAt = performance.now();
  recording.timer = setInterval(renderRecordingStatus, 500);
  renderRecordingStatus();
}

function stopRecording() {
  recording.recorder.stop();
  recording.recorder = null;
  clearInterval(recording.timer);
  renderRecordingStatus();
}

function renderRecordingStatus() {
  const active = recording.recorder !== null;
  const button = $("record");
  button.textContent = active ? "Detener grabación" : "Iniciar grabación";
  button.classList.toggle("on", active);

  const status = $("rec-status");
  status.classList.toggle("recording", active);
  status.textContent = `REC ${active ? formatElapsed(performance.now() - recording.startedAt) : "00:00:00"}`;
}

// ---------------------------------------------------------------------------
// Paneles

function renderScenes() {
  $("scene-list").replaceChildren(
    ...state.scenes.map((scene) => {
      const li = document.createElement("li");
      li.classList.toggle("active", scene.id === state.currentSceneId);
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = scene.name;
      li.append(name);
      li.addEventListener("click", () => switchScene(scene.id));
      li.addEventListener("dblclick", () => renameScene(scene));
      return li;
    }),
  );
}

function renderSources() {
  $("source-list").replaceChildren(
    ...currentScene().items.map((item) => {
      const li = document.createElement("li");
      li.classList.toggle("active", item.id === state.selectedItemId);

      const eye = document.createElement("button");
      eye.className = "eye";
      eye.classList.toggle("off", !item.visible);
      eye.textContent = "👁";
      eye.title = item.visible ? "Ocultar" : "Mostrar";
      eye.addEventListener("click", (event) => {
        event.stopPropagation();
        item.visible = !item.visible;
        renderSources();
      });

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = item.name;
      li.append(eye, name);

      if (item.offline) {
        const offline = document.createElement("span");
        offline.className = "offline";
        offline.textContent = "desconectada";
        li.append(offline);
      }

      li.addEventListener("click", () => {
        state.selectedItemId = item.id;
        renderSources();
      });
      return li;
    }),
  );
}

// ---------------------------------------------------------------------------
// Conexiones de botones y teclado

const sourceMenu = $("source-menu");

$("add-scene").addEventListener("click", addScene);
$("remove-scene").addEventListener("click", removeCurrentScene);
$("add-source").addEventListener("click", (event) => {
  event.stopPropagation();
  sourceMenu.hidden = !sourceMenu.hidden;
});
sourceMenu.addEventListener("click", (event) => {
  const kind = event.target.closest("button")?.dataset.kind;
  sourceMenu.hidden = true;
  if (kind) addSource(kind);
});
document.addEventListener("click", () => {
  sourceMenu.hidden = true;
});
$("remove-source").addEventListener("click", removeSelectedItem);
$("source-up").addEventListener("click", () => moveSelectedItem(-1));
$("source-down").addEventListener("click", () => moveSelectedItem(1));
$("add-mic").addEventListener("click", addMicrophone);
$("record").addEventListener("click", () => {
  if (recording.recorder) stopRecording();
  else startRecording();
});

document.addEventListener("keydown", (event) => {
  if (event.target.closest("input, textarea") || event.metaKey || event.ctrlKey) return;

  const sceneIndex = Number(event.key) - 1;
  if (sceneIndex >= 0 && sceneIndex < state.scenes.length) {
    switchScene(state.scenes[sceneIndex].id);
    return;
  }

  const item = selectedItem();
  if (!item) return;
  const step = event.shiftKey ? 10 : 1;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (moves[event.key]) {
    event.preventDefault();
    item.x += moves[event.key][0];
    item.y += moves[event.key][1];
  } else if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    removeSelectedItem();
  }
});

switchScene(createScene("Escena 1").id, { animate: false });
renderMixer();
renderRecordingStatus();
requestAnimationFrame(updateMeters);
