/**
 * Applies platform collisions.
 * Used to keep state consistent before the next step for collision and hit testing.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 */
export function applyPlatformCollisions(player) {
  if (this.shouldSkipCollision(player)) return;
  const collisionState = this.getCollisionState(player);
  for (const platform of this.platforms) {
    const overlaps = this.getPlatformOverlapState(platform, collisionState);
    if (this.applyLandingCollision(platform, player, collisionState, overlaps)) continue;
    this.applySideWallCollision(platform, player, collisionState, overlaps);
  }
  this.applyPostCollisionEffects(player, collisionState);
}

/**
 * Should skip collision.
 * Used to decide collision outcomes.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @returns {boolean} Whether skip collision.
 */
export function shouldSkipCollision(player) {
  return player?.isDead || player?.collisionDisabled;
}

/**
 * Returns collision config.
 * Used to provide collision config for collision and hit testing.
 * @returns {Object} Collision config.
 */
export function getCollisionConfig() {
  return {
    landingEdgePadding: 2,
    headBumpMaxPadding: 20,
    headBumpPaddingRatio: 0.2,
    groundedTolerancePx: 4,
    slideBlockMovementThreshold: 0.5,
  };
}

/**
 * Returns player collision metrics.
 * Used to provide player collision metrics for collision and hit testing.
 * Applies physics updates like gravity and velocity.
 * @param {Player} player Player instance.
 * @returns {Object} Player collision metrics.
 */
export function getPlayerCollisionMetrics(player) {
  const wasOnGroundBefore = player.onGround;
  const previousX = player?._preCollisionX ?? player.x;
  const playerLeft = player.x;
  const playerRight = player.x + player.width;
  const previousBottom = player.y + player.height - player.velocityY;
  const currentBottom = player.y + player.height;
  const currentTop = player.y;
  const playerBox = player.getHitbox ? player.getHitbox() : player;
  return { wasOnGroundBefore, previousX, playerLeft, playerRight, previousBottom, currentBottom, currentTop, playerBox };
}

/**
 * Resets player ground state.
 * Used to support collision and hit testing.
 * @param {Player} player Player instance.
 */
export function resetPlayerGroundState(player) {
  player.onGround = false;
  player.landedOnPlatform = false;
}

/**
 * Returns collision state.
 * Used to provide collision state for collision and hit testing.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @returns {Object} Collision state.
 */
export function getCollisionState(player) {
  const collisionConfig = this.getCollisionConfig();
  const playerMetrics = this.getPlayerCollisionMetrics(player);
  this.resetPlayerGroundState(player);
  return { ...collisionConfig, ...playerMetrics, isGrounded: false };
}

/**
 * Returns platform overlap state.
 * Used to provide platform overlap state for collision and hit testing.
 * Performs hitbox or collision checks.
 * @param {Platform} platform Platform.
 * @param {*} collisionState Collision state.
 * @returns {Object} Platform overlap state.
 */
export function getPlatformOverlapState(platform, collisionState) {
  const overlapsY = collisionState.currentBottom > platform.top && collisionState.currentTop < platform.bottom;
  const overlapsX = collisionState.playerRight > platform.left && collisionState.playerLeft < platform.right;
  const overlapsXLanding = collisionState.playerRight > platform.left - collisionState.landingEdgePadding && collisionState.playerLeft < platform.right + collisionState.landingEdgePadding;
  const headBumpPadding = Math.min(collisionState.headBumpMaxPadding, Math.max(0, (platform.right - platform.left) * collisionState.headBumpPaddingRatio));
  const overlapsXHead = collisionState.playerBox.x + collisionState.playerBox.width > platform.left + headBumpPadding && collisionState.playerBox.x < platform.right - headBumpPadding;
  const overlapsXSprite = collisionState.playerBox.x + collisionState.playerBox.width > platform.x && collisionState.playerBox.x < platform.x + platform.width;
  return { overlapsY, overlapsX, overlapsXLanding, overlapsXHead, overlapsXSprite };
}

/**
 * Applies landing collision.
 * Used to keep state consistent before the next step for collision and hit testing.
 * Performs hitbox or collision checks.
 * @param {Platform} platform Platform.
 * @param {Player} player Player instance.
 * @param {*} collisionState Collision state.
 * @param {*} overlaps Overlaps.
 * @returns {*} Result value.
 */
export function applyLandingCollision(platform, player, collisionState, overlaps) {
  if (!platform.supportsLanding || !overlaps.overlapsY || !overlaps.overlapsXLanding) return false;
  if (this.applyLandingFromAbove(player, platform, collisionState)) return true;
  if (this.applyStayGrounded(player, platform, collisionState)) return true;
  if (this.applyHeadBump(player, platform, collisionState, overlaps)) return true;
  return false;
}

