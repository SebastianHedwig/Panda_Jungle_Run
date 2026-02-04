import { Input } from "../../engine/input/input.class.js";
import { Background } from "../../engine/rendering/background.class.js";
import { Camera } from "../../engine/world/camera.class.js";
import { World } from "../world.class.js";
import { Player } from "../../game/entities/player/player.class.js";
import { createLevel1Platforms, createLevel1Collectables, generateCoinsMixed, generateCoinArcs, placeHearts, placeGuns, placeEnemiesMixed } from "../../game/levels/level1.js";
import { GAME_HEIGHT, GAME_WIDTH, LEVEL1_COIN_COUNT, LEVEL1_COIN_RATIO_ABOVE, LEVEL1_ENEMY1_COUNT, LEVEL1_ENEMY2_COUNT, LEVEL1_ENEMY3_COUNT, LEVEL1_GUN_COUNT, LEVEL1_HEART_COUNT, WORLD_WIDTH } from "../../config/config.js";
import { waitForImage } from "./assets/assetLoader.js";
import { GameAudio } from "../../game/audio/gameAudio.class.js";
import { Hud } from "../../game/ui/hud.class.js";
import { SettingsOverlay } from "../../app/ui/overlay/settingsOverlay.class.js";
import { BossDirector } from "../../game/directors/bossDirector.class.js";
import { GameOverOverlay } from "../../app/ui/overlay/gameOverOverlay.class.js";
import { GameWonOverlay } from "../../app/ui/overlay/gameWonOverlay.class.js";
import { createGameAssets } from "./assets/createGameAssets.js";

