function setAppHeight(){

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

const bgm =
  document.getElementById("bgm");

const seFall =
  document.getElementById("seFall");

const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");

const HOME_URL =
  "https://afoolhippo.github.io/home/?skipTitle=1";

const GAME_URL =
  "https://afoolhippo.github.io/game17/";

const TABLE_TOP = 198;
const GET_LINE = 398;

const PUSHER_Y = 160;
const PUSHER_H = 34;
const PUSHER_W = 110;

const MEDAL_R = 15;

let objects = [];
let popups = [];

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
  popups = [];

  score = 0;
  timeLeft = 60;

  pusherX = 60;
  pusherDir = 1;

  updateHud();

  // 最初からかなり前まで詰める
  for(let i=0;i<38;i++){

    objects.push({

      x:60 + Math.random()*240,

      y:TABLE_TOP + 8 + Math.random()*170,

      r:MEDAL_R,

      vx:0,
      vy:0
    });
  }
}

function startGame(){

  resetGame();

  showScreen(gameScreen);

  running = true;

  bgm.volume = 0.45;
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

  },1000);

  cancelAnimationFrame(animationId);

  animationId =
    requestAnimationFrame(loop);
}

function endGame(){

  running = false;

  clearInterval(timer);

  cancelAnimationFrame(animationId);

  bgm.pause();

  let rank = "夕暮れ部員";
  let comment =
    "今日もメダルを落とした。";

  if(score >= 55){

    rank = "夕暮れJACKPOT";

    comment =
    "夕焼けが終わるまで、ずっとメダルを見ていた。";

  }else if(score >= 35){

    rank = "残響RUSH";

    comment =
    "チャリン…という音だけが残った。";

  }else if(score >= 20){

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
  },140);

  objects.push({

    x:90 + Math.random()*180,

    y:38,

    r:MEDAL_R,

    vx:(Math.random()-0.5)*0.4,

    vy:0
  });
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

  pusherX += pusherDir * 1.5 * dt;

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

    obj.vy *= 0.93;
    obj.vx *= 0.95;

    const pusherFront =
      PUSHER_Y + PUSHER_H;

    const hitPusher =

      obj.y > pusherFront - 6 &&
      obj.y < pusherFront + 24 &&

      obj.x > pusherX - 14 &&
      obj.x < pusherX + PUSHER_W + 14;

    if(hitPusher){

      obj.y += 1.1 * dt;

      obj.vy += 0.06 * dt;
    }

    if(obj.x < 42){
      obj.x = 42;
    }

    if(obj.x > canvas.width - 42){
      obj.x = canvas.width - 42;
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

      playFall();

      popups.push({

        text:
          score % 10 === 0
          ? "残響RUSH"
          : "GET!",

        x:180,
        y:310,

        life:42
      });

      objects.splice(i,1);
    }
  }

  for(let i=popups.length-1;i>=0;i--){

    const p = popups[i];

    p.life--;

    p.y -= 0.4;

    if(p.life <= 0){
      popups.splice(i,1);
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
      (min - dist) * 0.04;

    const nx = dx / dist;
    const ny = dy / dist;

    a.vx += nx * force;
    b.vx -= nx * force;

    a.vy += ny * force * 2.2;
    b.vy -= ny * force * 2.2;
  }
}

function playFall(){

  seFall.currentTime = 0;
  seFall.volume = 0.6;
  seFall.play();
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

  drawPopups();
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
    "12px DotGothic16";

  ctx.textAlign = "center";

  ctx.fillText(
    "M",
    m.x,
    m.y + 4
  );
}

function drawPopups(){

  for(const p of popups){

    ctx.save();

    ctx.globalAlpha =
      p.life / 42;

    ctx.fillStyle = "#fff4d0";

    ctx.strokeStyle = "#402d2f";

    ctx.lineWidth = 4;

    ctx.font =
      p.text === "GET!"
      ? "30px DotGothic16"
      : "38px DotGothic16";

    ctx.textAlign = "center";

    ctx.strokeText(
      p.text,
      p.x,
      p.y
    );

    ctx.fillText(
      p.text,
      p.x,
      p.y
    );

    ctx.restore();
  }
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

    bgm.pause();

    showScreen(titleScreen);
  }
);

retryBtn.addEventListener(
  "click",
  ()=>{

    running = false;

    clearInterval(timer);

    cancelAnimationFrame(animationId);

    bgm.pause();

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