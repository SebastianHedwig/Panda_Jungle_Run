import { HudPopup } from "../../effects/hudPopup.class.js";
import { PLAYER_FALL_DAMAGE } from "../../../config/config.js";

const msPerSecond = 1000;
const dizzyFrameDurationMultiplier = 2;

export function takeDamage(player, damageAmount = 1, hitEffects = {}, playerAudio) {
  if (player.isDead) return;
  applyDamageAmount(player, damageAmount);
  queueDamagePopup(player, damageAmount, hitEffects);
  handleDamageOutcome(player, hitEffects, playerAudio);
}

function applyDamageAmount(player, damageAmount) {
  player.healthPoints = Math.max(0, player.healthPoints - damageAmount);
  player.healthPulse = 1.0;
}

function queueDamagePopup(player, damageAmount, hitEffects) {
  const popupDelaySeconds = hitEffects?.popupDelay ?? 0;
  const addPopup = () => addDamagePopup(player, damageAmount);
  schedulePopup(addPopup, popupDelaySeconds);
}

function schedulePopup(addPopup, popupDelaySeconds) {
  if (popupDelaySeconds > 0) setTimeout(addPopup, popupDelaySeconds * msPerSecond);
  else addPopup();
}

function addDamagePopup(player, damageAmount) {
  if (!player.world?.hudPopups) return;
  const { popupX, popupY } = player.getPopupPosition();
  player.world.hudPopups.push(new HudPopup(`-${damageAmount}❤️`, popupX, popupY, "damage"));
}

function handleDamageOutcome(player, hitEffects, playerAudio) {
  if (player.healthPoints <= 0) return startDeath(player, playerAudio);
  playerAudio.playOuch();
  startHurt(player, hitEffects?.useDizzy ?? true);
}

export function heal(player, healAmount = 1) {
  if (player.isDead) return;
  const gained = applyHealAmount(player, healAmount);
  addHealPopup(player, gained);
  player.healthPulse = 1.0;
}

function applyHealAmount(player, healAmount) {
  const before = player.healthPoints;
  player.healthPoints = Math.min(player.maxHealthPoints, player.healthPoints + healAmount);
  return player.healthPoints - before;
}

function addHealPopup(player, gained) {
  if (gained <= 0 || !player.world?.hudPopups) return;
  const { popupX, popupY } = player.getPopupPosition();
  player.world.hudPopups.push(new HudPopup(`+${gained}❤️`, popupX, popupY, "heal"));
}

export function applyDizzy(player, dizzyDuration = 0) {
  if (player.isDead) return;
  const base = player.dizzyFrames?.length * player.frameSpeed * dizzyFrameDurationMultiplier;
  player.hurtPhase = "dizzy";
  player.isHurt = true;
  player.hurtUseDizzy = true;
  player.hurtPhaseTimer = dizzyDuration > 0 ? dizzyDuration : base;
  player.setAnimation(player.dizzyFrames || player.hurtFrames);
  player.currentFrame = 0;
}

export function startHurt(player, useDizzy = true) {
  if (player.isDead) return;
  player.hurtUseDizzy = !!useDizzy;
  if (!player.hurtUseDizzy) return applyNoDizzyHurt(player);
  beginHurtPhases(player);
}

function applyNoDizzyHurt(player) {
  player.invulnerableTimer = Math.max(player.invulnerableTimer, player.invulnerableBlinkWindow);
  player.isHurt = false;
}

function beginHurtPhases(player) {
  player.isHurt = true;
  const { hurtDuration, dizzyDuration } = getHurtDurations(player);
  player.hurtPhase = "hurt";
  player.hurtPhaseTimer = hurtDuration;
  player.invulnerableTimer = hurtDuration + dizzyDuration + player.invulnerableBlinkWindow;
  resetCombatOnHurt(player);
  if (player.hurtUseDizzy) setHurtAnimation(player);
}

function getHurtDurations(player) {
  const hurtDuration = (player.hurtFrames?.length) * player.frameSpeed;
  const dizzyDuration = player.hurtUseDizzy && player.dizzyFrames
    ? player.dizzyFrames.length * player.frameSpeed * dizzyFrameDurationMultiplier
    : 0;
  return { hurtDuration, dizzyDuration };
}

function resetCombatOnHurt(player) {
  player.isAttacking = false;
  player.isShooting = false;
}

function setHurtAnimation(player) {
  player.setAnimation(player.dizzyFrames);
  player.currentFrame = 0;
}

export function updateHurt(player, dt) {
  if (!player.isHurt) return;
  player.hurtPhaseTimer -= dt;
  if (player.hurtPhaseTimer > 0) return;
  if (shouldEnterDizzy(player)) return startDizzyPhase(player);
  endHurt(player);
}

function shouldEnterDizzy(player) {
  return player.hurtUseDizzy && player.hurtPhase === "hurt" && player.dizzyFrames;
}

