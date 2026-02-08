/**
 * Handles death flow.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
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
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
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
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
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
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function advanceDeathFrame(player) {
  const lastDeathFrameIndex = player.currentAnimation.length - 1;
  const nextDeathFrameIndex = player.currentFrame + 1;
  player.currentFrame = Math.min(nextDeathFrameIndex, lastDeathFrameIndex);
  player.sprite = player.currentAnimation[player.currentFrame];
  if (player.currentFrame === lastDeathFrameIndex) player.deathDone = true;
}
