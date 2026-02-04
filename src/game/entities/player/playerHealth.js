import { HudPopup } from "../../effects/hudPopup.class.js";
import { PLAYER_FALL_DAMAGE } from "../../../config/config.js";

const msPerSecond = 1000;
const dizzyFrameDurationMultiplier = 2;

/**
 * Take damage. If omitted, default values are used.
 * Triggers audio playback or updates audio state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} [damageAmount] Damage amount.
 * @param {*} [hitEffects] Hit effects.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
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
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} damageAmount Damage amount.
 */
function applyDamageAmount(player, damageAmount) {
  player.healthPoints = Math.max(0, player.healthPoints - damageAmount);
  player.healthPulse = 1.0;
}

/**
 * Queues damage popup.
 * Uses player, damageAmount, hitEffects to perform the operation.
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} hitEffects Hit effects.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
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
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} gained Gained.
 */
function addHealPopup(player, gained) {
  if (gained <= 0 || !player.world?.hudPopups) return;
  const { popupX, popupY } = player.getPopupPosition();
  player.world.hudPopups.push(new HudPopup(`+${gained}❤️`, popupX, popupY, "heal"));
}

/**
 * Applies dizzy. If omitted, default values are used.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} [dizzyDuration] Dizzy duration.
 */
export function applyDizzy(player, dizzyDuration = 0) {
  if (player.isDead) return;
  const base = player.dizzyFrames?.length * player.frameSpeed * dizzyFrameDurationMultiplier;
  player.hurtPhase = "dizzy";
  player.isHurt = true;
  player.hurtUseDizzy = true;
  player.hurtPhaseTimer = dizzyDuration > 0 ? dizzyDuration : base;
  player.setAnimation(player.dizzyFrames || player.hurtFrames);
  player.currentFrame = 0;
}

/**
 * Starts hurt. If omitted, default values are used.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} [useDizzy] Use dizzy.
 * @returns {*} Result value.
 */
export function startHurt(player, useDizzy = true) {
  if (player.isDead) return;
  player.hurtUseDizzy = !!useDizzy;
  if (!player.hurtUseDizzy) return applyNoDizzyHurt(player);
  beginHurtPhases(player);
}

/**
 * Applies no dizzy hurt.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function applyNoDizzyHurt(player) {
  player.invulnerableTimer = Math.max(player.invulnerableTimer, player.invulnerableBlinkWindow);
  player.isHurt = false;
}

/**
 * Begin hurt phases.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function beginHurtPhases(player) {
  player.isHurt = true;
  const { hurtDuration, dizzyDuration } = getHurtDurations(player);
  player.hurtPhase = "hurt";
  player.hurtPhaseTimer = hurtDuration;
  player.invulnerableTimer = hurtDuration + dizzyDuration + player.invulnerableBlinkWindow;
  resetCombatOnHurt(player);
  if (player.hurtUseDizzy) setHurtAnimation(player);
}

/**
 * Returns hurt durations.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {Object} Hurt durations.
 */
function getHurtDurations(player) {
  const hurtDuration = (player.hurtFrames?.length) * player.frameSpeed;
  const dizzyDuration = player.hurtUseDizzy && player.dizzyFrames
    ? player.dizzyFrames.length * player.frameSpeed * dizzyFrameDurationMultiplier
    : 0;
  return { hurtDuration, dizzyDuration };
}

/**
 * Resets combat on hurt.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function resetCombatOnHurt(player) {
  player.isAttacking = false;
  player.isShooting = false;
}

/**
 * Sets hurt animation.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function setHurtAnimation(player) {
  player.setAnimation(player.dizzyFrames);
  player.currentFrame = 0;
}

/**
 * Updates hurt.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
export function updateHurt(player, dt) {
  if (!player.isHurt) return;
  player.hurtPhaseTimer -= dt;
  if (player.hurtPhaseTimer > 0) return;
  if (shouldEnterDizzy(player)) return startDizzyPhase(player);
  endHurt(player);
}

/**
 * Should enter dizzy.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {boolean} Whether enter dizzy.
 */
function shouldEnterDizzy(player) {
  return player.hurtUseDizzy && player.hurtPhase === "hurt" && player.dizzyFrames;
}

/**
 * Starts dizzy phase.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function startDizzyPhase(player) {
  player.hurtPhase = "dizzy";
  player.hurtPhaseTimer = getDizzyPhaseDuration(player);
  player.setAnimation(player.dizzyFrames);
  player.currentFrame = 0;
}

/**
 * Returns dizzy phase duration.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {*} Dizzy phase duration.
 */
function getDizzyPhaseDuration(player) {
  return (
    player.dizzyFrames.length *
      player.frameSpeed *
      dizzyFrameDurationMultiplier ||
    player.hurtDuration
  );
}

/**
 * End hurt.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function endHurt(player) {
  player.isHurt = false;
  player.hurtPhase = null;
}

/**
 * Starts death.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
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
 * @param {import("./player.class.js").Player} player Player instance.
 */
function markPlayerDead(player) {
  player.isDead = true;
}

/**
 * Notify death handler.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
 */
function stopDeathAudio(player) {
  player.world?.audio?.stopCrossfadeAndCleanup?.();
  player.world?.bossAudioPlayer?.stopAndCleanupBossAudio?.();
}

