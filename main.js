let currentNode = 0;
let map = [];
let leader = null;
let score = {
  friends: 0,
  items: 0,
  hp: 3
};

const characters = [
  { name: "ぽむたろう", personality: "のんびり屋", line: "うーん、まだお昼寝してたいなぁ〜" },
  { name: "ちびみる", personality: "元気っ子", line: "よーし！お宝ぜんぶ取っちゃうぞー！" },
  { name: "ふわる", personality: "心配性", line: "だ、大丈夫かな……？でもがんばる！" }
];

const events = ["treasure", "enemy", "rest", "friend"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startGame() {
  leader = randomChoice(characters);
  document.getElementById("leader-name").textContent =
    `リーダー：${leader.name}（${leader.personality}）\n『${leader.line}』`;
  document.getElementById("title-screen").classList.add("hidden");
  document.getElementById("adventure-screen").classList.remove("hidden");
  generateMap();
  showNextNode();
}

function generateMap() {
  for (let i = 0; i < 10; i++) {
    map.push({ event: randomChoice(events), visited: false });
  }
  renderMap();
}

function renderMap() {
  const container = document.getElementById("map-container");
  container.innerHTML = "";
  map.forEach((node, index) => {
    const div = document.createElement("div");
    div.className = "map-node" + (node.visited ? " visited" : "");
    div.textContent = index + 1;
    container.appendChild(div);
  });
}

function showNextNode() {
  if (currentNode >= map.length) {
    endGame();
    return;
  }
  const node = map[currentNode];
  document.getElementById("next-button").classList.remove("hidden");
  document.getElementById("next-button").onclick = () => {
    runEvent(node.event);
    node.visited = true;
    currentNode++;
    renderMap();
  };
}

function log(text) {
  document.getElementById("log").textContent = text;
}

function runEvent(type) {
  document.getElementById("next-button").classList.add("hidden");
  let message = "";
  switch (type) {
    case "treasure":
      message = "宝箱を発見！おいしそうなキャンディを見つけた！";
      score.items++;
      break;
    case "enemy":
      const win = Math.random() > 0.5;
      if (win) {
        message = "敵を倒した！お宝をゲット！";
        score.items++;
      } else {
        message = "敵にちょっと負けちゃった……HPが減った。";
        score.hp--;
      }
      break;
    case "rest":
      message = "ふかふかの草原でひと休み。HPがちょっぴり回復した。";
      score.hp++;
      break;
    case "friend":
      message = "新しいもふもふ仲間が加わった！";
      score.friends++;
      break;
  }
  log(message);
  setTimeout(showNextNode, 1500);
}

function endGame() {
  document.getElementById("adventure-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");
  const finalScore = score.friends * 10 + score.hp * 5 + score.items * 2;
  document.getElementById("score-summary").textContent =
    `仲間: ${score.friends}人、HP: ${score.hp}、アイテム: ${score.items} → 合計スコア: ${finalScore}点！`;
}

document.getElementById("start-button").addEventListener("click", startGame);
