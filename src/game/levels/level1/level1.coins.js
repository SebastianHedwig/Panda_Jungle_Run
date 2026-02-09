import { CollectableItem } from "../../items/collectableItem.class.js";
import { WORLD_WIDTH } from "../../../config/config.js";

const MIN_COIN_X = 200; // avoid placing coins too close to level start
const BOSS_AREA_START = WORLD_WIDTH * 0.9; // last 10% of the level

/**
 * Builds coin placement config.
 * Used to assemble required data for collectable handling.
 * @param {World} world World instance.
 * @param {number} totalCount Total count.
 * @param {number} ratioAbovePlatforms Ratio above platforms.
 * @returns {Object} Coin placement config.
 */
function buildCoinPlacementConfig(world, totalCount, ratioAbovePlatforms) {
  const minCoinSpacing = 60, rowSpacing = 60, minRowPlatformWidth = 220, maxRowLength = 6, rowProbability = 0.7;
  const coinsAbove = Math.floor(totalCount * ratioAbovePlatforms), minPlatformWidth = 100, maxRightMargin = 60, platformCoinYOffset = 80, coinWidth = 50, coinHeight = 50;
  const maxPlacementAttempts = totalCount * 40, randomYMin = 220, randomYRange = 380, worldRightMargin = 100, firstThirdEndX = world.width / 3;
  const platformEarlyShare = 0.4; // share of platform coins placed in the first third
  const randomEarlyShare = 0.4;   // share of random coins placed in the first third
  return { minCoinSpacing, rowSpacing, minRowPlatformWidth, maxRowLength, rowProbability, coinsAbove, minPlatformWidth, maxRightMargin, platformCoinYOffset, coinWidth, coinHeight, maxPlacementAttempts, randomYMin, randomYRange, worldRightMargin, firstThirdEndX, platformEarlyShare, randomEarlyShare, totalCount };
}

/**
 * Returns random platform.
 * Used to provide random platform for platform collision handling.
 * Introduces randomness into the outcome.
 * @param {World} world World instance.
 * @returns {*} Random platform.
 */
function getRandomPlatform(world) {
  return world.platforms[Math.floor(Math.random() * world.platforms.length)];
}

/**
 * Returns platform coin range.
 * Used to provide platform coin range for platform collision handling.
 * Uses platform, maxXLimit, config to compute the result.
 * @param {Platform} platform Platform.
 * @param {number} maxXLimit Max X limit.
 * @param {Object} config Configuration options.
 * @returns {Object} Platform coin range.
 */
function getPlatformCoinRange(platform, maxXLimit, config) {
  const width = platform.right - platform.left;
  if (width < config.minPlatformWidth) return null;
  const worldXMin = Math.max(platform.left, MIN_COIN_X);
  const worldXMax = Math.min(platform.right - config.maxRightMargin, maxXLimit - config.maxRightMargin, BOSS_AREA_START - config.maxRightMargin);
  if (worldXMax <= worldXMin) return null;
  return { width, worldXMin, worldXMax };
}

/**
 * Should place platform row.
 * Used to decide platform interactions.
 * Introduces randomness into the outcome.
 * @param {Object} config Configuration options.
 * @param {*} placement Placement.
 * @returns {boolean} Whether place platform row.
 */
function shouldPlacePlatformRow(config, placement) {
  const { width, worldXMin, worldXMax } = placement;
  return width >= config.minRowPlatformWidth && worldXMax - worldXMin > config.rowSpacing && Math.random() < config.rowProbability;
}

/**
 * Returns platform row params.
 * Used to provide platform row params for platform collision handling.
 * Uses placement, config, platform to compute the result.
 * @param {*} placement Placement.
 * @param {Object} config Configuration options.
 * @param {Platform} platform Platform.
 * @returns {Object} Platform row params.
 */
