import { PlatformBuilder } from "../../engine/world/platformBuilder.class.js";
import { CollectableItem } from "../items/collectableItem.class.js";
import { Enemy1 } from "../entities/enemies/enemy1.class.js";
import { Enemy2 } from "../entities/enemies/enemy2.class.js";
import { Enemy3 } from "../entities/enemies/enemy3.class.js";
import { WORLD_WIDTH } from "../../config/config.js";

const MIN_COIN_X = 200;

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
  totalCount = 20,
  ratioAbovePlatforms = 0.5
) {
  const coins = [];
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

  /** ----- COINS ----- */
  for (let spawnAttempt = 0; spawnAttempt < coinsAbove; spawnAttempt++) {
    const platform =
      world.platforms[Math.floor(Math.random() * world.platforms.length)];
    const width = platform.right - platform.left;

    if (width < minPlatformWidth) continue;

    const minX = Math.max(platform.left, MIN_COIN_X);
    const maxX = platform.right - maxRightMargin;
    if (maxX <= minX) continue;

    const x = minX + Math.random() * (maxX - minX);
    const y = platform.y - platformCoinYOffset;

    if (world.coinPositionIsValid(x, y, coinWidth, coinHeight)) {
      coins.push(new CollectableItem(x, y, "coin"));
    }
  }

  /** ----- RANDOM COINS ----- */
  let placementAttempts = 0;
  while (coins.length < totalCount && placementAttempts < maxPlacementAttempts) {
    const xMin = MIN_COIN_X;
    const xMax = world.width - worldRightMargin;
    if (xMax <= xMin) break;

    const x = xMin + Math.random() * (xMax - xMin);
    const y = randomYMin + Math.random() * randomYRange;

    if (world.coinPositionIsValid(x, y, coinWidth, coinHeight)) {
      coins.push(new CollectableItem(x, y, "coin"));
    }

    placementAttempts++;
  }

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
  const arcCoinSpacing = 70;
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

      const x = currentPlatform.right + gap * arcProgress - arcXOffset;
      const y = currentPlatform.top - arcYOffset - Math.sin(arcProgress * Math.PI) * arcAmplitude +
        (nextPlatform.top - currentPlatform.top) * arcProgress;

      if (x < MIN_COIN_X) continue;

      if (world.coinPositionIsValid(x, y, coinWidth, coinHeight)) {
        arcs.push(new CollectableItem(x, y, "coin"));
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

  const farFromHearts = (x, y) =>
    heartCenters.every((heartCenter) => {
      return Math.hypot(heartCenter.x - x, heartCenter.y - y) >= minHeartDistance;
    });

  const targets = [
    WORLD_WIDTH * 0.15,
    WORLD_WIDTH * 0.38,
    WORLD_WIDTH * 0.62,
    WORLD_WIDTH * 0.86,
  ].slice(0, count);

  targets.forEach((targetX) => {
    const platformUnderTarget = world.platforms.find(
      (platform) => targetX >= platform.left && targetX <= platform.right
    );
    if (!platformUnderTarget) return;

    const platformMinX = platformUnderTarget.left + 10;
    const platformMaxX = platformUnderTarget.right - 60;
    const baseX = Math.min(Math.max(targetX, platformMinX), platformMaxX);
    const gunY = platformUnderTarget.top - 80;

    // try base position first, then shift left/right to avoid hearts range
    const placementOffsets = [0, 150, -150, 250, -250];
    let placed = false;

    for (const offset of placementOffsets) {
      const placementX = Math.min(
        Math.max(baseX + offset, platformMinX),
        platformMaxX
      );
      const centerX = placementX + 25;
      const centerY = gunY + 25;

      if (farFromHearts(centerX, centerY)) {
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

  const platforms = world.platforms
    .filter((platform) => platform.width > 80 && platform.top <= world.baseGround)
    .filter((platform) => platform.supportsLanding)
    .filter((platform) => platform.left > 200)
    .filter((platform) => platform.right <= WORLD_WIDTH - 1000);

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
    const enemyX = Math.min(Math.max(platform.left + 60, platform.left + 20), platform.right - 120);
    const enemyY = platform.top - 110;
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

  const spawnMinX = WORLD_WIDTH * 0.25;
  const spawnMidX = WORLD_WIDTH * 0.5;
  const spawnMaxX = WORLD_WIDTH * 0.95;
  const maxHeartX = WORLD_WIDTH - 50;

  const positions = [
    Math.random() * (WORLD_WIDTH * 0.2) + spawnMinX,
    Math.random() * (WORLD_WIDTH * 0.25) + spawnMidX,
    Math.random() * (WORLD_WIDTH * 0.1) + spawnMaxX,
  ];

  for (let heartIndex = 0; heartIndex < count; heartIndex++) {
    const x = Math.min(positions[heartIndex], maxHeartX);

    const platform = world.platforms.find(
      (platform) => x >= platform.x && x <= platform.x + platform.width
    );

    if (!platform) continue;

    const y = platform.y - heartYOffset;

    if (!isInsidePlatform(world, x, y)) {
      validHearts.push(new CollectableItem(x, y, "heart"));
    }
  }

  world.addCollectables(validHearts);
}

function isInsidePlatform(world, heartX, heartY) {
  const heartSize = 30;
  return world.platforms.some(
    (platform) =>
      heartX + heartSize > platform.x &&
      heartX < platform.x + platform.width &&
      heartY + heartSize > platform.y &&
      heartY < platform.y + platform.height
  );
}
