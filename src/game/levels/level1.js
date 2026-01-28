import { PlatformBuilder } from "../../engine/world/platformBuilder.class.js";
import { CollectableItem } from "../items/collectableItem.class.js";
import { Enemy1 } from "../entities/enemies/enemy1.class.js";
import { Enemy2 } from "../entities/enemies/enemy2.class.js";
import { Enemy3 } from "../entities/enemies/enemy3.class.js";
import { WORLD_WIDTH } from "../../config/config.js";

const MIN_COIN_X = 200; // avoid placing coins too close to level start
const BOSS_AREA_START = WORLD_WIDTH * 0.9; // last 10% of the level

/** ---------- PLATFORM SETUP ---------- */
export function createLevel1Platforms(sprites) {
  const platforms = [];
  const build = new PlatformBuilder(platforms, sprites);

  /* ---- FILLER OFFSETS ---- */
  const fillerWidth = sprites["filler"].width;
  const fillerOffsetLarge = 6;
  const fillerOffsetSmall = 1;

  /* ---- BASE GROUND ---- */
  build.add("middleLong", 0, 650);
  build.add("middleLong", 1360, 650);
  build.add("middleShort", 2520, 450);
  build.stackFiller(2520, 465, 3, 2, fillerWidth - fillerOffsetLarge);
  build.add("endLong", 2968.5, 650);
  build.row(4250, 650, 2, "middleLong");
  build.stackFiller(4022, 265, 10, 1, fillerWidth);
  build.add("startLong", 7100, 500);
  build.add("endLong", 7550, 500);
  build.stackFiller(7150, 515, 3, 4, fillerWidth - fillerOffsetSmall);
  build.row(8350, 650, 2, "middleLong");

  /* ---- HIGHER LVL PLATFORMS ---- */
  build.add("startLong", 265, 250);
  build.add("endLong", 810, 250);

  build.add("startLong", 3955, 250);
  build.add("endLong", 4500, 250);

  build.add("startLong", 5500, 380);
  build.add("endLong", 6200, 300);

  /* ---- FLOATING ISLANDS ---- */
  build.islandSmall(1600, 400);
  build.islandSmall(3200, 350);
  build.islandSmall(3500, 250);
  build.islandSmall(3750, 500);
  build.islandSmall(6750, 550);
  build.islandSmall(7000, 350);
  build.islandSmall(7400, 200);
  build.islandSmall(8200, 300);
  build.islandSmall(9300, 350);
  build.islandSmall(9800, 300);

  return platforms;
}