function getPlatformRowParams(placement, config, platform) {
  const { worldXMin, worldXMax } = placement;
  const rowCoinCount = Math.min(config.maxRowLength, Math.floor((worldXMax - worldXMin) / config.rowSpacing));
  const startWorldX = worldXMin + config.rowSpacing / 2;
  const worldY = platform.y - config.platformCoinYOffset;
  return { rowCoinCount, startWorldX, worldY };
}

/**
 * Try add coin.
 * Used to support collectable handling.
 * @param {World} world World instance.
 * @param {number} coins Coins.
 * @param {number} worldX World X.
 * @param {number} worldY World Y.
 * @param {Object} config Configuration options.
 * @returns {*} Result value.
 */
function tryAddCoin(world, coins, worldX, worldY, config) {
  const { coinWidth, coinHeight, minCoinSpacing } = config;
  if (!world.coinPositionIsValid(worldX, worldY, coinWidth, coinHeight, coins, minCoinSpacing)) return false;
  coins.push(new CollectableItem(worldX, worldY, "coin"));
  return true;
}

/**
 * Place platform row coins.
 * Used to support platform collision handling.
 * Uses world, coins, platform, placement, config to perform the operation.
 * @param {World} world World instance.
 * @param {number} coins Coins.
 * @param {Platform} platform Platform.
 * @param {*} placement Placement.
 * @param {Object} config Configuration options.
 */
function placePlatformRowCoins(world, coins, platform, placement, config) {
  const { rowCoinCount, startWorldX, worldY } = getPlatformRowParams(placement, config, platform);
  for (let coinIndex = 0; coinIndex < rowCoinCount; coinIndex++) {
    const worldX = startWorldX + coinIndex * config.rowSpacing;
    tryAddCoin(world, coins, worldX, worldY, config);
  }
}

/**
 * Place single platform coin.
 * Used to support platform collision handling.
 * Introduces randomness into the outcome.
 * @param {World} world World instance.
 * @param {number} coins Coins.
 * @param {Platform} platform Platform.
 * @param {*} placement Placement.
 * @param {Object} config Configuration options.
 */
function placeSinglePlatformCoin(world, coins, platform, placement, config) {
  const worldX = placement.worldXMin + Math.random() * (placement.worldXMax - placement.worldXMin);
  const worldY = platform.y - config.platformCoinYOffset;
  tryAddCoin(world, coins, worldX, worldY, config);
}

/**
 * Place platform coins batch.
 * Used to support platform collision handling.
 * Spawns visual feedback effects.
 * @param {World} world World instance.
 * @param {number} coins Coins.
 * @param {Object} config Configuration options.
 * @param {number} count Count.
 * @param {number} maxXLimit Max X limit.
 */
function placePlatformCoinsBatch(world, coins, config, count, maxXLimit) {
  for (let spawnAttempt = 0; spawnAttempt < count; spawnAttempt++) {
    const platform = getRandomPlatform(world);
    const placement = getPlatformCoinRange(platform, maxXLimit, config);
    if (!placement) continue;
    if (shouldPlacePlatformRow(config, placement)) placePlatformRowCoins(world, coins, platform, placement, config);
    else placeSinglePlatformCoin(world, coins, platform, placement, config);
  }
}

/**
 * Place platform coins.
 * Used to support platform collision handling.
 * Uses world, coins, config to perform the operation.
 * @param {World} world World instance.
 * @param {number} coins Coins.
 * @param {Object} config Configuration options.
 */
function placePlatformCoins(world, coins, config) {
  const earlyPlatformCoins = Math.floor(config.coinsAbove * config.platformEarlyShare);
  const latePlatformCoins = config.coinsAbove - earlyPlatformCoins;
  placePlatformCoinsBatch(world, coins, config, earlyPlatformCoins, config.firstThirdEndX);
  placePlatformCoinsBatch(world, coins, config, latePlatformCoins, BOSS_AREA_START);
}

