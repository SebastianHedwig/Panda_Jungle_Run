import { loadFrames, loadImage } from "./assetLoader.js";
import { loadEnemy1Sprites } from "../../../game/entities/enemies/enemy1.class.js";
import { loadEnemy2Sprites } from "../../../game/entities/enemies/enemy2.class.js";
import { loadEnemy3Sprites } from "../../../game/entities/enemies/enemy3.class.js";
import { loadBossSprites } from "../../../game/entities/boss/boss.class.js";

const PLAYER_FRAME_KEYS = ["idle", "walk", "run", "jump", "slide", "attack", "shoot", "dizzy", "hurt", "die", "hitStars"];
const PLAYER_FRAME_CONFIG = [
  ["idle", "./assets/img/Character/Character_Sprites/idle/", "Idle_", 10],
  ["walk", "./assets/img/Character/Character_Sprites/walk/", "walk_", 10],
  ["run", "./assets/img/Character/Character_Sprites/run/", "Run_", 8],
  ["jump", "./assets/img/Character/Character_Sprites/jump/", "Jump_", 5],
  ["slide", "./assets/img/Character/Character_Sprites/slide/", "Sliding_", 4],
  ["attack", "./assets/img/Character/Character_Sprites/throw/", "Throw_Attack_", 5],
  ["shoot", "./assets/img/Character/Character_Sprites/shoot/", "Shoot_", 6],
  ["dizzy", "./assets/img/Character/Character_Sprites/dizzy/", "Dizzy_", 3],
  ["hurt", "./assets/img/Character/Character_Sprites/hurt/", "hurt_", 2],
  ["die", "./assets/img/Character/Character_Sprites/die/", "Die_", 10],
  ["hitStars", "./assets/img/Character/Spriter_files/", "Star_", 3],
];
const ENEMY1_KEYS = ["idle", "walk", "attack", "die"];
const ENEMY2_KEYS = ["idle", "run", "attack1", "attack2", "die"];
const ENEMY3_KEYS = ["idle", "run", "attack1", "attack2", "slide", "die"];
const BOSS_KEYS = ["idle", "walk", "run", "attack1", "attack2", "hurt", "die", "jump"];

function createBackgroundImages() {
  return [
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-2.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-3.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-4.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/clouds/clouds-2.png"),
  ];
}

function createPlatformSprites() {
  return {
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
}

function createPlayerFrames() {
  return Object.fromEntries(
    PLAYER_FRAME_CONFIG.map(([key, path, prefix, count]) => [key, loadFrames(path, prefix, count)])
  );
}

function createEnemySprites() {
  return {
    enemy1Sprites: loadEnemy1Sprites(),
    enemy2Sprites: loadEnemy2Sprites(),
    enemy3Sprites: loadEnemy3Sprites(),
  };
}

function createBossSprites() {
  return loadBossSprites();
}

function createHudImages() {
  return {
    hudCoinImg: loadImage("./assets/img/Coin/Coin_0000000.png"),
    hudGunImg: loadImage("./assets/img/Character/Spriter_files/gun.png"),
    menuBgImg: loadImage("./assets/img/menu_BG.png"),
    menuUiImg: loadImage("./assets/img/Gui/Game-UI.png"),
  };
}

function collectSpritesByKeys(spriteSet, keys) {
  return keys.flatMap((key) => spriteSet[key]);
}

function collectEnemyImages({ enemy1Sprites, enemy2Sprites, enemy3Sprites }) {
  return [
    ...collectSpritesByKeys(enemy1Sprites, ENEMY1_KEYS),
    ...collectSpritesByKeys(enemy2Sprites, ENEMY2_KEYS),
    ...collectSpritesByKeys(enemy3Sprites, ENEMY3_KEYS),
  ];
}

function buildImageList({ bgImages, platformSprites, playerFrames, enemySprites, bossSprites, hudCoinImg, hudGunImg, menuBgImg, menuUiImg }) {
  const platformImages = Object.values(platformSprites);
  const playerImages = collectSpritesByKeys(playerFrames, PLAYER_FRAME_KEYS);
  const enemyImages = collectEnemyImages(enemySprites);
  const bossImages = collectSpritesByKeys(bossSprites, BOSS_KEYS);
  return [...bgImages, ...platformImages, ...playerImages, ...enemyImages, ...bossImages, hudCoinImg, hudGunImg, menuBgImg, menuUiImg];
}

function buildBaseAssets() {
  const bgImages = createBackgroundImages();
  const platformSprites = createPlatformSprites();
  const playerFrames = createPlayerFrames();
  const enemySprites = createEnemySprites();
  const bossSprites = createBossSprites();
  const hudImages = createHudImages();
  return { bgImages, platformSprites, playerFrames, enemySprites, bossSprites, ...hudImages };
}

export function createGameAssets() {
  const assetBundle = buildBaseAssets();
  const images = buildImageList(assetBundle);
  return { ...assetBundle, images };
}
