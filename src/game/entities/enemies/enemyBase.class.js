import { MovableObject } from "../../../engine/physics/movableObject.class.js";
import { HudPopup } from "../../effects/hudPopup.class.js";
import { DEBUG_MODE, FACING_LEFT, FACING_RIGHT } from "../../../config/config.js";
import { CollectableItem } from "../../items/collectableItem.class.js";

export const DEBUG_ENEMY_HITBOX = DEBUG_MODE;

export class EnemyBase extends MovableObject {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Updates the instance state.
   * Initializes movement defaults, combat helpers.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} width Width.
   * @param {number} height Height.
   * @param {import("../../../core/world.class.js").World} [world] World instance.
   */
  constructor(x, y, width, height, world = null) {
    super(x, y, width, height);
    this.world = world;
    this.initializeMovementDefaults(x, y);
    this.initializeCombatHelpers();
  }

  /**
   * Initializes movement defaults.
   * Spawns visual feedback effects.
   * @param {number} x X.
   * @param {number} y Y.
   */
  initializeMovementDefaults(x, y) {
    Object.assign(this, {
      patrolDirection: FACING_LEFT, patrolRange: 800, spawnX: x, currentPlatform: null,
      lastGroundY: y, hitStun: 0, edgeMargin: 5, isChasing: false,
      lastMoveDirection: FACING_LEFT, chaseCooldown: 0, chaseCooldownDuration: 2,
      chaseRangeX: 300, chaseRangeXExit: 360, chaseRangeY: 200, chaseRangeYExit: 260,
    });
  }

  /**
   * Initializes combat helpers.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   */
  initializeCombatHelpers() {
    this.hasHitDuringAttack = false;
    this.recentSlideHit = 0;
    this.attackDamageCurrent = this.damage ?? 1;
    this.attackMoveSpeed = 0;
    this.hitboxShrinkXFactor = 0.55;
    this.hitboxShrinkYFactor = 0.2;
  }

  /**
   * Take damage. If omitted, default values are used.
   * Uses amount, hitContext to perform the operation.
   * @param {number} [amount] Amount.
   * @param {*} [hitContext] Hit context.
   */
  takeDamage(amount = 1, hitContext = {}) {
    if (this.isDead) return;
    applyDamageAmount(this, amount);
    applyRecentSlideHit(this, hitContext);
    addEnemyDamagePopup(this, amount);
    if (handleEnemyDeath(this)) return;
    applyHitStun(this, hitContext);
  }

  /**
   * Returns hitbox.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   * @returns {Object} Hitbox.
   */
  getHitbox() {
    const { x, y, width: enemyWidth, height: enemyHeight } = this;
    const hitboxWidth = enemyWidth * (1 - this.hitboxShrinkXFactor);
    const hitboxHeight = enemyHeight * (1 - this.hitboxShrinkYFactor);
    const hitboxX = x + (enemyWidth - hitboxWidth) / 2;
    const hitboxY = y + (enemyHeight - hitboxHeight);
    return { x: hitboxX, y: hitboxY, width: hitboxWidth, height: hitboxHeight };
  }

  /**
   * Renders hitbox.
   * Renders to the canvas context.
   * Performs hitbox or collision checks.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  renderHitbox(ctx, camera) {
    const hitbox = this.getHitbox();
    ctx.strokeStyle = "rgba(0,120,255,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(hitbox.x - camera.x, hitbox.y - camera.y, hitbox.width, hitbox.height);
  }

  /**
   * Returns player delta.
   * Uses player to compute the result.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @returns {*} Player delta.
   */
  getPlayerDelta(player) {
    if (!player) return null;
    const enemyCenter = getActorCenter(this);
    const playerCenter = getActorCenter(player);
    return buildPlayerDelta(player, enemyCenter, playerCenter);
  }

  /**
   * Should chase player. If omitted, default values are used.
   * Updates the instance state.
   * @param {import("../player/player.class.js").Player} playerInfo Player info.
   * @param {boolean} [wasChasing] Whether chasing.
   * @returns {boolean} Whether chase player.
   */
  shouldChasePlayer(playerInfo, wasChasing = false) {
    if (!playerInfo) return false;
    const horizGap = playerInfo.absoluteDeltaX;
    const maxX = wasChasing ? this.chaseRangeXExit : this.chaseRangeX;
    const maxY = wasChasing ? this.chaseRangeYExit : this.chaseRangeY;
    return horizGap <= maxX && playerInfo.absoluteDeltaY <= maxY;
  }

  /**
   * Patrol.
   * Updates the instance state.
   * Spawns visual feedback effects.
   */
  patrol() {
    const minX = this.spawnX - this.patrolRange / 2;
    const maxX = this.spawnX + this.patrolRange / 2;
    if (this.x <= minX) this.patrolDirection = FACING_RIGHT;
    else if (this.x >= maxX) this.patrolDirection = FACING_LEFT;
    this.facing = this.patrolDirection;
  }

  /**
   * Is on lowest platform.
   * Updates the world state.
   * @returns {boolean} Whether on lowest platform.
   */
  isOnLowestPlatform() {
    const platformLevelTolerance = 0.5;
    if (!this.currentPlatform || !this.world?.platforms?.length) return false;
    const lowestTop = this.world.platforms.reduce((max, platform) => {
      if (!platform.supportsLanding) return max;
      return Math.max(max, platform.top);
    }, -Infinity);
    if (!Number.isFinite(lowestTop)) return false;
    return this.currentPlatform.top >= lowestTop - platformLevelTolerance;
  }

  /**
   * Returns platform underfoot.
   * Updates the world state.
   * @returns {*} Platform underfoot.
   */
  getPlatformUnderfoot() {
    if (!this.world?.platforms?.length) return null;
    const footProbeOffset = 2, platformBottomTolerance = 5;
    const footX = this.x + this.width / 2;
    const footY = this.y + this.height + footProbeOffset;
    return this.world.platforms.find(
      (platform) =>
        platform.supportsLanding &&
        footX >= platform.left &&
        footX <= platform.right &&
        footY >= platform.top &&
        footY <= platform.bottom + platformBottomTolerance
    );
  }

  /**
   * Find platform below at.
   * Updates the world state.
   * @param {number} footX Foot X.
   * @param {number} currentTop Current top.
   * @returns {*} Result value.
   */
  findPlatformBelowAt(footX, currentTop) {
    if (!this.world?.platforms?.length) return null;
    let nearestPlatformBelow = null;
    for (const platform of this.world.platforms) {
      if (!platform.supportsLanding) continue;
      if (footX < platform.left || footX > platform.right) continue;
      if (platform.top <= currentTop) continue;
      if (!nearestPlatformBelow || platform.top < nearestPlatformBelow.top) {
        nearestPlatformBelow = platform;
      }
    }
    return nearestPlatformBelow;
  }

  /**
   * Has adjacent platform.
   * Updates the world state.
   * @param {import("../../../engine/world/platform.class.js").Platform} currentPlatform Current platform.
   * @param {*} moveDirection Move direction.
   * @param {number} footX Foot X.
   * @returns {boolean} Whether adjacent platform.
   */
  hasAdjacentPlatform(currentPlatform, moveDirection, footX) {
    if (!this.world?.platforms?.length) return false;
    const searchContext = getAdjacentPlatformSearch(this, currentPlatform, moveDirection, footX);
    return this.world.platforms.some((platform) =>
      isAdjacentPlatform(platform, currentPlatform, searchContext)
    );
  }

  /**
   * Handles platform landing.
   * Updates the instance state.
   * @param {number} previousBottom Previous bottom.
   * @param {number} currentBottom Current bottom.
   */
  handlePlatformLanding(previousBottom, currentBottom) {
    if (!this.world?.platforms?.length) return;
    if (tryLandOnPlatform(this, previousBottom, currentBottom)) return;
    handleFallBelowCanvas(this, currentBottom);
  }

  /**
   * Applies attack physics.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  applyAttackPhysics(dt) {
    const previousBottom = this.y + this.height;
    this.applyApexGravity(dt);
    const currentBottom = this.y + this.height;
    this.handlePlatformLanding(previousBottom, currentBottom);
  }

  /**
   * Adjust for edges.
   * Uses moveDirection, dt, platform, onLowestPlatform, fromChasing to perform the operation.
   * @param {*} moveDirection Move direction.
   * @param {number} dt Delta time in seconds.
   * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
   * @param {Function} onLowestPlatform On lowest platform.
   * @param {*} fromChasing From chasing.
   * @returns {*} Result value.
   */
  adjustForEdges(moveDirection, dt, platform, onLowestPlatform, fromChasing) {
    const edgeContext = buildEdgeContext(this, moveDirection, dt, platform, onLowestPlatform);
    if (shouldTurnAround(edgeContext)) return applyEdgeTurn(this, edgeContext, fromChasing);
    return moveDirection;
  }

  /**
   * Try start attack.
   * Uses playerInfo, player to perform the operation.
   * @param {import("../player/player.class.js").Player} playerInfo Player info.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @returns {*} Result value.
   */
  tryStartAttack(playerInfo, player) {
    if (!canStartEnemyAttack(playerInfo, player)) return false;
    return tryStartMeleeAttack(this, playerInfo, player);
  }

  /**
   * Starts melee attack. If omitted, default values are used.
   * Advances animation state and sprites.
   * Applies physics updates like gravity and velocity.
   * @param {number} deltaX Delta X.
   * @param {*} frames Frames.
   * @param {number} damage Damage.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @param {number} [moveSpeed] Move speed.
   */
  startMeleeAttack(deltaX, frames, damage, player, moveSpeed = 0) {
    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.hasHitDuringAttack = false;
    this.attackDamageCurrent = damage;
    this.attackMoveSpeed = moveSpeed || 0;
    this.activeAttackFrames = frames || this.attackFrames;
    this.facing = deltaX >= 0 ? FACING_RIGHT : FACING_LEFT;
    this.velocityX = 0;
    this.setAnimation?.(this.activeAttackFrames);
    const attackPopupDelay = 0.2;
    this.tryDealAttackDamage?.(player, attackPopupDelay);
  }

  /**
   * Drop collectables. If omitted, default values are used.
   * Updates the instance state.
   * @param {string} itemType Item type.
   * @param {number} [count] Count.
   */
  dropCollectables(itemType, count = 0) {
    if (!this.world?.collectables || count <= 0) return;
    const dropConfig = getCollectableDropConfig(this);
    const drops = createCollectableDrops(this, itemType, count, dropConfig);
    addCollectablesToWorld(this.world, drops);
  }

  /**
   * Drop coins. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} [count] Count.
   */
  dropCoins(count = 0) {
    this.dropCollectables("coin", count);
  }

  /**
   * Collides with.
   * Updates the instance state.
   * @param {*} target Target.
   * @returns {*} Result value.
   */
  collidesWith(target) {
    const selfBox = this.getHitbox();
    const targetBox = target.getHitbox ? target.getHitbox() : target;
    return (
      selfBox.x < targetBox.x + targetBox.width &&
      selfBox.x + selfBox.width > targetBox.x &&
      selfBox.y < targetBox.y + targetBox.height &&
      selfBox.y + selfBox.height > targetBox.y
    );
  }
}