/**
 * Returns random coin position.
 * Used to provide random coin position for camera-relative placement.
 * Introduces randomness into the outcome.
 * @param {World} world World instance.
 * @param {Object} config Configuration options.
 * @param {number} xMaxLimit X max limit.
 * @returns {Object} Random coin position.
 */
function getRandomCoinPosition(world, config, xMaxLimit) {
  const worldXMin = MIN_COIN_X;
  const worldXMax = Math.min(world.width - config.worldRightMargin, xMaxLimit - config.worldRightMargin, BOSS_AREA_START - config.worldRightMargin);
  const worldX = worldXMin + Math.random() * (worldXMax - worldXMin);
  const worldY = config.randomYMin + Math.random() * config.randomYRange;
  return { worldXMin, worldXMax, worldX, worldY };
}

/**
 * Place random coin batch.
 * Used to support collectable handling.
 * Uses world, coins, config, count, xMaxLimit, placementAttempts to perform the operation.
 * @param {World} world World instance.
 * @param {number} coins Coins.
 * @param {Object} config Configuration options.
 * @param {number} count Count.
 * @param {number} xMaxLimit X max limit.
 * @param {*} placementAttempts Placement attempts.
 * @returns {*} Result value.
 */
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

/**
 * Place random coins.
 * Used to support world state updates.
 * Uses world, coins, config to perform the operation.
 * @param {World} world World instance.
 * @param {number} coins Coins.
 * @param {Object} config Configuration options.
 */
function placeRandomCoins(world, coins, config) {
  let placementAttempts = 0;
  const randomCoinsTarget = config.totalCount - coins.length;
  const earlyRandomCoins = Math.floor(randomCoinsTarget * config.randomEarlyShare);
  const lateRandomCoins = randomCoinsTarget - earlyRandomCoins;
  placementAttempts = placeRandomCoinBatch(world, coins, config, earlyRandomCoins, config.firstThirdEndX, placementAttempts);
  placeRandomCoinBatch(world, coins, config, lateRandomCoins, BOSS_AREA_START, placementAttempts);
}

/**
 * Builds coin arc config.
 * Used to assemble required data for collectable handling.
 * Uses maxArcs to compute the result.
 * @param {number} maxArcs Max arcs.
 * @returns {Object} Coin arc config.
 */
function buildCoinArcConfig(maxArcs) {
  const minJumpGap = 150, maxJumpGap = 700, minHeightDiff = 10, arcWidthScale = 0.85, arcWidthMax = 350;
  const arcCoinSpacing = 55, minCoinSpacing = 55, arcXOffset = 25, arcYOffset = 110, arcAmplitude = 160;
  const coinWidth = 50, coinHeight = 50;
  return { maxArcs, minJumpGap, maxJumpGap, minHeightDiff, arcWidthScale, arcWidthMax, arcCoinSpacing, minCoinSpacing, arcXOffset, arcYOffset, arcAmplitude, coinWidth, coinHeight };
}

/**
 * Returns sorted platforms.
 * Used to provide sorted platforms for world state updates.
 * @param {World} world World instance.
 * @returns {*} Sorted platforms.
 */
function getSortedPlatforms(world) {
  return world.platforms.sort((a, b) => a.left - b.left);
}

/**
 * Returns arc params.
 * Used to provide arc params for world state updates.
 * Uses currentPlatform, nextPlatform, config to compute the result.
 * @param {Platform} currentPlatform Current platform.
 * @param {Platform} nextPlatform Next platform.
 * @param {Object} config Configuration options.
 * @returns {Object} Arc params.
 */
function getArcParams(currentPlatform, nextPlatform, config) {
  const gap = nextPlatform.left - currentPlatform.right;
  const heightDiff = Math.abs(nextPlatform.top - currentPlatform.top);
  const mustJump = gap >= config.minJumpGap && gap <= config.maxJumpGap && heightDiff > config.minHeightDiff;
  if (!mustJump) return null;
  const arcWidth = Math.min(gap * config.arcWidthScale, config.arcWidthMax);
  const coinsInArc = Math.floor(arcWidth / config.arcCoinSpacing);
  return { gap, coinsInArc };
}

