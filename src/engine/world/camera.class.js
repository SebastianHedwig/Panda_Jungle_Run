const DEADZONE_RATIO = 0.3;
const DEFAULT_SMOOTHING = 0.08;
const SHAKE_DEFAULT_DURATION = 0.25;
const SHAKE_DEFAULT_MAGNITUDE = 8;
const SHAKE_Y_SCALE = 0.6;
const RANDOM_RANGE_SCALE = 2;
const RANDOM_RANGE_SHIFT = 1;

export class Camera {
  constructor(canvas, worldWidth, worldHeight = canvas.height) {
    this.canvas = canvas;

    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.x = 0;
    this.y = 0;

    this.deadzoneWidth = canvas.width * DEADZONE_RATIO;
    this.deadzoneHeight = canvas.height * DEADZONE_RATIO;

    this.deadzoneX = (canvas.width - this.deadzoneWidth) / 2;
    this.deadzoneY = (canvas.height - this.deadzoneHeight) / 2;

    this.shakeTimer = 0;
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  follow(target, smoothing = DEFAULT_SMOOTHING, dt) {
    const playerScreenX = target.x - this.x;
    const playerScreenY = target.y - this.y;

    if (playerScreenX < this.deadzoneX) {
      this.x -= (this.deadzoneX - playerScreenX) * smoothing;
    } else if (playerScreenX > this.deadzoneX + this.deadzoneWidth) {
      this.x += (playerScreenX - (this.deadzoneX + this.deadzoneWidth)) * smoothing;
    }

    if (playerScreenY < this.deadzoneY) {
      this.y -= (this.deadzoneY - playerScreenY) * smoothing;
    } else if (playerScreenY > this.deadzoneY + this.deadzoneHeight) {
      this.y += (playerScreenY - (this.deadzoneY + this.deadzoneHeight)) * smoothing;
    }

    if (this.x < 0) this.x = 0;
    if (this.x > this.worldWidth - this.canvas.width) {
      this.x = this.worldWidth - this.canvas.width;
    }

    if (this.y < 0) this.y = 0;
    if (this.y > this.worldHeight - this.canvas.height) {
      this.y = this.worldHeight - this.canvas.height;
    }

    this.updateShake(dt);
  }

  shake(duration = SHAKE_DEFAULT_DURATION, magnitude = SHAKE_DEFAULT_MAGNITUDE) {
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
  }

  updateShake(dt) { // remove previous offsets before applying new shake
    if (this.shakeOffsetX || this.shakeOffsetY) {
      this.x -= this.shakeOffsetX;
      this.y -= this.shakeOffsetY;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    if (this.shakeTimer <= 0) return;

    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    const shakeProgressRatio =
      this.shakeDuration > 0 ? this.shakeTimer / this.shakeDuration : 0;
    const currentShakeAmplitude = this.shakeMagnitude * shakeProgressRatio;

    this.shakeOffsetX = (Math.random() * RANDOM_RANGE_SCALE - RANDOM_RANGE_SHIFT) * currentShakeAmplitude;
    this.shakeOffsetY = (Math.random() * RANDOM_RANGE_SCALE - RANDOM_RANGE_SHIFT) * currentShakeAmplitude * SHAKE_Y_SCALE;

    this.x += this.shakeOffsetX;
    this.y += this.shakeOffsetY;
  }
}
