import { PlatformBuilder } from "../../engine/world/platformBuilder.class.js";
import { CollectableItem } from "../items/collectableItem.class.js";
import { Enemy1 } from "../entities/enemies/enemy1.class.js";
import { Enemy2 } from "../entities/enemies/enemy2.class.js";
import { Enemy3 } from "../entities/enemies/enemy3.class.js";
import { WORLD_WIDTH } from "../../config/config.js";

const MIN_COIN_X = 200; // avoid placing coins too close to level start
const BOSS_AREA_START = WORLD_WIDTH * 0.9; // last 10% of the level

function addBaseGround(build, fillerWidth, fillerOffsetLarge, fillerOffsetSmall) {
  build.add("middleLong", 0, 650); build.add("middleLong", 1360, 650);
  build.add("middleShort", 2520, 450); build.stackFiller(2520, 465, 3, 2, fillerWidth - fillerOffsetLarge);
  build.add("endLong", 2968.5, 650); build.row(4250, 650, 2, "middleLong");
  build.stackFiller(4022, 265, 10, 1, fillerWidth); build.add("startLong", 7100, 500);
  build.add("endLong", 7550, 500); build.stackFiller(7150, 515, 3, 4, fillerWidth - fillerOffsetSmall);
  build.row(8350, 650, 2, "middleLong");
}

function addHigherLevelPlatforms(build) {
  build.add("startLong", 265, 250); build.add("endLong", 810, 250);
  build.add("startLong", 3955, 250); build.add("endLong", 4500, 250);
  build.add("startLong", 5500, 380); build.add("endLong", 6200, 300);
}

function addFloatingIslands(build) {
  build.islandSmall(1600, 400); build.islandSmall(3200, 350);
  build.islandSmall(3500, 250); build.islandSmall(3750, 500);
  build.islandSmall(6750, 550); build.islandSmall(7000, 350);
  build.islandSmall(7400, 200); build.islandSmall(8200, 300);
  build.islandSmall(9300, 350); build.islandSmall(9800, 300);
}

export function createLevel1Platforms(sprites) {
  const platforms = [];
  const build = new PlatformBuilder(platforms, sprites);
  const fillerWidth = sprites["filler"].width, fillerOffsetLarge = 6, fillerOffsetSmall = 1;

  addBaseGround(build, fillerWidth, fillerOffsetLarge, fillerOffsetSmall);
  addHigherLevelPlatforms(build);
  addFloatingIslands(build);

  return platforms;
}

function buildCoinPlacementConfig(world, totalCount, ratioAbovePlatforms) {
  const minCoinSpacing = 60, rowSpacing = 60, minRowPlatformWidth = 220, maxRowLength = 6, rowProbability = 0.7;
  const coinsAbove = Math.floor(totalCount * ratioAbovePlatforms), minPlatformWidth = 100, maxRightMargin = 60, platformCoinYOffset = 80, coinWidth = 50, coinHeight = 50;
  const maxPlacementAttempts = totalCount * 40, randomYMin = 220, randomYRange = 380, worldRightMargin = 100, firstThirdEndX = world.width / 3;
  const platformEarlyShare = 0.4; // share of platform coins placed in the first third
  const randomEarlyShare = 0.4;   // share of random coins placed in the first third
  return { minCoinSpacing, rowSpacing, minRowPlatformWidth, maxRowLength, rowProbability, coinsAbove, minPlatformWidth, maxRightMargin, platformCoinYOffset, coinWidth, coinHeight, maxPlacementAttempts, randomYMin, randomYRange, worldRightMargin, firstThirdEndX, platformEarlyShare, randomEarlyShare, totalCount };
}

function getRandomPlatform(world) {
  return world.platforms[Math.floor(Math.random() * world.platforms.length)];
}

function getPlatformCoinRange(platform, maxXLimit, config) {
  const width = platform.right - platform.left;
  if (width < config.minPlatformWidth) return null;
  const worldXMin = Math.max(platform.left, MIN_COIN_X);
  const worldXMax = Math.min(platform.right - config.maxRightMargin, maxXLimit - config.maxRightMargin, BOSS_AREA_START - config.maxRightMargin);
  if (worldXMax <= worldXMin) return null;
  return { width, worldXMin, worldXMax };
}

