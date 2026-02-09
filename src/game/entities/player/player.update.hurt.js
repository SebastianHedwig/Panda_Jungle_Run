/**
 * Handles hurt flow.
 * Used to centralize a specific behavior for combat effects.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
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
 * Used to apply animation transforms.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function applyHurtAnimation(player, dt) {
  const hurtAnim = player.hurtPhase === "hurt"
    ? player.hurtFrames
    : player.dizzyFrames || player.hurtFrames;
  player.setAnimation(hurtAnim);
  player.animate(dt);
}
