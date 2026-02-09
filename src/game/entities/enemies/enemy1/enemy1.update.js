import { handleAttackState, tryStartAttackIfInRange, handlePlayerCollision } from "./enemy1.combat.js";

/**
 * Updates.
 * Used to advance state during the update loop for world state updates.
 * Advances animation state and sprites.
 * @param {number} dt Delta time in seconds.
 * @param {Player} player Player instance.
 * @returns {*} Result value.
 */
export function update(dt, player) {
  if (this.isDead) return handleDeathUpdate(this, dt);
  updateEnemyTimers(this, dt);
  if (handleHitStun(this, dt)) return;
  const playerInfo = this.getPlayerDelta(player);
  handleDeadPlayerState(this, player);
  if (handleAttackState(this, dt, player)) return;
  if (tryStartAttackIfInRange(this, playerInfo, player)) return;
  handleChaseAndMovement(this, dt, player, playerInfo);
  handlePlayerCollision(this, player);
  this.setAnimation(this.walkFrames);
  this.animate(dt);
}

/**
 * Handles death update.
 * Used to centralize a specific behavior for combat effects.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function handleDeathUpdate(enemy, dt) {
  enemy.isChasing = false;
  updateDeathAnimation(enemy, dt);
  updateRemovalTimers(enemy, dt);
}

/**
 * Updates death animation.
 * Used to advance state during the update loop for animation timing.
 * Advances animation state and sprites.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateDeathAnimation(enemy, dt) {
  if (enemy.deathDone) return;
  enemy.frameTime += dt;
  if (enemy.frameTime < enemy.frameSpeed) return;
  enemy.frameTime = 0;
  advanceDeathFrame(enemy);
}

/**
 * Advances death frame.
 * Used to support animation timing.
 * Advances animation state and sprites.
 * @param {EnemyBase} enemy Enemy instance.
 */
function advanceDeathFrame(enemy) {
  const lastFrameIndex = enemy.currentAnimation.length - 1;
  enemy.currentFrame = Math.min(enemy.currentFrame + 1, lastFrameIndex);
  enemy.sprite = enemy.currentAnimation[enemy.currentFrame];
  if (enemy.currentFrame === lastFrameIndex) enemy.deathDone = true;
}

/**
 * Updates removal timers.
 * Used to advance state during the update loop for world state updates.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateRemovalTimers(enemy, dt) {
  if (enemy.deathTimer > 0) {
    enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
  } else if (enemy.blinkTimer > 0) {
    enemy.blinkTimer = Math.max(0, enemy.blinkTimer - dt);
  } else {
    enemy.remove = true;
  }
}

/**
 * Updates enemy timers.
 * Used to advance state during the update loop for world state updates.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateEnemyTimers(enemy, dt) {
  if (enemy.recentSlideHit > 0) enemy.recentSlideHit = Math.max(0, enemy.recentSlideHit - dt);
  if (enemy.chaseCooldown > 0) enemy.chaseCooldown = Math.max(0, enemy.chaseCooldown - dt);
}

/**
 * Handles hit stun.
 * Used to centralize a specific behavior for combat effects.
 * Advances animation state and sprites.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleHitStun(enemy, dt) {
  if (enemy.hitStun <= 0) return false;
  enemy.hitStun = Math.max(0, enemy.hitStun - dt);
  enemy.isChasing = false;
  enemy.setAnimation(enemy.idleFrames); // freeze on first idle frame (no animation) for clear feedback
  enemy.currentFrame = 0;
  enemy.sprite = enemy.idleFrames[0];
  return true;
}

/**
 * Handles dead player state.
 * Used to centralize a specific behavior for world state updates.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} player Player instance.
 */
function handleDeadPlayerState(enemy, player) {
  if (!player?.isDead) return;
  enemy.isChasing = false;
  enemy.isAttacking = false;
}

/**
 * Handles chase and movement.
 * Used to centralize a specific behavior for physics updates.
 * Applies physics updates like gravity and velocity.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @param {Player} player Player instance.
 * @param {Player} playerInfo Player info.
 */
