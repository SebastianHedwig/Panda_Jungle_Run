import { EnemyBase, DEBUG_ENEMY_HITBOX } from "./enemyBase.class.js";
import { ENEMY1_DAMAGE, ENEMY1_HEALTH, ENEMY1_COIN_DROP_COUNT, ENEMY1_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT, FACING_LEFT, FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../config/config.js";
import { loadFrames } from "../../../core/game/assets/assetLoader.js";

export function loadEnemy1Sprites() {
  const base = "assets/img/Enemies/Enemy_Sprites/Character-1/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 10),
    attack: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

export class Enemy1 extends EnemyBase {
  constructor(x, y, sprites, world = null, width = ENEMY_WIDTH, height = ENEMY_HEIGHT) {
    super(x, y, width, height, world);
    this.initializeSpriteFrames(sprites);
    this.initializeAnimationState();
    this.initializeStats();
    this.initializeCombatDefaults();
    this.initializeChaseDefaults();
  }

  initializeSpriteFrames(sprites) {
    this.idleFrames = sprites.idle;
    this.walkFrames = sprites.walk;
    this.attackFrames = sprites.attack;
    this.dieFrames = sprites.die;
  }

  initializeAnimationState() {
    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.09;
    this.sprite = this.currentAnimation[0];
  }

  initializeStats() {
    Object.assign(this, {
      speed: ENEMY1_SPEED, health: ENEMY1_HEALTH, damage: ENEMY1_DAMAGE,
      attackDamageCurrent: this.damage, isDead: false, remove: false, deathDone: false,
      deathTimer: 0, blinkTimer: 0,
    });
  }

  initializeCombatDefaults() {
    this.isAttacking = false;
    this.attackDuration = 0.6;
    this.attackTimer = 0;
    this.attackRange = 60;
    this.attackHeightTolerance = 20;
  }

  initializeChaseDefaults() {
    this.chaseRangeX = 300;
    this.chaseRangeXExit = 360;
    this.chaseRangeY = 200;
    this.chaseRangeYExit = 260;
    this.hasDroppedLoot = false;
  }
  
  setAnimation(frames) {
    if (!frames || this.currentAnimation === frames) return;
    this.currentAnimation = frames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.sprite = this.currentAnimation[0];
  }

  animate(dt) {
    this.frameTime += dt;
    if (this.frameTime >= this.frameSpeed) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.currentAnimation.length;
      this.sprite = this.currentAnimation[this.currentFrame];
    }
  }

  update(dt, player) {
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

  tryDealAttackDamage(player, popupDelay = 0) {
    if (!canDealAttackDamage(this, player)) return false;
    const attackContext = getAttackContext(this, player);
    if (!isAttackContactValid(this, attackContext, player)) return false;
    if (player.isSliding) return false;
    applyAttackDamageToPlayer(this, player, popupDelay);
    this.hasHitDuringAttack = true;
    return true;
  }

  render(ctx, camera) {
    if (shouldSkipEnemyRender(this)) return;
    ctx.save();
    const isMirroredFacing = this.facing === FACING_LEFT;
    applyEnemyFacingTransform(ctx, isMirroredFacing);
    const { spriteDrawX, spriteDrawY } = getEnemySpriteDrawPosition(this, camera, isMirroredFacing);
    ctx.drawImage(this.sprite, spriteDrawX, spriteDrawY, this.width, this.height);
    if (DEBUG_ENEMY_HITBOX) drawEnemyHitbox(this, ctx, camera, isMirroredFacing);
    ctx.restore();
  }

  takeDamage(amount = 1, hitContext = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, hitContext);
    if (!prevDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(ENEMY1_COIN_DROP_COUNT);
      this.hasDroppedLoot = true;
    }
  }
}

function handleDeathUpdate(enemy, dt) {
  enemy.isChasing = false;
  updateDeathAnimation(enemy, dt);
  updateRemovalTimers(enemy, dt);
}

function updateDeathAnimation(enemy, dt) {
  if (enemy.deathDone) return;
  enemy.frameTime += dt;
  if (enemy.frameTime < enemy.frameSpeed) return;
  enemy.frameTime = 0;
  advanceDeathFrame(enemy);
}

function advanceDeathFrame(enemy) {
  const lastFrameIndex = enemy.currentAnimation.length - 1;
  enemy.currentFrame = Math.min(enemy.currentFrame + 1, lastFrameIndex);
  enemy.sprite = enemy.currentAnimation[enemy.currentFrame];
  if (enemy.currentFrame === lastFrameIndex) enemy.deathDone = true;
}

function updateRemovalTimers(enemy, dt) {
  if (enemy.deathTimer > 0) {
    enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
  } else if (enemy.blinkTimer > 0) {
    enemy.blinkTimer = Math.max(0, enemy.blinkTimer - dt);
  } else {
    enemy.remove = true;
  }
}

function updateEnemyTimers(enemy, dt) {
  if (enemy.recentSlideHit > 0) enemy.recentSlideHit = Math.max(0, enemy.recentSlideHit - dt);
  if (enemy.chaseCooldown > 0) enemy.chaseCooldown = Math.max(0, enemy.chaseCooldown - dt);
}

function handleHitStun(enemy, dt) {
  if (enemy.hitStun <= 0) return false;
  enemy.hitStun = Math.max(0, enemy.hitStun - dt);
  enemy.isChasing = false;
  enemy.setAnimation(enemy.idleFrames); // freeze on first idle frame (no animation) for clear feedback
  enemy.currentFrame = 0;
  enemy.sprite = enemy.idleFrames[0];
  return true;
}

function handleDeadPlayerState(enemy, player) {
  if (!player?.isDead) return;
  enemy.isChasing = false;
  enemy.isAttacking = false;
}

function handleAttackState(enemy, dt, player) {
  if (!enemy.isAttacking) return false;
  updateAttackTimer(enemy, dt);
  updateAttackMovement(enemy, dt);
  enemy.animate(dt);
  enemy.tryDealAttackDamage(player, 0.2);
  finishAttackIfNeeded(enemy);
  enemy.applyAttackPhysics(dt);
  enemy.isChasing = false;
  return true;
}

function updateAttackTimer(enemy, dt) {
  enemy.attackTimer -= dt;
}

function updateAttackMovement(enemy, dt) {
  const attackFrames = enemy.activeAttackFrames || enemy.attackFrames;
  enemy.setAnimation(attackFrames);
  if (!enemy.attackMoveSpeed) return;
  const nextX = enemy.x + enemy.attackMoveSpeed * enemy.facing * dt;
  if (shouldStopAttackAtEdge(enemy, nextX)) { endSlidingAttack(enemy);
  } else {
    enemy.x = nextX;
  }
}

function shouldStopAttackAtEdge(enemy, nextX) {
  const platform = enemy.getPlatformUnderfoot();
  if (!platform) return false;
  const nextFoot = nextX + enemy.width / 2;
  return nextFoot <= platform.left + enemy.edgeMargin || nextFoot >= platform.right - enemy.edgeMargin;
}

function endSlidingAttack(enemy) {
  enemy.isAttacking = false;
  enemy.attackMoveSpeed = 0;
  enemy.hasHitDuringAttack = false;
  enemy.setAnimation(enemy.idleFrames);
  enemy.currentFrame = 0;
}

function finishAttackIfNeeded(enemy) {
  if (enemy.attackTimer > 0) return;
  enemy.isAttacking = false;
  enemy.hasHitDuringAttack = false;
  enemy.attackMoveSpeed = 0;
  enemy.activeAttackFrames = null;
}

function tryStartAttackIfInRange(enemy, playerInfo, player) {
  return enemy.tryStartAttack(playerInfo, player);
}

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

function isBlockedByEdge(enemy, playerInfo, canChase, onLowestPlatform, platform) {
  if (!canChase || !onLowestPlatform || !platform) return false;
  const enemyCenterX = enemy.x + enemy.width / 2;
  return (
    (playerInfo.deltaX < 0 && enemyCenterX <= platform.left + enemy.edgeMargin) ||
    (playerInfo.deltaX > 0 && enemyCenterX >= platform.right - enemy.edgeMargin)
  );
}

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

function adjustMoveDirection(enemy, moveDirection, dt, platform, chaseState) {
  if (!platform) return moveDirection;
  return enemy.adjustForEdges(moveDirection, dt, platform, chaseState.onLowestPlatform, chaseState.fromChasing);
}

function applyHorizontalMovement(enemy, dt, moveDirection) {
  enemy.x += moveDirection * enemy.speed * dt;
  enemy.lastMoveDirection = moveDirection;
}

function applyGravityAndLanding(enemy, dt) {
  const previousBottom = enemy.y + enemy.height;
  enemy.applyApexGravity(dt);
  const currentBottom = enemy.y + enemy.height;
  enemy.handlePlatformLanding(previousBottom, currentBottom);
}

function handlePlayerCollision(enemy, player) {
  const playerCanBeHit =
    player &&
    !player.isDead &&
    !player.isSliding &&
    player.invulnerableTimer <= 0;
  const isColliding = playerCanBeHit && enemy.collidesWith(player);
  if (!isColliding) return;
  player.takeDamage?.(enemy.damage, { useDizzy: false });
  applyPlayerInvulnerability(player);
}

function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

function canDealAttackDamage(enemy, player) {
  return !!player && !player.isDead && !enemy.isDead && !enemy.hasHitDuringAttack;
}

function getAttackContext(enemy, player) {
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height / 2;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const deltaX = playerCenterX - enemyCenterX;
  const absoluteDeltaY = Math.abs(playerCenterY - enemyCenterY);
  const facingMatches = Math.sign(deltaX || FACING_RIGHT) === enemy.facing;
  return { deltaX, absoluteDeltaY, facingMatches };
}

function isAttackContactValid(enemy, attackContext, player) {
  if (!attackContext.facingMatches) return false;
  if (Math.abs(attackContext.deltaX) > enemy.attackRange) return false;
  if (attackContext.absoluteDeltaY > enemy.attackHeightTolerance) return false;
  return player.invulnerableTimer <= 0;
}

function applyAttackDamageToPlayer(enemy, player, popupDelay) {
  const dmg = enemy.attackDamageCurrent ?? enemy.damage;
  player.takeDamage?.(dmg, { popupDelay });
  applyPlayerInvulnerability(player);
}

function shouldSkipEnemyRender(enemy) {
  if (!(enemy.isDead && enemy.deathTimer === 0 && enemy.blinkTimer > 0)) return false;
  const blinkInterval = 0.3;
  const blinkPhaseModulo = 2;
  const blinkPhase = Math.floor(enemy.blinkTimer / blinkInterval) % blinkPhaseModulo;
  const isInvisiblePhase = blinkPhase === 0;
  return isInvisiblePhase;
}

function applyEnemyFacingTransform(ctx, isMirroredFacing) {
  if (isMirroredFacing) ctx.scale(-1, 1);
}

function getEnemySpriteDrawPosition(enemy, camera, isMirroredFacing) {
  const enemyScreenX = enemy.x - camera.x;
  const enemyScreenY = enemy.y - camera.y;
  const spriteDrawX = isMirroredFacing ? -(enemyScreenX + enemy.width) : enemyScreenX;
  const spriteDrawY = enemyScreenY;
  return { spriteDrawX, spriteDrawY };
}

function drawEnemyHitbox(enemy, ctx, camera, isMirroredFacing) {
  const hitbox = enemy.getHitbox();
  const hitboxScreenX = hitbox.x - camera.x;
  const hitboxScreenY = hitbox.y - camera.y;
  const hitboxDrawX = isMirroredFacing ? -(hitboxScreenX + hitbox.width) : hitboxScreenX;
  const hitboxDrawY = hitboxScreenY;
  ctx.strokeStyle = "rgba(0,120,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height);
}
