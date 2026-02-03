import { MovableObject } from "../../../engine/physics/movableObject.class.js";
import { HudPopup } from "../../effects/hudPopup.class.js";
import { DEBUG_MODE, BASE_SPEED, PLAYER_MAX_HEARTS, PLAYER_SLIDE_DAMAGE, FACING_LEFT, FACING_RIGHT } from "../../../config/config.js";
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
  constructor(x, y, idleFrames, walkFrames, runFrames, jumpFrames, slideFrames, throwFrames, shootFrames, dizzyFrames, hurtFrames, dieFrames) {
    super(x, y, 120, 140);
    this.initializeAnimationSets({ idleFrames, walkFrames, runFrames, jumpFrames, slideFrames, throwFrames, shootFrames, dizzyFrames, hurtFrames, dieFrames });
    this.initializeAnimationState();
    this.initializeMovement();
    this.initializeSlide();
    this.initializeAttack();
    this.initializeShoot();
    this.initializeHurtDeath(x, y);
    this.initializeAdvancedJump();
    this.initializeFacing();
    this.initializeHeartSystem();
    this.initializeCoins();
  }

  initializeAnimationSets(frames) {
    Object.assign(this, frames);
  }

  initializeAnimationState() {
    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.065;
    this.sprite = this.currentAnimation[0];
  }

  initializeMovement() {
    this.defaultSpeed = BASE_SPEED;
    this.runMultiplier = 2;
  }

  initializeSlide() {
    Object.assign(this, {
      isSliding: false, slideReady: true, slideDistance: 200, slideStartX: 0,
      slideDirection: 1, slideSpeed: this.defaultSpeed * 2, slideBlockGrace: 0,
      slideHitEnemies: new Set(), slideDamage: PLAYER_SLIDE_DAMAGE,
      slideInvulnerableAfter: 1, slideInvulnerableDuring: 0.2,
      wasSlidingPreviousFrame: false, slideInvulWindow: 0,
    });
  }

  initializeAttack() {
    Object.assign(this, {
      isAttacking: false, attackDuration: 0.4, attackTimer: 0, attackHitDone: false,
      attackRange: 70, attackHeightTolerance: 15, attackQueued: false,
    });
  }

  initializeShoot() {
    Object.assign(this, {
      isShooting: false, shootDuration: 0.35, shootTimer: 0, shootCooldown: 0,
      shootCooldownDuration: 1.35, shootFireDelay: 0.3, shootFireTimer: 0,
      shootHasFired: false, shootFacing: 1, bulletAmmo: 0, gunPulse: 0,
    });
  }

  initializeHurtDeath(x, y) {
    this.initializeHurtState();
    this.initializeDeathState(x, y);
  }

  initializeHurtState() {
    Object.assign(this, {
      isHurt: false, hurtDuration: 0.5, hurtTimer: 0, hurtUseDizzy: true,
      hurtPhase: null, hurtPhaseTimer: 0, invulnerableTimer: 0,
      invulnerableBlinkInterval: 0.15, invulnerableBlinkWindow: 0.6,
    });
  }

  initializeDeathState(x, y) {
    Object.assign(this, {
      isDead: false, lastSafePosX: x, lastSafePosY: y, collisionDisabled: false,
      deathSoundPlayed: false, onDeath: null,
    });
  }

  initializeAdvancedJump() {
    Object.assign(this, {
      coyoteTime: 0.1, coyoteTimer: 0, jumpBufferTime: 0.1, jumpBufferTimer: 0,
      jumpCutMultiplier: 0.5, jumpHeld: false, justLanded: false, landedOnPlatform: false,
    });
  }

  initializeFacing() {
    this.facing = FACING_RIGHT;
  }

  initializeHeartSystem() {
    this.maxHearts = PLAYER_MAX_HEARTS;
    this.healthPoints = this.maxHearts * 2;
    this.maxHealthPoints = this.healthPoints;
    this.healthPulse = 0;
  }

  initializeCoins() {
    this.coins = 0;
    this.hudPulse = 0;
  }

  get heartStates() {
    const heartStates = [];
    // heartStates: 2 = full, 1 = half, 0 = empty
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
    this.applyDamageAmount(damageAmount);
    this.queueDamagePopup(damageAmount, options);
    this.handleDamageOutcome(options);
  }

  applyDamageAmount(damageAmount) {
    this.healthPoints = Math.max(0, this.healthPoints - damageAmount);
    this.healthPulse = 1.0;
  }

  queueDamagePopup(damageAmount, options) {
    const popupDelaySeconds = options?.popupDelay ?? 0;
    const showDamagePopup = () => this.addDamagePopup(damageAmount);
    this.schedulePopup(showDamagePopup, popupDelaySeconds);
  }

  schedulePopup(popupAction, popupDelaySeconds) {
    if (popupDelaySeconds > 0) setTimeout(popupAction, popupDelaySeconds * msPerSecond);
    else popupAction();
  }

  addDamagePopup(damageAmount) {
    const { popupX, popupY } = this.getPopupPosition();
    if (this.world?.hudPopups) {
      this.world.hudPopups.push(
        new HudPopup(`-${damageAmount}❤️`, popupX, popupY, "damage")
      );
    }
  }

  handleDamageOutcome(options) {
    if (this.healthPoints <= 0) this.startDeath();
    else {
      playerAudio.playOuch();
      this.startHurt(options?.useDizzy ?? true);
    }
  }

  heal(healAmount = 1) {
    if (this.isDead) return;
    const gained = this.applyHealAmount(healAmount);
    this.addHealPopup(gained);
    this.healthPulse = 1.0;
  }

  applyHealAmount(healAmount) {
    const before = this.healthPoints;
    this.healthPoints = Math.min(
      this.maxHealthPoints,
      this.healthPoints + healAmount
    );
    return this.healthPoints - before;
  }

  addHealPopup(gained) {
    if (gained <= 0 || !this.world?.hudPopups) return;
    const { popupX, popupY } = this.getPopupPosition();
    this.world.hudPopups.push(
      new HudPopup(`+${gained}❤️`, popupX, popupY, "heal")
    );
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
      this.currentFrame = (this.currentFrame + 1) % this.currentAnimation.length;
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
