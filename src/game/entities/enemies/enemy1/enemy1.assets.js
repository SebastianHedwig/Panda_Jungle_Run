import { loadFrames } from "../../../../core/game/assets/assetLoader.js";

/**
 * Loads enemy 1 sprites.
 * @returns {Object} Result value.
 */
export function loadEnemy1Sprites() {
  const base = "assets/img/Enemies/Enemy_Sprites/Character-1/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 10),
    attack: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

/**
 * Initializes sprite frames.
 * Advances animation state and sprites.
 * Updates the instance state.
 * @param {*} sprites Sprites.
 */
export function initializeSpriteFrames(sprites) {
  this.idleFrames = sprites.idle;
  this.walkFrames = sprites.walk;
  this.attackFrames = sprites.attack;
  this.dieFrames = sprites.die;
}

