import { BASE_SPEED, PLAYER_MAX_HEARTS, PLAYER_SLIDE_DAMAGE, FACING_RIGHT } from "../../../config/config.js";

/**
 * Initializes animation sets.
 * Uses frames to perform the operation.
 * @param {*} frames Frames.
 */
export function initializeAnimationSets(frames) {
  Object.assign(this, frames);
}

/**
 * Initializes animation state.
 * Advances animation state and sprites.
 * Updates the instance state.
 */
export function initializeAnimationState() {
  this.currentAnimation = this.idleFrames;
  this.currentFrame = 0;
  this.frameTime = 0;
  this.frameSpeed = 0.065;
  this.sprite = this.currentAnimation[0];
}

/**
 * Initializes movement.
 * Updates the instance state.
 */
export function initializeMovement() {
  this.defaultSpeed = BASE_SPEED;
  this.runMultiplier = 2;
}

/**
 * Initializes slide.
 * Updates the instance state.
 */
export function initializeSlide() {
  Object.assign(this, {
    isSliding: false, slideReady: true, slideDistance: 200, slideStartX: 0,
    slideDirection: 1, slideSpeed: this.defaultSpeed * 2, slideBlockGrace: 0,
    slideHitEnemies: new Set(), slideDamage: PLAYER_SLIDE_DAMAGE,
    slideInvulnerableAfter: 1, slideInvulnerableDuring: 0.2,
    wasSlidingPreviousFrame: false, slideInvulWindow: 0,
  });
}

/**
 * Initializes attack.
 */
export function initializeAttack() {
  Object.assign(this, {
    isAttacking: false, attackDuration: 0.4, attackTimer: 0, attackHitDone: false,
    attackRange: 70, attackHeightTolerance: 15, attackQueued: false,
  });
}

/**
 * Initializes shoot.
 */
export function initializeShoot() {
  Object.assign(this, {
    isShooting: false, shootDuration: 0.35, shootTimer: 0, shootCooldown: 0,
    shootCooldownDuration: 1.35, shootFireDelay: 0.3, shootFireTimer: 0,
    shootHasFired: false, shootFacing: 1, bulletAmmo: 0, gunPulse: 0,
  });
}

/**
 * Initializes hurt death.
 * Updates the instance state.
 * Initializes hurt state, death state.
 * @param {number} x X.
 * @param {number} y Y.
 */
export function initializeHurtDeath(x, y) {
  this.initializeHurtState();
  this.initializeDeathState(x, y);
}

/**
 * Initializes hurt state.
 */
export function initializeHurtState() {
  Object.assign(this, {
    isHurt: false, hurtDuration: 0.5, hurtTimer: 0, hurtUseDizzy: true,
    hurtPhase: null, hurtPhaseTimer: 0, invulnerableTimer: 0,
    invulnerableBlinkInterval: 0.15, invulnerableBlinkWindow: 0.6,
  });
}

/**
 * Initializes death state.
 * Performs hitbox or collision checks.
 * @param {number} x X.
 * @param {number} y Y.
 */
export function initializeDeathState(x, y) {
  Object.assign(this, {
    isDead: false, lastSafePosX: x, lastSafePosY: y, collisionDisabled: false,
    deathSoundPlayed: false, onDeath: null,
  });
}

/**
 * Initializes advanced jump.
 * Applies physics updates like gravity and velocity.
 */
export function initializeAdvancedJump() {
  Object.assign(this, {
    coyoteTime: 0.1, coyoteTimer: 0, jumpBufferTime: 0.1, jumpBufferTimer: 0,
    jumpCutMultiplier: 0.5, jumpHeld: false, justLanded: false, landedOnPlatform: false,
  });
}

/**
 * Initializes facing.
 * Updates the instance state.
 */
export function initializeFacing() {
  this.facing = FACING_RIGHT;
}

/**
 * Initializes heart system.
 * Updates the instance state.
 */
export function initializeHeartSystem() {
  this.maxHearts = PLAYER_MAX_HEARTS;
  this.healthPoints = this.maxHearts * 2;
  this.maxHealthPoints = this.healthPoints;
  this.healthPulse = 0;
}

/**
 * Initializes coins.
 * Updates the instance state.
 */
export function initializeCoins() {
  this.coins = 0;
  this.hudPulse = 0;
}
