import { MovableObject } from "../../../engine/physics/movableObject.class.js";
import { HudPopup } from "../../effects/hudPopup.class.js";
import {
  DEBUG_MODE,
  FACING_LEFT,
  FACING_RIGHT,
} from "../../../config/config.js";
import { CollectableItem } from "../../items/collectableItem.class.js";

export const DEBUG_ENEMY_HITBOX = DEBUG_MODE;

export class EnemyBase extends MovableObject {
  constructor(x, y, width, height, world = null) {
    super(x, y, width, height);
    this.world = world;

    /** Movement / chase defaults */
    this.patrolDirection = FACING_LEFT;
    this.patrolRange = 800;
    this.spawnX = x;
    this.currentPlatform = null;
    this.lastGroundY = y;
    this.hitStun = 0;
    this.edgeMargin = 5;
    this.isChasing = false;
    this.lastMoveDirection = FACING_LEFT;
    this.chaseCooldown = 0;
    this.chaseCooldownDuration = 2;
    this.chaseRangeX = 300;
    this.chaseRangeXExit = 360;
    this.chaseRangeY = 200;
    this.chaseRangeYExit = 260;

    /** Combat helpers */
    this.hasHitDuringAttack = false;
    this.recentSlideHit = 0;
    this.attackDamageCurrent = this.damage ?? 1;
    this.attackMoveSpeed = 0;
    this.hitboxShrinkXFactor = 0.55;
    this.hitboxShrinkYFactor = 0.2;
  }

  /** ----- DAMAGE / HITBOX ----- */
  takeDamage(amount = 1, hitContext = {}) {
    const recentSlideHitDuration = 0.4;
    const hitStunMinDuration = 1.5;

    if (this.isDead) return;
    this.health -= amount;

    if (hitContext?.source === "slide") {
      this.recentSlideHit = Math.max(this.recentSlideHit, recentSlideHitDuration);
    }

    if (this.world?.hudPopups) {
      const popupX = this.x + this.width * 0.5;
      const popupY = this.y - 20;
      this.world.hudPopups.push(new HudPopup(`-${amount}`, popupX, popupY, "damage"));
    }

    if (this.health <= 0) {
      this.isDead = true;
      this.setAnimation?.(this.dieFrames);
      this.currentFrame = 0;
      this.frameTime = 0;
      this.velocityX = 0;
      this.velocityY = 0;
      this.deathTimer = 5;
      this.blinkTimer = 0.9; // 3 blinks at 0.3s
      this.onDeath?.();
      return;
    }

    if (!hitContext.skipStun) {
      this.hitStun = Math.max(this.hitStun, hitStunMinDuration);
      this.velocityX = 0;
      this.velocityY = 0;
      this.setAnimation?.(this.idleFrames);
      this.currentFrame = 0;
      this.frameTime = 0;
    }
  }

  getHitbox() {
    const { x, y, width: enemyWidth, height: enemyHeight } = this;
    const hitboxWidth = enemyWidth * (1 - this.hitboxShrinkXFactor);
    const hitboxHeight = enemyHeight * (1 - this.hitboxShrinkYFactor);
    const hitboxX = x + (enemyWidth - hitboxWidth) / 2;
    const hitboxY = y + (enemyHeight - hitboxHeight);
    return {
      x: hitboxX,
      y: hitboxY,
      width: hitboxWidth,
      height: hitboxHeight,
    };
  }

