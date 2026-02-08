import { FACING_RIGHT, PLAYER_HURT_IMMUNITY_TIME } from "../../../config/config.js";
import { BossAudio } from "../../audio/bossAudio/bossAudio.class.js";

const bossAudio = new BossAudio();

/**
 * Creates boss attacks.
 * Uses boss to compute the result.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @returns {Object} Boss attacks.
 */
export function createBossAttacks(boss) {
  return { attack1: createBossAttack1(boss), attack2: createBossAttack2(boss) };
}

/**
 * Creates boss attack 1.
 * Triggers audio playback or updates audio state.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @returns {Object} Boss attack 1.
 */
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

/**
 * Creates boss attack 2.
 * Triggers audio playback or updates audio state.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @returns {Object} Boss attack 2.
 */
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

/**
 * Can attempt boss attack.
 * Updates the player state.
 * @param {import("../player/player.class.js").Player} playerInfo Player info.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether attempt boss attack.
 */
export function canAttemptBossAttack(playerInfo, player) {
  return !!playerInfo && !!player && !player.isDead;
}

/**
 * Can use boss height.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {number} absoluteDeltaY Absolute delta Y.
 * @returns {boolean} Whether use boss height.
 */
export function canUseBossHeight(boss, absoluteDeltaY) {
  const extraHeightTolerance = 30;
  const canUseHeight = absoluteDeltaY <= boss.attackHeightTolerance + extraHeightTolerance;
  return canUseHeight;
}

/**
 * Select boss attack.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {boolean} canAttack1 Whether attack 1.
 * @param {boolean} canAttack2 Whether attack 2.
 * @returns {*} Result value.
 */
export function selectBossAttack(boss, canAttack1, canAttack2) {
  let choice = null;
  if (canAttack1 && canAttack2) choice = boss.pickBossAttack();
  else if (canAttack1) choice = "attack1";
  else if (canAttack2) choice = "attack2";
  return choice;
}

/**
 * Returns boss attack height tolerance.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {*} attackConfiguration Attack configuration.
 * @returns {*} Boss attack height tolerance.
 */
export function getBossAttackHeightTolerance(boss, attackConfiguration) {
  const heightTolerance = boss.attackHeightTolerance + (attackConfiguration.heightAdd || 0);
  return heightTolerance;
}

/**
 * Configure boss attack.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {*} attackConfiguration Attack configuration.
 * @param {number} heightTolerance Height tolerance.
 * @param {string} attackId Attack element id.
 */
export function configureBossAttack(boss, attackConfiguration, heightTolerance, attackId) {
  boss.attackDuration = attackConfiguration.duration;
  boss.activeAttackRange = attackConfiguration.range ?? boss.attackRange;
  boss.activeHeightTolerance = heightTolerance;
  attackConfiguration.audio?.();
  boss[attackConfiguration.cooldownKey] = attackConfiguration.cooldownDuration;
  boss.lastAttackType = attackId;
}

/**
 * Resets boss run state.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 */
export function resetBossRunState(boss) {
  boss.isRunning = false;
  boss.runningBurstTimer = 0;
}

/**
 * Sets boss running.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {boolean} isRunning Whether running.
 */
export function setBossRunning(boss, isRunning) {
  boss.isRunning = isRunning;
}

/**
 * Should start running burst.
 * Updates the boss state.
 * Introduces randomness into the outcome.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @returns {boolean} Whether start running burst.
 */
export function shouldStartRunningBurst(boss) {
  return boss.runningCooldown <= 0 && Math.random() < boss.runningBurstChance;
}

/**
 * Starts boss running burst.
 * Updates the boss state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 */
export function startBossRunningBurst(boss) {
  boss.runningBurstTimer = boss.runningBurstDuration;
  boss.runningCooldown = boss.runningCooldownDuration;
  boss.isRunning = true;
}

/**
 * Can boss deal attack damage.
 * Updates the player state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether boss deal attack damage.
 */
export function canBossDealAttackDamage(boss, player) {
  return !!player && !player.isDead && !boss.isDead && !boss.hasHitDuringAttack;
}

/**
 * Returns boss attack context.
 * Updates the player state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {Object} Boss attack context.
 */
export function getBossAttackContext(boss, player) {
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

/**
 * Is boss attack contact valid.
 * Updates the player state.
 * @param {*} attackContext Attack context.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @returns {boolean} Whether boss attack contact valid.
 */
export function isBossAttackContactValid(attackContext, player) {
  if (!attackContext.facingMatches) return false;
  if (Math.abs(attackContext.deltaX) > attackContext.attackRange) return false;
  if (attackContext.absoluteDeltaY > attackContext.attackHeightTolerance) return false;
  return player.invulnerableTimer <= 0;
}

/**
 * Applies boss attack damage.
 * Triggers audio playback or updates audio state.
 * Updates the player state.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {import("../player/player.class.js").Player} player Player instance.
 * @param {*} popupDelay Popup delay.
 */
export function applyBossAttackDamage(boss, player, popupDelay) {
  const dmg = boss.attackDamageCurrent ?? boss.damage;
  player.takeDamage?.(dmg, { popupDelay });
  bossAudio.playHit();
  applyPlayerInvulnerability(player);
}

/**
 * Applies player invulnerability.
 * Updates the player state.
 * @param {import("../player/player.class.js").Player} player Player instance.
 */
function applyPlayerInvulnerability(player) {
  if (typeof player.invulnerableTimer === "number") {
    player.invulnerableTimer = Math.max(player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME);
  }
}

/**
 * Handles boss damage result.
 * Triggers audio playback or updates audio state.
 * Advances animation state and sprites.
 * @param {import("./boss.class.js").Boss} boss Boss instance.
 * @param {boolean} prevDead Prev dead.
 */
export function handleBossDamageResult(boss, prevDead) {
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
