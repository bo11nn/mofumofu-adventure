// main.js — キャラ固有セリフ対応版（重み付き・HP上下限・戦闘・ログ・リトライ込み）

// --- 設定 ---
const MAX_HP = 5;

// --- 状態 ---
let map = [];
let position = 0;
let hp = 3;
let items = 0;
let friends = 0;
let alliesList = [];           // 参加済み仲間名を保持
let eventsData = [];
let characters = [];
let logHistory = [];

// --- 初期化 ---
async function init() {
  try {
    const [evRes, chRes] = await Promise.all([
      fetch("data/events.json"),
      fetch("data/characters.json")
    ]);

    if (!evRes.ok || !chRes.ok) {
      throw new Error(`データ取得に失敗しました (events:${evRes.status}, characters:${chRes.status})`);
    }

    eventsData = await evRes.json();
    characters = await chRes.json();
  } catch (e) {
    console.error(e);
    showMessage("データの読み込みに失敗しました。ページを再読み込みしてください。\n" + e.message);
    document.getElementById("nextButton").disabled = true;
    return;
  }

  generateMapWeighted();
  renderMap();
  resetStats();
  updateStatus();
  showMessage("ゲームを開始しました。『次へ進む』をクリックしてください。");
  document.getElementById("nextButton").disabled = false;
  document.getElementById("retryButton").style.display = "none";
}

// --- マップ生成（重み付き） ---
function generateMapWeighted() {
  const total = eventsData.reduce((s, ev) => s + (ev.weight || 1), 0);
  map = [];
  for (let i = 0; i < 10; i++) {
    let r = Math.random() * total;
    for (const ev of eventsData) {
      r -= (ev.weight || 1);
      if (r <= 0) {
        map.push(ev);
        break;
      }
    }
  }
}

// --- 表示系 ---
function renderMap() {
  const mapDiv = document.getElementById("map");
  mapDiv.innerHTML = "";
  map.forEach((ev, idx) => {
    const node = document.createElement("div");
    node.className = "node";
    if (idx === position) node.classList.add("active");
    node.innerText = ev.label || (ev.type || `#${idx + 1}`);
    mapDiv.appendChild(node);
  });
}

function updateStatus(hitType) {
  const allyVal = document.getElementById("allyVal");
  const itemVal = document.getElementById("itemVal");
  const hpVal = document.getElementById("hpVal");

  allyVal.textContent = friends;
  itemVal.textContent = items;
  hpVal.textContent = hp;

  // HPハイライト
  hpVal.className = "";
  if (hitType === "hit") {
    hpVal.classList.add("hp-hit", "blink");
    setTimeout(() => hpVal.classList.remove("hp-hit", "blink"), 500);
  } else if (hitType === "heal") {
    hpVal.classList.add("hp-heal", "blink");
    setTimeout(() => hpVal.classList.remove("hp-heal", "blink"), 500);
  }

  // 仲間バッジ
  const alliesDiv = document.getElementById("allies");
  alliesDiv.innerHTML = alliesList.map(name => `<span class="ally-badge">${name}</span>`).join("");
}

function showMessage(msg) {
  const logEl = document.getElementById("log");
  logEl.textContent = msg;

  logHistory.push(msg);
  const histEl = document.getElementById("log-history");
  histEl.innerHTML = logHistory.slice(-10).map(l => `<div>▶ ${l}</div>`).join("");
}

// --- ユーティリティ ---
function clampHP(delta) {
  const prev = hp;
  hp = Math.max(0, Math.min(MAX_HP, hp + delta));
  if (hp > prev) updateStatus("heal");
  else if (hp < prev) updateStatus("hit");
  else updateStatus();
}

function resetStats() {
  position = 0;
  hp = 3;
  items = 0;
  friends = 0;
  alliesList = [];
  logHistory = [];
  updateStatus();
  const alliesDiv = document.getElementById("allies");
  alliesDiv.innerHTML = "";
}

// 未加入の仲間を優先して1人選ぶ（なければ全体から）
function pickFriend() {
  const poolAll = characters.filter(c => c.type === "friend");
  const poolNew = poolAll.filter(c => !alliesList.includes(c.name));
  const arr = poolNew.length ? poolNew : poolAll;
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- 進行 ---
function next() {
  if (position >= map.length) return;

  const ev = map[position];
  let msg = ev.message || (ev.label || "イベント");

  // 戦闘系は effect をそのまま使わず、勝敗ロジックで上書き
  if (ev.label === "敵" || ev.label === "強敵") {
    const isStrong = ev.label === "強敵";
    const win = Math.random() < 0.5; // 必要ならevents側に勝率を持たせてもOK
    if (win) {
      const gain = isStrong ? 2 : 1;
      items += gain;
      msg = (isStrong ? "強敵に勝利！" : "敵に勝利！") + `アイテムを${gain}個手に入れた！`;
      updateStatus();
    } else {
      const dmg = isStrong ? 2 : 1;
      clampHP(-dmg);
      msg = (isStrong ? "強敵に敗北…" : "敵に敗北…") + `HPが${dmg}減った…`;
    }
  }
  // 仲間加入イベント（固有セリフ）
  else if (ev.label === "仲間") {
    const f = pickFriend();
    friends += 1;
    alliesList.push(f.name);
    updateStatus();
    msg = `${f.name} が仲間になった！\n「${f.line}」`;
  }
  // それ以外は effect を汎用適用
  else if (ev.effect) {
    if (typeof ev.effect.hp === "number") clampHP(ev.effect.hp);
    if (typeof ev.effect.items === "number") { items += ev.effect.items; updateStatus(); }
    if (typeof ev.effect.friends === "number") { friends += ev.effect.friends; updateStatus(); }
  }

  showMessage(msg);

  // HP 0ならゲームオーバー
  if (hp <= 0) {
    endGame(true);
    return;
  }

  position++;
  renderMap();

  // 終了判定
  if (position >= map.length) {
    endGame(false);
  }
}

// --- 終了系 ---
function endGame(isGameOver) {
  const total = friends * 100 + hp * 50 + items * 20; // スコア式はお好みで
  const title = isGameOver ? "HPが尽きてしまった…ゲームオーバー！" : "冒険終了！おつかれさまでした！";
  showMessage(`${title}\n仲間: ${friends} / HP: ${hp} / アイテム: ${items}\n合計スコア: ${total}`);
  document.getElementById("nextButton").disabled = true;
  document.getElementById("retryButton").style.display = "inline-block";
}

// --- 起動 ---
document.addEventListener("DOMContentLoaded", init);
