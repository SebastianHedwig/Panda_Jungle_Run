import { PLAYER_FALL_DAMAGE } from "../../../config/config.js";

/**
 * Handles death landing.
 * Used to centralize a specific behavior for combat effects.
 * Uses player, previousBottom, currentBottom to perform the operation.
 * @param {Player} player Player instance.
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
 * Used to provide death landing context for combat effects.
 * @param {Player} player Player instance.
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
 * Used to support combat effects.
 * Uses player, landingContext, previousBottom, currentBottom to perform the operation.
 * @param {Player} player Player instance.
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
 * Used to decide combat outcomes.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @param {Platform} platform Platform.
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
 * Used to decide combat outcomes.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @param {Platform} platform Platform.
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
 * Used to keep state consistent before the next step for combat effects.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @param {Platform} platform Platform.
 */
function applyPlatformLanding(player, platform) {
  const landingTopPosition = platform.top - player.height;
  player.y = landingTopPosition;
  player.velocityY = 0;
  player.onGround = true;
}

/**
 * Land on ground if needed.
 * Used to support combat effects.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
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
 * Used to support combat effects.
 * Spawns visual feedback effects.
 * @param {Player} player Player instance.
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
 * Used to keep state consistent before the next step for combat effects.
 * @param {Player} player Player instance.
 */
function applyFallDamage(player) {
  player.healthPoints = Math.max(0, player.healthPoints - PLAYER_FALL_DAMAGE);
  player.healthPulse = 1.0;
}

/**
 * Respawn at safe position.
 * Used to support camera-relative placement.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
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
 * Used to support combat effects.
 * Advances animation state and sprites.
 * @param {Player} player Player instance.
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
 * Used to centralize a specific behavior for combat effects.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
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
