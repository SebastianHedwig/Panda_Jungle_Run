import { MovableObject } from "../../../engine/physics/movableObject.class.js";
import { HudPopup } from "../../effects/hudPopup.class.js";
import {
  DEBUG_MODE,
  BASE_SPEED,
  PLAYER_MAX_HEARTS,
  PLAYER_SLIDE_DAMAGE,
  FACING_LEFT,
  FACING_RIGHT,
} from "../../../config/config.js";
import { PlayerAudio } from "../../audio/playerAudio.class.js";
import { updatePlayer } from "./playerUpdate.js";
import { renderPlayer } from "./playerRender.js";
import { applyDizzy, handleDeathLanding, handleFallOffWorld, respawnFromFall, startDeath, startHurt, updateHurt } from "./playerHealth.js";
import { startAttack, startShoot, updateAttack, updateShoot } from "./playerCombat.js";
import { handleLandingAudio, startSlide } from "./playerSlide.js";

const DEBUG_HITBOX = DEBUG_MODE;
const playerAudio = new PlayerAudio();
const msPerSecond = 1000;

export class Player extends MovableObject {
  constructor(
    x,
    y,
    idleFrames,
    walkFrames,
    runFrames,
    jumpFrames,
    slideFrames,
    throwFrames,
    shootFrames,
    dizzyFrames,
    hurtFrames,
    dieFrames
  ) {
    super(x, y, 120, 140);

    /** ----- ANIMATION SETS ----- */
    this.idleFrames = idleFrames;
    this.walkFrames = walkFrames;
    this.runFrames = runFrames;
    this.jumpFrames = jumpFrames;
    this.slideFrames = slideFrames;
    this.throwFrames = throwFrames;
    this.shootFrames = shootFrames;
    this.dizzyFrames = dizzyFrames;
    this.hurtFrames = hurtFrames;
    this.dieFrames = dieFrames;

    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.065;
    this.sprite = this.currentAnimation[0];

    /** ----- MOVEMENT ----- */
    this.defaultSpeed = BASE_SPEED;
    this.runMultiplier = 2;

    /** ----- SLIDE ----- */
    this.isSliding = false;
    this.slideReady = true;
    this.slideDistance = 200;
    this.slideStartX = 0;
    this.slideDirection = 1;
    this.slideSpeed = this.defaultSpeed * 2;
    this.slideBlockGrace = 0;
    this.slideHitEnemies = new Set();
    this.slideDamage = PLAYER_SLIDE_DAMAGE;
    this.slideInvulnerableAfter = 1;
    this.slideInvulnerableDuring = 0.2;
    this.wasSlidingPreviousFrame = false;
    this.slideInvulWindow = 0;

    /** ----- ATTACK ----- */
    this.isAttacking = false;
    this.attackDuration = 0.4;
    this.attackTimer = 0;
    this.attackHitDone = false;
    this.attackRange = 70;
    this.attackHeightTolerance = 15;
    this.attackQueued = false;

    /** ----- SHOOT ----- */
    this.isShooting = false;
    this.shootDuration = 0.35;
    this.shootTimer = 0;
    this.shootCooldown = 0;
    this.shootCooldownDuration = 1.35;
    this.shootFireDelay = 0.3;
    this.shootFireTimer = 0;
    this.shootHasFired = false;
    this.shootFacing = 1;
    this.bulletAmmo = 0;
    this.gunPulse = 0;

    /** ----- HURT / DEATH ----- */
    this.isHurt = false;
    this.hurtDuration = 0.5;
    this.hurtTimer = 0;
    this.hurtUseDizzy = true;
    this.hurtPhase = null;
    this.hurtPhaseTimer = 0;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.invulnerableBlinkInterval = 0.15;
    this.invulnerableBlinkWindow = 0.6;
    this.lastSafePosX = x;
    this.lastSafePosY = y;
    this.collisionDisabled = false;
    this.deathSoundPlayed = false;
    this.onDeath = null;

    /** ----- ADVANCED JUMP ----- */
    this.coyoteTime = 0.1;
    this.coyoteTimer = 0;
    this.jumpBufferTime = 0.1;
    this.jumpBufferTimer = 0;
    this.jumpCutMultiplier = 0.5;
    this.jumpHeld = false;
    this.justLanded = false;
    this.landedOnPlatform = false;

    /** ----- FACING ----- */
    this.facing = FACING_RIGHT;

    /** ----- HEART SYSTEM ----- */
    this.maxHearts = PLAYER_MAX_HEARTS;
    this.healthPoints = this.maxHearts * 2;
    this.maxHealthPoints = this.healthPoints;
    this.healthPulse = 0;

    /** ----- COINS ----- */
    this.coins = 0;
    this.hudPulse = 0;

  }

