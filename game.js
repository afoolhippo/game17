function setAppHeight() {
  const h = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  document.documentElement.style.setProperty(
    "--app-height",
    `${h}px`
  );
}

setAppHeight();

window.addEventListener("resize", setAppHeight);

if (window.visualViewport) {
  window.visualViewport.addEventListener(
    "resize",
    setAppHeight
  );
}

const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const dropBtn = document.getElementById("dropBtn");

const scoreEl = document.getElementById("scoreEl");
const timeEl = document.getElementById("timeEl");

const messageEl = document.getElementById("messageEl");

const rankEl = document.getElementById("rankEl");
const resultScoreEl = document.getElementById("resultScoreEl");
const resultCommentEl = document.getElementById("resultCommentEl");

const retryBtn = document.getElementById("retryBtn");
const shareBtn = document.getElementById("shareBtn");
const homeBtn = document.getElementById("homeBtn");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const HOME_URL =
  "https://afoolhippo.github.io/home/?skipTitle=1";

const GAME_URL =
  "https://afoolhippo.github.io/game17/";

let objects = [];

let score = 0;
let timeLeft = 60;

let running = false;

let timer = null;
let animationId = null;

let lastTime = 0;

let pusherX = 60;
let pusherDir = 1;

let canDrop = true;

const TABLE_TOP = 210;
const GET_LINE = 412;

function showScreen(screen) {
  titleScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");

  screen.classList.add("active");
}

function resetGame() {

  objects = [];

  score = 0;
  timeLeft = 60;

  pusherX = 60;
  pusherDir = 1;

  updateHud();

  for(let i=0;i<28;i++){

    objects.push({
      x:70 + Math.random()*220,
      y:TABLE_TOP + Math.random()*150,

      r:10,

      vx:0,
      vy:0
    });
  }
}

function updateHud(){
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
}

function startGame(){

  resetGame();

  showScreen(gameScreen);

  running = true;

  lastTime = performance.now();

  clearInterval(timer);

  timer = setInterval(()=>{

    if(!running) return;

    timeLeft--;

    updateHud();

    if(timeLeft <= 0){
      endGame();
    }

  },1000);

  cancelAnimationFrame(animationId);

  animationId = requestAnimationFrame(loop);
}

function endGame(){

  running = false;

  clearInterval(timer);

  cancelAnimationFrame(animationId);

  let rank = "夕暮れ部員";
  let comment = "今日もメダルを落とした。";

  if(score >= 70){

    rank = "夕暮れJACKPOT";
    comment =
    "夕焼けが終わるまで、ずっとメダルを見ていた。";

  }else if(score >= 45){

    rank = "残響RUSH";
    comment =
    "チャリン…という音だけが残った。";

  }else if(score >= 25){

    rank = "ゲームコーナー常連";
    comment =
    "なんとなく帰れなかった。";

  }else if(score >= 10){

    rank = "寄り道";
    comment =
    "少しだけ遊ぶつもりだった。";
  }

  rankEl.textContent = rank;
  resultScoreEl.textContent =
    `GET ${score}枚`;

  resultCommentEl.textContent =
    comment;

  showScreen(resultScreen);
}

function dropMedal(){

  if(!running) return;

  if(!canDrop) return;

  canDrop = false;

  setTimeout(()=>{
    canDrop = true;
  },220);

  objects.push({

    x:90 + Math.random()*180,
    y:42,

    r:10,

    vx:(Math.random()-0.5)*0.4,
    vy:0
  });

  messageEl.textContent = "ｶﾁｬ…";
}

function loop(now){

  if(!running) return;

  const dt = Math.min(
    (now - lastTime) / 16.67,
    2
  );

  lastTime = now;

  update(dt);
  draw();

  animationId =
    requestAnimationFrame(loop);
}

function update(dt){

  pusherX += pusherDir * 1.3 * dt;

  if(pusherX > 205){
    pusherDir = -1;
  }

  if(pusherX < 45){
    pusherDir = 1;
  }

  for(const obj of objects){

    if(obj.y < TABLE_TOP){

      obj.vy += 0.11 * dt;

    }else{

      obj.vy *= 0.86;

      obj.vx *= 0.94;
    }

    obj.y += obj.vy * dt;
    obj.x += obj.vx * dt;

    const hitPusher =

      obj.y > 160 &&
      obj.y < 390 &&

      obj.x > pusherX - 18 &&
      obj.x < pusherX + 128;

    if(hitPusher){

      obj.vy += 0.02 * dt;

      obj.y += 0.25 * dt;
    }

    if(obj.x < 40){
      obj.x = 40;
    }

    if(obj.x > canvas.width - 40){
      obj.x = canvas.width - 40;
    }
  }

  for(let i=0;i<objects.length;i++){

    for(let j=i+1;j<objects.length;j++){

      pushApart(
        objects[i],
        objects[j]
      );
    }
  }

  for(let i=objects.length-1;i>=0;i--){

    const obj = objects[i];

    if(obj.y > GET_LINE){

      score++;

      updateHud();

      objects.splice(i,1);

      if(score % 10 === 0){

        messageEl.textContent =
          "残響RUSH";

      }else{

        messageEl.textContent =
          "GET...";
      }
    }
  }
}

