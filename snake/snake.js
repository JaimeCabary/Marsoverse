let gameLoop = null;
let started = true;
let highScore = parseInt(localStorage.getItem("marsHighScore") || 0);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
  { x: 10, y: 10 }, // Head
  { x: 9, y: 10 } // Tail (same row, behind head)
];
let velocity = { x: 1, y: 0 };
let food = spawnFood();
let xp = parseInt(localStorage.getItem("marsXP") || 0);

document.getElementById("xpDisplay").textContent = xp;
document.getElementById("highScoreDisplay").textContent = highScore;

// Load snake texture
const snakeImg = new Image();
snakeImg.src = "assets/snake-texture.png";

// Load food texture
const foodImg = new Image();
foodImg.src = "assets/food-icon.png";

let loaded = 0;
snakeImg.onload = foodImg.onload = () => {
  loaded++;
  if (loaded === 2) drawGame(); // Wait for both images before starting
};

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid lines (optional)
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i < tileCount; i++) {
    for (let j = 0; j < tileCount; j++) {
      ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
    }
  }

  drawFood();
  drawSnake();

  if (started) {
    moveSnake();
    checkCollision();
    gameLoop = setTimeout(drawGame, 300);
  }
}

function drawSnake() {
  for (let part of snake) {
    ctx.drawImage(snakeImg, part.x * gridSize, part.y * gridSize, gridSize, gridSize);
  }
}

function drawFood() {
  ctx.drawImage(foodImg, food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function moveSnake() {
  const head = {
    x: snake[0].x + velocity.x,
    y: snake[0].y + velocity.y
  };
  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    food = spawnFood();
    xp++;
    document.getElementById("xpDisplay").textContent = xp;
    localStorage.setItem("marsXP", xp);
  } else {
    snake.pop();
  }
}

function spawnFood() {
  const margin = 2;
  return {
    x: Math.floor(Math.random() * (tileCount - margin * 2)) + margin,
    y: Math.floor(Math.random() * (tileCount - margin * 2)) + margin
  };
}

function checkCollision() {
  const head = snake[0];

  if (
    head.x < 0 || head.x >= tileCount ||
    head.y < 0 || head.y >= tileCount
  ) {
    gameOver();
  }

  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
    }
  }
}

function gameOver() {
  if (xp > highScore) {
    highScore = xp;
    localStorage.setItem("marsHighScore", highScore);
    alert("🎉 New High Score! XP saved.");
  } else {
    alert("💀 Game Over! XP saved.");
  }

  clearTimeout(gameLoop);
  started = false;
}

function restart() {
  clearTimeout(gameLoop);
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 }
  ];
  velocity = { x: 1, y: 0 };
  food = spawnFood();
  started = true;
  
  xp = 0;
  localStorage.setItem("marsXP", xp);
  
  // Update UI
  document.getElementById("xpDisplay").textContent = xp;
  document.getElementById("highScoreDisplay").textContent = highScore;
  
  drawGame();
}

// 🕹 Keyboard input
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": if (velocity.y !== 1) velocity = { x: 0, y: -1 }; break;
    case "ArrowDown": if (velocity.y !== -1) velocity = { x: 0, y: 1 }; break;
    case "ArrowLeft": if (velocity.x !== 1) velocity = { x: -1, y: 0 }; break;
    case "ArrowRight": if (velocity.x !== -1) velocity = { x: 1, y: 0 }; break;
  }
});

// 📱 Swipe controls
let startX = 0, startY = 0;

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
}, false);

canvas.addEventListener("touchmove", (e) => {
  if (!startX || !startY) return;

  const touch = e.touches[0];
  const dx = touch.clientX - startX;
  const dy = touch.clientY - startY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && velocity.x !== -1) velocity = { x: 1, y: 0 };
    else if (dx < 0 && velocity.x !== 1) velocity = { x: -1, y: 0 };
  } else {
    if (dy > 0 && velocity.y !== -1) velocity = { x: 0, y: 1 };
    else if (dy < 0 && velocity.y !== 1) velocity = { x: 0, y: -1 };
  }

  startX = 0;
  startY = 0;
}, false);