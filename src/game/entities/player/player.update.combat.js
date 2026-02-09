/**
 * Handles combat flow.
 * Used to centralize a specific behavior for combat effects.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {Input} input Input handler.
 * @returns {*} Result value.
 */
export function handleCombatFlow(player, dt, input) {
  handleAttackShootInput(player, input);
  player.updateShoot(dt);
  if (handleShooting(player, dt)) return true;
  player.updateAttack(dt);
  if (handleAttacking(player, dt)) return true;
  handleQueuedAttack(player);
  return false;
}

/**
 * Handles attack shoot input.
 * Used to centralize a specific behavior for UI interaction handling.
 * Reads input state to decide actions.
 * @param {Player} player Player instance.
 * @param {Input} input Input handler.
 */
function handleAttackShootInput(player, input) {
  if (!input.isPressed("Enter")) return;
  if (player.bulletAmmo > 0) player.startShoot();
  else if (!player.startAttack()) player.attackQueued = true;
}

/**
 * Handles shooting.
 * Used to centralize a specific behavior for combat effects.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleShooting(player, dt) {
  if (!player.isShooting) return false;
  player.setAnimation(player.shootFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Handles attacking.
 * Used to centralize a specific behavior for combat effects.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleAttacking(player, dt) {
  if (!player.isAttacking) return false;
  player.setAnimation(player.throwFrames);
  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Handles queued attack.
 * Used to centralize a specific behavior for combat effects.
 * @param {Player} player Player instance.
 */
function handleQueuedAttack(player) {
  if (!player.attackQueued) return;
  if (!player.onGround || player.isHurt || player.isDead || player.isShooting) return;
  if (player.startAttack()) player.attackQueued = false;
}
