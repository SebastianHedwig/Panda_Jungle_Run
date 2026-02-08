import { BulletAudio } from "../../audio/bulletAudio.class.js";
import { PLAYER_BULLET_DAMAGE, FACING_LEFT } from "../../../config/config.js";
export { Explosion } from "./explosion.class.js";

const bulletAudio = new BulletAudio();

export class Bullet {
  /**
   * Creates a new instance.
   * Updates the instance state.
   * @param {number} startX Start X.
   * @param {number} startY Start Y.
   * @param {*} direction Direction.
   * @param {import("../../../core/world.class.js").World} world World instance.
   */
  constructor(startX, startY, direction, world) {
    this.initPosition(startX, startY, direction);
    this.initDimensions();
    this.initState(direction, world);
    this.initImage();
  }

  /**
   * Initializes position.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} startX Start X.
   * @param {number} startY Start Y.
   * @param {*} direction Direction.
   */
  initPosition(startX, startY, direction) {
    this.positionX = startX;
    this.positionY = startY;
    this.velocityX = 900 * direction;
  }

  /**
   * Initializes dimensions.
   * Updates the instance state.
   */
  initDimensions() {
    this.width = 32;
    this.height = 16;
    this.scaleFactor = 1.2;
  }

  /**
   * Initializes state.
   * Updates the instance state.
   * @param {*} direction Direction.
   * @param {import("../../../core/world.class.js").World} world World instance.
   */
  initState(direction, world) {
    this.facingDirection = direction;
    this.world = world;
    this.remove = false;
  }

  /**
   * Initializes image.
   * Updates the instance state.
   */
  initImage() {
    this.image = new Image();
    this.image.src = "assets/img/Bullets/Bullet-1.png";
  }

  /**
   * Returns bounds.
   * Updates the instance state.
   * @returns {Object} Bounds.
   */
  getBounds() {
    const left = this.positionX;
    const top = this.positionY;
    const width = this.width * this.scaleFactor;
    const height = this.height * this.scaleFactor;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }

  /**
   * Updates. If omitted, default values are used.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {number} dt Delta time in seconds.
   * @param {*} [enemies] Enemies.
   */
  update(dt, enemies = []) {
    this.advancePosition(dt);
    const bounds = this.getBounds();
    const shouldPlayImpactSound = this.getShouldPlayImpactSound();
    if (this.handlePlatformCollision(bounds, shouldPlayImpactSound)) return;
    if (this.shouldDespawn()) { this.remove = true; return; }
    this.handleEnemyCollisions(enemies, shouldPlayImpactSound);
  }

  /**
   * Advances position.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  advancePosition(dt) {
    this.positionX += this.velocityX * dt;
  }

  /**
   * Returns should play impact sound.
   * Updates the instance state.
   * @returns {*} Should play impact sound.
   */
  getShouldPlayImpactSound() {
    return !this.isBeyondCanvasMargin(50);
  }

  /**
   * Handles platform collision.
   * Updates the world state.
   * @param {*} bounds Bounds.
   * @param {boolean} shouldPlayImpactSound Whether play impact sound.
   * @returns {*} Result value.
   */
  handlePlatformCollision(bounds, shouldPlayImpactSound) {
    for (const platform of this.world.platforms || []) {
      if (this.didHitPlatform(bounds, platform)) {
        this.onPlatformHit(bounds, shouldPlayImpactSound);
        return true;
      }
    }
    return false;
  }

  /**
   * Did hit platform.
   * Uses bounds, platform to perform the operation.
   * @param {*} bounds Bounds.
   * @param {import("../../../engine/world/platform.class.js").Platform} platform Platform.
   * @returns {*} Result value.
   */
  didHitPlatform(bounds, platform) {
    return bounds.left < platform.right && bounds.right > platform.left &&
      bounds.top < platform.bottom && bounds.bottom > platform.top;
  }

  /**
   * On platform hit.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {*} bounds Bounds.
   * @param {boolean} shouldPlayImpactSound Whether play impact sound.
   */
  onPlatformHit(bounds, shouldPlayImpactSound) {
    this.remove = true;
    this.playImpactIfAllowed(shouldPlayImpactSound);
    this.spawnPlatformExplosion(bounds);
  }

  /**
   * Plays impact if allowed.
   * Triggers audio playback or updates audio state.
   * @param {boolean} shouldPlayImpactSound Whether play impact sound.
   */
  playImpactIfAllowed(shouldPlayImpactSound) {
    if (shouldPlayImpactSound) bulletAudio.playImpact();
  }

  /**
   * Spawns platform explosion.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @param {*} bounds Bounds.
   */
  spawnPlatformExplosion(bounds) {
    this.world.spawnExplosion(this.positionX + bounds.width / 2, this.positionY + bounds.height / 2);
  }

  /**
   * Should despawn.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @returns {boolean} Whether despawn.
   */
  shouldDespawn() {
    const horizontalDespawnMargin = 200;
    return this.positionX < -horizontalDespawnMargin || this.positionX > this.world.width + horizontalDespawnMargin;
  }

  /**
   * Handles enemy collisions.
   * Updates the instance state.
   * @param {*} enemies Enemies.
   * @param {boolean} shouldPlayImpactSound Whether play impact sound.
   */
  handleEnemyCollisions(enemies, shouldPlayImpactSound) {
    enemies.forEach((enemy) => this.tryHitEnemy(enemy, shouldPlayImpactSound));
  }