function pushApart(a,b){

  const dx = a.x - b.x;
  const dy = a.y - b.y;

  const dist = Math.sqrt(
    dx*dx + dy*dy
  );

  const min = a.r + b.r;

  if(dist > 0 && dist < min){

    const force =
      (min - dist) * 0.03;

    const nx = dx / dist;
    const ny = dy / dist;

    a.vx += nx * force;
    b.vx -= nx * force;

    a.vy += ny * force * 2;
    b.vy -= ny * force * 2;
  }
}

function draw(){

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawBackground();
  drawMachine();
  drawPusher();

  const sorted =
    [...objects].sort(
      (a,b)=>a.y-b.y
    );

  for(const obj of sorted){

    drawMedal(obj);
  }
}

function drawBackground(){

  const grad =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.height
    );

  grad.addColorStop(0,"#ffb36b");
  grad.addColorStop(0.45,"#d67b88");
  grad.addColorStop(1,"#4f455d");

  ctx.fillStyle = grad;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle = "#ffdd99";

  ctx.beginPath();

  ctx.arc(
    180,
    100,
    34,
    0,
    Math.PI*2
  );

  ctx.fill();
}

function drawMachine(){

  ctx.fillStyle = "#2c2438";

  ctx.fillRect(
    35,
    120,
    290,
    330
  );

  ctx.strokeStyle = "#f2c078";

  ctx.lineWidth = 4;

  ctx.strokeRect(
    35,
    120,
    290,
    330
  );

  ctx.fillStyle = "#453a55";

  ctx.fillRect(
    50,
    TABLE_TOP,
    260,
    190
  );

  ctx.strokeRect(
    50,
    TABLE_TOP,
    260,
    190
  );

  ctx.fillStyle = "#6d5669";

  ctx.fillRect(
    35,
    390,
    290,
    60
  );

  ctx.fillStyle = "#ffd9a1";

  ctx.font = "18px DotGothic16";

  ctx.textAlign = "center";

  ctx.fillText(
    "GET ZONE",
    180,
    425
  );
}

function drawPusher(){

  ctx.fillStyle = "#b84d5d";

  ctx.fillRect(
    pusherX,
    160,
    110,
    34
  );

  ctx.strokeStyle = "#f2c078";

  ctx.lineWidth = 3;

  ctx.strokeRect(
    pusherX,
    160,
    110,
    34
  );

  ctx.fillStyle = "#fff2d8";

  ctx.font = "14px DotGothic16";

  ctx.textAlign = "center";

  ctx.fillText(
    "PUSH",
    pusherX + 55,
    182
  );
}

function drawMedal(m){

  ctx.fillStyle = "#f5c96d";

  ctx.beginPath();

  ctx.arc(
    m.x,
    m.y,
    m.r,
    0,
    Math.PI*2
  );

  ctx.fill();

  ctx.strokeStyle = "#6d4d1f";

  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.fillStyle = "#6d4d1f";

  ctx.font = "10px DotGothic16";

  ctx.textAlign = "center";

  ctx.fillText(
    "M",
    m.x,
    m.y + 4
  );
}

startBtn.addEventListener(
  "click",
  startGame
);

dropBtn.addEventListener(
  "click",
  dropMedal
);

retryBtn.addEventListener(
  "click",
  startGame
);

backBtn.addEventListener(
  "click",
  ()=>{

    running = false;

    clearInterval(timer);

    cancelAnimationFrame(animationId);

    showScreen(titleScreen);
  }
);

homeBtn.addEventListener(
  "click",
  ()=>{

    location.href = HOME_URL;
  }
);

shareBtn.addEventListener(
  "click",
  ()=>{

    const text =
`夕暮れメダルで ${score}枚 GET…

誰もいないゲームコーナーで、
今日もメダルを落とす。

${GAME_URL}

#夕暮れメダル
#カバゲーセン`;

    const url =
      "https://twitter.com/intent/tweet?text="
      + encodeURIComponent(text);

    window.open(
      url,
      "_blank"
    );
  }
);