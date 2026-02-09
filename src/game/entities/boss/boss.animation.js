import { loadFrames } from "../../../core/game/assets/assetLoader.js";

/**
 * Loads boss sprites.
 * Used to support animation timing.
 * Applies physics updates like gravity and velocity.
 * @returns {Object} Result value.
 */
export function loadBossSprites() {
  const base = "assets/img/Boss/Boss_Sprites/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 12),
    run: loadFrames(`${base}run/`, "Run_", 8),
    attack1: loadFrames(`${base}attack_1/`, "Attack_", 8),
    attack2: loadFrames(`${base}attack_2/`, "Attack_", 8),
    hurt: loadFrames(`${base}hurt/`, "Hurt_", 6),
    die: loadFrames(`${base}die/`, "Die_", 12),
    jump: loadFrames(`${base}jump/`, "Jump_", 6),
  };
}
