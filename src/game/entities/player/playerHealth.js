import { HudPopup } from "../../effects/hudPopup.class.js";
import { PLAYER_FALL_DAMAGE } from "../../../config/config.js";

export function takeDamage(player, amount = 1, opts = {}, playerAudio) {
  if (player.isDead) return;

  player.healthPoints = Math.max(0, player.healthPoints - amount);
  player.healthPulse = 1.0;

  const popupDelay = opts?.popupDelay ?? 0;
  const addPopup = () => {
    if (player.world?.hudPopups) {
      player.world.hudPopups.push(
        new HudPopup(
          `-${amount}ƒ?Ï‹÷?`,
          player.x + player.width / 2,
          player.y - 30,
          "damage"
        )
      );
    }
  };
  if (popupDelay > 0) setTimeout(addPopup, popupDelay * 1000);
  else addPopup();

  if (player.healthPoints <= 0) startDeath(player, playerAudio);
  else {
    playerAudio.playOuch();
    startHurt(player, opts?.useDizzy ?? true);
  }
}

export function heal(player, amount = 1) {
  if (player.isDead) return;

  const before = player.healthPoints;
  player.healthPoints = Math.min(player.maxHealthPoints, player.healthPoints + amount);
  const gained = player.healthPoints - before;

  if (gained > 0 && player.world?.hudPopups) {
    player.world.hudPopups.push(
      new HudPopup(
        `+${gained}ƒ?Ï‹÷?`,
        player.x + player.width / 2,
        player.y - 30,
        "heal"
      )
    );
  }

  player.healthPulse = 1.0;
}

export function applyDizzy(player, duration = 0) {
  if (player.isDead) return;
  const base =
    (player.dizzyFrames?.length || 1) * player.frameSpeed * 2 || player.hurtDuration;
  player.hurtPhase = "dizzy";
  player.isHurt = true;
  player.hurtUseDizzy = true;
  player.hurtPhaseTimer = duration > 0 ? duration : base;
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
  const hurtDuration = (player.hurtFrames?.length || 1) * player.frameSpeed;
  const dizzyDuration =
    player.hurtUseDizzy && player.dizzyFrames
      ? player.dizzyFrames.length * player.frameSpeed * 2
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
      player.dizzyFrames.length * player.frameSpeed * 2 || player.hurtDuration;
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
  player.world?.audio?.stop?.();
  player.world?.bossAudioPlayer?.stop?.();
  if (!player.deathSoundPlayed) {
    playerAudio.playDead();
    player.deathSoundPlayed = true;
  }
  player.isHurt = false;
  player.isAttacking = false;
  player.isShooting = false;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.setAnimation(player.dieFrames);
  player.currentFrame = 0;
  player.invulnerableTimer = 0;
  player.collisionDisabled = true;
  player.deathDone = false;
}

export function handleDeathLanding(player, prevBottom, currBottom) {
  const platforms = player.world?.platforms || [];
  const canvasH = player.world?.canvas?.height ?? 1000;
  const ground = player.world?.baseGround ?? canvasH;

  for (const p of platforms) {
    if (!p.supportsLanding) continue;
    const overlapsX = player.x + player.width > p.left && player.x < p.right;
    if (overlapsX && player.vy > 0 && prevBottom <= p.top && currBottom >= p.top) {
      player.y = p.top - player.height;
      player.vy = 0;
      player.onGround = true;
      return;
    }
  }

  if (currBottom >= ground) {
    player.y = ground - player.height;
    player.vy = 0;
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

  player.x = player.lastSafeX ?? player.x;
  player.y = (player.lastSafeY ?? player.y) - 5;
  player.vx = 0;
  player.vy = 0;
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
  if (player.vy >= 0 && bottom >= canvasHeight + player.height) {
    player.respawnFromFall();
  }
}

