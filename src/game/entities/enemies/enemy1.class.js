import { EnemyBase, DEBUG_ENEMY_HITBOX } from "./enemyBase.class.js";
import { ENEMY1_DAMAGE, ENEMY1_HEALTH, ENEMY1_COIN_DROP_COUNT, ENEMY1_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT, FACING_LEFT, FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../config/config.js";
import { loadFrames } from "../../../core/game/assets/assetLoader.js";

/**
 * Loads enemy 1 sprites.
 * @returns {Object} Result value.
 */
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
  /**
   * Creates a new instance. If omitted, default values are used.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} sprites Sprites.
   * @param {import("../../../core/world.class.js").World} [world] World instance.
   * @param {number} [width] Width.
   * @param {number} [height] Height.
   */
  constructor(x, y, sprites, world = null, width = ENEMY_WIDTH, height = ENEMY_HEIGHT) {
    super(x, y, width, height, world);
    this.initializeSpriteFrames(sprites);
    this.initializeAnimationState();
    this.initializeStats();
    this.initializeCombatDefaults();
    this.initializeChaseDefaults();
  }

  /**
   * Initializes sprite frames.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {*} sprites Sprites.
   */
  initializeSpriteFrames(sprites) {
    this.idleFrames = sprites.idle;
    this.walkFrames = sprites.walk;
    this.attackFrames = sprites.attack;
    this.dieFrames = sprites.die;
  }

  /**
   * Initializes animation state.
   * Advances animation state and sprites.
   * Updates the instance state.
   */
  initializeAnimationState() {
    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.09;
    this.sprite = this.currentAnimation[0];
  }

  /**
   * Initializes stats.
   * Updates the instance state.
   */
  initializeStats() {
    Object.assign(this, {
      speed: ENEMY1_SPEED, health: ENEMY1_HEALTH, damage: ENEMY1_DAMAGE,
      attackDamageCurrent: this.damage, isDead: false, remove: false, deathDone: false,
      deathTimer: 0, blinkTimer: 0,
    });
  }

  /**
   * Initializes combat defaults.
   * Updates the instance state.
   */
  initializeCombatDefaults() {
    this.isAttacking = false;
    this.attackDuration = 0.6;
    this.attackTimer = 0;
    this.attackRange = 60;
    this.attackHeightTolerance = 20;
  }

  /**
   * Initializes chase defaults.
   * Updates the instance state.
   */
  initializeChaseDefaults() {
    this.chaseRangeX = 300;
    this.chaseRangeXExit = 360;
    this.chaseRangeY = 200;
    this.chaseRangeYExit = 260;
    this.hasDroppedLoot = false;
  }
  
  /**
   * Sets animation.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {*} frames Frames.
   */
  setAnimation(frames) {
    if (!frames || this.currentAnimation === frames) return;
    this.currentAnimation = frames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.sprite = this.currentAnimation[0];
  }

  /**
   * Animate.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  animate(dt) {
    this.frameTime += dt;
    if (this.frameTime >= this.frameSpeed) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.currentAnimation.length;
      this.sprite = this.currentAnimation[this.currentFrame];
    }
  }

  /**
   * Updates.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @returns {*} Result value.
   */
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

  /**
   * Try deal attack damage. If omitted, default values are used.
   * Updates the player state.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @param {*} [popupDelay] Popup delay.
   * @returns {*} Result value.
   */
  tryDealAttackDamage(player, popupDelay = 0) {
    if (!canDealAttackDamage(this, player)) return false;
    const attackContext = getAttackContext(this, player);
    if (!isAttackContactValid(this, attackContext, player)) return false;
    if (player.isSliding) return false;
    applyAttackDamageToPlayer(this, player, popupDelay);
    this.hasHitDuringAttack = true;
    return true;
  }

  /**
   * Renders.
   * Renders to the canvas context.
   * Advances animation state and sprites.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   */
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

  /**
   * Take damage. If omitted, default values are used.
   * Uses amount, hitContext to perform the operation.
   * @param {number} [amount] Amount.
   * @param {*} [hitContext] Hit context.
   */
  takeDamage(amount = 1, hitContext = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, hitContext);
    if (!prevDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(ENEMY1_COIN_DROP_COUNT);
      this.hasDroppedLoot = true;
    }
  }
}

/**
 * Handles death update.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function handleDeathUpdate(enemy, dt) {
  enemy.isChasing = false;
  updateDeathAnimation(enemy, dt);
  updateRemovalTimers(enemy, dt);
}

/**
 * Updates death animation.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
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
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function advanceDeathFrame(enemy) {
  const lastFrameIndex = enemy.currentAnimation.length - 1;
  enemy.currentFrame = Math.min(enemy.currentFrame + 1, lastFrameIndex);
  enemy.sprite = enemy.currentAnimation[enemy.currentFrame];
  if (enemy.currentFrame === lastFrameIndex) enemy.deathDone = true;
}

/**
 * Updates removal timers.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateEnemyTimers(enemy, dt) {
  if (enemy.recentSlideHit > 0) enemy.recentSlideHit = Math.max(0, enemy.recentSlideHit - dt);
  if (enemy.chaseCooldown > 0) enemy.chaseCooldown = Math.max(0, enemy.chaseCooldown - dt);
}

/**
 * Handles hit stun.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 */
function handleDeadPlayerState(enemy, player) {
  if (!player?.isDead) return;
  enemy.isChasing = false;
  enemy.isAttacking = false;
}

