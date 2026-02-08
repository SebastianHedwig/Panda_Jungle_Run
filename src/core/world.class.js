import { WORLD_WIDTH } from "../config/config.js";
import { Bullet, Explosion } from "../game/entities/gunBullet/bullet.class.js";
import { DizzyEffect } from "../game/effects/hitEffect.class.js";
import {
  applyHeadBump,
  applyHorizontalLimits,
  applyLandingCollision,
  applyLandingFromAbove,
  applyPlatformCollisions,
  applyPostCollisionEffects,
  applySideWallCollision,
  applyStayGrounded,
  getCollisionConfig,
  getCollisionState,
  getPlatformOverlapState,
  getPlayerCollisionMetrics,
  resetPlayerGroundState,
  shouldSkipCollision,
  stopSlideIfBlocked,
} from "./world.collision.js";

export class World {
  /**
   * Creates a new instance.
   * Updates the instance state.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.setupWorldBounds();
    this.setupLevelObjects();
    this.setupProjectiles();
  }

  /**
   * Sets up world bounds.
   * Updates the instance state.
   */
  setupWorldBounds() {
    this.width = WORLD_WIDTH;
    this.left = 0;
    this.right = this.width;
    this.baseGround = this.canvas.height;
  }

  /**
   * Sets up level objects.
   * Updates the instance state.
   */
  setupLevelObjects() {
    this.platforms = [];
    this.collectables = [];
    this.hudPopups = [];
    this.enemies = [];
    this.hitEffects = [];
    this.hitEffectFrames = null;
  }

  /**
   * Sets up projectiles.
   * Updates the instance state.
   */
  setupProjectiles() {
    this.bullets = [];
    this.explosions = [];
  }

  /**
   * Adds platforms.
   * Updates the instance state.
   * @param {*} platforms Platforms.
   */
  addPlatforms(platforms) {
    this.platforms.push(...platforms);
    const landingSurfaces = this.platforms.filter((platform) => platform.supportsLanding);
    const highestLandingY = Math.max(...landingSurfaces.map((platform) => platform.top));
    if (Number.isFinite(highestLandingY)) this.baseGround = highestLandingY;
  }

  /**
   * Adds collectables.
   * Updates the instance state.
   * @param {*} items Items.
   */
  addCollectables(items) {
    this.collectables.push(...items);
  }

  /**
   * Adds enemies.
   * Updates the instance state.
   * @param {*} enemies Enemies.
   */
  addEnemies(enemies) {
    this.enemies.push(...enemies);
  }

  /**
   * Coin position is valid. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} [width] Width.
   * @param {number} [height] Height.
   * @param {number} [existingCoins] Existing coins.
   * @param {number} [minSpacing] Min spacing.
   * @returns {*} Result value.
   */
  coinPositionIsValid(x, y, width = 50, height = 50, existingCoins = [], minSpacing = 0) {
    if (this.hasPlatformOverlap(x, y, width, height)) return false;
    if (this.isTooCloseToCoins(x, y, width, height, existingCoins, minSpacing)) return false;
    return true;
  }

  /**
   * Has platform overlap.
   * Performs hitbox or collision checks.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} width Width.
   * @param {number} height Height.
   * @returns {boolean} Whether platform overlap.
   */
  hasPlatformOverlap(x, y, width, height) {
    return this.platforms.some((platform) => {
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;
      const platformTop = platform.y;
      const platformBottom = platform.y + platform.height;
      const overlapsX = x + width > platformLeft && x < platformRight;
      const coinBottom = y + height;
      const coinTop = y;
      const overlapsY = coinBottom > platformTop && coinTop < platformBottom;
      return overlapsX && overlapsY;
    });
  }

