import { MovableObject } from "./movableObject.class.js";

export class Player extends MovableObject {
  constructor(x, y, sprite) {
    super(x, y, 120, 140);
    this.sprite = sprite;
    this.jumpForce = 1200;

    this.gravityUp = 2500;
    this.gravityDown = 3500;
    this.apexBoost = 0.6;
    this.apexThreshold = 120;
    this.coyoteTime = 0.1;
    this.coyoteTimer = 0;
    this.jumpBufferTime = 0.1;
    this.jumpBufferTimer = 0;
    this.jumpHeld = false;
    this.jumpCutMultiplier = 0.5;
  }

  applyApexGravity(dt) {
    const goingUp = this.vy < 0;
    const nearApex = Math.abs(this.vy) < this.apexThreshold;

    if (goingUp) {
      this.vy += this.gravityUp * dt;

      if (nearApex) {
        this.vy *= this.apexBoost;
      }
    } else {
      this.vy += this.gravityDown * dt;
    }

    this.y += this.vy * dt;
  }

  jump() {
    if (this.onGround) {
      this.vy = -this.jumpForce;
      this.onGround = false;
    }
  }

  update(dt, input) {

    if (input.isDown("ArrowLeft")) this.moveLeft(dt);
    if (input.isDown("ArrowRight")) this.moveRight(dt);

    if (input.isDown(" ")) {
      this.jumpBufferTimer = this.jumpBufferTime;
      this.jumpHeld = true;
    } else {
      this.jumpHeld = false;
    }

    if (this.onGround) {
      this.coyoteTimer = this.coyoteTime;
    } else {
      this.coyoteTimer -= dt;
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.jump();
      this.jumpBufferTimer = 0;
    }

    if (!this.jumpHeld && this.vy < 0) {
      this.vy *= this.jumpCutMultiplier;
    }

    this.jumpBufferTimer -= dt;
    this.applyApexGravity(dt);
  }

  render(ctx, camera) {
    ctx.drawImage(
      this.sprite,
      this.x - camera.x,
      this.y - camera.y,
      this.width,
      this.height
    );
  }
}