/**
 * Handles attack state.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
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

/**
 * Updates attack timer.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function updateAttackTimer(enemy, dt) {
  enemy.attackTimer -= dt;
}

/**
 * Updates attack movement.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
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

/**
 * Should stop attack at edge.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} nextX Next X.
 * @returns {boolean} Whether stop attack at edge.
 */
function shouldStopAttackAtEdge(enemy, nextX) {
  const platform = enemy.getPlatformUnderfoot();
  if (!platform) return false;
  const nextFoot = nextX + enemy.width / 2;
  return nextFoot <= platform.left + enemy.edgeMargin || nextFoot >= platform.right - enemy.edgeMargin;
}

/**
 * End sliding attack.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function endSlidingAttack(enemy) {
  enemy.isAttacking = false;
  enemy.attackMoveSpeed = 0;
  enemy.hasHitDuringAttack = false;
  enemy.setAnimation(enemy.idleFrames);
  enemy.currentFrame = 0;
}

/**
 * Finish attack if needed.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function finishAttackIfNeeded(enemy) {
  if (enemy.attackTimer > 0) return;
  enemy.isAttacking = false;
  enemy.hasHitDuringAttack = false;
  enemy.attackMoveSpeed = 0;
  enemy.activeAttackFrames = null;
}

/**
 * Try start attack if in range.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
function tryStartAttackIfInRange(enemy, playerInfo, player) {
  return enemy.tryStartAttack(playerInfo, player);
}

/**
 * Handles chase and movement.
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
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
 * Updates the player state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @param {boolean} canChase Whether chase.
 * @param {Function} onLowestPlatform On lowest platform.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {*} moveDirection Move direction.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @param {*} chaseState Chase state.
 * @returns {*} Result value.
 */
function adjustMoveDirection(enemy, moveDirection, dt, platform, chaseState) {
  if (!platform) return moveDirection;
  return enemy.adjustForEdges(moveDirection, dt, platform, chaseState.onLowestPlatform, chaseState.fromChasing);
}

/**
 * Applies horizontal movement.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 * @param {*} moveDirection Move direction.
 */
function applyHorizontalMovement(enemy, dt, moveDirection) {
  enemy.x += moveDirection * enemy.speed * dt;
  enemy.lastMoveDirection = moveDirection;
}

/**
 * Applies gravity and landing.
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} dt Delta time in seconds.
 */
function applyGravityAndLanding(enemy, dt) {
  const previousBottom = enemy.y + enemy.height;
  enemy.applyApexGravity(dt);
  const currentBottom = enemy.y + enemy.height;
  enemy.handlePlatformLanding(previousBottom, currentBottom);
}

/**
 * Handles player collision.
 * Updates the player state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 */
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
 * Can deal attack damage.
 * Updates the player state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether deal attack damage.
 */
function canDealAttackDamage(enemy, player) {
  return !!player && !player.isDead && !enemy.isDead && !enemy.hasHitDuringAttack;
}

/**
 * Returns attack context.
 * Updates the player state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {Object} Attack context.
 */
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

/**
 * Is attack contact valid.
 * Updates the player state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {*} attackContext Attack context.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether attack contact valid.
 */
function isAttackContactValid(enemy, attackContext, player) {
  if (!attackContext.facingMatches) return false;
  if (Math.abs(attackContext.deltaX) > enemy.attackRange) return false;
  if (attackContext.absoluteDeltaY > enemy.attackHeightTolerance) return false;
  return player.invulnerableTimer <= 0;
}

/**
 * Applies attack damage to player.
 * Updates the player state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {*} popupDelay Popup delay.
 */
function applyAttackDamageToPlayer(enemy, player, popupDelay) {
  const dmg = enemy.attackDamageCurrent ?? enemy.damage;
  player.takeDamage?.(dmg, { popupDelay });
  applyPlayerInvulnerability(player);
}

/**
 * Should skip enemy render.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @returns {boolean} Whether skip enemy render.
 */
function shouldSkipEnemyRender(enemy) {
  if (!(enemy.isDead && enemy.deathTimer === 0 && enemy.blinkTimer > 0)) return false;
  const blinkInterval = 0.3;
  const blinkPhaseModulo = 2;
  const blinkPhase = Math.floor(enemy.blinkTimer / blinkInterval) % blinkPhaseModulo;
  const isInvisiblePhase = blinkPhase === 0;
  return isInvisiblePhase;
}

/**
 * Applies enemy facing transform.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 */
function applyEnemyFacingTransform(ctx, isMirroredFacing) {
  if (isMirroredFacing) ctx.scale(-1, 1);
}

/**
 * Returns enemy sprite draw position.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 * @returns {Object} Enemy sprite draw position.
 */
function getEnemySpriteDrawPosition(enemy, camera, isMirroredFacing) {
  const enemyScreenX = enemy.x - camera.x;
  const enemyScreenY = enemy.y - camera.y;
  const spriteDrawX = isMirroredFacing ? -(enemyScreenX + enemy.width) : enemyScreenX;
  const spriteDrawY = enemyScreenY;
  return { spriteDrawX, spriteDrawY };
}

/**
 * Draws enemy hitbox.
 * Renders to the canvas context.
 * Performs hitbox or collision checks.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
 * @param {boolean} isMirroredFacing Whether mirrored facing.
 */
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
