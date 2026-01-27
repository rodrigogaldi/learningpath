const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const modal = document.getElementById('modal');
const modalHeader = document.querySelector('#modal .modal-header');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const introModal = document.getElementById('intro-modal');
const introStart = document.getElementById('intro-start');
const endScreen = document.getElementById('end-screen');
const accelButton = document.getElementById('accelerate-button');
const hudHint = document.getElementById('hud-hint');

const keyState = new Set();
let accelHeld = false;

const runningSound = new Audio('sounds/running.mp3');
runningSound.loop = true;
runningSound.volume = 0.4;
let runningSoundUnlocked = false;

const gameMusic = new Audio('sounds/game-music.mp3');
gameMusic.loop = true;
gameMusic.volume = 0.2;
let gameMusicUnlocked = false;

const carSprite = new Image();
carSprite.src = 'imgs/car.png';
let carSpriteReady = false;
carSprite.addEventListener('load', () => {
  carSpriteReady = true;
});

const backgroundSources = ['imgs/trail.png'];
let backgroundSourceIndex = 0;
const backgroundImage = new Image();
let backgroundReady = false;
backgroundImage.addEventListener('load', () => {
  backgroundReady = true;
});
backgroundImage.addEventListener('error', () => {
  const nextIndex = backgroundSourceIndex + 1;
  if (nextIndex < backgroundSources.length) {
    backgroundSourceIndex = nextIndex;
    backgroundImage.src = backgroundSources[backgroundSourceIndex];
  }
});
backgroundImage.src = backgroundSources[backgroundSourceIndex];

const stopData = [
  {
    id: 'p1',
    name: 'Parada 1 - Integridade',
    text: 'Reflita sobre as boas praticas ao dirigir neste trecho.',
    distance: 520
  },
  {
    id: 'p2',
    name: 'Parada 2 - Comunicacao',
    text: 'Descreva como voce comunica um incidente na via.',
    distance: 1180
  },
  {
    id: 'p3',
    name: 'Parada 3 - Procedimentos',
    text: 'Revise o video com as etapas do treinamento.',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    distance: 1760
  },
  {
    id: 'p4',
    name: 'Parada 4 - Decisao',
    text: 'Quais escolhas reduzem riscos para a equipe?',
    distance: 2360
  }
];

const state = {
  track: [],
  trackLengths: [],
  totalLength: 0,
  stopDistances: new Map(),
  finishDistance: 0,
  finished: false,
  view: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  recording: {
    enabled: false,
    points: [],
    isDrawing: false,
    lastWorld: null
  },
  progress: 0,
  speed: 0,
  lateral: 0,
  lateralSpeed: 0,
  throttle: 0,
  paused: false,
  modalOpen: false,
  visited: new Set(),
  stopInRange: new Set(),
  lapStartTime: null,
  lapTime: 0,
  stopTimes: new Map(),
  lastTime: performance.now()
};

