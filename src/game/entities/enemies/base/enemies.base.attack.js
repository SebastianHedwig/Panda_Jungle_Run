/**
 * Can start enemy attack.
 * Used to decide combat outcomes.
 * @param {Player} playerInfo Player info.
 * @param {Player} player Player instance.
 * @returns {boolean} Whether start enemy attack.
 */
export function canStartEnemyAttack(playerInfo, player) {
  return !!playerInfo && !!player && !player.isDead;
}

/**
 * Try start melee attack.
 * Used to support combat effects.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} playerInfo Player info.
 * @param {Player} player Player instance.
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
 * Used to decide combat outcomes.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} deltaX Delta X.
 * @param {number} absoluteDeltaY Absolute delta Y.
 * @returns {boolean} Whether player in range.
 */
function isPlayerInRange(enemy, deltaX, absoluteDeltaY) {
  return Math.abs(deltaX) <= enemy.attackRange && absoluteDeltaY <= enemy.attackHeightTolerance;
}
