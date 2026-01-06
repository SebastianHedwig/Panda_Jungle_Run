import { Input } from "../../engine/input/input.class.js";
import { Background } from "../../engine/rendering/background.class.js";
import { Camera } from "../../engine/world/camera.class.js";
import { World } from "../world.class.js";
import { Player } from "../../game/entities/player/player.class.js";
import {
  createLevel1Platforms,
  createLevel1Collectables,
  generateCoinsMixed,
  generateCoinArcs,
  placeHearts,
  placeGuns,
  placeEnemiesMixed,
} from "../../game/levels/level1.js";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  LEVEL1_COIN_COUNT,
  LEVEL1_COIN_RATIO_ABOVE,
  LEVEL1_ENEMY1_COUNT,
  LEVEL1_ENEMY2_COUNT,
  LEVEL1_ENEMY3_COUNT,
  LEVEL1_GUN_COUNT,
  LEVEL1_HEART_COUNT,
  WORLD_WIDTH,
} from "../../config/config.js";
import { waitForImage } from "../assets/assetLoader.js";
import { GameAudio } from "../../game/audio/gameAudio.class.js";
import { Hud } from "../../game/ui/hud.class.js";
import { Menu } from "../../game/ui/menu.class.js";
import { BossDirector } from "../../game/directors/bossDirector.class.js";
import { createGameAssets } from "./assets/createGameAssets.js";

export function createGame({ canvasId = "game" } = {}) {
  let canvas, ctx;
  let background, camera, player, input, world;
  let lastTime = 0;
  let audio;
  let isLoading = true;
  let loadingAnimTime = 0;
  let isPaused = false;

  let hud;
  let menu;
  let bossDirector;

  function init() {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext("2d");
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    input = new Input();
    world = new World(canvas);
    camera = new Camera(canvas, WORLD_WIDTH);
    background = new Background(canvas);
    audio = new GameAudio();
    world.audio = audio;

    const musicReadyPromise = audio.init().then(() => audio.play());
    requestAnimationFrame(renderLoading);

    const assets = createGameAssets();
    const assetsReady = Promise.allSettled(assets.images.map(waitForImage));

    Promise.all([assetsReady, musicReadyPromise]).then(() => start(assets));
  }

  function setPaused(paused) {
    isPaused = !!paused;
  }

  function getPaused() {
    return isPaused;
  }

  function start(assets) {
    const [bg1, bg2, bg3, bg4, cloud1, cloud2] = assets.bgImages;

    background.addLayer(bg1, 0.1, 0.01);
    background.spawnClouds(cloud1, cloud2);
    background.addLayer(bg2, 0.3, 0.03);
    background.addLayer(bg3, 0.6, 0.06);
    background.addLayer(bg4, 1.0, 0.1);

    const platforms = createLevel1Platforms(assets.platformSprites);
    world.addPlatforms(platforms);
    world.camera = camera;

    const collectables = [
      ...createLevel1Collectables(),
      ...generateCoinsMixed(world, LEVEL1_COIN_COUNT, LEVEL1_COIN_RATIO_ABOVE),
      ...generateCoinArcs(world, 6),
    ];
    world.addCollectables(collectables);
    placeHearts(world, LEVEL1_HEART_COUNT);
    placeGuns(world, LEVEL1_GUN_COUNT);
    placeEnemiesMixed(
      world,
      assets.enemySprites.enemy1Sprites,
      assets.enemySprites.enemy2Sprites,
      assets.enemySprites.enemy3Sprites,
      LEVEL1_ENEMY1_COUNT,
      LEVEL1_ENEMY2_COUNT,
      LEVEL1_ENEMY3_COUNT
    );

    const spawnX = 25;
    const groundTop = world.baseGround ?? canvas.height;
    const spawnY = Math.min(canvas.height * 0.5, groundTop - 200);

    player = new Player(
      spawnX,
      spawnY,
      assets.playerFrames.idle,
      assets.playerFrames.walk,
      assets.playerFrames.run,
      assets.playerFrames.jump,
      assets.playerFrames.slide,
      assets.playerFrames.attack,
      assets.playerFrames.shoot,
      assets.playerFrames.dizzy,
      assets.playerFrames.hurt,
      assets.playerFrames.die
    );
    player.world = world;
    world.setHitEffectFrames(assets.playerFrames.hitStars);
    world.hudPopups = [];

    bossDirector = new BossDirector({
      world,
      camera,
      gameAudio: audio,
      bossSprites: assets.bossSprites,
    });

    hud = new Hud({ coinImage: assets.hudCoinImg, gunImage: assets.hudGunImg });
    menu = new Menu({ backgroundImage: assets.menuBgImg });

    audio?.play();
    isLoading = false;
    requestAnimationFrame(loop);
  }

  function loop(t) {
    if (!lastTime) lastTime = t;
    const dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;

    if (!isPaused) update(dt);
    draw();
    input.endFrame();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    bossDirector?.update(dt, player);

    player.update(dt, input);
    audio?.ensureVolume?.();
    camera.follow(player, 0.08, dt);
    background.update(camera.x, camera.y, dt);

    world.applyPlatformCollisions(player);
    player.handleLandingAudio?.();
    world.collectables.forEach((c) => c.update(dt));
    world.updateEnemies(dt, player);
    world.updateProjectiles(dt, world.enemies ?? []);
    world.updateHitEffects(dt);

    checkCollectables();

    hud?.update(dt, player);

    world.hudPopups = world.hudPopups.filter((p) => {
      p.update(dt);
      return p.alpha > 0;
    });
  }

  function checkCollectables() {
    world.collectables = world.collectables.filter((c) => {
      if (!c.collected && c.isColliding(player)) {
        c.collect(player);
        return true;
      }
      return !c.pickupAnimating || c.alpha > 0;
    });
  }

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

    hud?.render(ctx, canvas, camera, player, bossDirector?.getBoss());
    if (isPaused) menu?.render(ctx, canvas);
  }

  function renderLoading(t) {
    if (!isLoading) return;
    loadingAnimTime = t || 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(10, 16, 20, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 40;
    const angle = (loadingAnimTime / 500) % (Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0, 200, 200, 0.9)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle, angle + Math.PI * 1.5);
    ctx.stroke();

    ctx.fillStyle = "#e5f7ff";
    ctx.font = "32px ComixLoud, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Loading...", cx, cy + 80);

    requestAnimationFrame(renderLoading);
  }

  return { init, setPaused, getPaused };
}

