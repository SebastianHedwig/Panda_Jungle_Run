/**
 * Updates.
 * Used to advance state during the update loop for UI interaction handling.
 * @param {number} dt Delta time in seconds.
 * @param {Player} player Player instance.
 */
export function update(dt, player) {
  if (!player) return;
  const { coinLerpSpeed, hudPulseDecaySpeed, healthPulseDecaySpeed } = this.getUpdateSpeeds();
  this.updateCoinDisplay(player, dt, coinLerpSpeed);
  this.updatePulseTimes(dt);
  this.decayHudPulse(player, dt, hudPulseDecaySpeed);
  this.decayHealthPulse(player, dt, healthPulseDecaySpeed);
}

/**
 * Returns update speeds.
 * Used to provide update speeds for UI interaction handling.
 * @returns {Object} Update speeds.
 */
export function getUpdateSpeeds() {
  return { coinLerpSpeed: 10, hudPulseDecaySpeed: 4, healthPulseDecaySpeed: 2 };
}

/**
 * Updates coin display.
 * Used to advance state during the update loop for UI interaction handling.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {number} coinLerpSpeed Coin lerp speed.
 */
export function updateCoinDisplay(player, dt, coinLerpSpeed) {
  this.displayCoinValue += (player.coins - this.displayCoinValue) * dt * coinLerpSpeed;
}

/**
 * Updates pulse times.
 * Used to advance state during the update loop for UI interaction handling.
 * @param {number} dt Delta time in seconds.
 */
export function updatePulseTimes(dt) {
  this.heartPulseTime += dt;
}

/**
 * Decay hud pulse.
 * Used to support UI interaction handling.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {number} hudPulseDecaySpeed Hud pulse decay speed.
 */
export function decayHudPulse(player, dt, hudPulseDecaySpeed) {
  if (player.hudPulse > 0) player.hudPulse = Math.max(0, player.hudPulse - dt * hudPulseDecaySpeed);
}

/**
 * Decay health pulse.
 * Used to support UI interaction handling.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {number} healthPulseDecaySpeed Health pulse decay speed.
 */
export function decayHealthPulse(player, dt, healthPulseDecaySpeed) {
  if (player.healthPulse > 0) player.healthPulse = Math.max(0, player.healthPulse - dt * healthPulseDecaySpeed);
}
