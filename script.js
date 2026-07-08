const palettes = [
  ['#141e30', '#243b55', '#6d5dfc'],
  ['#42275a', '#734b6d', '#f97316'],
  ['#134e5e', '#71b280', '#22c55e'],
  ['#4b134f', '#c94b4b', '#ec4899'],
  ['#16222a', '#3a6073', '#38bdf8'],
  ['#232526', '#414345', '#facc15'],
];

const form = document.querySelector('#timer-form');
const durationInput = document.querySelector('#duration');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const resetButton = document.querySelector('#reset-button');
const display = document.querySelector('#display');
const statusText = document.querySelector('#status');
const minuteLabel = document.querySelector('#minute-label');
const progressBar = document.querySelector('#progress-bar');

let durationSeconds = Number(durationInput.value) * 60;
let remainingSeconds = durationSeconds;
let intervalId = null;
let running = false;
let audioContext;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setPalette(index) {
  const [bgA, bgB, accent] = palettes[index % palettes.length];
  document.documentElement.style.setProperty('--bg-a', bgA);
  document.documentElement.style.setProperty('--bg-b', bgB);
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-dark', accent);
}

function ring() {
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.16);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.28, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.42);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.45);
}

function updateTimer() {
  display.value = formatTime(remainingSeconds);
  const elapsed = durationSeconds - remainingSeconds;
  const currentMinute = Math.min(Math.floor(elapsed / 60) + 1, Math.ceil(durationSeconds / 60));
  const totalMinutes = Math.ceil(durationSeconds / 60);
  minuteLabel.textContent = `Minute ${currentMinute} / ${totalMinutes}`;
  progressBar.style.width = `${(elapsed / durationSeconds) * 100}%`;
}

function markMinute() {
  const elapsed = durationSeconds - remainingSeconds;
  if (elapsed > 0 && elapsed % 60 === 0) {
    const minuteIndex = elapsed / 60;
    setPalette(minuteIndex);
    ring();
  }
}

function finishTimer() {
  clearInterval(intervalId);
  intervalId = null;
  running = false;
  remainingSeconds = 0;
  statusText.textContent = 'Séquence terminée';
  startButton.textContent = 'Redémarrer';
  startButton.disabled = false;
  pauseButton.disabled = true;
  progressBar.style.width = '100%';
  ring();
}

function tick() {
  if (remainingSeconds <= 0) {
    finishTimer();
    return;
  }

  remainingSeconds -= 1;
  markMinute();
  updateTimer();

  if (remainingSeconds <= 0) finishTimer();
}

function startTimer() {
  if (running) return;
  running = true;
  statusText.textContent = 'En cours';
  startButton.disabled = true;
  pauseButton.disabled = false;
  pauseButton.textContent = 'Pause';
  ring();
  intervalId = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!running) {
    startTimer();
    return;
  }

  running = false;
  clearInterval(intervalId);
  intervalId = null;
  statusText.textContent = 'En pause';
  startButton.disabled = true;
  pauseButton.textContent = 'Reprendre';
}

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  running = false;
  durationSeconds = Number(durationInput.value) * 60;
  remainingSeconds = durationSeconds;
  statusText.textContent = 'Prêt';
  startButton.textContent = 'Démarrer';
  startButton.disabled = false;
  pauseButton.disabled = true;
  pauseButton.textContent = 'Pause';
  setPalette(0);
  updateTimer();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  durationSeconds = Number(durationInput.value) * 60;
  if (!Number.isFinite(durationSeconds) || durationSeconds < 60) return;
  if (remainingSeconds === 0 || remainingSeconds === durationSeconds) {
    remainingSeconds = durationSeconds;
    setPalette(0);
    updateTimer();
  }
  startTimer();
});

pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
durationInput.addEventListener('change', resetTimer);

resetTimer();
