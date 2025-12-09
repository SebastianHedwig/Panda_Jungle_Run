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
      idleFrames,
      walkFrames,
      runFrames,
      jumpFrames,
      slideFrames,
      throwFrames
    );

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
}

/** ---------- CHECK COLLECTABLES ---------- */
function checkCollectables() {
  if (!world.collectables) return;

  world.collectables = world.collectables.filter(item => {
    if (!item.collected && item.isColliding(player)) {
      item.collect(player);
      return false;
    }
    return true;
  });
}

/** ---------- DRAW ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.render(ctx, camera);

  if (world.platforms.length) {
    world.platforms.forEach(p => p.render(ctx, camera));
  }

  /** ----- RENDER COLLECTABLES ----- */
  if (world.collectables.length) {
    world.collectables.forEach(item => item.draw(ctx, camera));
  }

  player.render(ctx, camera);
}


/** ---------- LOAD IMAGE HELPERS ---------- */
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
