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
    this.runningBurstChance = 0.7;
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
    this.deathTimerMin = 5.5;
    this.hurtAnimMinDuration = 0.5;
    this.hitboxShrinkXFactor = 0.5;
    this.hitboxShrinkYFactor = 0.55;

    this.attacks = {
      attack1: {
        frames: this.attack1Frames,
        damage: this.attack1Damage,
        duration: this.attack1Duration,
        moveSpeed: this.attack1MoveSpeed,
        range: this.attack1StrikeRange,
        minRange: this.attack1MinRange,
        triggerRange: this.attack1TriggerRange,
        heightAdd: 20,
        cooldownKey: "attack1Cooldown",
        cooldownDuration: this.attack1CooldownDuration,
        audio: () => bossAudio.playAttack1(),
      },
      attack2: {
        frames: this.attack2Frames,
        damage: this.attack2Damage,
        duration: this.attack2Duration,
        moveSpeed: 0,
        range: this.attack2Range,
        minRange: 0,
        triggerRange: this.attack2Range,
        heightAdd: 10,
        cooldownKey: "attack2Cooldown",
        cooldownDuration: this.attack2CooldownDuration,
        audio: () => bossAudio.playAttack2(),
      },
    };
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

  startConfiguredAttack(dx, frames, damage, player, moveSpeed = 0, rangeOverride = null, heightOverride = null) {
    this.activeAttackRange = rangeOverride ?? this.attackRange;
    this.activeHeightTolerance = heightOverride ?? this.attackHeightTolerance;
    super.startMeleeAttack(dx, frames, damage, player, moveSpeed);
  }

  initiateAttack(...args) {
    return this.startConfiguredAttack(...args);
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

    return this.runAttack(choice, deltaX, player, playerInfo);
  }

  pickBossAttack() {
    const attack2Probability = 0.5;
    return Math.random() < attack2Probability ? "attack2" : "attack1";
  }

  getAvailableAttacks(absoluteDeltaX) {
    const attack1 = this.attacks.attack1;
    const attack2 = this.attacks.attack2;
    const canAttack1 =
      attack1.frames &&
      this[attack1.cooldownKey] <= 0 &&
      absoluteDeltaX <= attack1.triggerRange &&
      absoluteDeltaX >= attack1.minRange;
    const canAttack2 =
      attack2.frames &&
      this[attack2.cooldownKey] <= 0 &&
      absoluteDeltaX <= attack2.triggerRange;
    return { canAttack1, canAttack2 };
  }

  runAttack(attackId, deltaX, player, playerInfo) {
    if (!attackId) return false;
    const attackConfiguration = this.attacks[attackId];
    if (!attackConfiguration) return false;

    const heightTolerance = this.attackHeightTolerance + (attackConfiguration.heightAdd || 0);
    this.attackDuration = attackConfiguration.duration;
    this.activeAttackRange = attackConfiguration.range ?? this.attackRange;
    this.activeHeightTolerance = heightTolerance;

    attackConfiguration.audio?.();
    this[attackConfiguration.cooldownKey] = attackConfiguration.cooldownDuration;
    this.lastAttackType = attackId;

    this.initiateAttack(
      deltaX,
      attackConfiguration.frames,
      attackConfiguration.damage,
      player,
      attackConfiguration.moveSpeed,
      attackConfiguration.range,
      heightTolerance
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

    if (this.runningCooldown <= 0 && Math.random() < this.runningBurstChance) {
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

    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height / 2;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const deltaX = playerCenterX - bossCenterX;
    const absoluteDeltaY = Math.abs(playerCenterY - bossCenterY);
    const facingMatches = Math.sign(deltaX || FACING_RIGHT) === this.facing;
    const attackRange = this.activeAttackRange ?? this.attackRange;
    const attackHeightTolerance =
      this.activeHeightTolerance ?? this.attackHeightTolerance;

    if (
      facingMatches &&
      Math.abs(deltaX) <= attackRange &&
      absoluteDeltaY <= attackHeightTolerance &&
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
      this.deathTimer = Math.max(this.deathTimer, this.deathTimerMin);
    } else if (this.hurtFrames) {
      bossAudio.playWhimper();
      this.hurtAnimTimer = Math.max(this.hurtAnimTimer, this.hurtAnimMinDuration);
      this.setAnimation(this.hurtFrames);
      this.currentFrame = 0;
      this.sprite = this.currentAnimation[0];
    }
  }

  getHitbox() {
    if (this.isDead || this.health <= 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const shrinkX = this.width * this.hitboxShrinkXFactor;
    const shrinkY = this.height * this.hitboxShrinkYFactor;
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