/**
 * Applies damage amount.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} amount Amount.
 */
function applyDamageAmount(enemy, amount) {
  enemy.health -= amount;
}

/**
 * Applies recent slide hit.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {*} hitContext Hit context.
 */
function applyRecentSlideHit(enemy, hitContext) {
  const recentSlideHitDuration = 0.4;
  if (hitContext?.source === "slide") {
    enemy.recentSlideHit = Math.max(enemy.recentSlideHit, recentSlideHitDuration);
  }
}

/**
 * Adds enemy damage popup.
 * Updates the enemy state.
 * Spawns visual feedback effects.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} amount Amount.
 */
function addEnemyDamagePopup(enemy, amount) {
  if (!enemy.world?.hudPopups) return;
  const popupX = enemy.x + enemy.width * 0.5;
  const popupY = enemy.y - 20;
  enemy.world.hudPopups.push(new HudPopup(`-${amount}`, popupX, popupY, "damage"));
}

/**
 * Handles enemy death.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @returns {*} Result value.
 */
function handleEnemyDeath(enemy) {
  if (enemy.health > 0) return false;
  markEnemyDead(enemy);
  setDeathAnimation(enemy);
  resetDeathVelocity(enemy);
  initDeathTimers(enemy);
  enemy.onDeath?.();
  return true;
}

