import { CollectableItem } from "../../items/collectableItem.class.js";
import { WORLD_WIDTH } from "../../../config/config.js";

/**
 * Returns heart spawn positions.
 * Introduces randomness into the outcome.
 * @returns {Object} Heart spawn positions.
 */
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

/**
 * Find heart platform.
 * Updates the world state.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @param {number} worldX World X.
 * @returns {*} Result value.
 */
function findHeartPlatform(world, worldX) {
  return world.platforms.find((platform) => worldX >= platform.x && worldX <= platform.x + platform.width);
}

/**
 * Is inside platform.
 * Updates the world state.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @param {number} heartWorldX Heart world X.
 * @param {number} heartWorldY Heart world Y.
 * @returns {boolean} Whether inside platform.
 */
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

/**
 * Place hearts. If omitted, default values are used.
 * Updates the world state.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @param {number} [count] Count.
 */
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

