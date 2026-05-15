function setAppHeight(){

  const h = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  document.documentElement.style.setProperty("--app-height", `${h}px`);
}

setAppHeight();
window.addEventListener("resize", setAppHeight);

if(window.visualViewport){
  window.visualViewport.addEventListener("resize", setAppHeight);
}

const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");
const titleVisual = document.querySelector(".titleVisual");

const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const dropBtn = document.getElementById("dropBtn");

const scoreEl = document.getElementById("scoreEl");
const timeEl = document.getElementById("timeEl");

const rankEl = document.getElementById("rankEl");
const resultImage = document.getElementById("resultImage");
const resultScoreEl = document.getElementById("resultScoreEl");
const resultCommentEl = document.getElementById("resultCommentEl");

const retryBtn = document.getElementById("retryBtn");
const shareBtn = document.getElementById("shareBtn");
const homeBtn = document.getElementById("homeBtn");

const bgm = document.getElementById("bgm");
const seFall = document.getElementById("seFall");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const HOME_URL = "https://afoolhippo.github.io/home/?skipTitle=1";
const GAME_URL = "https://afoolhippo.github.io/game17/";

const MEDAL_R = 15;

const TABLE_TOP = 175;
const FIELD_TOP = TABLE_TOP + 22;
const GET_LINE = 392;

let medals = [];
let popups = [];

let score = 0;
let timeLeft = 30;

let running = false;

let timer = null;
let animationId = null;

let lastTime = 0;

let pusherDepth = 0;
let pusherForward = true;
let prevPusherDepth = 0;

let canDrop = true;
let lastFallSeTime = 0;

let medalId = 0;

function showScreen(screen){
  titleScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  screen.classList.add("active");
}

function updateHud(){
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
}

function resetGame(){
  medals = [];
  popups = [];

  score = 0;
  timeLeft = 30;

  pusherDepth = 0;
  prevPusherDepth = 0;
  pusherForward = true;

  lastFallSeTime = 0;
  medalId = 0;

  updateHud();

  // 初期メダル：疑似的な整列配置
  // 物理衝突は使わず、見た目として詰まっている状態を作る
  const cols = 7;
  const rows = 6;
  const gapX = 34;
  const gapY = 27;
  const startX = 78;
  const startY = FIELD_TOP + 18;

  for(let row = 0; row < rows; row++){
    for(let col = 0; col < cols; col++){
      medals.push({
        id: medalId++,
        x: startX + col * gapX + (Math.random() - 0.5) * 5,
        y: startY + row * gapY + (Math.random() - 0.5) * 4,
        baseX: startX + col * gapX,
        state: "field",
        r: MEDAL_R,
        z: Math.random() * 0.8,
        sway: Math.random() * Math.PI * 2,
        age: 999,
        pushed: 0
      });
    }
  }
}

