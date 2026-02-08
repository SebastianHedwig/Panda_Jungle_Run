import { HudPopup } from "../../../effects/hudPopup.class.js";

/**
 * Applies damage amount.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} amount Amount.
 */
export function applyDamageAmount(enemy, amount) {
  enemy.health -= amount;
}

/**
 * Applies recent slide hit.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {*} hitContext Hit context.
 */
export function applyRecentSlideHit(enemy, hitContext) {
  const recentSlideHitDuration = 0.4;
  if (hitContext?.source === "slide") {
    enemy.recentSlideHit = Math.max(enemy.recentSlideHit, recentSlideHitDuration);
  }
}

/**
 * Adds enemy damage popup.
 * Updates the enemy state.
 * Spawns visual feedback effects.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} amount Amount.
 */
export function addEnemyDamagePopup(enemy, amount) {
  if (!enemy.world?.hudPopups) return;
  const popupX = enemy.x + enemy.width * 0.5;
  const popupY = enemy.y - 20;
  enemy.world.hudPopups.push(new HudPopup(`-${amount}`, popupX, popupY, "damage"));
}

/**
 * Handles enemy death.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 * @returns {*} Result value.
 */
export function handleEnemyDeath(enemy) {
  if (enemy.health > 0) return false;
  markEnemyDead(enemy);
  setDeathAnimation(enemy);
  resetDeathVelocity(enemy);
  initDeathTimers(enemy);
  enemy.onDeath?.();
  return true;
}

/**
 * Marks enemy dead.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 */
function markEnemyDead(enemy) {
  enemy.isDead = true;
}

/**
 * Sets death animation.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 */
function setDeathAnimation(enemy) {
  enemy.setAnimation?.(enemy.dieFrames);
  enemy.currentFrame = 0;
  enemy.frameTime = 0;
}

/**
 * Resets death velocity.
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 */
function resetDeathVelocity(enemy) {
  enemy.velocityX = 0;
  enemy.velocityY = 0;
}

/**
 * Initializes death timers.
 * Updates the enemy state.
 * @param {EnemyBase} enemy Enemy instance.
 */
function initDeathTimers(enemy) {
  enemy.deathTimer = 5;
  enemy.blinkTimer = 0.9; // 3 blinks at 0.3s
}

/**
 * Applies hit stun.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {*} hitContext Hit context.
 */
export function applyHitStun(enemy, hitContext) {
  if (hitContext.skipStun) return;
  const hitStunMinDuration = 1.5;
  enemy.hitStun = Math.max(enemy.hitStun, hitStunMinDuration);
  enemy.velocityX = 0;
  enemy.velocityY = 0;
  enemy.setAnimation?.(enemy.idleFrames);
  enemy.currentFrame = 0;
  enemy.frameTime = 0;
}
