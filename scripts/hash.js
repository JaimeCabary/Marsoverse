// ---- LOAD SOUNDS & STATE ---
const sounds = {
  click: new Audio('sounds/click.mp3'),
  typing: new Audio('sounds/typing.mp3'),
  intro: new Audio('sounds/intro.mp3'),
  levelup: new Audio('sounds/levelup.mp3'),
  babytalk: new Audio('sounds/babytalk.mp3'),
  explosion: new Audio('sounds/explosion.mp3'),
  mars_theme: new Audio('sounds/mars_theme.mp3'),
  galaxy: document.getElementById("galaxySound")
};

const defaultState = {
  resources:{money:0,oxygen:0,water:0,food:0,shelter:0,rover:0,fuel:0,energy:0,data_crystals:0},
  relationship:"stranger", companionName:"Erin", familyTree:[], xp:0,
  mood:"neutral", sfx:true, music:false
};
let state = JSON.parse(localStorage.getItem("zeptaGame")) || defaultState;
save();

function save(){ localStorage.setItem("zeptaGame", JSON.stringify(state)); }
function load(){ state = JSON.parse(localStorage.getItem("zeptaGame")) || defaultState; }

// ---- THEMES ----
const themeSwitch = document.getElementById("themeSwitch"),
      themeLabel = document.getElementById("theme-label"),
      body = document.body;

function setTheme(t){
  localStorage.setItem("theme", t);
  themeLabel.textContent = t==="terminal" ? "Terminal" : "Chat";
  themeSwitch.checked = (t==="terminal");
  applyTheme();
}

function applyTheme(){
  document.querySelector("video.hud-bg")?.remove();
  if(themeSwitch.checked === false){ // Chat mode
    const vid = document.createElement("video");
    vid.src = "starry.mp4"; vid.autoplay=vid.loop=vid.muted=true;
    vid.className = "hud-bg";
    body.prepend(vid);
  }
}
themeSwitch.addEventListener("change", ()=> setTheme(themeSwitch.checked?"terminal":"chat"));
setTheme(localStorage.getItem("theme") || "chat");

// ---- LOGGING LINES ----
const log = document.getElementById("zepta-log");
function printLine(txt,isUser=true){
  const d = document.createElement("div");
  d.textContent = (isUser ? "> " : "") + txt;
  d.className = "zepta-line " + (isUser ? "user-line" : "zepta-reply");
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

// ---- COMMAND LIST ----
const cmdList = {
  "/help":() => printLine("🧭 Commands: " + Object.keys(cmdList).join(" "),false),
  "/connect erin":() => attachCompanion("Erin"),
  "/connect elena":() => attachCompanion("Elena"),
  "/companion rename":arg => updateCompanion(arg),
  "/relationship status":() => printLine(`💞 Relationship: ${state.relationship}`, false),
  "/relationship progress":() => adjustRel(+1),
  "/relationship downgrade":() => adjustRel(-1),
  "/companion gift":arg => gift(arg),
  "/companion chat":() => printLine(`${state.companionName}: Hello commander!`, false),
  "/hug":() => hug(),
  "/kiss":() => kiss(),
  "/marry":() => marry(),
  "/baby add":name => addBaby(name),
  "/family tree":()=> printLine("🌳 " + (state.familyTree.join(", ")||"no family yet"), false),
  "/family remove":name => removeBaby(name),
  "/baby talk":() => playSound("babytalk") || printLine("👶 Gaga...", false),
  "/legacy status":showLegacy,
  "/xp status":() => printLine(`XP: ${state.xp}`, false),
  "/xp gain":amt => gainXP(amt),
  "/xp levelup":() => levelup(),
  "/mission build":() => missionBuild(),
  "/mission explore":() => missionExplore(),
  "/music play":() => toggleMusic(true),
  "/sound on":() => toggleSfx(true),
  "/sound off":() => toggleSfx(false),
  "/mood":() => printLine(`${state.companionName}: Feeling ${state.mood}`, false),
  "/sing":() => printLine(`${state.companionName}: 🎵 La la la...`, false),
  "/dream":() => printLine("🌙 You dream of the red sands of Mars...", false),
  "/journal entry":() => printLine("✍️ Journal entry saved.", false),
  "/secret activate":() => printLine("🛸 Secret mission unlocked!", false),
  "/verxio activate":() => printLine("🤖 Verx.io AI awake!", false),
  "/zepta overload":() => overload(),
  "/nuke":() => {playSound("explosion"); printLine("💥 Nuke triggered!", false)},
  "/aliens contact":() => printLine("🛸 Attempting alien contact...", false)
};

// Helper functions (attachCompanion, adjustRel, gift, etc.) below for clarity...

// --- CORE INTERACTIONS & SUGGESTIONS ---
const input = document.getElementById("zepta-input"),
      sendBtn = document.getElementById("zepta-send"),
      suggestions = document.getElementById("suggestions");

input.addEventListener("input", e => updateSuggestions(e.target.value));
input.addEventListener("keydown", e => {
  playSound("typing");
  if(e.key === "Enter"){
    processCommand(input.value.trim());
    input.value = "";
    suggestions.style.display = "none";
  }
});
sendBtn.addEventListener("click", ()=>processCommand(input.value.trim()));

// updateSuggestions()
function updateSuggestions(val){
  suggestions.innerHTML = "";
  if(val.startsWith("/")){
    for(let cmd in cmdList){
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = cmd;
      if(cmd.toLowerCase().startsWith(val.toLowerCase())){
        div.style.display="block";
      } else div.style.display="none";
      div.onclick=()=>{ input.value = cmd; suggestions.style.display="none"; playSound("click"); };
      suggestions.appendChild(div);
    }
    suggestions.style.display = "flex";
  } else suggestions.style.display = "none";
}

// processCommand()
function processCommand(v){
  if(!v) return;
  playSound("click");
  printLine(v, true);
  let matched = false;
  Object.keys(cmdList).forEach(cmd => {
    if(v.startsWith(cmd)){
      const arg = v.slice(cmd.length).trim().replace(/"/g,"");
      cmdList[cmd](arg);
      matched = true;
    }
  });
  if(!matched) printLine("⚠️ Unknown command, type /help", false);
}

// Utility: playSound(), attachCompanion(), adjustRel(), etc.
// ... [Add your support functions here as per earlier]

// ---- INIT STATE & UI ----
load();
printLine("🎬 MarsoVerse Initialized", false);
