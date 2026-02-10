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
const sidebarList = document.getElementById('stop-list');

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
      { id: 'memory', type: 'memory', title: 'Jogo da memoria', description: 'Encontre os 6 pares.' },
      {
        id: 'quiz',
        type: 'quiz',
        title: 'Pergunta rapida',
        description: 'Escolha a melhor resposta.',
        question: 'Qual atitude reduz riscos na via?',
        options: ['Dirigir atento ao espaco', 'Ignorar a sinalizacao', 'Manter velocidade elevada'],
        correctIndex: 0
      },
      {
        id: 'sequence',
        type: 'sequence',
        title: 'Ordem correta',
        description: 'Organize as etapas.',
        steps: ['Verificar espelhos', 'Sinalizar manobra', 'Executar com controle', 'Retomar faixa']
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
    "x": 0.23489583333333333,
    "y": 0.16045197740112993
  },
  {
    "x": 0.20416666666666666,
    "y": 0.1977401129943503
  },
  {
    "x": 0.19791666666666666,
    "y": 0.25536723163841807
  },
  {
    "x": 0.21979166666666666,
    "y": 0.3050847457627119
  },
  {
    "x": 0.25416666666666665,
    "y": 0.327683615819209
  },
  {
    "x": 0.2791666666666667,
    "y": 0.34576271186440677
  },
  {
    "x": 0.2921875,
    "y": 0.37966101694915255
  },
  {
    "x": 0.28072916666666664,
    "y": 0.41129943502824856
  },
  {
    "x": 0.25416666666666665,
    "y": 0.4327683615819209
  },
  {
    "x": 0.23125,
    "y": 0.4576271186440678
  },
  {
    "x": 0.21145833333333333,
    "y": 0.47909604519774013
  },
  {
    "x": 0.20052083333333334,
    "y": 0.5276836158192091
  },
  {
    "x": 0.20729166666666668,
    "y": 0.5932203389830508
  },
  {
    "x": 0.225,
    "y": 0.6237288135593221
  },
  {
    "x": 0.25677083333333334,
    "y": 0.6305084745762712
  },
  {
    "x": 0.29322916666666665,
    "y": 0.63954802259887
  },
  {
    "x": 0.32395833333333335,
    "y": 0.6576271186440678
  },
  {
    "x": 0.346875,
    "y": 0.6892655367231638
  },
  {
    "x": 0.35520833333333335,
    "y": 0.7367231638418079
  },
  {
    "x": 0.371875,
    "y": 0.7966101694915254
  },
  {
    "x": 0.403125,
    "y": 0.8293785310734463
  },
  {
    "x": 0.4432291666666667,
    "y": 0.8361581920903954
  },
  {
    "x": 0.47708333333333336,
    "y": 0.8124293785310734
  },
  {
    "x": 0.5,
    "y": 0.7774011299435029
  },
  {
    "x": 0.5317708333333333,
    "y": 0.751412429378531
  },
  {
    "x": 0.5442708333333334,
    "y": 0.7231638418079096
  },
  {
    "x": 0.5734375,
    "y": 0.6926553672316385
  },
  {
    "x": 0.5885416666666666,
    "y": 0.656497175141243
  },
  {
    "x": 0.603125,
    "y": 0.6090395480225989
  },
  {
    "x": 0.5947916666666667,
    "y": 0.5536723163841808
  },
  {
    "x": 0.5739583333333333,
    "y": 0.5310734463276836
  },
  {
    "x": 0.5458333333333333,
    "y": 0.511864406779661
  },
  {
    "x": 0.5098958333333333,
    "y": 0.5129943502824859
  },
  {
    "x": 0.46927083333333336,
    "y": 0.5084745762711864
  },
  {
    "x": 0.4354166666666667,
    "y": 0.4847457627118644
  },
  {
    "x": 0.4171875,
    "y": 0.4429378531073446
  },
  {
    "x": 0.4171875,
    "y": 0.3887005649717514
  },
  {
    "x": 0.4375,
    "y": 0.3423728813559322
  },
  {
    "x": 0.46875,
    "y": 0.31186440677966104
  },
  {
    "x": 0.4979166666666667,
    "y": 0.2983050847457627
  },
  {
    "x": 0.5276041666666667,
    "y": 0.2903954802259887
  },
  {
    "x": 0.5729166666666666,
    "y": 0.28926553672316385
  },
  {
    "x": 0.6010416666666667,
    "y": 0.2858757062146893
  },
  {
    "x": 0.6203125,
    "y": 0.2497175141242938
  },
  {
    "x": 0.6119791666666666,
    "y": 0.19887005649717515
  },
  {
    "x": 0.6057291666666667,
    "y": 0.1615819209039548
  },
  {
    "x": 0.6192708333333333,
    "y": 0.12542372881355932
  },
  {
    "x": 0.6505208333333333,
    "y": 0.10734463276836158
  },
  {
    "x": 0.6796875,
    "y": 0.103954802259887
  },
  {
    "x": 0.7088541666666667,
    "y": 0.10282485875706214
  },
  {
    "x": 0.7390625,
    "y": 0.11412429378531073
  },
  {
    "x": 0.7630208333333334,
    "y": 0.13898305084745763
  },
  {
    "x": 0.7854166666666667,
    "y": 0.17401129943502824
  },
  {
    "x": 0.7989583333333333,
    "y": 0.20903954802259886
  },
  {
    "x": 0.8015625,
    "y": 0.2576271186440678
  },
  {
    "x": 0.7911458333333333,
    "y": 0.29491525423728815
  },
  {
    "x": 0.7677083333333333,
    "y": 0.327683615819209
  },
  {
    "x": 0.7421875,
    "y": 0.35706214689265536
  },
  {
    "x": 0.7119791666666667,
    "y": 0.39322033898305087
  },
  {
    "x": 0.7182291666666667,
    "y": 0.43389830508474575
  },
  {
    "x": 0.7479166666666667,
    "y": 0.4768361581920904
  },
  {
    "x": 0.7822916666666667,
    "y": 0.5073446327683616
  },
  {
    "x": 0.8052083333333333,
    "y": 0.5559322033898305
  },
  {
    "x": 0.809375,
    "y": 0.6090395480225989
  },
  {
    "x": 0.8104166666666667,
    "y": 0.6655367231638418
  },
  {
    "x": 0.7979166666666667,
    "y": 0.7152542372881356
  },
  {
    "x": 0.7661458333333333,
    "y": 0.7706214689265537
  },
  {
    "x": 0.740625,
    "y": 0.7966101694915254
  },
  {
    "x": 0.6890625,
    "y": 0.8384180790960452
  },
  {
    "x": 0.671875,
    "y": 0.8870056497175142
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
    const item = document.createElement('button');
    item.type = 'button';
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

    item.addEventListener('click', () => {
      if (!unlocked) return;
      openStopModal(stop);
    });

    sidebarList.appendChild(item);
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
    const scale = Math.min(width / imgWidth, height / imgHeight);
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
    const baseRadius = 14;
    const radius = (baseRadius + 4 * pulse) * state.view.scale;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    const alpha = visited ? 0.6 + 0.2 * pulse : 0.75 + 0.2 * pulse;
    const color = visited ? '123,211,137' : '242,95,92';
    ctx.fillStyle = `rgba(${color},${alpha})`;
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
  modalClose.classList.add('btn-compact');
  modalClose.disabled = !completed;
  modalClose.textContent = completed ? 'Voltar para a trilha' : 'Conclua as etapas';
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

  const contentStatus = document.createElement('div');
  contentStatus.className = 'badge';
  contentStatus.textContent = progress.contentDone ? 'Conteudo concluido' : 'Conteudo pendente';
  if (progress.contentDone) contentStatus.classList.add('success');
  contentSection.appendChild(contentStatus);

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