const config = {
  roadWidth: 220,
  edgeWidth: 10,
  trackMargin: 0,
  recordSpacing: 28,
  maxSpeed: 260,
  accel: 220,
  throttleRise: 1.4,
  throttleFall: 2.2,
  lateralAccel: 260,
  friction: 0.85,
  stopRadius: 45,
 trackControlPoints: [
  {
    "x": 0.1037663335895465,
    "y": 0.1600901916572717
  },
  {
    "x": 0.06456571867794005,
    "y": 0.20856820744081173
  },
  {
    "x": 0.0622598001537279,
    "y": 0.27959413754227735
  },
  {
    "x": 0.1652574942352037,
    "y": 0.34949267192784667
  },
  {
    "x": 0.1960030745580323,
    "y": 0.3765501691093574
  },
  {
    "x": 0.16986933128362797,
    "y": 0.41939120631341603
  },
  {
    "x": 0.10607225211375865,
    "y": 0.4599774520856821
  },
  {
    "x": 0.06456571867794005,
    "y": 0.5005636978579482
  },
  {
    "x": 0.053036126056879324,
    "y": 0.5727170236753101
  },
  {
    "x": 0.11068408916218293,
    "y": 0.6324689966178129
  },
  {
    "x": 0.20292083013066872,
    "y": 0.6471251409244645
  },
  {
    "x": 0.2751729438893159,
    "y": 0.6888387824126269
  },
  {
    "x": 0.32667179093005383,
    "y": 0.8128523111612176
  },
  {
    "x": 0.40507302075326673,
    "y": 0.8376550169109357
  },
  {
    "x": 0.4973097617217525,
    "y": 0.7779030439684329
  },
  {
    "x": 0.5841660261337432,
    "y": 0.713641488162345
  },
  {
    "x": 0.6548808608762491,
    "y": 0.6234498308906427
  },
  {
    "x": 0.6348962336664105,
    "y": 0.5512965050732808
  },
  {
    "x": 0.5926210607225212,
    "y": 0.5186020293122886
  },
  {
    "x": 0.531129900076864,
    "y": 0.5186020293122886
  },
  {
    "x": 0.43735588009223675,
    "y": 0.5084554678692221
  },
  {
    "x": 0.3889315910837817,
    "y": 0.47576099210823
  },
  {
    "x": 0.372021521906226,
    "y": 0.4182638105975197
  },
  {
    "x": 0.3889315910837817,
    "y": 0.35400225479143177
  },
  {
    "x": 0.4573405073020753,
    "y": 0.3156708004509583
  },
  {
    "x": 0.4973097617217525,
    "y": 0.30101465614430667
  },
  {
    "x": 0.5588009223674096,
    "y": 0.28861330326944756
  },
  {
    "x": 0.6418139892390469,
    "y": 0.28861330326944756
  },
  {
    "x": 0.6802459646425826,
    "y": 0.237880496054115
  },
  {
    "x": 0.6587240584166026,
    "y": 0.1668545659526494
  },
  {
    "x": 0.7063797079169869,
    "y": 0.1161217587373168
  },
  {
    "x": 0.7909300538047656,
    "y": 0.10710259301014656
  },
  {
    "x": 0.8478093774019985,
    "y": 0.1104847801578354
  },
  {
    "x": 0.9039200614911607,
    "y": 0.15219842164599776
  },
  {
    "x": 0.9338970023059185,
    "y": 0.1984216459977452
  },
  {
    "x": 0.9500384319754035,
    "y": 0.27395715896279593
  },
  {
    "x": 0.92467332820907,
    "y": 0.314543404735062
  },
  {
    "x": 0.8724058416602614,
    "y": 0.35400225479143177
  },
  {
    "x": 0.8293620292083013,
    "y": 0.3923337091319053
  },
  {
    "x": 0.8147578785549577,
    "y": 0.42841037204058624
  },
  {
    "x": 0.857033051498847,
    "y": 0.47125140924464487
  },
  {
    "x": 0.9085318985395849,
    "y": 0.49943630214205187
  },
  {
    "x": 0.940814757878555,
    "y": 0.5400225479143179
  },
  {
    "x": 0.9577248270561107,
    "y": 0.608793686583991
  },
  {
    "x": 0.9523443504996156,
    "y": 0.6708004509582863
  },
  {
    "x": 0.9323597232897771,
    "y": 0.7260428410372041
  },
  {
    "x": 0.8993082244427364,
    "y": 0.7564825253664036
  },
  {
    "x": 0.8485780169100692,
    "y": 0.8173618940248027
  },
  {
    "x": 0.7647963105303612,
    "y": 0.8556933483652762
  }
]
};

function resize() {
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * scale);
  canvas.height = Math.floor(window.innerHeight * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  state.viewport.width = window.innerWidth;
  state.viewport.height = window.innerHeight;
}

function updateHudHint() {
  if (!hudHint) return;
  if (state.recording.enabled) {
    hudHint.textContent =
      'Modo trilha ativo: clique e arraste para desenhar. R para salvar, C para limpar.';
    return;
  }
  hudHint.textContent = '';
}

