import { EnemyBase } from "../enemies/base/enemies.base.class.js";
import { BOSS_SPEED, BOSS_RUN_SPEED, BOSS_ATTACK1_DAMAGE, BOSS_ATTACK2_DAMAGE, BOSS_DAMAGE, BOSS_HEALTH, DEBUG_MODE, FACING_LEFT, FACING_RIGHT } from "../../../config/config.js";
import { updateBoss } from "./boss.update.js";
import { renderBoss } from "./boss.render.js";
import {
  applyBossAttackDamage,
  canAttemptBossAttack,
  canBossDealAttackDamage,
  canUseBossHeight,
  configureBossAttack,
  createBossAttacks,
  getBossAttackContext,
  getBossAttackHeightTolerance,
  handleBossDamageResult,
  isBossAttackContactValid,
  resetBossRunState,
  selectBossAttack,
  setBossRunning,
  shouldStartRunningBurst,
  startBossRunningBurst,
} from "./boss.combat.js";
export { loadBossSprites } from "./boss.animation.js";

const DEBUG_BOSS_HITBOX = DEBUG_MODE;

export class Boss extends EnemyBase {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} sprites Sprites.
   * @param {import("../../../core/world.class.js").World} [world] World instance.
   */
  constructor(x, y, sprites, world = null) {
    super(x, y, 240, 240, world);
    this.initializeSpriteFrames(sprites);
    this.initializeAnimationState();
    this.initializeBaseStats();
    this.initializeCombatState();
    this.initializeRangeSettings();
    this.initializeAttackSettings();
    this.initializeBehaviorState();
    this.initializeAttackConfigurations();
  }

  /**
   * Initializes sprite frames.
   * Advances animation state and sprites.
   * Applies physics updates like gravity and velocity.
   * @param {*} sprites Sprites.
   */
  initializeSpriteFrames(sprites) {
    this.idleFrames = sprites.idle;
    this.walkFrames = sprites.walk || sprites.run || sprites.idle;
    this.runFrames = sprites.run || sprites.walk || sprites.idle;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.hurtFrames = sprites.hurt || sprites.idle;
    this.dieFrames = sprites.die || sprites.hurt || sprites.idle;
    this.jumpFrames = sprites.jump || sprites.run;
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
   * Initializes base stats.
   * Updates the instance state.
   */
  initializeBaseStats() {
    this.speed = BOSS_SPEED;
    this.runSpeed = BOSS_RUN_SPEED;
    this.health = BOSS_HEALTH;
    this.damage = BOSS_DAMAGE;
    this.attackDamageCurrent = this.damage;
    this.isDead = false;
    this.remove = false;
    this.deathDone = false;
    this.deathTimer = 0;
    this.blinkTimer = 0;
  }

  /**
   * Initializes combat state.
   * Updates the instance state.
   */
  initializeCombatState() {
    this.isAttacking = false;
    this.attackDuration = 1;
    this.attackTimer = 0;
  }

  /**
   * Initializes range settings.
   * Updates the instance state.
   */
  initializeRangeSettings() {
    this.attackRange = 100;
    this.attack1StrikeRange = 60;
    this.attack2Range = 100;
    this.attackHeightTolerance = 90;
    this.chaseRangeX = 1000;
    this.chaseRangeXExit = 1500;
    this.chaseRangeY = 240;
    this.chaseRangeYExit = 250;
  }

  /**
   * Initializes attack settings.
   * Updates the instance state.
   */
  initializeAttackSettings() {
    this.attack1Damage = BOSS_ATTACK1_DAMAGE;
    this.attack2Damage = BOSS_ATTACK2_DAMAGE;
    this.attack1Duration = 1;
    this.attack2Duration = 1.1;
    this.attack1MoveSpeed = 0;
    this.attack1TriggerRange = 420;
    this.attack1MinRange = 110;
    this.attack1Cooldown = 0;
    this.attack1CooldownDuration = 3;
    this.attack2Cooldown = 0;
    this.attack2CooldownDuration = 3;
  }

  /**
   * Initializes behavior state.
   * Advances animation state and sprites.
   * Applies physics updates like gravity and velocity.
   */
  initializeBehaviorState() {
    Object.assign(this, {
      activeAttackRange: null, activeHeightTolerance: null, lastAttackType: null, runningBurstDuration: 2,
      runningBurstTimer: 0, runningCooldownDuration: 2, runningBurstChance: 0.7, runningCooldown: 0,
      isRunning: false, spriteYOffset: 8, disableHitEffect: true, maxHealth: this.health, movementMinX: null,
      movementMaxX: null, jumpHeightThreshold: 120, jumpHorizontalRange: 420, animDirection: -1, facing: FACING_LEFT,
      lastMoveDirection: -1, patrolRange: 1500, jumpCooldown: 5, jumpCooldownTimer: 0, wasOnGround: true,
      hurtAnimTimer: 0, deathTimerMin: 5.5, hurtAnimMinDuration: 0.5, hitboxShrinkXFactor: 0.5,
      hitboxShrinkYFactor: 0.55,
    });
  }

  /**
   * Initializes attack configurations.
   * Updates the instance state.
   */
  initializeAttackConfigurations() {
    this.attacks = createBossAttacks(this);
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
      const len = this.currentAnimation.length;
      if (!len) return;
      this.currentFrame = (this.currentFrame + 1) % len;
      this.sprite = this.currentAnimation[this.currentFrame];
    }
  }

  /**
   * Starts configured attack. If omitted, default values are used.
   * Updates the instance state.
   * @param {*} dx Dx.
   * @param {*} frames Frames.
   * @param {number} damage Damage.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @param {number} [moveSpeed] Move speed.
   * @param {number} [rangeOverride] Range override.
   * @param {number} [heightOverride] Height override.
   */
  startConfiguredAttack(dx, frames, damage, player, moveSpeed = 0, rangeOverride = null, heightOverride = null) {
    this.activeAttackRange = rangeOverride ?? this.attackRange;
    this.activeHeightTolerance = heightOverride ?? this.attackHeightTolerance;
    super.startMeleeAttack(dx, frames, damage, player, moveSpeed);
  }

  /**
   * Initiate attack.
   * Updates the instance state.
   * @param {...*} args Args.
   * @returns {*} Result value.
   */
  initiateAttack(...args) {
    return this.startConfiguredAttack(...args);
  }

  /**
   * Patrol.
   * Updates the instance state.
   */
  patrol() {
    const minX = this.movementMinX;
    const maxX = this.movementMaxX;
    if (this.x <= minX) this.patrolDirection = FACING_RIGHT;
    else if (this.x >= maxX) this.patrolDirection = FACING_LEFT;
    this.facing = this.patrolDirection;
  }

  /**
   * Adjust for edges.
   * Updates the instance state.
   * @param {*} moveDirection Move direction.
   * @param {number} dt Delta time in seconds.
   * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
   * @param {Function} onLowestPlatform On lowest platform.
   * @param {*} fromChasing From chasing.
   * @returns {*} Result value.
   */
  adjustForEdges(moveDirection, dt, platform, onLowestPlatform, fromChasing) {
    if (Number.isFinite(this.movementMinX) && Number.isFinite(this.movementMaxX)) {
      return moveDirection;
    }
    return super.adjustForEdges(moveDirection, dt, platform, onLowestPlatform, fromChasing);
  }

  /**
   * Try start attack.
   * Updates the instance state.
   * @param {import("../player/player.class.js").Player} playerInfo Player info.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @returns {*} Result value.
   */
  tryStartAttack(playerInfo, player) {
    if (!canAttemptBossAttack(playerInfo, player)) return false;
    const deltaX = playerInfo.deltaX;
    const absoluteDeltaY = playerInfo.absoluteDeltaY;
    const absoluteDeltaX = Math.abs(deltaX);
    const canUseHeight = canUseBossHeight(this, absoluteDeltaY);
    if (!this.onGround || !canUseHeight) return false;
    const { canAttack1, canAttack2 } = this.getAvailableAttacks(absoluteDeltaX);
    const choice = selectBossAttack(this, canAttack1, canAttack2);
    return this.runAttack(choice, deltaX, player, playerInfo);
  }

  /**
   * Pick boss attack.
   * Introduces randomness into the outcome.
   * @returns {*} Result value.
   */
  pickBossAttack() {
    const attack2Probability = 0.5;
    return Math.random() < attack2Probability ? "attack2" : "attack1";
  }

  /**
   * Returns available attacks.
   * Updates the instance state.
   * @param {number} absoluteDeltaX Absolute delta X.
   * @returns {Object} Available attacks.
   */
  getAvailableAttacks(absoluteDeltaX) {
    const attack1 = this.attacks.attack1;
    const attack2 = this.attacks.attack2;
    const canAttack1 =
      attack1.frames &&
      this[attack1.cooldownKey] <= 0 &&
      absoluteDeltaX <= attack1.triggerRange &&
      absoluteDeltaX >= attack1.minRange;
    const canAttack2 =
      attack2.frames &&
      this[attack2.cooldownKey] <= 0 &&
      absoluteDeltaX <= attack2.triggerRange;
    return { canAttack1, canAttack2 };
  }

  /**
   * Run attack.
   * Updates the instance state.
   * @param {string} attackId Attack element id.
   * @param {number} deltaX Delta X.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @returns {*} Result value.
   */
  runAttack(attackId, deltaX, player) {
    if (!attackId) return false;
    const attackConfiguration = this.attacks[attackId];
    if (!attackConfiguration) return false;
    const heightTolerance = getBossAttackHeightTolerance(this, attackConfiguration);
    configureBossAttack(this, attackConfiguration, heightTolerance, attackId);
    this.initiateAttack(deltaX, attackConfiguration.frames, attackConfiguration.damage, player, attackConfiguration.moveSpeed, attackConfiguration.range, heightTolerance);
    return true;
  }

  /**
   * Updates.
   * Uses dt, player to perform the operation.
   * @param {number} dt Delta time in seconds.
   * @param {import("../player/player.class.js").Player} player Player instance.
   */
  update(dt, player) {
    updateBoss(this, dt, player);
  }

  /**
   * Updates run state.
   * Updates the instance state.
   * @returns {*} Result value.
   */
  updateRunState() {
    if (!this.isChasing) return resetBossRunState(this);
    if (this.runningBurstTimer > 0) return setBossRunning(this, true);
    if (shouldStartRunningBurst(this)) return startBossRunningBurst(this);
    setBossRunning(this, false);
  }

  /**
   * Try deal attack damage. If omitted, default values are used.
   * Updates the player state.
   * @param {import("../player/player.class.js").Player} player Player instance.
   * @param {*} [popupDelay] Popup delay.
   * @returns {*} Result value.
   */
  tryDealAttackDamage(player, popupDelay = 0) {
    if (!canBossDealAttackDamage(this, player)) return false;
    const attackContext = getBossAttackContext(this, player);
    if (!isBossAttackContactValid(this, attackContext, player)) return false;
    if (player.isSliding) return false;
    applyBossAttackDamage(this, player, popupDelay);
    this.hasHitDuringAttack = true;
    return true;
  }

  /**
   * Take damage. If omitted, default values are used.
   * Uses amount, hitContext to perform the operation.
   * @param {number} [amount] Amount.
   * @param {*} [hitContext] Hit context.
   */
  takeDamage(amount = 1, hitContext = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, { ...hitContext, skipStun: true });
    handleBossDamageResult(this, prevDead);
  }

  /**
   * Returns hitbox.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   * @returns {Object} Hitbox.
   */
  getHitbox() {
    if (this.isDead || this.health <= 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const shrinkX = this.width * this.hitboxShrinkXFactor;
    const shrinkY = this.height * this.hitboxShrinkYFactor;
    return {
      x: this.x + shrinkX / 2,
      y: this.y + shrinkY,
      width: this.width - shrinkX,
      height: this.height - shrinkY,
    };
  }

  /**
   * Renders.
   * Uses ctx, camera to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  render(ctx, camera) {
    renderBoss(this, ctx, camera, { debugHitbox: DEBUG_BOSS_HITBOX });
  }
}
