/**
 * Can start enemy attack.
 * Updates the player state.
 * @param {import("../../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether start enemy attack.
 */
export function canStartEnemyAttack(playerInfo, player) {
  return !!playerInfo && !!player && !player.isDead;
}

/**
 * Try start melee attack.
 * Updates the enemy state.
 * @param {import("./enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../../player/player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
export function tryStartMeleeAttack(enemy, playerInfo, player) {
  const deltaX = playerInfo.deltaX;
  const absoluteDeltaY = playerInfo.absoluteDeltaY;
  if (!isPlayerInRange(enemy, deltaX, absoluteDeltaY)) return false;
  const frames = enemy.attackFrames;
  if (!frames) return false;
  enemy.startMeleeAttack(deltaX, frames, enemy.damage, player);
  return true;
}

/**
 * Is player in range.
 * Updates the enemy state.
 * @param {import("./enemies.base.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} deltaX Delta X.
 * @param {number} absoluteDeltaY Absolute delta Y.
 * @returns {boolean} Whether player in range.
 */
function isPlayerInRange(enemy, deltaX, absoluteDeltaY) {
  return Math.abs(deltaX) <= enemy.attackRange && absoluteDeltaY <= enemy.attackHeightTolerance;
}