  /**
   * Is too close to coins.
   * Uses x, y, width, height, existingCoins, minSpacing to perform the operation.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} width Width.
   * @param {number} height Height.
   * @param {number} existingCoins Existing coins.
   * @param {number} minSpacing Min spacing.
   * @returns {boolean} Whether too close to coins.
   */
  isTooCloseToCoins(x, y, width, height, existingCoins, minSpacing) {
    if (minSpacing <= 0 || !existingCoins?.length) return false;
    const candidateCenterX = x + width / 2;
    const candidateCenterY = y + height / 2;
    const minSpacingSquared = minSpacing * minSpacing;
    return existingCoins.some((coin) => {
      const otherWidth = coin.width ?? width;
      const otherHeight = coin.height ?? height;
      const otherCenterX = coin.x + otherWidth / 2;
      const otherCenterY = coin.y + otherHeight / 2;
      const deltaX = otherCenterX - candidateCenterX;
      const deltaY = otherCenterY - candidateCenterY;
      return deltaX * deltaX + deltaY * deltaY < minSpacingSquared;
    });
  }

  /**
   * Adds popup.
   * Updates the instance state.
   * @param {*} popup Popup.
   */
  addPopup(popup) {
    this.hudPopups.push(popup);
  }

  /**
   * Sets hit effect frames.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {*} frames Frames.
   */
  setHitEffectFrames(frames) {
    this.hitEffectFrames = frames;
  }

  /**
   * Spawns bullet.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} direction Direction.
   */
  spawnBullet(x, y, direction) {
    this.bullets.push(new Bullet(x, y, direction, this));
  }

  /**
   * Spawns explosion.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {number} x X.
   * @param {number} y Y.
   */
  spawnExplosion(x, y) {
    this.explosions.push(new Explosion(x, y));
  }

  /**
   * Spawns hit effect. If omitted, default values are used.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} [width] Width.
   * @param {number} [height] Height.
   */
  spawnHitEffect(x, y, width = 0, height = 0) {
    if (!this.hitEffectFrames?.length) return;
    const headOffsetYRatio = 0.05;
    const headX = x + width / 2;
    const headY = y + height * headOffsetYRatio;
    this.hitEffects.push(new DizzyEffect(headX, headY, this.hitEffectFrames));
  }

  /**
   * Updates projectiles. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   * @param {*} [enemies] Enemies.
   * @returns {*} Result value.
   */
  updateProjectiles(dt, enemies = []) {
    this.bullets = this.bullets.filter((bullet) => {
      bullet.update(dt, enemies);
      return !bullet.remove;
    });

    this.explosions = this.explosions.filter((explosion) => {
      explosion.update(dt);
      return !explosion.finished;
    });
  }

  /**
   * Updates hit effects.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {number} dt Delta time in seconds.
   * @returns {*} Result value.
   */
  updateHitEffects(dt) {
    this.hitEffects = this.hitEffects.filter((effect) => {
      effect.update(dt);
      return !effect.finished;
    });
  }

  /**
   * Renders projectiles.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  renderProjectiles(ctx, camera) {
    this.bullets.forEach((bullet) => bullet.render(ctx, camera));
    this.explosions.forEach((explosion) => explosion.render(ctx, camera));
  }

  /**
   * Renders hit effects.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  renderHitEffects(ctx, camera) {
    this.hitEffects.forEach((effect) => effect.render(ctx, camera));
  }

  /**
   * Updates enemies.
   * Updates the enemy state.
   * @param {number} dt Delta time in seconds.
   * @param {import("../game/entities/player/player.class.js").Player} player Player instance.
   * @returns {*} Result value.
   */
  updateEnemies(dt, player) {
    this.enemies = this.enemies.filter((enemy) => {
      enemy.update(dt, player);
      return !enemy.remove;
    });
  }

  /**
   * Renders enemies.
   * Updates the enemy state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  renderEnemies(ctx, camera) {
    this.enemies.forEach((enemy) => enemy.render(ctx, camera));
  }
}

Object.assign(World.prototype, {
  applyPlatformCollisions,
  shouldSkipCollision,
  getCollisionConfig,
  getPlayerCollisionMetrics,
  resetPlayerGroundState,
  getCollisionState,
  getPlatformOverlapState,
  applyLandingCollision,
  applyLandingFromAbove,
  applyStayGrounded,
  applyHeadBump,
  applySideWallCollision,
  applyPostCollisionEffects,
  applyHorizontalLimits,
  stopSlideIfBlocked,
});
