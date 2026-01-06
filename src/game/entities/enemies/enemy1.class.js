import { EnemyBase, DEBUG_ENEMY_HITBOX } from "./enemyBase.class.js";
import { CollectableItem } from "../../items/collectableItem.class.js";
import { ENEMY1_DAMAGE, ENEMY1_HEALTH } from "../../../config/config.js";

export function loadEnemy1Sprites() {
  const base = "assets/img/Enemies/Enemy_Sprites/Character-1/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 10),
    attack: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

export class Enemy1 extends EnemyBase {
  constructor(x, y, sprites, world = null) {
    super(x, y, 110, 110, world);

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
    this.health = ENEMY1_HEALTH;
    this.damage = ENEMY1_DAMAGE;
    this.attackDamageCurrent = this.damage;
    this.isDead = false;
    this.remove = false;
    this.deathDone = false;
    this.deathTimer = 0;
    this.blinkTimer = 0;
    this.isAttacking = false;
    this.attackDuration = 0.6;
    this.attackTimer = 0;

    this.attackRange = 60;
    this.attackHeightTolerance = 20;
    this.chaseRangeX = 300;
    this.chaseRangeXExit = 360;
    this.chaseRangeY = 200;
    this.chaseRangeYExit = 260;
    this.hasDroppedLoot = false;
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
    if (player?.isDead) {
      this.isChasing = false;
      this.isAttacking = false;
    }

    // ATTACK HANDLING
    if (this.isAttacking) {
      this.attackTimer -= dt;
      const atkFrames = this.activeAttackFrames || this.attackFrames;
      this.setAnimation(atkFrames);
      if (this.attackMoveSpeed) {
        const platform = this.getPlatformUnderfoot();
        const nextX = this.x + this.attackMoveSpeed * this.facing * dt;
        const nextFoot = nextX + this.width / 2;
        const hitsPlatformEdge =
          platform &&
          (nextFoot <= platform.left + this.edgeMargin ||
            nextFoot >= platform.right - this.edgeMargin);
        if (hitsPlatformEdge) {
          // stop sliding attack when reaching the edge
          this.isAttacking = false;
          this.attackMoveSpeed = 0;
          this.hasHitDuringAttack = false;
          this.setAnimation(this.idleFrames);
          this.currentFrame = 0;
        } else {
          this.x = nextX;
        }
      }
      this.animate(dt);

      this.tryDealAttackDamage(player, 0.2);

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.hasHitDuringAttack = false;
        this.attackMoveSpeed = 0;
        this.activeAttackFrames = null;
      }

      this.applyAttackPhysics(dt);
      this.isChasing = false;
      return;
    }

    // START ATTACK if player in range
    if (this.tryStartAttack(playerInfo, player)) return;

    const platform = this.getPlatformUnderfoot();
    this.currentPlatform = platform || null;
    const onLowestPlatform = this.isOnLowestPlatform();
    const prevChasing = this.isChasing;
    const canChase =
      this.chaseCooldown <= 0 &&
      player &&
      !player.isDead &&
      this.shouldChasePlayer(playerInfo, prevChasing);
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
      moveDir = this.adjustForEdges(
        moveDir,
        dt,
        platform,
        onLowestPlatform,
        prevChasing
      );
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
        return false;
      }

      const dmg = this.attackDamageCurrent ?? this.damage;
      player.takeDamage?.(dmg, { popupDelay });
      if (typeof player.invulnerableTimer === "number") {
        player.invulnerableTimer = Math.max(player.invulnerableTimer, 2);
      }
      this.hasHitDuringAttack = true;
      return true;
    }

    return false;
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
      if (DEBUG_ENEMY_HITBOX) {
        const box = this.getHitbox();
        ctx.strokeStyle = "rgba(0,120,255,0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          -(box.x - camera.x + box.width),
          box.y - camera.y,
          box.width,
          box.height
        );
      }
    } else {
      ctx.drawImage(
        this.sprite,
        this.x - camera.x,
        this.y - camera.y,
        this.width,
        this.height
      );
      if (DEBUG_ENEMY_HITBOX) this.renderHitbox(ctx, camera);
    }

    ctx.restore();
  }

  takeDamage(amount = 1, opts = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, opts);
    if (!prevDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(4);
      this.hasDroppedLoot = true;
    }
  }

  dropCoins(count = 2) {
    if (!this.world?.collectables) return;
    const coins = [];
    const baseX = this.x + this.width / 2;
    const baseY = this.y + this.height * 0.2;
    for (let i = 0; i < count; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      const radius = 30 + Math.random() * 20;
      const angle = (Math.random() * Math.PI) / 6 + Math.PI / 3; // 30°..90°
      const x = baseX + dir * radius * Math.cos(angle);
      const y = baseY - radius * Math.sin(angle);
      const vx = dir * (120 + Math.random() * 60);
      const vy = -(400 + Math.random() * 150);
      const c = new CollectableItem(x, y, "coin", this.world);
      c.startDrop(vx, vy);
      coins.push(c);
    }
    this.world.addCollectables ? this.world.addCollectables(coins) : this.world.collectables.push(...coins);
  }
}

function loadFrames(path, prefix, count) {
  return [...Array(count)].map((_, i) => {
    const img = new Image();
    img.src = `${path}${prefix}${String(i).padStart(3, "0")}.png`;
    return img;
  });
}
