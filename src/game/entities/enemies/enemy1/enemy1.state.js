import { ENEMY1_DAMAGE, ENEMY1_HEALTH, ENEMY1_SPEED } from "../../../../config/config.js";

/**
 * Initializes stats.
 */
export function initializeStats() {
  Object.assign(this, {
    speed: ENEMY1_SPEED, health: ENEMY1_HEALTH, damage: ENEMY1_DAMAGE,
    attackDamageCurrent: this.damage, isDead: false, remove: false, deathDone: false,
    deathTimer: 0, blinkTimer: 0,
  });
}

/**
 * Initializes combat defaults.
 */
export function initializeCombatDefaults() {
  this.isAttacking = false;
  this.attackDuration = 0.6;
  this.attackTimer = 0;
  this.attackRange = 60;
  this.attackHeightTolerance = 20;
}

/**
 * Initializes chase defaults.
 */
export function initializeChaseDefaults() {
  this.chaseRangeX = 300;
  this.chaseRangeXExit = 360;
  this.chaseRangeY = 200;
  this.chaseRangeYExit = 260;
  this.hasDroppedLoot = false;
}

