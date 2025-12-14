import { MovableObject } from "./movableObject.class.js";
import { HudPopup } from "./hudPopup.class.js";

export class EnemyBase extends MovableObject {
  constructor(x, y, width, height, world = null) {
    super(x, y, width, height);
    this.world = world;

    /** Movement / chase defaults */
    this.patrolDir = -1;
    this.patrolRange = 800;
    this.originX = x;
    this.currentPlatform = null;
    this.lastGroundY = y;
    this.hitStun = 0;
    this.edgeMargin = 5;
    this.isChasing = false;
    this.lastMoveDir = -1;
    this.chaseCooldown = 0;
    this.chaseCooldownDuration = 2;
    this.chaseRangeX = 300;
    this.chaseRangeXExit = 360;
    this.chaseRangeY = 200;
    this.chaseRangeYExit = 260;

    /** Combat helpers */
    this.hasHitDuringAttack = false;
    this.hasShownMissDuringAttack = false;
    this.recentSlideHit = 0;
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
      this.vx = 0;
      this.vy = 0;
      this.deathTimer = 5;
      this.blinkTimer = 0.9; // 3 blinks à 0.3s
      return;
    }

    if (!opts.skipStun) {
      this.hitStun = Math.max(this.hitStun, 1.5);
      this.vx = 0;
      this.vy = 0;
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
        this.vy > 0 &&
        prevBottom <= p.top &&
        currBottom >= p.top
      ) {
        this.y = p.top - this.height;
        this.vy = 0;
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
      this.vy = 0;
      this.onGround = true;
    }
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
}
