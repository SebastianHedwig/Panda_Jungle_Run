import { MovableObject } from "./movableObject.class.js";
import { HudPopup } from "./hudPopup.class.js";

const DEBUG_HITBOX = false;

export function loadEnemy1Sprites() {
  const base = "assets/img/enemies/Enemy_Sprites/Character-1/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 10),
    attack: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

export class Enemy1 extends MovableObject {
  constructor(x, y, sprites, world = null) {
    super(x, y, 110, 110);

    this.world = world;

    this.idleFrames = sprites.idle;
    this.walkFrames = sprites.walk;
    this.attackFrames = sprites.attack;
    this.dieFrames = sprites.die;

    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.09;
    this.sprite = this.currentAnimation[0];

    this.speed = 80;
    this.health = 3;
    this.damage = 1;
    this.isDead = false;
    this.remove = false;
    this.deathDone = false;
    this.deathTimer = 0;
    this.blinkTimer = 0;
    this.isAttacking = false;
    this.attackDuration = 0.6;
    this.attackTimer = 0;

    this.patrolDir = -1;
    this.patrolRange = 800;
    this.originX = x;
    this.currentPlatform = null;
    this.lastGroundY = y;
    this.hitStun = 0;
    this.hasHitDuringAttack = false;
    this.hasShownMissDuringAttack = false;
    this.recentSlideHit = 0;
    this.attackRange = 60;
    this.attackHeightTolerance = 20;
    this.chaseRangeX = 300;
    this.chaseRangeXExit = 360;
    this.chaseRangeY = 200;
    this.chaseRangeYExit = 260;
    this.edgeMargin = 5;
    this.isChasing = false;
    this.lastMoveDir = -1;
    this.chaseCooldown = 0;
  }
  
  setAnimation(frames) {
    if (!frames || this.currentAnimation === frames) return;
    this.currentAnimation = frames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.sprite = this.currentAnimation[0];
  }

  animate(dt) {
    this.frameTime += dt;
    if (this.frameTime >= this.frameSpeed) {
      this.frameTime = 0;
      this.currentFrame =
        (this.currentFrame + 1) % this.currentAnimation.length;
      this.sprite = this.currentAnimation[this.currentFrame];
    }
  }

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
      this.setAnimation(this.dieFrames);
      this.currentFrame = 0;
      this.frameTime = 0;
      this.vx = 0;
      this.vy = 0;
      this.deathTimer = 5;
      this.blinkTimer = 0.9; // 3 blinks á 0.3s
      return;
    }

    if (!opts.skipStun) {
      this.hitStun = Math.max(this.hitStun, 1.5);
      this.vx = 0;
      this.vy = 0;
      this.setAnimation(this.idleFrames);
      this.currentFrame = 0;
      this.frameTime = 0;
    }
  }

  update(dt, player) {
    if (this.isDead) {
      this.isChasing = false;
      if (!this.deathDone) {
        this.frameTime += dt;
        if (this.frameTime >= this.frameSpeed) {
          this.frameTime = 0;
          this.currentFrame = Math.min(
            this.currentFrame + 1,
            this.currentAnimation.length - 1
          );
          this.sprite = this.currentAnimation[this.currentFrame];
          if (this.currentFrame === this.currentAnimation.length - 1) {
            this.deathDone = true;
          }
        }
      }

      if (this.deathTimer > 0) {
        this.deathTimer = Math.max(0, this.deathTimer - dt);
      } else if (this.blinkTimer > 0) {
        this.blinkTimer = Math.max(0, this.blinkTimer - dt);
      } else {
        this.remove = true;
      }

      return;
    }

    if (this.recentSlideHit > 0) {
      this.recentSlideHit = Math.max(0, this.recentSlideHit - dt);
    }
    if (this.chaseCooldown > 0) {
      this.chaseCooldown = Math.max(0, this.chaseCooldown - dt);
    }

    if (this.hitStun > 0) {
      this.hitStun = Math.max(0, this.hitStun - dt);
      this.isChasing = false;
      // freeze on first idle frame (no animation) for clear feedback
      this.setAnimation(this.idleFrames);
      this.currentFrame = 0;
      this.sprite = this.idleFrames[0];
      return;
    }

    const playerInfo = this.getPlayerDelta(player);

    // ATTACK HANDLING
    if (this.isAttacking) {
      this.attackTimer -= dt;
      this.setAnimation(this.attackFrames);
      this.animate(dt);

      this.tryDealAttackDamage(player, 0.2);

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.hasHitDuringAttack = false;
        this.hasShownMissDuringAttack = false;
      }

      this.isChasing = false;
      return;
    }

    // START ATTACK if player in range - NOCHMAL DRUEBER SCHAUEN
    if (playerInfo && player && !player.isDead) {
      const dx = playerInfo.dx;
      const dy = playerInfo.absDy;
      if (Math.abs(dx) <= this.attackRange && dy <= this.attackHeightTolerance) {
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        this.hasHitDuringAttack = false;
        this.hasShownMissDuringAttack = false;
        this.facing = dx >= 0 ? 1 : -1;
        this.vx = 0;
        this.setAnimation(this.attackFrames);
        this.tryDealAttackDamage(player, 0.2);
        return;
      }
    }

    const platform = this.getPlatformUnderfoot();
    this.currentPlatform = platform || null;
    const onLowestPlatform = this.isOnLowestPlatform();
    const prevChasing = this.isChasing;
    const canChase =
      this.chaseCooldown <= 0 && this.shouldChasePlayer(playerInfo, prevChasing);
    const enemyCenterX = this.x + this.width / 2;
    const blockedByEdge =
      canChase &&
      onLowestPlatform &&
      platform &&
      ((playerInfo.dx < 0 && enemyCenterX <= platform.left + this.edgeMargin) ||
        (playerInfo.dx > 0 && enemyCenterX >= platform.right - this.edgeMargin));

    this.isChasing = canChase && !blockedByEdge;

    let moveDir = this.lastMoveDir;
    if (this.isChasing) {
      const dx = playerInfo?.dx ?? 0;
      const targetDir =
        Math.abs(dx) < 1
          ? this.lastMoveDir || this.facing || 1
          : Math.sign(dx) || 1;
      this.facing = targetDir;
      moveDir = targetDir;
    } else {
      this.patrol();
      moveDir = this.patrolDir;
    }

    if (platform) {
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
        onLowestPlatform &&
        this.hasAdjacentPlatform(platform, moveDir, footX);

      if (beyondEdge && !returningInside && !allowDrop && !hasAdjacentFloor) {
        this.patrolDir = moveDir > 0 ? -1 : 1;
        this.isChasing = false;
        if (prevChasing) this.chaseCooldown = Math.max(this.chaseCooldown, 2);
        moveDir = this.patrolDir;
        this.facing = moveDir;
      }
    }

    this.x += moveDir * this.speed * dt;
    this.lastMoveDir = moveDir;

    const prevBottom = this.y + this.height;
    this.applyApexGravity(dt);
    const currBottom = this.y + this.height;
    this.handlePlatformLanding(prevBottom, currBottom);

    if (player && !player.isDead && !player.isSliding && this.collidesWith(player) && player.invulnerableTimer <= 0) {
      player.takeDamage?.(this.damage, { useDizzy: false });
      if (typeof player.invulnerableTimer === "number") {
        player.invulnerableTimer = Math.max(player.invulnerableTimer, 2);
      }
    }

    this.setAnimation(this.walkFrames);
    this.animate(dt);
  }

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
    return (
      horizGap <= maxX &&
      playerInfo.absDy <= maxY
    );
  }

  collidesWith(obj) {
    const selfBox = this.getHitbox();
    const targetBox = obj.getHitbox ? obj.getHitbox() : obj;
    return (
      selfBox.x < targetBox.x + targetBox.width &&
      selfBox.x + selfBox.width > targetBox.x &&
      selfBox.y < targetBox.y + targetBox.height &&
      selfBox.y + selfBox.height > targetBox.y
    );
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

  isOnLowestPlatform() {
    if (!this.currentPlatform || !this.world?.platforms?.length) return false;
    const lowestTop = this.world.platforms.reduce((max, p) => {
      if (!p.supportsLanding) return max;
      return Math.max(max, p.top);
    }, -Infinity);
    if (!Number.isFinite(lowestTop)) return false;
    return this.currentPlatform.top >= lowestTop - 0.5;
  }

  tryDealAttackDamage(player, popupDelay = 0) {
    if (!player || player.isDead || this.isDead || this.hasHitDuringAttack)
      return false;

    const ex = this.x + this.width / 2;
    const ey = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dx = px - ex;
    const dy = Math.abs(py - ey);
    const facingMatches = Math.sign(dx || 1) === this.facing;

    if (
      facingMatches &&
      Math.abs(dx) <= this.attackRange &&
      dy <= this.attackHeightTolerance &&
      player.invulnerableTimer <= 0
    ) {
      if (player.isSliding) {
        const slideDmg = player.slideDamage ?? 2;
        if (this.health - slideDmg <= 0) return false;

        if (
          !this.hasShownMissDuringAttack &&
          !this.isDead &&
          this.health > 0 &&
          this.recentSlideHit <= 0 &&
          this.world?.hudPopups
        ) {
          this.world.hudPopups.push(
            new HudPopup("MISS", px, py - player.height * 0.4, "miss")
          );
          this.hasShownMissDuringAttack = true;
        }
        return false;
      }

      player.takeDamage?.(this.damage, { popupDelay });
      if (typeof player.invulnerableTimer === "number") {
        player.invulnerableTimer = Math.max(player.invulnerableTimer, 2);
      }
      this.hasHitDuringAttack = true;
      return true;
    }

    return false;
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
      const overlapsX =
        this.x + this.width > p.left && this.x < p.right;

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

  render(ctx, camera) {
    if (this.isDead && this.deathTimer === 0 && this.blinkTimer > 0) {
      const blinkPhase = Math.floor((this.blinkTimer / 0.3)) % 2;
      if (blinkPhase === 0) return;
    }

    ctx.save();
    if (this.facing === -1) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.sprite,
        -(this.x - camera.x + this.width),
        this.y - camera.y,
        this.width,
        this.height
      );
    } else {
      ctx.drawImage(
        this.sprite,
        this.x - camera.x,
        this.y - camera.y,
        this.width,
        this.height
      );
    }

    if (DEBUG_HITBOX) {
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
    ctx.restore();
  }
}

function loadFrames(path, prefix, count) {
  return [...Array(count)].map((_, i) => {
    const img = new Image();
    img.src = `${path}${prefix}${String(i).padStart(3, "0")}.png`;
    return img;
  });
}
