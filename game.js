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

window.addEventListener(
  "resize",
  setAppHeight
);

if(window.visualViewport){

  window.visualViewport.addEventListener(
    "resize",
    setAppHeight
  );
}

const titleScreen =
  document.getElementById("titleScreen");

const gameScreen =
  document.getElementById("gameScreen");

const resultScreen =
  document.getElementById("resultScreen");

const titleVisual =
  document.querySelector(".titleVisual");

const startBtn =
  document.getElementById("startBtn");

const backBtn =
  document.getElementById("backBtn");

const dropBtn =
  document.getElementById("dropBtn");

const scoreEl =
  document.getElementById("scoreEl");

const timeEl =
  document.getElementById("timeEl");

const messageEl =
  document.getElementById("messageEl");

const rankEl =
  document.getElementById("rankEl");

const resultScoreEl =
  document.getElementById("resultScoreEl");

const resultCommentEl =
  document.getElementById("resultCommentEl");

const retryBtn =
  document.getElementById("retryBtn");

const shareBtn =
  document.getElementById("shareBtn");

const homeBtn =
  document.getElementById("homeBtn");

const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");

const HOME_URL =
  "https://afoolhippo.github.io/home/?skipTitle=1";

const GAME_URL =
  "https://afoolhippo.github.io/game17/";

const TABLE_TOP = 196;
const GET_LINE = 412;

const PUSHER_Y = 160;
const PUSHER_H = 34;
const PUSHER_W = 110;

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

  objects = [];

  score = 0;
  timeLeft = 60;

  pusherX = 60;
  pusherDir = 1;

  updateHud();

  // 最初からひたひた
  for(let i=0;i<46;i++){

    objects.push({

      x:58 + Math.random()*244,

      y:TABLE_TOP + 4 + Math.random()*175,

      r:10,

      vx:0,
      vy:0
    });
  }

  messageEl.textContent = "…";
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

  animationId =
    requestAnimationFrame(loop);
}

function endGame(){

  running = false;

  clearInterval(timer);

  cancelAnimationFrame(animationId);

  let rank = "夕暮れ部員";
  let comment =
    "今日もメダルを落とした。";

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
    }

    obj.y += obj.vy * dt;
    obj.x += obj.vx * dt;

    obj.vy *= 0.92;
    obj.vx *= 0.95;

    // 実際に近いメダルだけ押す
    const pusherFront =
      PUSHER_Y + PUSHER_H;

    const hitPusher =

      obj.y > pusherFront - 4 &&
      obj.y < pusherFront + 22 &&

      obj.x > pusherX - 14 &&
      obj.x < pusherX + PUSHER_W + 14;

    if(hitPusher){

      obj.y += 0.55 * dt;

      obj.vy += 0.035 * dt;
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

  const dist =
    Math.sqrt(dx*dx + dy*dy);

  const min =
    a.r + b.r;

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
  grad.addColorStop(1,"#524864");

  ctx.fillStyle = grad;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // 太陽
  ctx.fillStyle = "#ffdd99";

  ctx.beginPath();

  ctx.arc(
    180,
    92,
    34,
    0,
    Math.PI*2
  );

  ctx.fill();
}

function drawMachine(){

  ctx.fillStyle = "#2d2538";

  ctx.fillRect(
    35,
    120,
    290,
    330
  );

  ctx.strokeStyle = "#f0c078";

  ctx.lineWidth = 4;

  ctx.strokeRect(
    35,
    120,
    290,
    330
  );

  ctx.fillStyle = "#4a3e58";

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

  ctx.font =
    "18px DotGothic16";

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
    PUSHER_Y,
    PUSHER_W,
    PUSHER_H
  );

  ctx.strokeStyle = "#f0c078";

  ctx.lineWidth = 3;

  ctx.strokeRect(
    pusherX,
    PUSHER_Y,
    PUSHER_W,
    PUSHER_H
  );

  ctx.fillStyle = "#fff2d8";

  ctx.font =
    "14px DotGothic16";

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

  ctx.font =
    "10px DotGothic16";

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

if(titleVisual){

  titleVisual.addEventListener(
    "click",
    startGame
  );
}

dropBtn.addEventListener(
  "click",
  dropMedal
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

retryBtn.addEventListener(
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

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }
);