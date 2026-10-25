// Game configuration and state variables
const GOAL_CANS = 25; // Total items needed to collect
let currentCans = 0; // Current number of items collected
let gameActive = false; // Tracks if game is currently running
let spawnInterval; // Holds the interval for spawning items
let timerInterval; // Holds the interval for the countdown timer
let timeLeft = 30; // Time remaining in seconds
let audioContext = null;

const resultsEl = document.getElementById('achievements');
const currentCansEl = document.getElementById('current-cans');
const timerEl = document.getElementById('timer');

const winningMessages = [
  'You won! Amazing water-saving effort!',
  'Victory! You collected enough cans!',
  'Excellent work — the mission is complete!'
];

const losingMessages = [
  'Try again! You were close.',
  'Nice effort! Keep going.',
  'Almost there — give it another shot!'
];

function updateScoreBoard() {
  currentCansEl.textContent = currentCans;
  timerEl.textContent = timeLeft;
}

function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(frequency, startTime, duration, volume, type = 'triangle') {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playWinnerSound() {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25];
  melody.forEach((frequency, index) => {
    const start = ctx.currentTime + index * 0.18;
    playTone(frequency, start, 0.2, 0.08, 'triangle');
  });

  playTone(1318.51, ctx.currentTime + melody.length * 0.18, 0.35, 0.1, 'sine');
}

function showGameResult() {
  const isWinner = currentCans >= GOAL_CANS;
  const messages = isWinner ? winningMessages : losingMessages;
  const message = messages[Math.floor(Math.random() * messages.length)];

  resultsEl.textContent = message;
  resultsEl.classList.add(isWinner ? 'win' : 'lose');
  resultsEl.classList.remove(isWinner ? 'lose' : 'win');

  if (isWinner) {
    playWinnerSound();
  }
}

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();
updateScoreBoard();

function collectCan(event) {
  if (!gameActive) return;

  const can = event.target.closest('.water-can');
  if (!can) return;

  currentCans += 1;
  updateScoreBoard();

  if (currentCans >= GOAL_CANS) {
    endGame();
  }
}

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');

  // Clear all cells before spawning a new water can
  cells.forEach(cell => {
    cell.innerHTML = '';
    cell.removeEventListener('click', collectCan);
  });

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Use a template literal to create the wrapper and water-can element
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can"></div>
    </div>
  `;

  randomCell.addEventListener('click', collectCan);
}

function countdown() {
  if (!gameActive) return;

  timeLeft -= 1;
  updateScoreBoard();

  if (timeLeft <= 0) {
    endGame();
  }
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active

  gameActive = true;
  currentCans = 0;
  timeLeft = 30;
  resultsEl.textContent = '';
  resultsEl.classList.remove('win', 'lose');
  updateScoreBoard();
  createGrid();

  spawnInterval = setInterval(spawnWaterCan, 1000);
  timerInterval = setInterval(countdown, 1000);
  spawnWaterCan();
}

function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop the countdown timer
  showGameResult();
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