  /**
   * Try hit enemy.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
   * @param {boolean} shouldPlayImpactSound Whether play impact sound.
   */
  tryHitEnemy(enemy, shouldPlayImpactSound) {
    if (!this.collidesWith(enemy)) return;
    this.remove = true;
    this.playImpactIfAllowed(shouldPlayImpactSound);
    this.world.spawnExplosion(this.positionX, this.positionY);
    this.applyEnemyDamage(enemy);
    this.maybeSpawnHitEffect(enemy);
  }

  /**
   * Applies enemy damage.
   * Updates the enemy state.
   * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
   */
  applyEnemyDamage(enemy) {
    enemy.takeDamage?.(PLAYER_BULLET_DAMAGE);
  }

  /**
   * Maybe spawn hit effect.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
   */
  maybeSpawnHitEffect(enemy) {
    if (!this.isHitEffectAllowed(enemy)) return;
    this.spawnHitEffectForEnemy(enemy);
  }

  /**
   * Is hit effect allowed.
   * Updates the enemy state.
   * Spawns visual feedback effects.
   * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
   * @returns {boolean} Whether hit effect allowed.
   */
  isHitEffectAllowed(enemy) {
    return !enemy.isDead && enemy.health > 0 && !enemy.disableHitEffect;
  }

  /**
   * Spawns hit effect for enemy.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @param {import("../enemies/base/enemies.base.class.js").EnemyBase} enemy Enemy instance.
   */
  spawnHitEffectForEnemy(enemy) {
    const { x: enemyX, y: enemyY, width: enemyWidth, height: enemyHeight } = enemy;
    this.world.spawnHitEffect?.(enemyX, enemyY, enemyWidth, enemyHeight);
  }

  /**
   * Collides with.
   * Updates the instance state.
   * @param {*} target Target.
   * @returns {*} Result value.
   */
  collidesWith(target) {
    const bounds = this.getBounds();
    const targetBox = target.getHitbox ? target.getHitbox() : target;
    return (
      bounds.left < targetBox.x + targetBox.width &&
      bounds.right > targetBox.x &&
      bounds.top < targetBox.y + targetBox.height &&
      bounds.bottom > targetBox.y
    );
  }

  /**
   * Renders.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  render(ctx, camera) {
    const { screenX, screenY } = this.getScreenPosition(camera);
    ctx.save();
    if (this.facingDirection === FACING_LEFT) this.drawFlipped(ctx, screenX, screenY);
    else this.drawNormal(ctx, screenX, screenY);
    ctx.restore();
  }

  /**
   * Returns screen position.
   * Updates the instance state.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   * @returns {Object} Screen position.
   */
  getScreenPosition(camera) {
    const screenX = this.positionX - camera.x;
    const screenY = this.positionY - camera.y;
    return { screenX, screenY };
  }

  /**
   * Returns scaled width.
   * Updates the instance state.
   * @returns {*} Scaled width.
   */
  getScaledWidth() {
    return this.width * this.scaleFactor;
  }

  /**
   * Returns scaled height.
   * Updates the instance state.
   * @returns {*} Scaled height.
   */
  getScaledHeight() {
    return this.height * this.scaleFactor;
  }

  /**
   * Draws flipped.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} screenX Screen X.
   * @param {number} screenY Screen Y.
   */
  drawFlipped(ctx, screenX, screenY) {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();
    ctx.scale(-1, 1);
    ctx.drawImage(this.image, -(screenX + scaledWidth), screenY, scaledWidth, scaledHeight);
  }

  /**
   * Draws normal.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} screenX Screen X.
   * @param {number} screenY Screen Y.
   */
  drawNormal(ctx, screenX, screenY) {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();
    ctx.drawImage(this.image, screenX, screenY, scaledWidth, scaledHeight);
  }

  /**
   * Is beyond canvas margin. If omitted, default values are used.
   * Updates the instance state.
   * @param {*} [margin] Margin.
   * @returns {boolean} Whether beyond canvas margin.
   */
  isBeyondCanvasMargin(margin = 0) {
    const canvas = this.world?.canvas;
    if (!canvas) return false;
    const bounds = this.getBounds();
    const { screenX, screenY } = this.getScreenBounds(bounds);
    return this.isOutsideCanvas(screenX, screenY, bounds, canvas, margin);
  }

  /**
   * Returns screen bounds.
   * Updates the instance state.
   * @param {*} bounds Bounds.
   * @returns {Object} Screen bounds.
   */
  getScreenBounds(bounds) {
    const camera = this.world?.camera;
    const cameraX = camera?.x || 0;
    const cameraY = camera?.y || 0;
    const screenX = bounds.left - cameraX;
    const screenY = bounds.top - cameraY;
    return { screenX, screenY };
  }

  /**
   * Is outside canvas.
   * Uses screenX, screenY, bounds, canvas, margin to perform the operation.
   * @param {number} screenX Screen X.
   * @param {number} screenY Screen Y.
   * @param {*} bounds Bounds.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {*} margin Margin.
   * @returns {boolean} Whether outside canvas.
   */
  isOutsideCanvas(screenX, screenY, bounds, canvas, margin) {
    return screenX + bounds.width < -margin || screenX > canvas.width + margin ||
      screenY + bounds.height < -margin || screenY > canvas.height + margin;
  }
}



