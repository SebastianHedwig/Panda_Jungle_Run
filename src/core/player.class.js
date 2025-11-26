import { MovableObject } from "./movableObject.class.js";

export class Player extends MovableObject {
  constructor(x, y, idleFrames, walkFrames, jumpFrames) {
    super(x, y, 120, 140);

    this.idleFrames = idleFrames;
    this.walkFrames = walkFrames;
    this.jumpFrames = jumpFrames;

    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.08 * (100 / this.speed);

    this.sprite = this.currentAnimation[0];

    this.jumpForce = 1200;
    this.gravityUp = 2500;
    this.gravityDown = 3500;
    this.apexBoost = 0.6;
    this.apexThreshold = 120;

    this.coyoteTime = 0.1;
    this.coyoteTimer = 0;

    this.jumpBufferTime = 0.1;
    this.jumpBufferTimer = 0;

    this.jumpCutMultiplier = 0.5;
    this.jumpHeld = false;
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

  update(dt, input) {
    let moving = false;

    if (input.isDown("ArrowLeft")) {
      this.moveLeft(dt);
      moving = true;
    }
    if (input.isDown("ArrowRight")) {
      this.moveRight(dt);
      moving = true;
    }

    if (!this.onGround) {
      this.setAnimation(this.jumpFrames);
    } else if (moving) {
      this.setAnimation(this.walkFrames);
    } else {
      this.setAnimation(this.idleFrames);
    }

    if (input.isDown(" ")) {
      this.jumpBufferTimer = this.jumpBufferTime;
      this.jumpHeld = true;
    } else {
      this.jumpHeld = false;
    }

    if (this.onGround) this.coyoteTimer = this.coyoteTime;
    else this.coyoteTimer -= dt;

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.jump();
      this.jumpBufferTimer = 0;
    }

    if (!this.jumpHeld && this.vy < 0) {
      this.vy *= this.jumpCutMultiplier;
    }

    this.jumpBufferTimer -= dt;

    this.applyApexGravity(dt);
    this.animate(dt);
  }

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
