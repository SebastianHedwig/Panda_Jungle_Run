import { MovableObject } from "./movableObject.class.js";

export class Player extends MovableObject {
  constructor(
    x,
    y,
    idleFrames,
    walkFrames,
    runFrames,
    jumpFrames,
    slideFrames,
    throwFrames
  ) {
    super(x, y, 120, 140);

    /** ----- ANIMATION SETS ----- */
    this.idleFrames = idleFrames;
    this.walkFrames = walkFrames;
    this.runFrames = runFrames;
    this.jumpFrames = jumpFrames;
    this.slideFrames = slideFrames;
    this.throwFrames = throwFrames;

    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.065;
    this.sprite = this.currentAnimation[0];

    /** ----- MOVEMENT / RUNNING ----- */
    this.defaultSpeed = this.speed;
    this.runMultiplier = 2;

    /** ----- SLIDE ----- */
    this.isSliding = false;
    this.slideReady = true;
    this.slideDistance = 200;
    this.slideStartX = 0;
    this.slideDir = 1;
    this.slideSpeed = this.defaultSpeed * 2;

    /** ----- ATTACK / THROW ----- */
    this.isAttacking = false;
    this.attackDuration = 0.4;
    this.attackTimer = 0;

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

    /** ----- DIRECTION ----- */
    this.facing = 1;
  }

  /** ----- ANIMATION CONTROL ----- */
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

  /** ----- JUMP ----- */
  jump() {
    this.vy = -this.jumpForce;
    this.onGround = false;
  }

  applyApexGravity(dt) {
    const goingUp = this.vy < 0;
    const nearApex = Math.abs(this.vy) < this.apexThreshold;

    if (goingUp) {
      this.vy += this.gravityUp * dt;
      if (nearApex) this.vy *= this.apexBoost;
    } else {
      this.vy += this.gravityDown * dt;
    }

    this.y += this.vy * dt;
  }

  /** ----- SLIDE ----- */
  startSlide() {
    if (this.isSliding || !this.onGround) return;
    this.isSliding = true;
    this.slideStartX = this.x;
    this.slideDir = this.facing;
    this.setAnimation(this.slideFrames);
  }

  stopSlide() {
    this.isSliding = false;
  }

  /** ----- ATTACK ----- */
  startAttack() {
    if (this.isAttacking || !this.onGround) return;

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

  /** ----- UPDATE LOOP ----- */
  update(dt, input) {
    /** ATTACK INPUT */
    if (input.isPressed("a")) this.startAttack();

    this.updateAttack(dt);

    /** ATTACK LOCK */
    if (this.isAttacking) {
      this.setAnimation(this.throwFrames);
      this.applyApexGravity(dt);
      this.animate(dt);
      return;
    }

    /** SLIDE KEYS */
    const slideKeysDown =
      input.isDown("Shift") &&
      (input.isDown("S") || input.isDown("ArrowDown"));

    /** ACTIVE SLIDE */
    if (this.isSliding) {
      const slid = Math.abs(this.x - this.slideStartX);
      const t = Math.min(slid / this.slideDistance, 1);
      const currentSlideSpeed = this.slideSpeed * (1 - 0.4 * t);

      this.x += this.slideDir * currentSlideSpeed * dt;
      if (slid >= this.slideDistance) this.stopSlide();

      this.setAnimation(this.slideFrames);
      this.applyApexGravity(dt);
      this.animate(dt);
      return;
    }

    /** START SLIDE */
    if (
      this.onGround &&
      (input.isDown("ArrowLeft") || input.isDown("ArrowRight")) &&
      slideKeysDown &&
      this.slideReady
    ) {
      this.startSlide();
      this.slideReady = false;
      return;
    }
    if (!slideKeysDown) this.slideReady = true;

    /** MOVEMENT */
    let moving = false;
    let running = false;

    if (input.isDown("ArrowLeft")) {
      this.moveLeft(dt);
      this.facing = -1;
      moving = true;
    }
    if (input.isDown("ArrowRight")) {
      this.moveRight(dt);
      this.facing = 1;
      moving = true;
    }

    /** RUNNING */
    if (moving && input.isDown("Shift")) {
      this.speed = this.defaultSpeed * this.runMultiplier;
      running = true;
    } else this.speed = this.defaultSpeed;

    /** ANIMATION PRIORITY */
    if (!this.onGround) this.setAnimation(this.jumpFrames);
    else if (running) this.setAnimation(this.runFrames);
    else if (moving) this.setAnimation(this.walkFrames);
    else this.setAnimation(this.idleFrames);

    /** ----- ADVANCED JUMP ----- */
    if (input.isPressed(" ")) {
      this.jumpBufferTimer = this.jumpBufferTime;
      this.jumpHeld = true;
    } else if (!input.isDown(" ")) {
      this.jumpHeld = false;
    }

    if (this.onGround) this.coyoteTimer = this.coyoteTime;
    else this.coyoteTimer -= dt;

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.jump();
      this.jumpBufferTimer = 0;
    }

    if (!this.jumpHeld && this.vy < 0) this.vy *= this.jumpCutMultiplier;

    this.jumpBufferTimer -= dt;

    /** PHYSICS & ANIMATION */
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
