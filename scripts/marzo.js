
// 🌌 MarsoVerse Main Game Logic - marzo.js

document.addEventListener("DOMContentLoaded", () => {
  // 🌟 Initial Data Load
  const playerName = localStorage.getItem("playerName") || "Player";
  const playerAge = localStorage.getItem("playerAge") || "Unknown";
  const playerXP = localStorage.getItem("playerXP") || 0;
  const walletBalance = localStorage.getItem("walletBalance") || 0;

  // 🧠 Update UI Elements
  document.getElementById("playerNameHUD").textContent = playerName;
  document.getElementById("welcomeMessage").textContent = `Hello, ${playerName}`;
  document.getElementById("youName").textContent = playerName;
  document.getElementById("youAge").textContent = playerAge;
  document.getElementById("youXP").textContent = playerXP;
  document.getElementById("walletAmount").textContent = walletBalance;
  

  // 🧭 Navigation Control
  const navButtons = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      if (!target) return;

      pages.forEach((page) => {
        page.classList.remove("active");
      });

      const pageToShow = document.getElementById(target);
      if (pageToShow) {
        pageToShow.classList.add("active");
      }

      playSound("clickSound");
    });
  });
  const marsCanvas = document.getElementById("marsButtonCanvas");

marsCanvas?.addEventListener("click", () => {
  playSound("clickSound");
  alert(`Blasting off to Mars Commander ${playerName}`);
  window.location.href = "mars-viewer/dist/index.html";
});


  // 🔊 Audio Control
  const music = document.getElementById("marsostory");
  const sfxToggles = {
    music: document.getElementById("musicToggle"),
    mute: document.getElementById("muteToggle"),
    sfx: document.getElementById("sfxToggle"),
  };

  if (sfxToggles.music?.checked) music.play();

  sfxToggles.music?.addEventListener("change", () => {
    sfxToggles.music.checked ? music.play() : music.pause();
  });

  sfxToggles.mute?.addEventListener("change", () => {
    const muted = sfxToggles.mute.checked;
    document.querySelectorAll("audio").forEach((audio) => {
      audio.muted = muted;
    });
  });

  function playSound(id) {
    const el = document.getElementById(id);
    if (el && sfxToggles.sfx?.checked) {
      el.currentTime = 0;
      el.play();
    }
  }

  // 🚀 Mars Launch Button Logic
  const launchBtn = document.getElementById("launchMarsBtn");
  launchBtn?.addEventListener("click", () => {
    alert(`Blasting off to Mars Commander ${playerName}`);
    playSound("clickSound");
    window.location.href = "mars-viewer/dist/index.html";
  });
    const compName = localStorage.getItem("companionName") || "None";
  const cybName = localStorage.getItem("cyborgName") || "None";

  document.getElementById("youCompanion").textContent = compName;
  document.getElementById("youCyborg").textContent = cybName;
  document.getElementById("companionProfileName").textContent = compName;
  document.getElementById("cyborgProfileName").textContent = cybName;

  if (compName === "Errin") {
    document.getElementById("companionProfileImg").src = "images/errin.png";
  } else if (compName === "Elena") {
    document.getElementById("companionProfileImg").src = "images/elena.png";
  }

  // Always show jerry.png for cyborg until dynamic loading
  document.getElementById("cyborgProfileImg").src = "images/jerry.png";

  // 🧹 Reset Functionality
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to delete your progress?")) {
      localStorage.clear();
      location.reload();
    }
  });
  //  const avatarInput = document.getElementById("avatarUpload");
  //   const avatarImg = document.getElementById("playerAvatar");

  //   const savedAvatar = localStorage.getItem("playerAvatar");
  //   if (savedAvatar) {
  //     avatarImg.src = savedAvatar;
  //   }

  //   avatarInput.addEventListener("change", () => {
  //     const file = avatarInput.files[0];
  //     if (!file) {
  //       alert("No file selected.");
  //       return;
  //     }

  //     if (!file.type.startsWith("image/")) {
  //       alert("Please select an image file.");
  //       return;
  //     }

  //     const reader = new FileReader();
  //     reader.onload = function (e) {
  //       const result = e.target.result;
  //       avatarImg.src = result;
  //       localStorage.setItem("playerAvatar", result);
  //     };
  //     reader.readAsDataURL(file);
  //   });

 document.getElementById("toScroll").addEventListener("click", function () {
      document.getElementById("game-grid").scrollIntoView({ behavior: "smooth" });
    });
  // ☄️ GLTF Button Renderer
  initMarsGLTF();
});

