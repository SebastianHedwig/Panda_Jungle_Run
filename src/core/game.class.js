import { Input } from "../engine/input/input.class.js";
import { Background } from "../engine/rendering/background.class.js";
import { Camera } from "../engine/world/camera.class.js";
import { World } from "./world.class.js";
import { Player } from "../game/entities/player.class.js";
import {
  createLevel1Platforms,
  createLevel1Collectables,
  generateCoinsMixed,
  generateCoinArcs,
  placeHearts,
  placeGuns,
  placeEnemiesMixed,
} from "../game/levels/level1.js";
import { WORLD_WIDTH, GAME_WIDTH, GAME_HEIGHT } from "../config/config.js";
import { loadEnemy1Sprites } from "../game/entities/enemies/enemy1.class.js";
import { loadEnemy2Sprites } from "../game/entities/enemies/enemy2.class.js";
import { loadEnemy3Sprites } from "../game/entities/enemies/enemy3.class.js";
import { Boss, loadBossSprites } from "../game/entities/enemies/boss.class.js";
import { GameAudio } from "../game/audio/gameAudio.class.js";
import { BossAudio } from "../game/audio/bossAudio.class.js";

let canvas, ctx;
let background, camera, player, input, world;
let lastTime = 0;
let audio;
let isLoading = true;
let loadingAnimTime = 0;
let musicReadyPromise;
let bossSprites;
let bossSpawned = false;
let bossRef = null;
let bossAudioPlayer = null;
const BOSS_SPAWN_TRIGGER_X = WORLD_WIDTH - 2500;
const BOSS_GROUND_OFFSET = 20;
const BOSS_SPAWN_CLEARANCE = 20;
const BOSS_MOVE_MIN_X = 8500;
const BOSS_MOVE_MAX_X = 9950;
const BOSS_SPAWN_SHAKE_DURATION = 0.5;
const BOSS_SPAWN_SHAKE_MAGNITUDE = 8;

/** HUD */
let hudCoinImg;
let hudDisplayValue = 0;
let hudGunImg;
let heartPulseTime = 0;

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
  audio = new GameAudio();
  musicReadyPromise = audio.init().then(() => audio.play());
  requestAnimationFrame(renderLoading);

  const bgImages = [
    loadImage(
      "./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-1.png"
    ),
    loadImage(
      "./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-2.png"
    ),
    loadImage(
      "./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-3.png"
    ),
    loadImage(
      "./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-4.png"
    ),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-2.png"),
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

  const idle = loadFrames(
    "./assets/img/Character/Character_Sprites/idle/",
    "Idle",
    10
  );
  const walk = loadFrames(
    "./assets/img/Character/Character_Sprites/walk/",
    "walk",
    10
  );
  const run = loadFrames(
    "./assets/img/Character/Character_Sprites/run/",
    "Run",
    8
  );
  const jump = loadFrames(
    "./assets/img/Character/Character_Sprites/jump/",
    "Jump",
    5
  );
  const slide = loadFrames(
    "./assets/img/Character/Character_Sprites/slide/",
    "Sliding",
    4
  );
  const attack = loadFrames(
    "./assets/img/Character/Character_Sprites/throw/",
    "Throw_Attack",
    5
  );
  const shoot = loadFrames(
    "./assets/img/Character/Character_Sprites/shoot/",
    "Shoot",
    6
  );
  const dizzy = loadFrames(
    "./assets/img/Character/Character_Sprites/dizzy/",
    "Dizzy",
    3
  );
  const hurt = loadFrames(
    "./assets/img/Character/Character_Sprites/hurt/",
    "hurt",
    2
  );
  const die = loadFrames(
    "./assets/img/Character/Character_Sprites/die/",
    "Die",
    10
  );
  const hitStars = loadFrames(
    "./assets/img/Character/Spriter_files/",
    "Star",
    3
  );
  const enemy1Sprites = loadEnemy1Sprites();
  const enemy2Sprites = loadEnemy2Sprites();
  const enemy3Sprites = loadEnemy3Sprites();
  bossSprites = loadBossSprites();

  hudCoinImg = loadImage("./assets/img/Coin/Coin_0000000.png");
  hudGunImg = loadImage("./assets/img/Character/Spriter_files/gun.png");

  const assets = [
    ...bgImages,
    ...Object.values(platformSprites),
    ...idle,
    ...walk,
    ...run,
    ...jump,
    ...slide,
    ...attack,
    ...shoot,
    ...dizzy,
    ...hurt,
    ...die,
    ...hitStars,
    ...enemy1Sprites.idle,
    ...enemy1Sprites.walk,
    ...enemy1Sprites.attack,
    ...enemy1Sprites.die,
    ...enemy2Sprites.idle,
    ...enemy2Sprites.run,
    ...enemy2Sprites.attack1,
    ...enemy2Sprites.attack2,
    ...enemy2Sprites.die,
    ...enemy3Sprites.idle,
    ...enemy3Sprites.run,
    ...enemy3Sprites.attack1,
    ...enemy3Sprites.attack2,
    ...enemy3Sprites.slide,
    ...enemy3Sprites.die,
    ...bossSprites.idle,
    ...bossSprites.walk,
    ...bossSprites.run,
    ...bossSprites.attack1,
    ...bossSprites.attack2,
    ...bossSprites.hurt,
    ...bossSprites.die,
    ...bossSprites.jump,
    hudGunImg,
  ];

  const assetsReady = Promise.allSettled(assets.map(waitForImage));

  Promise.all([assetsReady, musicReadyPromise]).then(() =>
    start(
      bgImages,
      platformSprites,
      idle,
      walk,
      run,
      jump,
      slide,
      attack,
      shoot,
      dizzy,
      enemy1Sprites,
      enemy2Sprites,
      enemy3Sprites,
      hurt,
      die,
      hitStars
    )
  );
}