function shouldPlacePlatformRow(config, placement) {
  const { width, worldXMin, worldXMax } = placement;
  return width >= config.minRowPlatformWidth && worldXMax - worldXMin > config.rowSpacing && Math.random() < config.rowProbability;
}

function getPlatformRowParams(placement, config, platform) {
  const { worldXMin, worldXMax } = placement;
  const rowCoinCount = Math.min(config.maxRowLength, Math.floor((worldXMax - worldXMin) / config.rowSpacing));
  const startWorldX = worldXMin + config.rowSpacing / 2;
  const worldY = platform.y - config.platformCoinYOffset;
  return { rowCoinCount, startWorldX, worldY };
}

function tryAddCoin(world, coins, worldX, worldY, config) {
  const { coinWidth, coinHeight, minCoinSpacing } = config;
  if (!world.coinPositionIsValid(worldX, worldY, coinWidth, coinHeight, coins, minCoinSpacing)) return false;
  coins.push(new CollectableItem(worldX, worldY, "coin"));
  return true;
}

function placePlatformRowCoins(world, coins, platform, placement, config) {
  const { rowCoinCount, startWorldX, worldY } = getPlatformRowParams(placement, config, platform);
  for (let coinIndex = 0; coinIndex < rowCoinCount; coinIndex++) {
    const worldX = startWorldX + coinIndex * config.rowSpacing;
    tryAddCoin(world, coins, worldX, worldY, config);
  }
}

function placeSinglePlatformCoin(world, coins, platform, placement, config) {
  const worldX = placement.worldXMin + Math.random() * (placement.worldXMax - placement.worldXMin);
  const worldY = platform.y - config.platformCoinYOffset;
  tryAddCoin(world, coins, worldX, worldY, config);
}

function placePlatformCoinsBatch(world, coins, config, count, maxXLimit) {
  for (let spawnAttempt = 0; spawnAttempt < count; spawnAttempt++) {
    const platform = getRandomPlatform(world);
    const placement = getPlatformCoinRange(platform, maxXLimit, config);
    if (!placement) continue;
    if (shouldPlacePlatformRow(config, placement)) placePlatformRowCoins(world, coins, platform, placement, config);
    else placeSinglePlatformCoin(world, coins, platform, placement, config);
  }
}

function placePlatformCoins(world, coins, config) {
  const earlyPlatformCoins = Math.floor(config.coinsAbove * config.platformEarlyShare);
  const latePlatformCoins = config.coinsAbove - earlyPlatformCoins;
  placePlatformCoinsBatch(world, coins, config, earlyPlatformCoins, config.firstThirdEndX);
  placePlatformCoinsBatch(world, coins, config, latePlatformCoins, BOSS_AREA_START);
}

function getRandomCoinPosition(world, config, xMaxLimit) {
  const worldXMin = MIN_COIN_X;
  const worldXMax = Math.min(world.width - config.worldRightMargin, xMaxLimit - config.worldRightMargin, BOSS_AREA_START - config.worldRightMargin);
  const worldX = worldXMin + Math.random() * (worldXMax - worldXMin);
  const worldY = config.randomYMin + Math.random() * config.randomYRange;
  return { worldXMin, worldXMax, worldX, worldY };
}

function placeRandomCoinBatch(world, coins, config, count, xMaxLimit, placementAttempts) {
  let placed = 0;
  while (placed < count && placementAttempts < config.maxPlacementAttempts) {
    const { worldXMin, worldXMax, worldX, worldY } = getRandomCoinPosition(world, config, xMaxLimit);
    if (worldXMax <= worldXMin) break;
    if (tryAddCoin(world, coins, worldX, worldY, config)) placed++;
    placementAttempts++;
  }
  return placementAttempts;
}

function placeRandomCoins(world, coins, config) {
  let placementAttempts = 0;
  const randomCoinsTarget = config.totalCount - coins.length;
  const earlyRandomCoins = Math.floor(randomCoinsTarget * config.randomEarlyShare);
  const lateRandomCoins = randomCoinsTarget - earlyRandomCoins;
  placementAttempts = placeRandomCoinBatch(world, coins, config, earlyRandomCoins, config.firstThirdEndX, placementAttempts);
  placeRandomCoinBatch(world, coins, config, lateRandomCoins, BOSS_AREA_START, placementAttempts);
}