/**
 * Returns arc coin world position.
 * Used to provide arc coin world position for camera-relative placement.
 * Uses coinIndex, coinsInArc, currentPlatform, nextPlatform, gap, config to compute the
 * result.
 * @param {number} coinIndex Coin index.
 * @param {number} coinsInArc Coins in arc.
 * @param {Platform} currentPlatform Current platform.
 * @param {Platform} nextPlatform Next platform.
 * @param {number} gap Gap.
 * @param {Object} config Configuration options.
 * @returns {Object} Arc coin world position.
 */
function getArcCoinWorldPosition(coinIndex, coinsInArc, currentPlatform, nextPlatform, gap, config) {
  const arcProgress = coinIndex / (coinsInArc - 1);
  const worldX = currentPlatform.right + gap * arcProgress - config.arcXOffset;
  const worldY = currentPlatform.top - config.arcYOffset - Math.sin(arcProgress * Math.PI) * config.arcAmplitude +
    (nextPlatform.top - currentPlatform.top) * arcProgress;
  return { worldX, worldY };
}

/**
 * Try add arc coin.
 * Used to support collectable handling.
 * @param {World} world World instance.
 * @param {*} arcs Arcs.
 * @param {number} worldX World X.
 * @param {number} worldY World Y.
 * @param {Object} config Configuration options.
 * @returns {*} Result value.
 */
function tryAddArcCoin(world, arcs, worldX, worldY, config) {
  if (!world.coinPositionIsValid(worldX, worldY, config.coinWidth, config.coinHeight, arcs, config.minCoinSpacing)) return false;
  arcs.push(new CollectableItem(worldX, worldY, "coin"));
  return true;
}

/**
 * Place arc coins.
 * Used to support world state updates.
 * Uses world, arcs, currentPlatform, nextPlatform, config to perform the operation.
 * @param {World} world World instance.
 * @param {*} arcs Arcs.
 * @param {Platform} currentPlatform Current platform.
 * @param {Platform} nextPlatform Next platform.
 * @param {Object} config Configuration options.
 * @returns {*} Result value.
 */
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

/**
 * Place coin arcs.
 * Used to support collectable handling.
 * Uses world, platforms, arcs, config to perform the operation.
 * @param {World} world World instance.
 * @param {*} platforms Platforms.
 * @param {*} arcs Arcs.
 * @param {Object} config Configuration options.
 */
function placeCoinArcs(world, platforms, arcs, config) {
  let created = 0;
  for (let platformIndex = 0; platformIndex < platforms.length - 1; platformIndex++) {
    if (created >= config.maxArcs) break;
    const currentPlatform = platforms[platformIndex];
    const nextPlatform = platforms[platformIndex + 1];
    created += placeArcCoins(world, arcs, currentPlatform, nextPlatform, config);
  }
}

/**
 * Generate coins mixed. If omitted, default values are used.
 * Used to support world state updates.
 * Uses world, totalCount, ratioAbovePlatforms to perform the operation.
 * @param {World} world World instance.
 * @param {number} [totalCount] Total count.
 * @param {number} [ratioAbovePlatforms] Ratio above platforms.
 * @returns {*} Coins mixed.
 */
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

/**
 * Generate coin arcs. If omitted, default values are used.
 * Used to support collectable handling.
 * Uses world, maxArcs to perform the operation.
 * @param {World} world World instance.
 * @param {number} [maxArcs] Max arcs.
 * @returns {*} Coin arcs.
 */
export function generateCoinArcs(world, maxArcs = 4) {
  const arcs = [];
  const config = buildCoinArcConfig(maxArcs);
  const platforms = getSortedPlatforms(world);
  placeCoinArcs(world, platforms, arcs, config);
  return arcs;
}

