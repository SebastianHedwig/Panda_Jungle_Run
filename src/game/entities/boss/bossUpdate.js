import { FACING_LEFT, FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../config/config.js";

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

function handleBossDeath(boss, dt) {
  if (!boss.isDead) return false;
  boss.isChasing = false;
  updateBossDeathFrames(boss, dt);
  updateBossDeathTimer(boss, dt);
  return true;
}

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

function updateBossDeathTimer(boss, dt) {
  if (boss.deathTimer > 0) {
    boss.deathTimer = Math.max(0, boss.deathTimer - dt);
  }
}

function updateBossCooldowns(boss, dt) {
  updateBossTimer(boss, "recentSlideHit", dt);
  updateBossTimer(boss, "chaseCooldown", dt);
  updateBossTimer(boss, "attack1Cooldown", dt);
  updateBossTimer(boss, "attack2Cooldown", dt);
  updateBossTimer(boss, "runningCooldown", dt);
  updateBossTimer(boss, "runningBurstTimer", dt);
  updateBossTimer(boss, "jumpCooldownTimer", dt);
}

function updateBossTimer(boss, timerKey, dt) {
  if (boss[timerKey] > 0) boss[timerKey] = Math.max(0, boss[timerKey] - dt);
}

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

function handleDeadPlayerState(boss, player) {
  if (!player?.isDead) return;
  boss.isChasing = false;
  boss.isAttacking = false;
}

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

function handleBossAttackState(boss, dt, player) {
  if (!boss.isAttacking) return false;
  updateBossAttackAnimation(boss, dt);
  boss.tryDealAttackDamage(player, 0.2);
  applyBossGravityAndLanding(boss, dt);
  finishBossAttackIfNeeded(boss);
  boss.isChasing = false;
  return true;
}

function updateBossAttackAnimation(boss, dt) {
  boss.attackTimer -= dt;
  const atkFrames = boss.activeAttackFrames || boss.attackFrames;
  boss.setAnimation(atkFrames);
  boss.animate(dt);
}

function finishBossAttackIfNeeded(boss) {
  if (boss.attackTimer > 0) return;
  boss.isAttacking = false;
  boss.hasHitDuringAttack = false;
  boss.attackMoveSpeed = 0;
  boss.activeAttackFrames = null;
  boss.activeAttackRange = null;
  boss.activeHeightTolerance = null;
}

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

function applyBossMove(boss, dt, moveDirection) {
  const moveSpeed = boss.isChasing && boss.isRunning ? boss.runSpeed : boss.speed;
  const runDirection = Math.sign(moveDirection || boss.facing || FACING_RIGHT) || FACING_RIGHT;
  boss.x += runDirection * moveSpeed * dt;
  boss.facing = runDirection;
  boss.lastMoveDirection = runDirection;
}

function applyBossGravityAndLanding(boss, dt) {
  const previousBottom = boss.y + boss.height;
  boss.applyApexGravity(dt);
  const currentBottom = boss.y + boss.height;
  boss.handlePlatformLanding(previousBottom, currentBottom);
}

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

function handleBossLandingImpact(boss, player, landed) {
  if (!landed) return;
  if (player && !player.isDead && player.onGround && player.applyDizzy) {
    player.applyDizzy();
  }
  boss.world?.camera?.shake?.(0.25, 8);
}

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

function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

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

function clampBossMovement(boss) {
  if (Number.isFinite(boss.movementMinX)) {
    boss.x = Math.max(boss.x, boss.movementMinX);
  }
  if (Number.isFinite(boss.movementMaxX)) {
    boss.x = Math.min(boss.x, boss.movementMaxX);
  }
}
