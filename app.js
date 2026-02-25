const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const modal = document.getElementById('modal');
const modalHeader = document.querySelector('#modal .modal-header');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const completionModal = document.getElementById('completion-modal');
const completionClose = document.getElementById('completion-close');
const introModal = document.getElementById('intro-modal');
const introStart = document.getElementById('intro-start');
const avatarModal = document.getElementById('avatar-modal');
const avatarGrid = document.getElementById('avatar-grid');
const avatarConfirm = document.getElementById('avatar-confirm');
const endScreen = document.getElementById('end-screen');
const accelButton = document.getElementById('accelerate-button');
const sidebarList = document.getElementById('stop-list');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

const keyState = new Set();
let accelHeld = false;

const rootStyle = getComputedStyle(document.documentElement);

function getCssVar(name, fallback) {
  const value = rootStyle.getPropertyValue(name).trim();
  return value || fallback;
}

function parseRgb(color) {
  if (!color) return null;
  const value = color.trim();
  if (value.startsWith('#')) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }
    if (hex.length !== 6) return null;
    const num = Number.parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
  return { r: parts[0], g: parts[1], b: parts[2] };
}

function withAlpha(color, alpha) {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

const theme = {
  bg: getCssVar('--bg', '#0e1116'),
  primary: getCssVar('--color-primary', '#f25f5c'),
  secondary: getCssVar('--color-secondary', '#68d6ff'),
  accent: getCssVar('--color-accent', '#ffb36a'),
  success: getCssVar('--success', '#7bd389'),
  ink: getCssVar('--ink', '#f3f5f8')
};

const runningSound = new Audio('sounds/running.mp3');
runningSound.loop = true;
runningSound.volume = 0.4;
let runningSoundUnlocked = false;

const gameMusic = new Audio('sounds/game-music.mp3');
gameMusic.loop = true;
gameMusic.volume = 0.2;
let gameMusicUnlocked = false;

const defaultCarSource = 'imgs/car.png';
const carSprite = new Image();
let carSpriteReady = false;
let currentCarSource = defaultCarSource;

function setCarSpriteSource(source) {
  const nextSource = source || defaultCarSource;
  if (nextSource === currentCarSource) return;
  currentCarSource = nextSource;
  carSpriteReady = false;
  carSprite.src = nextSource;
}

carSprite.addEventListener('load', () => {
  carSpriteReady = true;
});
carSprite.addEventListener('error', () => {
  if (currentCarSource === defaultCarSource) return;
  currentCarSource = defaultCarSource;
  carSpriteReady = false;
  carSprite.src = defaultCarSource;
});

carSprite.src = defaultCarSource;

const backgroundSources = ['imgs/trail.png'];
let backgroundSourceIndex = 0;
const backgroundImage = new Image();
let backgroundReady = false;
backgroundImage.addEventListener('load', () => {
  backgroundReady = true;
  migrateTrackPointsToBackground();
  buildTrack();
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
    distance: 520,
    content: {
      title: 'Etapa de conteudo',
      body:
        'Reflita sobre as boas praticas ao dirigir neste trecho. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
        'Suspendisse varius, massa sed facilisis luctus, lorem justo dapibus eros, vitae consequat lacus massa at velit. ' +
        'Use este texto apenas para teste visual da area de conteudo.',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    games: [
      {
        id: 'puzzle',
        type: 'puzzle',
        title: 'Quebra cabeca',
        description: 'Monte a imagem completa.',
        image: 'imgs/puzzle.jpeg',
        size: 3
      }
    ]
  },
  {
    id: 'p2',
    name: 'Parada 2 - Comunicacao',
    distance: 1180,
    content: {
      title: 'Etapa de conteudo',
      body: 'Descreva como voce comunica um incidente na via.'
    },
    games: [
      { id: 'memory', type: 'memory', title: 'Jogo da memoria', description: 'Encontre os 6 pares.' },
      {
        id: 'quiz',
        type: 'quiz',
        title: 'Pergunta rapida',
        description: 'Escolha a melhor resposta.',
        question: 'Qual canal deve ser usado para reportar incidentes?',
        options: ['Canal oficial da equipe', 'Grupo pessoal', 'Mensagem privada sem registro'],
        correctIndex: 0
      },
      {
        id: 'sequence',
        type: 'sequence',
        title: 'Ordem correta',
        description: 'Organize as etapas.',
        steps: ['Identificar o local', 'Comunicar ao lider', 'Registrar evidencias', 'Aguardar orientacao']
      }
    ]
  },
  {
    id: 'p3',
    name: 'Parada 3 - Procedimentos',
    distance: 1760,
    content: {
      title: 'Etapa de conteudo',
      body: 'Revise o video com as etapas do treinamento.',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    games: [
      { id: 'memory', type: 'memory', title: 'Jogo da memoria', description: 'Encontre os 6 pares.' },
      {
        id: 'quiz',
        type: 'quiz',
        title: 'Pergunta rapida',
        description: 'Escolha a melhor resposta.',
        question: 'Quando registrar a conclusao de uma etapa?',
        options: ['Ao finalizar o procedimento', 'Antes de iniciar', 'Somente no fim do dia'],
        correctIndex: 0
      },
      {
        id: 'sequence',
        type: 'sequence',
        title: 'Ordem correta',
        description: 'Organize as etapas.',
        steps: ['Checar equipamentos', 'Executar tarefa', 'Validar resultado', 'Registrar no sistema']
      }
    ]
  },
  {
    id: 'p4',
    name: 'Parada 4 - Decisao',
    distance: 2360,
    content: {
      title: 'Etapa de conteudo',
      body: 'Quais escolhas reduzem riscos para a equipe?'
    },
    games: [
      { id: 'memory', type: 'memory', title: 'Jogo da memoria', description: 'Encontre os 6 pares.' },
      {
        id: 'quiz',
        type: 'quiz',
        title: 'Pergunta rapida',
        description: 'Escolha a melhor resposta.',
        question: 'Qual decisao prioriza seguranca?',
        options: ['Pausar e avaliar riscos', 'Ignorar sinais de alerta', 'Acelerar para terminar logo'],
        correctIndex: 0
      },
      {
        id: 'sequence',
        type: 'sequence',
        title: 'Ordem correta',
        description: 'Organize as etapas.',
        steps: ['Mapear riscos', 'Definir plano', 'Executar com cuidado', 'Revisar resultados']
      }
    ]
  }
];

const state = {
  track: [],
  trackLengths: [],
  totalLength: 0,
  stopDistances: new Map(),
  finishDistance: 0,
  finished: false,
  avatar: null,
  avatarSelection: null,
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
  stopProgress: new Map(),
  activeStopId: null,
  activeStageId: null,
  completionShown: new Set(),
  lastTime: performance.now()
};

const config = {
  roadWidth: 220,
  edgeWidth: 10,
  trackMargin: 0,
  backgroundFit: 'contain',
  trackSpace: 'background',
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
    "x": 0.27847005884389064,
    "y": 0.2554517133956386
  },
  {
    "x": 0.2950848044305988,
    "y": 0.2762201453790239
  },
  {
    "x": 0.31169955001730704,
    "y": 0.29698857736240913
  },
  {
    "x": 0.31031498788508133,
    "y": 0.3302180685358255
  },
  {
    "x": 0.2916233991000346,
    "y": 0.3426791277258567
  },
  {
    "x": 0.2667012807199723,
    "y": 0.3572170301142264
  },
  {
    "x": 0.24524056767047422,
    "y": 0.38006230529595014
  },
  {
    "x": 0.2071651090342679,
    "y": 0.387331256490135
  },
  {
    "x": 0.16493596400138455,
    "y": 0.38317757009345793
  },
  {
    "x": 0.14209068881966078,
    "y": 0.3811007268951194
  },
  {
    "x": 0.10816891658013153,
    "y": 0.4091381100726895
  },
  {
    "x": 0.05278643129110419,
    "y": 0.45898234683281414
  },
  {
    "x": 0.0396330910349602,
    "y": 0.49428868120456904
  },
  {
    "x": 0.06386292834890965,
    "y": 0.5327102803738317
  },
  {
    "x": 0.2002422983731395,
    "y": 0.5804776739356179
  },
  {
    "x": 0.18847352024922118,
    "y": 0.6427829698857737
  },
  {
    "x": 0.10886119764624437,
    "y": 0.7165109034267912
  },
  {
    "x": 0.11301488404292143,
    "y": 0.7642782969885774
  },
  {
    "x": 0.5830737279335411,
    "y": 0.8359293873312564
  },
  {
    "x": 0.6336102457597784,
    "y": 0.8369678089304258
  },
  {
    "x": 0.7907580477673936,
    "y": 0.7975077881619937
  },
  {
    "x": 0.9084458290065767,
    "y": 0.6967808930425753
  },
  {
    "x": 0.8952924887504327,
    "y": 0.632398753894081
  },
  {
    "x": 0.832294911734164,
    "y": 0.5628245067497404
  },
  {
    "x": 0.7180685358255452,
    "y": 0.5368639667705088
  },
  {
    "x": 0.6128418137763932,
    "y": 0.4963655244029076
  },
  {
    "x": 0.6066112841813777,
    "y": 0.43198338525441327
  },
  {
    "x": 0.6384562132225684,
    "y": 0.4143302180685358
  },
  {
    "x": 0.7298373139494635,
    "y": 0.40186915887850466
  },
  {
    "x": 0.7956040152301834,
    "y": 0.387331256490135
  },
  {
    "x": 0.8440636898580823,
    "y": 0.3541017653167186
  },
  {
    "x": 0.8696780893042575,
    "y": 0.32191069574247144
  },
  {
    "x": 0.8253721010730356,
    "y": 0.25752855659397716
  },
  {
    "x": 0.8302180685358256,
    "y": 0.22741433021806853
  },
  {
    "x": 0.8496019383869852,
    "y": 0.2118380062305296
  },
  {
    "x": 0.8932156455520941,
    "y": 0.19106957424714435
  },
  {
    "x": 0.9278296988577363,
    "y": 0.19106957424714435
  },
  {
    "x": 0.9686742817583939,
    "y": 0.19106957424714435
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

function formatLapTime(ms) {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getStopIndex(stopId) {
  return stopData.findIndex((stop) => stop.id === stopId);
}

function getStopProgress(stopId) {
  if (!state.stopProgress.has(stopId)) {
    state.stopProgress.set(stopId, {
      contentDone: false,
      gamesDone: new Set()
    });
  }
  return state.stopProgress.get(stopId);
}

function isStopCompleted(stopId) {
  const stop = stopData.find((entry) => entry.id === stopId);
  if (!stop) return false;
  const progress = getStopProgress(stopId);
  return progress.contentDone && progress.gamesDone.size >= stop.games.length;
}

function isStopUnlocked(stopId) {
  const index = getStopIndex(stopId);
  if (index <= 0) return true;
  const prevStop = stopData[index - 1];
  return prevStop ? isStopCompleted(prevStop.id) : true;
}

function renderSidebar() {
  if (!sidebarList) return;
  sidebarList.innerHTML = '';

  stopData.forEach((stop, index) => {
    const progress = getStopProgress(stop.id);
    const completed = isStopCompleted(stop.id);
    const unlocked = isStopUnlocked(stop.id);
    const item = document.createElement('div');
    item.className = 'stop-item';
    if (!unlocked) item.classList.add('locked');
    if (completed) item.classList.add('completed');
    if (state.activeStopId === stop.id) item.classList.add('active');

    const title = document.createElement('div');
    title.className = 'stop-item-title';
    title.textContent = stop.name || `Parada ${index + 1}`;
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'stop-item-meta';
    if (!unlocked) {
      meta.textContent = 'Bloqueado ate concluir a parada anterior';
    } else if (completed) {
      meta.textContent = 'Concluido';
    } else if (progress.contentDone) {
      meta.textContent = `Games concluidos: ${progress.gamesDone.size}/${stop.games.length}`;
    } else {
      meta.textContent = 'Conteudo pendente';
    }
    item.appendChild(meta);

    sidebarList.appendChild(item);
  });
}

function setSidebarOpen(open) {
  document.body.classList.toggle('sidebar-open', open);
  if (!sidebarToggle) return;
  sidebarToggle.setAttribute('aria-expanded', String(open));
  sidebarToggle.textContent = open ? 'Ocultar menu' : 'Mostrar menu';
}

function initSidebar() {
  if (!sidebar || !sidebarToggle) return;
  setSidebarOpen(false);

  sidebarToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('sidebar-open');
    setSidebarOpen(!isOpen);
  });

  document.addEventListener('pointerdown', (event) => {
    if (!document.body.classList.contains('sidebar-open')) return;
    const target = event.target;
    if (sidebar.contains(target) || sidebarToggle.contains(target)) return;
    setSidebarOpen(false);
  });
}

function areAllStopsCompleted() {
  return stopData.every((stop) => isStopCompleted(stop.id));
}

function buildStopStages(stop) {
  const stages = [
    {
      id: 'content',
      type: 'content',
      title: stop.content?.title || 'Etapa de conteudo'
    }
  ];
  stop.games.forEach((game) => {
    stages.push({
      id: `game:${game.id}`,
      type: 'game',
      title: game.title,
      game
    });
  });
  return stages;
}

function isStageCompleted(stop, stage, progress) {
  if (stage.type === 'content') {
    return progress.contentDone;
  }
  return progress.gamesDone.has(stage.game.id);
}

function isStageUnlocked(stages, stop, progress, index) {
  if (index === 0) return true;
  const prevStage = stages[index - 1];
  return isStageCompleted(stop, prevStage, progress);
}

function resolveActiveStage(stages, stop, progress) {
  let targetIndex = stages.findIndex((stage) => !isStageCompleted(stop, stage, progress));
  if (targetIndex === -1) {
    targetIndex = Math.max(0, stages.length - 1);
  }

  const storedIndex = stages.findIndex((stage) => stage.id === state.activeStageId);
  if (storedIndex !== -1 && isStageUnlocked(stages, stop, progress, storedIndex)) {
    targetIndex = storedIndex;
  }

  state.activeStageId = stages[targetIndex]?.id || null;
  return stages[targetIndex] || null;
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
  const introOpen = introModal && !introModal.classList.contains('hidden');
  const avatarOpen = avatarModal && !avatarModal.classList.contains('hidden');
  if (
    state.modalOpen ||
    introOpen ||
    avatarOpen ||
    (endScreen && !endScreen.classList.contains('hidden'))
  ) {
    if (!gameMusic.paused) {
      gameMusic.pause();
    }
    return;
  }
  if (gameMusic.paused) {
    gameMusic.play().catch(() => {});
  }
}

const avatarOptions = avatarGrid ? Array.from(avatarGrid.querySelectorAll('.avatar-option')) : [];

function openAvatarModal() {
  if (!avatarModal) return false;
  avatarModal.classList.remove('hidden');
  state.paused = true;
  return true;
}

function closeAvatarModal() {
  if (!avatarModal) return;
  avatarModal.classList.add('hidden');
}

function setAvatarSelection(option) {
  if (!option || !option.dataset.avatar) return;
  state.avatarSelection = option.dataset.avatar;
  avatarOptions.forEach((button) => {
    const selected = button === option;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  if (avatarConfirm) {
    avatarConfirm.disabled = false;
  }
}

function buildPathPoints() {
  const frame = getBackgroundFrame();
  const margin = config.trackMargin;
  const width = Math.max(1, frame.width - margin * 2);
  const height = Math.max(1, frame.height - margin * 2);
  if (config.trackControlPoints.length < 2) {
    return [];
  }
  return config.trackControlPoints.map((point) => ({
    x: frame.x + margin + point.x * width,
    y: frame.y + margin + point.y * height
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
  const frame = getBackgroundFrame();
  const margin = config.trackMargin;
  const width = Math.max(1, frame.width - margin * 2);
  const height = Math.max(1, frame.height - margin * 2);
  return {
    x: Math.min(1, Math.max(0, (point.x - frame.x - margin) / width)),
    y: Math.min(1, Math.max(0, (point.y - frame.y - margin) / height))
  };
}

function normalizedToWorld(point) {
  const frame = getBackgroundFrame();
  const margin = config.trackMargin;
  const width = Math.max(1, frame.width - margin * 2);
  const height = Math.max(1, frame.height - margin * 2);
  return {
    x: frame.x + margin + point.x * width,
    y: frame.y + margin + point.y * height
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
    const frame = getBackgroundFrame();
    ctx.drawImage(backgroundImage, frame.x, frame.y, frame.width, frame.height);
    return;
  }
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);
}

function drawPath() {
  if (state.track.length < 2) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = withAlpha(theme.ink, 0.35);
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
    const baseRadius = 14;
    const radius = (baseRadius + 4 * pulse) * state.view.scale;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    const alpha = visited ? 0.6 + 0.2 * pulse : 0.75 + 0.2 * pulse;
    const color = visited ? theme.success : theme.primary;
    ctx.fillStyle = withAlpha(color, alpha);
    ctx.fill();

    ctx.strokeStyle = withAlpha(theme.ink, 0.5);
    ctx.lineWidth = 2 * state.view.scale;
    ctx.stroke();
  });
}

function drawCar() {
  if (state.track.length < 2) return;
  if (!state.avatar) return;
  const base = getPointAt(state.progress);
  const carX = base.x + base.nx * state.lateral;
  const carY = base.y + base.ny * state.lateral;
  const screen = toScreen({ x: carX, y: carY });
  const bob = Math.sin(performance.now() / 180) * 4 * state.view.scale;

  ctx.save();
  ctx.translate(screen.x, screen.y + bob);

  if (carSpriteReady) {
    const sizeBoost = 1.4;
    const targetWidth = 132 * state.view.scale * 0.65 * sizeBoost;
    const ratio = carSprite.naturalWidth / carSprite.naturalHeight || 1;
    const targetHeight = targetWidth / ratio;
    // Anchor avatar by its bottom-center so feet/base follow the track point.
    ctx.drawImage(
      carSprite,
      -targetWidth / 2,
      -targetHeight,
      targetWidth,
      targetHeight
    );
  } else {
    const sizeScale = 1.3 * 1.4;
    const fallbackWidth = 36 * state.view.scale * sizeScale;
    const fallbackHeight = 20 * state.view.scale * sizeScale;
    ctx.fillStyle = theme.primary;
    ctx.strokeStyle = theme.bg;
    ctx.lineWidth = 2 * state.view.scale;
    ctx.fillRect(
      -fallbackWidth / 2,
      -fallbackHeight,
      fallbackWidth,
      fallbackHeight
    );
    ctx.strokeRect(
      -fallbackWidth / 2,
      -fallbackHeight,
      fallbackWidth,
      fallbackHeight
    );

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const windowWidth = 12 * state.view.scale * sizeScale;
    const windowHeight = 16 * state.view.scale * sizeScale;
    ctx.fillRect(
      -windowWidth / 2,
      -fallbackHeight + 2 * state.view.scale,
      windowWidth,
      windowHeight
    );
  }

  ctx.restore();
}

function drawRecorderOverlay() {
  if (!state.recording.enabled) return;

  const frame = getBackgroundFrame();
  const margin = config.trackMargin;
  const width = Math.max(1, frame.width - margin * 2);
  const height = Math.max(1, frame.height - margin * 2);

  ctx.save();
  ctx.strokeStyle = withAlpha(theme.secondary, 0.8);
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(frame.x + margin, frame.y + margin, width, height);
  ctx.setLineDash([]);
  ctx.restore();

  if (state.recording.points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = withAlpha(theme.secondary, 0.8);
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
  ctx.fillStyle = withAlpha(theme.secondary, 0.9);
  state.recording.points.forEach((point) => {
    const world = normalizedToWorld(point);
    const screen = toScreen(world);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function beginTrackClip() {
  const frame = getBackgroundFrame();
  ctx.save();
  ctx.beginPath();
  ctx.rect(frame.x, frame.y, frame.width, frame.height);
  ctx.clip();
}

function endTrackClip() {
  ctx.restore();
}

function getBackgroundFrame() {
  const width = state.viewport.width;
  const height = state.viewport.height;
  if (!backgroundReady) {
    return { x: 0, y: 0, width, height };
  }
  const imgWidth = backgroundImage.naturalWidth || width;
  const imgHeight = backgroundImage.naturalHeight || height;
  const fit = config.backgroundFit === 'cover' ? 'cover' : 'contain';
  const scale = fit === 'cover'
    ? Math.max(width / imgWidth, height / imgHeight)
    : Math.min(width / imgWidth, height / imgHeight);
  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  return { x: offsetX, y: offsetY, width: drawWidth, height: drawHeight };
}

function migrateTrackPointsToBackground() {
  if (config.trackSpace !== 'viewport') return;
  if (config.trackControlPoints.length < 2) return;

  const margin = config.trackMargin;
  const oldWidth = Math.max(1, state.viewport.width - margin * 2);
  const oldHeight = Math.max(1, state.viewport.height - margin * 2);
  const frame = getBackgroundFrame();
  const newWidth = Math.max(1, frame.width - margin * 2);
  const newHeight = Math.max(1, frame.height - margin * 2);

  config.trackControlPoints = config.trackControlPoints.map((point) => {
    const worldX = margin + point.x * oldWidth;
    const worldY = margin + point.y * oldHeight;
    const nx = (worldX - frame.x - margin) / newWidth;
    const ny = (worldY - frame.y - margin) / newHeight;
    return {
      x: Math.min(1, Math.max(0, nx)),
      y: Math.min(1, Math.max(0, ny))
    };
  });

  config.trackSpace = 'background';
}

function showEndScreen() {
  if (!endScreen) return;
  endScreen.classList.remove('hidden');
  if (gameMusicUnlocked) {
    gameMusic.pause();
  }
}

function showCompletionModal() {
  if (!completionModal) return;
  completionModal.classList.remove('hidden');
  state.modalOpen = true;
}

function hideCompletionModal() {
  if (!completionModal) return;
  completionModal.classList.add('hidden');
}

function openStopModal(stop) {
  state.modalOpen = true;
  setSidebarOpen(false);
  state.activeStopId = stop.id;
  state.activeStageId = null;
  renderStopModal(stop);
  modal.classList.remove('hidden');
  renderSidebar();
}

function closeStopModal() {
  if (state.activeStopId && !isStopCompleted(state.activeStopId)) {
    return;
  }
  hideCompletionModal();
  modal.classList.add('hidden');
  state.modalOpen = false;
  state.activeStopId = null;
  state.activeStageId = null;
  renderSidebar();
}

function renderStopModal(stop) {
  modalBody.innerHTML = '';
  modalClose.style.display = '';

  if (modalHeader) {
    modalHeader.innerHTML = '';
  }

  const progress = getStopProgress(stop.id);
  const completed = isStopCompleted(stop.id);
  const stages = buildStopStages(stop);
  const activeStage = resolveActiveStage(stages, stop, progress);

  const headerTitle = document.createElement('h2');
  headerTitle.textContent = stop.name || 'Parada';
  modalHeader.appendChild(headerTitle);

  const progressLabel = document.createElement('div');
  progressLabel.className = 'modal-progress';
  progressLabel.textContent = completed
    ? 'Parada concluida'
    : `Etapas concluidas ${stages.filter((stage) => isStageCompleted(stop, stage, progress)).length}/${stages.length}`;
  modalHeader.appendChild(progressLabel);

  const stageList = document.createElement('div');
  stageList.className = 'modal-stage-list';

  stages.forEach((stage, index) => {
    const unlocked = isStageUnlocked(stages, stop, progress, index);
    const done = isStageCompleted(stop, stage, progress);
    const stageRow = document.createElement('div');
    stageRow.className = 'modal-stage';
    if (done) stageRow.classList.add('complete');
    if (!unlocked) stageRow.classList.add('locked');
    if (activeStage && stage.id === activeStage.id) stageRow.classList.add('active');

    const title = document.createElement('div');
    title.className = 'modal-stage-title';
    title.textContent = stage.title;
    stageRow.appendChild(title);

    const status = document.createElement('div');
    status.className = 'modal-stage-status';
    status.textContent = done ? 'Concluido' : unlocked ? 'Disponivel' : 'Bloqueado';
    stageRow.appendChild(status);

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'ghost modal-stage-action';
    action.classList.add('btn-compact');
    if (stage.type === 'content') {
      action.textContent = done ? 'Rever' : 'Visualizar';
    } else {
      action.textContent = done ? 'Rever' : 'Jogar';
    }
    action.disabled = !unlocked;
    action.addEventListener('click', () => {
      if (!unlocked) return;
      state.activeStageId = stage.id;
      renderStopModal(stop);
    });
    stageRow.appendChild(action);

    stageList.appendChild(stageRow);
  });

  modalHeader.appendChild(stageList);
  modalClose.classList.add('modal-close');
  modalClose.disabled = !completed;
  modalClose.textContent = completed ? 'Voltar para a trilha' : 'Conclua as etapas';
  if (completed) {
    modalClose.classList.add('primary');
    modalClose.classList.remove('ghost');
    modalClose.classList.add('modal-close--ready');
  } else {
    modalClose.classList.remove('primary');
    modalClose.classList.add('ghost');
    modalClose.classList.remove('modal-close--ready');
  }
  modalHeader.appendChild(modalClose);

  const lastStopId = stopData[stopData.length - 1]?.id;
  if (completed && stop.id === lastStopId) {
    const resultsButton = document.createElement('button');
    resultsButton.className = 'primary results-button';
    resultsButton.textContent = 'Finalizar trilha';
    resultsButton.addEventListener('click', () => {
      closeStopModal();
      showEndScreen();
    });
    modalHeader.appendChild(resultsButton);
  }

  if (activeStage) {
    renderStageContent(stop, activeStage, progress, stages);
  }
}

function renderStageContent(stop, stage, progress, stages) {
  modalBody.innerHTML = '';
  if (stage.type === 'content') {
    renderContentStage(stop, progress, stages, stage);
    return;
  }
  renderGameStage(stop, progress, stages, stage);
}

function advanceStage(stop, stages, currentStage) {
  const currentIndex = stages.findIndex((stage) => stage.id === currentStage.id);
  const nextIndex = currentIndex + 1;
  if (nextIndex < stages.length) {
    state.activeStageId = stages[nextIndex].id;
  }
  renderStopModal(stop);
  renderSidebar();
  if (isStopCompleted(stop.id) && !state.completionShown.has(stop.id)) {
    state.completionShown.add(stop.id);
    showCompletionModal();
  }
}

function renderContentStage(stop, progress, stages, stage) {
  const kicker = document.createElement('div');
  kicker.className = 'content-kicker';
  kicker.textContent = 'Conteudo da parada';
  modalBody.appendChild(kicker);

  const contentSection = document.createElement('section');
  contentSection.className = 'stop-section';
  const contentTitle = document.createElement('h3');
  contentTitle.textContent = stop.content?.title || 'Etapa de conteudo';
  contentSection.appendChild(contentTitle);

  const contentBody = document.createElement('p');
  contentBody.textContent = stop.content?.body || 'Complete a etapa de conteudo para liberar os games.';
  contentSection.appendChild(contentBody);

  if (stop.content?.video) {
    if (stop.content.video.endsWith('.mp4') || stop.content.video.endsWith('.webm')) {
      const video = document.createElement('video');
      video.src = stop.content.video;
      video.controls = true;
      contentSection.appendChild(video);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = stop.content.video;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      contentSection.appendChild(iframe);
    }
  }

  const contentButton = document.createElement('button');
  contentButton.className = 'primary';
  contentButton.classList.add('btn-compact');
  contentButton.classList.add('btn-inline');
  contentButton.textContent = progress.contentDone ? 'Conteudo concluido' : 'Concluir etapa';
  contentButton.disabled = progress.contentDone;
  contentButton.addEventListener('click', () => {
    progress.contentDone = true;
    advanceStage(stop, stages, stage);
  });
  contentSection.appendChild(contentButton);
  modalBody.appendChild(contentSection);
}

function renderGameStage(stop, progress, stages, stage) {
  const game = stage.game;
  const kicker = document.createElement('div');
  kicker.className = 'content-kicker';
  kicker.textContent = 'Game da parada';
  modalBody.appendChild(kicker);

  const header = document.createElement('section');
  header.className = 'stop-section';
  const title = document.createElement('h3');
  title.textContent = game.title;
  header.appendChild(title);
  const desc = document.createElement('p');
  desc.textContent = game.description || '';
  header.appendChild(desc);
  modalBody.appendChild(header);

  const board = document.createElement('div');
  board.className = 'game-board';
  modalBody.appendChild(board);

  const onComplete = () => {
    progress.gamesDone.add(game.id);
    advanceStage(stop, stages, stage);
  };

  if (game.type === 'memory') {
    renderMemoryGame(board, onComplete);
  } else if (game.type === 'quiz') {
    renderQuizGame(board, game, onComplete);
  } else if (game.type === 'sequence') {
    renderSequenceGame(board, game, onComplete);
  } else if (game.type === 'puzzle') {
    renderPuzzleGame(board, game, onComplete);
  }
}

function renderMemoryGame(container, onComplete) {
  const symbols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const deck = shuffleArray([...symbols, ...symbols]);
  const grid = document.createElement('div');
  grid.className = 'memory-grid';
  container.appendChild(grid);

  let firstIndex = null;
  let lock = false;
  const matched = new Set();
  const elements = [];

  const revealCard = (index, show) => {
    const el = elements[index];
    if (!el) return;
    if (show) {
      el.classList.add('revealed');
      el.textContent = deck[index];
    } else {
      el.classList.remove('revealed');
      el.textContent = '';
    }
  };

  const checkCompletion = () => {
    if (matched.size === deck.length) {
      onComplete();
    }
  };

  deck.forEach((symbol, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.addEventListener('click', () => {
      if (lock || matched.has(index)) return;
      if (firstIndex === index) return;
      revealCard(index, true);
      if (firstIndex === null) {
        firstIndex = index;
        return;
      }
      if (deck[firstIndex] === symbol) {
        matched.add(firstIndex);
        matched.add(index);
        elements[firstIndex].classList.add('matched');
        card.classList.add('matched');
        firstIndex = null;
        checkCompletion();
        return;
      }
      lock = true;
      const prevIndex = firstIndex;
      firstIndex = null;
      setTimeout(() => {
        revealCard(prevIndex, false);
        revealCard(index, false);
        lock = false;
      }, 700);
    });
    elements.push(card);
    grid.appendChild(card);
  });
}

function renderQuizGame(container, game, onComplete) {
  const question = document.createElement('p');
  question.textContent = game.question;
  container.appendChild(question);

  const options = document.createElement('div');
  options.className = 'quiz-options';
  container.appendChild(options);

  let solved = false;
  game.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = option;
    btn.addEventListener('click', () => {
      if (index === game.correctIndex) {
        if (solved) return;
        btn.classList.add('correct');
        solved = true;
        Array.from(options.children).forEach((child) => {
          child.disabled = true;
        });
        onComplete();
      } else {
        btn.classList.add('incorrect');
      }
    });
    options.appendChild(btn);
  });
}

function renderSequenceGame(container, game, onComplete) {
  const selected = [];
  const info = document.createElement('p');
  info.textContent = 'Clique nas etapas na ordem correta.';
  container.appendChild(info);

  const selectedWrap = document.createElement('div');
  selectedWrap.className = 'sequence-selected';
  container.appendChild(selectedWrap);

  const optionsWrap = document.createElement('div');
  optionsWrap.className = 'sequence-options';
  container.appendChild(optionsWrap);

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'ghost';
  resetButton.textContent = 'Reiniciar sequencia';
  resetButton.addEventListener('click', () => {
    selected.length = 0;
    selectedWrap.innerHTML = '';
    Array.from(optionsWrap.children).forEach((child) => {
      child.disabled = false;
    });
  });
  container.appendChild(resetButton);

  const shuffled = shuffleArray(game.steps);
  shuffled.forEach((step) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'sequence-chip';
    chip.textContent = step;
    chip.addEventListener('click', () => {
      selected.push(step);
      const tag = document.createElement('span');
      tag.textContent = step;
      selectedWrap.appendChild(tag);
      chip.disabled = true;

      if (selected.length === game.steps.length) {
        const correct = selected.every((value, idx) => value === game.steps[idx]);
        if (correct) {
          onComplete();
        } else {
          info.textContent = 'Sequencia incorreta. Tente novamente.';
        }
      }
    });
    optionsWrap.appendChild(chip);
  });
}

function renderPuzzleGame(container, game, onComplete) {
  const size = Math.max(2, Math.min(6, game.size || 3));
  const total = size * size;
  const pieceOrder = shuffleArray(Array.from({ length: total }, (_, i) => i));
  const boardPositions = Array.from({ length: total }, () => null);
  let selectedPiece = null;
  let solved = false;
  const drag = {
    active: false,
    pieceIndex: null,
    source: null,
    fromCell: null,
    originEl: null,
    ghost: null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'puzzle-wrap';
  wrapper.style.setProperty('--puzzle-size', size);
  wrapper.style.setProperty('--puzzle-image', `url("${game.image}")`);
  container.appendChild(wrapper);

  const board = document.createElement('div');
  board.className = 'puzzle-board';
  wrapper.appendChild(board);

  const tray = document.createElement('div');
  tray.className = 'puzzle-tray';
  wrapper.appendChild(tray);

  const helper = document.createElement('p');
  helper.className = 'puzzle-hint';
  helper.textContent = 'Clique em uma peca e depois em uma casa do tabuleiro.';
  container.appendChild(helper);

  function cleanupDrag() {
    if (drag.originEl) {
      drag.originEl.classList.remove('puzzle-piece--dragging');
    }
    if (drag.ghost && drag.ghost.parentNode) {
      drag.ghost.parentNode.removeChild(drag.ghost);
    }
    drag.active = false;
    drag.pieceIndex = null;
    drag.source = null;
    drag.fromCell = null;
    drag.originEl = null;
    drag.ghost = null;
  }

  function startDrag(event, pieceIndex, source, fromCell, originEl) {
    if (solved) return;
    event.preventDefault();
    drag.pieceIndex = pieceIndex;
    drag.source = source;
    drag.fromCell = fromCell;
    drag.originEl = originEl;
    drag.startX = event.clientX;
    drag.startY = event.clientY;

    const rect = originEl.getBoundingClientRect();
    drag.offsetX = event.clientX - rect.left;
    drag.offsetY = event.clientY - rect.top;

    const handleMove = (moveEvent) => {
      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;
      if (!drag.active) {
        if (Math.hypot(dx, dy) < 6) {
          return;
        }
        const ghost = originEl.cloneNode(true);
        ghost.classList.add('puzzle-ghost');
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghost.style.left = `${rect.left}px`;
        ghost.style.top = `${rect.top}px`;
        ghost.style.setProperty('--puzzle-image', `url("${game.image}")`);
        ghost.style.setProperty('--puzzle-size', size);
        document.body.appendChild(ghost);
        drag.ghost = ghost;
        drag.originEl.classList.add('puzzle-piece--dragging');
        drag.active = true;
      }
      if (drag.ghost) {
        drag.ghost.style.left = `${moveEvent.clientX - drag.offsetX}px`;
        drag.ghost.style.top = `${moveEvent.clientY - drag.offsetY}px`;
      }
    };

    const handleEnd = (endEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
      if (!drag.active) {
        cleanupDrag();
        return;
      }

      const target = document.elementFromPoint(endEvent.clientX, endEvent.clientY);
      const cell = target ? target.closest('.puzzle-cell') : null;
      if (cell) {
        const targetIndex = Number(cell.dataset.index);
        if (!Number.isNaN(targetIndex)) {
          if (drag.source === 'tray') {
            removePieceFromTray(drag.pieceIndex);
            placePiece(drag.pieceIndex, targetIndex);
          } else if (drag.source === 'board') {
            if (drag.fromCell !== null && drag.fromCell !== targetIndex) {
              boardPositions[drag.fromCell] = null;
              placePiece(drag.pieceIndex, targetIndex);
            }
          }
        }
      }

      cleanupDrag();
      selectedPiece = null;
      if (isSolved()) {
        solved = true;
        onComplete();
      }
      renderAll();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
  }

  function isSolved() {
    return boardPositions.every((value, index) => value === index);
  }

  function placePiece(pieceIndex, cellIndex) {
    const existing = boardPositions[cellIndex];
    if (existing !== null) {
      boardPositions[cellIndex] = pieceIndex;
      pieceOrder.push(existing);
    } else {
      boardPositions[cellIndex] = pieceIndex;
    }
  }

  function removePieceFromTray(pieceIndex) {
    const idx = pieceOrder.indexOf(pieceIndex);
    if (idx !== -1) pieceOrder.splice(idx, 1);
  }

  function renderBoard() {
    board.innerHTML = '';
    for (let i = 0; i < total; i += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'puzzle-cell';
      cell.dataset.index = String(i);

      const pieceIndex = boardPositions[i];
      if (pieceIndex !== null) {
        const piece = document.createElement('span');
        piece.className = 'puzzle-piece';
        piece.dataset.piece = String(pieceIndex);
        piece.style.setProperty('--piece-x', pieceIndex % size);
        piece.style.setProperty('--piece-y', Math.floor(pieceIndex / size));
        if (selectedPiece === pieceIndex) {
          piece.classList.add('selected');
        }
        piece.addEventListener('pointerdown', (event) => {
          startDrag(event, pieceIndex, 'board', i, piece);
        });
        cell.appendChild(piece);
      }

      cell.addEventListener('click', () => {
        if (solved) return;
        if (selectedPiece === null) {
          if (boardPositions[i] !== null) {
            pieceOrder.push(boardPositions[i]);
            boardPositions[i] = null;
            renderAll();
          }
          return;
        }

        removePieceFromTray(selectedPiece);
        placePiece(selectedPiece, i);
        selectedPiece = null;
        if (isSolved()) {
          solved = true;
          onComplete();
        }
        renderAll();
      });

      board.appendChild(cell);
    }
  }

  function renderTray() {
    tray.innerHTML = '';
    const trayTitle = document.createElement('div');
    trayTitle.className = 'puzzle-tray-title';
    trayTitle.textContent = 'Pecas';
    tray.appendChild(trayTitle);

    const trayGrid = document.createElement('div');
    trayGrid.className = 'puzzle-tray-grid';
    tray.appendChild(trayGrid);

    pieceOrder.forEach((pieceIndex) => {
      const piece = document.createElement('button');
      piece.type = 'button';
      piece.className = 'puzzle-piece';
      piece.dataset.piece = String(pieceIndex);
      piece.style.setProperty('--piece-x', pieceIndex % size);
      piece.style.setProperty('--piece-y', Math.floor(pieceIndex / size));
      if (selectedPiece === pieceIndex) {
        piece.classList.add('selected');
      }
      piece.addEventListener('pointerdown', (event) => {
        startDrag(event, pieceIndex, 'tray', null, piece);
      });
      piece.addEventListener('click', () => {
        if (solved) return;
        selectedPiece = selectedPiece === pieceIndex ? null : pieceIndex;
        renderAll();
      });
      trayGrid.appendChild(piece);
    });
  }

  function renderAll() {
    renderBoard();
    renderTray();
  }

  renderAll();
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
  state.stopProgress = new Map();
  state.activeStopId = null;
  state.activeStageId = null;
  state.completionShown = new Set();
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
  hideCompletionModal();
  buildTrack();
  renderSidebar();
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
      if (!isStopUnlocked(stop.id)) {
        continue;
      }
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
    (stopData.length === 0 || areAllStopsCompleted())
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

  beginTrackClip();
  drawPath();
  drawStops();
  drawCar();
  endTrackClip();
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
      config.trackSpace = 'background';
      resetGame();
    }
    state.paused = state.recording.enabled ? true : false;
  }

  if (event.key.toLowerCase() === 'c' && state.recording.enabled) {
    state.recording.points = [];
    state.recording.lastWorld = null;
  }

  if (event.key.toLowerCase() === 'l' && state.recording.enabled) {
    console.log('trackControlPoints:', JSON.stringify(state.recording.points, null, 2));
  }

  if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
    setSidebarOpen(false);
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
if (completionClose) {
  completionClose.addEventListener('click', () => {
    hideCompletionModal();
    closeStopModal();
  });
}
if (avatarOptions.length) {
  avatarOptions.forEach((option) => {
    option.addEventListener('click', () => {
      setAvatarSelection(option);
    });
  });
}
if (avatarConfirm) {
  avatarConfirm.addEventListener('click', () => {
    if (!state.avatarSelection) return;
    state.avatar = state.avatarSelection;
    setCarSpriteSource(state.avatar);
    closeAvatarModal();
    unlockRunningSound();
    unlockGameMusic();
    state.paused = false;
  });
}
if (introStart && introModal) {
  introStart.addEventListener('click', () => {
    introModal.classList.add('hidden');
    if (openAvatarModal()) {
      return;
    }
    unlockRunningSound();
    unlockGameMusic();
    state.paused = false;
  });
}

initSidebar();
resize();
resetGame();
if (introModal && !introModal.classList.contains('hidden')) {
  state.paused = true;
}
requestAnimationFrame(loop);
