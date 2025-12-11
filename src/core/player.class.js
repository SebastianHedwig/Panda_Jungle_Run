import { MovableObject } from "./movableObject.class.js";
import { HudPopup } from "./hudPopup.class.js";

const DEBUG_HITBOX = false;

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
    this.slideDamage = 2;

    /** ----- ATTACK ----- */
    this.isAttacking = false;
    this.attackDuration = 0.4;
    this.attackTimer = 0;
    this.attackHitDone = false;
    this.attackRange = 70;
    this.attackHeightTolerance = 15;

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

    /** ----- ADVANCED JUMP ----- */
    this.coyoteTime = 0.1;
    this.coyoteTimer = 0;
    this.jumpBufferTime = 0.1;
    this.jumpBufferTimer = 0;
    this.jumpCutMultiplier = 0.5;
    this.jumpHeld = false;

    /** ----- FACING ----- */
    this.facing = 1;

    /** ----- HEART SYSTEM ----- */
    this.maxHearts = 3;
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
    else this.startHurt(opts?.useDizzy ?? true);
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

  startHurt(useDizzy = true) {
    if (this.isDead) return;
    this.hurtUseDizzy = !!useDizzy;
    if (!this.hurtUseDizzy) {
      // simple contact: only blink, no hit animation or movement freeze
      this.invulnerableTimer = Math.max(
        this.invulnerableTimer,
        this.invulnerableBlinkWindow
      );
      this.isHurt = false;
      return;
    }

    this.isHurt = true;
    const hurtDuration =
      (this.hurtFrames?.length || 1) * this.frameSpeed;
    const dizzyDuration = this.hurtUseDizzy && this.dizzyFrames
      ? this.dizzyFrames.length * this.frameSpeed * 2
      : 0;

    this.hurtPhase = "hurt";
    this.hurtPhaseTimer = hurtDuration;
    this.invulnerableTimer =
      hurtDuration + dizzyDuration + this.invulnerableBlinkWindow;

    this.isAttacking = false;
    this.isShooting = false;
    if (this.hurtUseDizzy) {
      this.setAnimation(this.hurtFrames || this.dizzyFrames);
      this.currentFrame = 0;
    }
  }

  startDeath() {
    if (this.isDead) return;
    this.isDead = true;
    this.isHurt = false;
    this.isAttacking = false;
    this.isShooting = false;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.setAnimation(this.dieFrames);
    this.currentFrame = 0;
    this.invulnerableTimer = 0;
    this.collisionDisabled = true;
    this.deathDone = false;
  }

  startSlide() {
    if (this.isSliding || !this.onGround) return;
    this.isSliding = true;
    this.slideStartX = this.x;
    this.slideDir = this.facing;
    this.vy = 0;
    this.slideBlockGrace = 0.12;
    this.slideHitEnemies.clear();
  }

  respawnFromFall() {
    if (this.isDead) return;

    this.healthPoints = Math.max(0, this.healthPoints - 1);
    this.healthPulse = 1.0;

    if (this.healthPoints <= 0) {
      this.startDeath();
      return;
    }

    // reset to last safe spot
    this.x = this.lastSafeX ?? this.x;
    this.y = (this.lastSafeY ?? this.y) - 5;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;

    // brief invulnerability + blink
    this.invulnerableTimer = 1.0;
    this.isHurt = false;
    this.isAttacking = false;
    this.isShooting = false;
    this.setAnimation(this.idleFrames);
    this.currentFrame = 0;
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
    // block melee while ammo is available
    if (this.bulletAmmo > 0) return;
    if (this.isAttacking || this.isShooting || this.isHurt || this.isDead || !this.onGround) return;

    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.attackHitDone = false;
    this.setAnimation(this.throwFrames);
    this.currentFrame = 0;
  }

  updateAttack(dt) {
    if (!this.isAttacking) return;
    this.attackTimer -= dt;
    if (!this.attackHitDone && this.world?.enemies) {
      const px = this.x + this.width / 2;
      const py = this.y + this.height / 2;
      for (const enemy of this.world.enemies) {
        if (enemy.isDead) continue;
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const dx = ex - px;
        const dy = Math.abs(ey - py);
        if (
          Math.abs(dx) <= this.attackRange &&
          dy <= this.attackHeightTolerance &&
          Math.sign(dx || 1) === this.facing
        ) {
          enemy.takeDamage?.(1);
          if (!enemy.isDead && enemy.health > 0) {
            this.world?.spawnHitEffect?.(
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height
            );
          }
          this.attackHitDone = true;
          break;
        }
      }
    }
    if (this.attackTimer <= 0) this.isAttacking = false;
  }

  updateHurt(dt) {
    if (!this.isHurt) return;
    this.hurtPhaseTimer -= dt;
    if (this.hurtPhaseTimer > 0) return;

    if (this.hurtUseDizzy && this.hurtPhase === "hurt" && this.dizzyFrames) {
      this.hurtPhase = "dizzy";
      this.hurtPhaseTimer =
        this.dizzyFrames.length * this.frameSpeed * 2 || this.hurtDuration;
      this.setAnimation(this.dizzyFrames);
      this.currentFrame = 0;
      return;
    }

    this.isHurt = false;
    this.hurtPhase = null;
  }

  /** ----- SHOOT ----- */
  startShoot() {
    if (this.isShooting || this.isAttacking || this.isHurt || this.isDead || this.shootCooldown > 0)
      return false;
    if (this.bulletAmmo <= 0) return false;

    this.isShooting = true;
    this.shootTimer = this.shootDuration;
    this.shootFireTimer = this.shootFireDelay;
    this.shootHasFired = false;
    this.shootFacing = this.facing;
    this.shootCooldown = this.shootCooldownDuration;
    this.setAnimation(this.shootFrames);
    this.currentFrame = 0;
    return true;
  }

  updateShoot(dt) {
    if (!this.isShooting) return;

    if (!this.shootHasFired) {
      this.shootFireTimer -= dt;
      if (this.shootFireTimer <= 0 && this.world?.spawnBullet) {
        const dir = this.shootFacing;
        const muzzleX = this.x + (dir === 1 ? this.width : 0);
        const muzzleY = this.y + this.height * 0.55;
        this.world.spawnBullet(muzzleX, muzzleY, dir);
        if (this.bulletAmmo > 0)
          this.bulletAmmo = Math.max(0, this.bulletAmmo - 1);
        this.shootHasFired = true;
      }
    }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) this.isShooting = false;
  }

  /** ----- WORLD FALL DEATH ----- */
  handleFallOffWorld(grounded, bottom, canvasHeight) {
    if (this.invulnerableTimer > 0) return;
    if (grounded) return;
    if (this.vy >= 0 && bottom >= canvasHeight + this.height) {
      this.respawnFromFall();
    }
  }

  /** ----- UPDATE LOOP ----- */
  update(dt, input) {
    // store position before collisions to detect blocking (e.g., wall during slide)
    this._preCollisionX = this.x;
    if (this.slideBlockGrace > 0) {
      this.slideBlockGrace = Math.max(0, this.slideBlockGrace - dt);
    }

    /** COOLDOWN TIMERS */
    if (this.shootCooldown > 0)
      this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    if (this.gunPulse > 0) this.gunPulse = Math.max(0, this.gunPulse - dt * 4);
    if (this.invulnerableTimer > 0)
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);

    /** DEATH OVERRIDE */
    if (this.isDead) {
      this.setAnimation(this.dieFrames);
      if (!this.deathDone) {
        this.frameTime += dt;
        if (this.frameTime >= this.frameSpeed) {
          this.frameTime = 0;
          this.currentFrame = Math.min(
            this.currentFrame + 1,
            this.currentAnimation.length - 1
          );
          this.sprite = this.currentAnimation[this.currentFrame];
          if (this.currentFrame === this.currentAnimation.length - 1) {
            this.deathDone = true;
          }
        }
      }
      return;
    }

    /** HURT */
    this.updateHurt(dt);
    if (this.isHurt) {
      if (this.hurtUseDizzy) {
        const hurtAnim =
          this.hurtPhase === "hurt"
            ? this.hurtFrames
            : this.dizzyFrames || this.hurtFrames;
        this.setAnimation(hurtAnim);
        this.animate(dt);
      }
      this.applyApexGravity(dt);
      return;
    }

    /** ATTACK / SHOOT INPUT (Enter only, bullets take priority) */
    if (input.isPressed("Enter")) {
      if (this.bulletAmmo > 0) this.startShoot();
      else this.startAttack();
    }

    this.updateShoot(dt);

    if (this.isShooting) {
      this.setAnimation(this.shootFrames);
      this.applyApexGravity(dt);
      this.animate(dt);
      return;
    }

    this.updateAttack(dt);

    if (this.isAttacking) {
      this.setAnimation(this.throwFrames);
      this.applyApexGravity(dt);
      this.animate(dt);
      return;
    }

    /** SLIDE INPUT */
    const slideKeysDown =
      input.isDown("Shift") && (input.isDown("s") || input.isDown("ArrowDown"));

    if (this.isSliding) {
      const moved = Math.abs(this.x - this.slideStartX);
      const t = Math.min(moved / this.slideDistance, 1);
      const speed = this.slideSpeed * (1 - t * 0.4);

      this.x += this.slideDir * speed * dt;
      if (moved >= this.slideDistance) this.isSliding = false;

      this.checkSlideHits();
      this.setAnimation(this.slideFrames);
      this.applyApexGravity(dt);
      this.animate(dt);
      return;
    }

    if (
      this.onGround &&
      slideKeysDown &&
      this.slideReady &&
      (input.isDown("ArrowLeft") ||
        input.isDown("ArrowRight") ||
        input.isDown("a") ||
        input.isDown("d"))
    ) {
      this.startSlide();
      this.slideReady = false;
      return;
    }

    if (!slideKeysDown) this.slideReady = true;

    /** MOVEMENT */
    let moving = false,
      running = false;

    if (input.isDown("ArrowLeft") || input.isDown("a")) {
      this.moveLeft(dt);
      this.facing = -1;
      moving = true;
    }
    if (input.isDown("ArrowRight") || input.isDown("d")) {
      this.moveRight(dt);
      this.facing = 1;
      moving = true;
    }
    if (moving && input.isDown("Shift")) {
      this.speed = this.defaultSpeed * this.runMultiplier;
      running = true;
    } else this.speed = this.defaultSpeed;

    if (!this.onGround) this.setAnimation(this.jumpFrames);
    else if (running) this.setAnimation(this.runFrames);
    else if (moving) this.setAnimation(this.walkFrames);
    else this.setAnimation(this.idleFrames);

    /** ADVANCED JUMP */
    if (input.isPressed(" ")) {
      this.jumpBufferTimer = this.jumpBufferTime;
      this.jumpHeld = true;
    } else if (!input.isDown(" ")) this.jumpHeld = false;

    if (this.onGround) this.coyoteTimer = this.coyoteTime;
    else this.coyoteTimer -= dt;

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.jump();
      this.jumpBufferTimer = 0;
    }

    if (!this.jumpHeld && this.vy < 0) this.vy *= this.jumpCutMultiplier;
    this.jumpBufferTimer -= dt;

    this.applyApexGravity(dt);
    this.animate(dt);
  }

  /** ----- RENDER ----- */
  render(ctx, camera) {
    if (!this.isDead && this.invulnerableTimer > 0) {
      const phase = Math.floor(
        this.invulnerableTimer / this.invulnerableBlinkInterval
      );
      if (phase % 2 === 0) return;
    }

    ctx.save();
    if (this.facing === -1) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.sprite,
        -(this.x - camera.x + this.width),
        this.y - camera.y,
        this.width,
        this.height
      );
    } else {
      ctx.drawImage(
        this.sprite,
        this.x - camera.x,
        this.y - camera.y,
        this.width,
        this.height
      );
    }

    if (DEBUG_HITBOX) {
      const box = this.getHitbox();
      ctx.strokeStyle = "rgba(0,120,255,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        box.x - camera.x,
        box.y - camera.y,
        box.width,
        box.height
      );
    }
    ctx.restore();
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

  checkSlideHits() {
    if (!this.world?.enemies?.length) return;
    const selfBox = this.getHitbox();

    for (const enemy of this.world.enemies) {
      if (enemy.isDead || this.slideHitEnemies.has(enemy)) continue;
      const enemyBox = enemy.getHitbox ? enemy.getHitbox() : null;
      if (!enemyBox) continue;
      const overlaps =
        selfBox.x < enemyBox.x + enemyBox.width &&
        selfBox.x + selfBox.width > enemyBox.x &&
        selfBox.y < enemyBox.y + enemyBox.height &&
        selfBox.y + selfBox.height > enemyBox.y;
      if (overlaps) {
        const dmg = this.slideDamage ?? 2;
        enemy.takeDamage?.(dmg, { skipStun: true, source: "slide" });
        if (!enemy.isDead && enemy.health > 0) {
          this.world?.spawnHitEffect?.(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
          );
        }
        this.slideHitEnemies.add(enemy);
      }
    }
  }
}