function buildCoinArcConfig(maxArcs) {
  const minJumpGap = 150, maxJumpGap = 700, minHeightDiff = 10, arcWidthScale = 0.85, arcWidthMax = 350;
  const arcCoinSpacing = 55, minCoinSpacing = 55, arcXOffset = 25, arcYOffset = 110, arcAmplitude = 160;
  const coinWidth = 50, coinHeight = 50;
  return { maxArcs, minJumpGap, maxJumpGap, minHeightDiff, arcWidthScale, arcWidthMax, arcCoinSpacing, minCoinSpacing, arcXOffset, arcYOffset, arcAmplitude, coinWidth, coinHeight };
}

function getSortedPlatforms(world) {
  return world.platforms.sort((a, b) => a.left - b.left);
}

function getArcParams(currentPlatform, nextPlatform, config) {
  const gap = nextPlatform.left - currentPlatform.right;
  const heightDiff = Math.abs(nextPlatform.top - currentPlatform.top);
  const mustJump = gap >= config.minJumpGap && gap <= config.maxJumpGap && heightDiff > config.minHeightDiff;
  if (!mustJump) return null;
  const arcWidth = Math.min(gap * config.arcWidthScale, config.arcWidthMax);
  const coinsInArc = Math.floor(arcWidth / config.arcCoinSpacing);
  return { gap, coinsInArc };
}

function getArcCoinWorldPosition(coinIndex, coinsInArc, currentPlatform, nextPlatform, gap, config) {
  const arcProgress = coinIndex / (coinsInArc - 1);
  const worldX = currentPlatform.right + gap * arcProgress - config.arcXOffset;
  const worldY = currentPlatform.top - config.arcYOffset - Math.sin(arcProgress * Math.PI) * config.arcAmplitude +
    (nextPlatform.top - currentPlatform.top) * arcProgress;
  return { worldX, worldY };
}

function tryAddArcCoin(world, arcs, worldX, worldY, config) {
  if (!world.coinPositionIsValid(worldX, worldY, config.coinWidth, config.coinHeight, arcs, config.minCoinSpacing)) return false;
  arcs.push(new CollectableItem(worldX, worldY, "coin"));
  return true;
}

function placeArcCoins(world, arcs, currentPlatform, nextPlatform, config) {
  const arcParams = getArcParams(currentPlatform, nextPlatform, config);
  if (!arcParams) return 0;
  const { gap, coinsInArc } = arcParams;
  for (let coinIndex = 0; coinIndex < coinsInArc; coinIndex++) {
    const { worldX, worldY } = getArcCoinWorldPosition(coinIndex, coinsInArc, currentPlatform, nextPlatform, gap, config);
    if (worldX < MIN_COIN_X || worldX >= BOSS_AREA_START) continue;
    tryAddArcCoin(world, arcs, worldX, worldY, config);
  }
  return 1;
}

function placeCoinArcs(world, platforms, arcs, config) {
  let created = 0;
  for (let platformIndex = 0; platformIndex < platforms.length - 1; platformIndex++) {
    if (created >= config.maxArcs) break;
    const currentPlatform = platforms[platformIndex];
    const nextPlatform = platforms[platformIndex + 1];
    created += placeArcCoins(world, arcs, currentPlatform, nextPlatform, config);
  }
}

export function generateCoinsMixed(
  world,
  totalCount = 60,
  ratioAbovePlatforms = 0.5
) {
  const coins = [];
  const config = buildCoinPlacementConfig(world, totalCount, ratioAbovePlatforms);
  placePlatformCoins(world, coins, config);
  placeRandomCoins(world, coins, config);
  return coins;
}

export function generateCoinArcs(world, maxArcs = 4) {
  const arcs = [];
  const config = buildCoinArcConfig(maxArcs);
  const platforms = getSortedPlatforms(world);
  placeCoinArcs(world, platforms, arcs, config);
  return arcs;
}

export function createLevel1Collectables() {
  return [];
}

