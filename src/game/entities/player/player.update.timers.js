/**
 * Updates cooldowns and timers.
 * Used to advance state during the update loop for world state updates.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
export function updateCooldownsAndTimers(player, dt) {
  const slideJustEnded = player.wasSlidingPreviousFrame && !player.isSliding;
  updateSlideBlockGrace(player, dt);
  updateShootCooldown(player, dt);
  updateGunPulse(player, dt);
  updateInvulnerabilityTimers(player, dt);
  if (slideJustEnded) applyPostSlideInvulnerability(player);
}

/**
 * Updates slide block grace.
 * Used to advance state during the update loop for physics updates.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateSlideBlockGrace(player, dt) {
  if (player.slideBlockGrace > 0) {
    player.slideBlockGrace = Math.max(0, player.slideBlockGrace - dt);
  }
}

/**
 * Updates shoot cooldown.
 * Used to advance state during the update loop for timed actions.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateShootCooldown(player, dt) {
  if (player.shootCooldown > 0) {
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  }
}

/**
 * Updates gun pulse.
 * Used to advance state during the update loop for collectable handling.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateGunPulse(player, dt) {
  const gunPulseDecayRate = 4;
  if (player.gunPulse > 0) player.gunPulse = Math.max(0, player.gunPulse - dt * gunPulseDecayRate);
}

/**
 * Updates invulnerability timers.
 * Used to advance state during the update loop for world state updates.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 */
function updateInvulnerabilityTimers(player, dt) {
  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
  }
  if (player.slideInvulWindow > 0) {
    player.slideInvulWindow = Math.max(0, player.slideInvulWindow - dt);
  }
}

/**
 * Applies post slide invulnerability.
 * Used to keep state consistent before the next step for physics updates.
 * @param {Player} player Player instance.
 */
export function applyPostSlideInvulnerability(player) {
  player.invulnerableTimer = Math.max(
    player.invulnerableTimer,
    player.slideInvulnerableAfter
  );
  player.slideInvulWindow = Math.max(
    player.slideInvulWindow,
    player.slideInvulnerableAfter
  );
}