/**
 * Marks enemy dead.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function markEnemyDead(enemy) {
  enemy.isDead = true;
}

/**
 * Sets death animation.
 * Advances animation state and sprites.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function setDeathAnimation(enemy) {
  enemy.setAnimation?.(enemy.dieFrames);
  enemy.currentFrame = 0;
  enemy.frameTime = 0;
}

/**
 * Resets death velocity.
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function resetDeathVelocity(enemy) {
  enemy.velocityX = 0;
  enemy.velocityY = 0;
}

/**
 * Initializes death timers.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function initDeathTimers(enemy) {
  enemy.deathTimer = 5;
  enemy.blinkTimer = 0.9; // 3 blinks at 0.3s
}

/**
 * Applies hit stun.
 * Advances animation state and sprites.
 * Applies physics updates like gravity and velocity.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {*} hitContext Hit context.
 */
function applyHitStun(enemy, hitContext) {
  if (hitContext.skipStun) return;
  const hitStunMinDuration = 1.5;
  enemy.hitStun = Math.max(enemy.hitStun, hitStunMinDuration);
  enemy.velocityX = 0;
  enemy.velocityY = 0;
  enemy.setAnimation?.(enemy.idleFrames);
  enemy.currentFrame = 0;
  enemy.frameTime = 0;
}

