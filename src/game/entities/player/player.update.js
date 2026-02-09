import { updateCooldownsAndTimers } from "./player.update.timers.js";
import { handleDeathFlow } from "./player.update.death.js";
import { handleHurtFlow } from "./player.update.hurt.js";
import { handleCombatFlow } from "./player.update.combat.js";
import { handleSlideFlow } from "./player.update.slide.js";
import { handleMovementAndJump } from "./player.update.movement.js";

/**
 * Updates player.
 * Used to advance state during the update loop for world state updates.
 * Triggers audio playback or updates audio state.
 * @param {Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @param {Input} input Input handler.
 * @param {Player} playerAudio Player audio.
 */
export function updatePlayer(player, dt, input, playerAudio) {
  prepareUpdateFrame(player, playerAudio);
  updateCooldownsAndTimers(player, dt);
  if (handleDeathFlow(player, dt)) return;
  if (handleHurtFlow(player, dt)) return;
  if (handleCombatFlow(player, dt, input)) return;
  if (handleSlideFlow(player, dt, input, playerAudio)) return;
  handleMovementAndJump(player, dt, input, playerAudio);
}

/**
 * Prepares update frame.
 * Used to support animation timing.
 * Triggers audio playback or updates audio state.
 * @param {Player} player Player instance.
 * @param {Player} playerAudio Player audio.
 */
function prepareUpdateFrame(player, playerAudio) {
  player._preCollisionX = player.x;
  if (player.healthPoints > 0) return;
  if (!player.isDead) player.startDeath();
  else playDeathSoundOnce(player, playerAudio);
}

/**
 * Plays death sound once.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {Player} player Player instance.
 * @param {Player} playerAudio Player audio.
 */
function playDeathSoundOnce(player, playerAudio) {
  if (player.deathSoundPlayed) return;
  playerAudio.playDead();
  player.deathSoundPlayed = true;
}
