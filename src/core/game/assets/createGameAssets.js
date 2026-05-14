import { loadFrames, loadImage } from "./assetLoader.js";
import { loadEnemy1Sprites } from "../../../game/entities/enemies/enemy1/enemy1.class.js";
import { loadEnemy2Sprites } from "../../../game/entities/enemies/enemy2/enemy2.class.js";
import { loadEnemy3Sprites } from "../../../game/entities/enemies/enemy3/enemy3.class.js";
import { loadBossSprites } from "../../../game/entities/boss/boss.class.js";

const PLAYER_FRAME_KEYS = ["idle", "walk", "run", "jump", "slide", "attack", "shoot", "dizzy", "hurt", "die", "hitStars"];
const PLAYER_FRAME_CONFIG = [
  ["idle", "./assets/img/character/character_sprites/idle/", "idle_", 10],
  ["walk", "./assets/img/character/character_sprites/walk/", "walk_", 10],
  ["run", "./assets/img/character/character_sprites/run/", "run_", 8],
  ["jump", "./assets/img/character/character_sprites/jump/", "jump_", 5],
  ["slide", "./assets/img/character/character_sprites/slide/", "sliding_", 4],
  ["attack", "./assets/img/character/character_sprites/throw/", "throw_attack_", 5],
  ["shoot", "./assets/img/character/character_sprites/shoot/", "shoot_", 6],
  ["dizzy", "./assets/img/character/character_sprites/dizzy/", "dizzy_", 3],
  ["hurt", "./assets/img/character/character_sprites/hurt/", "hurt_", 2],
  ["die", "./assets/img/character/character_sprites/die/", "die_", 10],
  ["hitStars", "./assets/img/character/spriter_files/", "star_", 3],
];
const ENEMY1_KEYS = ["idle", "walk", "attack", "die"];
const ENEMY2_KEYS = ["idle", "run", "attack1", "attack2", "die"];
const ENEMY3_KEYS = ["idle", "run", "attack1", "attack2", "slide", "die"];
const BOSS_KEYS = ["idle", "walk", "run", "attack1", "attack2", "hurt", "die", "jump"];

/**
 * Creates background images.
 * Used to set up required data for gameplay flow.
 * @returns {Array<any>} Background images.
 */
function createBackgroundImages() {
  return [
    loadImage("./assets/img/game_bg_image_layers/bg/game-background-layer-1.png"),
    loadImage("./assets/img/game_bg_image_layers/bg/game-background-layer-2.png"),
    loadImage("./assets/img/game_bg_image_layers/bg/game-background-layer-3.png"),
    loadImage("./assets/img/game_bg_image_layers/bg/game-background-layer-4.png"),
    loadImage("./assets/img/game_bg_image_layers/clouds/clouds-1.png"),
    loadImage("./assets/img/game_bg_image_layers/clouds/clouds-2.png"),
  ];
}

/**
 * Creates platform sprites.
 * Used to set up required data for platform collision handling.
 * @returns {Object} Platform sprites.
 */
function createPlatformSprites() {
  return {
    startLong: loadImage("./assets/img/platforms/platform-start-long.png"),
    middleLong: loadImage("./assets/img/platforms/platform-middle-long.png"),
    endLong: loadImage("./assets/img/platforms/platform-end-long.png"),
    startShort: loadImage("./assets/img/platforms/platform-start-short.png"),
    middleShort: loadImage("./assets/img/platforms/platform-middle-short.png"),
    endShort: loadImage("./assets/img/platforms/platform-end-short.png"),
    small: loadImage("./assets/img/platforms/platform-small.png"),
    middleHigh: loadImage("./assets/img/platforms/platform-middle-high.png"),
    filler: loadImage("./assets/img/platforms/platform-filler.png"),
  };
}

/**
 * Creates player frames.
 * Used to set up required data for world state updates.
 * @returns {*} Player frames.
 */
function createPlayerFrames() {
  return Object.fromEntries(
    PLAYER_FRAME_CONFIG.map(([key, path, prefix, count]) => [key, loadFrames(path, prefix, count)])
  );
}

/**
 * Creates enemy sprites.
 * Used to set up required data for world state updates.
 * @returns {Object} Enemy sprites.
 */
