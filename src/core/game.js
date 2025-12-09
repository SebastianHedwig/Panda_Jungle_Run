import { Input } from "./input.js";
import { Background } from "../engine/background.class.js";
import { Camera } from "../engine/camera.class.js";
import { World } from "./world.class.js";
import { Player } from "./player.class.js";
import {createLevel1Platforms, createLevel1Collectables, generateCoinsMixed, generateCoinArcs, placeHearts} from "../game/level1.js";
import { WORLD_WIDTH, GAME_WIDTH, GAME_HEIGHT } from "../config.js";

let canvas, ctx;
let background, camera, player, input, world;
let lastTime = 0;

/** HUD */
let hudCoinImg;
let hudDisplayValue = 0;

/** INIT */
export function initGame() {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  input = new Input();
  world = new World(canvas);
  camera = new Camera(canvas, WORLD_WIDTH);
  background = new Background(canvas);

  const bgImages = [
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-2.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-3.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-4.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-2.png")
  ];

  const platformSprites = {
    startLong: loadImage("./assets/img/Platforms/platform-start-long.png"),
    middleLong: loadImage("./assets/img/Platforms/platform-middle-long.png"),
    endLong: loadImage("./assets/img/Platforms/platform-end-long.png"),
    startShort: loadImage("./assets/img/Platforms/platform-start-short.png"),
    middleShort: loadImage("./assets/img/Platforms/platform-middle-short.png"),
    endShort: loadImage("./assets/img/Platforms/platform-end-short.png"),
    small: loadImage("./assets/img/Platforms/platform-small.png"),
    middleHigh: loadImage("./assets/img/Platforms/platform-middle-high.png"),
    filler: loadImage("./assets/img/Platforms/platform-filler.png"),
  };

  const idle = loadFrames("./assets/img/Character/Character_Sprites/idle/","Idle",10);
  const walk = loadFrames("./assets/img/Character/Character_Sprites/walk/","walk",10);
  const run = loadFrames("./assets/img/Character/Character_Sprites/run/","Run",8);
  const jump = loadFrames("./assets/img/Character/Character_Sprites/jump/","Jump",5);
  const slide = loadFrames("./assets/img/Character/Character_Sprites/slide/","Sliding",4);
  const attack = loadFrames("./assets/img/Character/Character_Sprites/throw/","Throw_Attack",5);

  hudCoinImg = loadImage("./assets/img/Coin/Coin_0000000.png");

  Promise.all([
    ...bgImages,
    ...Object.values(platformSprites),
    ...idle, ...walk, ...run, ...jump, ...slide, ...attack
  ].map(waitForImage)).then(() => start(bgImages, platformSprites, idle, walk, run, jump, slide, attack));
}

function start(bg, sprites, idle, walk, run, jump, slide, attack) {
  const [bg1,bg2,bg3,bg4,cloud1,cloud2] = bg;

  background.addLayer(bg1,0.1,0.01);
  background.spawnClouds(cloud1,cloud2);
  background.addLayer(bg2,0.3,0.03);
  background.addLayer(bg3,0.6,0.06);
  background.addLayer(bg4,1.0,0.1);

  const platforms = createLevel1Platforms(sprites);
  world.addPlatforms(platforms);

  const collectables = [
    ...createLevel1Collectables(),
    ...generateCoinsMixed(world,20,0.5),
    ...generateCoinArcs(world,6),
  ];
  world.addCollectables(collectables);
  placeHearts(world);

  const spawnX = 25;
  const groundTop = world.baseGround ?? canvas.height;
  const spawnY = Math.min(canvas.height * .5, groundTop - 200);

  player = new Player(spawnX, spawnY, idle, walk, run, jump, slide, attack);
  player.world = world;
  world.hudPopups = [];

  requestAnimationFrame(loop);
}

/** LOOP */
function loop(t) {
  if (!lastTime) lastTime = t;
  const dt = Math.min((t - lastTime)/1000,0.05);
  lastTime = t;

  update(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(loop);
}

/** UPDATE */
function update(dt) {
  player.update(dt,input);
  camera.follow(player,0.08);
  background.update(camera.x,camera.y,dt);

  world.applyPlatformCollisions(player);
  world.collectables.forEach(c => c.update(dt));

  checkCollectables();

  hudDisplayValue += (player.coins - hudDisplayValue) * dt * 10;

  if (player.hudPulse > 0) player.hudPulse = Math.max(0, player.hudPulse - dt * 4);
  if (player.healthPulse > 0) player.healthPulse = Math.max(0, player.healthPulse - dt * 3);

  world.hudPopups = world.hudPopups.filter(p => { p.update(dt); return p.alpha > 0; });
}

/** COLLECT */
function checkCollectables() {
  world.collectables = world.collectables.filter(c => {
    if (!c.collected && c.isColliding(player)) { c.collect(player); return true; }
    return !c.pickupAnimating || c.alpha > 0;
  });
}

/** DRAW */
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  background.render(ctx,camera);
  world.platforms.forEach(p => p.render(ctx,camera));
  world.collectables.forEach(c => c.draw(ctx,camera));
  world.hudPopups.forEach(p => p.draw(ctx,camera));
  player.render(ctx,camera);

  drawHUD();
}

/** HUD */
function drawHUD() {
  drawHearts();
  drawCoins();
}

/** HEARTS */
function drawHearts() {
  const size = 32;
  const startX = 30;
  const y = 5;
  const spacing = 10;
  const scale = 1 + player.healthPulse * 0.2;

  const states = player.heartStates;

  states.forEach((state,i)=>{
    const x = startX + i*(size+spacing);

    ctx.save();
    ctx.translate(x+size/2, y+size/2);
    ctx.scale(scale, scale);

    drawHeartShape(state,size);

    ctx.restore();
  });
}

/** Heart Rendering */
function drawHeartShape(state, size) {
  ctx.beginPath();
  const w=size,h=size;

  ctx.moveTo(0,h*0.35);
  ctx.bezierCurveTo(-w*0.5,-h*0.1,-w*0.5,h*0.6,0,h);
  ctx.bezierCurveTo(w*0.5,h*0.6,w*0.5,-h*0.1,0,h*0.35);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";

  if (state===2) ctx.fillStyle="#b60000ff";
  else if (state===1) ctx.fillStyle="#c04545ff";
  else ctx.fillStyle="#3a3a3a";

  ctx.fill();
  ctx.stroke();
}

/** COINS HUD */
function drawCoins() {
  const pad = 20;
  const size = 40;
  const x = canvas.width - size - pad - 80;
  const y = pad;

  ctx.drawImage(hudCoinImg,x,y,size,size);

  const scale = 1 + player.hudPulse * .3;
  const text = Math.round(hudDisplayValue).toString();

  ctx.save();
  ctx.translate(x+size+10,y+30);
  ctx.scale(scale,scale);

  ctx.font="1.2rem ComixLoud";
  ctx.strokeStyle="#000";
  ctx.fillStyle="rgba(255,255,2,.9)";
  ctx.lineWidth=3;
  ctx.strokeText(text,0,0);
  ctx.fillText(text,0,0);

  ctx.restore();
}

/** HELPERS */
function loadImage(src) { const img=new Image(); img.src=src; return img; }
function loadFrames(path,prefix,count) {
  return [...Array(count)].map((_,i)=>loadImage(`${path}${prefix}_${String(i).padStart(3,"0")}.png`));
}
function waitForImage(img){
  return img.decode ? img.decode().catch(()=>new Promise(r=>img.onload=r))
                    : new Promise(r=>img.onload=r);
}
