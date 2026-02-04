/**
 * Starts slide.
 * Triggers audio playback or updates audio state.
 * Applies physics updates like gravity and velocity.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
export function startSlide(player, playerAudio) {
  if (player.isSliding || !player.onGround) return;
  player.isSliding = true;
  player.slideStartX = player.x;
  player.slideDirection = player.facing;
  player.velocityY = 0;
  playerAudio.playSlide();
  player.slideBlockGrace = 0.12;
  player.slideHitEnemies.clear();
  player.invulnerableTimer = Math.max(player.invulnerableTimer, player.slideInvulnerableDuring);
  player.slideInvulWindow = Math.max(player.slideInvulWindow, player.slideInvulnerableDuring);
}

/**
 * Handles landing audio.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
 */
export function handleLandingAudio(player, playerAudio) {
  if (player.justLanded && player.landedOnPlatform && !player.isSliding) {
    playerAudio.playLanding();
    player.justLanded = false;
    player.landedOnPlatform = false;
  }
}
