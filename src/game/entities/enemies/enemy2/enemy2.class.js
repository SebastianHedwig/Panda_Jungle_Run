import { Enemy1 } from "../enemy1/enemy1.class.js";
import { EnemyBase } from "../base/enemies.base.class.js";
import { ENEMY2_ATTACK1_DAMAGE, ENEMY2_ATTACK2_DAMAGE, ENEMY2_HEALTH, ENEMY2_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT, ENEMY2_COIN_DROP_COUNT } from "../../../../config/config.js";
import { loadFrames } from "../../../../core/game/assets/assetLoader.js";

/**
 * Loads enemy 2 sprites.
 * @returns {Object} Result value.
 */
export function loadEnemy2Sprites() {
  const base = "assets/img/Enemies/Enemy_Sprites/Character-2/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    run: loadFrames(`${base}run/`, "Run_", 8),
    attack1: loadFrames(`${base}attack-1/`, "Attack-1_", 8),
    attack2: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

export class Enemy2 extends Enemy1 {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} sprites Sprites.
   * @param {import("../../../../core/world.class.js").World} [world] World instance.
   */
  constructor(x, y, sprites, world = null) {
    super(x, y, buildEnemy2SpriteSet(sprites), world, ENEMY_WIDTH, ENEMY_HEIGHT);
    this.initializeEnemy2State(sprites);
  }

  /**
   * Initializes enemy 2 state.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {*} sprites Sprites.
   */
  initializeEnemy2State(sprites) {
    this.runFrames = sprites.run;
    this.walkFrames = sprites.run;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.attack1Damage = ENEMY2_ATTACK1_DAMAGE;
    this.attack2Damage = ENEMY2_ATTACK2_DAMAGE;
    this.speed = ENEMY2_SPEED;
    this.health = ENEMY2_HEALTH;
    this.hasDroppedLoot = false;
  }

  /**
   * Try start attack.
   * Updates the player state.
   * Introduces randomness into the outcome.
   * @param {import("../../player/player.class.js").Player} playerInfo Player info.
   * @param {import("../../player/player.class.js").Player} player Player instance.
   * @returns {*} Result value.
   */
  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const deltaX = playerInfo.deltaX;
    const absoluteDeltaY = playerInfo.absoluteDeltaY;
    if (Math.abs(deltaX) <= this.attackRange && absoluteDeltaY <= this.attackHeightTolerance) {
      const attack2Probability = 0.5;
      const useSecond = Math.random() < attack2Probability;
      const frames = useSecond ? this.attack2Frames : this.attack1Frames;
      const damage = useSecond ? this.attack2Damage : this.attack1Damage;
      this.startMeleeAttack(deltaX, frames, damage, player);
      return true;
    }
    return false;
  }

  /**
   * Take damage. If omitted, default values are used.
   * Uses amount, hitContext to perform the operation.
   * @param {number} [amount] Amount.
   * @param {*} [hitContext] Hit context.
   */
  takeDamage(amount = 1, hitContext = {}) {
    const wasDead = this.isDead;
    EnemyBase.prototype.takeDamage.call(this, amount, hitContext);
    if (!wasDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(ENEMY2_COIN_DROP_COUNT);
      this.hasDroppedLoot = true;
    }
  }
}

/**
 * Builds enemy 2 sprite set.
 * Advances animation state and sprites.
 * @param {*} sprites Sprites.
 * @returns {Object} Enemy 2 sprite set.
 */
function buildEnemy2SpriteSet(sprites) {
  return { ...sprites, walk: sprites.run, attack: sprites.attack1 };
}
