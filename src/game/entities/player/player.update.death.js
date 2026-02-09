/**
 * Handles death flow.
 * Used to centralize a specific behavior for combat effects.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
export function handleDeathFlow(player, dt) {
  if (!player.isDead) return false;
  updateDeathMovement(player, dt);
  updateDeathFrames(player, dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Updates death movement.
 * Used to advance state during the update loop for combat effects.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateDeathMovement(player, dt) {
  player.setAnimation(player.dieFrames);
  const previousBottom = player.y + player.height;
  player.applyApexGravity(dt);
  const currentBottom = player.y + player.height;
  player.handleDeathLanding(previousBottom, currentBottom);
}

/**
 * Updates death frames.
 * Used to advance state during the update loop for combat effects.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateDeathFrames(player, dt) {
  if (player.deathDone) return;
  player.frameTime += dt;
  if (player.frameTime < player.frameSpeed) return;
  player.frameTime = 0;
  advanceDeathFrame(player);
}

/**
 * Advances death frame.
 * Used to support animation timing.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 */
function advanceDeathFrame(player) {
  const lastDeathFrameIndex = player.currentAnimation.length - 1;
  const nextDeathFrameIndex = player.currentFrame + 1;
  player.currentFrame = Math.min(nextDeathFrameIndex, lastDeathFrameIndex);
  player.sprite = player.currentAnimation[player.currentFrame];
  if (player.currentFrame === lastDeathFrameIndex) player.deathDone = true;
}