function createEnemySprites() {
  return {
    enemy1Sprites: loadEnemy1Sprites(),
    enemy2Sprites: loadEnemy2Sprites(),
    enemy3Sprites: loadEnemy3Sprites(),
  };
}

/**
 * Creates boss sprites.
 * Used to set up required data for world state updates.
 * @returns {*} Boss sprites.
 */
function createBossSprites() {
  return loadBossSprites();
}

/**
 * Creates hud images.
 * Used to set up required data for UI interaction handling.
 * @returns {Object} Hud images.
 */
function createHudImages() {
  return {
    hudCoinImg: loadImage("./assets/img/coin/coin_0000000.png"),
    hudGunImg: loadImage("./assets/img/character/spriter_files/gun.png"),
    menuBgImg: loadImage("./assets/img/menu_bg.png"),
    menuUiImg: loadImage("./assets/img/gui/game-ui.png"),
  };
}

/**
 * Collect sprites by keys.
 * Used to support collectable handling.
 * Advances animation state and sprites.
 * @param {HTMLImageElement} spriteSet Sprite set.
 * @param {*} keys Keys.
 * @returns {*} Result value.
 */
function collectSpritesByKeys(spriteSet, keys) {
  return keys.flatMap((key) => spriteSet[key]);
}

/**
 * Collect enemy images.
 * Used to support collectable handling.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {EnemyBase} [options.enemy1Sprites] Enemy 1 sprites.
 * @param {EnemyBase} [options.enemy2Sprites] Enemy 2 sprites.
 * @param {EnemyBase} [options.enemy3Sprites] Enemy 3 sprites.
 */
function collectEnemyImages({ enemy1Sprites, enemy2Sprites, enemy3Sprites }) {
  return [
    ...collectSpritesByKeys(enemy1Sprites, ENEMY1_KEYS),
    ...collectSpritesByKeys(enemy2Sprites, ENEMY2_KEYS),
    ...collectSpritesByKeys(enemy3Sprites, ENEMY3_KEYS),
  ];
}

/**
 * Builds image list.
 * Used to assemble required data for rendering.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.bgImages] Bg images.
 * @param {Platform} [options.platformSprites] Platform sprites.
 * @param {Player} [options.playerFrames] Player frames.
 * @param {EnemyBase} [options.enemySprites] Enemy sprites.
 * @param {Boss} [options.bossSprites] Boss sprites.
 * @param {HTMLImageElement} [options.hudCoinImg] Hud coin img.
 * @param {HTMLImageElement} [options.hudGunImg] Hud gun img.
 * @param {HTMLImageElement} [options.menuBgImg] Menu bg img.
 * @param {HTMLImageElement} [options.menuUiImg] Menu ui img.
 */
function buildImageList({ bgImages, platformSprites, playerFrames, enemySprites, bossSprites, hudCoinImg, hudGunImg, menuBgImg, menuUiImg }) {
  const platformImages = Object.values(platformSprites);
  const playerImages = collectSpritesByKeys(playerFrames, PLAYER_FRAME_KEYS);
  const enemyImages = collectEnemyImages(enemySprites);
  const bossImages = collectSpritesByKeys(bossSprites, BOSS_KEYS);
  return [...bgImages, ...platformImages, ...playerImages, ...enemyImages, ...bossImages, hudCoinImg, hudGunImg, menuBgImg, menuUiImg];
}

/**
 * Builds base assets.
 * Used to assemble required data for gameplay flow.
 * @returns {Object} Base assets.
 */
function buildBaseAssets() {
  const bgImages = createBackgroundImages();
  const platformSprites = createPlatformSprites();
  const playerFrames = createPlayerFrames();
  const enemySprites = createEnemySprites();
  const bossSprites = createBossSprites();
  const hudImages = createHudImages();
  return { bgImages, platformSprites, playerFrames, enemySprites, bossSprites, ...hudImages };
}

/**
 * Creates game assets.
 * Used to set up required data for gameplay flow.
 * @returns {Object} Game assets.
 */
export function createGameAssets() {
  const assetBundle = buildBaseAssets();
  const images = buildImageList(assetBundle);
  return { ...assetBundle, images };
}

