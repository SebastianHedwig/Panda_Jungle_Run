import { Player } from "../../../game/entities/player/player.class.js";
import { createLevel1Platforms, createLevel1Collectables, generateCoinsMixed, generateCoinArcs, placeHearts, placeGuns, placeEnemiesMixed } from "../../../game/levels/level1/level1.js";
import { LEVEL1_COIN_COUNT, LEVEL1_COIN_RATIO_ABOVE, LEVEL1_ENEMY1_COUNT, LEVEL1_ENEMY2_COUNT, LEVEL1_ENEMY3_COUNT, LEVEL1_GUN_COUNT, LEVEL1_HEART_COUNT } from "../../../config/config.js";
import { BossDirector } from "../../../game/directors/bossDirector.class.js";
import { Hud } from "../../../game/ui/hud.class.js";
import { SettingsOverlay } from "../../../app/ui/overlay/settings/settingsOverlay.class.js";
import { GameOverOverlay } from "../../../app/ui/overlay/game/gameOverOverlay.class.js";
import { GameWonOverlay } from "../../../app/ui/overlay/game/gameWonOverlay.class.js";

/**
 * Returns background assets.
 * Used to provide background assets for world state updates.
 * Uses assets to compute the result.
 * @param {*} assets Assets.
 * @returns {Object} Background assets.
 */
export function getBackgroundAssets(assets) {
  const [bg1, bg2, bg3, bg4, cloud1, cloud2] = assets.bgImages;
  return { parallaxImages: [bg1, bg2, bg3, bg4], cloud1, cloud2 };
}

/**
 * Adds parallax layers.
 * Used to support world state updates.
 * Uses parallaxImages to perform the operation.
 * @param {*} parallaxImages Parallax images.
 */
export function addParallaxLayers(parallaxImages) {
  this.PARALLAX_LAYERS.forEach(({ imageIndex, parallaxFactor, swaySpeed }) => {
    this.background.addLayer(parallaxImages[imageIndex], parallaxFactor, swaySpeed);
  });
}

/**
 * Sets up background assets.
 * Used to support world state updates.
 * Spawns visual feedback effects.
 * @param {*} assets Assets.
 */
export function setupBackgroundAssets(assets) {
  const { parallaxImages, cloud1, cloud2 } = this.getBackgroundAssets(assets);
  this.addParallaxLayers(parallaxImages);
  this.background.spawnClouds(cloud1, cloud2);
}

/**
 * Sets up world platforms.
 * Used to support world state updates.
 * @param {*} assets Assets.
 */
export function setupWorldPlatforms(assets) {
  const platforms = createLevel1Platforms(assets.platformSprites);
  this.world.addPlatforms(platforms);
  this.world.camera = this.camera;
}

/**
 * Returns collectables.
 * Used to provide collectables for world state updates.
 * @returns {Array<any>} Collectables.
 */
export function getCollectables() {
  return [
    ...createLevel1Collectables(),
    ...generateCoinsMixed(this.world, LEVEL1_COIN_COUNT, LEVEL1_COIN_RATIO_ABOVE),
    ...generateCoinArcs(this.world),
  ];
}

/**
 * Adds collectables.
 */
export function addCollectables() {
  const collectables = this.getCollectables();
  this.world.addCollectables(collectables);
}

/**
 * Place pickups.
 */
export function placePickups() {
  placeHearts(this.world, LEVEL1_HEART_COUNT);
  placeGuns(this.world, LEVEL1_GUN_COUNT);
}

/**
 * Place enemies.
 * Used to support world state updates.
 * Uses assets to perform the operation.
 * @param {*} assets Assets.
 */