function start(
  bg,
  sprites,
  idle,
  walk,
  run,
  jump,
  slide,
  attack,
  shoot,
  dizzy,
  enemy1Sprites,
  enemy2Sprites,
  enemy3Sprites,
  hurt,
  die,
  hitStars
) {
  const [bg1, bg2, bg3, bg4, cloud1, cloud2] = bg;

  background.addLayer(bg1, 0.1, 0.01);
  background.spawnClouds(cloud1, cloud2);
  background.addLayer(bg2, 0.3, 0.03);
  background.addLayer(bg3, 0.6, 0.06);
  background.addLayer(bg4, 1.0, 0.1);

  const platforms = createLevel1Platforms(sprites);
  world.addPlatforms(platforms);
  world.camera = camera;

  const collectables = [
    ...createLevel1Collectables(),
    ...generateCoinsMixed(world, 30, 0.5),
    ...generateCoinArcs(world, 6),
  ];
  world.addCollectables(collectables);
  placeHearts(world);
  placeGuns(world);
  placeEnemiesMixed(world, enemy1Sprites, enemy2Sprites, enemy3Sprites, 5, 5, 2);

  const spawnX = 25;
  const groundTop = world.baseGround ?? canvas.height;
  const spawnY = Math.min(canvas.height * 0.5, groundTop - 200);

  player = new Player(
    spawnX,
    spawnY,
    idle,
    walk,
    run,
    jump,
    slide,
    attack,
    shoot,
    dizzy,
    hurt,
    die
  );
  player.world = world;
  world.setHitEffectFrames(hitStars);
  world.hudPopups = [];
  audio?.play();
  isLoading = false;
  bossSpawned = false;

  requestAnimationFrame(loop);
}

