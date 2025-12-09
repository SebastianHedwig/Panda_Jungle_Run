import { Input } from "./input.js";
import { Background } from "../engine/background.class.js";
import { Camera } from "../engine/camera.class.js";
import { World } from "./world.class.js";
import { Player } from "./player.class.js";
import { createLevel1Platforms, createLevel1Collectables, generateCoinsMixed, generateCoinArcs } from "../game/level1.js";
import { WORLD_WIDTH, GAME_WIDTH, GAME_HEIGHT } from "../config.js";

let canvas, ctx;
let background, camera, player, input, world;
let lastTime = 0;

/** ---------- HUD ---------- */
let hudCoinImg;          // icon image
let hudDisplayValue = 0; // smooth animated HUD value


/** ---------- INIT GAME ---------- */
export function initGame() {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width = `${GAME_WIDTH}px`;
  canvas.style.height = `${GAME_HEIGHT}px`;

  input = new Input();
  world = new World(canvas);
  camera = new Camera(canvas, WORLD_WIDTH);
  background = new Background(canvas);

  /** ---------- LOAD ASSETS ---------- */
  const bgImages = [
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-2.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-3.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-4.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-2.png")
  ];

  /** ---------- PLATFORM SPRITES ---------- */
  const platformSprites = {
    startLong:   loadImage("./assets/img/Platforms/platform-start-long.png"),
    middleLong:  loadImage("./assets/img/Platforms/platform-middle-long.png"),
    endLong:     loadImage("./assets/img/Platforms/platform-end-long.png"),
    startShort:  loadImage("./assets/img/Platforms/platform-start-short.png"),
    middleShort: loadImage("./assets/img/Platforms/platform-middle-short.png"),
    endShort:    loadImage("./assets/img/Platforms/platform-end-short.png"),
    small:       loadImage("./assets/img/Platforms/platform-small.png"),
    middleHigh:  loadImage("./assets/img/Platforms/platform-middle-high.png"),
    filler:      loadImage("./assets/img/Platforms/platform-filler.png"),
  };

  const platformImages = Object.values(platformSprites);

  /** ---------- PLAYER FRAMES ---------- */
  const idleFrames  = loadFrames("./assets/img/Character/Character_Sprites/idle/",  "Idle",  10);
  const walkFrames  = loadFrames("./assets/img/Character/Character_Sprites/walk/",  "walk",  10);
  const runFrames   = loadFrames("./assets/img/Character/Character_Sprites/run/",   "Run",   8);
  const jumpFrames  = loadFrames("./assets/img/Character/Character_Sprites/jump/",  "Jump",  5);
  const slideFrames = loadFrames("./assets/img/Character/Character_Sprites/slide/", "Sliding", 4);
  const throwFrames = loadFrames("./assets/img/Character/Character_Sprites/throw/","Throw_Attack", 5);

  /** ---------- HUD COIN IMAGE ---------- */
  hudCoinImg = loadImage("./assets/img/Coin/Coin_0000000.png");

  /** ---------- LOAD EVERYTHING ---------- */
  Promise.all([
    ...bgImages,
    ...platformImages,
    ...idleFrames,
    ...walkFrames,
    ...runFrames,
    ...jumpFrames,
    ...slideFrames,
    ...throwFrames,
  ].map(waitForImage))
  .then(() => {
    const [bg1, bg2, bg3, bg4, cloud1, cloud2] = bgImages;

    /** ----- BACKGROUND LAYERS ----- */
    background.addLayer(bg1, 0.1, 0.01);
    background.spawnClouds(cloud1, cloud2);
    background.addLayer(bg2, 0.3, 0.03);
    background.addLayer(bg3, 0.6, 0.06);
    background.addLayer(bg4, 1.0, 0.1);

    /** ----- PLATFORMS ----- */
    const platforms = createLevel1Platforms(platformSprites);
    world.addPlatforms(platforms);

    /** ----- COLLECTABLES ----- */
    const collectables = [
      ...createLevel1Collectables(),
      ...generateCoinsMixed(world, 20, 0.5),
      ...generateCoinArcs(world, 6),
    ];
    world.addCollectables(collectables);

    /** ----- PLAYER ----- */
    const spawnX = 25;
    const groundTop = Number.isFinite(world.baseGround) ? world.baseGround : canvas.height;
    const spawnY = Math.min(canvas.height * 0.5, groundTop - 200);

    player = new Player(
      spawnX, Math.max(0, spawnY),
      idleFrames, walkFrames, runFrames, jumpFrames, slideFrames, throwFrames
    );
    player.coins = 0;
    player.world = world;


    requestAnimationFrame(loop);
  });
}


/** ---------- GAME LOOP ---------- */
function loop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
    requestAnimationFrame(loop);
    return;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  draw();
  input.endFrame();

  requestAnimationFrame(loop);
}


/** ---------- UPDATE ---------- */
function update(dt) {
  player.update(dt, input);
  camera.follow(player, 0.08);
  background.update(camera.x, camera.y, dt);

  world.playerSpeed = Math.abs(player.vx);
  world.applyPlatformCollisions(player);
  world.collectables.forEach(c => c.update(dt));
  checkCollectables();

  /** Smooth HUD coin animation */
  hudDisplayValue += (player.coins - hudDisplayValue) * dt * 10;

  // HUD Bounce Animation
  if (player.hudPulse > 0) {
    player.hudPulse -= dt * 4; // Geschwindigkeit des Zurückschnurrens
  if (player.hudPulse < 0) player.hudPulse = 0;
  }; 

  world.hudPopups = world.hudPopups.filter(p => {
    p.update(dt);
    return p.alpha > 0;
  });

}


/** ---------- CHECK COLLECTABLES ---------- */
function checkCollectables() {
  world.collectables = world.collectables.filter(item => {
    if (!item.collected && item.isColliding(player)) {
      item.collect(player);
      return true;
    }
    return !item.pickupAnimating || item.alpha > 0;
  });
}


/** ---------- DRAW ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  background.render(ctx, camera);
  world.platforms.forEach(p => p.render(ctx, camera));
  world.collectables.forEach(c => c.draw(ctx, camera));
  world.hudPopups.forEach(p => p.draw(ctx, camera));

  player.render(ctx, camera);
  drawHUD();
}


/** ---------- DRAW HUD (Canvas-Based) ---------- */
function drawHUD() {
  const padding = 20;
  const iconSize = 40;

  const baseX = canvas.width - iconSize - padding - 80;
  const baseY = padding;

  ctx.drawImage(
    hudCoinImg,
    baseX,
    baseY,
    iconSize,
    iconSize
  );

  const bounceScale = 1 + (player.hudPulse || 0) * 0.3;

  ctx.save();
  ctx.translate(baseX + iconSize + 10, baseY + 28);
  ctx.scale(bounceScale, bounceScale);
  ctx.font = "1.2rem ComixLoud";
  ctx.fillStyle = "rgba(255, 255, 2, 0.9)";
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";

  const text = Math.round(hudDisplayValue).toString();
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** ---------- HELPERS ---------- */
export function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function loadFrames(path, prefix, count) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const img = new Image();
    img.src = `${path}${prefix}_${String(i).padStart(3, "0")}.png`;
    frames.push(img);
  }
  return frames;
}

function waitForImage(img) {
  if (img.decode) {
    return img.decode().catch(() => new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    }));
  }
  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });
}
