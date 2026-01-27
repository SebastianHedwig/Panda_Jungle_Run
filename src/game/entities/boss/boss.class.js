import { EnemyBase } from "../enemies/enemyBase.class.js";
import {
  BOSS_SPEED,
  BOSS_RUN_SPEED, 
  BOSS_ATTACK1_DAMAGE,
  BOSS_ATTACK2_DAMAGE,
  BOSS_DAMAGE,
  BOSS_HEALTH,
  DEBUG_MODE,
  FACING_LEFT,
  FACING_RIGHT,
  PLAYER_HURT_IMMUNITY_TIME,
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

    this.speed = BOSS_SPEED;
    this.runSpeed = BOSS_RUN_SPEED;
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
    this.facing = FACING_LEFT;
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
    const minX = this.movementMinX;
    const maxX = this.movementMaxX;

    if (this.x <= minX) {
      this.patrolDirection = FACING_RIGHT;
    } else if (this.x >= maxX) {
      this.patrolDirection = FACING_LEFT;
    }
    this.facing = this.patrolDirection;
  }

  adjustForEdges(moveDirection, dt, platform, onLowestPlatform, fromChasing) {
    if (Number.isFinite(this.movementMinX) && Number.isFinite(this.movementMaxX)) {
      return moveDirection;
    }
    return super.adjustForEdges(
      moveDirection,
      dt,
      platform,
      onLowestPlatform,
      fromChasing
    );
  }

  beginAttack1(playerInfo, player) {
    const deltaX = playerInfo?.deltaX ?? this.facing ?? FACING_RIGHT;
    const extraAttack1HeightTolerance = 20;
    this.attackDuration = this.attack1Duration;
    this.startMeleeAttack(
      deltaX,
      this.attack1Frames,
      this.attack1Damage,
      player,
      this.attack1MoveSpeed,
      this.attack1StrikeRange,
      this.attackHeightTolerance + extraAttack1HeightTolerance
    );
  }

  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const deltaX = playerInfo.deltaX;
    const absoluteDeltaY = playerInfo.absoluteDeltaY;
    const absoluteDeltaX = Math.abs(deltaX);

    const extraHeightTolerance = 30;
    const canUseHeight = absoluteDeltaY <= this.attackHeightTolerance + extraHeightTolerance;
    if (!this.onGround || !canUseHeight) return false;

    const { canAttack1, canAttack2 } = this.getAvailableAttacks(absoluteDeltaX);
    if (!canAttack1 && !canAttack2) return false;

    let choice = null;
    if (canAttack1 && canAttack2) {
      choice = this.pickBossAttack();
    } else if (canAttack1) choice = "attack1";
    else if (canAttack2) choice = "attack2";

    if (choice === "attack2") {
      return this.executeAttack2(deltaX, player);
    }

    if (choice === "attack1") {
      return this.executeAttack1(playerInfo, player);
    }

    return false;
  }

  pickBossAttack() {
    const attack2Probability = 0.5;
    return Math.random() < attack2Probability ? "attack1" : "attack2";
  }

  getAvailableAttacks(absoluteDeltaX) {
    const canAttack1 =
      this.attack1Frames &&
      this.attack1Cooldown <= 0 &&
      absoluteDeltaX <= this.attack1TriggerRange &&
      absoluteDeltaX >= this.attack1MinRange;
    const canAttack2 =
      this.attack2Frames &&
      this.attack2Cooldown <= 0 &&
      absoluteDeltaX <= this.attack2Range;
    return { canAttack1, canAttack2 };
  }

  executeAttack1(playerInfo, player) {
    bossAudio.playAttack1();
    this.beginAttack1(playerInfo, player);
    this.attack1Cooldown = this.attack1CooldownDuration;
    this.lastAttackType = "attack1";
    return true;
  }

  executeAttack2(deltaX, player) {
    const extraAttack2HeightTolerance = 10;
    this.attackDuration = this.attack2Duration;
    this.attack2Cooldown = this.attack2CooldownDuration;
    this.lastAttackType = "attack2";
    bossAudio.playAttack2();
    this.startMeleeAttack(
        deltaX,
        this.attack2Frames,
      this.attack2Damage,
      player,
      0,
      this.attack2Range,
      this.attackHeightTolerance + extraAttack2HeightTolerance
    );
    return true;
  }

  update(dt, player) {
    updateBoss(this, dt, player);
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
    const facingMatches = Math.sign(dx || FACING_RIGHT) === this.facing;
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
        player.invulnerableTimer = Math.max(
          player.invulnerableTimer,
          PLAYER_HURT_IMMUNITY_TIME
        );
      }
      this.hasHitDuringAttack = true;
      return true;
    }

    return false;
  }

  takeDamage(amount = 1, hitContext = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, { ...hitContext, skipStun: true });
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
