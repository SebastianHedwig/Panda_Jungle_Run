import { EnemyBase } from "../base/enemies.base.class.js";
import { ENEMY1_COIN_DROP_COUNT, ENEMY_HEIGHT, ENEMY_WIDTH } from "../../../../config/config.js";
import { loadEnemy1Sprites, initializeSpriteFrames } from "./enemy1.assets.js";
import { initializeAnimationState, setAnimation, animate } from "./enemy1.animation.js";
import { initializeStats, initializeCombatDefaults, initializeChaseDefaults } from "./enemy1.state.js";
import { update } from "./enemy1.update.js";
import { tryDealAttackDamage } from "./enemy1.combat.js";
import { render } from "./enemy1.render.js";

export { loadEnemy1Sprites };

export class Enemy1 extends EnemyBase {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} sprites Sprites.
   * @param {import("../../../../core/world.class.js").World} [world] World instance.
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

Object.assign(Enemy1.prototype, {
  initializeSpriteFrames,
  initializeAnimationState,
  initializeStats,
  initializeCombatDefaults,
  initializeChaseDefaults,
  setAnimation,
  animate,
  update,
  tryDealAttackDamage,
  render,
});