// 🪐 Load Mars Model on Canvas Button
function initMarsGLTF() {
  const canvas = document.getElementById("marsButtonCanvas");
  if (!canvas) return;

  import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js").then(THREE => {
    import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js").then(module => {
      const GLTFLoader = module.GLTFLoader;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
      renderer.setSize(150, 150);

      const light = new THREE.PointLight(0xffffff, 1);
      light.position.set(10, 10, 10);
      scene.add(light);

      const loader = new GLTFLoader();
      loader.load(
        "../models/mars/scene.gltf",
        (gltf) => {
          const mars = gltf.scene;
          mars.scale.set(0.4, 0.4, 0.4);
          scene.add(mars);
          camera.position.z = 3;

          function animate() {
            requestAnimationFrame(animate);
            mars.rotation.y += 0.01;
            renderer.render(scene, camera);
          }

          animate();
        },
        undefined,
        (error) => console.error("Failed to load Mars model:", error)
      );
    });
  });
}

// document.addEventListener('DOMContentLoaded', () => {
//   const clickSound = document.getElementById('clickSound');
//   const marsostorySound = document.getElementById('marsostorySound');
//   const bondSound = document.getElementById('bondSound');
//   const birthSound = document.getElementById('birthSound');
//   const playerNameSpan = document.getElementById('playerName');
//   const playerRankSpan = document.getElementById('playerRank');
//   const playerXPSpan = document.getElementById('playerXP');
//   const playerMoneySpan = document.getElementById('playerMoney');
//   const youNameSpan = document.getElementById('youName');
//   const youAgeSpan = document.getElementById('youAge');
//   const youXPSpan = document.getElementById('youXP');
//   const skillsList = document.getElementById('skillsList');
//   const relationshipsList = document.getElementById('relationshipsList');
//   const walletBalance = document.getElementById('walletBalance');
//   const mapPanel = document.getElementById('mapPanel');
//   const friendsPanel = document.getElementById('friendsPanel');
//   const walletPanel = document.getElementById('walletPanel');
//   const youPanel = document.getElementById('youPanel');
//   const leaderboardPanel = document.getElementById('leaderboardPanel');
//   const mapBtn = document.getElementById('mapBtn');
//   const friendsBtn = document.getElementById('friendsBtn');
//   const walletBtn = document.getElementById('walletBtn');
//   const youBtn = document.getElementById('youBtn');
//   const leaderboardBtn = document.getElementById('leaderboardBtn');
//   const playBtn = document.getElementById('playBtn');
//   const familyTreeCanvas = document.getElementById('familyTreeCanvas');
//   const nav = document.querySelector('.nav');

//   let gameState = JSON.parse(localStorage.getItem('marsoverseState')) || {
//     playerName: 'Adventurer',
//     age: 25,
//     xp: 0,
//     money: 0,
//     resources: 0,
//     health: 100,
//     stamina: 100,
//     hunger: 0,
//     skills: {
//       gathering: { level: 1, xp: 0 },
//       crafting: { level: 1, xp: 0 },
//       terraforming: { level: 1, xp: 0 },
//       combat: { level: 1, xp: 0 },
//       survival: { level: 1, xp: 0 }
//     },
//     relationships: {
//       elena: { status: 'Stranger', points: 0 },
//       errin: { status: 'Stranger', points: 0 }
//     },
//     family: [{ name: 'Adventurer', age: 25, spouse: null, children: [] }],
//     rank: 'Unranked'
//   };

