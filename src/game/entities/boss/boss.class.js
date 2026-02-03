import { EnemyBase } from "../enemies/enemyBase.class.js";
import { BOSS_SPEED, BOSS_RUN_SPEED, BOSS_ATTACK1_DAMAGE, BOSS_ATTACK2_DAMAGE, BOSS_DAMAGE, BOSS_HEALTH, DEBUG_MODE, FACING_LEFT, FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../config/config.js";
import { BossAudio } from "../../audio/bossAudio.class.js";
import { updateBoss } from "./bossUpdate.js";
import { renderBoss } from "./bossRender.js";
export { loadBossSprites } from "./bossSprites.js";

const DEBUG_BOSS_HITBOX = DEBUG_MODE;
const bossAudio = new BossAudio();

export class Boss extends EnemyBase {
  constructor(x, y, sprites, world = null) {
    super(x, y, 240, 240, world);
    this.initializeSpriteFrames(sprites);
    this.initializeAnimationState();
    this.initializeBaseStats();
    this.initializeCombatState();
    this.initializeRangeSettings();
    this.initializeAttackSettings();
    this.initializeBehaviorState();
    this.initializeAttackConfigurations();
  }

  initializeSpriteFrames(sprites) {
    this.idleFrames = sprites.idle;
    this.walkFrames = sprites.walk || sprites.run || sprites.idle;
    this.runFrames = sprites.run || sprites.walk || sprites.idle;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.hurtFrames = sprites.hurt || sprites.idle;
    this.dieFrames = sprites.die || sprites.hurt || sprites.idle;
    this.jumpFrames = sprites.jump || sprites.run;
  }

  initializeAnimationState() {
    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.09;
    this.sprite = this.currentAnimation[0];
  }

  initializeBaseStats() {
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
  }

  initializeCombatState() {
    this.isAttacking = false;
    this.attackDuration = 1;
    this.attackTimer = 0;
  }

  initializeRangeSettings() {
    this.attackRange = 100;
    this.attack1StrikeRange = 60;
    this.attack2Range = 100;
    this.attackHeightTolerance = 90;
    this.chaseRangeX = 1000;
    this.chaseRangeXExit = 1500;
    this.chaseRangeY = 240;
    this.chaseRangeYExit = 250;
  }

  initializeAttackSettings() {
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
  }

  initializeBehaviorState() {
    Object.assign(this, {
      activeAttackRange: null, activeHeightTolerance: null, lastAttackType: null, runningBurstDuration: 2,
      runningBurstTimer: 0, runningCooldownDuration: 2, runningBurstChance: 0.7, runningCooldown: 0,
      isRunning: false, spriteYOffset: 8, disableHitEffect: true, maxHealth: this.health, movementMinX: null,
      movementMaxX: null, jumpHeightThreshold: 120, jumpHorizontalRange: 420, animDirection: -1, facing: FACING_LEFT,
      lastMoveDirection: -1, patrolRange: 1500, jumpCooldown: 5, jumpCooldownTimer: 0, wasOnGround: true,
      hurtAnimTimer: 0, deathTimerMin: 5.5, hurtAnimMinDuration: 0.5, hitboxShrinkXFactor: 0.5,
      hitboxShrinkYFactor: 0.55,
    });
  }

  initializeAttackConfigurations() {
    this.attacks = createBossAttacks(this);
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
    if (this.x <= minX) this.patrolDirection = FACING_RIGHT;
    else if (this.x >= maxX) this.patrolDirection = FACING_LEFT;
    this.facing = this.patrolDirection;
  }

  adjustForEdges(moveDirection, dt, platform, onLowestPlatform, fromChasing) {
    if (Number.isFinite(this.movementMinX) && Number.isFinite(this.movementMaxX)) {
      return moveDirection;
    }
    return super.adjustForEdges(moveDirection, dt, platform, onLowestPlatform, fromChasing);
  }

  tryStartAttack(playerInfo, player) {
    if (!canAttemptBossAttack(playerInfo, player)) return false;
    const deltaX = playerInfo.deltaX;
    const absoluteDeltaY = playerInfo.absoluteDeltaY;
    const absoluteDeltaX = Math.abs(deltaX);
    const canUseHeight = canUseBossHeight(this, absoluteDeltaY);
    if (!this.onGround || !canUseHeight) return false;
    const { canAttack1, canAttack2 } = this.getAvailableAttacks(absoluteDeltaX);
    const choice = selectBossAttack(this, canAttack1, canAttack2);
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

  runAttack(attackId, deltaX, player) {
    if (!attackId) return false;
    const attackConfiguration = this.attacks[attackId];
    if (!attackConfiguration) return false;
    const heightTolerance = getBossAttackHeightTolerance(this, attackConfiguration);
    configureBossAttack(this, attackConfiguration, heightTolerance, attackId);
    this.initiateAttack(deltaX, attackConfiguration.frames, attackConfiguration.damage, player, attackConfiguration.moveSpeed, attackConfiguration.range, heightTolerance);
    return true;
  }

  update(dt, player) {
    updateBoss(this, dt, player);
  }

  updateRunState() {
    if (!this.isChasing) return resetBossRunState(this);
    if (this.runningBurstTimer > 0) return setBossRunning(this, true);
    if (shouldStartRunningBurst(this)) return startBossRunningBurst(this);
    setBossRunning(this, false);
  }

  tryDealAttackDamage(player, popupDelay = 0) {
    if (!canBossDealAttackDamage(this, player)) return false;
    const attackContext = getBossAttackContext(this, player);
    if (!isBossAttackContactValid(this, attackContext, player)) return false;
    if (player.isSliding) return false;
    applyBossAttackDamage(this, player, popupDelay);
    this.hasHitDuringAttack = true;
    return true;
  }

  takeDamage(amount = 1, hitContext = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, { ...hitContext, skipStun: true });
    handleBossDamageResult(this, prevDead);
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

function createBossAttacks(boss) {
  return { attack1: createBossAttack1(boss), attack2: createBossAttack2(boss) };
}

function createBossAttack1(boss) {
  return {
    frames: boss.attack1Frames,
    damage: boss.attack1Damage,
    duration: boss.attack1Duration,
    moveSpeed: boss.attack1MoveSpeed,
    range: boss.attack1StrikeRange,
    minRange: boss.attack1MinRange,
    triggerRange: boss.attack1TriggerRange,
    heightAdd: 20,
    cooldownKey: "attack1Cooldown",
    cooldownDuration: boss.attack1CooldownDuration,
    audio: () => bossAudio.playAttack1(),
  };
}

function createBossAttack2(boss) {
  return {
    frames: boss.attack2Frames,
    damage: boss.attack2Damage,
    duration: boss.attack2Duration,
    moveSpeed: 0,
    range: boss.attack2Range,
    minRange: 0,
    triggerRange: boss.attack2Range,
    heightAdd: 10,
    cooldownKey: "attack2Cooldown",
    cooldownDuration: boss.attack2CooldownDuration,
    audio: () => bossAudio.playAttack2(),
  };
}

function canAttemptBossAttack(playerInfo, player) {
  return !!playerInfo && !!player && !player.isDead;
}

function canUseBossHeight(boss, absoluteDeltaY) {
  const extraHeightTolerance = 30;
  const canUseHeight = absoluteDeltaY <= boss.attackHeightTolerance + extraHeightTolerance;
  return canUseHeight;
}

function selectBossAttack(boss, canAttack1, canAttack2) {
  let choice = null;
  if (canAttack1 && canAttack2) choice = boss.pickBossAttack();
  else if (canAttack1) choice = "attack1";
  else if (canAttack2) choice = "attack2";
  return choice;
}

function getBossAttackHeightTolerance(boss, attackConfiguration) {
  const heightTolerance = boss.attackHeightTolerance + (attackConfiguration.heightAdd || 0);
  return heightTolerance;
}

function configureBossAttack(boss, attackConfiguration, heightTolerance, attackId) {
  boss.attackDuration = attackConfiguration.duration;
  boss.activeAttackRange = attackConfiguration.range ?? boss.attackRange;
  boss.activeHeightTolerance = heightTolerance;
  attackConfiguration.audio?.();
  boss[attackConfiguration.cooldownKey] = attackConfiguration.cooldownDuration;
  boss.lastAttackType = attackId;
}

function resetBossRunState(boss) {
  boss.isRunning = false;
  boss.runningBurstTimer = 0;
}

function setBossRunning(boss, isRunning) {
  boss.isRunning = isRunning;
}

function shouldStartRunningBurst(boss) {
  return boss.runningCooldown <= 0 && Math.random() < boss.runningBurstChance;
}

function startBossRunningBurst(boss) {
  boss.runningBurstTimer = boss.runningBurstDuration;
  boss.runningCooldown = boss.runningCooldownDuration;
  boss.isRunning = true;
}

function canBossDealAttackDamage(boss, player) {
  return !!player && !player.isDead && !boss.isDead && !boss.hasHitDuringAttack;
}

function getBossAttackContext(boss, player) {
  const bossCenterX = boss.x + boss.width / 2;
  const bossCenterY = boss.y + boss.height / 2;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const deltaX = playerCenterX - bossCenterX;
  const absoluteDeltaY = Math.abs(playerCenterY - bossCenterY);
  const facingMatches = Math.sign(deltaX || FACING_RIGHT) === boss.facing;
  const attackRange = boss.activeAttackRange ?? boss.attackRange;
  const attackHeightTolerance = boss.activeHeightTolerance ?? boss.attackHeightTolerance;
  return { deltaX, absoluteDeltaY, facingMatches, attackRange, attackHeightTolerance };
}

function isBossAttackContactValid(attackContext, player) {
  if (!attackContext.facingMatches) return false;
  if (Math.abs(attackContext.deltaX) > attackContext.attackRange) return false;
  if (attackContext.absoluteDeltaY > attackContext.attackHeightTolerance) return false;
  return player.invulnerableTimer <= 0;
}

function applyBossAttackDamage(boss, player, popupDelay) {
  const dmg = boss.attackDamageCurrent ?? boss.damage;
  player.takeDamage?.(dmg, { popupDelay });
  bossAudio.playHit();
  applyPlayerInvulnerability(player);
}

function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

function handleBossDamageResult(boss, prevDead) {
  if (!prevDead && boss.isDead) {
    boss.deathTimer = Math.max(boss.deathTimer, boss.deathTimerMin);
    return;
  }
  if (!boss.hurtFrames) return;
  bossAudio.playWhimper();
  boss.hurtAnimTimer = Math.max(boss.hurtAnimTimer, boss.hurtAnimMinDuration);
  boss.setAnimation(boss.hurtFrames);
  boss.currentFrame = 0;
  boss.sprite = boss.currentAnimation[0];
}