/**
 * Returns actor center.
 * Uses actor to compute the result.
 * @param {*} actor Actor.
 * @returns {Object} Actor center.
 */
function getActorCenter(actor) {
  const centerX = actor.x + actor.width / 2;
  const centerY = actor.y + actor.height / 2;
  return { centerX, centerY };
}

/**
 * Builds player delta.
 * Updates the player state.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {import("./enemyBase.class.js").EnemyBase} enemyCenter Enemy center.
 * @param {import("../player/player.class.js").Player} playerCenter Player center.
 * @returns {Object} Player delta.
 */
function buildPlayerDelta(player, enemyCenter, playerCenter) {
  const enemyCenterX = enemyCenter.centerX;
  const enemyCenterY = enemyCenter.centerY;
  const playerCenterX = playerCenter.centerX;
  const playerCenterY = playerCenter.centerY;
  const deltaX = playerCenterX - enemyCenterX;
  const deltaY = playerCenterY - enemyCenterY;
  return { deltaX, deltaY, absoluteDeltaX: Math.abs(deltaX), absoluteDeltaY: Math.abs(deltaY), playerCenterX, playerCenterY, enemyCenterX, enemyCenterY, playerWidth: player.width };
}

/**
 * Returns adjacent platform search.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} currentPlatform Current platform.
 * @param {*} moveDirection Move direction.
 * @param {number} footX Foot X.
 * @returns {Object} Adjacent platform search.
 */
