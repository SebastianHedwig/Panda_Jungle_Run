import { WORLD_WIDTH } from "../config/config.js";
import { Bullet, Explosion } from "../game/entities/bullet.class.js";
import { DizzyEffect } from "../game/effects/hitEffect.class.js";

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.setupWorldBounds();
    this.setupLevelObjects();
    this.setupProjectiles();
  }

  setupWorldBounds() {
    this.width = WORLD_WIDTH;
    this.left = 0;
    this.right = this.width;
    this.baseGround = this.canvas.height;
  }

  setupLevelObjects() {
    this.platforms = [];
    this.collectables = [];
    this.hudPopups = [];
    this.enemies = [];
    this.hitEffects = [];
    this.hitEffectFrames = null;
  }

  setupProjectiles() {
    this.bullets = [];
    this.explosions = [];
  }

  addPlatforms(platforms) {
    this.platforms.push(...platforms);
    const landingSurfaces = this.platforms.filter((platform) => platform.supportsLanding);
    const highestLandingY = Math.max(...landingSurfaces.map((platform) => platform.top));
    if (Number.isFinite(highestLandingY)) this.baseGround = highestLandingY;
  }

  addCollectables(items) {
    this.collectables.push(...items);
  }

  addEnemies(enemies) {
    this.enemies.push(...enemies);
  }

  applyPlatformCollisions(player) {
    if (this.shouldSkipCollision(player)) return;
    const collisionState = this.getCollisionState(player);
    for (const platform of this.platforms) {
      const overlaps = this.getPlatformOverlapState(platform, collisionState);
      if (this.applyLandingCollision(platform, player, collisionState, overlaps)) continue;
      this.applySideWallCollision(platform, player, collisionState, overlaps);
    }
    this.applyPostCollisionEffects(player, collisionState);
  }

  shouldSkipCollision(player) {
    return player?.isDead || player?.collisionDisabled;
  }

  getCollisionConfig() {
    return {
      landingEdgePadding: 2,
      headBumpMaxPadding: 20,
      headBumpPaddingRatio: 0.2,
      groundedTolerancePx: 4,
      slideBlockMovementThreshold: 0.5,
    };
  }

  getPlayerCollisionMetrics(player) {
    const wasOnGroundBefore = player.onGround;
    const previousX = player?._preCollisionX ?? player.x;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const previousBottom = player.y + player.height - player.velocityY;
    const currentBottom = player.y + player.height;
    const currentTop = player.y;
    const playerBox = player.getHitbox ? player.getHitbox() : player;
    return { wasOnGroundBefore, previousX, playerLeft, playerRight, previousBottom, currentBottom, currentTop, playerBox };
  }

  resetPlayerGroundState(player) {
    player.onGround = false;
    player.landedOnPlatform = false;
  }

  getCollisionState(player) {
    const collisionConfig = this.getCollisionConfig();
    const playerMetrics = this.getPlayerCollisionMetrics(player);
    this.resetPlayerGroundState(player);
    return { ...collisionConfig, ...playerMetrics, isGrounded: false };
  }

  getPlatformOverlapState(platform, collisionState) {
    const overlapsY = collisionState.currentBottom > platform.top && collisionState.currentTop < platform.bottom;
    const overlapsX = collisionState.playerRight > platform.left && collisionState.playerLeft < platform.right;
    const overlapsXLanding = collisionState.playerRight > platform.left - collisionState.landingEdgePadding && collisionState.playerLeft < platform.right + collisionState.landingEdgePadding;
    const headBumpPadding = Math.min(collisionState.headBumpMaxPadding, Math.max(0, (platform.right - platform.left) * collisionState.headBumpPaddingRatio));
    const overlapsXHead = collisionState.playerBox.x + collisionState.playerBox.width > platform.left + headBumpPadding && collisionState.playerBox.x < platform.right - headBumpPadding;
    const overlapsXSprite = collisionState.playerBox.x + collisionState.playerBox.width > platform.x && collisionState.playerBox.x < platform.x + platform.width;
    return { overlapsY, overlapsX, overlapsXLanding, overlapsXHead, overlapsXSprite };
  }

  applyLandingCollision(platform, player, collisionState, overlaps) {
    if (!platform.supportsLanding || !overlaps.overlapsY || !overlaps.overlapsXLanding) return false;
    if (this.applyLandingFromAbove(player, platform, collisionState)) return true;
    if (this.applyStayGrounded(player, platform, collisionState)) return true;
    if (this.applyHeadBump(player, platform, collisionState, overlaps)) return true;
    return false;
  }

  applyLandingFromAbove(player, platform, collisionState) {
    if (player.velocityY <= 0 || collisionState.previousBottom > platform.top || collisionState.currentBottom < platform.top) return false;
    player.y = platform.top - player.height;
    player.velocityY = 0;
    player.onGround = true;
    collisionState.isGrounded = true;
    if (!collisionState.wasOnGroundBefore) {
      player.justLanded = true;
      player.landedOnPlatform = true;
    }
    return true;
  }

  applyStayGrounded(player, platform, collisionState) {
    if (player.velocityY < 0) return false;
    if (
      collisionState.currentBottom < platform.top || collisionState.currentBottom > platform.top + collisionState.groundedTolerancePx
    ) return false;
    player.y = platform.top - player.height;
    player.velocityY = 0;
    player.onGround = true;
    collisionState.isGrounded = true;
    return true;
  }

  applyHeadBump(player, platform, collisionState, overlaps) {
    if (player.velocityY >= 0) return false;
    if (platform.type === "middleShort") return false;
    if (!overlaps.overlapsXHead && !overlaps.overlapsXSprite) return false;
    if (
      collisionState.currentTop > platform.bottom || collisionState.currentTop - player.velocityY < platform.bottom
    ) return false;
    player.y = platform.bottom;
    player.velocityY = 0;
    return true;
  }

  applySideWallCollision(platform, player, collisionState, overlaps) {
    if (!platform.hasSideWalls || !overlaps.overlapsY || !overlaps.overlapsX) return;
    if (collisionState.currentBottom <= platform.top + platform.sideWallGap) return;
    if (player.velocityY < 0) return;
    if (player.x + player.width > platform.left && player.x <= platform.left) {
      player.x = platform.left - player.width;
    }
    if (player.x < platform.right && player.x + player.width >= platform.right) {
      player.x = platform.right;
    }
  }

  applyPostCollisionEffects(player, collisionState) {
    if (collisionState.isGrounded && player.markSafePosition)
      player.markSafePosition();
      player.handleFallOffWorld(collisionState.isGrounded, collisionState.currentBottom, this.canvas.height);
      this.applyHorizontalLimits(player);
      this.stopSlideIfBlocked(player, collisionState.previousX, collisionState.slideBlockMovementThreshold);
  }

  applyHorizontalLimits(player) {
    if (player.x < this.left) player.x = this.left;
    if (player.x > this.right - player.width) player.x = this.right - player.width;
  }

  stopSlideIfBlocked(player, previousX, slideBlockMovementThreshold) {
    const deltaX = Math.abs(player.x - previousX);
    if (player.isSliding && player.slideBlockGrace <= 0 && deltaX < slideBlockMovementThreshold) {
      player.isSliding = false;
    }
  }

  coinPositionIsValid(x, y, width = 50, height = 50, existingCoins = [], minSpacing = 0) {
    if (this.hasPlatformOverlap(x, y, width, height)) return false;
    if (this.isTooCloseToCoins(x, y, width, height, existingCoins, minSpacing)) return false;
    return true;
  }

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

  addPopup(popup) {
    this.hudPopups.push(popup);
  }

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

  updateHitEffects(dt) {
    this.hitEffects = this.hitEffects.filter((effect) => {
      effect.update(dt);
      return !effect.finished;
    });
  }

  renderProjectiles(ctx, camera) {
    this.bullets.forEach((bullet) => bullet.render(ctx, camera));
    this.explosions.forEach((explosion) => explosion.render(ctx, camera));
  }

  renderHitEffects(ctx, camera) {
    this.hitEffects.forEach((effect) => effect.render(ctx, camera));
  }

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
