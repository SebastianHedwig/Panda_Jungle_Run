import {
  FACING_LEFT,
  FACING_RIGHT,
  PLAYER_HURT_IMMUNITY_TIME,
} from "../../../config/config.js";

export function updateBoss(boss, dt, player) {
  if (boss.isDead) {
    boss.isChasing = false;
    if (!boss.deathDone) {
      boss.frameTime += dt;
      if (boss.frameTime >= boss.frameSpeed) {
        boss.frameTime = 0;
        boss.currentFrame = Math.min(
          boss.currentFrame + 1,
          boss.currentAnimation.length - 1
        );
        boss.sprite = boss.currentAnimation[boss.currentFrame];
        if (boss.currentFrame === boss.currentAnimation.length - 1) {
          boss.deathDone = true;
        }
      }
    }

    if (boss.deathTimer > 0) {
      boss.deathTimer = Math.max(0, boss.deathTimer - dt);
    }

    return;
  }

  if (boss.recentSlideHit > 0) {
    boss.recentSlideHit = Math.max(0, boss.recentSlideHit - dt);
  }
  if (boss.chaseCooldown > 0) {
    boss.chaseCooldown = Math.max(0, boss.chaseCooldown - dt);
  }
  if (boss.attack1Cooldown > 0) {
    boss.attack1Cooldown = Math.max(0, boss.attack1Cooldown - dt);
  }
  if (boss.attack2Cooldown > 0) {
    boss.attack2Cooldown = Math.max(0, boss.attack2Cooldown - dt);
  }
  if (boss.runningCooldown > 0) {
    boss.runningCooldown = Math.max(0, boss.runningCooldown - dt);
  }
  if (boss.runningBurstTimer > 0) {
    boss.runningBurstTimer = Math.max(0, boss.runningBurstTimer - dt);
  }
  if (boss.jumpCooldownTimer > 0) {
    boss.jumpCooldownTimer = Math.max(0, boss.jumpCooldownTimer - dt);
  }

  if (boss.hitStun > 0) {
    boss.hitStun = Math.max(0, boss.hitStun - dt);
    boss.isChasing = false;
    boss.isAttacking = false;
    boss.setAnimation(boss.hurtFrames || boss.idleFrames);
    boss.currentFrame = 0;
    boss.sprite = boss.currentAnimation[0];
    return;
  }

  if (boss.hurtAnimTimer > 0) {
    boss.hurtAnimTimer = Math.max(0, boss.hurtAnimTimer - dt);
    boss.isChasing = false;
    boss.isAttacking = false;
    boss.setAnimation(boss.hurtFrames || boss.idleFrames);
    boss.animate(dt);
    const prevBottom = boss.y + boss.height;
    boss.applyApexGravity(dt);
    const currBottom = boss.y + boss.height;
    boss.handlePlatformLanding(prevBottom, currBottom);
    return;
  }

  const playerInfo = boss.getPlayerDelta(player);
  if (player?.isDead) {
    boss.isChasing = false;
    boss.isAttacking = false;
  }

  const wantJump =
    boss.onGround &&
    !boss.isAttacking &&
    playerInfo &&
    playerInfo.deltaY < -boss.jumpHeightThreshold &&
    Math.abs(playerInfo.deltaX) <= boss.jumpHorizontalRange &&
    boss.jumpCooldownTimer <= 0;
  if (wantJump) {
    boss.jump();
    boss.jumpCooldownTimer = boss.jumpCooldown;
    if (boss.jumpFrames) boss.setAnimation(boss.jumpFrames);
  }

  if (boss.isAttacking) {
    boss.attackTimer -= dt;
    const atkFrames = boss.activeAttackFrames || boss.attackFrames;
    boss.setAnimation(atkFrames);
    boss.animate(dt);

    boss.tryDealAttackDamage(player, 0.2);

    const prevBottom = boss.y + boss.height;
    boss.applyApexGravity(dt);
    const currBottom = boss.y + boss.height;
    boss.handlePlatformLanding(prevBottom, currBottom);

    if (boss.attackTimer <= 0) {
      boss.isAttacking = false;
      boss.hasHitDuringAttack = false;
      boss.attackMoveSpeed = 0;
      boss.activeAttackFrames = null;
      boss.activeAttackRange = null;
      boss.activeHeightTolerance = null;
    }

    boss.isChasing = false;
    return;
  }

  if (boss.tryStartAttack(playerInfo, player)) return;

  const platform = boss.getPlatformUnderfoot();
  boss.currentPlatform = platform || null;
  const onLowestPlatform = boss.isOnLowestPlatform();
  const fromChasing = boss.isChasing;
  const canChase =
    boss.chaseCooldown <= 0 &&
    player &&
    !player.isDead &&
    boss.shouldChasePlayer(playerInfo, fromChasing);
  const enemyCenterX = boss.x + boss.width / 2;
  const ignoreEdgeBlock =
    Number.isFinite(boss.movementMinX) && Number.isFinite(boss.movementMaxX);
  const blockedByEdge =
    !ignoreEdgeBlock &&
    canChase &&
    onLowestPlatform &&
    platform &&
    ((playerInfo.deltaX < 0 &&
      enemyCenterX <= platform.left + boss.edgeMargin) ||
      (playerInfo.deltaX > 0 &&
        enemyCenterX >= platform.right - boss.edgeMargin));

  boss.isChasing = canChase && !blockedByEdge;

  boss.updateRunState();
  let moveDir = boss.lastMoveDir || boss.facing || FACING_LEFT;
  if (boss.isChasing) {
    const dx = playerInfo?.deltaX ?? 0;
    const targetDir =
      Math.abs(dx) < 5
        ? boss.lastMoveDir || boss.facing || FACING_RIGHT
        : Math.sign(dx) || FACING_RIGHT;
    moveDir = targetDir;
  } else {
    boss.patrol();
    moveDir = boss.patrolDirection;
  }

  if (platform) {
    moveDir = boss.adjustForEdges(
      moveDir,
      dt,
      platform,
      onLowestPlatform,
      fromChasing
    );
  }

  const moveSpeed = boss.isChasing && boss.isRunning ? boss.runSpeed : boss.speed;
  const runDir = Math.sign(moveDir || boss.facing || FACING_RIGHT) || FACING_RIGHT;
  boss.x += runDir * moveSpeed * dt;
  boss.facing = runDir;
  boss.lastMoveDir = runDir;

  const prevBottom = boss.y + boss.height;
  const wasOnGround = boss.onGround;
  boss.applyApexGravity(dt);
  const currBottom = boss.y + boss.height;
  boss.handlePlatformLanding(prevBottom, currBottom);
  const landed = !wasOnGround && boss.onGround;
  boss.wasOnGround = boss.onGround;

  if (landed) {
    if (player && !player.isDead && player.onGround && player.applyDizzy) {
      player.applyDizzy();
    }
    boss.world?.camera?.shake?.(0.25, 8);
  }

  if (
    player &&
    !player.isDead &&
    !player.isSliding &&
    player.invulnerableTimer <= 0 &&
    boss.collidesWith(player)
  ) {
    player.takeDamage?.(boss.damage, { useDizzy: false });
    if (typeof player.invulnerableTimer === "number") {
      player.invulnerableTimer = Math.max(
        player.invulnerableTimer,
        PLAYER_HURT_IMMUNITY_TIME
      );
    }
  }

  const walkAnim = boss.isChasing ? boss.runFrames : boss.walkFrames;
  if (boss.hurtAnimTimer > 0 && boss.hurtFrames) {
    boss.setAnimation(boss.hurtFrames);
    boss.animate(dt);
  } else {
    boss.setAnimation(walkAnim);
    boss.animate(dt);
  }

  if (Number.isFinite(boss.movementMinX)) {
    boss.x = Math.max(boss.x, boss.movementMinX);
  }
  if (Number.isFinite(boss.movementMaxX)) {
    boss.x = Math.min(boss.x, boss.movementMaxX);
  }
}
