const DEADZONE_RATIO = 0.25;
const DEADZONE_X_BIAS = 0.05;
const FOLLOW_LEFT_MULTIPLIER = 1.0;
const FOLLOW_RIGHT_MULTIPLIER = 1.15;
const DEFAULT_SMOOTHING = 0.08;
const SHAKE_DEFAULT_DURATION = 0.25;
const SHAKE_DEFAULT_MAGNITUDE = 8;
const SHAKE_Y_SCALE = 0.6;
const RANDOM_RANGE_SCALE = 2;
const RANDOM_RANGE_SHIFT = 1;

export class Camera {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for camera-relative placement.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} worldWidth World width.
   * @param {number} [worldHeight] World height.
   */
  constructor(canvas, worldWidth, worldHeight = canvas.height) {
    this.canvas = canvas;

    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.x = 0;
    this.y = 0;

    this.deadzoneWidth = canvas.width * DEADZONE_RATIO;
    this.deadzoneHeight = canvas.height * DEADZONE_RATIO;

    const deadzoneBaseX = (canvas.width - this.deadzoneWidth) / 2;
    const deadzoneShiftX = canvas.width * DEADZONE_X_BIAS;
    const deadzoneMinX = 0;
    const deadzoneMaxX = canvas.width - this.deadzoneWidth;
    this.deadzoneX = Math.min(deadzoneMaxX, Math.max(deadzoneMinX, deadzoneBaseX - deadzoneShiftX));
    this.deadzoneY = (canvas.height - this.deadzoneHeight) / 2;

    this.shakeTimer = 0;
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Returns screen position.
   * Used to provide screen position for camera-relative placement.
   * @param {*} target Target.
   * @returns {Object} Screen position.
   */
  getScreenPosition(target) {
    return { x: target.x - this.x, y: target.y - this.y };
  }

  /**
   * Updates horizontal follow.
   * Used to advance state during the update loop for camera-relative placement.
   * @param {number} playerScreenX Player screen X.
   * @param {*} smoothing Smoothing.
   */
  updateHorizontalFollow(playerScreenX, smoothing) {
    if (playerScreenX < this.deadzoneX) {
      this.x -= (this.deadzoneX - playerScreenX) * smoothing * FOLLOW_LEFT_MULTIPLIER;
      return;
    }
    if (playerScreenX > this.deadzoneX + this.deadzoneWidth) {
      this.x += (playerScreenX - (this.deadzoneX + this.deadzoneWidth)) * smoothing * FOLLOW_RIGHT_MULTIPLIER;
    }
  }

  /**
   * Updates vertical follow.
   * Used to advance state during the update loop for camera-relative placement.
   * @param {number} playerScreenY Player screen Y.
   * @param {*} smoothing Smoothing.
   */
  updateVerticalFollow(playerScreenY, smoothing) {
    if (playerScreenY < this.deadzoneY) {
      this.y -= (this.deadzoneY - playerScreenY) * smoothing;
      return;
    }
    if (playerScreenY > this.deadzoneY + this.deadzoneHeight) {
      this.y += (playerScreenY - (this.deadzoneY + this.deadzoneHeight)) * smoothing;
    }
  }

  /**
   * Clamp horizontal.
   */
  clampHorizontal() {
    if (this.x < 0) this.x = 0;
    if (this.x > this.worldWidth - this.canvas.width) {
      this.x = this.worldWidth - this.canvas.width;
    }
  }

  /**
   * Clamp vertical.
   */
  clampVertical() {
    if (this.y < 0) this.y = 0;
    if (this.y > this.worldHeight - this.canvas.height) {
      this.y = this.worldHeight - this.canvas.height;
    }
  }

  /**
   * Follow. If omitted, default values are used.
   * Used to support camera-relative placement.
   * @param {*} target Target.
   * @param {*} [smoothing] Smoothing.
   * @param {number} dt Delta time in seconds.
   */
  follow(target, smoothing = DEFAULT_SMOOTHING, dt) {
    const playerScreen = this.getScreenPosition(target);
    this.updateHorizontalFollow(playerScreen.x, smoothing);
    this.updateVerticalFollow(playerScreen.y, smoothing);
    this.clampHorizontal();
    this.clampVertical();
    this.updateShake(dt);
  }

  /**
   * Shake. If omitted, default values are used.
   * Used to support camera-relative placement.
   * @param {number} [duration] Duration in seconds.
   * @param {*} [magnitude] Magnitude.
   */
  shake(duration = SHAKE_DEFAULT_DURATION, magnitude = SHAKE_DEFAULT_MAGNITUDE) {
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
  }

  /**
   * Updates shake.
   * Used to advance state during the update loop for camera-relative placement.
   * @param {number} dt Delta time in seconds.
   */
  updateShake(dt) {
    this.clearShakeOffsets();
    if (this.shakeTimer <= 0) return;
    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    this.applyShakeOffsets();
  }

  /**
   * Clears shake offsets.
   */
  clearShakeOffsets() {
    if (!this.shakeOffsetX && !this.shakeOffsetY) return;
    this.x -= this.shakeOffsetX;
    this.y -= this.shakeOffsetY;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Returns shake progress ratio.
   * Used to provide shake progress ratio for camera-relative placement.
   * @returns {*} Shake progress ratio.
   */
  getShakeProgressRatio() {
    return this.shakeDuration > 0 ? this.shakeTimer / this.shakeDuration : 0;
  }

  /**
   * Returns shake amplitude.
   * Used to provide shake amplitude for camera-relative placement.
   * @returns {*} Shake amplitude.
   */
  getShakeAmplitude() {
    return this.shakeMagnitude * this.getShakeProgressRatio();
  }

  /**
   * Returns random shake value.
   * Used to provide random shake value for camera-relative placement.
   * Introduces randomness into the outcome.
   * @returns {*} Random shake value.
   */
  getRandomShakeValue() {
    return Math.random() * RANDOM_RANGE_SCALE - RANDOM_RANGE_SHIFT;
  }

  /**
   * Applies shake offsets.
   */
  applyShakeOffsets() {
    const currentShakeAmplitude = this.getShakeAmplitude();
    this.shakeOffsetX = this.getRandomShakeValue() * currentShakeAmplitude;
    this.shakeOffsetY = this.getRandomShakeValue() * currentShakeAmplitude * SHAKE_Y_SCALE;
    this.x += this.shakeOffsetX;
    this.y += this.shakeOffsetY;
  }
}