  renderHitbox(ctx, camera) {
    const hitbox = this.getHitbox();
    ctx.strokeStyle = "rgba(0,120,255,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      hitbox.x - camera.x,
      hitbox.y - camera.y,
      hitbox.width,
      hitbox.height
    );
  }

  /** ----- PLAYER DELTA / CHASE ----- */
  getPlayerDelta(player) {
    if (!player) return null;
    const enemyCenterX = this.x + this.width / 2;
    const enemyCenterY = this.y + this.height / 2;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const deltaX = playerCenterX - enemyCenterX;
    const deltaY = playerCenterY - enemyCenterY;
    return {
      deltaX,
      deltaY,
      absoluteDeltaX: Math.abs(deltaX),
      absoluteDeltaY: Math.abs(deltaY),
      playerCenterX,
      playerCenterY,
      enemyCenterX,
      enemyCenterY,
      playerWidth: player.width,
    };
  }

  shouldChasePlayer(playerInfo, wasChasing = false) {
    if (!playerInfo) return false;
    const horizGap = playerInfo.absoluteDeltaX;
    const maxX = wasChasing ? this.chaseRangeXExit : this.chaseRangeX;
    const maxY = wasChasing ? this.chaseRangeYExit : this.chaseRangeY;
    return horizGap <= maxX && playerInfo.absoluteDeltaY <= maxY;
  }

  /** ----- PATROL ----- */
  patrol() {
    const minX = this.spawnX - this.patrolRange / 2;
    const maxX = this.spawnX + this.patrolRange / 2;

    if (this.x <= minX) {
      this.patrolDirection = FACING_RIGHT;
    } else if (this.x >= maxX) {
      this.patrolDirection = FACING_LEFT;
    }

    this.facing = this.patrolDirection;
  }

  /** ----- PLATFORM HELPERS ----- */
  isOnLowestPlatform() {
    const platformLevelTolerance = 0.5;
    if (!this.currentPlatform || !this.world?.platforms?.length) return false;
    const lowestTop = this.world.platforms.reduce((max, platform) => {
      if (!platform.supportsLanding) return max;
      return Math.max(max, platform.top);
    }, -Infinity);
    if (!Number.isFinite(lowestTop)) return false;
    return this.currentPlatform.top >= lowestTop - platformLevelTolerance;
  }

  getPlatformUnderfoot() {
    const footProbeOffset = 2;
    const platformBottomTolerance = 5;

    if (!this.world?.platforms?.length) return null;
    const footX = this.x + this.width / 2;
    const footY = this.y + this.height + footProbeOffset;
    return this.world.platforms.find(
      (platform) =>
        platform.supportsLanding &&
        footX >= platform.left &&
        footX <= platform.right &&
        footY >= platform.top &&
        footY <= platform.bottom + platformBottomTolerance
    );
  }

  findPlatformBelowAt(footX, currentTop) {
    if (!this.world?.platforms?.length) return null;
    let nearestPlatformBelow = null;
    for (const platform of this.world.platforms) {
      if (!platform.supportsLanding) continue;
      if (footX < platform.left || footX > platform.right) continue;
      if (platform.top <= currentTop) continue;
      if (!nearestPlatformBelow || platform.top < nearestPlatformBelow.top) {
        nearestPlatformBelow = platform;
      }
    }
    return nearestPlatformBelow;
  }

  hasAdjacentPlatform(currentPlatform, moveDirection, footX) {
    const adjacentPlatformLookaheadFactor = 3;
    const minAdjacentPlatformToleranceY = 4;

    if (!this.world?.platforms?.length) return false;
    const toleranceY = Math.max(minAdjacentPlatformToleranceY, this.edgeMargin);
    const boundary =
      moveDirection > 0 ? currentPlatform.right : currentPlatform.left;
    const lookStart = boundary - this.edgeMargin;
    const lookEnd =
      boundary + this.edgeMargin * adjacentPlatformLookaheadFactor * moveDirection;
    const minX = Math.min(lookStart, lookEnd, footX - this.edgeMargin);
    const maxX = Math.max(lookStart, lookEnd, footX + this.edgeMargin);
    return this.world.platforms.some(
      (platform) =>
        platform !== currentPlatform &&
        platform.supportsLanding &&
        Math.abs(platform.top - currentPlatform.top) <= toleranceY &&
        platform.right >= minX &&
        platform.left <= maxX
    );
  }

  handlePlatformLanding(previousBottom, currentBottom) {
    if (!this.world?.platforms?.length) return;
    const footX = this.x + this.width / 2;

    for (const platform of this.world.platforms) {
      if (!platform.supportsLanding) continue;
      const overlapsX = this.x + this.width > platform.left && this.x < platform.right;

      if (
        overlapsX &&
        this.velocityY > 0 &&
        previousBottom <= platform.top &&
        currentBottom >= platform.top
      ) {
        this.y = platform.top - this.height;
        this.velocityY = 0;
        this.onGround = true;
        this.currentPlatform = platform;
        this.lastGroundY = this.y;
        return;
      }
    }

    this.onGround = false;
    const canvasH = this.world?.canvas?.height;
    if (currentBottom > canvasH + this.height) {
      this.y = this.lastGroundY;
      this.velocityY = 0;
      this.onGround = true;
    }
  }

  applyAttackPhysics(dt) {
    const previousBottom = this.y + this.height;
    this.applyApexGravity(dt);
    const currentBottom = this.y + this.height;
    this.handlePlatformLanding(previousBottom, currentBottom);
  }

  /** ----- EDGE / DROP HANDLING ----- */
  adjustForEdges(moveDirection, dt, platform, onLowestPlatform, fromChasing) {
    const platformBelow = this.findPlatformBelowAt(
      this.x + this.width / 2,
      platform.top
    );
    const currentFootX = this.x + this.width / 2;
    const nextX = this.x + moveDirection * this.speed * dt;
    const footX = nextX + this.width / 2;
    const beyondEdge =
      footX < platform.left + this.edgeMargin ||
      footX > platform.right - this.edgeMargin;
    const returningInside =
      (currentFootX >= platform.right - this.edgeMargin && moveDirection <= 0) ||
      (currentFootX <= platform.left + this.edgeMargin && moveDirection >= 0);
    const allowDrop = this.isChasing && !onLowestPlatform && !!platformBelow;
    const hasAdjacentFloor =
      onLowestPlatform &&
      this.hasAdjacentPlatform(platform, moveDirection, footX);

    if (beyondEdge && !returningInside && !allowDrop && !hasAdjacentFloor) {
      this.patrolDirection = moveDirection > 0 ? FACING_LEFT : FACING_RIGHT;
      this.isChasing = false;
      if (fromChasing) {
        this.chaseCooldown = Math.max(
          this.chaseCooldown,
          this.chaseCooldownDuration
        );
      }
      moveDirection = this.patrolDirection;
      this.facing = moveDirection;
    }

    return moveDirection;
  }

  /** ----- ATTACK HANDLERS (DEFAULT) ----- */
  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const deltaX = playerInfo.deltaX;
    const absoluteDeltaY = playerInfo.absoluteDeltaY;
    if (
      Math.abs(deltaX) <= this.attackRange &&
      absoluteDeltaY <= this.attackHeightTolerance
    ) {
      const frames = this.attackFrames;
      if (frames) {
        this.startMeleeAttack(deltaX, frames, this.damage, player);
        return true;
      }
    }
    return false;
  }

  startMeleeAttack(deltaX, frames, damage, player, moveSpeed = 0) {
    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.hasHitDuringAttack = false;
    this.attackDamageCurrent = damage;
    this.attackMoveSpeed = moveSpeed || 0;
    this.activeAttackFrames = frames || this.attackFrames;
    this.facing = deltaX >= 0 ? FACING_RIGHT : FACING_LEFT;
    this.velocityX = 0;
    this.setAnimation?.(this.activeAttackFrames);
    const attackPopupDelay = 0.2;
    this.tryDealAttackDamage?.(player, attackPopupDelay);
  }

  dropCollectables(itemType, count = 0) {
    if (!this.world?.collectables || count <= 0) return;

    const spawnOffsetYFactor = 0.2;
    const baseRadius = 30;
    const radiusScattering = 20;
    const minAngle = Math.PI / 3; // 60°
    const angleRange = Math.PI / 6; // up to 90°
    const baseSpeedX = 120;
    const speedXScattering = 60;
    const baseSpeedY = 400;
    const speedYScattering = 150;

    const drops = [];
    const baseX = this.x + this.width / 2;
    const baseY = this.y + this.height * spawnOffsetYFactor;
    for (let dropIndex = 0; dropIndex < count; dropIndex++) {
      const isEvenDropIndex = dropIndex % 2 === 0; // drop left/right alternation
      const dropDirection = isEvenDropIndex ? FACING_LEFT : FACING_RIGHT;
      const radius = baseRadius + Math.random() * radiusScattering;
      const angle = minAngle + Math.random() * angleRange;
      const dropX = baseX + dropDirection * radius * Math.cos(angle);
      const dropY = baseY - radius * Math.sin(angle);
      const velocityX = dropDirection * (baseSpeedX + Math.random() * speedXScattering);
      const velocityY = -(baseSpeedY + Math.random() * speedYScattering);
      const item = new CollectableItem(dropX, dropY, itemType, this.world);
      item.startDrop(velocityX, velocityY);
      drops.push(item);
    }

    this.world.addCollectables
      ? this.world.addCollectables(drops)
      : this.world.collectables.push(...drops);
  }

  dropCoins(count = 0) {
    this.dropCollectables("coin", count);
  }

  collidesWith(target) {
    const selfBox = this.getHitbox();
    const targetBox = target.getHitbox ? target.getHitbox() : target;
    return (
      selfBox.x < targetBox.x + targetBox.width &&
      selfBox.x + selfBox.width > targetBox.x &&
      selfBox.y < targetBox.y + targetBox.height &&
      selfBox.y + selfBox.height > targetBox.y
    );
  }
}
