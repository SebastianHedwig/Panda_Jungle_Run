import { MovableObject } from "./movableObject.class.js";
import { HudPopup } from "./hudPopup.class.js";

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
    shootFrames
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

    /** ----- ATTACK ----- */
    this.isAttacking = false;
    this.attackDuration = 0.4;
    this.attackTimer = 0;

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

    /** ----- JUMP PHYSICS ----- */
    this.jumpForce = 1200;
    this.gravityUp = 2500;
    this.gravityDown = 3500;
    this.apexBoost = 0.6;
    this.apexThreshold = 120;

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

    /** ----- DEATH ----- */
    this.isDead = false;
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
  takeDamage(amount = 1) {
    if (this.isDead) return;

    this.healthPoints = Math.max(0, this.healthPoints - amount);
    this.healthPulse = 1.0;

    if (this.world?.hudPopups) {
      this.world.hudPopups.push(
        new HudPopup(
          `-${amount} ❤`,
          this.x + this.width / 2,
          this.y - 30,
          "damage"
        )
      );
    }

    if (this.healthPoints <= 0) this.isDead = true;
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
          `+${gained} ❤`,
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
    if (this.isAttacking || this.isShooting || !this.onGround) return;

    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.setAnimation(this.throwFrames);
    this.currentFrame = 0;
  }

  updateAttack(dt) {
    if (!this.isAttacking) return;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) this.isAttacking = false;
  }

  /** ----- SHOOT ----- */
  startShoot() {
    if (this.isShooting || this.isAttacking || this.shootCooldown > 0)
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

  /** ----- JUMP ----- */
  jump() {
    this.vy = -this.jumpForce;
    this.onGround = false;
  }

  applyApexGravity(dt) {
    const up = this.vy < 0;
    const near = Math.abs(this.vy) < this.apexThreshold;

    this.vy += (up ? this.gravityUp : this.gravityDown) * dt;
    if (up && near) this.vy *= this.apexBoost;

    this.y += this.vy * dt;
  }

  /** ----- WORLD FALL DEATH ----- */
  handleFallOffWorld(grounded, bottom, canvasHeight) {
    if (grounded) return;
    if (this.vy >= 0 && bottom >= canvasHeight + this.height) {
      this.isDead = true;
      this.vx = 0;
      this.vy = 0;
    }
  }

  /** ----- UPDATE LOOP ----- */
  update(dt, input) {
    /** COOLDOWN TIMERS */
    if (this.shootCooldown > 0)
      this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    if (this.gunPulse > 0) this.gunPulse = Math.max(0, this.gunPulse - dt * 4);

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
    ctx.restore();
  }
}