/** LOOP */
function loop(t) {
  if (!lastTime) lastTime = t;
  const dt = Math.min((t - lastTime) / 1000, 0.05);
  lastTime = t;

  update(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(loop);
}

/** UPDATE */
function update(dt) {
  if (!bossSpawned && player.x >= BOSS_SPAWN_TRIGGER_X) {
    const minX = BOSS_MOVE_MIN_X;
    const maxX = BOSS_MOVE_MAX_X;
    const desiredSpawn = player.x + 1500;
    const bossWidth = 240;
    const spawnX = Math.min(
      Math.max(desiredSpawn, minX),
      maxX - bossWidth
    );
    const bossHeight = 240;
    const platform = world.platforms?.find(
      (p) =>
        p.supportsLanding &&
        spawnX >= p.left &&
        spawnX <= p.right
    );
    const groundTop = platform?.top ?? world.baseGround ?? canvas.height;
    const spawnY = Math.max(
      0,
      groundTop - bossHeight - BOSS_SPAWN_CLEARANCE + BOSS_GROUND_OFFSET
    );
    const boss = new Boss(spawnX, spawnY, bossSprites, world);
    boss.movementMinX = minX;
    boss.movementMaxX = maxX;
    world.addEnemies([boss]);
    bossRef = boss;
    bossSpawned = true;
    audio?.stop?.();
    bossAudioPlayer = new BossAudio();
    bossAudioPlayer.play();
    camera?.shake?.(BOSS_SPAWN_SHAKE_DURATION, BOSS_SPAWN_SHAKE_MAGNITUDE);
  }

  player.update(dt, input);
  camera.follow(player, 0.08, dt);
  background.update(camera.x, camera.y, dt);

  world.applyPlatformCollisions(player);
  world.collectables.forEach((c) => c.update(dt));
  world.updateEnemies(dt, player);
  world.updateProjectiles(dt, world.enemies ?? []);
  world.updateHitEffects(dt);

  if (bossRef?.remove || (bossRef && bossRef.isDead && bossRef.health <= 0)) {
    bossAudioPlayer?.stop?.();
    bossAudioPlayer = null;
    bossRef = null;
  }

  checkCollectables();

  hudDisplayValue += (player.coins - hudDisplayValue) * dt * 10;

  if (player.hudPulse > 0)
    player.hudPulse = Math.max(0, player.hudPulse - dt * 4);
  heartPulseTime += dt;
  if (player.healthPulse > 0) {
    player.healthPulse = Math.max(0, player.healthPulse - dt * 2);
  }

  world.hudPopups = world.hudPopups.filter((p) => {
    p.update(dt);
    return p.alpha > 0;
  });
}

/** COLLECT */
function checkCollectables() {
  world.collectables = world.collectables.filter((c) => {
    if (!c.collected && c.isColliding(player)) {
      c.collect(player);
      return true;
    }
    return !c.pickupAnimating || c.alpha > 0;
  });
}

/** DRAW */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  background.render(ctx, camera);
  world.platforms.forEach((p) => p.render(ctx, camera));
  world.collectables.forEach((c) => c.draw(ctx, camera));
  world.hudPopups.forEach((p) => p.draw(ctx, camera));
  world.renderProjectiles(ctx, camera);
  world.renderEnemies(ctx, camera);
  player.render(ctx, camera);
  world.renderHitEffects(ctx, camera);

  drawHUD();
  drawBossIndicator();
}

/** HUD */
function drawHUD() {
  drawHearts();
  drawCoins();
  drawBullets();
}

function drawBossIndicator() {
  if (!bossRef || bossRef.remove || (bossRef.isDead && bossRef.health <= 0)) {
    return;
  }

  const margin = 16;
  const centerX = bossRef.x + bossRef.width / 2 - camera.x;
  const topY = bossRef.y - camera.y;
  const barW = bossRef.width * 0.8;
  const barH = 12;

  let drawX = centerX;
  let drawY = topY - 30;

  const offLeft = drawX < margin;
  const offRight = drawX > canvas.width - margin;
  const offTop = drawY < margin;
  const offBottom = drawY > canvas.height - margin;
  const isOffscreen = offLeft || offRight || offTop || offBottom;

  if (offLeft) drawX = margin;
  if (offRight) drawX = canvas.width - margin;
  if (offTop) drawY = margin;
  if (offBottom) drawY = canvas.height - margin;

  const barX = drawX - barW / 2;
  const barY = drawY;
  const ratio = Math.max(0, Math.min(1, bossRef.health / bossRef.maxHealth));

  ctx.save();
  if (!isOffscreen) {
    ctx.restore();
    return;
  }

  if (isOffscreen) {
    const arrowSize = 20;
    const arrowY = barY + barH + 9.2;
    const textY = arrowY;
    const arrowColor = "rgba(235, 145, 0, 1)";
    ctx.fillStyle = arrowColor;

    if (offLeft || offRight) {
      const arrowX = offLeft ? margin : canvas.width - margin;
      const textX = offLeft ? arrowX + arrowSize + 16 : arrowX - arrowSize - 16;
      const angle = offLeft ? Math.PI : 0;

      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-arrowSize, -arrowSize / 1.5);
      ctx.lineTo(-arrowSize, arrowSize / 1.5);
      ctx.lineTo(arrowSize, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,2,0.9)";
      ctx.font = "1rem ComixLoud, sans-serif";
      ctx.textAlign = offLeft ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillText("LUPO", textX, textY);
    } else {
      const angle = offTop ? -Math.PI / 2 : Math.PI / 2;
      ctx.save();
      ctx.translate(drawX, arrowY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-arrowSize, -arrowSize / 1.5);
      ctx.lineTo(-arrowSize, arrowSize / 1.5);
      ctx.lineTo(arrowSize, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,2,0.9)";
      ctx.font = "1rem ComixLoud, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("LUPO", drawX, textY);
    }
  }

  ctx.restore();
}