/** ---------- RANDOM + PLATFORM COINS ---------- */
export function generateCoinsMixed(
  world,
  totalCount = 60,
  ratioAbovePlatforms = 0.5
) {
  const coins = [];
  const minCoinSpacing = 60;
  const rowSpacing = 60;
  const minRowPlatformWidth = 220;
  const maxRowLength = 6;
  const rowProbability = 0.7;
  const coinsAbove = Math.floor(totalCount * ratioAbovePlatforms);
  const minPlatformWidth = 100;
  const maxRightMargin = 60;
  const platformCoinYOffset = 80;
  const coinWidth = 50;
  const coinHeight = 50;
  const maxPlacementAttempts = totalCount * 40;
  const randomYMin = 220;
  const randomYRange = 380;
  const worldRightMargin = 100;
  const firstThirdEndX = world.width / 3;
  const platformEarlyShare = 0.4; // share of platform coins placed in the first third
  const randomEarlyShare = 0.4;   // share of random coins placed in the first third

  /** ----- PLATFORM COINS ----- */
  const earlyPlatformCoins = Math.floor(coinsAbove * platformEarlyShare);
  const latePlatformCoins = coinsAbove - earlyPlatformCoins;

  const placePlatformCoins = (count, maxXLimit) => {
    for (let spawnAttempt = 0; spawnAttempt < count; spawnAttempt++) {
      const platform =
        world.platforms[Math.floor(Math.random() * world.platforms.length)];
      const width = platform.right - platform.left;

      if (width < minPlatformWidth) continue;

      const worldXMin = Math.max(platform.left, MIN_COIN_X);
      const worldXMax = Math.min(
        platform.right - maxRightMargin,
        maxXLimit - maxRightMargin,
        BOSS_AREA_START - maxRightMargin
      );
      if (worldXMax <= worldXMin) continue;

      const shouldPlaceRow =
        width >= minRowPlatformWidth &&
        worldXMax - worldXMin > rowSpacing &&
        Math.random() < rowProbability;

      if (shouldPlaceRow) {
        const rowCoinCount = Math.min(
          maxRowLength,
          Math.floor((worldXMax - worldXMin) / rowSpacing)
        );
        const startWorldX = worldXMin + rowSpacing / 2;
        const worldY = platform.y - platformCoinYOffset;
        for (let coinIndex = 0; coinIndex < rowCoinCount; coinIndex++) {
          const worldX = startWorldX + coinIndex * rowSpacing;
          if (world.coinPositionIsValid(worldX, worldY, coinWidth, coinHeight, coins, minCoinSpacing)) {
            coins.push(new CollectableItem(worldX, worldY, "coin"));
          }
        }
      } else {
        const worldX = worldXMin + Math.random() * (worldXMax - worldXMin);
        const worldY = platform.y - platformCoinYOffset;

        if (world.coinPositionIsValid(worldX, worldY, coinWidth, coinHeight, coins, minCoinSpacing)) {
          coins.push(new CollectableItem(worldX, worldY, "coin"));
        }
      }
    }
  };

  placePlatformCoins(earlyPlatformCoins, firstThirdEndX);
  placePlatformCoins(latePlatformCoins, BOSS_AREA_START);

  /** ----- RANDOM COINS ----- */
  let placementAttempts = 0;
  const randomCoinsTarget = totalCount - coins.length;
  const earlyRandomCoins = Math.floor(randomCoinsTarget * randomEarlyShare);
  const lateRandomCoins = randomCoinsTarget - earlyRandomCoins;

  const placeRandomCoins = (count, xMaxLimit) => {
    let placed = 0;
    while (placed < count && placementAttempts < maxPlacementAttempts) {
      const worldXMin = MIN_COIN_X;
      const worldXMax = Math.min(world.width - worldRightMargin, xMaxLimit - worldRightMargin, BOSS_AREA_START - worldRightMargin);
      if (worldXMax <= worldXMin) break;

      const worldX = worldXMin + Math.random() * (worldXMax - worldXMin);
      const worldY = randomYMin + Math.random() * randomYRange;

      if (world.coinPositionIsValid(worldX, worldY, coinWidth, coinHeight, coins, minCoinSpacing)) {
        coins.push(new CollectableItem(worldX, worldY, "coin"));
        placed++;
      }

      placementAttempts++;
    }
  };

  placeRandomCoins(earlyRandomCoins, firstThirdEndX);
  placeRandomCoins(lateRandomCoins, BOSS_AREA_START);

  return coins;
}

/** ---------- COIN ARCS ---------- */
export function generateCoinArcs(world, maxArcs = 4) {
  const arcs = [];
  let created = 0;

  const platforms = world.platforms.sort((a, b) => a.left - b.left);
  const minJumpGap = 150;
  const maxJumpGap = 700;
  const minHeightDiff = 10;
  const arcWidthScale = 0.85;
  const arcWidthMax = 350;
  const arcCoinSpacing = 55;
  const minCoinSpacing = 55;
  const arcXOffset = 25;
  const arcYOffset = 110;
  const arcAmplitude = 160;
  const coinWidth = 50;
  const coinHeight = 50;

  for (let platformIndex = 0; platformIndex < platforms.length - 1; platformIndex++) {
    if (created >= maxArcs) break;

    const currentPlatform = platforms[platformIndex];
    const nextPlatform = platforms[platformIndex + 1];

    const gap = nextPlatform.left - currentPlatform.right;
    const heightDiff = Math.abs(nextPlatform.top - currentPlatform.top);

    const mustJump = gap >= minJumpGap && gap <= maxJumpGap && heightDiff > minHeightDiff;

    if (!mustJump) continue;

    /** ----- ARC PARAMETER ----- */
    const arcWidth = Math.min(gap * arcWidthScale, arcWidthMax);
    const coinsInArc = Math.floor(arcWidth / arcCoinSpacing);

    for (let coinIndex = 0; coinIndex < coinsInArc; coinIndex++) {
      const arcProgress = coinIndex / (coinsInArc - 1);

      const worldX = currentPlatform.right + gap * arcProgress - arcXOffset;
      const worldY = currentPlatform.top - arcYOffset - Math.sin(arcProgress * Math.PI) * arcAmplitude +
        (nextPlatform.top - currentPlatform.top) * arcProgress;

      if (worldX < MIN_COIN_X) continue;
      if (worldX >= BOSS_AREA_START) continue;

      if (world.coinPositionIsValid(worldX, worldY, coinWidth, coinHeight, arcs, minCoinSpacing)) {
        arcs.push(new CollectableItem(worldX, worldY, "coin"));
      }
    }

    created++;
  }

  return arcs;
}

