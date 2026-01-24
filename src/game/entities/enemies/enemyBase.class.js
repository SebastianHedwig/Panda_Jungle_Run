import { MovableObject } from "../../../engine/physics/movableObject.class.js";
import { HudPopup } from "../../effects/hudPopup.class.js";
import { DEBUG_MODE, FACING_LEFT, FACING_RIGHT } from "../../../config/config.js";

export const DEBUG_ENEMY_HITBOX = DEBUG_MODE;

export class EnemyBase extends MovableObject {
  constructor(x, y, width, height, world = null) {
    super(x, y, width, height);
    this.world = world;

    /** Movement / chase defaults */
    this.patrolDir = FACING_LEFT;
    this.patrolRange = 800;
    this.originX = x;
    this.currentPlatform = null;
    this.lastGroundY = y;
    this.hitStun = 0;
    this.edgeMargin = 5;
    this.isChasing = false;
    this.lastMoveDir = FACING_LEFT;
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
  }

  /** ----- DAMAGE / HITBOX ----- */
  takeDamage(amount = 1, opts = {}) {
    if (this.isDead) return;
    this.health -= amount;

    if (opts?.source === "slide") {
      this.recentSlideHit = Math.max(this.recentSlideHit, 0.4);
    }

    if (this.world?.hudPopups) {
      this.world.hudPopups.push(
        new HudPopup(`-${amount}`, this.x + this.width / 2, this.y - 20, "damage")
      );
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

    if (!opts.skipStun) {
      this.hitStun = Math.max(this.hitStun, 1.5);
      this.velocityX = 0;
      this.velocityY = 0;
      this.setAnimation?.(this.idleFrames);
      this.currentFrame = 0;
      this.frameTime = 0;
    }
  }

  getHitbox() {
    const shrinkX = this.width * 0.55;
    const shrinkY = this.height * 0.2;
    return {
      x: this.x + shrinkX / 2,
      y: this.y + shrinkY,
      width: this.width - shrinkX,
      height: this.height - shrinkY,
    };
  }

  renderHitbox(ctx, camera) {
    const box = this.getHitbox();
    ctx.strokeStyle = "rgba(0,120,255,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      box.x - camera.x,
      box.y - camera.y,
      box.width,
      box.height
    );
  }

  /** ----- PLAYER DELTA / CHASE ----- */
  getPlayerDelta(player) {
    if (!player) return null;
    const ex = this.x + this.width / 2;
    const ey = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dx = px - ex;
    const dy = py - ey;
    return {
      dx,
      dy,
      absDx: Math.abs(dx),
      absDy: Math.abs(dy),
      px,
      py,
      ex,
      ey,
      playerWidth: player.width,
    };
  }

  shouldChasePlayer(playerInfo, wasChasing = false) {
    if (!playerInfo) return false;
    const horizGap = playerInfo.absDx;
    const maxX = wasChasing ? this.chaseRangeXExit : this.chaseRangeX;
    const maxY = wasChasing ? this.chaseRangeYExit : this.chaseRangeY;
    return horizGap <= maxX && playerInfo.absDy <= maxY;
  }

  /** ----- PATROL ----- */
  patrol() {
    const minX = this.originX - this.patrolRange / 2;
    const maxX = this.originX + this.patrolRange / 2;

    if (this.x <= minX) {
      this.patrolDir = 1;
    } else if (this.x >= maxX) {
      this.patrolDir = -1;
    }

    this.facing = this.patrolDir;
  }

  /** ----- PLATFORM HELPERS ----- */
  isOnLowestPlatform() {
    if (!this.currentPlatform || !this.world?.platforms?.length) return false;
    const lowestTop = this.world.platforms.reduce((max, p) => {
      if (!p.supportsLanding) return max;
      return Math.max(max, p.top);
    }, -Infinity);
    if (!Number.isFinite(lowestTop)) return false;
    return this.currentPlatform.top >= lowestTop - 0.5;
  }

  getPlatformUnderfoot() {
    if (!this.world?.platforms?.length) return null;
    const footX = this.x + this.width / 2;
    const footY = this.y + this.height + 2;
    return this.world.platforms.find(
      (p) =>
        p.supportsLanding &&
        footX >= p.left &&
        footX <= p.right &&
        footY >= p.top &&
        footY <= p.bottom + 5
    );
  }

