import { FACING_LEFT, FACING_RIGHT } from "../../../../config/config.js";

/**
 * Returns adjacent platform search.
 * Used to provide adjacent platform search for platform collision handling.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Platform} currentPlatform Current platform.
 * @param {*} moveDirection Move direction.
 * @param {number} footX Foot X.
 * @returns {Object} Adjacent platform search.
 */
export function getAdjacentPlatformSearch(enemy, currentPlatform, moveDirection, footX) {
  const adjacentPlatformLookaheadFactor = 3;
  const minAdjacentPlatformToleranceY = 4;
  const toleranceY = Math.max(minAdjacentPlatformToleranceY, enemy.edgeMargin);
  const boundary = moveDirection > 0 ? currentPlatform.right : currentPlatform.left;
  const lookStart = boundary - enemy.edgeMargin;
  const lookEnd = boundary + enemy.edgeMargin * adjacentPlatformLookaheadFactor * moveDirection;
  const minX = Math.min(lookStart, lookEnd, footX - enemy.edgeMargin);
  const maxX = Math.max(lookStart, lookEnd, footX + enemy.edgeMargin);
  return { toleranceY, minX, maxX };
}

/**
 * Is adjacent platform.
 * Used to decide platform interactions.
 * Uses platform, currentPlatform, searchContext to perform the operation.
 * @param {Platform} platform Platform.
 * @param {Platform} currentPlatform Current platform.
 * @param {*} searchContext Search context.
 * @returns {boolean} Whether adjacent platform.
 */
export function isAdjacentPlatform(platform, currentPlatform, searchContext) {
  return (
    platform !== currentPlatform &&
    platform.supportsLanding &&
    Math.abs(platform.top - currentPlatform.top) <= searchContext.toleranceY &&
    platform.right >= searchContext.minX &&
    platform.left <= searchContext.maxX
  );
}

/**
 * Try land on platform.
 * Used to support platform collision handling.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} previousBottom Previous bottom.
 * @param {number} currentBottom Current bottom.
 * @returns {*} Result value.
 */
export function tryLandOnPlatform(enemy, previousBottom, currentBottom) {
  const footX = enemy.x + enemy.width / 2;
  for (const platform of enemy.world.platforms) {
    if (!platform.supportsLanding) continue;
    if (!isPlatformLanding(enemy, platform, previousBottom, currentBottom)) continue;
    applyPlatformLanding(enemy, platform, footX);
    return true;
  }
  return false;
}

/**
 * Is platform landing.
 * Used to decide platform interactions.
 * Applies physics updates like gravity and velocity.
 * Performs hitbox or collision checks.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Platform} platform Platform.
 * @param {number} previousBottom Previous bottom.
 * @param {number} currentBottom Current bottom.
 * @returns {boolean} Whether platform landing.
 */
function isPlatformLanding(enemy, platform, previousBottom, currentBottom) {
  const overlapsX = enemy.x + enemy.width > platform.left && enemy.x < platform.right;
  return overlapsX && enemy.velocityY > 0 && previousBottom <= platform.top && currentBottom >= platform.top;
}

/**
 * Applies platform landing.
 * Used to keep state consistent before the next step for platform collision handling.
 * Applies physics updates like gravity and velocity.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Platform} platform Platform.
 */
function applyPlatformLanding(enemy, platform) {
  enemy.y = platform.top - enemy.height;
  enemy.velocityY = 0;
  enemy.onGround = true;
  enemy.currentPlatform = platform;
  enemy.lastGroundY = enemy.y;
}

/**
 * Handles fall below canvas.
 * Used to centralize a specific behavior for physics updates.
 * Applies physics updates like gravity and velocity.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} currentBottom Current bottom.
 */
export function handleFallBelowCanvas(enemy, currentBottom) {
  enemy.onGround = false;
  const canvasH = enemy.world?.canvas?.height;
  if (currentBottom > canvasH + enemy.height) {
    enemy.y = enemy.lastGroundY;
    enemy.velocityY = 0;
    enemy.onGround = true;
  }
}

/**
 * Builds edge context.
 * Used to assemble required data for platform collision handling.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {*} moveDirection Move direction.
 * @param {number} dt Delta time in seconds.
 * @param {Platform} platform Platform.
 * @param {Function} onLowestPlatform On lowest platform.
 * @returns {Object} Edge context.
 */
export function buildEdgeContext(enemy, moveDirection, dt, platform, onLowestPlatform) {
  const platformBelow = enemy.findPlatformBelowAt(enemy.x + enemy.width / 2, platform.top);
  const currentFootX = enemy.x + enemy.width / 2;
  const nextX = enemy.x + moveDirection * enemy.speed * dt;
  const footX = nextX + enemy.width / 2;
  const beyondEdge = isBeyondPlatformEdge(enemy, platform, footX);
  const returningInside = isReturningInside(enemy, platform, currentFootX, moveDirection);
  const allowDrop = enemy.isChasing && !onLowestPlatform && !!platformBelow;
  const hasAdjacentFloor = onLowestPlatform && enemy.hasAdjacentPlatform(platform, moveDirection, footX);
  return { moveDirection, beyondEdge, returningInside, allowDrop, hasAdjacentFloor };
}

/**
 * Is beyond platform edge.
 * Used to decide platform interactions.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Platform} platform Platform.
 * @param {number} footX Foot X.
 * @returns {boolean} Whether beyond platform edge.
 */
function isBeyondPlatformEdge(enemy, platform, footX) {
  return footX < platform.left + enemy.edgeMargin || footX > platform.right - enemy.edgeMargin;
}

/**
 * Is returning inside.
 * Used to decide platform interactions.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Platform} platform Platform.
 * @param {number} currentFootX Current foot X.
 * @param {*} moveDirection Move direction.
 * @returns {boolean} Whether returning inside.
 */
function isReturningInside(enemy, platform, currentFootX, moveDirection) {
  return (
    (currentFootX >= platform.right - enemy.edgeMargin && moveDirection <= 0) ||
    (currentFootX <= platform.left + enemy.edgeMargin && moveDirection >= 0)
  );
}

/**
 * Should turn around.
 * Used to decide platform interactions.
 * Uses edgeContext to perform the operation.
 * @param {*} edgeContext Edge context.
 * @returns {boolean} Whether turn around.
 */
export function shouldTurnAround(edgeContext) {
  return edgeContext.beyondEdge && !edgeContext.returningInside && !edgeContext.allowDrop && !edgeContext.hasAdjacentFloor;
}

/**
 * Applies edge turn.
 * Used to keep state consistent before the next step for platform collision handling.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {*} edgeContext Edge context.
 * @param {*} fromChasing From chasing.
 * @returns {*} Result value.
 */
export function applyEdgeTurn(enemy, edgeContext, fromChasing) {
  enemy.patrolDirection = edgeContext.moveDirection > 0 ? FACING_LEFT : FACING_RIGHT;
  enemy.isChasing = false;
  if (fromChasing) applyChaseCooldown(enemy);
  const moveDirection = enemy.patrolDirection;
  enemy.facing = moveDirection;
  return moveDirection;
}

/**
 * Applies chase cooldown.
 * Used to keep state consistent before the next step for timed actions.
 * @param {EnemyBase} enemy Enemy instance.
 */
function applyChaseCooldown(enemy) {
  enemy.chaseCooldown = Math.max(enemy.chaseCooldown, enemy.chaseCooldownDuration);
}
