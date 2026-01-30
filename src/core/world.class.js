import { WORLD_WIDTH } from "../config/config.js";
import { Bullet, Explosion } from "../game/entities/bullet.class.js";
import { DizzyEffect } from "../game/effects/hitEffect.class.js";

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
    const landingSurfaces = this.platforms.filter((platform) => platform.supportsLanding);
    const highestLandingY = Math.max(...landingSurfaces.map((platform) => platform.top));
    if (Number.isFinite(highestLandingY)) this.baseGround = highestLandingY;
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
    const landingEdgePadding = 2;
    const headBumpMaxPadding = 20;
    const headBumpPaddingRatio = 0.2;
    const groundedTolerancePx = 4;
    const slideBlockMovementThreshold = 0.5;

    const wasOnGroundBefore = player.onGround;
    player.onGround = false;
    player.landedOnPlatform = false;
    let isGrounded = false;
    const previousX = player?._preCollisionX ?? player.x;

    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const previousBottom = player.y + player.height - player.velocityY;
    const currentBottom = player.y + player.height;
    const currentTop = player.y;
    const playerBox = player.getHitbox ? player.getHitbox() : player;

    for (const platform of this.platforms) {
      const overlapsY = currentBottom > platform.top && currentTop < platform.bottom;
      const overlapsX =
        playerRight > platform.left && playerLeft < platform.right;
      const overlapsXLanding =
        playerRight > platform.left - landingEdgePadding &&
        playerLeft < platform.right + landingEdgePadding;
      const headBumpPadding = Math.min(
        headBumpMaxPadding,
        Math.max(0, (platform.right - platform.left) * headBumpPaddingRatio)
      );
      const overlapsXHead =
        playerBox.x + playerBox.width > platform.left + headBumpPadding &&
        playerBox.x < platform.right - headBumpPadding;
      const overlapsXSprite =
        playerBox.x + playerBox.width > platform.x &&
        playerBox.x < platform.x + platform.width;

      // LANDING FROM ABOVE
      if (platform.supportsLanding && overlapsY && overlapsXLanding) {
        if (player.velocityY > 0 && previousBottom <= platform.top && currentBottom >= platform.top) {
          player.y = platform.top - player.height;
          player.velocityY = 0;
          player.onGround = true;
          isGrounded = true;
          if (!wasOnGroundBefore) {
            player.justLanded = true;
            player.landedOnPlatform = true;
          }
          continue;
        }

        // Stay grounded while walking on the platform
        if (
          player.velocityY >= 0 &&
          currentBottom >= platform.top &&
          currentBottom <= platform.top + groundedTolerancePx
        ) {
          player.y = platform.top - player.height;
          player.velocityY = 0;
          player.onGround = true;
          isGrounded = true;
          continue;
        }

        // HEAD BUMP
        if (
          player.velocityY < 0 &&
          platform.type !== "middleShort" &&
          (overlapsXHead || overlapsXSprite) &&
          currentTop <= platform.bottom &&
          currentTop - player.velocityY >= platform.bottom
        ) {
          player.y = platform.bottom;
          player.velocityY = 0;
          continue;
        }
      }

      /** ----- SIDE WALLS ----- */
      if (
        platform.hasSideWalls &&
        overlapsY &&
        overlapsX &&
        currentBottom > platform.top + platform.sideWallGap &&
        player.velocityY >= 0
      ) {
        if (player.x + player.width > platform.left && player.x <= platform.left) {
          player.x = platform.left - player.width;
        }
        if (player.x < platform.right && player.x + player.width >= platform.right) {
          player.x = platform.right;
        }
      }
    }

    /** ----- FALL OFF WORLD ----- */
    if (isGrounded && player.markSafePosition) player.markSafePosition();
    player.handleFallOffWorld(isGrounded, currentBottom, this.canvas.height);

    /** ----- WORLD HORIZONTAL LIMITS ----- */
    if (player.x < this.left) player.x = this.left;
    if (player.x > this.right - player.width)
      player.x = this.right - player.width;

    // stop slide if horizontal movement was blocked (e.g., wall/edge)
    const deltaX = Math.abs(player.x - previousX);
    if (player.isSliding && player.slideBlockGrace <= 0 && deltaX < slideBlockMovementThreshold) {
      player.isSliding = false;
    }
  }

  /** ---------- VALID COIN SPAWN CHECK ---------- */
  coinPositionIsValid(
    x,
    y,
    width = 50,
    height = 50,
    existingCoins = [],
    minSpacing = 0
  ) {
    const overlapsPlatform = this.platforms.some((platform) => {
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

    if (overlapsPlatform) return false;

    if (minSpacing > 0 && existingCoins?.length) {
      const candidateCenterX = x + width / 2;
      const candidateCenterY = y + height / 2;
      const minSpacingSquared = minSpacing * minSpacing;
      const tooClose = existingCoins.some((coin) => {
        const otherWidth = coin.width ?? width;
        const otherHeight = coin.height ?? height;
        const otherCenterX = coin.x + otherWidth / 2;
        const otherCenterY = coin.y + otherHeight / 2;
        const deltaX = otherCenterX - candidateCenterX;
        const deltaY = otherCenterY - candidateCenterY;
        return deltaX * deltaX + deltaY * deltaY < minSpacingSquared;
      });
      if (tooClose) return false;
    }

    return true;
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
    const headOffsetYRatio = 0.05;
    const headX = x + width / 2;
    const headY = y + height * headOffsetYRatio;
    this.hitEffects.push(new DizzyEffect(headX, headY, this.hitEffectFrames));
  }

  /** ---------- UPDATE BULLETS & EXPLOSIONS ---------- */
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

  /** ---------- UPDATE HIT EFFECTS ---------- */
  updateHitEffects(dt) {
    this.hitEffects = this.hitEffects.filter((effect) => {
      effect.update(dt);
      return !effect.finished;
    });
  }

  /** ---------- RENDER PROJECTILES & EXPLOSIONS ---------- */
  renderProjectiles(ctx, camera) {
    this.bullets.forEach((bullet) => bullet.render(ctx, camera));
    this.explosions.forEach((explosion) => explosion.render(ctx, camera));
  }

  /** ---------- RENDER HIT EFFECTS ---------- */
  renderHitEffects(ctx, camera) {
    this.hitEffects.forEach((effect) => effect.render(ctx, camera));
  }

  /** ---------- UPDATE & RENDER ENEMIES ---------- */
  updateEnemies(dt, player) {
    this.enemies = this.enemies.filter((enemy) => {
      enemy.update(dt, player);
      return !enemy.remove;
    });
  }

  renderEnemies(ctx, camera) {
    this.enemies.forEach((enemy) => enemy.render(ctx, camera));
  }
}
