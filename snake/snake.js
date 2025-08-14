let gameLoop = null;
let gamePaused = false;
let gameStarted = false;
let highScore = parseInt(localStorage.getItem("marsHighScore")) || 0;
let currentLevel = 1;
let levels = [
  { speed: 300, barriers: [] },
  { speed: 250, barriers: [
    {x: 5, y: 5, w: 10, h: 1},
    {x: 5, y: 15, w: 10, h: 1}
  ]},
  { speed: 200, barriers: [
    {x: 0, y: 10, w: 20, h: 1},
    {x: 5, y: 5, w: 1, h: 10},
    {x: 15, y: 5, w: 1, h: 10}
  ]}
];

// DOM Elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const xpDisplay = document.getElementById("xpDisplay");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const lengthDisplay = document.getElementById("lengthDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const xpProgress = document.getElementById("xpProgress");
const gameOverlay = document.getElementById("gameOverlay");
const finalXP = document.getElementById("finalXP");
const newHighScore = document.getElementById("newHighScore");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const volumeSlider = document.getElementById("volumeSlider");
const muteBtn = document.getElementById("muteBtn");
const bgMusic = document.getElementById("bgMusic");
const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");
const levelUpSound = document.getElementById("levelUpSound");
const clickSound = document.getElementById("clickSound");
const swipeSound = document.getElementById("swipeSound");

// Tutorial Elements
const tutorial = document.getElementById("tutorial");
const tutorialSlides = document.querySelectorAll(".tutorial-slide");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const skipTutorial = document.getElementById("skipTutorial");
const slideCounter = document.getElementById("slideCounter");

// Game Settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let gameSpeed = levels[0].speed;

// Player Data
let playerXP = parseInt(localStorage.getItem("playerXP")) || 0;
let marsXP = parseInt(localStorage.getItem("marsXP")) || 0;

// Game Objects
let snake = [
  { x: 10, y: 10 }, // Head
  { x: 9, y: 10 }   // Tail
];
let velocity = { x: 1, y: 0 };
let food = spawnFood();
let barriers = [];

// Initialize Game
initGame();

function initGame() {
  // Load saved settings
  loadSettings();
  
  // Set up event listeners
  setupEventListeners();
  
  // Show tutorial if first time
  if (!localStorage.getItem("tutorialCompleted")) {
    showTutorial();
  } else {
    startGame();
  }
  
  // Update UI
  updateUI();
}

function loadSettings() {
  // Volume settings
  const savedVolume = parseFloat(localStorage.getItem("musicVolume")) ?? 1;
  volumeSlider.value = savedVolume;
  bgMusic.volume = savedVolume;
  
  // Mute settings
  const savedMute = localStorage.getItem("muted") === "true";
  if (savedMute) {
    muteGame();
  } else {
    unmuteGame();
  }
}

function setupEventListeners() {
  // Keyboard controls
  document.addEventListener("keydown", handleKeyDown);
  
  // Touch controls
  setupTouchControls();
  
  // Button controls
  document.getElementById("upBtn").addEventListener("click", () => changeDirection(0, -1));
  document.getElementById("downBtn").addEventListener("click", () => changeDirection(0, 1));
  document.getElementById("leftBtn").addEventListener("click", () => changeDirection(-1, 0));
  document.getElementById("rightBtn").addEventListener("click", () => changeDirection(1, 0));
  
  // Game buttons
  restartBtn.addEventListener("click", restartGame);
  pauseBtn.addEventListener("click", togglePause);
  
  // Sound controls
  volumeSlider.addEventListener("input", updateVolume);
  muteBtn.addEventListener("click", toggleMute);
  
  // Tutorial controls
  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    prevSlide();
  });
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    nextSlide();
  });
  skipTutorial.addEventListener("click", (e) => {
    e.preventDefault();
    skipTutorialHandler();
  });
}

function setupTouchControls() {
  let startX, startY;
  
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: false });
  
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!startX || !startY) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 5 && velocity.x !== -1) {
        changeDirection(1, 0);
        playSound(swipeSound);
      } else if (dx < -5 && velocity.x !== 1) {
        changeDirection(-1, 0);
        playSound(swipeSound);
      }
    } else {
      // Vertical swipe
      if (dy > 5 && velocity.y !== -1) {
        changeDirection(0, 1);
        playSound(swipeSound);
      } else if (dy < -5 && velocity.y !== 1) {
        changeDirection(0, -1);
        playSound(swipeSound);
      }
    }
    
    startX = 0;
    startY = 0;
  }, { passive: false });
}

function showTutorial() {
  if (tutorial) {
    tutorial.style.display = "flex";
    showSlide(1);
  }
}

