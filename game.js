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

const MEDAL_R = 15;

const TABLE_TOP = 175;
const TABLE_BOTTOM = 390;
const GET_LINE = 404;

let medals = [];
let popups = [];

let score = 0;
let timeLeft = 60;

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
  timeLeft = 60;

  pusherDepth = 0;
  pusherForward = true;

  updateHud();

  // 最初からかなり積む
  for(let i=0;i<44;i++){

    medals.push({

      x:60 + Math.random()*240,

      y:TABLE_TOP + 20 + Math.random()*160,

      z:Math.random()*2,

      vx:0,
      vy:0,

      r:MEDAL_R
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
  },130);

  medals.push({

    x:90 + Math.random()*180,

    y:42,

    z:0,

    vx:(Math.random()-0.5)*0.5,
    vy:0,

    r:MEDAL_R
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

  // プッシャー前後運動
  if(pusherForward){

    pusherDepth += 0.018 * dt;

    if(pusherDepth >= 1){

      pusherDepth = 1;

      pusherForward = false;
    }

  }else{

    pusherDepth -= 0.013 * dt;

    if(pusherDepth <= 0){

      pusherDepth = 0;

      pusherForward = true;
    }
  }

  const pushStrength =
    pusherForward
    ? pusherDepth
    : 0;

  for(const m of medals){

    if(m.y < TABLE_TOP){

      m.vy += 0.12 * dt;
    }

    m.y += m.vy * dt;
    m.x += m.vx * dt;

    m.vx *= 0.96;
    m.vy *= 0.94;

    // 積み重なり感
    if(m.y > TABLE_TOP){

      m.z += 0.003 * dt;

      if(m.z > 3){
        m.z = 3;
      }
    }

    // 奥→手前に押す
    const pushZoneTop =
      TABLE_TOP + 10;

    const pushZoneBottom =
      TABLE_TOP + 82;

    if(
      m.y > pushZoneTop &&
      m.y < pushZoneBottom
    ){

      m.vy +=
        pushStrength * 0.06 * dt;
    }

    if(m.x < 42){
      m.x = 42;
    }

    if(m.x > canvas.width - 42){
      m.x = canvas.width - 42;
    }
  }

  // メダル同士押し合い
  for(let i=0;i<medals.length;i++){

    for(let j=i+1;j<medals.length;j++){

      pushApart(
        medals[i],
        medals[j]
      );
    }
  }

  // GET
  for(let i=medals.length-1;i>=0;i--){

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

      medals.splice(i,1);
    }
  }

  // popup
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
      (min - dist) * 0.05;

    const nx = dx / dist;
    const ny = dy / dist;

    a.vx += nx * force;
    b.vx -= nx * force;

    a.vy += ny * force * 2.4;
    b.vy -= ny * force * 2.4;

    // 前列を押し出す
    if(a.y < b.y){

      b.vy += 0.03;

    }else{

      a.vy += 0.03;
    }
  }
}

function addPopup(text){

  popups.push({

    text:text,

    x:180,
    y:300,

    life:42
  });
}

function playFall(){

  const now = performance.now();

  if(now - lastFallSeTime < 220){
    return;
  }

  lastFallSeTime = now;

  seFall.currentTime = 0;
  seFall.volume = 0.35;

  seFall.play().catch(()=>{});
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
    [...medals].sort(
      (a,b)=>
      (a.y+a.z*4) - (b.y+b.z*4)
    );

  for(const m of sorted){

    drawMedal(m);
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

  const y =
    148 + pusherDepth * 28;

  ctx.fillStyle = "#b84d5d";

  ctx.fillRect(
    60,
    y,
    240,
    30
  );

  ctx.strokeStyle = "#f0c078";

  ctx.lineWidth = 3;

  ctx.strokeRect(
    60,
    y,
    240,
    30
  );

  ctx.fillStyle = "#fff2d8";

  ctx.font =
    "14px DotGothic16";

  ctx.textAlign = "center";

  ctx.fillText(
    "PUSH",
    180,
    y + 20
  );
}

function drawMedal(m){

  const drawY =
    m.y - m.z * 4;

  ctx.fillStyle = "#f5c96d";

  ctx.beginPath();

  ctx.arc(
    m.x,
    drawY,
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
    drawY + 4
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
      p.text === "残響RUSH"
      ? "38px DotGothic16"
      : "30px DotGothic16";

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