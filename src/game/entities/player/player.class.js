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
  /**
   * Creates a new instance.
   * Applies physics updates like gravity and velocity.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} idleFrames Idle frames.
   * @param {*} walkFrames Walk frames.
   * @param {*} runFrames Run frames.
   * @param {*} jumpFrames Jump frames.
   * @param {*} slideFrames Slide frames.
   * @param {*} throwFrames Throw frames.
   * @param {*} shootFrames Shoot frames.
   * @param {*} dizzyFrames Dizzy frames.
   * @param {*} hurtFrames Hurt frames.
   * @param {*} dieFrames Die frames.
   */
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

  /**
   * Initializes animation sets.
   * Uses frames to perform the operation.
   * @param {*} frames Frames.
   */
  initializeAnimationSets(frames) {
    Object.assign(this, frames);
  }

  /**
   * Initializes animation state.
   * Advances animation state and sprites.
   * Updates the instance state.
   */
  initializeAnimationState() {
    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.065;
    this.sprite = this.currentAnimation[0];
  }

  /**
   * Initializes movement.
   * Updates the instance state.
   */
  initializeMovement() {
    this.defaultSpeed = BASE_SPEED;
    this.runMultiplier = 2;
  }

  /**
   * Initializes slide.
   * Updates the instance state.
   */
  initializeSlide() {
    Object.assign(this, {
      isSliding: false, slideReady: true, slideDistance: 200, slideStartX: 0,
      slideDirection: 1, slideSpeed: this.defaultSpeed * 2, slideBlockGrace: 0,
      slideHitEnemies: new Set(), slideDamage: PLAYER_SLIDE_DAMAGE,
      slideInvulnerableAfter: 1, slideInvulnerableDuring: 0.2,
      wasSlidingPreviousFrame: false, slideInvulWindow: 0,
    });
  }

  /**
   * Initializes attack.
   */
  initializeAttack() {
    Object.assign(this, {
      isAttacking: false, attackDuration: 0.4, attackTimer: 0, attackHitDone: false,
      attackRange: 70, attackHeightTolerance: 15, attackQueued: false,
    });
  }

  /**
   * Initializes shoot.
   */
  initializeShoot() {
    Object.assign(this, {
      isShooting: false, shootDuration: 0.35, shootTimer: 0, shootCooldown: 0,
      shootCooldownDuration: 1.35, shootFireDelay: 0.3, shootFireTimer: 0,
      shootHasFired: false, shootFacing: 1, bulletAmmo: 0, gunPulse: 0,
    });
  }

  /**
   * Initializes hurt death.
   * Updates the instance state.
   * Initializes hurt state, death state.
   * @param {number} x X.
   * @param {number} y Y.
   */
  initializeHurtDeath(x, y) {
    this.initializeHurtState();
    this.initializeDeathState(x, y);
  }

  /**
   * Initializes hurt state.
   */
  initializeHurtState() {
    Object.assign(this, {
      isHurt: false, hurtDuration: 0.5, hurtTimer: 0, hurtUseDizzy: true,
      hurtPhase: null, hurtPhaseTimer: 0, invulnerableTimer: 0,
      invulnerableBlinkInterval: 0.15, invulnerableBlinkWindow: 0.6,
    });
  }

  /**
   * Initializes death state.
   * Performs hitbox or collision checks.
   * @param {number} x X.
   * @param {number} y Y.
   */
  initializeDeathState(x, y) {
    Object.assign(this, {
      isDead: false, lastSafePosX: x, lastSafePosY: y, collisionDisabled: false,
      deathSoundPlayed: false, onDeath: null,
    });
  }

  /**
   * Initializes advanced jump.
   * Applies physics updates like gravity and velocity.
   */
  initializeAdvancedJump() {
    Object.assign(this, {
      coyoteTime: 0.1, coyoteTimer: 0, jumpBufferTime: 0.1, jumpBufferTimer: 0,
      jumpCutMultiplier: 0.5, jumpHeld: false, justLanded: false, landedOnPlatform: false,
    });
  }

  /**
   * Initializes facing.
   * Updates the instance state.
   */
  initializeFacing() {
    this.facing = FACING_RIGHT;
  }

  /**
   * Initializes heart system.
   * Updates the instance state.
   */
  initializeHeartSystem() {
    this.maxHearts = PLAYER_MAX_HEARTS;
    this.healthPoints = this.maxHearts * 2;
    this.maxHealthPoints = this.healthPoints;
    this.healthPulse = 0;
  }

  /**
   * Initializes coins.
   * Updates the instance state.
   */
  initializeCoins() {
    this.coins = 0;
    this.hudPulse = 0;
  }

  /**
   * Heart states.
   * Updates the instance state.
   * @returns {*} Result value.
   */
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

  /**
   * Returns popup position. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} [offset] Offset.
   * @returns {Object} Popup position.
   */
  getPopupPosition(offset = 30) {
    const popupX = this.x + this.width / 2; 
    const popupY = this.y - offset;
    return { popupX, popupY };
  }

  /**
   * Take damage. If omitted, default values are used.
   * Uses damageAmount, options to perform the operation.
   * @param {number} [damageAmount] Damage amount.
   * @param {Object} [options] Configuration options.
   */
  takeDamage(damageAmount = 1, options = {}) {
    if (this.isDead) return;
    this.applyDamageAmount(damageAmount);
    this.queueDamagePopup(damageAmount, options);
    this.handleDamageOutcome(options);
  }

  /**
   * Applies damage amount.
   * Updates the instance state.
   * @param {number} damageAmount Damage amount.
   */
  applyDamageAmount(damageAmount) {
    this.healthPoints = Math.max(0, this.healthPoints - damageAmount);
    this.healthPulse = 1.0;
  }

  /**
   * Queues damage popup.
   * Updates the instance state.
   * @param {number} damageAmount Damage amount.
   * @param {Object} options Configuration options.
   */
  queueDamagePopup(damageAmount, options) {
    const popupDelaySeconds = options?.popupDelay ?? 0;
    /**
     * Show damage popup.
     * Updates the instance state.
     * @returns {*} Result value.
     */
    const showDamagePopup = () => this.addDamagePopup(damageAmount);
    this.schedulePopup(showDamagePopup, popupDelaySeconds);
  }

  /**
   * Schedules popup.
   * Schedules timed actions.
   * @param {Function} popupAction Popup action.
   * @param {*} popupDelaySeconds Popup delay seconds.
   */
  schedulePopup(popupAction, popupDelaySeconds) {
    if (popupDelaySeconds > 0) setTimeout(popupAction, popupDelaySeconds * msPerSecond);
    else popupAction();
  }

  /**
   * Adds damage popup.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @param {number} damageAmount Damage amount.
   */
  addDamagePopup(damageAmount) {
    const { popupX, popupY } = this.getPopupPosition();
    if (this.world?.hudPopups) {
      this.world.hudPopups.push(
        new HudPopup(`-${damageAmount}❤️`, popupX, popupY, "damage")
      );
    }
  }

  /**
   * Handles damage outcome.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {Object} options Configuration options.
   */
  handleDamageOutcome(options) {
    if (this.healthPoints <= 0) this.startDeath();
    else {
      playerAudio.playOuch();
      this.startHurt(options?.useDizzy ?? true);
    }
  }

  /**
   * Heal. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} [healAmount] Heal amount.
   */
  heal(healAmount = 1) {
    if (this.isDead) return;
    const gained = this.applyHealAmount(healAmount);
    this.addHealPopup(gained);
    this.healthPulse = 1.0;
  }

  /**
   * Applies heal amount.
   * Updates the instance state.
   * @param {number} healAmount Heal amount.
   * @returns {*} Result value.
   */
  applyHealAmount(healAmount) {
    const before = this.healthPoints;
    this.healthPoints = Math.min(
      this.maxHealthPoints,
      this.healthPoints + healAmount
    );
    return this.healthPoints - before;
  }

  /**
   * Adds heal popup.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @param {*} gained Gained.
   */
  addHealPopup(gained) {
    if (gained <= 0 || !this.world?.hudPopups) return;
    const { popupX, popupY } = this.getPopupPosition();
    this.world.hudPopups.push(
      new HudPopup(`+${gained}❤️`, popupX, popupY, "heal")
    );
  }

  /**
   * Adds coins.
   * Updates the instance state.
   * @param {number} coinAmount Coin amount.
   */
  addCoins(coinAmount) {
    this.coins += coinAmount;
    this.hudPulse = 1.0;
  }

  /**
   * Adds bullets. If omitted, default values are used.
   * Updates the instance state.
   * @param {number} [bulletAmount] Bullet amount.
   */
  addBullets(bulletAmount = 0) {
    this.bulletAmmo = Math.max(0, this.bulletAmmo + bulletAmount);
    this.gunPulse = 1.0;
  }

  /**
   * Marks safe position.
   * Updates the instance state.
   */
  markSafePosition() {
    this.lastSafePosX = this.x;
    this.lastSafePosY = this.y;
  }

  /**
   * Applies dizzy. If omitted, default values are used.
   * Uses dizzyDuration to perform the operation.
   * @param {number} [dizzyDuration] Dizzy duration.
   */
  applyDizzy(dizzyDuration = 0) {
    applyDizzy(this, dizzyDuration);
  }

  /**
   * Starts hurt. If omitted, default values are used.
   * Uses useDizzy to perform the operation.
   * @param {*} [useDizzy] Use dizzy.
   */
  startHurt(useDizzy = true) {
    startHurt(this, useDizzy);
  }

  /**
   * Starts death.
   * Triggers audio playback or updates audio state.
   */
  startDeath() {
    startDeath(this, playerAudio);
  }

  /**
   * Handles death landing.
   * Uses previousBottom, currentBottom to perform the operation.
   * @param {number} previousBottom Previous bottom.
   * @param {number} currentBottom Current bottom.
   */
  handleDeathLanding(previousBottom, currentBottom) {
    handleDeathLanding(this, previousBottom, currentBottom);
  }

  /**
   * Starts slide.
   * Triggers audio playback or updates audio state.
   */
  startSlide() {
    startSlide(this, playerAudio);
  }

  /**
   * Respawn from fall.
   * Spawns visual feedback effects.
   */
  respawnFromFall() {
    respawnFromFall(this);
  }

  /**
   * Handles landing audio.
   * Triggers audio playback or updates audio state.
   */
  handleLandingAudio() {
    handleLandingAudio(this, playerAudio);
  }

  /**
   * Sets animation.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {*} frames Frames.
   */
  setAnimation(frames) {
    if (this.currentAnimation !== frames) {
      this.currentAnimation = frames;
      this.currentFrame = 0;
      this.frameTime = 0;
      this.sprite = this.currentAnimation[0];
    }
  }

  /**
   * Animate.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  animate(dt) {
    this.frameTime += dt;
    if (this.frameTime >= this.frameSpeed) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.currentAnimation.length;
      this.sprite = this.currentAnimation[this.currentFrame];
    }
  }

  /**
   * Starts attack.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @returns {*} Result value.
   */
  startAttack() {
    const started = startAttack(this, playerAudio);
    if (started) this.attackQueued = false;
    return started;
  }

  /**
   * Updates attack.
   * Triggers audio playback or updates audio state.
   * @param {number} dt Delta time in seconds.
   */
  updateAttack(dt) {
    updateAttack(this, dt, playerAudio);
  }

  /**
   * Updates hurt.
   * Uses dt to perform the operation.
   * @param {number} dt Delta time in seconds.
   */
  updateHurt(dt) {
    updateHurt(this, dt);
  }

  /**
   * Starts shoot.
   * Triggers audio playback or updates audio state.
   * @returns {*} Result value.
   */
  startShoot() {
    return startShoot(this, playerAudio);
  }

  /**
   * Updates shoot.
   * Uses dt to perform the operation.
   * @param {number} dt Delta time in seconds.
   */
  updateShoot(dt) {
    updateShoot(this, dt);
  }

  /**
   * Handles fall off world.
   * Uses grounded, bottom, canvasHeight to perform the operation.
   * @param {*} grounded Grounded.
   * @param {number} bottom Bottom.
   * @param {boolean} canvasHeight Canvas height.
   */
  handleFallOffWorld(grounded, bottom, canvasHeight) {
    handleFallOffWorld(this, grounded, bottom, canvasHeight);
  }

  /**
   * Updates.
   * Triggers audio playback or updates audio state.
   * @param {number} dt Delta time in seconds.
   * @param {import("../../../engine/input/input.class.js").Input} input Input handler.
   */
  update(dt, input) {
    updatePlayer(this, dt, input, playerAudio);
  }

  /**
   * Renders.
   * Uses ctx, camera to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {import("../../../engine/world/camera.class.js").Camera} camera Camera instance.
   */
  render(ctx, camera) {
    renderPlayer(this, ctx, camera, { debugHitbox: DEBUG_HITBOX });
  }

  /**
   * Returns hitbox.
   * Updates the instance state.
   * @returns {Object} Hitbox.
   */
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