function formatLapTime(ms) {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function unlockRunningSound() {
  if (runningSoundUnlocked) return;
  runningSoundUnlocked = true;
  runningSound.play()
    .then(() => {
      runningSound.pause();
      runningSound.currentTime = 0;
    })
    .catch(() => {});
}

function unlockGameMusic() {
  if (gameMusicUnlocked) return;
  gameMusicUnlocked = true;
  gameMusic.play().catch(() => {});
}

function updateRunningSound() {
  if (!runningSoundUnlocked) return;
  const moving = Math.abs(state.speed) > 4;
  const shouldPlay = moving && !state.paused && !state.modalOpen && !state.recording.enabled;
  if (shouldPlay) {
    const speedFactor = Math.min(1, Math.abs(state.speed) / config.maxSpeed);
    runningSound.volume = 0.2 + speedFactor * 0.5;
    runningSound.playbackRate = 0.8 + speedFactor * 0.6;
    if (runningSound.paused) {
      runningSound.play().catch(() => {});
    }
    return;
  }
  if (!runningSound.paused) {
    runningSound.pause();
    if (!moving) {
      runningSound.currentTime = 0;
    }
  }
}

function updateGameMusic() {
  if (!gameMusicUnlocked) return;
  if (endScreen && !endScreen.classList.contains('hidden')) {
    if (!gameMusic.paused) {
      gameMusic.pause();
    }
    return;
  }
  if (gameMusic.paused) {
    gameMusic.play().catch(() => {});
  }
}

function buildPathPoints() {
  const margin = config.trackMargin;
  const width = Math.max(1, state.viewport.width - margin * 2);
  const height = Math.max(1, state.viewport.height - margin * 2);
  if (config.trackControlPoints.length < 2) {
    return [];
  }
  return config.trackControlPoints.map((point) => ({
    x: margin + point.x * width,
    y: margin + point.y * height
  }));
}

function screenToWorld(screenX, screenY) {
  if (state.recording.enabled) {
    return { x: screenX, y: screenY };
  }

  return {
    x: (screenX - state.view.offsetX) / state.view.scale,
    y: (screenY - state.view.offsetY) / state.view.scale
  };
}

function worldToNormalized(point) {
  const margin = config.trackMargin;
  const width = Math.max(1, state.viewport.width - margin * 2);
  const height = Math.max(1, state.viewport.height - margin * 2);
  return {
    x: Math.min(1, Math.max(0, (point.x - margin) / width)),
    y: Math.min(1, Math.max(0, (point.y - margin) / height))
  };
}

function normalizedToWorld(point) {
  const margin = config.trackMargin;
  const width = Math.max(1, state.viewport.width - margin * 2);
  const height = Math.max(1, state.viewport.height - margin * 2);
  return {
    x: margin + point.x * width,
    y: margin + point.y * height
  };
}

function addRecordPoint(screenX, screenY) {
  const world = screenToWorld(screenX, screenY);
  const lastWorld = state.recording.lastWorld;

  if (lastWorld) {
    const dx = world.x - lastWorld.x;
    const dy = world.y - lastWorld.y;
    if (Math.hypot(dx, dy) < config.recordSpacing) {
      return;
    }
  }

  state.recording.lastWorld = world;
  state.recording.points.push(worldToNormalized(world));
}

function buildTrack() {
  const points = buildPathPoints();

  state.track = points;
  state.trackLengths = [];
  state.totalLength = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const nextIndex = i + 1;
    const dx = points[nextIndex].x - points[i].x;
    const dy = points[nextIndex].y - points[i].y;
    const len = Math.hypot(dx, dy);
    state.trackLengths.push(len);
    state.totalLength += len;
  }

  state.finishDistance = state.totalLength;
  computeStopDistances();
  computeView();
}

