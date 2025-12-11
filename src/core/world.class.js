import { WORLD_WIDTH } from "../config.js";
import { Bullet, Explosion } from "./bullet.class.js";
import { DizzyEffect } from "./hitEffect.class.js";

export class World {
  constructor(canvas) {
    this.canvas = canvas;

    this.width = WORLD_WIDTH;
    this.left = 0;
    this.right = this.width;

    this.baseGround = canvas.height;

    /** ----- LEVEL OBJECTS ----- */
    this.platforms = [];
    this.collectables = [];
    this.hudPopups = [];
    this.enemies = [];
    this.hitEffects = [];
    this.hitEffectFrames = null;

    /** ----- PROJECTILES & FX ----- */
    this.bullets = [];
    this.explosions = [];
  }

  /** ---------- ADD PLATFORMS ---------- */
  addPlatforms(platforms) {
    this.platforms.push(...platforms);
    const floorTop = Math.max(...this.platforms.map((p) => p.top));
    if (Number.isFinite(floorTop)) this.baseGround = floorTop;
  }

  /** ---------- ADD COLLECTABLES ---------- */
  addCollectables(items) {
    this.collectables.push(...items);
  }

  /** ---------- ADD ENEMIES ---------- */
  addEnemies(enemies) {
    this.enemies.push(...enemies);
  }

  /** ---------- PLATFORM COLLISION LOGIC ---------- */
  applyPlatformCollisions(player) {
    if (player?.isDead || player?.collisionDisabled) return;
    let grounded = false;
    const prevX = player?._preCollisionX ?? player.x;

    const prevBottom = player.y + player.height - player.vy;
    const currBottom = player.y + player.height;
    const currTop = player.y;

    for (const p of this.platforms) {
      const overlapsY = currBottom > p.top && currTop < p.bottom;
      const overlapsX = player.x + player.width > p.left && player.x < p.right;

      // LANDING FROM ABOVE
      if (p.supportsLanding && overlapsY && overlapsX) {
        if (player.vy > 0 && prevBottom <= p.top && currBottom >= p.top) {
          player.y = p.top - player.height;
          player.vy = 0;
          player.onGround = true;
          grounded = true;
          continue;
        }

        // HEAD BUMP
        if (
          player.vy < 0 &&
          currTop <= p.bottom &&
          currTop - player.vy >= p.bottom
        ) {
          player.y = p.bottom;
          player.vy = 0;
          continue;
        }
      }

      /** ----- SIDE WALLS ----- */
      if (
        p.hasSideWalls &&
        overlapsY &&
        currBottom > p.top + p.sideWallGap &&
        player.vy >= 0
      ) {
        if (player.x + player.width > p.left && player.x <= p.left) {
          player.x = p.left - player.width;
        }
        if (player.x < p.right && player.x + player.width >= p.right) {
          player.x = p.right;
        }
      }
    }

    /** ----- FALL OFF WORLD ----- */
    if (grounded && player.markSafePosition) player.markSafePosition();
    player.handleFallOffWorld(grounded, currBottom, this.canvas.height);

    /** ----- WORLD HORIZONTAL LIMITS ----- */
    if (player.x < this.left) player.x = this.left;
    if (player.x > this.right - player.width)
      player.x = this.right - player.width;

    // stop slide if horizontal movement was blocked (e.g., wall/edge)
    const movedX = Math.abs(player.x - prevX);
    if (player.isSliding && player.slideBlockGrace <= 0 && movedX < 0.5) {
      player.isSliding = false;
    }
  }

  /** ---------- VALID COIN SPAWN CHECK ---------- */
  coinPositionIsValid(x, y, width = 50, height = 50) {
    return !this.platforms.some((p) => {
      const platformLeft = p.x;
      const platformRight = p.x + p.width;
      const platformTop = p.y;
      const platformBottom = p.y + p.height;
      const overlapsX = x + width > platformLeft && x < platformRight;
      const coinBottom = y + height;
      const coinTop = y;
      const overlapsY = coinBottom > platformTop && coinTop < platformBottom;
      return overlapsX && overlapsY;
    });
  }

  /** ---------- HUD POPUP ---------- */
  addPopup(popup) {
    this.hudPopups.push(popup);
  }

  /* ===========================================================
     BULLET & FX HANDLING
     =========================================================== */

  setHitEffectFrames(frames) {
    this.hitEffectFrames = frames;
  }

  spawnBullet(x, y, direction) {
    this.bullets.push(new Bullet(x, y, direction, this));
  }

  spawnExplosion(x, y) {
    this.explosions.push(new Explosion(x, y));
  }

  spawnHitEffect(x, y, width = 0, height = 0) {
    if (!this.hitEffectFrames?.length) return;
    const headX = x + width / 2;
    const headY = y + height * 0.05; // closer to head height
    this.hitEffects.push(new DizzyEffect(headX, headY, this.hitEffectFrames));
  }

  /** ---------- UPDATE BULLETS & EXPLOSIONS ---------- */
  updateProjectiles(dt, enemies = []) {
    this.bullets = this.bullets.filter((b) => {
      b.update(dt, enemies);
      return !b.remove;
    });

    this.explosions = this.explosions.filter((e) => {
      e.update(dt);
      return !e.finished;
    });
  }

  /** ---------- UPDATE HIT FX ---------- */
  updateHitEffects(dt) {
    this.hitEffects = this.hitEffects.filter((fx) => {
      fx.update(dt);
      return !fx.finished;
    });
  }

  /** ---------- RENDER PROJECTILES & EXPLOSIONS ---------- */
  renderProjectiles(ctx, camera) {
    this.bullets.forEach((b) => b.render(ctx, camera));
    this.explosions.forEach((e) => e.render(ctx, camera));
  }

  /** ---------- RENDER HIT FX ---------- */
  renderHitEffects(ctx, camera) {
    this.hitEffects.forEach((fx) => fx.render(ctx, camera));
  }

  /** ---------- UPDATE & RENDER ENEMIES ---------- */
  updateEnemies(dt, player) {
    this.enemies = this.enemies.filter((e) => {
      e.update(dt, player);
      return !e.remove;
    });
  }

  renderEnemies(ctx, camera) {
    this.enemies.forEach((e) => e.render(ctx, camera));
  }
}
