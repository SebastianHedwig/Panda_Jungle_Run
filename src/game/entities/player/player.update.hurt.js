/**
 * Handles hurt flow.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
export function handleHurtFlow(player, dt) {
  player.updateHurt(dt);
  if (!player.isHurt) return false;
  if (player.hurtUseDizzy) applyHurtAnimation(player, dt);
  player.applyApexGravity(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
  return true;
}

/**
 * Applies hurt animation.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function applyHurtAnimation(player, dt) {
  const hurtAnim = player.hurtPhase === "hurt"
    ? player.hurtFrames
    : player.dizzyFrames || player.hurtFrames;
  player.setAnimation(hurtAnim);
  player.animate(dt);
}