/** ---------- FIXED COINS ---------- */
export function createLevel1Collectables() {
  return [];
}

export function placeGuns(world, count = 4) {
  const guns = [];
  const minHeartDistance = 300;

  const heartCenters =
    world.collectables
      ?.filter((collectable) => collectable.type === "heart")
      .map((collectable) => ({
        x: collectable.x + collectable.width / 2,
        y: collectable.y + collectable.height / 2,
      })) || [];

  const farFromHearts = (worldX, worldY) =>
    heartCenters.every((heartCenter) => {
      return Math.hypot(heartCenter.x - worldX, heartCenter.y - worldY) >= minHeartDistance;
    });

  const gunTargetFractions = [0.15, 0.38, 0.62, 0.86];
  const targets = gunTargetFractions.map((fraction) => WORLD_WIDTH * fraction).slice(0, count);

  targets.forEach((targetX) => {
    const platformUnderTarget = world.platforms.find(
      (platform) => targetX >= platform.left && targetX <= platform.right
    );
    if (!platformUnderTarget) return;

    const gunPaddingLeft = 10;
    const gunPaddingRight = 60;
    const gunYOffset = 80;
    const gunHalfSize = 25;
    const platformMinX = platformUnderTarget.left + gunPaddingLeft;
    const platformMaxX = platformUnderTarget.right - gunPaddingRight;
    const baseX = Math.min(Math.max(targetX, platformMinX), platformMaxX);
    const gunY = platformUnderTarget.top - gunYOffset;

    // try base position first, then shift left/right to avoid hearts range
    const placementOffsets = [0, 150, -150, 250, -250];
    let placed = false;

    for (const offset of placementOffsets) {
      const placementX = Math.min(
        Math.max(baseX + offset, platformMinX),
        platformMaxX
      );
      const centerWorldX = placementX + gunHalfSize;
      const centerWorldY = gunY + gunHalfSize;

      if (farFromHearts(centerWorldX, centerWorldY)) {
        guns.push(new CollectableItem(placementX, gunY, "gun"));
        placed = true;
        break;
      }
    }

    if (!placed) {
      guns.push(new CollectableItem(baseX, gunY, "gun"));
    }
  });

  world.addCollectables(guns);
}