//   function playSound(audio, duration = null) {
//     if (audio) {
//       try {
//         audio.currentTime = 0;
//         audio.play().catch(e => console.error(`Audio playback failed: ${audio.id}`, e));
//         if (duration) setTimeout(() => audio.pause(), duration);
//       } catch (e) {
//         console.error(`Error playing audio: ${audio.id}`, e);
//       }
//     }
//   }

//   function updatePanels() {
//     playerNameSpan.textContent = gameState.playerName;
//     playerRankSpan.textContent = gameState.rank;
//     playerXPSpan.textContent = gameState.xp;
//     playerMoneySpan.textContent = gameState.money;
//     youNameSpan.textContent = gameState.playerName;
//     youAgeSpan.textContent = gameState.age;
//     youXPSpan.textContent = gameState.xp;
//     walletBalance.textContent = gameState.money;

//     skillsList.innerHTML = '';
//     for (const [skill, data] of Object.entries(gameState.skills)) {
//       const li = document.createElement('li');
//       li.textContent = `${skill.charAt(0).toUpperCase() + skill.slice(1)}: Level ${data.level} (${data.xp}/100)`;
//       skillsList.appendChild(li);
//     }

//     relationshipsList.innerHTML = '';
//     for (const [npc, data] of Object.entries(gameState.relationships)) {
//       const li = document.createElement('li');
//       li.textContent = `${npc.charAt(0).toUpperCase() + npc.slice(1)}: ${data.status} (${data.points}/100)`;
//       relationshipsList.appendChild(li);
//     }
//   }

//   function drawFamilyTree() {
//     const ctx = familyTreeCanvas.getContext('2d');
//     ctx.clearRect(0, 0, familyTreeCanvas.width, familyTreeCanvas.height);
//     ctx.fillStyle = '#FFFFFF';
//     ctx.font = '14px Exo 2';
//     ctx.textAlign = 'center';

//     const drawNode = (person, x, y, level) => {
//       ctx.fillStyle = '#FF6200';
//       ctx.fillRect(x - 50, y - 20, 100, 40);
//       ctx.fillStyle = '#FFFFFF';
//       ctx.fillText(person.name + (person.spouse ? ` & ${person.spouse}` : ''), x, y);
//       if (person.children.length > 0) {
//         const childSpacing = 100 / (person.children.length + 1);
//         person.children.forEach((child, i) => {
//           const childX = x - 50 + (i + 1) * childSpacing;
//           const childY = y + 60;
//           ctx.beginPath();
//           ctx.moveTo(x, y + 20);
//           ctx.lineTo(childX, childY - 20);
//           ctx.strokeStyle = '#00A3FF';
//           ctx.stroke();
//           drawNode(child, childX, childY, level + 1);
//         });
//       }
//     };

//     drawNode(gameState.family[0], familyTreeCanvas.width / 2, 50, 0);
//   }

//   function showPanel(panel) {
//     [mapPanel, friendsPanel, walletPanel, youPanel, leaderboardPanel].forEach(p => p.classList.remove('active'));
//     panel.classList.add('active');
//     if (panel === youPanel) drawFamilyTree();
//     playSound(clickSound);
//   }

//   mapBtn.addEventListener('click', () => showPanel(mapPanel));
//   friendsBtn.addEventListener('click', () => showPanel(friendsPanel));
//   walletBtn.addEventListener('click', () => showPanel(walletPanel));
//   youBtn.addEventListener('click', () => showPanel(youPanel));
//   leaderboardBtn.addEventListener('click', () => showPanel(leaderboardPanel));

//   playBtn.addEventListener('click', () => {
//     playSound(clickSound);
//     window.location.href = 'zepta.html';
//   });

//   nav.classList.add('active');
//   marsostorySound.play();
//   updatePanels();
// });