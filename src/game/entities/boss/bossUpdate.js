import { FACING_LEFT, FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../config/config.js";

/**
 * Updates boss.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../player/player.class.js").Player} player Player instance.
 */
export function updateBoss(boss, dt, player) {
  if (handleBossDeath(boss, dt)) return;
  updateBossCooldowns(boss, dt);
  if (handleBossHitStun(boss, dt)) return;
  if (handleBossHurtAnim(boss, dt)) return;
  const playerInfo = boss.getPlayerDelta(player);
  handleDeadPlayerState(boss, player);
  handleBossJump(boss, playerInfo);
  if (handleBossAttackState(boss, dt, player)) return;
  if (boss.tryStartAttack(playerInfo, player)) return;
  handleBossMovement(boss, dt, player, playerInfo);
}

/**
 * Handles boss death.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleBossDeath(boss, dt) {
  if (!boss.isDead) return false;
  boss.isChasing = false;
  updateBossDeathFrames(boss, dt);
  updateBossDeathTimer(boss, dt);
  return true;
}

/**
 * Updates boss death frames.
 * Advances animation state and sprites.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
function updateBossDeathFrames(boss, dt) {
  if (boss.deathDone) return;
  boss.frameTime += dt;
  if (boss.frameTime < boss.frameSpeed) return;
  boss.frameTime = 0;
  boss.currentFrame = Math.min(boss.currentFrame + 1, boss.currentAnimation.length - 1);
  boss.sprite = boss.currentAnimation[boss.currentFrame];
  if (boss.currentFrame === boss.currentAnimation.length - 1) {
    boss.deathDone = true;
  }
}

/**
 * Updates boss death timer.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
function updateBossDeathTimer(boss, dt) {
  if (boss.deathTimer > 0) {
    boss.deathTimer = Math.max(0, boss.deathTimer - dt);
  }
}

/**
 * Updates boss cooldowns.
 * Applies physics updates like gravity and velocity.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
function updateBossCooldowns(boss, dt) {
  updateBossTimer(boss, "recentSlideHit", dt);
  updateBossTimer(boss, "chaseCooldown", dt);
  updateBossTimer(boss, "attack1Cooldown", dt);
  updateBossTimer(boss, "attack2Cooldown", dt);
  updateBossTimer(boss, "runningCooldown", dt);
  updateBossTimer(boss, "runningBurstTimer", dt);
  updateBossTimer(boss, "jumpCooldownTimer", dt);
}

/**
 * Updates boss timer.
 * Uses boss, timerKey, dt to perform the operation.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} timerKey Timer key.
 * @param {number} dt Delta time in seconds.
 */
function updateBossTimer(boss, timerKey, dt) {
  if (boss[timerKey] > 0) boss[timerKey] = Math.max(0, boss[timerKey] - dt);
}

/**
 * Handles boss hit stun.
 * Advances animation state and sprites.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleBossHitStun(boss, dt) {
  if (boss.hitStun <= 0) return false;
  boss.hitStun = Math.max(0, boss.hitStun - dt);
  boss.isChasing = false;
  boss.isAttacking = false;
  boss.setAnimation(boss.hurtFrames || boss.idleFrames);
  boss.currentFrame = 0;
  boss.sprite = boss.currentAnimation[0];
  return true;
}

/**
 * Handles boss hurt anim.
 * Advances animation state and sprites.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function handleBossHurtAnim(boss, dt) {
  if (boss.hurtAnimTimer <= 0) return false;
  boss.hurtAnimTimer = Math.max(0, boss.hurtAnimTimer - dt);
  boss.isChasing = false;
  boss.isAttacking = false;
  boss.setAnimation(boss.hurtFrames || boss.idleFrames);
  boss.animate(dt);
  applyBossGravityAndLanding(boss, dt);
  return true;
}

/**
 * Handles dead player state.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 */
function handleDeadPlayerState(boss, player) {
  if (!player?.isDead) return;
  boss.isChasing = false;
  boss.isAttacking = false;
}

/**
 * Handles boss jump.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 */
function handleBossJump(boss, playerInfo) {
  const wantJump =
    boss.onGround &&
    !boss.isAttacking &&
    playerInfo &&
    playerInfo.deltaY < -boss.jumpHeightThreshold &&
    Math.abs(playerInfo.deltaX) <= boss.jumpHorizontalRange &&
    boss.jumpCooldownTimer <= 0;
  if (!wantJump) return;
  boss.jump();
  boss.jumpCooldownTimer = boss.jumpCooldown;
  if (boss.jumpFrames) boss.setAnimation(boss.jumpFrames);
}

/**
 * Handles boss attack state.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
function handleBossAttackState(boss, dt, player) {
  if (!boss.isAttacking) return false;
  updateBossAttackAnimation(boss, dt);
  boss.tryDealAttackDamage(player, 0.2);
  applyBossGravityAndLanding(boss, dt);
  finishBossAttackIfNeeded(boss);
  boss.isChasing = false;
  return true;
}

/**
 * Updates boss attack animation.
 * Advances animation state and sprites.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
function updateBossAttackAnimation(boss, dt) {
  boss.attackTimer -= dt;
  const atkFrames = boss.activeAttackFrames || boss.attackFrames;
  boss.setAnimation(atkFrames);
  boss.animate(dt);
}

/**
 * Finish boss attack if needed.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 */
function finishBossAttackIfNeeded(boss) {
  if (boss.attackTimer > 0) return;
  boss.isAttacking = false;
  boss.hasHitDuringAttack = false;
  boss.attackMoveSpeed = 0;
  boss.activeAttackFrames = null;
  boss.activeAttackRange = null;
  boss.activeHeightTolerance = null;
}

/**
 * Handles boss movement.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 */
function handleBossMovement(boss, dt, player, playerInfo) {
  const movementContext = getBossMovementContext(boss, player, playerInfo);
  boss.isChasing = movementContext.isChasing;
  boss.updateRunState();
  let moveDirection = getBossMoveDir(boss, playerInfo);
  moveDirection = adjustBossMoveDir(boss, moveDirection, dt, movementContext);
  applyBossMove(boss, dt, moveDirection);
  const landed = applyBossGravityAndLandingWithState(boss, dt);
  handleBossLandingImpact(boss, player, landed);
  handleBossCollisionDamage(boss, player);
  updateBossMovementAnimation(boss, dt);
  clampBossMovement(boss);
}

/**
 * Returns boss movement context.
 * Updates the player state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @returns {Object} Boss movement context.
 */
function getBossMovementContext(boss, player, playerInfo) {
  const platform = boss.getPlatformUnderfoot();
  boss.currentPlatform = platform || null;
  const onLowestPlatform = boss.isOnLowestPlatform();
  const fromChasing = boss.isChasing;
  const canChase =
    boss.chaseCooldown <= 0 &&
    player &&
    !player.isDead &&
    boss.shouldChasePlayer(playerInfo, fromChasing);
  const blockedByEdge = isBossEdgeBlocked(boss, playerInfo, canChase, onLowestPlatform, platform);
  const isChasing = canChase && !blockedByEdge;
  return { platform, onLowestPlatform, fromChasing, isChasing };
}

/**
 * Is boss edge blocked.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @param {boolean} canChase Whether chase.
 * @param {Function} onLowestPlatform On lowest platform.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @returns {boolean} Whether boss edge blocked.
 */
function isBossEdgeBlocked(boss, playerInfo, canChase, onLowestPlatform, platform) {
  const enemyCenterX = boss.x + boss.width / 2;
  const ignoreEdgeBlock =
    Number.isFinite(boss.movementMinX) && Number.isFinite(boss.movementMaxX);
  return (
    !ignoreEdgeBlock &&
    canChase &&
    onLowestPlatform &&
    platform &&
    ((playerInfo.deltaX < 0 && enemyCenterX <= platform.left + boss.edgeMargin) ||
      (playerInfo.deltaX > 0 && enemyCenterX >= platform.right - boss.edgeMargin))
  );
}

/**
 * Returns boss move dir.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @returns {*} Boss move dir.
 */
function getBossMoveDir(boss, playerInfo) {
  let moveDirection = boss.lastMoveDirection || boss.facing || FACING_LEFT;
  if (boss.isChasing) {
    const deltaX = playerInfo?.deltaX ?? 0;
    const targetDirection =
      Math.abs(deltaX) < 5
        ? boss.lastMoveDirection || boss.facing || FACING_RIGHT
        : Math.sign(deltaX) || FACING_RIGHT;
    moveDirection = targetDirection;
  } else { boss.patrol(); moveDirection = boss.patrolDirection; }
  return moveDirection;
}

/**
 * Adjust boss move dir.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {*} moveDirection Move direction.
 * @param {number} dt Delta time in seconds.
 * @param {*} movementContext Movement context.
 * @returns {*} Result value.
 */
function adjustBossMoveDir(boss, moveDirection, dt, movementContext) {
  if (!movementContext.platform) return moveDirection;
  return boss.adjustForEdges(
    moveDirection,
    dt,
    movementContext.platform,
    movementContext.onLowestPlatform,
    movementContext.fromChasing
  );
}

/**
 * Applies boss move.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @param {*} moveDirection Move direction.
 */
function applyBossMove(boss, dt, moveDirection) {
  const moveSpeed = boss.isChasing && boss.isRunning ? boss.runSpeed : boss.speed;
  const runDirection = Math.sign(moveDirection || boss.facing || FACING_RIGHT) || FACING_RIGHT;
  boss.x += runDirection * moveSpeed * dt;
  boss.facing = runDirection;
  boss.lastMoveDirection = runDirection;
}

/**
 * Applies boss gravity and landing.
 * Applies physics updates like gravity and velocity.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
function applyBossGravityAndLanding(boss, dt) {
  const previousBottom = boss.y + boss.height;
  boss.applyApexGravity(dt);
  const currentBottom = boss.y + boss.height;
  boss.handlePlatformLanding(previousBottom, currentBottom);
}

/**
 * Applies boss gravity and landing with state.
 * Applies physics updates like gravity and velocity.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
function applyBossGravityAndLandingWithState(boss, dt) {
  const previousBottom = boss.y + boss.height;
  const wasOnGround = boss.onGround;
  boss.applyApexGravity(dt);
  const currentBottom = boss.y + boss.height;
  boss.handlePlatformLanding(previousBottom, currentBottom);
  const landed = !wasOnGround && boss.onGround;
  boss.wasOnGround = boss.onGround;
  return landed;
}

/**
 * Handles boss landing impact.
 * Updates the player state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {*} landed Landed.
 */
function handleBossLandingImpact(boss, player, landed) {
  if (!landed) return;
  if (player && !player.isDead && player.onGround && player.applyDizzy) {
    player.applyDizzy();
  }
  boss.world?.camera?.shake?.(0.25, 8);
}

/**
 * Handles boss collision damage.
 * Updates the player state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 */
function handleBossCollisionDamage(boss, player) {
  const playerCanBeHit =
    player &&
    !player.isDead &&
    !player.isSliding &&
    player.invulnerableTimer <= 0;
  const isColliding = playerCanBeHit && boss.collidesWith(player);
  if (!isColliding) return;
  player.takeDamage?.(boss.damage, { useDizzy: false });
  applyPlayerInvulnerability(player);
}

/**
 * Applies player invulnerability.
 * Updates the player state.
 * @param {import("../player/player.class.js").Player} player Player instance.
 */
function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

/**
 * Updates boss movement animation.
 * Advances animation state and sprites.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} dt Delta time in seconds.
 */
function updateBossMovementAnimation(boss, dt) {
  const walkAnim = boss.isChasing ? boss.runFrames : boss.walkFrames;
  if (boss.hurtAnimTimer > 0 && boss.hurtFrames) {
    boss.setAnimation(boss.hurtFrames);
    boss.animate(dt);
  } else {
    boss.setAnimation(walkAnim);
    boss.animate(dt);
  }
}

/**
 * Clamp boss movement.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 */
function clampBossMovement(boss) {
  if (Number.isFinite(boss.movementMinX)) {
    boss.x = Math.max(boss.x, boss.movementMinX);
  }
  if (Number.isFinite(boss.movementMaxX)) {
    boss.x = Math.min(boss.x, boss.movementMaxX);
  }
}