function showSlide(slideNum) {
  if (!tutorialSlides.length || !slideCounter) return;
  
  // Ensure slideNum is within bounds
  slideNum = Math.max(1, Math.min(slideNum, tutorialSlides.length));
  
  // Update slide visibility
  tutorialSlides.forEach(slide => {
    slide.classList.remove("active");
    if (parseInt(slide.dataset.slide) === slideNum) {
      slide.classList.add("active");
    }
  });
  
  // Update slide counter
  slideCounter.textContent = `${slideNum}/${tutorialSlides.length}`;
  
  // Update button states
  prevBtn.disabled = slideNum === 1;
  nextBtn.disabled = slideNum === tutorialSlides.length;
}

function nextSlide() {
  playSound(clickSound);
  const currentSlide = document.querySelector(".tutorial-slide.active");
  if (!currentSlide) return;
  const nextSlideNum = parseInt(currentSlide.dataset.slide) + 1;
  if (nextSlideNum <= tutorialSlides.length) {
    showSlide(nextSlideNum);
  }
}

function prevSlide() {
  playSound(clickSound);
  const currentSlide = document.querySelector(".tutorial-slide.active");
  if (!currentSlide) return;
  const prevSlideNum = parseInt(currentSlide.dataset.slide) - 1;
  if (prevSlideNum >= 1) {
    showSlide(prevSlideNum);
  }
}

function skipTutorialHandler() {
  playSound(clickSound);
  localStorage.setItem("tutorialCompleted", "true");
  if (tutorial) {
    tutorial.style.display = "none";
  }
  startGame();
}

function startGame() {
  gameStarted = true;
  bgMusic.play();
  drawGame();
}

function updateUI() {
  xpDisplay.textContent = marsXP;
  highScoreDisplay.textContent = highScore;
  lengthDisplay.textContent = snake.length;
  levelDisplay.textContent = currentLevel;
  
  // Update XP progress
  const xpNeeded = currentLevel * 10;
  const progress = (marsXP % xpNeeded) / xpNeeded * 100;
  xpProgress.style.width = `${progress}%`;
}

function drawGame() {
  if (gamePaused || !gameStarted) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  drawGrid();
  
  // Draw barriers
  drawBarriers();
  
  // Draw food
  drawFood();
  
  // Draw snake
  drawSnake();
  
  // Move snake
  moveSnake();
  
  // Check collisions
  checkCollision();
  
  // Continue game loop
  gameLoop = setTimeout(drawGame, gameSpeed);
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for (let i = 0; i < tileCount; i++) {
    for (let j = 0; j < tileCount; j++) {
      ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
    }
  }
}

function drawBarriers() {
  ctx.fillStyle = "rgba(255, 113, 0, 0.3)";
  ctx.strokeStyle = "rgba(255, 113, 0, 0.7)";
  
  barriers.forEach(barrier => {
    ctx.fillRect(barrier.x * gridSize, barrier.y * gridSize, 
                barrier.w * gridSize, barrier.h * gridSize);
    ctx.strokeRect(barrier.x * gridSize, barrier.y * gridSize, 
                  barrier.w * gridSize, barrier.h * gridSize);
  });
}

