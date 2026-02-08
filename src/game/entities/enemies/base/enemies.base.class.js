import { MovableObject } from "../../../../engine/physics/movableObject.class.js";
import { DEBUG_MODE, FACING_LEFT, FACING_RIGHT } from "../../../../config/config.js";
import { addEnemyDamagePopup, applyDamageAmount, applyHitStun, applyRecentSlideHit, handleEnemyDeath } from "./enemies.base.damage.js";
import { applyEdgeTurn, buildEdgeContext, getAdjacentPlatformSearch, handleFallBelowCanvas, isAdjacentPlatform, shouldTurnAround, tryLandOnPlatform } from "./enemies.base.platform.js";
import { canStartEnemyAttack, tryStartMeleeAttack } from "./enemies.base.attack.js";
import { addCollectablesToWorld, createCollectableDrops, getCollectableDropConfig } from "./enemies.base.collectables.js";

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
   * @param {World} [world] World instance.
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
   * @param {Camera} camera Camera instance.
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
   * @param {Player} player Player instance.
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
   * @param {Player} playerInfo Player info.
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
   * @param {Platform} currentPlatform Current platform.
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
   * @param {Platform} platform Platform.
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
   * @param {Player} playerInfo Player info.
   * @param {Player} player Player instance.
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
   * @param {Player} player Player instance.
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
 * @param {Player} player Player instance.
 * @param {EnemyBase} enemyCenter Enemy center.
 * @param {Player} playerCenter Player center.
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
