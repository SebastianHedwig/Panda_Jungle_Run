/**
 * Starts death.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {Player} playerAudio Player audio.
 */
export function startDeath(player, playerAudio) {
  if (player.isDead) return;
  markPlayerDead(player);
  notifyDeathHandler(player);
  stopDeathAudio(player);
  playDeathSoundOnce(player, playerAudio);
  resetDeathState(player);
}

/**
 * Marks player dead.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function markPlayerDead(player) {
  player.isDead = true;
}

/**
 * Notify death handler.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function notifyDeathHandler(player) {
  if (typeof player.onDeath === "function") {
    player.onDeath(player);
  }
}

/**
 * Stops death audio.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function stopDeathAudio(player) {
  player.world?.audio?.stopCrossfadeAndCleanup?.();
  player.world?.bossAudioPlayer?.stopAndCleanupBossAudio?.();
}

/**
 * Plays death sound once.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {Player} playerAudio Player audio.
 */
function playDeathSoundOnce(player, playerAudio) {
  if (!player.deathSoundPlayed) {
    playerAudio.playDead();
    player.deathSoundPlayed = true;
  }
}

/**
 * Resets death state.
 * Performs hitbox or collision checks.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function resetDeathState(player) {
  resetDeathCombat(player);
  resetDeathPhysics(player);
  setDeathAnimation(player);
  player.invulnerableTimer = 0;
  player.collisionDisabled = true;
  player.deathDone = false;
}

/**
 * Resets death combat.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function resetDeathCombat(player) {
  player.isHurt = false;
  player.isAttacking = false;
  player.isShooting = false;
}

/**
 * Resets death physics.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function resetDeathPhysics(player) {
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = true;
}

/**
 * Sets death animation.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {Player} player Player instance.
 */
function setDeathAnimation(player) {
  player.setAnimation(player.dieFrames);
  player.currentFrame = 0;
}