/**
 * Plays death sound once.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("./player.class.js").Player} playerAudio Player audio.
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
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
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
 * @param {import("./player.class.js").Player} player Player instance.
 */
function setDeathAnimation(player) {
  player.setAnimation(player.dieFrames);
  player.currentFrame = 0;
}

/**
 * Handles death landing.
 * Uses player, previousBottom, currentBottom to perform the operation.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {number} previousBottom Previous bottom.
 * @param {number} currentBottom Current bottom.
 */
export function handleDeathLanding(player, previousBottom, currentBottom) {
  const landingContext = getDeathLandingContext(player);
  if (tryLandOnPlatform(player, landingContext, previousBottom, currentBottom)) return;
  landOnGroundIfNeeded(player, landingContext, currentBottom);
}

/**
 * Returns death landing context.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {Object} Death landing context.
 */
function getDeathLandingContext(player) {
  const platforms = player.world?.platforms || [];
  const canvasHeight = player.world?.canvas?.height;
  const groundLevel = player.world?.baseGround ?? canvasHeight;
  const playerLeft = player.x;
  const playerRight = player.x + player.width;
  return { platforms, groundLevel, playerLeft, playerRight };
}

/**
 * Try land on platform.
 * Uses player, landingContext, previousBottom, currentBottom to perform the operation.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} landingContext Landing context.
 * @param {number} previousBottom Previous bottom.
 * @param {number} currentBottom Current bottom.
 * @returns {*} Result value.
 */
function tryLandOnPlatform(player, landingContext, previousBottom, currentBottom) {
  for (const platform of landingContext.platforms) {
    if (!canLandOnPlatform(player, platform, landingContext, previousBottom, currentBottom)) continue;
    applyPlatformLanding(player, platform);
    return true;
  }
  return false;
}

/**
 * Can land on platform.
 * Performs hitbox or collision checks.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @param {*} landingContext Landing context.
 * @param {number} previousBottom Previous bottom.
 * @param {number} currentBottom Current bottom.
 * @returns {boolean} Whether land on platform.
 */
function canLandOnPlatform(player, platform, landingContext, previousBottom, currentBottom) {
  if (!platform.supportsLanding) return false;
  const overlapsX = landingContext.playerRight > platform.left && landingContext.playerLeft < platform.right;
  const crossingTop = isCrossingPlatformTop(player, platform, previousBottom, currentBottom);
  return overlapsX && crossingTop;
}

/**
 * Is crossing platform top.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @param {number} previousBottom Previous bottom.
 * @param {number} currentBottom Current bottom.
 * @returns {boolean} Whether crossing platform top.
 */
function isCrossingPlatformTop(player, platform, previousBottom, currentBottom) {
  return (
    player.velocityY > 0 &&
    previousBottom <= platform.top &&
    currentBottom >= platform.top
  );
}

/**
 * Applies platform landing.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 */
function applyPlatformLanding(player, platform) {
  const landingTopPosition = platform.top - player.height;
  player.y = landingTopPosition;
  player.velocityY = 0;
  player.onGround = true;
}

/**
 * Land on ground if needed.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} landingContext Landing context.
 * @param {number} currentBottom Current bottom.
 */
function landOnGroundIfNeeded(player, landingContext, currentBottom) {
  if (currentBottom < landingContext.groundLevel) return;
  const groundTopPosition = landingContext.groundLevel - player.height;
  player.y = groundTopPosition;
  player.velocityY = 0;
  player.onGround = true;
}

/**
 * Respawn from fall.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {import("./player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
export function respawnFromFall(player) {
  if (player.isDead) return;
  applyFallDamage(player);
  if (player.healthPoints <= 0) return player.startDeath();
  respawnAtSafePosition(player);
  resetPostRespawnState(player);
}

/**
 * Applies fall damage.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function applyFallDamage(player) {
  player.healthPoints = Math.max(0, player.healthPoints - PLAYER_FALL_DAMAGE);
  player.healthPulse = 1.0;
}

/**
 * Respawn at safe position.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function respawnAtSafePosition(player) {
  player.x = player.lastSafePosX ?? player.x;
  const respawnYOffset = 5;
  player.y = (player.lastSafePosY ?? player.y) - respawnYOffset;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = true;
}

/**
 * Resets post respawn state.
 * Advances animation state and sprites.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 */
function resetPostRespawnState(player) {
  player.invulnerableTimer = 1.0;
  player.isHurt = false;
  player.isAttacking = false;
  player.isShooting = false;
  player.setAnimation(player.idleFrames);
  player.currentFrame = 0;
}

/**
 * Handles fall off world.
 * Applies physics updates like gravity and velocity.
 * Updates the player state.
 * @param {import("./player.class.js").Player} player Player instance.
 * @param {*} grounded Grounded.
 * @param {number} bottom Bottom.
 * @param {boolean} canvasHeight Canvas height.
 */
export function handleFallOffWorld(player, grounded, bottom, canvasHeight) {
  if (player.invulnerableTimer > 0) return;
  if (grounded) return;
  if (player.velocityY >= 0 && bottom >= canvasHeight + player.height) {
    player.respawnFromFall();
  }
}
