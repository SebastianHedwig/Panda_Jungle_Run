import { CollectableItem } from "../../items/collectableItem.class.js";
import { WORLD_WIDTH } from "../../../config/config.js";

/**
 * Returns heart centers.
 * Updates the world state.
 * @param {World} world World instance.
 * @returns {*} Heart centers.
 */
function getHeartCenters(world) {
  return world.collectables
    ?.filter((collectable) => collectable.type === "heart")
    .map((collectable) => ({ x: collectable.x + collectable.width / 2, y: collectable.y + collectable.height / 2 })) || [];
}

/**
 * Is far from hearts.
 * Uses heartCenters, worldX, worldY, minHeartDistance to perform the operation.
 * @param {*} heartCenters Heart centers.
 * @param {number} worldX World X.
 * @param {number} worldY World Y.
 * @param {number} minHeartDistance Min heart distance.
 * @returns {boolean} Whether far from hearts.
 */
function isFarFromHearts(heartCenters, worldX, worldY, minHeartDistance) {
  return heartCenters.every((heartCenter) => Math.hypot(heartCenter.x - worldX, heartCenter.y - worldY) >= minHeartDistance);
}

/**
 * Returns gun targets.
 * Uses count to compute the result.
 * @param {number} count Count.
 * @returns {*} Gun targets.
 */
function getGunTargets(count) {
  const gunTargetFractions = [0.15, 0.38, 0.62, 0.86];
  return gunTargetFractions.map((fraction) => WORLD_WIDTH * fraction).slice(0, count);
}

/**
 * Find platform under target.
 * Updates the world state.
 * @param {World} world World instance.
 * @param {number} targetX Target X.
 * @returns {*} Result value.
 */
function findPlatformUnderTarget(world, targetX) {
  return world.platforms.find((platform) => targetX >= platform.left && targetX <= platform.right);
}

/**
 * Returns gun base placement.
 * Uses platformUnderTarget, targetX to compute the result.
 * @param {Platform} platformUnderTarget Platform under target.
 * @param {number} targetX Target X.
 * @returns {Object} Gun base placement.
 */
function getGunBasePlacement(platformUnderTarget, targetX) {
  const gunPaddingLeft = 10, gunPaddingRight = 60, gunYOffset = 80, gunHalfSize = 25;
  const platformMinX = platformUnderTarget.left + gunPaddingLeft;
  const platformMaxX = platformUnderTarget.right - gunPaddingRight;
  const baseX = Math.min(Math.max(targetX, platformMinX), platformMaxX);
  const gunY = platformUnderTarget.top - gunYOffset;
  return { baseX, gunY, platformMinX, platformMaxX, gunHalfSize };
}

/**
 * Try place gun with offsets.
 * Uses guns, placementOffsets, basePlacement, farFromHearts to perform the operation.
 * @param {*} guns Guns.
 * @param {*} placementOffsets Placement offsets.
 * @param {*} basePlacement Base placement.
 * @param {Function} farFromHearts Far from hearts.
 * @returns {*} Result value.
 */
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

/**
 * Place gun at target.
 * Uses world, guns, targetX, farFromHearts to perform the operation.
 * @param {World} world World instance.
 * @param {*} guns Guns.
 * @param {number} targetX Target X.
 * @param {*} farFromHearts Far from hearts.
 */
function placeGunAtTarget(world, guns, targetX, farFromHearts) {
  const platformUnderTarget = findPlatformUnderTarget(world, targetX);
  if (!platformUnderTarget) return;
  const basePlacement = getGunBasePlacement(platformUnderTarget, targetX);
  const placementOffsets = [0, 150, -150, 250, -250]; // try base position first, then shift left/right to avoid hearts range
  const placed = tryPlaceGunWithOffsets(guns, placementOffsets, basePlacement, farFromHearts);
  if (!placed) guns.push(new CollectableItem(basePlacement.baseX, basePlacement.gunY, "gun"));
}

/**
 * Place guns. If omitted, default values are used.
 * Updates the world state.
 * @param {World} world World instance.
 * @param {number} [count] Count.
 */
export function placeGuns(world, count = 4) {
  const guns = [];
  const minHeartDistance = 300;
  const heartCenters = getHeartCenters(world);
  /**
   * Far from hearts.
   * Uses worldX, worldY to perform the operation.
   * @param {number} worldX World X.
   * @param {number} worldY World Y.
   * @returns {*} Result value.
   */
  const farFromHearts = (worldX, worldY) => isFarFromHearts(heartCenters, worldX, worldY, minHeartDistance);
  const targets = getGunTargets(count);
  targets.forEach((targetX) => placeGunAtTarget(world, guns, targetX, farFromHearts));
  world.addCollectables(guns);
}

