import { loadFrames, loadImage } from "./assetLoader.js";
import { loadEnemy1Sprites } from "../../../game/entities/enemies/enemy1.class.js";
import { loadEnemy2Sprites } from "../../../game/entities/enemies/enemy2.class.js";
import { loadEnemy3Sprites } from "../../../game/entities/enemies/enemy3.class.js";
import { loadBossSprites } from "../../../game/entities/boss/boss.class.js";

export function createGameAssets() {
  const bgImages = [
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-1.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-2.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-3.png"),
    loadImage("./assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-4.png"),
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

  const playerFrames = {
    idle: loadFrames("./assets/img/Character/Character_Sprites/idle/", "Idle_", 10),
    walk: loadFrames("./assets/img/Character/Character_Sprites/walk/", "walk_", 10),
    run: loadFrames("./assets/img/Character/Character_Sprites/run/", "Run_", 8),
    jump: loadFrames("./assets/img/Character/Character_Sprites/jump/", "Jump_", 5),
    slide: loadFrames("./assets/img/Character/Character_Sprites/slide/", "Sliding_", 4),
    attack: loadFrames("./assets/img/Character/Character_Sprites/throw/", "Throw_Attack_",5),
    shoot: loadFrames("./assets/img/Character/Character_Sprites/shoot/", "Shoot_", 6),
    dizzy: loadFrames("./assets/img/Character/Character_Sprites/dizzy/", "Dizzy_", 3),  
    hurt: loadFrames("./assets/img/Character/Character_Sprites/hurt/", "hurt_", 2),
    die: loadFrames("./assets/img/Character/Character_Sprites/die/", "Die_", 10),
    hitStars: loadFrames("./assets/img/Character/Spriter_files/", "Star_", 3),
  };

  const enemy1Sprites = loadEnemy1Sprites();
  const enemy2Sprites = loadEnemy2Sprites();
  const enemy3Sprites = loadEnemy3Sprites();
  const bossSprites = loadBossSprites();

  const hudCoinImg = loadImage("./assets/img/Coin/Coin_0000000.png");
  const hudGunImg = loadImage("./assets/img/Character/Spriter_files/gun.png");
  const menuBgImg = loadImage("./assets/img/menu_BG.png");
  const menuUiImg = loadImage("./assets/img/Gui/Game-UI.png");

  const images = [
    ...bgImages,
    ...Object.values(platformSprites),
    ...playerFrames.idle,
    ...playerFrames.walk,
    ...playerFrames.run,
    ...playerFrames.jump,
    ...playerFrames.slide,
    ...playerFrames.attack,
    ...playerFrames.shoot,
    ...playerFrames.dizzy,
    ...playerFrames.hurt,
    ...playerFrames.die,
    ...playerFrames.hitStars,
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
    hudCoinImg,
    hudGunImg,
    menuBgImg,
    menuUiImg,
  ];

  return {
    bgImages,
    platformSprites,
    playerFrames,
    enemySprites: { enemy1Sprites, enemy2Sprites, enemy3Sprites },
    bossSprites,
    hudCoinImg,
    hudGunImg,
    menuBgImg,
    menuUiImg,
    images,
  };
}
