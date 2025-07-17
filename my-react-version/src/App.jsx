import { useState } from "react";

const defaultState = {
  resources: {
    money: 0, oxygen: 0, water: 0, food: 0,
    shelter: 0, rover: 0, fuel: 0, energy: 0, data_crystals: 0
  },
  relationship: "stranger",
  companionName: "Erin",
  familyTree: [],
  xp: 0,
  mood: "neutral",
  sfx: true,
  music: false
};

export default function App() {
  const [log, setLog] = useState([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState(
    JSON.parse(localStorage.getItem("zeptaGame")) || defaultState
  );

  const printLine = (text, user = true) => {
    setLog(l => [...l, { text, user }]);
  };

  const save = newState => {
    localStorage.setItem("zeptaGame", JSON.stringify(newState));
    setState(newState);
  };

  const handleCommand = () => {
    const val = input.trim();
    if (!val) return;
    printLine("> " + val);
    setInput("");

    const [cmd, ...rest] = val.split(" ");
    const arg = rest.join(" ").replace(/"/g, "");

    const newState = { ...state };

    // Simplified command system
    if (val === "/help") {
      printLine("🧭 Available: /connect erin, /relationship status, /xp status", false);
    } else if (val === "/connect erin") {
      newState.companionName = "Erin";
      newState.relationship = "companion";
      printLine(`🤖 Companion ${newState.companionName} joined`, false);
      save(newState);
    } else if (val === "/relationship status") {
      printLine(`💞 Relationship: ${newState.relationship}`, false);
    } else if (val === "/xp status") {
      printLine(`🔢 XP: ${newState.xp}`, false);
    } else {
      printLine("⚠️ Unknown command", false);
    }
  };

  return (
    <div className="p-4 bg-black text-green-400 min-h-screen font-mono">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl mb-4">🛰️ Zepta Terminal</h1>
        <div className="space-y-1 mb-4 h-[60vh] overflow-y-auto border p-2 rounded">
          {log.map((entry, i) => (
            <div key={i} className={entry.user ? "text-green-400" : "text-yellow-300"}>
              {entry.text}
            </div>
          ))}
        </div>
        <input
          className="w-full p-2 rounded bg-gray-800 text-white"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCommand()}
          placeholder="Enter command..."
        />
      </div>
    </div>
  );
}
