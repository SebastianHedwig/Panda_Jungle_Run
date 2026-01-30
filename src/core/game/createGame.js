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
import { waitForImage } from "./assets/assetLoader.js";
import { GameAudio } from "../../game/audio/gameAudio.class.js";
import { Hud } from "../../game/ui/hud.class.js";
import { SettingsOverlay } from "../../app/ui/overlay/settingsOverlay.class.js";
import { BossDirector } from "../../game/directors/bossDirector.class.js";
import { GameOverOverlay } from "../../app/ui/overlay/gameOverOverlay.class.js";
import { GameWonOverlay } from "../../app/ui/overlay/gameWonOverlay.class.js";
import { createGameAssets } from "./assets/createGameAssets.js";

export function createGame({ canvasId = "game" } = {}) {
  let canvas, ctx;
  let background, camera, player, input, world;
  let lastTimeHigh = 0;
  let audio;
  let isLoading = true;
  let loadingAnimTime = 0;
  let isPaused = false;
  let menuPointer = null;

  let hud;
  let menu;
  let bossDirector;
  let gameOverOverlay;
  let gameWonOverlay;
  let isGameOver = false;
  let isGameWon = false;

  const MAX_FRAME_TIME = 0.05;
  const CAMERA_FOLLOW_LERP = 0.08;
  const PLAYER_SPAWN_X = 25;
  const PLAYER_SPAWN_HEIGHT_RATIO = 0.5;
  const PLAYER_SPAWN_GROUND_OFFSET = 200;
  const PARALLAX_LAYERS = [
    { imageIndex: 0, parallaxFactor: 0.1, swaySpeed: 0.01 },
    { imageIndex: 1, parallaxFactor: 0.3, swaySpeed: 0.03 },
    { imageIndex: 2, parallaxFactor: 0.6, swaySpeed: 0.06 },
    { imageIndex: 3, parallaxFactor: 1.0, swaySpeed: 0.1 },
  ];
  const LOADING_SPINNER_ROTATE_MS = 500;
  const LOADING_ARC_SWEEP = Math.PI * 1.5;
  const LOADING_STROKE_WIDTH = 8;
  const LOADING_FILL_STYLE = "rgba(10, 16, 20, 0.85)";
  const LOADING_STROKE_STYLE = "rgba(0, 200, 200, 0.9)";
  const LOADING_TEXT_COLOR = "#e5f7ff";
  const LOADING_FONT = "32px ComixLoud, sans-serif";
  const LOADING_TEXT_OFFSET_Y = 80;
  const FULL_CIRCLE_RADIANS = Math.PI * 2;

  function init() {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext("2d");
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    input = new Input();
    world = new World(canvas);
    camera = new Camera(canvas, WORLD_WIDTH);
    background = new Background(canvas);
    audio = window.__preloadedGameAudio ?? new GameAudio();
    window.__preloadedGameAudio = null;
    world.audio = audio;

    const musicReadyPromise = (audio.ready ? Promise.resolve(true) : audio.init()).then(() => audio.playAudio());
    requestAnimationFrame(renderLoading);

    const assets = createGameAssets();
    const assetsReady = Promise.allSettled(assets.images.map(waitForImage));

    Promise.all([assetsReady, musicReadyPromise]).then(() => start(assets));
  }

  function setPaused(paused) {
    isPaused = !!paused;
    if (!isPaused) {
      menuPointer = null;
      menu?.clearPointer?.();
    }
  }

  function getPaused() {
    return isPaused;
  }

  function setSettingsOpen(open) {
    setPaused(open);
    const toggle = document.getElementById("settings-toggle");
  }

  function updateSettingsPointer(event) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (isGameWon) {
      gameWonOverlay?.setPointer?.(x, y);
      return;
    }
    if (isGameOver) {
      gameOverOverlay?.setPointer?.(x, y);
      return;
    }
    menuPointer = { x, y };
    if (isPaused) menu?.setPointer?.(x, y);
  }

  function clearSettingsPointer() {
    menuPointer = null;
    menu?.clearPointer?.();
    gameOverOverlay?.clearPointer?.();
    gameWonOverlay?.clearPointer?.();
  }

  function handleMenuClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (isGameWon) {
      const action = gameWonOverlay?.handleClick?.(x, y);
      if (action === "retry") handleRetry();
      if (action === "quit") handleQuit();
      return;
    }
    if (isGameOver) {
      const action = gameOverOverlay?.handleClick?.(x, y);
      if (action === "retry") handleRetry();
      if (action === "quit") handleQuit();
      return;
    }
    if (!isPaused || !menu) return;
    if (menu.handleClick?.(x, y)) {
      setSettingsOpen(false);
      event.stopImmediatePropagation?.();
      event.preventDefault?.();
    }
  }

  function handleQuit() {
    window.location.href = window.location.origin + window.location.pathname;
  }

  function handleRetry() {
    try {
      window.localStorage?.setItem?.("panda_autostart", "1");
    } catch (_err) {
      // ignore DOMExceptions from storage (e.g.: blocked/readonly/incognito)
    }
    window.location.reload();
  }

  function start(assets) {
    const [bg1, bg2, bg3, bg4, cloud1, cloud2] = assets.bgImages;
    const parallaxImages = [bg1, bg2, bg3, bg4];

    PARALLAX_LAYERS.forEach(({ imageIndex, parallaxFactor, swaySpeed }) => {
      background.addLayer(parallaxImages[imageIndex], parallaxFactor, swaySpeed);
    });
    background.spawnClouds(cloud1, cloud2);

    const platforms = createLevel1Platforms(assets.platformSprites);
    world.addPlatforms(platforms);
    world.camera = camera;

    const collectables = [
      ...createLevel1Collectables(),
      ...generateCoinsMixed(world, LEVEL1_COIN_COUNT, LEVEL1_COIN_RATIO_ABOVE),
      ...generateCoinArcs(world),
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

    const spawnX = PLAYER_SPAWN_X;
    const groundTop = world.baseGround ?? canvas.height;
    const spawnY = Math.min(canvas.height * PLAYER_SPAWN_HEIGHT_RATIO, groundTop - PLAYER_SPAWN_GROUND_OFFSET);

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
    player.onDeath = () => {
      isGameOver = true;
      setPaused(false);
      menuPointer = null;
      gameOverOverlay?.reset?.();
    };
    world.setHitEffectFrames(assets.playerFrames.hitStars);
    world.hudPopups = [];

    bossDirector = new BossDirector({
      world,
      camera,
      gameAudio: audio,
      bossSprites: assets.bossSprites,
    });

    hud = new Hud({ coinImage: assets.hudCoinImg, gunImage: assets.hudGunImg });
    menu = new SettingsOverlay({
      backgroundImage: assets.menuBgImg,
      uiImage: assets.menuUiImg,
      onQuit: handleQuit,
    });
    gameOverOverlay = new GameOverOverlay();
    gameWonOverlay = new GameWonOverlay();
    gameWonOverlay.setCoinImage?.(assets.hudCoinImg);

    audio?.playAudio?.();
    isLoading = false;
    canvas.addEventListener("mousemove", updateSettingsPointer);
    canvas.addEventListener("mouseleave", clearSettingsPointer);
    canvas.addEventListener("click", handleMenuClick, true);
    requestAnimationFrame(loopHighRes);
  }

  function loopHighRes(timeStamp) {
    const msPerSecond = 1000;
    if (!lastTimeHigh) lastTimeHigh = timeStamp;
    const dt = Math.min((timeStamp - lastTimeHigh) / msPerSecond, MAX_FRAME_TIME);
    lastTimeHigh = timeStamp;

    if (!isPaused) update(dt);
    draw();
    input.endFrame();
    requestAnimationFrame(loopHighRes);
  }

  function update(dt) {
    const bossResult = bossDirector?.update(dt, player);
    if (!isGameWon && bossResult?.cleared) {
      isGameWon = true;
      gameWonOverlay?.setCoins?.(player?.coins ?? 0);
      setPaused(false);
      menuPointer = null;
      gameWonOverlay?.reset?.();
      return;
    }

    player.update(dt, input);
    audio?.ensureVolume?.();
    camera.follow(player, CAMERA_FOLLOW_LERP, dt);
    background.update(camera.x, camera.y, dt);

    world.applyPlatformCollisions(player);
    player.handleLandingAudio?.();
    world.collectables.forEach((collectable) => collectable.update(dt));
    world.updateEnemies(dt, player);
    world.updateProjectiles(dt, world.enemies ?? []);
    world.updateHitEffects(dt);

    checkCollectables();

    hud?.update(dt, player);

    world.hudPopups = world.hudPopups.filter((popup) => {
      popup.update(dt);
      return popup.opacity > 0;
    });
  }

  function checkCollectables() {
    world.collectables = world.collectables.filter((collectable) => {
      if (!collectable.collected && collectable.isColliding(player)) {
        collectable.collect(player);
        return true;
      }
      return !collectable.pickupAnimating || collectable.opacity > 0;
    });
  }

  function draw() {
    if (canvas) canvas.style.cursor = "default";
    const overlayActive = isGameWon || isGameOver || isPaused;
    document.body?.classList.toggle("overlay-active", overlayActive);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    background.render(ctx, camera);
    world.platforms.forEach((platform) => platform.render(ctx, camera));
    world.collectables.forEach((collectable) => collectable.draw(ctx, camera));
    world.hudPopups.forEach((popup) => popup.draw(ctx, camera));
    world.renderProjectiles(ctx, camera);
    world.renderEnemies(ctx, camera);
    player.render(ctx, camera);
    world.renderHitEffects(ctx, camera);

    hud?.render(ctx, canvas, camera, player, bossDirector?.getBoss());

    if (isGameWon) {
      gameWonOverlay?.render(ctx, canvas);
      if (canvas) canvas.style.cursor = gameWonOverlay?.isHovering?.() ? "pointer" : "default";
      return;
    }

    if (isGameOver) {
      gameOverOverlay?.render(ctx, canvas);
      if (canvas) canvas.style.cursor = gameOverOverlay?.isHovering?.() ? "pointer" : "default";
      return;
    }

    if (isPaused) {
      if (menuPointer) menu.setPointer?.(menuPointer.x, menuPointer.y);
      menu?.render(ctx, canvas);
    }
  }

  function renderLoading(timeStamp) {
    if (!isLoading) return;
    loadingAnimTime = timeStamp || 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = LOADING_FILL_STYLE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    const radius = 40;
    const spinnerAngle = (loadingAnimTime / LOADING_SPINNER_ROTATE_MS) % FULL_CIRCLE_RADIANS;
    ctx.lineWidth = LOADING_STROKE_WIDTH;
    ctx.strokeStyle = LOADING_STROKE_STYLE;
    ctx.beginPath();
    ctx.arc(canvasCenterX, canvasCenterY, radius, spinnerAngle, spinnerAngle + LOADING_ARC_SWEEP);
    ctx.stroke();

    ctx.fillStyle = LOADING_TEXT_COLOR;
    ctx.font = LOADING_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Loading...", canvasCenterX, canvasCenterY + LOADING_TEXT_OFFSET_Y);

    requestAnimationFrame(renderLoading);
  }

  return { init, setPaused, getPaused };
}
