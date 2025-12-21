import { EnemyBase } from "./enemyBase.class.js";
import { DEBUG_MODE } from "../../../config/config.js";
import { BossAudio } from "../../audio/bossAudio.class.js";

const DEBUG_BOSS_HITBOX = DEBUG_MODE;
const bossAudio = new BossAudio();

export function loadBossSprites() {
  const base = "assets/img/Boss/Boss_Sprites/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 12),
    run: loadFrames(`${base}run/`, "Run_", 8),
    attack1: loadFrames(`${base}attack_1/`, "Attack_", 8),
    attack2: loadFrames(`${base}attack_2/`, "Attack_", 8),
    hurt: loadFrames(`${base}hurt/`, "Hurt_", 6),
    die: loadFrames(`${base}die/`, "Die_", 12),
    jump: loadFrames(`${base}jump/`, "Jump_", 6),
  };
}

export class Boss extends EnemyBase {
  constructor(x, y, sprites, world = null) {
    super(x, y, 240, 240, world);

    this.idleFrames = sprites.idle;
    this.walkFrames = sprites.walk || sprites.run || sprites.idle;
    this.runFrames = sprites.run || sprites.walk || sprites.idle;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.hurtFrames = sprites.hurt || sprites.idle;
    this.dieFrames = sprites.die || sprites.hurt || sprites.idle;
    this.jumpFrames = sprites.jump || sprites.run;

    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.09;
    this.sprite = this.currentAnimation[0];

    this.speed = 100;
    this.runSpeed = 200;
    this.health = 20;
    this.damage = 2;
    this.attackDamageCurrent = this.damage;
    this.isDead = false;
    this.remove = false;
    this.deathDone = false;
    this.deathTimer = 0;
    this.blinkTimer = 0;
    this.isAttacking = false;
    this.attackDuration = 1;
    this.attackTimer = 0;

    this.attackRange = 100;
    this.attack1StrikeRange = 60;
    this.attack2Range = 100;
    this.attackHeightTolerance = 90;
    this.chaseRangeX = 1000;
    this.chaseRangeXExit = 1500;
    this.chaseRangeY = 240;
    this.chaseRangeYExit = 250;

    this.attack1Damage = 3;
    this.attack2Damage = 4;
    this.attack1Duration = 1;
    this.attack2Duration = 1.1;
    this.attack1MoveSpeed = 0;
    this.attack1TriggerRange = 420;
    this.attack1MinRange = 110;
    this.attack1Cooldown = 0;
    this.attack1CooldownDuration = 3;
    this.attack2Cooldown = 0;
    this.attack2CooldownDuration = 3;

    this.activeAttackRange = null;
    this.activeHeightTolerance = null;
    this.lastAttackType = null;
    this.runningBurstDuration = 2;
    this.runningBurstTimer = 0;
    this.runningCooldownDuration = 2;
    this.runningCooldown = 0;
    this.isRunning = false;
    this.spriteYOffset = 8;
    this.disableHitEffect = true;
    this.maxHealth = this.health;
    this.movementMinX = null;
    this.movementMaxX = null;
    this.jumpHeightThreshold = 120;
    this.jumpHorizontalRange = 420;
    this.animDirection = -1;
    this.facing = -1;
    this.lastMoveDir = -1;
    this.patrolRange = 1500;
    this.jumpCooldown = 5;
    this.jumpCooldownTimer = 0;
    this.wasOnGround = true;
    this.hurtAnimTimer = 0;
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
      const len = this.currentAnimation.length;
      if (!len) return;
      this.currentFrame = (this.currentFrame + 1) % len;
      this.sprite = this.currentAnimation[this.currentFrame];
    }
  }

  startMeleeAttack(
    dx,
    frames,
    damage,
    player,
    moveSpeed = 0,
    rangeOverride = null,
    heightOverride = null
  ) {
    this.activeAttackRange = rangeOverride ?? this.attackRange;
    this.activeHeightTolerance = heightOverride ?? this.attackHeightTolerance;
    super.startMeleeAttack(dx, frames, damage, player, moveSpeed);
  }

  patrol() {
    if (Number.isFinite(this.movementMinX) && Number.isFinite(this.movementMaxX)) {
      const minX = this.movementMinX;
      const maxX = this.movementMaxX;
      if (this.x <= minX) {
        this.patrolDir = 1;
      } else if (this.x >= maxX) {
        this.patrolDir = -1;
      }
      this.facing = this.patrolDir;
      return;
    }
    super.patrol();
  }

  hasAdjacentPlatform(currentPlatform, moveDir, footX) {
    if (!this.world?.platforms?.length) return false;
    const margin = Math.max(this.edgeMargin, 60);
    const toleranceY = Math.max(4, margin);
    const boundary = moveDir > 0 ? currentPlatform.right : currentPlatform.left;
    const lookStart = boundary - margin;
    const lookEnd = boundary + margin * 6 * moveDir;
    const minX = Math.min(lookStart, lookEnd, footX - margin);
    const maxX = Math.max(lookStart, lookEnd, footX + margin);
    return this.world.platforms.some(
      (p) =>
        p !== currentPlatform &&
        p.supportsLanding &&
        Math.abs(p.top - currentPlatform.top) <= toleranceY &&
        p.right >= minX &&
        p.left <= maxX
    );
  }

  adjustForEdges(moveDir, dt, platform, onLowestPlatform, prevChasing) {
    if (Number.isFinite(this.movementMinX) && Number.isFinite(this.movementMaxX)) {
      return moveDir;
    }
    return super.adjustForEdges(moveDir, dt, platform, onLowestPlatform, prevChasing);
  }

  beginAttack1(playerInfo, player) {
    const dx = playerInfo?.dx ?? this.facing ?? 1;
    this.attackDuration = this.attack1Duration;
    this.startMeleeAttack(
      dx,
      this.attack1Frames,
      this.attack1Damage,
      player,
      this.attack1MoveSpeed,
      this.attack1StrikeRange,
      this.attackHeightTolerance + 20
    );
  }

  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const dx = playerInfo.dx;
    const dy = playerInfo.absDy;
    const absDx = Math.abs(dx);

    const canUseHeight = dy <= this.attackHeightTolerance + 30;
    if (!this.onGround || !canUseHeight) return false;

    const canAttack1 =
      this.attack1Frames &&
      this.attack1Cooldown <= 0 &&
      absDx <= this.attack1TriggerRange &&
      absDx >= this.attack1MinRange;
    const canAttack2 =
      this.attack2Frames &&
      this.attack2Cooldown <= 0 &&
      absDx <= this.attack2Range;

    if (!canAttack1 && !canAttack2) return false;

    let choice = null;
    if (canAttack1 && canAttack2) {
      if (this.lastAttackType === "attack1") choice = "attack2";
      else if (this.lastAttackType === "attack2") choice = "attack1";
      else choice = Math.random() < 0.5 ? "attack1" : "attack2";
    } else if (canAttack1) choice = "attack1";
    else if (canAttack2) choice = "attack2";

    if (choice === "attack2") {
      this.attackDuration = this.attack2Duration;
      this.attack2Cooldown = this.attack2CooldownDuration;
      this.lastAttackType = "attack2";
      bossAudio.playAttack2();
      this.startMeleeAttack(
        dx,
        this.attack2Frames,
        this.attack2Damage,
        player,
        0,
        this.attack2Range,
        this.attackHeightTolerance + 10
      );
      return true;
    }

    if (choice === "attack1") {
      bossAudio.playAttack1();
      this.beginAttack1(playerInfo, player);
      this.attack1Cooldown = this.attack1CooldownDuration;
      this.lastAttackType = "attack1";
      return true;
    }

    return false;
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
      }

      return;
    }

    if (this.recentSlideHit > 0) {
      this.recentSlideHit = Math.max(0, this.recentSlideHit - dt);
    }
    if (this.chaseCooldown > 0) {
      this.chaseCooldown = Math.max(0, this.chaseCooldown - dt);
    }
    if (this.attack1Cooldown > 0) {
      this.attack1Cooldown = Math.max(0, this.attack1Cooldown - dt);
    }
    if (this.attack2Cooldown > 0) {
      this.attack2Cooldown = Math.max(0, this.attack2Cooldown - dt);
    }
    if (this.runningCooldown > 0) {
      this.runningCooldown = Math.max(0, this.runningCooldown - dt);
    }
    if (this.runningBurstTimer > 0) {
      this.runningBurstTimer = Math.max(0, this.runningBurstTimer - dt);
    }
    if (this.jumpCooldownTimer > 0) {
      this.jumpCooldownTimer = Math.max(0, this.jumpCooldownTimer - dt);
    }

    if (this.hitStun > 0) {
      this.hitStun = Math.max(0, this.hitStun - dt);
      this.isChasing = false;
      this.isAttacking = false;
      this.setAnimation(this.hurtFrames || this.idleFrames);
      this.currentFrame = 0;
      this.sprite = this.currentAnimation[0];
      return;
    }

    if (this.hurtAnimTimer > 0) {
      this.hurtAnimTimer = Math.max(0, this.hurtAnimTimer - dt);
      this.isChasing = false;
      this.isAttacking = false;
      this.setAnimation(this.hurtFrames || this.idleFrames);
      this.animate(dt);
      const prevBottom = this.y + this.height;
      this.applyApexGravity(dt);
      const currBottom = this.y + this.height;
      this.handlePlatformLanding(prevBottom, currBottom);
      return;
    }

    const playerInfo = this.getPlayerDelta(player);
    if (player?.isDead) {
      this.isChasing = false;
      this.isAttacking = false;
    }

    const wantJump =
      this.onGround &&
      !this.isAttacking &&
      playerInfo &&
      playerInfo.dy < -this.jumpHeightThreshold &&
      Math.abs(playerInfo.dx) <= this.jumpHorizontalRange &&
      this.jumpCooldownTimer <= 0;
    if (wantJump) {
      this.jump();
      this.jumpCooldownTimer = this.jumpCooldown;
      if (this.jumpFrames) this.setAnimation(this.jumpFrames);
    }

    if (this.isAttacking) {
      this.attackTimer -= dt;
      const atkFrames = this.activeAttackFrames || this.attackFrames;
      this.setAnimation(atkFrames);
      this.animate(dt);

      this.tryDealAttackDamage(player, 0.2);

      const prevBottom = this.y + this.height;
      this.applyApexGravity(dt);
      const currBottom = this.y + this.height;
      this.handlePlatformLanding(prevBottom, currBottom);

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.hasHitDuringAttack = false;
        this.attackMoveSpeed = 0;
        this.activeAttackFrames = null;
        this.activeAttackRange = null;
        this.activeHeightTolerance = null;
      }

      this.isChasing = false;
      return;
    }

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
    const ignoreEdgeBlock =
      Number.isFinite(this.movementMinX) && Number.isFinite(this.movementMaxX);
    const blockedByEdge =
      !ignoreEdgeBlock &&
      canChase &&
      onLowestPlatform &&
      platform &&
      ((playerInfo.dx < 0 && enemyCenterX <= platform.left + this.edgeMargin) ||
        (playerInfo.dx > 0 && enemyCenterX >= platform.right - this.edgeMargin));

    this.isChasing = canChase && !blockedByEdge;

    this.updateRunState();
    let moveDir = this.lastMoveDir || this.facing || -1;
    if (this.isChasing) {
      const dx = playerInfo?.dx ?? 0;
      const targetDir =
        Math.abs(dx) < 5
          ? this.lastMoveDir || this.facing || 1
          : Math.sign(dx) || 1;
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

    const moveSpeed =
      this.isChasing && this.isRunning ? this.runSpeed : this.speed;
    const runDir = Math.sign(moveDir || this.facing || 1) || 1;
    this.x += runDir * moveSpeed * dt;
    this.facing = runDir;
    this.lastMoveDir = runDir;

    const prevBottom = this.y + this.height;
    const wasOnGround = this.onGround;
    this.applyApexGravity(dt);
    const currBottom = this.y + this.height;
    this.handlePlatformLanding(prevBottom, currBottom);
    const landed = !wasOnGround && this.onGround;
    this.wasOnGround = this.onGround;

    if (landed) {
      if (
        player &&
        !player.isDead &&
        player.onGround &&
        player.applyDizzy
      ) {
        player.applyDizzy();
      }
      this.world?.camera?.shake?.(0.25, 8);
    }

    if (
      player &&
      !player.isDead &&
      !player.isSliding &&
      player.invulnerableTimer <= 0 &&
      this.collidesWith(player)
    ) {
      player.takeDamage?.(this.damage, { useDizzy: false });
      if (typeof player.invulnerableTimer === "number") {
        player.invulnerableTimer = Math.max(player.invulnerableTimer, 2);
      }
    }

    const walkAnim = this.isChasing ? this.runFrames : this.walkFrames;
    if (this.hurtAnimTimer > 0 && this.hurtFrames) {
      this.setAnimation(this.hurtFrames);
      this.animate(dt);
    } else {
      this.setAnimation(walkAnim);
      this.animate(dt);
    }

    if (Number.isFinite(this.movementMinX)) {
      this.x = Math.max(this.x, this.movementMinX);
    }
    if (Number.isFinite(this.movementMaxX)) {
      this.x = Math.min(this.x, this.movementMaxX);
    }
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

  updateRunState() {
    if (!this.isChasing) {
      this.isRunning = false;
      this.runningBurstTimer = 0;
      return;
    }

    if (this.runningBurstTimer > 0) {
      this.isRunning = true;
      return;
    }

    if (this.runningCooldown <= 0 && Math.random() < 0.7) {
      this.runningBurstTimer = this.runningBurstDuration;
      this.runningCooldown = this.runningCooldownDuration;
      this.isRunning = true;
      return;
    }

    this.isRunning = false;
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
    const range = this.activeAttackRange ?? this.attackRange;
    const heightTol = this.activeHeightTolerance ?? this.attackHeightTolerance;

    if (
      facingMatches &&
      Math.abs(dx) <= range &&
      dy <= heightTol &&
      player.invulnerableTimer <= 0
    ) {
      if (player.isSliding) {
        return false;
      }

      const dmg = this.attackDamageCurrent ?? this.damage;
      player.takeDamage?.(dmg, { popupDelay });
      bossAudio.playHit();
      if (typeof player.invulnerableTimer === "number") {
        player.invulnerableTimer = Math.max(player.invulnerableTimer, 2);
      }
      this.hasHitDuringAttack = true;
      return true;
    }

    return false;
  }

  takeDamage(amount = 1, opts = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, { ...opts, skipStun: true });
    if (!prevDead && this.isDead) {
      this.deathTimer = Math.max(this.deathTimer, 5.5);
    } else if (this.hurtFrames) {
      bossAudio.playWhimper();
      this.hurtAnimTimer = Math.max(this.hurtAnimTimer, 0.5);
      this.setAnimation(this.hurtFrames);
      this.currentFrame = 0;
      this.sprite = this.currentAnimation[0];
    }
  }

  getHitbox() {
    if (this.isDead || this.health <= 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const shrinkX = this.width * 0.50;
    const shrinkY = this.height * 0.55;
    return {
      x: this.x + shrinkX / 2,
      y: this.y + shrinkY,
      width: this.width - shrinkX,
      height: this.height - shrinkY,
    };
  }

  render(ctx, camera) {
    ctx.save();
    if (this.facing === 1) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.sprite,
        -(this.x - camera.x + this.width),
        this.y + this.spriteYOffset - camera.y,
        this.width,
        this.height
      );
      if (DEBUG_BOSS_HITBOX) {
        const box = this.getHitbox();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
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
        this.y + this.spriteYOffset - camera.y,
        this.width,
        this.height
      );
      if (DEBUG_BOSS_HITBOX) {
        const box = this.getHitbox();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          box.x - camera.x,
          box.y - camera.y,
          box.width,
          box.height
        );
      }
    }

    ctx.restore();
    if (!this.isDead && this.health > 0 && this.maxHealth > 0) {
      const barW = this.width * 0.8;
      const barH = 15;
      const barX = this.x - camera.x + (this.width - barW) / 2;
      const barY = this.y - camera.y - barH + 8;
      const ratio = Math.max(0, Math.min(1, this.health / this.maxHealth));

      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

      ctx.fillStyle = "rgba(200, 0, 0, 0.9)";
      ctx.fillRect(barX, barY, barW * ratio, barH);

      ctx.fillStyle = "rgba(255,255,2,0.9)";
      ctx.font = "0.5rem ComixLoud, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${Math.ceil(this.health)}/${Math.ceil(this.maxHealth)}`,
        barX + barW / 2,
        barY + barH / 2
      );
    }

    if (DEBUG_BOSS_HITBOX) {
      const box = this.getHitbox();
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        box.x - camera.x,
        box.y - camera.y,
        box.width,
        box.height
      );
      ctx.restore();
    }
  }
}

function loadFrames(path, prefix, count) {
  return [...Array(count)].map((_, i) => {
    const img = new Image();
    img.src = `${path}${prefix}${String(i).padStart(3, "0")}.png`;
    return img;
  });
}
