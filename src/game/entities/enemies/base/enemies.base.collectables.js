import { CollectableItem } from "../../../items/collectableItem.class.js";
import { FACING_LEFT, FACING_RIGHT } from "../../../../config/config.js";

/**
 * Returns collectable drop config.
 * Updates the enemy state.
 * Spawns visual feedback effects.
 * @param {import("./enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @returns {Object} Collectable drop config.
 */
export function getCollectableDropConfig(enemy) {
  const spawnOffsetYFactor = 0.2;
  const baseRadius = 30;
  const radiusScattering = 20;
  const minAngle = Math.PI / 3; // 60°
  const angleRange = Math.PI / 6; // up to 90°
  const baseSpeedX = 120;
  const speedXScattering = 60;
  const baseSpeedY = 400;
  const speedYScattering = 150;
  const baseX = enemy.x + enemy.width / 2;
  const baseY = enemy.y + enemy.height * spawnOffsetYFactor;
  return { spawnOffsetYFactor, baseRadius, radiusScattering, minAngle, angleRange, baseSpeedX, speedXScattering, baseSpeedY, speedYScattering, baseX, baseY };
}

/**
 * Creates collectable drops.
 * Uses enemy, itemType, count, dropConfig to compute the result.
 * @param {import("./enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {string} itemType Item type.
 * @param {number} count Count.
 * @param {*} dropConfig Drop config.
 * @returns {*} Collectable drops.
 */
export function createCollectableDrops(enemy, itemType, count, dropConfig) {
  const drops = [];
  for (let dropIndex = 0; dropIndex < count; dropIndex++) {
    const item = createCollectableDrop(enemy, itemType, dropIndex, dropConfig);
    drops.push(item);
  }
  return drops;
}

/**
 * Creates collectable drop.
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {import("./enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {string} itemType Item type.
 * @param {number} dropIndex Drop index.
 * @param {*} dropConfig Drop config.
 * @returns {*} Collectable drop.
 */
function createCollectableDrop(enemy, itemType, dropIndex, dropConfig) {
  const isEvenDropIndex = dropIndex % 2 === 0; // drop left/right alternation
  const dropDirection = isEvenDropIndex ? FACING_LEFT : FACING_RIGHT;
  const radius = dropConfig.baseRadius + Math.random() * dropConfig.radiusScattering;
  const angle = dropConfig.minAngle + Math.random() * dropConfig.angleRange;
  const dropX = dropConfig.baseX + dropDirection * radius * Math.cos(angle);
  const dropY = dropConfig.baseY - radius * Math.sin(angle);
  const velocityX = dropDirection * (dropConfig.baseSpeedX + Math.random() * dropConfig.speedXScattering);
  const velocityY = -(dropConfig.baseSpeedY + Math.random() * dropConfig.speedYScattering);
  const item = new CollectableItem(dropX, dropY, itemType, enemy.world);
  item.startDrop(velocityX, velocityY);
  return item;
}

/**
 * Adds collectables to world.
 * Updates the world state.
 * @param {import("../../../../core/world.class.js").World} world World instance.
 * @param {*} drops Drops.
 */
export function addCollectablesToWorld(world, drops) {
  world.addCollectables ? world.addCollectables(drops) : world.collectables.push(...drops);
}