function startDizzyPhase(player) {
  player.hurtPhase = "dizzy";
  player.hurtPhaseTimer = getDizzyPhaseDuration(player);
  player.setAnimation(player.dizzyFrames);
  player.currentFrame = 0;
}

function getDizzyPhaseDuration(player) {
  return (
    player.dizzyFrames.length *
      player.frameSpeed *
      dizzyFrameDurationMultiplier ||
    player.hurtDuration
  );
}

function endHurt(player) {
  player.isHurt = false;
  player.hurtPhase = null;
}

export function startDeath(player, playerAudio) {
  if (player.isDead) return;
  markPlayerDead(player);
  notifyDeathHandler(player);
  stopDeathAudio(player);
  playDeathSoundOnce(player, playerAudio);
  resetDeathState(player);
}

function markPlayerDead(player) {
  player.isDead = true;
}

function notifyDeathHandler(player) {
  if (typeof player.onDeath === "function") {
    player.onDeath(player);
  }
}

function stopDeathAudio(player) {
  player.world?.audio?.stopCrossfadeAndCleanup?.();
  player.world?.bossAudioPlayer?.stopAndCleanupBossAudio?.();
}

function playDeathSoundOnce(player, playerAudio) {
  if (!player.deathSoundPlayed) {
    playerAudio.playDead();
    player.deathSoundPlayed = true;
  }
}

function resetDeathState(player) {
  resetDeathCombat(player);
  resetDeathPhysics(player);
  setDeathAnimation(player);
  player.invulnerableTimer = 0;
  player.collisionDisabled = true;
  player.deathDone = false;
}

function resetDeathCombat(player) {
  player.isHurt = false;
  player.isAttacking = false;
  player.isShooting = false;
}

function resetDeathPhysics(player) {
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = true;
}

function setDeathAnimation(player) {
  player.setAnimation(player.dieFrames);
  player.currentFrame = 0;
}

export function handleDeathLanding(player, previousBottom, currentBottom) {
  const landingContext = getDeathLandingContext(player);
  if (tryLandOnPlatform(player, landingContext, previousBottom, currentBottom)) return;
  landOnGroundIfNeeded(player, landingContext, currentBottom);
}

function getDeathLandingContext(player) {
  const platforms = player.world?.platforms || [];
  const canvasHeight = player.world?.canvas?.height;
  const groundLevel = player.world?.baseGround ?? canvasHeight;
  const playerLeft = player.x;
  const playerRight = player.x + player.width;
  return { platforms, groundLevel, playerLeft, playerRight };
}

function tryLandOnPlatform(player, landingContext, previousBottom, currentBottom) {
  for (const platform of landingContext.platforms) {
    if (!canLandOnPlatform(player, platform, landingContext, previousBottom, currentBottom)) continue;
    applyPlatformLanding(player, platform);
    return true;
  }
  return false;
}

function canLandOnPlatform(player, platform, landingContext, previousBottom, currentBottom) {
  if (!platform.supportsLanding) return false;
  const overlapsX = landingContext.playerRight > platform.left && landingContext.playerLeft < platform.right;
  const crossingTop = isCrossingPlatformTop(player, platform, previousBottom, currentBottom);
  return overlapsX && crossingTop;
}

function isCrossingPlatformTop(player, platform, previousBottom, currentBottom) {
  return (
    player.velocityY > 0 &&
    previousBottom <= platform.top &&
    currentBottom >= platform.top
  );
}

function applyPlatformLanding(player, platform) {
  const landingTopPosition = platform.top - player.height;
  player.y = landingTopPosition;
  player.velocityY = 0;
  player.onGround = true;
}

function landOnGroundIfNeeded(player, landingContext, currentBottom) {
  if (currentBottom < landingContext.groundLevel) return;
  const groundTopPosition = landingContext.groundLevel - player.height;
  player.y = groundTopPosition;
  player.velocityY = 0;
  player.onGround = true;
}

export function respawnFromFall(player) {
  if (player.isDead) return;
  applyFallDamage(player);
  if (player.healthPoints <= 0) return player.startDeath();
  respawnAtSafePosition(player);
  resetPostRespawnState(player);
}

function applyFallDamage(player) {
  player.healthPoints = Math.max(0, player.healthPoints - PLAYER_FALL_DAMAGE);
  player.healthPulse = 1.0;
}

function respawnAtSafePosition(player) {
  player.x = player.lastSafePosX ?? player.x;
  const respawnYOffset = 5;
  player.y = (player.lastSafePosY ?? player.y) - respawnYOffset;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = true;
}

function resetPostRespawnState(player) {
  player.invulnerableTimer = 1.0;
  player.isHurt = false;
  player.isAttacking = false;
  player.isShooting = false;
  player.setAnimation(player.idleFrames);
  player.currentFrame = 0;
}

export function handleFallOffWorld(player, grounded, bottom, canvasHeight) {
  if (player.invulnerableTimer > 0) return;
  if (grounded) return;
  if (player.velocityY >= 0 && bottom >= canvasHeight + player.height) {
    player.respawnFromFall();
  }
}
