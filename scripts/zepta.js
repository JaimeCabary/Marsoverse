document.addEventListener('DOMContentLoaded', () => {
  const marsostorySound = document.getElementById('marsostorySound');
  const clickSound = document.getElementById('clickSound');
  const bondSound = document.getElementById('bondSound');
  const birthSound = document.getElementById('birthSound');
  const terminalOutput = document.getElementById('terminalOutput');
  const commandInput = document.getElementById('commandInput');
  const submitCommand = document.getElementById('submitCommand');
  const playerNameSpan = document.getElementById('playerName');
  const playerAgeSpan = document.getElementById('playerAge');
  const playerXPSpan = document.getElementById('playerXP');
  const playerMoneySpan = document.getElementById('playerMoney');
  const youNameSpan = document.getElementById('youName');
  const youAgeSpan = document.getElementById('youAge');
  const youXPSpan = document.getElementById('youXP');
  const skillsList = document.getElementById('skillsList');
  const relationshipsList = document.getElementById('relationshipsList');
  const walletBalance = document.getElementById('walletBalance');
  const mapPanel = document.getElementById('mapPanel');
  const friendsPanel = document.getElementById('friendsPanel');
  const walletPanel = document.getElementById('walletPanel');
  const youPanel = document.getElementById('youPanel');
  const mapBtn = document.getElementById('mapBtn');
  const friendsBtn = document.getElementById('friendsBtn');
  const walletBtn = document.getElementById('walletBtn');
  const youBtn = document.getElementById('youBtn');
  const newGameBtn = document.getElementById('newGameBtn');
  const questsBtn = document.getElementById('questsBtn');
  const familyTreeCanvas = document.getElementById('familyTreeCanvas');
  const nav = document.querySelector('.nav');

  let gameState = JSON.parse(localStorage.getItem('marsoverseState')) || {
    playerName: 'Adventurer',
    age: 25,
    xp: 0,
    money: 0,
    resources: 0,
    health: 100,
    stamina: 100,
    hunger: 0,
    skills: {
      gathering: { level: 1, xp: 0 },
      crafting: { level: 1, xp: 0 },
      terraforming: { level: 1, xp: 0 },
      combat: { level: 1, xp: 0 },
      survival: { level: 1, xp: 0 }
    },
    relationships: {
      elena: { status: 'Stranger', points: 0 },
      errin: { status: 'Stranger', points: 0 }
    },
    family: [{ name: 'Adventurer', age: 25, spouse: null, children: [] }]
  };

  function playSound(audio, duration = null) {
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play().catch(e => console.error(`Audio playback failed: ${audio.id}`, e));
        if (duration) setTimeout(() => audio.pause(), duration);
      } catch (e) {
        console.error(`Error playing audio: ${audio.id}`, e);
      }
    }
  }

  function updatePanels() {
    playerNameSpan.textContent = gameState.playerName;
    playerAgeSpan.textContent = gameState.age;
    playerXPSpan.textContent = gameState.xp;
    playerMoneySpan.textContent = gameState.money;
    youNameSpan.textContent = gameState.playerName;
    youAgeSpan.textContent = gameState.age;
    youXPSpan.textContent = gameState.xp;
    walletBalance.textContent = gameState.money;

    skillsList.innerHTML = '';
    for (const [skill, data] of Object.entries(gameState.skills)) {
      const li = document.createElement('li');
      li.textContent = `${skill.charAt(0).toUpperCase() + skill.slice(1)}: Level ${data.level} (${data.xp}/100)`;
      skillsList.appendChild(li);
    }

    relationshipsList.innerHTML = '';
    for (const [npc, data] of Object.entries(gameState.relationships)) {
      const li = document.createElement('li');
      li.textContent = `${npc.charAt(0).toUpperCase() + npc.slice(1)}: ${data.status} (${data.points}/100)`;
      relationshipsList.appendChild(li);
    }
  }

  function saveGameState() {
    localStorage.setItem('marsoverseState', JSON.stringify(gameState));
  }

  function output(message) {
    const p = document.createElement('p');
    p.textContent = `> ${message}`;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function agePlayer() {
    setInterval(() => {
      gameState.age += 1;
      gameState.health = Math.max(50, gameState.health - 2);
      gameState.stamina = Math.max(50, gameState.stamina - 2);
      if (gameState.age % 5 === 0) {
        gameState.skills.survival.xp += 10;
        checkSkillLevelUp('survival');
        output('You feel wiser with age, boosting Survival Instinct.');
      }
      updatePanels();
      saveGameState();
    }, 3600000); // 1 hour = 1 year
  }

  function checkSkillLevelUp(skill) {
    if (gameState.skills[skill].xp >= 100 && gameState.skills[skill].level < 10) {
      gameState.skills[skill].level += 1;
      gameState.skills[skill].xp = 0;
      gameState.xp += 50;
      output(`Skill ${skill} leveled up to ${gameState.skills[skill].level}!`);
      playSound(birthSound);
    }
  }

  function progressRelationship(npc, points) {
    const rel = gameState.relationships[npc];
    rel.points = Math.min(100, rel.points + points);
    if (rel.points >= 100 && rel.status !== 'Lover') {
      rel.status = 'Lover';
      output(`You and ${npc} have fallen in love!`);
      playSound(bondSound);
    } else if (rel.points >= 50 && rel.status === 'Stranger') {
      rel.status = 'Friend';
      output(`${npc} now considers you a Friend.`);
      playSound(bondSound);
    }
    updatePanels();
    saveGameState();
  }

  function haveBaby(spouse) {
    const childName = `Child_${gameState.family[0].children.length + 1}`;
    const child = { name: childName, age: 0, spouse: null, children: [] };
    gameState.family[0].children.push(child);
    output(`Congratulations! You and ${spouse} have a new child: ${childName}.`);
    playSound(birthSound);
    setTimeout(() => {
      child.age = 3;
      output(`${childName} is now a toddler.`);
      saveGameState();
    }, 600000);
    setTimeout(() => {
      child.age = 18;
      output(`${childName} is now an adult.`);
      saveGameState();
    }, 1800000);
    saveGameState();
  }

  function drawFamilyTree() {
    const ctx = familyTreeCanvas.getContext('2d');
    ctx.clearRect(0, 0, familyTreeCanvas.width, familyTreeCanvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Exo 2';
    ctx.textAlign = 'center';

    const drawNode = (person, x, y, level) => {
      ctx.fillStyle = '#FF6200';
      ctx.fillRect(x - 50, y - 20, 100, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(person.name + (person.spouse ? ` & ${person.spouse}` : ''), x, y);
      if (person.children.length > 0) {
        const childSpacing = 100 / (person.children.length + 1);
        person.children.forEach((child, i) => {
          const childX = x - 50 + (i + 1) * childSpacing;
          const childY = y + 100;
          ctx.beginPath();
          ctx.moveTo(x, y + 20);
          ctx.lineTo(childX, childY - 20);
          ctx.strokeStyle = '#00A3FF';
          ctx.stroke();
          drawNode(child, childX, y + 100, level + 1);
        });
      }
    };

    drawNode(gameState.family[0], familyTreeCanvas.width / 2, 50, 0);
  }

  const commands = {
    GATHER: () => {
      const gatherAmount = gameState.skills.gathering.level * 10;
      gameState.resources += gatherAmount;
      const earned = gatherAmount / 2;
      gameState.money += earned;
      gameState.skills.gathering.xp += 10;
      gameState.stamina -= 10;
      gameState.hunger += 5;
      gameState.stamina = Math.max(0, gameState.stamina);
      output(`Gathered ${gatherAmount} resources and ${earned} Mars Credits.`);
      checkSkillLevelUp('gathering');
    },
    CRAFT: () => {
      if (gameState.resources >= 20) {
        gameState.resources -= 20;
        gameState.skills.crafting.xp += 15;
        gameState.stamina -= 10;
        gameState.stamina = Math.max(0, gameState.stamina);
        output('Crafted a new game tool.');
        checkSkillLevelUp('crafting');
      } else {
        output('Not enough resources to craft!');
      }
    },
    TERRAFORM: () => {
      if (gameState.resources >= 50) {
        gameState.resources -= 50;
        gameState.skills.terraforming.xp += 20;
        gameState.stamina -= 15;
        gameState.stamina = Math.max(0, gameState.stamina);
        output('Terraformed a small area of Mars!');
        checkSkillLevelUp('terraforming');
      } else {
        output('You need more resources to terraform!');
      }
    },
    FIGHT: () => {
      gameState.skills.combat.xp += 15;
      gameState.health -= 10;
      gameState.stamina -= 20;
      gameState.stamina = Math.max(0, gameState.stamina);
      gameState.health = Math.max(0, gameState.health);
      output('Fought off a Martian hazard.');
      checkSkillLevelUp('combat');
    },
    SURVIVE: () => {
      if (gameState.hunger >= 20) {
        gameState.hunger -= 20;
        gameState.skills.survival.xp += 10;
        output('Consumed food to survive.');
        checkSkillLevelUp('survival');
      } else {
        output('Not hungry enough to use survival skills.');
      }
    },
    COURT: (npc) => {
      if (gameState.relationships[npc]) {
        progressRelationship(npc, 20);
      } else {
        output(`No such NPC: ${npc}. Available: elena, errin.`);
      }
    },
    BABY: () => {
      const spouse = Object.entries(gameState.relationships).find(([_, data]) => data.status === 'Lover');
      if (spouse) {
        gameState.family[0].spouse = spouse[0];
        haveBaby(spouse[0]);
      } else {
        output('You need a Lover to have a baby.');
      }
    }
  };

  function showPanel(panel) {
    [mapPanel, friendsPanel, walletPanel, youPanel].forEach(p => p.classList.remove('active'));
    panel.classList.add('active');
    if (panel === youPanel) drawFamilyTree();
    playSound(clickSound);
  }

  // mapBtn.addEventListener('click', () => showPanel(mapPanel));
  // friendsBtn.addEventListener('click', () => showPanel(friendsPanel));
  // walletBtn.addEventListener('click', () => showPanel(walletPanel));
  // youBtn.addEventListener('click', () => showPanel(youPanel));

  submitCommand.addEventListener('click', () => {
    const input = commandInput.value.trim().toUpperCase().split(' ');
    const command = input[0];
    const arg = input[1]?.toLowerCase();
    playSound(clickSound);

    if (commands[command]) {
      commands[command](arg);
    } else {
      output('Unknown command. Try: GATHER, CRAFT, TERRAFORM, FIGHT, SURVIVE, COURT [npc], BABY');
    }

    commandInput.value = '';
    updatePanels();
    saveGameState();
  });

  commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitCommand.click();
  });

  newGameBtn.addEventListener('click', () => {
    gameState = {
      playerName: gameState.playerName,
      age: gameState.age,
      xp: 0,
      money: 0,
      resources: 0,
      health: 100,
      stamina: 100,
      hunger: 0,
      skills: {
        gathering: { level: 1, xp: 0 },
        crafting: { level: 1, xp: 0 },
        terraforming: { level: 1, xp: 0 },
        combat: { level: 1, xp: 0 },
        survival: { level: 1, xp: 0 }
      },
      relationships: {
        elena: { status: 'Stranger', points: 0 },
        errin: { status: 'Stranger', points: 0 }
      },
      family: [{ name: gameState.playerName, age: gameState.age, spouse: null, children: [] }]
    };
    output('Started a new game.');
    updatePanels();
    saveGameState();
    playSound(clickSound);
  });

  questsBtn.addEventListener('click', () => {
    output('Quests: Explore the Martian ruins (10 XP), Build a habitat (20 resources).');
    playSound(clickSound);
  });

  nav.classList.add('active');
  marsostorySound.play().catch(e => console.warn('Autoplay blocked:', e));
  updatePanels();
  agePlayer();
  output('Welcome to the MarsoVerse Terminal. Type a command to begin (e.g., GATHER, COURT elena).');
});