function startGame(){
  resetGame();
  showScreen(gameScreen);

  running = true;

  bgm.volume = 0.42;
  bgm.currentTime = 0;
  bgm.play().catch(()=>{});

  lastTime = performance.now();

  clearInterval(timer);
  timer = setInterval(()=>{
    if(!running) return;

    timeLeft--;
    updateHud();

    if(timeLeft <= 0){
      endGame();
    }
  }, 1000);

  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function endGame(){
  running = false;

  clearInterval(timer);
  cancelAnimationFrame(animationId);

  bgm.pause();

  let rank = "夕暮れ散財";
  let comment = "少しだけ遊ぶつもりだった。";
  let image = "result_bad.png";

  if(score >= 50){
    rank = "夕暮れJACKPOT";
    comment = "夕焼けが終わるまで、ずっとメダルを見ていた。";
    image = "result_good.png";
  }else if(score >= 32){
    rank = "残響RUSH";
    comment = "チャリン…という音だけが残った。";
    image = "result_good.png";
  }else if(score >= 16){
    rank = "ゲームコーナー常連";
    comment = "なんとなく帰れなかった。";
    image = "result_normal.png";
  }

  rankEl.textContent = rank;

  if(resultImage){
    resultImage.src = image;
  }

  resultScoreEl.textContent = `GET ${score}枚`;
  resultCommentEl.textContent = comment;

  showScreen(resultScreen);
}

function dropMedal(){
  if(!running) return;
  if(!canDrop) return;

  canDrop = false;

  setTimeout(()=>{
    canDrop = true;
  }, 150);

  const lanes = [78, 112, 146, 180, 214, 248, 282];
  const lane = lanes[Math.floor(Math.random() * lanes.length)];

  medals.push({
    id: medalId++,
    x: lane + (Math.random() - 0.5) * 12,
    y: 42,
    baseX: lane,
    targetY: FIELD_TOP + 18 + Math.random() * 28,
    state: "fall",
    r: MEDAL_R,
    z: 2.2 + Math.random() * 0.8,
    sway: Math.random() * Math.PI * 2,
    age: 0,
    pushed: 0
  });
}

function loop(now){
  if(!running) return;

  const dt = Math.min((now - lastTime) / 16.67, 2);
  lastTime = now;

  update(dt);
  draw();

  animationId = requestAnimationFrame(loop);
}

function update(dt){
  updatePusher(dt);
  updateMedals(dt);
  updatePopups();
}

function updatePusher(dt){
  prevPusherDepth = pusherDepth;

  if(pusherForward){
    pusherDepth += 0.022 * dt;

    if(pusherDepth >= 1){
      pusherDepth = 1;
      pusherForward = false;
    }
  }else{
    pusherDepth -= 0.015 * dt;

    if(pusherDepth <= 0){
      pusherDepth = 0;
      pusherForward = true;
    }
  }
}

function updateMedals(dt){
  const pusherDelta = Math.max(0, pusherDepth - prevPusherDepth);

  // プッシャーが手前へ出た分だけ、場のメダルを確実に少し前へ送る
  const pushMove = pusherDelta * 34;

  const fieldCount = medals.filter(m => m.state === "field").length;
  const pressureBonus = Math.min(fieldCount / 80, 0.9);

  for(const m of medals){
    m.age += dt;
    m.sway += 0.035 * dt;

    if(m.state === "fall"){
      m.y += (4.4 + Math.min(m.age * 0.08, 2.2)) * dt;
      m.x += Math.sin(m.sway) * 0.18 * dt;

      if(m.y >= m.targetY){
        m.y = m.targetY;
        m.state = "field";
        m.z = 1.5;
        m.age = 0;
      }
    }else{
      // プッシャーによる前進
      m.y += pushMove * (0.72 + pressureBonus);

      // 常にごくわずかに前へ流す
      m.y += 0.018 * dt;

      // 投入数が多いほど少し流れやすくする
      if(fieldCount > 46){
        m.y += 0.012 * dt;
      }

      if(fieldCount > 54){
        m.y += 0.018 * dt;
      }

      // 横方向は揺れだけ。衝突計算はしない
      const drift = Math.sin(m.sway + m.id * 0.4) * 1.4;
      m.x += ((m.baseX + drift) - m.x) * 0.035 * dt;

      // 見た目用z
      m.z *= 0.992;
      if(m.z < 0.2) m.z = 0.2;
    }
  }

  // 重なりすぎ防止のため、描画上だけ縦に軽くばらす
  normalizeFieldSpacing();

  for(let i = medals.length - 1; i >= 0; i--){
    const m = medals[i];

    if(m.state === "field" && m.y > GET_LINE){
      score++;
      updateHud();

      playFall();

      if(score % 10 === 0){
        addPopup("残響RUSH");
      }else if(score % 5 === 0){
        addPopup(`${score}枚`);
      }

      medals.splice(i, 1);
    }
  }
}

function normalizeFieldSpacing(){
  const field = medals
    .filter(m => m.state === "field")
    .sort((a,b)=>a.y - b.y);

  // 完全物理ではなく、詰まりすぎた時だけ少し前へ逃がす
  for(let i = 1; i < field.length; i++){
    const prev = field[i - 1];
    const cur = field[i];

    const sameLane = Math.abs(prev.baseX - cur.baseX) < 18;
    const tooClose = Math.abs(prev.y - cur.y) < 12;

    if(sameLane && tooClose){
      cur.y += 0.7;
    }
  }
}

function addPopup(text){
  popups.push({
    text,
    x: 180,
    y: 300,
    life: 42
  });
}

function updatePopups(){
  for(let i = popups.length - 1; i >= 0; i--){
    const p = popups[i];

    p.life--;
    p.y -= 0.4;

    if(p.life <= 0){
      popups.splice(i, 1);
    }
  }
}

function playFall(){
  const now = performance.now();

  if(now - lastFallSeTime < 240){
    return;
  }

  lastFallSeTime = now;

  seFall.currentTime = 0;
  seFall.volume = 0.28;
  seFall.play().catch(()=>{});
}

function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawMachine();
  drawPusher();

  const sorted = [...medals].sort((a,b)=>{
    return (a.y - a.z * 4) - (b.y - b.z * 4);
  });

  for(const m of sorted){
    drawMedal(m);
  }

  drawPopups();
}

