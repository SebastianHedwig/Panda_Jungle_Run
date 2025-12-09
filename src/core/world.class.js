import { WORLD_WIDTH } from "../config.js";
import { Bullet, Explosion } from "./bullet.class.js";

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

  /** ---------- PLATFORM COLLISION LOGIC ---------- */
  applyPlatformCollisions(player) {
    let grounded = false;

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
  }

  /** ---------- VALID COIN SPAWN CHECK ---------- */
  coinPositionIsValid(x, y, width = 50, height = 50) {
    return !this.platforms.some((p) => {
      const overlapsX = x + width > p.left && x < p.right;
      const coinBottom = y + height;
      const coinTop = y;
      const platformTop = p.top;
      const platformBottom = p.bottom;
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

  spawnBullet(x, y, direction) {
    this.bullets.push(new Bullet(x, y, direction, this));
  }

  spawnExplosion(x, y) {
    this.explosions.push(new Explosion(x, y));
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

  /** ---------- RENDER PROJECTILES & EXPLOSIONS ---------- */
  renderProjectiles(ctx, camera) {
    this.bullets.forEach((b) => b.render(ctx, camera));
    this.explosions.forEach((e) => e.render(ctx, camera));
  }
}
