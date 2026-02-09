import { MovableObject } from "../../../engine/physics/movableObject.class.js";
import { HudPopup } from "../../effects/hudPopup.class.js";
import { DEBUG_MODE } from "../../../config/config.js";
import { PlayerAudio } from "../../audio/playerAudio/playerAudio.class.js";
import { updatePlayer } from "./player.update.js";
import { renderPlayer } from "./player.render.js";
import { applyDizzy, handleDeathLanding, handleFallOffWorld, respawnFromFall, startDeath, startHurt, updateHurt } from "./player.health.js";
import { startAttack, startShoot, updateAttack, updateShoot } from "./player.combat.js";
import { handleLandingAudio, startSlide } from "./player.slide.js";
import { setAnimation, animate } from "./player.animation.js";
import {
  initializeAnimationSets,
  initializeAnimationState,
  initializeMovement,
  initializeSlide,
  initializeAttack,
  initializeShoot,
  initializeHurtDeath,
  initializeHurtState,
  initializeDeathState,
  initializeAdvancedJump,
  initializeFacing,
  initializeHeartSystem,
  initializeCoins,
} from "./player.init.js";

const DEBUG_HITBOX = DEBUG_MODE;
const playerAudio = new PlayerAudio();
const msPerSecond = 1000;

export class Player extends MovableObject {
  /**
   * Creates a new instance.
   * Used to set up required data for world state updates.
   * Applies physics updates like gravity and velocity.
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
   * Heart states.
   * Used to support collectable handling.
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
   * Used to provide popup position. If omitted, default values are used for camera-relative placement.
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
   * Used to support combat effects.
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
   * Used to keep state consistent before the next step for combat effects.
   * @param {number} damageAmount Damage amount.
   */
  applyDamageAmount(damageAmount) {
    this.healthPoints = Math.max(0, this.healthPoints - damageAmount);
    this.healthPulse = 1.0;
  }

  /**
   * Queues damage popup.
   * Used to support combat effects.
   * @param {number} damageAmount Damage amount.
   * @param {Object} options Configuration options.
   */
  queueDamagePopup(damageAmount, options) {
    const popupDelaySeconds = options?.popupDelay ?? 0;
    /**
     * Show damage popup.
     * Used to support combat effects.
     * @returns {*} Result value.
     */
    const showDamagePopup = () => this.addDamagePopup(damageAmount);
    this.schedulePopup(showDamagePopup, popupDelaySeconds);
  }

  /**
   * Schedules popup.
   * Used to support world state updates.
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
   * Used to support combat effects.
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
   * Used to centralize a specific behavior for combat effects.
   * Triggers audio playback or updates audio state.
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
   * Used to support world state updates.
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
   * Used to keep state consistent before the next step for world state updates.
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
   * Used to support world state updates.
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
   * Used to support world state updates.
   * @param {number} coinAmount Coin amount.
   */
  addCoins(coinAmount) {
    this.coins += coinAmount;
    this.hudPulse = 1.0;
  }

  /**
   * Adds bullets. If omitted, default values are used.
   * Used to support world state updates.
   * @param {number} [bulletAmount] Bullet amount.
   */
  addBullets(bulletAmount = 0) {
    this.bulletAmmo = Math.max(0, this.bulletAmmo + bulletAmount);
    this.gunPulse = 1.0;
  }

  /**
   * Marks safe position.
   */
  markSafePosition() {
    this.lastSafePosX = this.x;
    this.lastSafePosY = this.y;
  }

  /**
   * Applies dizzy. If omitted, default values are used.
   * Used to keep state consistent before the next step for world state updates.
   * Uses dizzyDuration to perform the operation.
   * @param {number} [dizzyDuration] Dizzy duration.
   */
  applyDizzy(dizzyDuration = 0) {
    applyDizzy(this, dizzyDuration);
  }

  /**
   * Starts hurt. If omitted, default values are used.
   * Used to support combat effects.
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
   * Used to centralize a specific behavior for combat effects.
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
   * Starts attack.
   * Used to support combat effects.
   * Triggers audio playback or updates audio state.
   * @returns {*} Result value.
   */
  startAttack() {
    const started = startAttack(this, playerAudio);
    if (started) this.attackQueued = false;
    return started;
  }

  /**
   * Updates attack.
   * Used to advance state during the update loop for combat effects.
   * Triggers audio playback or updates audio state.
   * @param {number} dt Delta time in seconds.
   */
  updateAttack(dt) {
    updateAttack(this, dt, playerAudio);
  }

  /**
   * Updates hurt.
   * Used to advance state during the update loop for combat effects.
   * Uses dt to perform the operation.
   * @param {number} dt Delta time in seconds.
   */
  updateHurt(dt) {
    updateHurt(this, dt);
  }

  /**
   * Starts shoot.
   * Used to support world state updates.
   * Triggers audio playback or updates audio state.
   * @returns {*} Result value.
   */
  startShoot() {
    return startShoot(this, playerAudio);
  }

  /**
   * Updates shoot.
   * Used to advance state during the update loop for world state updates.
   * Uses dt to perform the operation.
   * @param {number} dt Delta time in seconds.
   */
  updateShoot(dt) {
    updateShoot(this, dt);
  }

  /**
   * Handles fall off world.
   * Used to centralize a specific behavior for physics updates.
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
   * Used to advance state during the update loop for world state updates.
   * Triggers audio playback or updates audio state.
   * @param {number} dt Delta time in seconds.
   * @param {Input} input Input handler.
   */
  update(dt, input) {
    updatePlayer(this, dt, input, playerAudio);
  }

  /**
   * Renders.
   * Used to render visuals.
   * Uses ctx, camera to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   */
  render(ctx, camera) {
    renderPlayer(this, ctx, camera, { debugHitbox: DEBUG_HITBOX });
  }

  /**
   * Returns hitbox.
   * Used to provide hitbox for collision and hit testing.
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

Object.assign(Player.prototype, {
  initializeAnimationSets,
  initializeAnimationState,
  initializeMovement,
  initializeSlide,
  initializeAttack,
  initializeShoot,
  initializeHurtDeath,
  initializeHurtState,
  initializeDeathState,
  initializeAdvancedJump,
  initializeFacing,
  initializeHeartSystem,
  initializeCoins,
  setAnimation,
  animate,
});
