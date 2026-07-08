const COLORS = ['#1abc9c', '#3498db', '#9b59b6', '#e67e22', '#e74c3c', '#2ecc71'];

const setupPanel = document.getElementById('setup');
const sessionPanel = document.getElementById('session');
const doneMessage = document.getElementById('doneMessage');
const durationInput = document.getElementById('duration');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const roundLabel = document.getElementById('roundLabel');
const clock = document.getElementById('clock');
const totalLabel = document.getElementById('totalLabel');

let audioCtx = null;
let totalMinutes = 0;
let totalSeconds = 0;
let running = false;
let paused = false;
let startTime = 0;
let pauseStart = 0;
let accumulatedPause = 0;
let lastRound = 0;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function beep(frequency, duration, delay = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const startAt = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.4, startAt + 0.02);
  gain.gain.linearRampToValueAtTime(0, startAt + duration);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playRingSound() {
  beep(880, 0.18);
  beep(880, 0.18, 0.22);
}

function playEndSound() {
  beep(660, 0.15, 0);
  beep(880, 0.15, 0.18);
  beep(1046, 0.3, 0.36);
}

function updateColor(round) {
  const color = COLORS[(round - 1) % COLORS.length];
  document.body.style.setProperty('--bg', color);
}

function tick() {
  if (!running || paused) return;

  const elapsedMs = Date.now() - startTime - accumulatedPause;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  if (elapsedSec >= totalSeconds) {
    finishSession();
    return;
  }

  const round = Math.floor(elapsedSec / 60) + 1;
  const secInMinute = elapsedSec % 60;
  const countdown = 60 - secInMinute;
  const remainingTotal = totalSeconds - elapsedSec;

  clock.textContent = countdown;
  roundLabel.textContent = `Round ${round} / ${totalMinutes}`;
  totalLabel.textContent = `Temps restant : ${formatTime(remainingTotal)}`;

  if (round !== lastRound) {
    lastRound = round;
    playRingSound();
    updateColor(round);
  }
}

function finishSession() {
  running = false;
  clock.textContent = '0';
  totalLabel.textContent = 'Temps restant : 0:00';
  playEndSound();
  document.body.style.setProperty('--bg', '#1abc9c');
  doneMessage.classList.remove('hidden');
}

function startSession() {
  const value = parseInt(durationInput.value, 10);
  totalMinutes = Number.isFinite(value) && value > 0 ? value : 10;
  totalSeconds = totalMinutes * 60;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  running = true;
  paused = false;
  startTime = Date.now();
  accumulatedPause = 0;
  lastRound = 0;
  pauseBtn.textContent = 'Pause';

  setupPanel.classList.add('hidden');
  doneMessage.classList.add('hidden');
  sessionPanel.classList.remove('hidden');
}

function togglePause() {
  if (!running) return;
  if (!paused) {
    paused = true;
    pauseStart = Date.now();
    pauseBtn.textContent = 'Reprendre';
  } else {
    paused = false;
    accumulatedPause += Date.now() - pauseStart;
    pauseBtn.textContent = 'Pause';
  }
}

function resetSession() {
  running = false;
  paused = false;
  sessionPanel.classList.add('hidden');
  doneMessage.classList.add('hidden');
  setupPanel.classList.remove('hidden');
  document.body.style.setProperty('--bg', '#1abc9c');
}

startBtn.addEventListener('click', startSession);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetSession);

setInterval(tick, 200);