/**
 * Creates game. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.canvasId] Canvas element id.
 */
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

  /**
   * Sets up canvas.
   * Resolves DOM elements from the document.
   */
  function setupCanvas() {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext("2d");
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
  }

  /**
   * Sets up core systems.
   */
  function setupCoreSystems() {
    input = new Input();
    world = new World(canvas);
    camera = new Camera(canvas, WORLD_WIDTH);
    background = new Background(canvas);
  }

  /**
   * Sets up audio.
   * Updates the world state.
   */
  function setupAudio() {
    audio = window.__preloadedGameAudio ?? new GameAudio();
    window.__preloadedGameAudio = null;
    world.audio = audio;
  }

  /**
   * Returns music ready promise.
   * @returns {*} Music ready promise.
   */
  function getMusicReadyPromise() {
    return (audio.ready ? Promise.resolve(true) : audio.init()).then(() => audio.playAudio());
  }

  /**
   * Starts loading render.
   */
  function startLoadingRender() {
    requestAnimationFrame(renderLoading);
  }

  /**
   * Returns assets ready.
   * Uses assets to compute the result.
   * @param {*} assets Assets.
   * @returns {*} Assets ready.
   */
  function getAssetsReady(assets) {
    return Promise.allSettled(assets.images.map(waitForImage));
  }

  /**
   * Starts when ready.
   * Uses assets, assetsReady, musicReadyPromise to perform the operation.
   * @param {*} assets Assets.
   * @param {boolean} assetsReady Assets ready.
   * @param {*} musicReadyPromise Music ready promise.
   */
  function startWhenReady(assets, assetsReady, musicReadyPromise) {
    Promise.all([assetsReady, musicReadyPromise]).then(() => start(assets));
  }

  /**
   * Initializes.
   */
  function init() {
    setupCanvas();
    setupCoreSystems();
    setupAudio();
    const musicReadyPromise = getMusicReadyPromise();
    startLoadingRender();
    const assets = createGameAssets();
    const assetsReady = getAssetsReady(assets);
    startWhenReady(assets, assetsReady, musicReadyPromise);
  }

  /**
   * Sets paused.
   * Uses paused to perform the operation.
   * @param {boolean} paused Paused.
   */
  function setPaused(paused) {
    isPaused = !!paused;
    if (!isPaused) {
      menuPointer = null;
      menu?.clearPointer?.();
    }
  }

  /**
   * Returns paused.
   * @returns {*} Paused.
   */
  function getPaused() {
    return isPaused;
  }

  /**
   * Sets settings open.
   * Resolves DOM elements from the document.
   * @param {boolean} open Open.
   */
  function setSettingsOpen(open) {
    setPaused(open);
    const toggle = document.getElementById("settings-toggle");
  }

  /**
   * Returns canvas pointer.
   * Uses event to compute the result.
   * @param {Event} event Event object.
   * @returns {Object} Canvas pointer.
   */
  function getCanvasPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  /**
   * Sets game won pointer.
   * Uses x, y to perform the operation.
   * @param {number} x X.
   * @param {number} y Y.
   */
  function setGameWonPointer(x, y) {
    gameWonOverlay?.setPointer?.(x, y);
  }

  /**
   * Sets game over pointer.
   * Uses x, y to perform the operation.
   * @param {number} x X.
   * @param {number} y Y.
   */
  function setGameOverPointer(x, y) {
    gameOverOverlay?.setPointer?.(x, y);
  }

  /**
   * Sets menu pointer.
   * Uses x, y to perform the operation.
   * @param {number} x X.
   * @param {number} y Y.
   */
  function setMenuPointer(x, y) {
    menuPointer = { x, y };
    if (isPaused) menu?.setPointer?.(x, y);
  }

  /**
   * Applies menu pointer.
   * Uses x, y to perform the operation.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  function applyMenuPointer(x, y) {
    if (isGameWon) return setGameWonPointer(x, y);
    if (isGameOver) return setGameOverPointer(x, y);
    setMenuPointer(x, y);
  }

  /**
   * Updates settings pointer.
   * Uses event to perform the operation.
   * @param {Event} event Event object.
   */
  function updateSettingsPointer(event) {
    if (!canvas) return;
    const { x, y } = getCanvasPointer(event);
    applyMenuPointer(x, y);
  }

  /**
   * Clears settings pointer.
   */
  function clearSettingsPointer() {
    menuPointer = null;
    menu?.clearPointer?.();
    gameOverOverlay?.clearPointer?.();
    gameWonOverlay?.clearPointer?.();
  }

  /**
   * Handles game overlay action.
   * Uses action to perform the operation.
   * @param {*} action Action.
   */
  function handleGameOverlayAction(action) {
    if (action === "retry") handleRetry();
    if (action === "quit") handleQuit();
  }

  /**
   * Handles end game click.
   * Uses x, y to perform the operation.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  function handleEndGameClick(x, y) {
    if (isGameWon) {
      handleGameOverlayAction(gameWonOverlay?.handleGameOverlayButtonClick?.(x, y));
      return true;
    }
    if (isGameOver) {
      handleGameOverlayAction(gameOverOverlay?.handleGameOverlayButtonClick?.(x, y));
      return true;
    }
    return false;
  }

  /**
   * Stops menu click event.
   * Uses event to perform the operation.
   * @param {Event} event Event object.
   */
  function stopMenuClickEvent(event) {
    event.stopImmediatePropagation?.();
    event.preventDefault?.();
  }

  /**
   * Handles menu click.
   * Uses event to perform the operation.
   * @param {Event} event Event object.
   */
  function handleMenuClick(event) {
    const { x, y } = getCanvasPointer(event);
    if (handleEndGameClick(x, y)) return;
    if (!isPaused || !menu) return;
    if (menu.handleSettingsOverlayClick?.(x, y)) {
      setSettingsOpen(false);
      stopMenuClickEvent(event);
    }
  }

  /**
   * Handles quit.
   */
  function handleQuit() {
    window.location.href = window.location.origin + window.location.pathname;
  }

  /**
   * Handles retry.
   * Reads or writes browser storage.
   */
  function handleRetry() {
    try {
      window.localStorage?.setItem?.("panda_autostart", "1");
    } catch (_err) {
      // ignore DOMExceptions from storage (e.g.: blocked/readonly/incognito)
    }
    window.location.reload();
  }

  /**
   * Returns background assets.
   * Uses assets to compute the result.
   * @param {*} assets Assets.
   * @returns {Object} Background assets.
   */
  function getBackgroundAssets(assets) {
    const [bg1, bg2, bg3, bg4, cloud1, cloud2] = assets.bgImages;
    return { parallaxImages: [bg1, bg2, bg3, bg4], cloud1, cloud2 };
  }

  /**
   * Adds parallax layers.
   * Uses parallaxImages to perform the operation.
   * @param {*} parallaxImages Parallax images.
   */
  function addParallaxLayers(parallaxImages) {
    PARALLAX_LAYERS.forEach(({ imageIndex, parallaxFactor, swaySpeed }) => {
      background.addLayer(parallaxImages[imageIndex], parallaxFactor, swaySpeed);
    });
  }

  /**
   * Sets up background assets.
   * Spawns visual feedback effects.
   * @param {*} assets Assets.
   */
  function setupBackgroundAssets(assets) {
    const { parallaxImages, cloud1, cloud2 } = getBackgroundAssets(assets);
    addParallaxLayers(parallaxImages);
    background.spawnClouds(cloud1, cloud2);
  }

  /**
   * Sets up world platforms.
   * Updates the world state.
   * @param {*} assets Assets.
   */
  function setupWorldPlatforms(assets) {
    const platforms = createLevel1Platforms(assets.platformSprites);
    world.addPlatforms(platforms);
    world.camera = camera;
  }

  /**
   * Returns collectables.
   * @returns {Array<any>} Collectables.
   */
  function getCollectables() {
    return [
      ...createLevel1Collectables(),
      ...generateCoinsMixed(world, LEVEL1_COIN_COUNT, LEVEL1_COIN_RATIO_ABOVE),
      ...generateCoinArcs(world),
    ];
  }

  /**
   * Adds collectables.
   * Updates the world state.
   */
  function addCollectables() {
    const collectables = getCollectables();
    world.addCollectables(collectables);
  }

  /**
   * Place pickups.
   */
  function placePickups() {
    placeHearts(world, LEVEL1_HEART_COUNT);
    placeGuns(world, LEVEL1_GUN_COUNT);
  }

  /**
   * Place enemies.
   * Uses assets to perform the operation.
   * @param {*} assets Assets.
   */
  function placeEnemies(assets) {
    placeEnemiesMixed(
      world,
      assets.enemySprites.enemy1Sprites,
      assets.enemySprites.enemy2Sprites,
      assets.enemySprites.enemy3Sprites,
      LEVEL1_ENEMY1_COUNT,
      LEVEL1_ENEMY2_COUNT,
      LEVEL1_ENEMY3_COUNT
    );
  }

  /**
   * Returns spawn position.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @returns {Object} Spawn position.
   */
  function getSpawnPosition() {
    const spawnX = PLAYER_SPAWN_X;
    const groundTop = world.baseGround ?? canvas.height;
    const spawnY = Math.min(canvas.height * PLAYER_SPAWN_HEIGHT_RATIO, groundTop - PLAYER_SPAWN_GROUND_OFFSET);
    return { spawnX, spawnY };
  }

  /**
   * Returns player frames.
   * Applies physics updates like gravity and velocity.
   * @param {*} assets Assets.
   * @returns {Array<any>} Player frames.
   */
  function getPlayerFrames(assets) {
    return [
      assets.playerFrames.idle,
      assets.playerFrames.walk,
      assets.playerFrames.run,
      assets.playerFrames.jump,
      assets.playerFrames.slide,
      assets.playerFrames.attack,
      assets.playerFrames.shoot,
      assets.playerFrames.dizzy,
      assets.playerFrames.hurt,
      assets.playerFrames.die,
    ];
  }

  /**
   * Creates player instance.
   * Spawns visual feedback effects.
   * @param {*} assets Assets.
   * @param {number} spawnX Spawn X.
   * @param {number} spawnY Spawn Y.
   * @returns {*} Player instance.
   */
  function createPlayerInstance(assets, spawnX, spawnY) {
    return new Player(spawnX, spawnY, ...getPlayerFrames(assets));
  }

  /**
   * Handles player death.
   */
  function handlePlayerDeath() {
    isGameOver = true;
    setPaused(false);
    menuPointer = null;
    gameOverOverlay?.reset?.();
  }

  /**
   * Sets up player.
   * Updates the player state.
   * Spawns visual feedback effects.
   * @param {*} assets Assets.
   */
  function setupPlayer(assets) {
    const { spawnX, spawnY } = getSpawnPosition();
    player = createPlayerInstance(assets, spawnX, spawnY);
    player.world = world;
    player.onDeath = handlePlayerDeath;
    world.setHitEffectFrames(assets.playerFrames.hitStars);
    world.hudPopups = [];
  }

  /**
   * Sets up boss director.
   * Triggers audio playback or updates audio state.
   * @param {*} assets Assets.
   */
  function setupBossDirector(assets) {
    bossDirector = new BossDirector({
      world,
      camera,
      gameAudio: audio,
      bossSprites: assets.bossSprites,
    });
  }

  /**
   * Sets up hud.
   * Uses assets to perform the operation.
   * @param {*} assets Assets.
   */
  function setupHud(assets) {
    hud = new Hud({ coinImage: assets.hudCoinImg, gunImage: assets.hudGunImg });
  }

  /**
   * Sets up menu.
   * Uses assets to perform the operation.
   * @param {*} assets Assets.
   */
  function setupMenu(assets) {
    menu = new SettingsOverlay({
      backgroundImage: assets.menuBgImg,
      uiImage: assets.menuUiImg,
      onQuit: handleQuit,
    });
  }

  /**
   * Sets up overlays.
   * Uses assets to perform the operation.
   * @param {*} assets Assets.
   */
  function setupOverlays(assets) {
    gameOverOverlay = new GameOverOverlay();
    gameWonOverlay = new GameWonOverlay();
    gameWonOverlay.setCoinImage?.(assets.hudCoinImg);
  }

  /**
   * Adds menu listeners.
   * Binds click, mouseleave, mousemove event listeners.
   */
  function addMenuListeners() {
    canvas.addEventListener("mousemove", updateSettingsPointer);
    canvas.addEventListener("mouseleave", clearSettingsPointer);
    canvas.addEventListener("click", handleMenuClick, true);
  }

  /**
   * Starts gameplay loop.
   */
  function startGameplayLoop() {
    audio?.playAudio?.();
    isLoading = false;
    addMenuListeners();
    requestAnimationFrame(loopHighRes);
  }

  /**
   * Starts.
   * Uses assets to perform the operation.
   * @param {*} assets Assets.
   */
  function start(assets) {
    setupBackgroundAssets(assets);
    setupWorldPlatforms(assets);
    addCollectables();
    placePickups();
    placeEnemies(assets);
    setupPlayer(assets);
    setupBossDirector(assets);
    setupHud(assets);
    setupMenu(assets);
    setupOverlays(assets);
    startGameplayLoop();
  }

  /**
   * Loop high res.
   * Uses timeStamp to perform the operation.
   * @param {number} timeStamp Time stamp.
   */
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

  /**
   * Sets game won state.
   */
  function setGameWonState() {
    isGameWon = true;
    gameWonOverlay?.setCoins?.(player?.coins ?? 0);
    setPaused(false);
    menuPointer = null;
    gameWonOverlay?.reset?.();
  }

  /**
   * Handles boss update.
   * Uses dt to perform the operation.
   * @param {number} dt Delta time in seconds.
   * @returns {*} Result value.
   */
  function handleBossUpdate(dt) {
    const bossResult = bossDirector?.update(dt, player);
    if (!isGameWon && bossResult?.cleared) {
      setGameWonState();
      return true;
    }
    return false;
  }

  /**
   * Updates player and camera.
   * Updates the player state.
   * @param {number} dt Delta time in seconds.
   */
  function updatePlayerAndCamera(dt) {
    player.update(dt, input);
    audio?.ensureVolume?.();
    camera.follow(player, CAMERA_FOLLOW_LERP, dt);
    background.update(camera.x, camera.y, dt);
  }

  /**
   * Updates collectable entities.
   * Updates the world state.
   * @param {number} dt Delta time in seconds.
   */
  function updateCollectableEntities(dt) {
    world.collectables.forEach((collectable) => collectable.update(dt));
  }

  /**
   * Updates enemies and projectiles.
   * Updates the world state.
   * @param {number} dt Delta time in seconds.
   */
  function updateEnemiesAndProjectiles(dt) {
    world.updateEnemies(dt, player);
    world.updateProjectiles(dt, world.enemies ?? []);
  }

  /**
   * Updates world entities.
   * Updates the player state.
   * Spawns visual feedback effects.
   * @param {number} dt Delta time in seconds.
   */
  function updateWorldEntities(dt) {
    world.applyPlatformCollisions(player);
    player.handleLandingAudio?.();
    updateCollectableEntities(dt);
    updateEnemiesAndProjectiles(dt);
    world.updateHitEffects(dt);
  }

  /**
   * Updates hud popups.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @param {number} dt Delta time in seconds.
   * @returns {*} Result value.
   */
  function updateHudPopups(dt) {
    world.hudPopups = world.hudPopups.filter((popup) => {
      popup.update(dt);
      return popup.opacity > 0;
    });
  }

  /**
   * Updates.
   * Spawns visual feedback effects.
   * @param {number} dt Delta time in seconds.
   */
  function update(dt) {
    if (handleBossUpdate(dt)) return;
    updatePlayerAndCamera(dt);
    updateWorldEntities(dt);
    checkCollectables();
    hud?.update(dt, player);
    updateHudPopups(dt);
  }

  /**
   * Checks collectables.
   * Updates the world state.
   * @returns {*} Result value.
   */
  function checkCollectables() {
    world.collectables = world.collectables.filter((collectable) => {
      if (!collectable.collected && collectable.isColliding(player)) {
        collectable.collect(player);
        return true;
      }
      return !collectable.pickupAnimating || collectable.opacity > 0;
    });
  }

  /**
   * Sets canvas cursor default.
   */
  function setCanvasCursorDefault() {
    if (canvas) canvas.style.cursor = "default";
  }

  /**
   * Sets overlay active state.
   * Updates CSS classes to reflect the current state.
   */
  function setOverlayActiveState() {
    const overlayActive = isGameWon || isGameOver || isPaused;
    document.body?.classList.toggle("overlay-active", overlayActive);
  }

  /**
   * Clears canvas.
   * Renders to the canvas context.
   */
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Renders platforms.
   * Updates the world state.
   */
  function renderPlatforms() {
    world.platforms.forEach((platform) => platform.render(ctx, camera));
  }

  /**
   * Renders collectables.
   * Updates the world state.
   */
  function renderCollectables() {
    world.collectables.forEach((collectable) => collectable.draw(ctx, camera));
  }

  /**
   * Renders hud popups.
   * Updates the world state.
   * Spawns visual feedback effects.
   */
  function renderHudPopups() {
    world.hudPopups.forEach((popup) => popup.draw(ctx, camera));
  }

  /**
   * Renders world.
   * Updates the player state.
   * Spawns visual feedback effects.
   */
  function renderWorld() {
    background.render(ctx, camera);
    renderPlatforms();
    renderCollectables();
    renderHudPopups();
    world.renderProjectiles(ctx, camera);
    world.renderEnemies(ctx, camera);
    player.render(ctx, camera);
    world.renderHitEffects(ctx, camera);
  }

  /**
   * Renders hud.
   */
  function renderHud() {
    hud?.render(ctx, canvas, camera, player, bossDirector?.getBoss());
  }

  /**
   * Renders game won overlay.
   */
  function renderGameWonOverlay() {
    gameWonOverlay?.render(ctx, canvas);
    if (canvas) canvas.style.cursor = gameWonOverlay?.isHovering?.() ? "pointer" : "default";
  }

  /**
   * Renders game over overlay.
   */
  function renderGameOverOverlay() {
    gameOverOverlay?.render(ctx, canvas);
    if (canvas) canvas.style.cursor = gameOverOverlay?.isHovering?.() ? "pointer" : "default";
  }

  /**
   * Renders end game overlay.
   * @returns {*} Result value.
   */
  function renderEndGameOverlay() {
    if (isGameWon) {
      renderGameWonOverlay();
      return true;
    }
    if (isGameOver) {
      renderGameOverOverlay();
      return true;
    }
    return false;
  }

  /**
   * Renders paused menu.
   */
  function renderPausedMenu() {
    if (!isPaused) return;
    if (menuPointer) menu.setPointer?.(menuPointer.x, menuPointer.y);
    menu?.render(ctx, canvas);
  }

  /**
   * Draws.
   */
  function draw() {
    setCanvasCursorDefault();
    setOverlayActiveState();
    clearCanvas();
    renderWorld();
    renderHud();
    if (renderEndGameOverlay()) return;
    renderPausedMenu();
  }

  /**
   * Updates loading time.
   * Uses timeStamp to perform the operation.
   * @param {number} timeStamp Time stamp.
   */
  function updateLoadingTime(timeStamp) {
    loadingAnimTime = timeStamp || 0;
  }

  /**
   * Draws loading backdrop.
   * Renders to the canvas context.
   */
  function drawLoadingBackdrop() {
    ctx.fillStyle = LOADING_FILL_STYLE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Returns loading spinner state.
   * @returns {Object} Loading spinner state.
   */
  function getLoadingSpinnerState() {
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    const radius = 40;
    const spinnerAngle = (loadingAnimTime / LOADING_SPINNER_ROTATE_MS) % FULL_CIRCLE_RADIANS;
    return { canvasCenterX, canvasCenterY, radius, spinnerAngle };
  }

  /**
   * Draws loading spinner.
   * Uses options to perform the operation.
   * @param {Object} options Configuration options.
   * @param {boolean} [options.canvasCenterX] Canvas center X.
   * @param {boolean} [options.canvasCenterY] Canvas center Y.
   * @param {*} [options.radius] Radius.
   * @param {number} [options.spinnerAngle] Spinner angle.
   */
  function drawLoadingSpinner({ canvasCenterX, canvasCenterY, radius, spinnerAngle }) {
    ctx.lineWidth = LOADING_STROKE_WIDTH;
    ctx.strokeStyle = LOADING_STROKE_STYLE;
    ctx.beginPath();
    ctx.arc(canvasCenterX, canvasCenterY, radius, spinnerAngle, spinnerAngle + LOADING_ARC_SWEEP);
    ctx.stroke();
  }

  /**
   * Draws loading text.
   * Renders to the canvas context.
   * @param {boolean} canvasCenterX Canvas center X.
   * @param {boolean} canvasCenterY Canvas center Y.
   */
  function drawLoadingText(canvasCenterX, canvasCenterY) {
    ctx.fillStyle = LOADING_TEXT_COLOR;
    ctx.font = LOADING_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Loading...", canvasCenterX, canvasCenterY + LOADING_TEXT_OFFSET_Y);
  }

  /**
   * Renders loading.
   * Uses timeStamp to perform the operation.
   * @param {number} timeStamp Time stamp.
   */
  function renderLoading(timeStamp) {
    if (!isLoading) return;
    updateLoadingTime(timeStamp);
    clearCanvas();
    drawLoadingBackdrop();
    const spinnerState = getLoadingSpinnerState();
    drawLoadingSpinner(spinnerState);
    drawLoadingText(spinnerState.canvasCenterX, spinnerState.canvasCenterY);
    requestAnimationFrame(renderLoading);
  }

  return { init, setPaused, getPaused };
}
