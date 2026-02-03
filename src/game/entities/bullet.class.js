import { BulletAudio } from "../audio/bulletAudio.class.js";
import { PLAYER_BULLET_DAMAGE, FACING_LEFT } from "../../config/config.js";

const bulletAudio = new BulletAudio();
const EXPLOSION_BASE_SIZE = 64;

export class Bullet {
  constructor(startX, startY, direction, world) {
    this.initPosition(startX, startY, direction);
    this.initDimensions();
    this.initState(direction, world);
    this.initImage();
  }

  initPosition(startX, startY, direction) {
    this.positionX = startX;
    this.positionY = startY;
    this.velocityX = 900 * direction;
  }

  initDimensions() {
    this.width = 32;
    this.height = 16;
    this.scaleFactor = 1.2;
  }

  initState(direction, world) {
    this.facingDirection = direction;
    this.world = world;
    this.remove = false;
  }

  initImage() {
    this.image = new Image();
    this.image.src = "assets/img/Bullets/Bullet-1.png";
  }

  getBounds() {
    const left = this.positionX;
    const top = this.positionY;
    const width = this.width * this.scaleFactor;
    const height = this.height * this.scaleFactor;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }

  update(dt, enemies = []) {
    this.advancePosition(dt);
    const bounds = this.getBounds();
    const shouldPlayImpactSound = this.getShouldPlayImpactSound();
    if (this.handlePlatformCollision(bounds, shouldPlayImpactSound)) return;
    if (this.shouldDespawn()) { this.remove = true; return; }
    this.handleEnemyCollisions(enemies, shouldPlayImpactSound);
  }

  advancePosition(dt) {
    this.positionX += this.velocityX * dt;
  }

  getShouldPlayImpactSound() {
    return !this.isBeyondCanvasMargin(50);
  }

  handlePlatformCollision(bounds, shouldPlayImpactSound) {
    for (const platform of this.world.platforms || []) {
      if (this.didHitPlatform(bounds, platform)) {
        this.onPlatformHit(bounds, shouldPlayImpactSound);
        return true;
      }
    }
    return false;
  }

  didHitPlatform(bounds, platform) {
    return bounds.left < platform.right && bounds.right > platform.left &&
      bounds.top < platform.bottom && bounds.bottom > platform.top;
  }

  onPlatformHit(bounds, shouldPlayImpactSound) {
    this.remove = true;
    this.playImpactIfAllowed(shouldPlayImpactSound);
    this.spawnPlatformExplosion(bounds);
  }

  playImpactIfAllowed(shouldPlayImpactSound) {
    if (shouldPlayImpactSound) bulletAudio.playImpact();
  }

  spawnPlatformExplosion(bounds) {
    this.world.spawnExplosion(this.positionX + bounds.width / 2, this.positionY + bounds.height / 2);
  }

  shouldDespawn() {
    const horizontalDespawnMargin = 200;
    return this.positionX < -horizontalDespawnMargin || this.positionX > this.world.width + horizontalDespawnMargin;
  }

  handleEnemyCollisions(enemies, shouldPlayImpactSound) {
    enemies.forEach((enemy) => this.tryHitEnemy(enemy, shouldPlayImpactSound));
  }

  tryHitEnemy(enemy, shouldPlayImpactSound) {
    if (!this.collidesWith(enemy)) return;
    this.remove = true;
    this.playImpactIfAllowed(shouldPlayImpactSound);
    this.world.spawnExplosion(this.positionX, this.positionY);
    this.applyEnemyDamage(enemy);
    this.maybeSpawnHitEffect(enemy);
  }

  applyEnemyDamage(enemy) {
    enemy.takeDamage?.(PLAYER_BULLET_DAMAGE);
  }

  maybeSpawnHitEffect(enemy) {
    if (!this.isHitEffectAllowed(enemy)) return;
    this.spawnHitEffectForEnemy(enemy);
  }