/** HEARTS */
function drawHearts() {
  const size = 32;
  const startX = 30;
  const y = 5;
  const spacing = 10;
  const states = player.heartStates;
  const lastFilled = [...states]
    .map((s, i) => ({ s, i }))
    .filter((h) => h.s > 0)
    .pop()?.i;

  states.forEach((state, i) => {
    const x = startX + i * (size + spacing);

    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);

    let scale = 1;
    if (i === lastFilled) {
      const baseAmp = 0.07;
      const baseWave = 0.5 + 0.5 * Math.sin(heartPulseTime * 6);
      scale += baseAmp * baseWave;
    }
    if (player.healthPulse > 0) {
      const hitAmp = 0.18 * player.healthPulse;
      const hitWave = 0.5 + 0.5 * Math.sin(heartPulseTime * 14);
      scale += hitAmp * hitWave;
    }
    ctx.scale(scale, scale);

    drawHeartShape(state, size);

    ctx.restore();
  });
}

/** Heart Rendering */
function drawHeartShape(state, size) {
  ctx.beginPath();
  const w = size,
    h = size;

  ctx.moveTo(0, h * 0.35);
  ctx.bezierCurveTo(-w * 0.6, -h * 0.1, -w * 0.6, h * 0.6, 0, h);
  ctx.bezierCurveTo(w * 0.6, h * 0.6, w * 0.6, -h * 0.1, 0, h * 0.35);

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";

  if (state === 2) ctx.fillStyle = "rgba(182, 0, 0, 1)";
  else if (state === 1) ctx.fillStyle = "rgba(192, 69, 69, 0.6)";
  else ctx.fillStyle = "rgba(58, 58, 58, 0.2)";

  ctx.fill();
  ctx.stroke();
}

/** COINS HUD */
function drawCoins() {
  const pad = 20;
  const size = 40;
  const x = canvas.width - size - pad - 80;
  const y = pad;

  ctx.drawImage(hudCoinImg, x, y, size, size);

  const scale = 1 + player.hudPulse * 0.3;
  const text = Math.round(hudDisplayValue).toString();

  ctx.save();
  ctx.translate(x + size + 35, y + 25);
  ctx.scale(scale, scale);

  ctx.font = "1.2rem ComixLoud";
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "rgba(255,255,2,0.9)";
  ctx.lineWidth = 3;
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

/** BULLETS HUD */
function drawBullets() {
  const pad = 20;
  const size = 40;
  const coinSize = 40;
  const coinX = canvas.width - coinSize - pad - 80;
  const coinY = pad;
  const x = coinX - 80 - size;
  const y = coinY;

  ctx.drawImage(hudGunImg, x, y, size, size);

  const scale = 1 + (player.gunPulse || 0) * 0.3;
  const text = Math.max(0, Math.floor(player.bulletAmmo)).toString();

  ctx.save();
  ctx.translate(x + size + 30, y + 25);
  ctx.scale(scale, scale);

  ctx.font = "1.2rem ComixLoud";
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "rgba(235, 145, 0, 1)";
  ctx.lineWidth = 3;
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

/** HELPERS */
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function loadFrames(path, prefix, count) {
  return [...Array(count)].map((_, i) =>
    loadImage(`${path}${prefix}_${String(i).padStart(3, "0")}.png`)
  );
}

function waitForImage(img) {
  return new Promise((resolve) => {
    const finish = (ok) => resolve({ ok, img });
    if (img.complete) {
      finish(img.naturalWidth > 0 && img.naturalHeight > 0);
      return;
    }
    img.onload = () => finish(true);
    img.onerror = () => {
      console.warn("Image failed to load", img?.src || img);
      finish(false);
    };
  });
}

function renderLoading(t) {
  if (!isLoading) return;
  loadingAnimTime = t || 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // dim background
  ctx.fillStyle = "rgba(10, 16, 20, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // spinner
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 40;
  const angle = ((loadingAnimTime / 500) % (Math.PI * 2));
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0, 200, 200, 0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, angle, angle + Math.PI * 1.5);
  ctx.stroke();

  // text
  ctx.fillStyle = "#e5f7ff";
  ctx.font = "32px ComixLoud, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Loading...", cx, cy + 80);

  requestAnimationFrame(renderLoading);
}