function getPointAt(distance) {
  if (!state.totalLength) {
    return { x: 0, y: 0, tx: 0, ty: 1, nx: -1, ny: 0 };
  }

  let remaining = Math.max(0, Math.min(distance, state.totalLength));

  for (let i = 0; i < state.trackLengths.length; i += 1) {
    const segLen = state.trackLengths[i];
    if (remaining <= segLen) {
      const p0 = state.track[i];
      const p1 = state.track[i + 1];
      const t = segLen === 0 ? 0 : remaining / segLen;
      const x = p0.x + (p1.x - p0.x) * t;
      const y = p0.y + (p1.y - p0.y) * t;
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const tx = dx / len;
      const ty = dy / len;
      const nx = -ty;
      const ny = tx;
      return { x, y, tx, ty, nx, ny };
    }
    remaining -= segLen;
  }

  if (state.track.length >= 2) {
    const last = state.track[state.track.length - 1];
    const prev = state.track[state.track.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty;
    const ny = tx;
    return { x: last.x, y: last.y, tx, ty, nx, ny };
  }
  const only = state.track[0];
  return { x: only.x, y: only.y, tx: 0, ty: 1, nx: -1, ny: 0 };
}

function computeStopDistances() {
  state.stopDistances = new Map();
  if (!state.totalLength) {
    return;
  }
  const definedStops = stopData.filter((stop) => Number.isFinite(stop.distance));
  const maxStop = definedStops.length
    ? Math.max(...definedStops.map((stop) => stop.distance))
    : stopData.length;
  const lastIndex = stopData.length - 1;

  stopData.forEach((stop, index) => {
    let ratio;
    if (Number.isFinite(stop.distance) && maxStop > 0) {
      ratio = stop.distance / maxStop;
    } else {
      ratio = (index + 1) / (stopData.length + 1);
    }

    let dist = Math.max(40, Math.min(state.totalLength - 40, ratio * state.totalLength));
    if (index === lastIndex) {
      dist = state.finishDistance;
    }
    state.stopDistances.set(stop.id, dist);
  });
}

function computeView() {
  state.view.scale = 1;
  state.view.offsetX = 0;
  state.view.offsetY = 0;
}

function toScreen(world) {
  if (state.recording.enabled) {
    return { x: world.x, y: world.y };
  }

  return {
    x: world.x * state.view.scale + state.view.offsetX,
    y: world.y * state.view.scale + state.view.offsetY
  };
}

function drawBackground() {
  if (backgroundReady) {
    const width = state.viewport.width;
    const height = state.viewport.height;
    const imgWidth = backgroundImage.naturalWidth || width;
    const imgHeight = backgroundImage.naturalHeight || height;
    const scale = Math.max(width / imgWidth, height / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
    return;
  }
  ctx.fillStyle = '#0e1116';
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);
}

function drawPath() {
  if (state.track.length < 2) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  state.track.forEach((point, index) => {
    const screen = toScreen(point);
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  });
  ctx.stroke();
  ctx.restore();
}

function drawStops() {
  if (state.track.length < 2) return;
  const pulse = (Math.sin(performance.now() / 320) + 1) / 2;
  stopData.forEach((stop) => {
    const distance = state.stopDistances.get(stop.id);
    if (!Number.isFinite(distance)) return;
    const marker = getPointAt(distance);
    const screen = toScreen(marker);
    const visited = state.visited.has(stop.id);
    const baseRadius = visited ? 10 : 14;
    const radius = (baseRadius + (visited ? 2 : 4) * pulse) * state.view.scale;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    const alpha = visited ? 0.35 + 0.15 * pulse : 0.75 + 0.2 * pulse;
    ctx.fillStyle = `rgba(242,95,92,${alpha})`;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2 * state.view.scale;
    ctx.stroke();
  });
}

function drawCar() {
  if (state.track.length < 2) return;
  const base = getPointAt(state.progress);
  const carX = base.x + base.nx * state.lateral;
  const carY = base.y + base.ny * state.lateral;
  const screen = toScreen({ x: carX, y: carY });
  const bob = Math.sin(performance.now() / 180) * 4 * state.view.scale;

  ctx.save();
  ctx.translate(screen.x, screen.y + bob);

  if (carSpriteReady) {
    const targetWidth = 132 * state.view.scale * 0.5;
    const ratio = carSprite.naturalWidth / carSprite.naturalHeight || 1;
    const targetHeight = targetWidth / ratio;
    ctx.drawImage(
      carSprite,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
  } else {
    ctx.fillStyle = '#f25f5c';
    ctx.strokeStyle = '#0f1116';
    ctx.lineWidth = 2 * state.view.scale;
    ctx.fillRect(-18 * state.view.scale, -10 * state.view.scale, 36 * state.view.scale, 20 * state.view.scale);
    ctx.strokeRect(-18 * state.view.scale, -10 * state.view.scale, 36 * state.view.scale, 20 * state.view.scale);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-6 * state.view.scale, -8 * state.view.scale, 12 * state.view.scale, 16 * state.view.scale);
  }

  ctx.restore();
}

function drawRecorderOverlay() {
  if (!state.recording.enabled) return;

  const margin = config.trackMargin;
  const width = Math.max(1, state.viewport.width - margin * 2);
  const height = Math.max(1, state.viewport.height - margin * 2);

  ctx.save();
  ctx.strokeStyle = 'rgba(104, 214, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(margin, margin, width, height);
  ctx.setLineDash([]);
  ctx.restore();

  if (state.recording.points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(104, 214, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();

  state.recording.points.forEach((point, index) => {
    const world = normalizedToWorld(point);
    const screen = toScreen(world);
    if (index === 0) {
      ctx.moveTo(screen.x, screen.y);
    } else {
      ctx.lineTo(screen.x, screen.y);
    }
  });

  ctx.stroke();
  ctx.fillStyle = 'rgba(104, 214, 255, 0.9)';
  state.recording.points.forEach((point) => {
    const world = normalizedToWorld(point);
    const screen = toScreen(world);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function showEndScreen() {
  if (!endScreen) return;
  endScreen.classList.remove('hidden');
  if (gameMusicUnlocked) {
    gameMusic.pause();
  }
}

function openStopModal(stop) {
  state.modalOpen = true;
  modalTitle.textContent = stop.name || 'Parada';
  modalBody.innerHTML = '';
  modalClose.style.display = '';
  if (modalHeader) {
    const existingResults = modalHeader.querySelector('.results-button');
    if (existingResults) existingResults.remove();
  }

  if (stop.text) {
    const label = document.createElement('div');
    label.textContent = 'Notas:';
    modalBody.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.value = stop.text;
    modalBody.appendChild(textarea);
  }

  if (stop.video) {
    const label = document.createElement('div');
    label.textContent = 'Video:';
    modalBody.appendChild(label);

    if (stop.video.endsWith('.mp4') || stop.video.endsWith('.webm')) {
      const video = document.createElement('video');
      video.src = stop.video;
      video.controls = true;
      modalBody.appendChild(video);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = stop.video;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      modalBody.appendChild(iframe);
    }
  }

  const lastStopId = stopData[stopData.length - 1]?.id;
  if (stop.id === lastStopId) {
    modalClose.style.display = 'none';

    const resultsButton = document.createElement('button');
    resultsButton.className = 'primary results-button';
    resultsButton.textContent = 'Finalizar trilha';
    resultsButton.addEventListener('click', () => {
      closeStopModal();
      showEndScreen();
    });

    if (modalHeader) {
      modalHeader.appendChild(resultsButton);
    } else {
      modalBody.appendChild(resultsButton);
    }
  }

  modal.classList.remove('hidden');
}

function closeStopModal() {
  modal.classList.add('hidden');
  state.modalOpen = false;
}

function resetGame() {
  state.progress = 0;
  state.speed = 0;
  state.lateral = 0;
  state.lateralSpeed = 0;
  state.throttle = 0;
  state.finished = false;
  state.visited = new Set();
  state.stopInRange = new Set();
  state.stopTimes = new Map();
  state.modalOpen = false;
  state.paused = false;
  state.lapStartTime = null;
  state.lapTime = 0;
  modal.classList.add('hidden');
  if (runningSoundUnlocked) {
    runningSound.pause();
    runningSound.currentTime = 0;
  }
  if (endScreen) {
    endScreen.classList.add('hidden');
  }
  buildTrack();
}

function update(dt) {
  if (state.paused || state.modalOpen || state.finished) return;

  const up = keyState.has('ArrowUp') || accelHeld;
  const down = keyState.has('ArrowDown');

  if (up) {
    state.throttle = Math.min(1, state.throttle + config.throttleRise * dt);
  } else {
    state.throttle = Math.max(0, state.throttle - config.throttleFall * dt);
  }

  if (down) {
    state.speed -= config.accel * dt;
  }

  state.speed += config.accel * state.throttle * dt;
  state.speed = Math.max(-config.maxSpeed * 0.6, Math.min(config.maxSpeed, state.speed));

  state.lateralSpeed = 0;
  state.lateral = 0;

  state.progress += state.speed * dt;
  if (!up && !down) {
    state.speed *= config.friction;
  }

  if (!state.lapStartTime && state.speed > 0) {
    state.lapStartTime = performance.now();
  }

  if (state.totalLength > 0 && state.progress >= state.finishDistance) {
    state.progress = state.finishDistance;
    state.speed = 0;
    state.throttle = 0;
    state.finished = true;
    state.paused = true;
  }

  if (state.progress <= 0) {
    state.progress = 0;
    if (state.speed < 0) {
      state.speed = 0;
    }
  }

  if (state.lapStartTime) {
    state.lapTime = performance.now() - state.lapStartTime;
  }

  for (const stop of stopData) {
    const distance = state.stopDistances.get(stop.id);
    if (!Number.isFinite(distance)) continue;
    const inRange = Math.abs(state.progress - distance) <= config.stopRadius;
    if (inRange && !state.stopInRange.has(stop.id)) {
      state.stopInRange.add(stop.id);
      if (!state.visited.has(stop.id)) {
        state.visited.add(stop.id);
        if (state.lapStartTime) {
          state.stopTimes.set(stop.id, performance.now() - state.lapStartTime);
        }
      }
      openStopModal(stop);
      break;
    }
    if (!inRange && state.stopInRange.has(stop.id)) {
      state.stopInRange.delete(stop.id);
    }
  }

  if (
    state.finished &&
    !state.modalOpen &&
    (stopData.length === 0 || state.visited.size === stopData.length)
  ) {
    showEndScreen();
  }

}

function draw() {
  ctx.clearRect(0, 0, state.viewport.width, state.viewport.height);
  drawBackground();

  if (state.recording.enabled) {
    drawRecorderOverlay();
    return;
  }

  drawPath();
  drawStops();
  drawCar();
}

function loop(time) {
  const dt = Math.min(0.033, (time - state.lastTime) / 1000);
  state.lastTime = time;
  update(dt);
  updateRunningSound();
  updateGameMusic();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resize();
  buildTrack();
});

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key.toLowerCase() === 'p') {
    state.paused = !state.paused;
  }

  if (event.key.toLowerCase() === 'r') {
    state.recording.enabled = !state.recording.enabled;
    state.recording.isDrawing = false;
    state.recording.lastWorld = null;
    if (state.recording.enabled) {
      state.recording.points = [];
    } else if (state.recording.points.length >= 2) {
      config.trackControlPoints = [...state.recording.points];
      resetGame();
    }
    state.paused = state.recording.enabled ? true : false;
    updateHudHint();
  }

  if (event.key.toLowerCase() === 'c' && state.recording.enabled) {
    state.recording.points = [];
    state.recording.lastWorld = null;
  }

  if (event.key.toLowerCase() === 'l' && state.recording.enabled) {
    console.log('trackControlPoints:', JSON.stringify(state.recording.points, null, 2));
  }

  keyState.add(event.key);
});

window.addEventListener('keyup', (event) => {
  keyState.delete(event.key);
});

if (accelButton) {
  const setAccelHeld = (next) => {
    accelHeld = next;
    accelButton.classList.toggle('is-pressed', accelHeld);
  };

  const holdAccel = (event) => {
    event.preventDefault();
    if (typeof accelButton.setPointerCapture === 'function') {
      accelButton.setPointerCapture(event.pointerId);
    }
    setAccelHeld(true);
  };

  const releaseAccel = (event) => {
    if (event) event.preventDefault();
    setAccelHeld(false);
  };

  accelButton.addEventListener('pointerdown', holdAccel);
  accelButton.addEventListener('pointerup', releaseAccel);
  accelButton.addEventListener('pointercancel', releaseAccel);
  accelButton.addEventListener('pointerleave', releaseAccel);
  window.addEventListener('blur', releaseAccel);
}

canvas.addEventListener('mousedown', (event) => {
  if (!state.recording.enabled) return;
  state.recording.isDrawing = true;
  addRecordPoint(event.clientX, event.clientY);
});

canvas.addEventListener('mousemove', (event) => {
  if (!state.recording.enabled || !state.recording.isDrawing) return;
  addRecordPoint(event.clientX, event.clientY);
});

window.addEventListener('mouseup', () => {
  if (!state.recording.enabled) return;
  state.recording.isDrawing = false;
});

modalClose.addEventListener('click', closeStopModal);
if (introStart && introModal) {
    introStart.addEventListener('click', () => {
      introModal.classList.add('hidden');
      unlockRunningSound();
      unlockGameMusic();
      state.paused = false;
    });
  }

resize();
resetGame();
updateHudHint();
if (introModal && !introModal.classList.contains('hidden')) {
  state.paused = true;
}
requestAnimationFrame(loop);