  get heartStates() {
    const heartStates = [];
    for (let heartIndex = 0; heartIndex < this.maxHearts; heartIndex++) {
      const heartHp = this.healthPoints - heartIndex * 2;
      if (heartHp >= 2) heartStates.push(2);
      else if (heartHp === 1) heartStates.push(1);
      else heartStates.push(0);
    }
    return heartStates;
  }

  getPopupPosition(offset = 30) {
    const popupX = this.x + this.width / 2; 
    const popupY = this.y - offset;
    return { popupX, popupY };
  }

  takeDamage(damageAmount = 1, options = {}) {
    if (this.isDead) return;

    this.healthPoints = Math.max(0, this.healthPoints - damageAmount);
    this.healthPulse = 1.0;

    const popupDelaySeconds = options?.popupDelay ?? 0;
    const showDamagePopup = () => {
      const { popupX, popupY } = this.getPopupPosition();
      if (this.world?.hudPopups) {
        this.world.hudPopups.push(
          new HudPopup(`-${damageAmount}❤️`, popupX, popupY, "damage")
        );
      }
    };
    if (popupDelaySeconds > 0) setTimeout(showDamagePopup, popupDelaySeconds * msPerSecond);
    else showDamagePopup();

    if (this.healthPoints <= 0) this.startDeath();
    else {
      playerAudio.playOuch();
      this.startHurt(options?.useDizzy ?? true);
    }
  }

  heal(healAmount = 1) {
    if (this.isDead) return;

    const before = this.healthPoints;
    this.healthPoints = Math.min(
      this.maxHealthPoints,
      this.healthPoints + healAmount
    );
    const gained = this.healthPoints - before;

    if (gained > 0 && this.world?.hudPopups) {
      const { popupX, popupY } = this.getPopupPosition();
      this.world.hudPopups.push(
        new HudPopup(`+${gained}❤️`, popupX, popupY, "heal")
      );
    }

    this.healthPulse = 1.0;
  }

  addCoins(coinAmount) {
    this.coins += coinAmount;
    this.hudPulse = 1.0;
  }

  addBullets(bulletAmount = 0) {
    this.bulletAmmo = Math.max(0, this.bulletAmmo + bulletAmount);
    this.gunPulse = 1.0;
  }

  markSafePosition() {
    this.lastSafePosX = this.x;
    this.lastSafePosY = this.y;
  }

  applyDizzy(dizzyDuration = 0) {
    applyDizzy(this, dizzyDuration);
  }

  startHurt(useDizzy = true) {
    startHurt(this, useDizzy);
  }

  startDeath() {
    startDeath(this, playerAudio);
  }

  handleDeathLanding(previousBottom, currentBottom) {
    handleDeathLanding(this, previousBottom, currentBottom);
  }

  startSlide() {
    startSlide(this, playerAudio);
  }

  respawnFromFall() {
    respawnFromFall(this);
  }

  handleLandingAudio() {
    handleLandingAudio(this, playerAudio);
  }

  setAnimation(frames) {
    if (this.currentAnimation !== frames) {
      this.currentAnimation = frames;
      this.currentFrame = 0;
      this.frameTime = 0;
      this.sprite = this.currentAnimation[0];
    }
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

  startAttack() {
    const started = startAttack(this, playerAudio);
    if (started) this.attackQueued = false;
    return started;
  }

  updateAttack(dt) {
    updateAttack(this, dt, playerAudio);
  }

  updateHurt(dt) {
    updateHurt(this, dt);
  }

  startShoot() {
    return startShoot(this, playerAudio);
  }

  updateShoot(dt) {
    updateShoot(this, dt);
  }

  handleFallOffWorld(grounded, bottom, canvasHeight) {
    handleFallOffWorld(this, grounded, bottom, canvasHeight);
  }

  update(dt, input) {
    updatePlayer(this, dt, input, playerAudio);
  }

  render(ctx, camera) {
    renderPlayer(this, ctx, camera, { debugHitbox: DEBUG_HITBOX });
  }

  getHitbox() {
    const shrinkX = this.width * 0.5;
    const shrinkY = this.height * 0.2;
    return {
      x: this.x + shrinkX / 2,
      y: this.y + shrinkY,
      width: this.width - shrinkX,
      height: this.height - shrinkY,
    };
  }

}
