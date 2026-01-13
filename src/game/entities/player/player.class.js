import { MovableObject } from "../../../engine/physics/movableObject.class.js";
import { HudPopup } from "../../effects/hudPopup.class.js";
import {
  DEBUG_MODE,
  PLAYER_MAX_HEARTS,
  PLAYER_SLIDE_DAMAGE,
} from "../../../config/config.js";
import { PlayerAudio } from "../../audio/playerAudio.class.js";
import { updatePlayer } from "./playerUpdate.js";
import { renderPlayer } from "./playerRender.js";
import {
  applyDizzy,
  handleDeathLanding,
  handleFallOffWorld,
  respawnFromFall,
  startDeath,
  startHurt,
  updateHurt,
} from "./playerHealth.js";
import {
  startAttack,
  startShoot,
  updateAttack,
  updateShoot,
} from "./playerCombat.js";
import { handleLandingAudio, startSlide } from "./playerSlide.js";

const DEBUG_HITBOX = DEBUG_MODE;
const playerAudio = new PlayerAudio();

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
    this.defaultSpeed = this.speed;
    this.runMultiplier = 2;

    /** ----- SLIDE ----- */
    this.isSliding = false;
    this.slideReady = true;
    this.slideDistance = 200;
    this.slideStartX = 0;
    this.slideDir = 1;
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
    this.lastSafeX = x;
    this.lastSafeY = y;
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
    this.facing = 1;

    /** ----- HEART SYSTEM ----- */
    this.maxHearts = PLAYER_MAX_HEARTS;
    this.healthPoints = this.maxHearts * 2;
    this.maxHealthPoints = this.healthPoints;
    this.healthPulse = 0;

    /** ----- COINS ----- */
    this.coins = 0;
    this.hudPulse = 0;

  }

  /** ----- HEART STATES FOR HUD ----- */
  get heartStates() {
    const s = [];
    for (let i = 0; i < this.maxHearts; i++) {
      const hp = this.healthPoints - i * 2;
      if (hp >= 2) s.push(2);
      else if (hp === 1) s.push(1);
      else s.push(0);
    }
    return s;
  }

  /** ----- DAMAGE ----- */
  takeDamage(amount = 1, opts = {}) {
    if (this.isDead) return;

    this.healthPoints = Math.max(0, this.healthPoints - amount);
    this.healthPulse = 1.0;

    const popupDelay = opts?.popupDelay ?? 0;
    const addPopup = () => {
      if (this.world?.hudPopups) {
        this.world.hudPopups.push(
          new HudPopup(
            `-${amount}❤️`,
            this.x + this.width / 2,
            this.y - 30,
            "damage"
          )
        );
      }
    };
    if (popupDelay > 0) setTimeout(addPopup, popupDelay * 1000);
    else addPopup();

    if (this.healthPoints <= 0) this.startDeath();
    else {
      playerAudio.playOuch();
      this.startHurt(opts?.useDizzy ?? true);
    }
  }

  /** ----- HEAL ----- */
  heal(amount = 1) {
    if (this.isDead) return;

    const before = this.healthPoints;
    this.healthPoints = Math.min(
      this.maxHealthPoints,
      this.healthPoints + amount
    );
    const gained = this.healthPoints - before;

    if (gained > 0 && this.world?.hudPopups) {
      this.world.hudPopups.push(
        new HudPopup(
          `+${gained}❤️`,
          this.x + this.width / 2,
          this.y - 30,
          "heal"
        )
      );
    }

    this.healthPulse = 1.0;
  }

  /** ----- COINS ----- */
  addCoins(amount) {
    this.coins += amount;
    this.hudPulse = 1.0;
  }

  addBullets(amount = 0) {
    this.bulletAmmo = Math.max(0, this.bulletAmmo + amount);
    this.gunPulse = 1.0;
  }

  markSafePosition() {
    this.lastSafeX = this.x;
    this.lastSafeY = this.y;
  }

  applyDizzy(duration = 0) {
    applyDizzy(this, duration);
  }

  startHurt(useDizzy = true) {
    startHurt(this, useDizzy);
  }

  startDeath() {
    startDeath(this, playerAudio);
  }

  handleDeathLanding(prevBottom, currBottom) {
    handleDeathLanding(this, prevBottom, currBottom);
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

  /** ----- ANIMATION ----- */
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

  /** ----- ATTACK ----- */
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

  /** ----- SHOOT ----- */
  startShoot() {
    return startShoot(this, playerAudio);
  }

  updateShoot(dt) {
    updateShoot(this, dt);
  }

  /** ----- WORLD FALL DEATH ----- */
  handleFallOffWorld(grounded, bottom, canvasHeight) {
    handleFallOffWorld(this, grounded, bottom, canvasHeight);
  }

  /** ----- UPDATE LOOP ----- */
  update(dt, input) {
    updatePlayer(this, dt, input, playerAudio);
  }

  /** ----- RENDER ----- */
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