  isHitEffectAllowed(enemy) {
    return !enemy.isDead && enemy.health > 0 && !enemy.disableHitEffect;
  }

  spawnHitEffectForEnemy(enemy) {
    const { x: enemyX, y: enemyY, width: enemyWidth, height: enemyHeight } = enemy;
    this.world.spawnHitEffect?.(enemyX, enemyY, enemyWidth, enemyHeight);
  }

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

  render(ctx, camera) {
    const { screenX, screenY } = this.getScreenPosition(camera);
    ctx.save();
    if (this.facingDirection === FACING_LEFT) this.drawFlipped(ctx, screenX, screenY);
    else this.drawNormal(ctx, screenX, screenY);
    ctx.restore();
  }

  getScreenPosition(camera) {
    const screenX = this.positionX - camera.x;
    const screenY = this.positionY - camera.y;
    return { screenX, screenY };
  }

  getScaledWidth() {
    return this.width * this.scaleFactor;
  }

  getScaledHeight() {
    return this.height * this.scaleFactor;
  }

  drawFlipped(ctx, screenX, screenY) {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();
    ctx.scale(-1, 1);
    ctx.drawImage(this.image, -(screenX + scaledWidth), screenY, scaledWidth, scaledHeight);
  }

  drawNormal(ctx, screenX, screenY) {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();
    ctx.drawImage(this.image, screenX, screenY, scaledWidth, scaledHeight);
  }

  isBeyondCanvasMargin(margin = 0) {
    const canvas = this.world?.canvas;
    if (!canvas) return false;
    const bounds = this.getBounds();
    const { screenX, screenY } = this.getScreenBounds(bounds);
    return this.isOutsideCanvas(screenX, screenY, bounds, canvas, margin);
  }

  getScreenBounds(bounds) {
    const camera = this.world?.camera;
    const cameraX = camera?.x || 0;
    const cameraY = camera?.y || 0;
    const screenX = bounds.left - cameraX;
    const screenY = bounds.top - cameraY;
    return { screenX, screenY };
  }

  isOutsideCanvas(screenX, screenY, bounds, canvas, margin) {
    return screenX + bounds.width < -margin || screenX > canvas.width + margin ||
      screenY + bounds.height < -margin || screenY > canvas.height + margin;
  }
}

export class Explosion {
  constructor(centerX, centerY) {
    this.initPosition(centerX, centerY);
    this.initAnimationState();
    this.loadFrames();
  }

  initPosition(centerX, centerY) {
    this.positionX = centerX;
    this.positionY = centerY;
  }

  initAnimationState() {
    this.frames = [];
    this.currentFrameIndex = 0;
    this.frameTime = 0;
    this.frameDuration = 0.06;
    this.scaleFactor = 1.6;
    this.finished = false;
  }

  loadFrames() {
    for (let frameIndex = 1; frameIndex <= 7; frameIndex++) {
      const img = new Image();
      img.src = `assets/img/Explosions/EXPLOSIONS${frameIndex}.png`;
      this.frames.push(img);
    }
  }

  update(dt) {
    this.frameTime += dt;

    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.frames.length) {
        this.finished = true;
        return;
      }
    }
  }

  render(ctx, camera) {
    if (this.finished) return;
    const img = this.getCurrentFrame();
    if (!img) return;
    this.drawExplosion(ctx, camera, img);
  }

  getCurrentFrame() {
    return this.frames[this.currentFrameIndex];
  }

  drawExplosion(ctx, camera, img) {
    const { explosionWidth, explosionHeight } = this.getExplosionSize();
    ctx.drawImage(
      img,
      this.positionX - camera.x - explosionWidth / 2,
      this.positionY - camera.y - explosionHeight / 2,
      explosionWidth,
      explosionHeight
    );
  }

  getExplosionSize() {
    const explosionWidth = EXPLOSION_BASE_SIZE * this.scaleFactor;
    const explosionHeight = explosionWidth;
    return { explosionWidth, explosionHeight };
  }
}
