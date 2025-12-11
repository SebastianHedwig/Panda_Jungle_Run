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
    this.patrolRange = 480;
    this.originX = x;
    this.currentPlatform = null;
    this.lastGroundY = y;
    this.hitStun = 0;
    this.hasHitDuringAttack = false;
    this.attackRange = 60;
    this.attackHeightTolerance = 20;
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

  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.health -= amount;

    if (this.world?.hudPopups) {
      this.world.hudPopups.push(
        new HudPopup("-1", this.x + this.width / 2, this.y - 20, "damage")
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

    this.hitStun = Math.max(this.hitStun, 1.5);
    this.vx = 0;
    this.vy = 0;
    this.setAnimation(this.idleFrames);
    this.currentFrame = 0;
    this.frameTime = 0;
  }

  update(dt, player) {
    if (this.isDead) {
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

    if (this.hitStun > 0) {
      this.hitStun = Math.max(0, this.hitStun - dt);
      // freeze on first idle frame (no animation) for clear feedback
      this.setAnimation(this.idleFrames);
      this.currentFrame = 0;
      this.sprite = this.idleFrames[0];
      return;
    }

    // ATTACK HANDLING
    if (this.isAttacking) {
      this.attackTimer -= dt;
      this.setAnimation(this.attackFrames);
      this.animate(dt);

      this.tryDealAttackDamage(player, 0.2);

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.hasHitDuringAttack = false;
      }

      return;
    }

    const platform = this.getPlatformUnderfoot();
    if (platform) {
      this.currentPlatform = platform;
      const nextX = this.x + this.patrolDir * this.speed * dt;
      const footX = nextX + this.width / 2;
      if (footX < platform.left + 5 || footX > platform.right - 5) {
        this.patrolDir *= -1;
      }
    }

    // START ATTACK if player in range - NOCHMAL DRUEBER SCHAUEN
    if (player && !player.isDead) {
      const ex = this.x + this.width / 2;
      const ey = this.y + this.height / 2;
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const dx = px - ex;
      const dy = Math.abs(py - ey);
      if (Math.abs(dx) <= this.attackRange && dy <= this.attackHeightTolerance) {
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        this.hasHitDuringAttack = false;
        this.facing = dx >= 0 ? 1 : -1;
        this.vx = 0;
        this.setAnimation(this.attackFrames);
        this.tryDealAttackDamage(player, 0.2);
        return;
      }
    }

    this.patrol();
    this.x += this.patrolDir * this.speed * dt;

    const prevBottom = this.y + this.height;
    this.applyApexGravity(dt);
    const currBottom = this.y + this.height;
    this.handlePlatformLanding(prevBottom, currBottom);

    if (player && !player.isDead && this.collidesWith(player) && player.invulnerableTimer <= 0) {
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

  tryDealAttackDamage(player, popupDelay = 0) {
    if (!player || player.isDead || this.hasHitDuringAttack) return false;

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