function getHeartCenters(world) {
  return world.collectables
    ?.filter((collectable) => collectable.type === "heart")
    .map((collectable) => ({ x: collectable.x + collectable.width / 2, y: collectable.y + collectable.height / 2 })) || [];
}

function isFarFromHearts(heartCenters, worldX, worldY, minHeartDistance) {
  return heartCenters.every((heartCenter) => Math.hypot(heartCenter.x - worldX, heartCenter.y - worldY) >= minHeartDistance);
}

function getGunTargets(count) {
  const gunTargetFractions = [0.15, 0.38, 0.62, 0.86];
  return gunTargetFractions.map((fraction) => WORLD_WIDTH * fraction).slice(0, count);
}

function findPlatformUnderTarget(world, targetX) {
  return world.platforms.find((platform) => targetX >= platform.left && targetX <= platform.right);
}

function getGunBasePlacement(platformUnderTarget, targetX) {
  const gunPaddingLeft = 10, gunPaddingRight = 60, gunYOffset = 80, gunHalfSize = 25;
  const platformMinX = platformUnderTarget.left + gunPaddingLeft;
  const platformMaxX = platformUnderTarget.right - gunPaddingRight;
  const baseX = Math.min(Math.max(targetX, platformMinX), platformMaxX);
  const gunY = platformUnderTarget.top - gunYOffset;
  return { baseX, gunY, platformMinX, platformMaxX, gunHalfSize };
}

function tryPlaceGunWithOffsets(guns, placementOffsets, basePlacement, farFromHearts) {
  const { baseX, gunY, platformMinX, platformMaxX, gunHalfSize } = basePlacement;
  for (const offset of placementOffsets) {
    const placementX = Math.min(Math.max(baseX + offset, platformMinX), platformMaxX);
    const centerWorldX = placementX + gunHalfSize;
    const centerWorldY = gunY + gunHalfSize;
    if (farFromHearts(centerWorldX, centerWorldY)) {
      guns.push(new CollectableItem(placementX, gunY, "gun"));
      return true;
    }
  }
  return false;
}

function placeGunAtTarget(world, guns, targetX, farFromHearts) {
  const platformUnderTarget = findPlatformUnderTarget(world, targetX);
  if (!platformUnderTarget) return;
  const basePlacement = getGunBasePlacement(platformUnderTarget, targetX);
  const placementOffsets = [0, 150, -150, 250, -250]; // try base position first, then shift left/right to avoid hearts range
  const placed = tryPlaceGunWithOffsets(guns, placementOffsets, basePlacement, farFromHearts);
  if (!placed) guns.push(new CollectableItem(basePlacement.baseX, basePlacement.gunY, "gun"));
}

export function placeGuns(world, count = 4) {
  const guns = [];
  const minHeartDistance = 300;
  const heartCenters = getHeartCenters(world);
  const farFromHearts = (worldX, worldY) => isFarFromHearts(heartCenters, worldX, worldY, minHeartDistance);
  const targets = getGunTargets(count);
  targets.forEach((targetX) => placeGunAtTarget(world, guns, targetX, farFromHearts));
  world.addCollectables(guns);
}

function getTotalRequested(enemy1Count, enemy2Count, enemy3Count) {
  return Math.max(0, (enemy1Count || 0) + (enemy2Count || 0) + (enemy3Count || 0));
}

function getEnemyPlatforms(world) {
  const minPlatformWidthForEnemies = 80, minPlatformLeftMargin = 200, bossAreaBuffer = 1000;
  return world.platforms.filter((platform) =>
    platform.width > minPlatformWidthForEnemies &&
    platform.top <= world.baseGround &&
    platform.supportsLanding &&
    platform.left > minPlatformLeftMargin &&
    platform.right <= WORLD_WIDTH - bossAreaBuffer
  );
}

function shuffleList(list) {
  for (let listIndex = list.length - 1; listIndex > 0; listIndex--) {
    const swapIndex = Math.floor(Math.random() * (listIndex + 1));
    [list[listIndex], list[swapIndex]] = [list[swapIndex], list[listIndex]];
  }
}

