import { HudPopup } from "../../effects/hudPopup.class.js";
import { PLAYER_FALL_DAMAGE } from "../../../config/config.js";

const msPerSecond = 1000;
const fallbackFrames = 1;
const dizzyFrameDurationMultiplier = 2;

export function takeDamage(player, damageAmount = 1, hitEffects = {}, playerAudio) {
  if (player.isDead) return;

  player.healthPoints = Math.max(0, player.healthPoints - damageAmount);
  player.healthPulse = 1.0;

  const popupDelaySeconds = hitEffects?.popupDelay ?? 0;
  const addPopup = () => {
    if (player.world?.hudPopups) {
      const { popupX, popupY } = player.getPopupPosition();
      player.world.hudPopups.push(
        new HudPopup(
          `-${damageAmount}❤️`,
          popupX,
          popupY,
          "damage"
        )
      );
    }
  };
  if (popupDelaySeconds > 0) setTimeout(addPopup, popupDelaySeconds * msPerSecond);
  else addPopup();

  if (player.healthPoints <= 0) startDeath(player, playerAudio);
  else {
    playerAudio.playOuch();
    startHurt(player, hitEffects?.useDizzy ?? true);
  }
}

export function heal(player, healAmount = 1) {
  if (player.isDead) return;

  const before = player.healthPoints;
  player.healthPoints = Math.min(player.maxHealthPoints, player.healthPoints + healAmount);
  const gained = player.healthPoints - before;

  if (gained > 0 && player.world?.hudPopups) {
    const { popupX, popupY } = player.getPopupPosition();
    player.world.hudPopups.push(
      new HudPopup(`+${gained}❤️`, popupX, popupY, "heal")
    );
  }

  player.healthPulse = 1.0;
}

export function applyDizzy(player, dizzyDuration = 0) {
  if (player.isDead) return;
  const base =
    (player.dizzyFrames?.length || fallbackFrames) *
      player.frameSpeed *
      dizzyFrameDurationMultiplier ||
    player.hurtDuration;
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
  if (!player.hurtUseDizzy) {
    player.invulnerableTimer = Math.max(
      player.invulnerableTimer,
      player.invulnerableBlinkWindow
    );
    player.isHurt = false;
    return;
  }

  player.isHurt = true;
  const hurtDuration = (player.hurtFrames?.length || fallbackFrames) * player.frameSpeed;
  const dizzyDuration =
    player.hurtUseDizzy && player.dizzyFrames
      ? player.dizzyFrames.length *
        player.frameSpeed *
        dizzyFrameDurationMultiplier
      : 0;

  player.hurtPhase = "hurt";
  player.hurtPhaseTimer = hurtDuration;
  player.invulnerableTimer = hurtDuration + dizzyDuration + player.invulnerableBlinkWindow;

  player.isAttacking = false;
  player.isShooting = false;
  if (player.hurtUseDizzy) {
    player.setAnimation(player.hurtFrames || player.dizzyFrames);
    player.currentFrame = 0;
  }
}

export function updateHurt(player, dt) {
  if (!player.isHurt) return;
  player.hurtPhaseTimer -= dt;
  if (player.hurtPhaseTimer > 0) return;

  if (player.hurtUseDizzy && player.hurtPhase === "hurt" && player.dizzyFrames) {
    player.hurtPhase = "dizzy";
    player.hurtPhaseTimer =
      player.dizzyFrames.length *
        player.frameSpeed *
        dizzyFrameDurationMultiplier ||
      player.hurtDuration;
    player.setAnimation(player.dizzyFrames);
    player.currentFrame = 0;
    return;
  }

  player.isHurt = false;
  player.hurtPhase = null;
}

export function startDeath(player, playerAudio) {
  if (player.isDead) return;
  player.isDead = true;
  if (typeof player.onDeath === "function") {
    player.onDeath(player);
  }
  player.world?.audio?.stopCrossfadeAndCleanup?.();
  player.world?.bossAudioPlayer?.stopAndCleanupBossAudio?.();
  if (!player.deathSoundPlayed) {
    playerAudio.playDead();
    player.deathSoundPlayed = true;
  }
  player.isHurt = false;
  player.isAttacking = false;
  player.isShooting = false;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = true;
  player.setAnimation(player.dieFrames);
  player.currentFrame = 0;
  player.invulnerableTimer = 0;
  player.collisionDisabled = true;
  player.deathDone = false;
}

export function handleDeathLanding(player, previousBottom, currentBottom) {
  const platforms = player.world?.platforms || [];
  const canvasHeight = player.world?.canvas?.height;
  const groundLevel = player.world?.baseGround ?? canvasHeight;

  const playerLeft = player.x;
  const playerRight = player.x + player.width;

  for (const platform of platforms) {
    if (!platform.supportsLanding) continue;
    const overlapsX = playerRight > platform.left && playerLeft < platform.right;
    const crossingTop =
      player.velocityY > 0 &&
      previousBottom <= platform.top &&
      currentBottom >= platform.top;
    if (overlapsX && crossingTop) {
      const landingTopPosition = platform.top - player.height;
      player.y = landingTopPosition;
      player.velocityY = 0;
      player.onGround = true;
      return;
    }
  }

  if (currentBottom >= groundLevel) {
    const groundTopPosition = groundLevel - player.height;
    player.y = groundTopPosition;
    player.velocityY = 0;
    player.onGround = true;
  }
}

export function respawnFromFall(player) {
  if (player.isDead) return;

  player.healthPoints = Math.max(0, player.healthPoints - PLAYER_FALL_DAMAGE);
  player.healthPulse = 1.0;

  if (player.healthPoints <= 0) {
    player.startDeath();
    return;
  }

  player.x = player.lastSafePosX ?? player.x;
  const respawnYOffset = 5;
  player.y = (player.lastSafePosY ?? player.y) - respawnYOffset;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = true;

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