export function placeEnemies(assets) {
  placeEnemiesMixed(
    this.world,
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
 * Used to provide spawn position for camera-relative placement.
 * Spawns visual feedback effects.
 * @returns {Object} Spawn position.
 */
export function getSpawnPosition() {
  const spawnX = this.PLAYER_SPAWN_X;
  const groundTop = this.world.baseGround ?? this.canvas.height;
  const spawnY = Math.min(this.canvas.height * this.PLAYER_SPAWN_HEIGHT_RATIO, groundTop - this.PLAYER_SPAWN_GROUND_OFFSET);
  return { spawnX, spawnY };
}

/**
 * Returns player frames.
 * Used to provide player frames for world state updates.
 * Applies physics updates like gravity and velocity.
 * @param {*} assets Assets.
 * @returns {Array<any>} Player frames.
 */
export function getPlayerFrames(assets) {
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
 * Used to set up required data for world state updates.
 * Spawns visual feedback effects.
 * @param {*} assets Assets.
 * @param {number} spawnX Spawn X.
 * @param {number} spawnY Spawn Y.
 * @returns {*} Player instance.
 */
export function createPlayerInstance(assets, spawnX, spawnY) {
  return new Player(spawnX, spawnY, ...this.getPlayerFrames(assets));
}

/**
 * Handles player death.
 */
export function handlePlayerDeath() {
  this.isGameOver = true;
  this.setPaused(false);
  this.menuPointer = null;
  this.gameOverOverlay?.reset?.();
}

/**
 * Sets up player.
 * Used to support world state updates.
 * Spawns visual feedback effects.
 * @param {*} assets Assets.
 */
export function setupPlayer(assets) {
  const { spawnX, spawnY } = this.getSpawnPosition();
  this.player = this.createPlayerInstance(assets, spawnX, spawnY);
  this.player.world = this.world;
  this.player.onDeath = this.handlePlayerDeath;
  this.world.setHitEffectFrames(assets.playerFrames.hitStars);
  this.world.hudPopups = [];
}

/**
 * Sets up boss director.
 * Used to support world state updates.
 * Triggers audio playback or updates audio state.
 * @param {*} assets Assets.
 */
export function setupBossDirector(assets) {
  this.bossDirector = new BossDirector({
    world: this.world,
    camera: this.camera,
    gameAudio: this.audio,
    bossSprites: assets.bossSprites,
  });
}

/**
 * Sets up hud.
 * Used to support UI interaction handling.
 * Uses assets to perform the operation.
 * @param {*} assets Assets.
 */
export function setupHud(assets) {
  this.hud = new Hud({ coinImage: assets.hudCoinImg, gunImage: assets.hudGunImg });
}

/**
 * Sets up menu.
 * Used to support UI interaction handling.
 * Uses assets to perform the operation.
 * @param {*} assets Assets.
 */
export function setupMenu(assets) {
  this.menu = new SettingsOverlay({
    backgroundImage: assets.menuBgImg,
    uiImage: assets.menuUiImg,
    onQuit: this.handleQuit,
  });
}

/**
 * Sets up overlays.
 * Used to support world state updates.
 * Uses assets to perform the operation.
 * @param {*} assets Assets.
 */
export function setupOverlays(assets) {
  this.gameOverOverlay = new GameOverOverlay();
  this.gameWonOverlay = new GameWonOverlay();
  this.gameWonOverlay.setCoinImage?.(assets.hudCoinImg);
}

/**
 * Starts gameplay loop.
 */
export function startGameplayLoop() {
  this.audio?.playAudio?.();
  this.isLoading = false;
  this.addMenuListeners();
  requestAnimationFrame(this.loopHighRes);
}

/**
 * Starts.
 * Used to support world state updates.
 * Uses assets to perform the operation.
 * @param {*} assets Assets.
 */
export function start(assets) {
  this.setupBackgroundAssets(assets);
  this.setupWorldPlatforms(assets);
  this.addCollectables();
  this.placePickups();
  this.placeEnemies(assets);
  this.setupPlayer(assets);
  this.setupBossDirector(assets);
  this.setupHud(assets);
  this.setupMenu(assets);
  this.setupOverlays(assets);
  this.startGameplayLoop();
}