function handleChaseAndMovement(enemy, dt, player, playerInfo) {
  const platform = enemy.getPlatformUnderfoot();
  enemy.currentPlatform = platform || null;
  const chaseState = getChaseState(enemy, player, playerInfo, platform);
  enemy.isChasing = chaseState.isChasing;
  const moveDirection = getMoveDirection(enemy, playerInfo, chaseState);
  const adjustedMoveDirection = adjustMoveDirection(enemy, moveDirection, dt, platform, chaseState);
  applyHorizontalMovement(enemy, dt, adjustedMoveDirection);
  applyGravityAndLanding(enemy, dt);
}

/**
 * Returns chase state.
 * Used to provide chase state for world state updates.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} player Player instance.
 * @param {Player} playerInfo Player info.
 * @param {Platform} platform Platform.
 * @returns {Object} Chase state.
 */
function getChaseState(enemy, player, playerInfo, platform) {
  const onLowestPlatform = enemy.isOnLowestPlatform();
  const fromChasing = enemy.isChasing;
  const chaseReady = enemy.chaseCooldown <= 0;
  const hasLivingPlayer = !!player && !player.isDead;
  const playerInRange = enemy.shouldChasePlayer(playerInfo, fromChasing);
  const canChase = chaseReady && hasLivingPlayer && playerInRange;
  const blockedByEdge = isBlockedByEdge(enemy, playerInfo, canChase, onLowestPlatform, platform);
  const isChasing = canChase && !blockedByEdge;
  return { onLowestPlatform, fromChasing, isChasing };
}

/**
 * Is blocked by edge.
 * Used to decide control flow.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} playerInfo Player info.
 * @param {boolean} canChase Whether chase.
 * @param {Function} onLowestPlatform On lowest platform.
 * @param {Platform} platform Platform.
 * @returns {boolean} Whether blocked by edge.
 */
function isBlockedByEdge(enemy, playerInfo, canChase, onLowestPlatform, platform) {
  if (!canChase || !onLowestPlatform || !platform) return false;
  const enemyCenterX = enemy.x + enemy.width / 2;
  return (
    (playerInfo.deltaX < 0 && enemyCenterX <= platform.left + enemy.edgeMargin) ||
    (playerInfo.deltaX > 0 && enemyCenterX >= platform.right - enemy.edgeMargin)
  );
}

/**
 * Returns move direction.
 * Used to provide move direction for world state updates.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {Player} playerInfo Player info.
 * @param {*} chaseState Chase state.
 * @returns {*} Move direction.
 */
function getMoveDirection(enemy, playerInfo, chaseState) {
  let moveDirection = enemy.lastMoveDirection;
  if (chaseState.isChasing) {
    const deltaX = playerInfo.deltaX;
    const targetDirection = Math.abs(deltaX) < 1 
      ? enemy.lastMoveDirection
      : Math.sign(deltaX);
    enemy.facing = targetDirection;
    moveDirection = targetDirection;
    return moveDirection;
  }
  enemy.patrol();
  return enemy.patrolDirection;
}

/**
 * Adjust move direction.
 * Used to support world state updates.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {*} moveDirection Move direction.
 * @param {number} dt Delta time in seconds.
 * @param {Platform} platform Platform.
 * @param {*} chaseState Chase state.
 * @returns {*} Result value.
 */
function adjustMoveDirection(enemy, moveDirection, dt, platform, chaseState) {
  if (!platform) return moveDirection;
  return enemy.adjustForEdges(moveDirection, dt, platform, chaseState.onLowestPlatform, chaseState.fromChasing);
}

/**
 * Applies horizontal movement.
 * Used to keep state consistent before the next step for physics updates.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @param {*} moveDirection Move direction.
 */
function applyHorizontalMovement(enemy, dt, moveDirection) {
  enemy.x += moveDirection * enemy.speed * dt;
  enemy.lastMoveDirection = moveDirection;
}

/**
 * Applies gravity and landing.
 * Used to keep state consistent before the next step for physics updates.
 * Applies physics updates like gravity and velocity.
 * @param {EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function applyGravityAndLanding(enemy, dt) {
  const previousBottom = enemy.y + enemy.height;
  enemy.applyApexGravity(dt);
  const currentBottom = enemy.y + enemy.height;
  enemy.handlePlatformLanding(previousBottom, currentBottom);
}

