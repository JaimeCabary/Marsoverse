let deck = [], playerCards = [], botCards = [], communityCards = [];
let xp = parseInt(localStorage.getItem("marsXP") || 0);
let usdt = parseFloat(localStorage.getItem("marsUSDT") || 0);

function updateStats() {
  document.getElementById("xpCount").textContent = xp;
  document.getElementById("walletCount").textContent = usdt.toFixed(2);
}

function buildDeck() {
  deck = [];
  const suits = ["♠", "♥", "♦", "♣"];
  const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 11 = Ace

  for (let s of suits) {
    for (let v of values) {
      deck.push({ value: v, label: `${v}${s}` });
    }
  }

  deck = deck.sort(() => Math.random() - 0.5);
}

function dealCards() {
  buildDeck();
  playerCards = [deck.pop(), deck.pop()];
  botCards = [deck.pop(), deck.pop()];
  communityCards = [deck.pop(), deck.pop(), deck.pop()];

  document.getElementById("playerHand").innerHTML = renderCardSet(playerCards);
  document.getElementById("botHand").innerHTML = `<div class="card">❓</div><div class="card">❓</div>`;
  document.getElementById("communityCards").innerHTML = renderCardSet(communityCards);
  document.getElementById("result").textContent = "";
}

function renderCardSet(cards) {
  return cards.map(c => `<div class="card">${c.label}</div>`).join("");
}

function reveal() {
  document.getElementById("botHand").innerHTML = renderCardSet(botCards);

  const playerScore = calcScore([...playerCards, ...communityCards]);
  const botScore = calcScore([...botCards, ...communityCards]);

  let resultText = "";

  if (playerScore > botScore) {
    xp += 5;
    usdt += 0.01;
    resultText = "🎉 You won! +5 XP, +0.01 USDT";
  } else if (playerScore < botScore) {
    resultText = "😿 Cubeco won! Try again.";
  } else {
    xp += 2;
    resultText = "⚖️ It's a draw! +2 XP";
  }

  document.getElementById("result").textContent = resultText;
  localStorage.setItem("marsXP", xp);
  localStorage.setItem("marsUSDT", usdt.toFixed(2));
  updateStats();
}

function calcScore(cards) {
  return cards.reduce((acc, c) => acc + c.value, 0);
}

function restart() {
  playerCards = [];
  botCards = [];
  communityCards = [];
  document.getElementById("playerHand").innerHTML = "";
  document.getElementById("botHand").innerHTML = "";
  document.getElementById("communityCards").innerHTML = "";
  document.getElementById("result").textContent = "";
}

updateStats();