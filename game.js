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
const GET_LINE = 404;

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

let canDrop = true;
let lastFallSeTime = 0;

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
  pusherForward = true;
  lastFallSeTime = 0;

  updateHud();

  for(let i = 0; i < 42; i++){
    medals.push({
      x: 60 + Math.random() * 240,
      y: TABLE_TOP + 22 + Math.random() * 155,
      z: Math.random() * 1.5,
      vx: 0,
      vy: 0,
      r: MEDAL_R,
      fresh: false
    });
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

  let rank = "夕暮れ部員";
  let comment = "今日もメダルを落とした。";

  if(score >= 35){
    rank = "夕暮れJACKPOT";
    comment = "夕焼けが終わるまで、ずっとメダルを見ていた。";
  }else if(score >= 24){
    rank = "残響RUSH";
    comment = "チャリン…という音だけが残った。";
  }else if(score >= 14){
    rank = "ゲームコーナー常連";
    comment = "なんとなく帰れなかった。";
  }else if(score >= 6){
    rank = "寄り道";
    comment = "少しだけ遊ぶつもりだった。";
  }

  rankEl.textContent = rank;
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
  }, 120);

  medals.push({
    x: 90 + Math.random() * 180,
    y: 42,
    z: 3.8 + Math.random() * 1.8,
    vx: (Math.random() - 0.5) * 0.45,
    vy: 0,
    r: MEDAL_R,
    fresh: true
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
  if(pusherForward){
    pusherDepth += 0.02 * dt;

    if(pusherDepth >= 1){
      pusherDepth = 1;
      pusherForward = false;
    }
  }else{
    pusherDepth -= 0.014 * dt;

    if(pusherDepth <= 0){
      pusherDepth = 0;
      pusherForward = true;
    }
  }
}

function updateMedals(dt){
  const pushStrength = pusherForward ? pusherDepth : 0;

  for(const m of medals){
    if(m.y < TABLE_TOP){
      m.vy += 0.12 * dt;
    }else{
      if(m.fresh){
        // 後から入れたメダルは上層に残り、少しずつ沈む
        m.z *= 0.996;

        if(m.z < 2.2){
          m.fresh = false;
        }
      }else{
        m.z *= 0.998;
      }
    }

    m.y += m.vy * dt;
    m.x += m.vx * dt;

    m.vx *= 0.96;
    m.vy *= 0.94;

    // プッシャーが直接押すのは下層メダルだけ
    const pushZoneTop = TABLE_TOP + 8;
    const pushZoneBottom = TABLE_TOP + 92;

    if(!m.fresh && m.y > pushZoneTop && m.y < pushZoneBottom){
      m.vy += pushStrength * 0.075 * dt;
    }

    if(m.x < 42){
      m.x = 42;
      m.vx *= -0.25;
    }

    if(m.x > canvas.width - 42){
      m.x = canvas.width - 42;
      m.vx *= -0.25;
    }
  }

  for(let i = 0; i < medals.length; i++){
    for(let j = i + 1; j < medals.length; j++){
      pushApart(medals[i], medals[j]);
    }
  }

  for(let i = medals.length - 1; i >= 0; i--){
    const m = medals[i];

    if(m.y > GET_LINE){
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

function pushApart(a, b){
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  const dist = Math.sqrt(dx * dx + dy * dy);
  const min = a.r + b.r - 1;

  if(dist > 0 && dist < min){
    const force = (min - dist) * 0.052;
    const nx = dx / dist;
    const ny = dy / dist;

    a.vx += nx * force;
    b.vx -= nx * force;

    a.vy += ny * force * 2.2;
    b.vy -= ny * force * 2.2;

    if(a.y < b.y){
      b.vy += 0.035;
    }else{
      a.vy += 0.035;
    }

    if(a.fresh) a.z = Math.max(a.z, 3.1);
    if(b.fresh) b.z = Math.max(b.z, 3.1);
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
    return (a.y - a.z * 3) - (b.y - b.z * 3);
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
  ctx.strokeRect(50, TABLE_TOP, 260, 190);

  ctx.fillStyle = "#6d5669";
  ctx.fillRect(35, 390, 290, 60);

  ctx.fillStyle = "#ffd9a1";
  ctx.font = "18px DotGothic16";
  ctx.textAlign = "center";
  ctx.fillText("GET ZONE", 180, 425);
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

  if(m.fresh){
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
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
https://afoolhippo.github.io/game17/

#夕暮れメダル
#カバゲーセン`;

  const url =
    "https://twitter.com/intent/tweet?text="
    + encodeURIComponent(text);

  window.open(url, "_blank", "noopener,noreferrer");
});