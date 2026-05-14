import { loadFrames } from "../../../core/game/assets/assetLoader.js";

/**
 * Loads boss sprites.
 * Used to support animation timing.
 * Applies physics updates like gravity and velocity.
 * @returns {Object} Result value.
 */
export function loadBossSprites() {
  const base = "assets/img/boss/boss_sprites/";
  return {
    idle: loadFrames(`${base}idle/`, "idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 12),
    run: loadFrames(`${base}run/`, "run_", 8),
    attack1: loadFrames(`${base}attack_1/`, "attack_", 8),
    attack2: loadFrames(`${base}attack_2/`, "attack_", 8),
    hurt: loadFrames(`${base}hurt/`, "hurt_", 6),
    die: loadFrames(`${base}die/`, "die_", 12),
    jump: loadFrames(`${base}jump/`, "jump_", 6),
  };
}