/**
 * Applies landing from above.
 * Used to keep state consistent before the next step for collision and hit testing.
 * Applies physics updates like gravity and velocity.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @param {Platform} platform Platform.
 * @param {*} collisionState Collision state.
 * @returns {*} Result value.
 */
export function applyLandingFromAbove(player, platform, collisionState) {
  if (player.velocityY <= 0 || collisionState.previousBottom > platform.top || collisionState.currentBottom < platform.top) return false;
  player.y = platform.top - player.height;
  player.velocityY = 0;
  player.onGround = true;
  collisionState.isGrounded = true;
  if (!collisionState.wasOnGroundBefore) {
    player.justLanded = true;
    player.landedOnPlatform = true;
  }
  return true;
}

/**
 * Applies stay grounded.
 * Used to keep state consistent before the next step for collision and hit testing.
 * Applies physics updates like gravity and velocity.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @param {Platform} platform Platform.
 * @param {*} collisionState Collision state.
 * @returns {*} Result value.
 */
export function applyStayGrounded(player, platform, collisionState) {
  if (player.velocityY < 0) return false;
  if (
    collisionState.currentBottom < platform.top || collisionState.currentBottom > platform.top + collisionState.groundedTolerancePx
  ) return false;
  player.y = platform.top - player.height;
  player.velocityY = 0;
  player.onGround = true;
  collisionState.isGrounded = true;
  return true;
}

/**
 * Applies head bump.
 * Used to keep state consistent before the next step for collision and hit testing.
 * Applies physics updates like gravity and velocity.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @param {Platform} platform Platform.
 * @param {*} collisionState Collision state.
 * @param {*} overlaps Overlaps.
 * @returns {*} Result value.
 */
export function applyHeadBump(player, platform, collisionState, overlaps) {
  if (player.velocityY >= 0) return false;
  if (platform.type === "middleShort") return false;
  if (!overlaps.overlapsXHead && !overlaps.overlapsXSprite) return false;
  if (
    collisionState.currentTop > platform.bottom || collisionState.currentTop - player.velocityY < platform.bottom
  ) return false;
  player.y = platform.bottom;
  player.velocityY = 0;
  return true;
}

/**
 * Applies side wall collision.
 * Used to keep state consistent before the next step for collision and hit testing.
 * Applies physics updates like gravity and velocity.
 * Performs hitbox or collision checks.
 * @param {Platform} platform Platform.
 * @param {Player} player Player instance.
 * @param {*} collisionState Collision state.
 * @param {*} overlaps Overlaps.
 */
export function applySideWallCollision(platform, player, collisionState, overlaps) {
  if (!platform.hasSideWalls || !overlaps.overlapsY || !overlaps.overlapsX) return;
  if (collisionState.currentBottom <= platform.top + platform.sideWallGap) return;
  if (player.velocityY < 0) return;
  if (player.x + player.width > platform.left && player.x <= platform.left) {
    player.x = platform.left - player.width;
  }
  if (player.x < platform.right && player.x + player.width >= platform.right) {
    player.x = platform.right;
  }
}

/**
 * Applies post collision effects.
 * Used to keep state consistent before the next step for collision and hit testing.
 * Performs hitbox or collision checks.
 * @param {Player} player Player instance.
 * @param {*} collisionState Collision state.
 */
export function applyPostCollisionEffects(player, collisionState) {
  if (collisionState.isGrounded && player.markSafePosition)
    player.markSafePosition();
    player.handleFallOffWorld(collisionState.isGrounded, collisionState.currentBottom, this.canvas.height);
    this.applyHorizontalLimits(player);
    this.stopSlideIfBlocked(player, collisionState.previousX, collisionState.slideBlockMovementThreshold);
}

/**
 * Applies horizontal limits.
 * Used to keep state consistent before the next step for collision and hit testing.
 * @param {Player} player Player instance.
 */
export function applyHorizontalLimits(player) {
  if (player.x < this.left) player.x = this.left;
  if (player.x > this.right - player.width) player.x = this.right - player.width;
}

/**
 * Stops slide if blocked.
 * Used to support collision and hit testing.
 * @param {Player} player Player instance.
 * @param {number} previousX Previous X.
 * @param {*} slideBlockMovementThreshold Slide block movement threshold.
 */
export function stopSlideIfBlocked(player, previousX, slideBlockMovementThreshold) {
  const deltaX = Math.abs(player.x - previousX);
  if (player.isSliding && player.slideBlockGrace <= 0 && deltaX < slideBlockMovementThreshold) {
    player.isSliding = false;
  }
}
