// main.js（JSON読み込み対応版）

let characters = [];
let events = [];
let currentNode = 0;
let score = {
  hp: 5,
  items: 0,
  friends: 0
};
let map = [];

async function loadGameData() {
  const [charRes, eventRes] = await Promise.all([
    fetch("data/characters.json"),
    fetch("data/events.json")
  ]);
  characters = await charRes.json();
  events = await eventRes.json();

  initGame();
}

function initGame() {
  map = generateMap();
  renderMap();
  showMessage(`${characters.find(c => c.type === "leader").name} の冒険がはじまるよ！`);
}

function generateMap() {
  const length = 10;
  const route = [];
  for (let i = 0; i < length; i++) {
    const event = events[Math.floor(Math.random() * events.length)].type;
    route.push({ event });
  }
  return route;
}

function renderMap() {
  const container = document.getElementById("map");
  container.innerHTML = "";
  map.forEach((node, i) => {
    const div = document.createElement("div");
    div.className = "node" + (i === currentNode ? " active" : "");
    div.textContent = i + 1;
    container.appendChild(div);
  });
  updateStatus();
}

function updateStatus() {
  document.getElementById("status").innerText = `HP: ${score.hp} / 仲間: ${score.friends} / アイテム: ${score.items}`;
}

function showMessage(msg) {
  document.getElementById("log").innerText = msg;
}

function next() {
  if (currentNode >= map.length) return;

  const eventType = map[currentNode].event;
  const event = events.find(e => e.type === eventType);
  let message = event.message;

  // イベントの効果を適用
  if (event.effect) {
    if (event.effect.hp) {
      score.hp += event.effect.hp;
      if (score.hp < 0) score.hp = 0;
    }
    if (event.effect.items) {
      score.items += event.effect.items;
    }
    if (event.effect.friends) {
      const friend = characters.find(c => c.type === "friend" && !score["friendNames"]?.includes(c.name));
      if (friend) {
        message += `\n${friend.name}「${friend.line}」`;
        score.friends++;
        score.friendNames = [...(score.friendNames || []), friend.name];
      }
    }
  }

  showMessage(message);
  currentNode++;
  renderMap();

  if (currentNode >= map.length) {
    const finalScore = score.friends * 10 + score.items * 3 + score.hp * 5;
    showMessage(`冒険終了！スコア: ${finalScore}\n仲間: ${score.friends} / アイテム: ${score.items} / HP: ${score.hp}`);
    document.getElementById("nextButton").disabled = true;
  }
}

document.addEventListener("DOMContentLoaded", loadGameData);
