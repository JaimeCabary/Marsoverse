const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const spaceshipImg = new Image();
spaceshipImg.src = "assets/spaceship.png";

const potionImg = new Image();
potionImg.src = "assets/food-icon.png";

const enemyImages = [{ img: new Image(), rotate: false }];
enemyImages[0].img.src = "assets/enemy.png";
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `assets/enemy${i}.png`;
  enemyImages.push({ img, rotate: true });
}

let spaceship = { x: canvas.width / 2 - 30, y: canvas.height - 80, width: 60, height: 60 };
let bullets = [], enemies = [], enemyBullets = [], potions = [];
let xp = parseFloat(localStorage.getItem("marsXP") || 0);
let lives = 3;
let hits = 0;
let bossSpawned = false, bossWarningShown = false, bossFlashTimer = 0;
let gamePaused = false;

// === Touch Control ===
let isTouching = false, lastTouchX = null;
canvas.addEventListener("touchstart", e => {
  isTouching = true;
  lastTouchX = e.touches[0].clientX;
});
canvas.addEventListener("touchmove", e => {
  if (!isTouching || gamePaused) return;
  const dx = e.touches[0].clientX - lastTouchX;
  spaceship.x += dx;
  lastTouchX = e.touches[0].clientX;
});
canvas.addEventListener("touchend", () => { isTouching = false; });

// === Keyboard Control ===
document.addEventListener("keydown", e => {
  if (gamePaused) return;
  if (e.key === "ArrowLeft") spaceship.x -= 20;
  if (e.key === "ArrowRight") spaceship.x += 20;
});
canvas.addEventListener("click", () => { if (!gamePaused) shoot(); });

// === Shooting ===
function shoot() {
  const count = getBulletCount();
  const spacing = 8;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spacing;
    bullets.push({ x: spaceship.x + spaceship.width / 2 + offset - 2, y: spaceship.y, width: 4, height: 10 });
  }
}
function getBulletCount() {
  if (xp >= 15) return 5;
  if (xp >= 10) return 4;
  if (xp >= 5) return 3;
  if (xp >= 1) return 2;
  return 1;
}

// === Enemies & Boss ===
function spawnEnemy() {
  if (gamePaused || enemies.length >= 7) return;
  const type = Math.floor(Math.random() * enemyImages.length);
  const selected = enemyImages[type];
  enemies.push({
    x: Math.random() * (canvas.width - 40),
    y: -40,
    width: 40,
    height: 40,
    img: selected.img,
    rotate: selected.rotate,
    isBoss: false
  });
}

function checkSpawnBoss() {
  if (hits >= 20 && !bossSpawned && !gamePaused) {
    spawnBoss();
  }
}
function spawnBoss() {
  enemies.push({
    x: canvas.width / 2 - 60,
    y: -100,
    width: 120,
    height: 120,
    img: enemyImages[0].img,
    rotate: false,
    isBoss: true,
    hp: 30,
    maxHp: 30
  });
  bossSpawned = true;
  bossWarningShown = true;
  setTimeout(() => bossWarningShown = false, 3000);
}
function spawnPotion() {
  if (gamePaused || !bossSpawned) return;
  potions.push({ x: Math.random() * (canvas.width - 20), y: -20 });
}
function enemyShoot(enemy) {
  if (!gamePaused) {
    enemyBullets.push({ x: enemy.x + enemy.width / 2 - 2, y: enemy.y + enemy.height });
  }
}

// === Game Loop ===
function update() {
  if (gamePaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);

  bullets = bullets.filter(b => b.y > -10);
  bullets.forEach(b => {
    b.y -= 6;
    ctx.fillStyle = "#ff0";
    ctx.fillRect(b.x, b.y, 4, 10);
  });

  enemies.forEach((enemy, i) => {
    enemy.y += 2;
    if (Math.random() < 0.01) enemyShoot(enemy);

    if (enemy.isBoss) {
      if (bossFlashTimer > 0) {
        ctx.fillStyle = "rgba(255,0,0,0.5)";
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        bossFlashTimer--;
      } else {
        ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
      }
      ctx.fillStyle = "#800";
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 6);
      ctx.fillStyle = "#0f0";
      ctx.fillRect(enemy.x, enemy.y - 10, (enemy.hp / enemy.maxHp) * enemy.width, 6);
    } else {
      enemy.rotate
        ? drawRotatedImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height, Math.PI)
        : ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });

  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
  enemyBullets.forEach(b => {
    b.y += 4;
    ctx.fillStyle = "red";
    ctx.fillRect(b.x, b.y, 4, 10);
    if (checkCollision(b, spaceship)) handleHit();
  });

  potions = potions.filter(p => p.y < canvas.height);
  potions.forEach((p, pi) => {
    p.y += 2;
    ctx.drawImage(potionImg, p.x, p.y, 20, 20);
    if (checkCollision(p, spaceship)) {
      const boss = enemies.find(e => e.isBoss);
      if (boss && boss.hp < boss.maxHp) boss.hp++;
      potions.splice(pi, 1);
    }
  });

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (checkCollision(b, e)) {
        bullets.splice(bi, 1);
        hits++;
        xp += 0.5;
        document.getElementById("xpDisplay").textContent = xp.toFixed(1);
        localStorage.setItem("marsXP", xp);

        if (e.isBoss) {
          e.hp--;
          bossFlashTimer = 4;
          if (e.hp <= 0) {
            enemies.splice(ei, 1);
            bossSpawned = false;
            setTimeout(() => {
              if (confirm("🎉 You Win! Play again?")) resetGame();
            }, 300);
          }
        } else {
          enemies.splice(ei, 1);
        }
      }
    });
  });

  if (bossWarningShown) {
    ctx.fillStyle = "#f00";
    ctx.font = "bold 26px Orbitron";
    ctx.fillText("⚠️ BOSS INCOMING!", 50, canvas.height / 2);
  }

  requestAnimationFrame(update);
}

// === Lives & End ===
function handleHit() {
  lives--;
  document.getElementById("lifeDisplay").textContent = lives;
  if (lives <= 0) {
    pauseGame();
    document.getElementById("gameOverScreen").style.display = "block";
  }
}
function pauseGame() {
  gamePaused = true;
}
function resumeGame() {
  if (!gamePaused) return;
  gamePaused = false;
  update();
}

// === Utilities ===
function checkCollision(a, b) {
  return a.x < b.x + b.width && a.x + 4 > b.x && a.y < b.y + b.height && a.y + 10 > b.y;
}
function drawRotatedImage(img, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function resetGame() {
  spaceship.x = canvas.width / 2 - 30;
  bullets = []; enemies = []; enemyBullets = []; potions = [];
  xp = 0; hits = 0; lives = 3; bossSpawned = false; bossWarningShown = false; gamePaused = false;
  document.getElementById("xpDisplay").textContent = xp.toFixed(1);
  document.getElementById("lifeDisplay").textContent = lives;
  document.getElementById("gameOverScreen").style.display = "none";
  update();
}

// === Init ===
spaceshipImg.onload = () => {
  enemyImages[4].img.onload = () => {
    document.getElementById("xpDisplay").textContent = xp.toFixed(1);
    document.getElementById("lifeDisplay").textContent = lives;
    update();
  };
};
setInterval(spawnEnemy, 1000);
setInterval(spawnPotion, 5000);
setInterval(shoot, 500);
setInterval(checkSpawnBoss, 2000);