function drawFood() {
  ctx.fillStyle = "#FFCC00";
  ctx.beginPath();
  ctx.arc(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.strokeStyle = "#FF7100";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Add glow effect
  ctx.shadowColor = "#FFCC00";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSnake() {
  // Draw each segment with gradient from head to tail
  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    const gradient = i / snake.length;
    
    ctx.fillStyle = `rgb(${Math.floor(255 * gradient)}, 
                     ${Math.floor(100 + 155 * gradient)}, 
                     ${Math.floor(50 * gradient)})`;
    
    ctx.beginPath();
    ctx.arc(
      segment.x * gridSize + gridSize / 2,
      segment.y * gridSize + gridSize / 2,
      gridSize / 2 - 1,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Add eyes to head
    if (i === 0) {
      ctx.fillStyle = "white";
      // Left eye
      ctx.beginPath();
      ctx.arc(
        segment.x * gridSize + gridSize / 3,
        segment.y * gridSize + gridSize / 3,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.arc(
        segment.x * gridSize + (gridSize / 3) * 2,
        segment.y * gridSize + gridSize / 3,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

function moveSnake() {
  const head = {
    x: snake[0].x + velocity.x,
    y: snake[0].y + velocity.y
  };
  
  snake.unshift(head);
  
  if (head.x === food.x && head.y === food.y) {
    // Snake ate food
    playSound(eatSound);
    food = spawnFood();
    marsXP++;
    localStorage.setItem("marsXP", marsXP);
    
    // Add to player's total XP
    playerXP++;
    localStorage.setItem("playerXP", playerXP);
    
    // Check for level up
    checkLevelUp();
    
    // Update UI
    updateUI();
  } else {
    snake.pop();
  }
}

function spawnFood() {
  const margin = 2;
  let newFood;
  let validPosition = false;
  
  while (!validPosition) {
    newFood = {
      x: Math.floor(Math.random() * (tileCount - margin * 2)) + margin,
      y: Math.floor(Math.random() * (tileCount - margin * 2)) + margin
    };
    
    // Check if food spawns on snake
    validPosition = !snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    // Check if food spawns on barrier
    if (validPosition) {
      for (const barrier of barriers) {
        if (newFood.x >= barrier.x && newFood.x < barrier.x + barrier.w &&
            newFood.y >= barrier.y && newFood.y < barrier.y + barrier.h) {
          validPosition = false;
          break;
        }
      }
    }
  }
  
  return newFood;
}

function checkLevelUp() {
  const xpNeeded = currentLevel * 10;
  if (marsXP >= xpNeeded) {
    currentLevel++;
    if (currentLevel <= levels.length) {
      gameSpeed = levels[currentLevel - 1].speed;
      barriers = levels[currentLevel - 1].barriers;
      playSound(levelUpSound);
      
      // Flash level up effect
      document.getElementById("levelDisplay").classList.add("level-up");
      setTimeout(() => {
        document.getElementById("levelDisplay").classList.remove("level-up");
      }, 1000);
    }
    
    updateUI();
  }
}

function checkCollision() {
  const head = snake[0];
  
  // Wall collision
  if (
    head.x < 0 || head.x >= tileCount ||
    head.y < 0 || head.y >= tileCount
  ) {
    gameOver();
    return;
  }
  
  // Self collision
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
      return;
    }
  }
  
  // Barrier collision
  for (const barrier of barriers) {
    if (head.x >= barrier.x && head.x < barrier.x + barrier.w &&
        head.y >= barrier.y && head.y < barrier.y + barrier.h) {
      gameOver();
      return;
    }
  }
}

function gameOver() {
  clearTimeout(gameLoop);
  gameStarted = false;
  bgMusic.pause();
  playSound(gameOverSound);
  
  // Check for high score
  if (marsXP > highScore) {
    highScore = marsXP;
    localStorage.setItem("marsHighScore", highScore);
    newHighScore.classList.remove("hidden");
  } else {
    newHighScore.classList.add("hidden");
  }
  
  // Show game over overlay
  finalXP.textContent = marsXP;
  gameOverlay.classList.remove("hidden");
}

function restartGame() {
  playSound(clickSound);
  
  clearTimeout(gameLoop);
  gameOverlay.classList.add("hidden");
  
  // Reset game state
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 }
  ];
  velocity = { x: 1, y: 0 };
  food = spawnFood();
  currentLevel = 1;
  gameSpeed = levels[0].speed;
  barriers = levels[0].barriers;
  
  // Don't reset marsXP - it persists between games
  updateUI();
  
  // Start game
  gameStarted = true;
  bgMusic.currentTime = 0;
  bgMusic.play();
  drawGame();
}

function togglePause() {
  playSound(clickSound);
  gamePaused = !gamePaused;
  
  if (gamePaused) {
    clearTimeout(gameLoop);
    pauseBtn.textContent = "RESUME";
    bgMusic.pause();
  } else {
    pauseBtn.textContent = "PAUSE";
    bgMusic.play();
    drawGame();
  }
}

function changeDirection(x, y) {
  // Prevent 180-degree turns
  if (velocity.x !== -x || velocity.y !== -y) {
    velocity = { x, y };
  }
}

function handleKeyDown(e) {
  switch (e.key) {
    case "ArrowUp": changeDirection(0, -1); break;
    case "ArrowDown": changeDirection(0, 1); break;
    case "ArrowLeft": changeDirection(-1, 0); break;
    case "ArrowRight": changeDirection(1, 0); break;
    case " ": togglePause(); break;
  }
}

// Sound functions
function updateVolume() {
  const volume = volumeSlider.value;
  bgMusic.volume = volume;
  localStorage.setItem("musicVolume", volume);
}

function toggleMute() {
  if (bgMusic.muted) {
    unmuteGame();
  } else {
    muteGame();
  }
}

function muteGame() {
  bgMusic.muted = true;
  muteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
      <line x1="3" y1="3" x2="21" y2="21"></line>
    </svg>
  `;
  localStorage.setItem("muted", "true");
}

function unmuteGame() {
  bgMusic.muted = false;
  muteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `;
  localStorage.setItem("muted", "false");
}

function playSound(sound) {
  if (bgMusic.muted) return;
  
  sound.currentTime = 0;
  sound.volume = volumeSlider.value;
  sound.play().catch(e => console.log("Audio play failed:", e));
}