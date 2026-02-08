import { Enemy1 } from "../../entities/enemies/enemy1/enemy1.class.js";
import { Enemy2 } from "../../entities/enemies/enemy2/enemy2.class.js";
import { Enemy3 } from "../../entities/enemies/enemy3/enemy3.class.js";
import { WORLD_WIDTH } from "../../../config/config.js";

/**
 * Returns total requested.
 * Uses enemy1Count, enemy2Count, enemy3Count to compute the result.
 * @param {number} enemy1Count Enemy 1 count.
 * @param {number} enemy2Count Enemy 2 count.
 * @param {number} enemy3Count Enemy 3 count.
 * @returns {*} Total requested.
 */
function getTotalRequested(enemy1Count, enemy2Count, enemy3Count) {
  return Math.max(0, (enemy1Count || 0) + (enemy2Count || 0) + (enemy3Count || 0));
}

/**
 * Returns enemy platforms.
 * Updates the world state.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @returns {*} Enemy platforms.
 */
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

/**
 * Shuffle list.
 * Introduces randomness into the outcome.
 * @param {*} list List.
 */
function shuffleList(list) {
  for (let listIndex = list.length - 1; listIndex > 0; listIndex--) {
    const swapIndex = Math.floor(Math.random() * (listIndex + 1));
    [list[listIndex], list[swapIndex]] = [list[swapIndex], list[listIndex]];
  }
}

/**
 * Builds enemy mix.
 * Uses enemy1Count, enemy2Count, enemy3Count to compute the result.
 * @param {number} enemy1Count Enemy 1 count.
 * @param {number} enemy2Count Enemy 2 count.
 * @param {number} enemy3Count Enemy 3 count.
 * @returns {*} Enemy mix.
 */
function buildEnemyMix(enemy1Count, enemy2Count, enemy3Count) {
  const enemyMix = [];
  for (let enemyIndex = 0; enemyIndex < enemy1Count; enemyIndex++) enemyMix.push("e1");
  for (let enemyIndex = 0; enemyIndex < enemy2Count; enemyIndex++) enemyMix.push("e2");
  for (let enemyIndex = 0; enemyIndex < enemy3Count; enemyIndex++) enemyMix.push("e3");
  return enemyMix;
}

/**
 * Returns enemy position.
 * Uses platform to compute the result.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @returns {Object} Enemy position.
 */
function getEnemyPosition(platform) {
  const enemyPaddingLeft = 60, enemyPaddingRight = 120, enemyMinLeftPadding = 20, enemyYOffset = 110;
  const enemyX = Math.min(Math.max(platform.left + enemyPaddingLeft, platform.left + enemyMinLeftPadding), platform.right - enemyPaddingRight);
  const enemyY = platform.top - enemyYOffset;
  return { enemyX, enemyY };
}

/**
 * Push enemy by type.
 * Uses enemies, enemyType, enemyX, enemyY, world, enemy1Sprites, enemy2Sprites, enemy3Sprites
 * to perform the operation.
 * @param {*} enemies Enemies.
 * @param {string} enemyType Enemy type.
 * @param {number} enemyX Enemy X.
 * @param {number} enemyY Enemy Y.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy1Sprites Enemy 1 sprites.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy2Sprites Enemy 2 sprites.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy3Sprites Enemy 3 sprites.
 */
function pushEnemyByType(enemies, enemyType, enemyX, enemyY, world, enemy1Sprites, enemy2Sprites, enemy3Sprites) {
  if (enemyType === "e2" && enemy2Sprites) enemies.push(new Enemy2(enemyX, enemyY, enemy2Sprites, world));
  else if (enemyType === "e3" && enemy3Sprites) enemies.push(new Enemy3(enemyX, enemyY, enemy3Sprites, world));
  else if (enemy1Sprites) enemies.push(new Enemy1(enemyX, enemyY, enemy1Sprites, world));
}

/**
 * Place enemy mix.
 * Uses world, platforms, enemyMix, enemy1Sprites, enemy2Sprites, enemy3Sprites to perform the
 * operation.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @param {*} platforms Platforms.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemyMix Enemy mix.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy1Sprites Enemy 1 sprites.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy2Sprites Enemy 2 sprites.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy3Sprites Enemy 3 sprites.
 * @returns {*} Result value.
 */
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

/**
 * Place enemies mixed. If omitted, default values are used.
 * Updates the world state.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy1Sprites Enemy 1 sprites.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy2Sprites Enemy 2 sprites.
 * @param {import("../../entities/enemies/base/enemies.base.class.js").EnemyBase} enemy3Sprites Enemy 3 sprites.
 * @param {number} [enemy1Count] Enemy 1 count.
 * @param {number} [enemy2Count] Enemy 2 count.
 * @param {number} [enemy3Count] Enemy 3 count.
 */
export function placeEnemiesMixed(world, enemy1Sprites, enemy2Sprites, enemy3Sprites, enemy1Count = 5, enemy2Count = 5, enemy3Count = 2) {
  const totalRequested = getTotalRequested(enemy1Count, enemy2Count, enemy3Count);
  if (totalRequested === 0) return;
  const platforms = getEnemyPlatforms(world);
  shuffleList(platforms); // Shuffle platforms to randomize placement order
  const enemyMix = buildEnemyMix(enemy1Count, enemy2Count, enemy3Count); // (Fisher-Yates-Shuffle) 
  shuffleList(enemyMix); // Shuffle enemy mix to randomize which type goes where
  const enemies = placeEnemyMix(world, platforms, enemyMix, enemy1Sprites, enemy2Sprites, enemy3Sprites);
  if (enemies.length) world.addEnemies(enemies);
}