export function placeEnemiesMixed(
  world,
  enemy1Sprites,
  enemy2Sprites,
  enemy3Sprites,
  enemy1Count = 5,
  enemy2Count = 5,
  enemy3Count = 2
) {
  const totalRequested = Math.max(0, (enemy1Count || 0) + (enemy2Count || 0) + (enemy3Count || 0));
  if (totalRequested === 0) return;

  const minPlatformWidthForEnemies = 80;
  const minPlatformLeftMargin = 200;
  const bossAreaBuffer = 1000;

  const platforms = world.platforms
    .filter((platform) => platform.width > minPlatformWidthForEnemies && platform.top <= world.baseGround)
    .filter((platform) => platform.supportsLanding)
    .filter((platform) => platform.left > minPlatformLeftMargin)
    .filter((platform) => platform.right <= WORLD_WIDTH - bossAreaBuffer);

  // Shuffle platforms to randomize placement order
  for (let platformIndex = platforms.length - 1; platformIndex > 0; platformIndex--) {
    const swapIndex = Math.floor(Math.random() * (platformIndex + 1));
    [platforms[platformIndex], platforms[swapIndex]] = [platforms[swapIndex], platforms[platformIndex]];
  }
  // (Fisher‑Yates‑Shuffle) 
  const enemyMix = [];
  for (let enemyIndex = 0; enemyIndex < enemy1Count; enemyIndex++) enemyMix.push("e1");
  for (let enemyIndex = 0; enemyIndex < enemy2Count; enemyIndex++) enemyMix.push("e2");
  for (let enemyIndex = 0; enemyIndex < enemy3Count; enemyIndex++) enemyMix.push("e3");

  // Shuffle enemy mix to randomize which type goes where
  for (let mixIndex = enemyMix.length - 1; mixIndex > 0; mixIndex--) {
    const swapIndex = Math.floor(Math.random() * (mixIndex + 1));
    [enemyMix[mixIndex], enemyMix[swapIndex]] = [enemyMix[swapIndex], enemyMix[mixIndex]];
  }

  const enemies = [];
  const usable = Math.min(platforms.length, enemyMix.length);
  for (let placementIndex = 0; placementIndex < usable; placementIndex++) {
    const platform = platforms[placementIndex];
    const enemyPaddingLeft = 60;
    const enemyPaddingRight = 120;
    const enemyMinLeftPadding = 20;
    const enemyYOffset = 110;
    const enemyX = Math.min(
      Math.max(platform.left + enemyPaddingLeft, platform.left + enemyMinLeftPadding),
      platform.right - enemyPaddingRight
    );
    const enemyY = platform.top - enemyYOffset;
    const enemyType = enemyMix[placementIndex];

    if (enemyType === "e2" && enemy2Sprites) {
      enemies.push(new Enemy2(enemyX, enemyY, enemy2Sprites, world));
    } else if (enemyType === "e3" && enemy3Sprites) {
      enemies.push(new Enemy3(enemyX, enemyY, enemy3Sprites, world));
    } else if (enemy1Sprites) {
      enemies.push(new Enemy1(enemyX, enemyY, enemy1Sprites, world));
    }
  }

  if (enemies.length) world.addEnemies(enemies);
}

export function placeHearts(world, count = 4) {
  const validHearts = [];
  const heartYOffset = 80;

  const heartSpawnMin1 = 0.25;
  const heartSpawnRange1 = 0.20;
  const heartSpawnMin2 = 0.50;
  const heartSpawnRange2 = 0.25;
  const heartSpawnMin3 = 0.95;
  const heartSpawnRange3 = 0.10;
  const heartEdgePadding = 50;
  const maxHeartX = WORLD_WIDTH - heartEdgePadding;
  
  const positions = [
    WORLD_WIDTH * heartSpawnMin1 + Math.random() * (WORLD_WIDTH * heartSpawnRange1),
    WORLD_WIDTH * heartSpawnMin2 + Math.random() * (WORLD_WIDTH * heartSpawnRange2),
    WORLD_WIDTH * heartSpawnMin3 + Math.random() * (WORLD_WIDTH * heartSpawnRange3),
  ];

  for (let heartIndex = 0; heartIndex < count; heartIndex++) {
    const worldX = Math.min(positions[heartIndex], maxHeartX);

    const platform = world.platforms.find(
      (platform) => worldX >= platform.x && worldX <= platform.x + platform.width
    );

    if (!platform) continue;

    const worldY = platform.y - heartYOffset;

    if (!isInsidePlatform(world, worldX, worldY)) {
      validHearts.push(new CollectableItem(worldX, worldY, "heart"));
    }
  }

  world.addCollectables(validHearts);
}

function isInsidePlatform(world, heartWorldX, heartWorldY) {
  const heartSize = 30;
  return world.platforms.some(
    (platform) =>
      heartWorldX + heartSize > platform.x &&
      heartWorldX < platform.x + platform.width &&
      heartWorldY + heartSize > platform.y &&
      heartWorldY < platform.y + platform.height
  );
}