function buildEnemyMix(enemy1Count, enemy2Count, enemy3Count) {
  const enemyMix = [];
  for (let enemyIndex = 0; enemyIndex < enemy1Count; enemyIndex++) enemyMix.push("e1");
  for (let enemyIndex = 0; enemyIndex < enemy2Count; enemyIndex++) enemyMix.push("e2");
  for (let enemyIndex = 0; enemyIndex < enemy3Count; enemyIndex++) enemyMix.push("e3");
  return enemyMix;
}

function getEnemyPosition(platform) {
  const enemyPaddingLeft = 60, enemyPaddingRight = 120, enemyMinLeftPadding = 20, enemyYOffset = 110;
  const enemyX = Math.min(Math.max(platform.left + enemyPaddingLeft, platform.left + enemyMinLeftPadding), platform.right - enemyPaddingRight);
  const enemyY = platform.top - enemyYOffset;
  return { enemyX, enemyY };
}

function pushEnemyByType(enemies, enemyType, enemyX, enemyY, world, enemy1Sprites, enemy2Sprites, enemy3Sprites) {
  if (enemyType === "e2" && enemy2Sprites) enemies.push(new Enemy2(enemyX, enemyY, enemy2Sprites, world));
  else if (enemyType === "e3" && enemy3Sprites) enemies.push(new Enemy3(enemyX, enemyY, enemy3Sprites, world));
  else if (enemy1Sprites) enemies.push(new Enemy1(enemyX, enemyY, enemy1Sprites, world));
}

function placeEnemyMix(world, platforms, enemyMix, enemy1Sprites, enemy2Sprites, enemy3Sprites) {
  const enemies = [];
  const usable = Math.min(platforms.length, enemyMix.length);
  for (let placementIndex = 0; placementIndex < usable; placementIndex++) {
    const platform = platforms[placementIndex];
    const { enemyX, enemyY } = getEnemyPosition(platform);
    const enemyType = enemyMix[placementIndex];
    pushEnemyByType(enemies, enemyType, enemyX, enemyY, world, enemy1Sprites, enemy2Sprites, enemy3Sprites);
  }
  return enemies;
}

export function placeEnemiesMixed(world, enemy1Sprites, enemy2Sprites, enemy3Sprites, enemy1Count = 5, enemy2Count = 5, enemy3Count = 2) {
  const totalRequested = getTotalRequested(enemy1Count, enemy2Count, enemy3Count);
  if (totalRequested === 0) return;
  const platforms = getEnemyPlatforms(world);
  shuffleList(platforms); // Shuffle platforms to randomize placement order
  const enemyMix = buildEnemyMix(enemy1Count, enemy2Count, enemy3Count); // (Fisher‑Yates‑Shuffle) 
  shuffleList(enemyMix); // Shuffle enemy mix to randomize which type goes where
  const enemies = placeEnemyMix(world, platforms, enemyMix, enemy1Sprites, enemy2Sprites, enemy3Sprites);
  if (enemies.length) world.addEnemies(enemies);
}

function getHeartSpawnPositions() {
  const heartSpawnMin1 = 0.25, heartSpawnRange1 = 0.20, heartSpawnMin2 = 0.50, heartSpawnRange2 = 0.25;
  const heartSpawnMin3 = 0.95, heartSpawnRange3 = 0.10, heartEdgePadding = 50, maxHeartX = WORLD_WIDTH - heartEdgePadding;
  const positions = [
    WORLD_WIDTH * heartSpawnMin1 + Math.random() * (WORLD_WIDTH * heartSpawnRange1),
    WORLD_WIDTH * heartSpawnMin2 + Math.random() * (WORLD_WIDTH * heartSpawnRange2),
    WORLD_WIDTH * heartSpawnMin3 + Math.random() * (WORLD_WIDTH * heartSpawnRange3),
  ];
  return { positions, maxHeartX };
}

function findHeartPlatform(world, worldX) {
  return world.platforms.find((platform) => worldX >= platform.x && worldX <= platform.x + platform.width);
}

export function placeHearts(world, count = 4) {
  const validHearts = [];
  const heartYOffset = 80;
  const { positions, maxHeartX } = getHeartSpawnPositions();
  for (let heartIndex = 0; heartIndex < count; heartIndex++) {
    const worldX = Math.min(positions[heartIndex], maxHeartX);
    const platform = findHeartPlatform(world, worldX);
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
