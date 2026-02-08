import { HudPopup } from "../../effects/hudPopup.class.js";
import { startDeath } from "./player.health.death.js";
import { startHurt } from "./player.health.hurt.js";

const msPerSecond = 1000;

/**
 * Take damage. If omitted, default values are used.
 * Triggers audio playback or updates audio state.
 * @param {Player} player Player instance.
 * @param {number} [damageAmount] Damage amount.
 * @param {*} [hitEffects] Hit effects.
 * @param {Player} playerAudio Player audio.
 */
export function takeDamage(player, damageAmount = 1, hitEffects = {}, playerAudio) {
  if (player.isDead) return;
  applyDamageAmount(player, damageAmount);
  queueDamagePopup(player, damageAmount, hitEffects);
  handleDamageOutcome(player, hitEffects, playerAudio);
}

/**
 * Applies damage amount.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} damageAmount Damage amount.
 */
function applyDamageAmount(player, damageAmount) {
  player.healthPoints = Math.max(0, player.healthPoints - damageAmount);
  player.healthPulse = 1.0;
}

/**
 * Queues damage popup.
 * Uses player, damageAmount, hitEffects to perform the operation.
 * @param {Player} player Player instance.
 * @param {number} damageAmount Damage amount.
 * @param {*} hitEffects Hit effects.
 */
function queueDamagePopup(player, damageAmount, hitEffects) {
  const popupDelaySeconds = hitEffects?.popupDelay ?? 0;
  /**
   * Adds popup.
   * @returns {*} Result value.
   */
  const addPopup = () => addDamagePopup(player, damageAmount);
  schedulePopup(addPopup, popupDelaySeconds);
}

/**
 * Schedules popup.
 * Schedules timed actions.
 * @param {Function} addPopup Add popup.
 * @param {*} popupDelaySeconds Popup delay seconds.
 */
function schedulePopup(addPopup, popupDelaySeconds) {
  if (popupDelaySeconds > 0) setTimeout(addPopup, popupDelaySeconds * msPerSecond);
  else addPopup();
}

/**
 * Adds damage popup.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {Player} player Player instance.
 * @param {number} damageAmount Damage amount.
 */
function addDamagePopup(player, damageAmount) {
  if (!player.world?.hudPopups) return;
  const { popupX, popupY } = player.getPopupPosition();
  player.world.hudPopups.push(new HudPopup(`-${damageAmount}❤️`, popupX, popupY, "damage"));
}

/**
 * Handles damage outcome.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {*} hitEffects Hit effects.
 * @param {Player} playerAudio Player audio.
 * @returns {*} Result value.
 */
function handleDamageOutcome(player, hitEffects, playerAudio) {
  if (player.healthPoints <= 0) return startDeath(player, playerAudio);
  playerAudio.playOuch();
  startHurt(player, hitEffects?.useDizzy ?? true);
}

/**
 * Heal. If omitted, default values are used.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} [healAmount] Heal amount.
 */
export function heal(player, healAmount = 1) {
  if (player.isDead) return;
  const gained = applyHealAmount(player, healAmount);
  addHealPopup(player, gained);
  player.healthPulse = 1.0;
}

/**
 * Applies heal amount.
 * Updates the player state.
 * @param {Player} player Player instance.
 * @param {number} healAmount Heal amount.
 * @returns {*} Result value.
 */
function applyHealAmount(player, healAmount) {
  const before = player.healthPoints;
  player.healthPoints = Math.min(player.maxHealthPoints, player.healthPoints + healAmount);
  return player.healthPoints - before;
}

/**
 * Adds heal popup.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {Player} player Player instance.
 * @param {*} gained Gained.
 */
function addHealPopup(player, gained) {
  if (gained <= 0 || !player.world?.hudPopups) return;
  const { popupX, popupY } = player.getPopupPosition();
  player.world.hudPopups.push(new HudPopup(`+${gained}❤️`, popupX, popupY, "heal"));
}