  findPlatformBelow(x, currentTop) {
    if (!this.world?.platforms?.length) return null;
    let best = null;
    for (const p of this.world.platforms) {
      if (!p.supportsLanding) continue;
      if (x < p.left || x > p.right) continue;
      if (p.top <= currentTop) continue;
      if (!best || p.top < best.top) best = p;
    }
    return best;
  }

  hasAdjacentPlatform(currentPlatform, moveDir, footX) {
    if (!this.world?.platforms?.length) return false;
    const toleranceY = Math.max(4, this.edgeMargin);
    const boundary = moveDir > 0 ? currentPlatform.right : currentPlatform.left;
    const lookStart = boundary - this.edgeMargin;
    const lookEnd = boundary + this.edgeMargin * 3 * moveDir;
    const minX = Math.min(lookStart, lookEnd, footX - this.edgeMargin);
    const maxX = Math.max(lookStart, lookEnd, footX + this.edgeMargin);
    return this.world.platforms.some(
      (p) =>
        p !== currentPlatform &&
        p.supportsLanding &&
        Math.abs(p.top - currentPlatform.top) <= toleranceY &&
        p.right >= minX &&
        p.left <= maxX
    );
  }

  handlePlatformLanding(prevBottom, currBottom) {
    if (!this.world?.platforms?.length) return;
    const footX = this.x + this.width / 2;

    for (const p of this.world.platforms) {
      if (!p.supportsLanding) continue;
      const overlapsX = this.x + this.width > p.left && this.x < p.right;

      if (
        overlapsX &&
        this.velocityY > 0 &&
        prevBottom <= p.top &&
        currBottom >= p.top
      ) {
        this.y = p.top - this.height;
        this.velocityY = 0;
        this.onGround = true;
        this.currentPlatform = p;
        this.lastGroundY = this.y;
        return;
      }
    }

    this.onGround = false;
    const canvasH = this.world?.canvas?.height ?? 1000;
    if (currBottom > canvasH + this.height) {
      this.y = this.lastGroundY;
      this.velocityY = 0;
      this.onGround = true;
    }
  }

  applyAttackPhysics(dt) {
    const prevBottom = this.y + this.height;
    this.applyApexGravity(dt);
    const currBottom = this.y + this.height;
    this.handlePlatformLanding(prevBottom, currBottom);
  }

  /** ----- EDGE / DROP HANDLING ----- */
  adjustForEdges(moveDir, dt, platform, onLowestPlatform, prevChasing) {
    const platformBelow = this.findPlatformBelow(
      this.x + this.width / 2,
      platform.top
    );
    const currFootX = this.x + this.width / 2;
    const nextX = this.x + moveDir * this.speed * dt;
    const footX = nextX + this.width / 2;
    const beyondEdge =
      footX < platform.left + this.edgeMargin ||
      footX > platform.right - this.edgeMargin;
    const returningInside =
      (currFootX >= platform.right - this.edgeMargin && moveDir <= 0) ||
      (currFootX <= platform.left + this.edgeMargin && moveDir >= 0);
    const allowDrop = this.isChasing && !onLowestPlatform && !!platformBelow;
    const hasAdjacentFloor =
      onLowestPlatform && this.hasAdjacentPlatform(platform, moveDir, footX);

    if (beyondEdge && !returningInside && !allowDrop && !hasAdjacentFloor) {
      this.patrolDir = moveDir > 0 ? -1 : 1;
      this.isChasing = false;
      if (prevChasing) {
        this.chaseCooldown = Math.max(
          this.chaseCooldown,
          this.chaseCooldownDuration
        );
      }
      moveDir = this.patrolDir;
      this.facing = moveDir;
    }

    return moveDir;
  }

  /** ----- ATTACK HANDLERS (DEFAULT) ----- */
  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const dx = playerInfo.dx;
    const dy = playerInfo.absDy;
    if (
      Math.abs(dx) <= this.attackRange &&
      dy <= this.attackHeightTolerance
    ) {
      const frames = this.attackFrames;
      if (frames) {
        this.startMeleeAttack(dx, frames, this.damage, player);
        return true;
      }
    }
    return false;
  }

  startMeleeAttack(dx, frames, damage, player, moveSpeed = 0) {
    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.hasHitDuringAttack = false;
    this.attackDamageCurrent = damage;
    this.attackMoveSpeed = moveSpeed || 0;
    this.activeAttackFrames = frames || this.attackFrames;
    this.facing = dx >= 0 ? FACING_RIGHT : FACING_LEFT;
    this.velocityX = 0;
    this.setAnimation?.(this.activeAttackFrames);
    this.tryDealAttackDamage?.(player, 0.2);
  }
}
