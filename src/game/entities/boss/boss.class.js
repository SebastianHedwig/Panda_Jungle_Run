import { EnemyBase } from "../enemies/enemyBase.class.js";
import {
  BOSS_ATTACK1_DAMAGE,
  BOSS_ATTACK2_DAMAGE,
  BOSS_DAMAGE,
  BOSS_HEALTH,
  DEBUG_MODE,
} from "../../../config/config.js";
import { BossAudio } from "../../audio/bossAudio.class.js";
import { updateBoss } from "./bossUpdate.js";
import { renderBoss } from "./bossRender.js";
export { loadBossSprites } from "./bossSprites.js";

const DEBUG_BOSS_HITBOX = DEBUG_MODE;
const bossAudio = new BossAudio();

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
    this.health = BOSS_HEALTH;
    this.damage = BOSS_DAMAGE;
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

    this.attack1Damage = BOSS_ATTACK1_DAMAGE;
    this.attack2Damage = BOSS_ATTACK2_DAMAGE;
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
      choice = Math.random() < 0.5 ? "attack1" : "attack2";
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
    updateBoss(this, dt, player);
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
    renderBoss(this, ctx, camera, { debugHitbox: DEBUG_BOSS_HITBOX });
  }
}
