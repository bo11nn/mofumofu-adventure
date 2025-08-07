// main.js
let map = [];
let currentPosition = 0;
let score = { allies: 0, items: 0, hp: 3 };
let characters = [];
let events = [];
let logHistory = [];

async function loadData() {
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
  currentPosition = 0;
  score = { allies: 0, items: 0, hp: 3 };
  logHistory = [];
  updateStatus();
  renderMap();
  showMessage("ゲームを開始しました。『次へ進む』をクリックしてください。");
  document.getElementById("nextButton").disabled = false;
  document.getElementById("retryButton").style.display = "none";
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
  const mapDiv = document.getElementById("map");
  mapDiv.innerHTML = "";
  map.forEach((node, index) => {
    const div = document.createElement("div");
    div.className = "node" + (index === currentPosition ? " active" : "");
    div.textContent = index + 1;
    mapDiv.appendChild(div);
  });
}

function updateStatus() {
  document.getElementById("status").textContent = `仲間: ${score.allies}人 / アイテム: ${score.items}個 / HP: ${score.hp}`;
}

function showMessage(msg) {
  document.getElementById("log").textContent = msg;
  logHistory.push(msg);
  const logDiv = document.getElementById("log-history");
  logDiv.innerHTML = logHistory.slice(-10).map(l => `<div>▶ ${l}</div>`).join("");
}

function next() {
  if (currentPosition >= map.length) {
    const totalScore = score.allies * 3 + score.hp * 2 + score.items;
    showMessage(`冒険終了！おつかれさまでした！\n仲間: ${score.allies} / HP: ${score.hp} / アイテム: ${score.items}\n総スコア: ${totalScore}`);
    document.getElementById("nextButton").disabled = true;
    document.getElementById("retryButton").style.display = "inline-block";
    return;
  }

  const current = map[currentPosition];
  let message = `マス${currentPosition + 1}：`;

  switch (current.event) {
    case "ally": {
      const ally = characters[Math.floor(Math.random() * characters.length)];
      score.allies++;
      message += `${ally.name}が仲間になった！\n「${ally.joinMessage}」`;
      break;
    }
    case "item": {
      score.items++;
      message += "アイテムを見つけた！";
      break;
    }
    case "enemy":
    case "strongEnemy": {
      const isStrong = current.event === "strongEnemy";
      const win = Math.random() < 0.5;
      if (win) {
        const itemsWon = isStrong ? 2 : 1;
        score.items += itemsWon;
        message += isStrong ? `強敵に勝利！アイテムを${itemsWon}個ゲット！` : "敵に勝利！アイテムをゲット！";
      } else {
        const damage = isStrong ? 2 : 1;
        score.hp -= damage;
        message += isStrong ? `強敵に敗北…HPが${damage}減った…` : "敵に敗北…ダメージを受けた…";
      }
      break;
    }
    case "rest": {
      score.hp++;
      message += "休憩してHPが回復した！";
      break;
    }
    case "trap": {
      score.hp--;
      message += "罠にかかってしまった…HPが1減った！";
      break;
    }
    case "treasure": {
      const items = 1 + Math.floor(Math.random() * 2);
      score.items += items;
      message += `大きな宝箱を発見！中にはアイテムが${items}個入っていた！`;
      break;
    }
    default: {
      message += "何もなかった…";
      break;
    }
  }

  updateStatus();
  showMessage(message);
  currentPosition++;
  renderMap();

  if (score.hp <= 0) {
    const totalScore = score.allies * 3 + score.hp * 2 + score.items;
    showMessage("HPが尽きてしまった…ゲームオーバー！\n仲間: " + score.allies + ", アイテム: " + score.items + ", HP: 0\n総スコア: " + totalScore);
    document.getElementById("nextButton").disabled = true;
    document.getElementById("retryButton").style.display = "inline-block";
    return;
  }
}

document.addEventListener("DOMContentLoaded", loadData);