function getAdjacentPlatformSearch(enemy, currentPlatform, moveDirection, footX) {
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
 * Uses platform, currentPlatform, searchContext to perform the operation.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @param {import("../../../engine/world/platform.class.js").Platform} currentPlatform Current platform.
 * @param {*} searchContext Search context.
 * @returns {boolean} Whether adjacent platform.
 */
function isAdjacentPlatform(platform, currentPlatform, searchContext) {
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} previousBottom Previous bottom.
 * @param {number} currentBottom Current bottom.
 * @returns {*} Result value.
 */
function tryLandOnPlatform(enemy, previousBottom, currentBottom) {
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
 * Applies physics updates like gravity and velocity.
 * Performs hitbox or collision checks.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
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
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
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
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} currentBottom Current bottom.
 */
function handleFallBelowCanvas(enemy, currentBottom) {
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {*} moveDirection Move direction.
 * @param {number} dt Delta time in seconds.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @param {Function} onLowestPlatform On lowest platform.
 * @returns {Object} Edge context.
 */
function buildEdgeContext(enemy, moveDirection, dt, platform, onLowestPlatform) {
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
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
 * @param {number} footX Foot X.
 * @returns {boolean} Whether beyond platform edge.
 */
function isBeyondPlatformEdge(enemy, platform, footX) {
  return footX < platform.left + enemy.edgeMargin || footX > platform.right - enemy.edgeMargin;
}

/**
 * Is returning inside.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
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
 * Uses edgeContext to perform the operation.
 * @param {*} edgeContext Edge context.
 * @returns {boolean} Whether turn around.
 */
function shouldTurnAround(edgeContext) {
  return edgeContext.beyondEdge && !edgeContext.returningInside && !edgeContext.allowDrop && !edgeContext.hasAdjacentFloor;
}

/**
 * Applies edge turn.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {*} edgeContext Edge context.
 * @param {*} fromChasing From chasing.
 * @returns {*} Result value.
 */
function applyEdgeTurn(enemy, edgeContext, fromChasing) {
  enemy.patrolDirection = edgeContext.moveDirection > 0 ? FACING_LEFT : FACING_RIGHT;
  enemy.isChasing = false;
  if (fromChasing) applyChaseCooldown(enemy);
  const moveDirection = enemy.patrolDirection;
  enemy.facing = moveDirection;
  return moveDirection;
}

/**
 * Applies chase cooldown.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 */
function applyChaseCooldown(enemy) {
  enemy.chaseCooldown = Math.max(enemy.chaseCooldown, enemy.chaseCooldownDuration);
}

/**
 * Can start enemy attack.
 * Updates the player state.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether start enemy attack.
 */
function canStartEnemyAttack(playerInfo, player) {
  return !!playerInfo && !!player && !player.isDead;
}

/**
 * Try start melee attack.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {*} Result value.
 */
function tryStartMeleeAttack(enemy, playerInfo, player) {
  const deltaX = playerInfo.deltaX;
  const absoluteDeltaY = playerInfo.absoluteDeltaY;
  if (!isPlayerInRange(enemy, deltaX, absoluteDeltaY)) return false;
  const frames = enemy.attackFrames;
  if (!frames) return false;
  enemy.startMeleeAttack(deltaX, frames, enemy.damage, player);
  return true;
}

/**
 * Is player in range.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {number} deltaX Delta X.
 * @param {number} absoluteDeltaY Absolute delta Y.
 * @returns {boolean} Whether player in range.
 */
function isPlayerInRange(enemy, deltaX, absoluteDeltaY) {
  return Math.abs(deltaX) <= enemy.attackRange && absoluteDeltaY <= enemy.attackHeightTolerance;
}

/**
 * Returns collectable drop config.
 * Updates the enemy state.
 * Spawns visual feedback effects.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @returns {Object} Collectable drop config.
 */
function getCollectableDropConfig(enemy) {
  const spawnOffsetYFactor = 0.2;
  const baseRadius = 30;
  const radiusScattering = 20;
  const minAngle = Math.PI / 3; // 60°
  const angleRange = Math.PI / 6; // up to 90°
  const baseSpeedX = 120;
  const speedXScattering = 60;
  const baseSpeedY = 400;
  const speedYScattering = 150;
  const baseX = enemy.x + enemy.width / 2;
  const baseY = enemy.y + enemy.height * spawnOffsetYFactor;
  return { spawnOffsetYFactor, baseRadius, radiusScattering, minAngle, angleRange, baseSpeedX, speedXScattering, baseSpeedY, speedYScattering, baseX, baseY };
}

/**
 * Creates collectable drops.
 * Uses enemy, itemType, count, dropConfig to compute the result.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {string} itemType Item type.
 * @param {number} count Count.
 * @param {*} dropConfig Drop config.
 * @returns {*} Collectable drops.
 */
function createCollectableDrops(enemy, itemType, count, dropConfig) {
  const drops = [];
  for (let dropIndex = 0; dropIndex < count; dropIndex++) {
    const item = createCollectableDrop(enemy, itemType, dropIndex, dropConfig);
    drops.push(item);
  }
  return drops;
}

/**
 * Creates collectable drop.
 * Applies physics updates like gravity and velocity.
 * Updates the enemy state.
 * @param {import("./enemyBase.class.js").EnemyBase} enemy Enemy instance.
 * @param {string} itemType Item type.
 * @param {number} dropIndex Drop index.
 * @param {*} dropConfig Drop config.
 * @returns {*} Collectable drop.
 */
function createCollectableDrop(enemy, itemType, dropIndex, dropConfig) {
  const isEvenDropIndex = dropIndex % 2 === 0; // drop left/right alternation
  const dropDirection = isEvenDropIndex ? FACING_LEFT : FACING_RIGHT;
  const radius = dropConfig.baseRadius + Math.random() * dropConfig.radiusScattering;
  const angle = dropConfig.minAngle + Math.random() * dropConfig.angleRange;
  const dropX = dropConfig.baseX + dropDirection * radius * Math.cos(angle);
  const dropY = dropConfig.baseY - radius * Math.sin(angle);
  const velocityX = dropDirection * (dropConfig.baseSpeedX + Math.random() * dropConfig.speedXScattering);
  const velocityY = -(dropConfig.baseSpeedY + Math.random() * dropConfig.speedYScattering);
  const item = new CollectableItem(dropX, dropY, itemType, enemy.world);
  item.startDrop(velocityX, velocityY);
  return item;
}

/**
 * Adds collectables to world.
 * Updates the world state.
 * @param {import("../../../core/world.class.js").World} world World instance.
 * @param {*} drops Drops.
 */
function addCollectablesToWorld(world, drops) {
  world.addCollectables ? world.addCollectables(drops) : world.collectables.push(...drops);
}
