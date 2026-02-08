import { PLAYER_SLIDE_DAMAGE } from "../../../config/config.js";

/**
 * Checks slide hits.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {Player} playerAudio Player audio.
 */
export function checkSlideHits(player, playerAudio) {
  if (!player.world?.enemies?.length) return;
  const playerHitbox = player.getHitbox();
  for (const enemy of player.world.enemies) {
    if (!shouldCheckSlideEnemy(player, enemy)) continue;
    const enemyHitbox = getEnemyHitbox(enemy);
    if (!enemyHitbox) continue;
    if (!isHitboxOverlapping(playerHitbox, enemyHitbox)) continue;
    applySlideHit(player, enemy, playerAudio);
  }
}

/**
 * Should check slide enemy.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {EnemyBase} enemy Enemy instance.
 * @returns {boolean} Whether check slide enemy.
 */
function shouldCheckSlideEnemy(player, enemy) {
  return !enemy.isDead && !player.slideHitEnemies.has(enemy);
}

/**
 * Returns enemy hitbox.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 * @returns {*} Enemy hitbox.
 */
function getEnemyHitbox(enemy) {
  return enemy.getHitbox ? enemy.getHitbox() : null;
}

/**
 * Is hitbox overlapping.
 * Performs hitbox or collision checks.
 * @param {*} hitboxA Hitbox A.
 * @param {*} hitboxB Hitbox B.
 * @returns {boolean} Whether hitbox overlapping.
 */
function isHitboxOverlapping(hitboxA, hitboxB) {
  return (
    hitboxA.x < hitboxB.x + hitboxB.width &&
    hitboxA.x + hitboxA.width > hitboxB.x &&
    hitboxA.y < hitboxB.y + hitboxB.height &&
    hitboxA.y + hitboxA.height > hitboxB.y
  );
}

/**
 * Applies slide hit.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} playerAudio Player audio.
 */
function applySlideHit(player, enemy, playerAudio) {
  playerAudio.playHit();
  const dmg = player.slideDamage ?? PLAYER_SLIDE_DAMAGE;
  enemy.takeDamage?.(dmg, { skipStun: true, source: "slide" });
  spawnSlideHitEffect(player, enemy);
  player.slideHitEnemies.add(enemy);
}

/**
 * Spawns slide hit effect.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {Player} player Player instance.
 * @param {EnemyBase} enemy Enemy instance.
 */
function spawnSlideHitEffect(player, enemy) {
  if (enemy.isDead || enemy.health <= 0 || enemy.disableHitEffect) return;
  const hitEffectX = enemy.x;
  const hitEffectY = enemy.y;
  const hitEffectWidth = enemy.width;
  const hitEffectHeight = enemy.height;
  player.world?.spawnHitEffect?.(hitEffectX, hitEffectY, hitEffectWidth, hitEffectHeight);
}
