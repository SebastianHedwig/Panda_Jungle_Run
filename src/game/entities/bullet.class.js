import { BulletAudio } from "../audio/bulletAudio.class.js";
import { PLAYER_BULLET_DAMAGE, FACING_LEFT } from "../../config/config.js";

const bulletAudio = new BulletAudio();
const EXPLOSION_BASE_SIZE = 64;

export class Bullet {
  constructor(startX, startY, direction, world) {
    this.positionX = startX;
    this.positionY = startY;
    this.velocityX = 900 * direction;

    this.width = 32;
    this.height = 16;
    this.scaleFactor = 1.2;

    this.facingDirection = direction;
    this.world = world;
    this.remove = false;

    this.image = new Image();
    this.image.src = "assets/img/Bullets/Bullet-1.png";
  }

  getBounds() {
    const left = this.positionX;
    const top = this.positionY;
    const width = this.width * this.scaleFactor;
    const height = this.height * this.scaleFactor;
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    };
  }

  update(dt, enemies = []) {
    this.positionX += this.velocityX * dt;

    const bounds = this.getBounds();
    const shouldPlayImpactSound = !this.isBeyondCanvasMargin(50);

    for (const platform of this.world.platforms || []) {
      const hit =
        bounds.left < platform.right &&
        bounds.right > platform.left &&
        bounds.top < platform.bottom &&
        bounds.bottom > platform.top;

      if (hit) {
        this.remove = true;
        if (shouldPlayImpactSound) bulletAudio.playImpact();
        this.world.spawnExplosion(
          this.positionX + bounds.width / 2,
          this.positionY + bounds.height / 2
        );
        return;
      }
    }

    // OUT OF WORLD → remove
    if (this.positionX < -200 || this.positionX > this.world.width + 200) {
      this.remove = true;
      return;
    }

    // ENEMY COLLISION
    enemies.forEach((enemy) => {
      if (this.collidesWith(enemy)) {
        this.remove = true;
        if (shouldPlayImpactSound) bulletAudio.playImpact();
        this.world.spawnExplosion(this.positionX, this.positionY);
        enemy.takeDamage?.(PLAYER_BULLET_DAMAGE);
        if (!enemy.isDead && enemy.health > 0 && !enemy.disableHitEffect) {
          const { x: enemyX, y: enemyY, width: enemyWidth, height: enemyHeight } = enemy;
          this.world.spawnHitEffect?.(enemyX, enemyY, enemyWidth, enemyHeight);
        }
      }
    });
  }

  collidesWith(obj) {
    const bounds = this.getBounds();
    const target = obj.getHitbox ? obj.getHitbox() : obj;
    return (
      bounds.left < target.x + target.width &&
      bounds.right > target.x &&
      bounds.top < target.y + target.height &&
      bounds.bottom > target.y
    );
  }

  render(ctx, camera) {
    const screenX = this.positionX - camera.x;
    const screenY = this.positionY - camera.y;

    ctx.save();

    // Flip when facing left
    if (this.facingDirection === FACING_LEFT) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.image,
        -(screenX + this.width * this.scaleFactor),
        screenY,
        this.width * this.scaleFactor,
        this.height * this.scaleFactor
      );
    } else {
      ctx.drawImage(
        this.image,
        screenX,
        screenY,
        this.width * this.scaleFactor,
        this.height * this.scaleFactor
      );
    }

    ctx.restore();
  }

  isBeyondCanvasMargin(margin = 0) {
    const canvas = this.world?.canvas;
    if (!canvas) return false;
    const bounds = this.getBounds();
    const camera = this.world?.camera;
    const cameraX = camera?.x || 0;
    const cameraY = camera?.y || 0;
    const screenX = bounds.left - cameraX;
    const screenY = bounds.top - cameraY;
    return (
      screenX + bounds.width < -margin ||
      screenX > canvas.width + margin ||
      screenY + bounds.height < -margin ||
      screenY > canvas.height + margin
    );
  }
}

/* ===========================================================
   EXPLOSION ANIMATION – LASTS 7 FRAMES & REMOVES ITSELF
   =========================================================== */

export class Explosion {
  constructor(centerX, centerY) {
    this.positionX = centerX;
    this.positionY = centerY;

    this.frames = [];
    this.currentFrameIndex = 0;
    this.frameTime = 0;
    this.frameDuration = 0.06;
    this.scaleFactor = 1.6;
    this.finished = false;

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

    const img = this.frames[this.currentFrameIndex];
    if (!img) return;

    const explosionWidth = EXPLOSION_BASE_SIZE * this.scaleFactor;
    const explosionHeight = explosionWidth;
    ctx.drawImage(
      img,
      this.positionX - camera.x - explosionWidth / 2,
      this.positionY - camera.y - explosionHeight / 2,
      explosionWidth,
      explosionHeight
    );
  }
}