function drawBackground(){
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);

  grad.addColorStop(0, "#ffb36b");
  grad.addColorStop(0.45, "#d67b88");
  grad.addColorStop(1, "#524864");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffdd99";
  ctx.beginPath();
  ctx.arc(180, 92, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawMachine(){
  ctx.fillStyle = "#2d2538";
  ctx.fillRect(35, 120, 290, 330);

  ctx.strokeStyle = "#f0c078";
  ctx.lineWidth = 4;
  ctx.strokeRect(35, 120, 290, 330);

  ctx.fillStyle = "#4a3e58";
  ctx.fillRect(50, TABLE_TOP, 260, 190);

  // 下辺は描かず、手前へ落ちるフィールドに見せる
  ctx.strokeStyle = "#f0c078";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, TABLE_TOP);
  ctx.lineTo(310, TABLE_TOP);
  ctx.moveTo(50, TABLE_TOP);
  ctx.lineTo(50, TABLE_TOP + 190);
  ctx.moveTo(310, TABLE_TOP);
  ctx.lineTo(310, TABLE_TOP + 190);
  ctx.stroke();

  ctx.fillStyle = "#6d5669";
  ctx.fillRect(35, 390, 290, 60);

  ctx.fillStyle = "#ffd9a1";
  ctx.font = "18px DotGothic16";
  ctx.textAlign = "center";
  ctx.fillText("↓↓ GET ↓↓", 180, 425);
}

function drawPusher(){
  const y = 148 + pusherDepth * 28;

  ctx.fillStyle = "#b84d5d";
  ctx.fillRect(60, y, 240, 30);

  ctx.strokeStyle = "#f0c078";
  ctx.lineWidth = 3;
  ctx.strokeRect(60, y, 240, 30);

  ctx.fillStyle = "#fff2d8";
  ctx.font = "14px DotGothic16";
  ctx.textAlign = "center";
  ctx.fillText("PUSH", 180, y + 20);
}

function drawMedal(m){
  const drawY = m.y - m.z * 5;

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.38)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 3 + m.z;
  ctx.shadowOffsetX = 1;

  ctx.fillStyle = "#f5c96d";
  ctx.beginPath();
  ctx.arc(m.x, drawY, m.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#6d4d1f";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#6d4d1f";
  ctx.font = "12px DotGothic16";
  ctx.textAlign = "center";
  ctx.fillText("M", m.x, drawY + 4);

  if(m.state === "fall"){
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.x - 3, drawY - 3, m.r - 5, Math.PI * 1.05, Math.PI * 1.55);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPopups(){
  for(const p of popups){
    ctx.save();

    ctx.globalAlpha = p.life / 42;

    ctx.fillStyle = "#fff4d0";
    ctx.strokeStyle = "#402d2f";
    ctx.lineWidth = 4;

    ctx.font =
      p.text === "残響RUSH"
      ? "38px DotGothic16"
      : "30px DotGothic16";

    ctx.textAlign = "center";

    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillText(p.text, p.x, p.y);

    ctx.restore();
  }
}

startBtn.addEventListener("click", startGame);

if(titleVisual){
  titleVisual.addEventListener("click", startGame);
}

dropBtn.addEventListener("click", dropMedal);

backBtn.addEventListener("click", ()=>{
  running = false;

  clearInterval(timer);
  cancelAnimationFrame(animationId);

  bgm.pause();

  showScreen(titleScreen);
});

retryBtn.addEventListener("click", ()=>{
  running = false;

  clearInterval(timer);
  cancelAnimationFrame(animationId);

  bgm.pause();

  showScreen(titleScreen);
});

homeBtn.addEventListener("click", ()=>{
  location.href = HOME_URL;
});

shareBtn.addEventListener("click", ()=>{

  const text =
`夕暮れメダル、今日も落とした🌇🪙
${score}枚

無料ブラウザゲーム
「夕暮れメダル」
${GAME_URL}

#夕暮れメダル
#カバゲーセン`;

  const url =
    "https://twitter.com/intent/tweet?text="
    + encodeURIComponent(text);

  window.open(url, "_blank", "noopener,noreferrer");
});