const POPUP_STYLES = {
  coin: { stroke: "#000", fill: "rgb(255,255,2)", fontSize: "1.2rem" },
  damage: { stroke: "#000", fill: "rgba(255, 68, 68, 1)", fontSize: "1.2rem" },
  heal: { stroke: "#053016", fill: "rgba(3, 149, 8, 1)", fontSize: "1.2rem" },
  heart: { stroke: "#000", fill: "rgba(255, 45, 85, 1)", fontSize: "2rem" },
  gun: { stroke: "#000", fill: "rgba(235, 145, 0, 1)", fontSize: "1.2rem" },
};

const INITIAL_OPACITY = 1;
const INITIAL_RISE_OFFSET = 0;
const INITIAL_SCALE_FACTOR = 1.25;
const INITIAL_SHAKE_OFFSET = 0;

const RISE_SPEED = 40;
const OPACITY_FADE_RATE = 1.4;
const SCALE_SHRINK_RATE = 0.3;
const MIN_SCALE_FACTOR = 1;

const DAMAGE_SHAKE_FREQUENCY = 0.04;
const DAMAGE_SHAKE_AMPLITUDE = 3;

const LINE_WIDTH = 3;

export class HudPopup {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for UI interaction handling.
   * @param {string} [text] Text.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {string} [type] Type.
   */
  constructor(text = "+10", x, y, type = "coin") {
    this.text = text;
    this.x = x;
    this.y = y;
    this.type = type; // "coin" | "damage" | "heal" | "heart" | "gun"

    this.opacity = INITIAL_OPACITY;
    this.riseOffset = INITIAL_RISE_OFFSET;
    this.scaleFactor = INITIAL_SCALE_FACTOR;
    this.shakeOffset = INITIAL_SHAKE_OFFSET;
  }

  /**
   * Updates.
   * Used to advance state during the update loop for UI interaction handling.
   * @param {number} dt Delta time in seconds.
   */
  update(dt) {
    this.updateRise(dt);
    this.updateOpacity(dt);
    this.updateScale(dt);
    this.updateShake();
    this.clampOpacity();
  }

  /**
   * Updates rise.
   * Used to advance state during the update loop for UI interaction handling.
   * @param {number} dt Delta time in seconds.
   */
  updateRise(dt) {
    this.riseOffset += dt * RISE_SPEED;
  }

  /**
   * Updates opacity.
   * Used to advance state during the update loop for UI interaction handling.
   * @param {number} dt Delta time in seconds.
   */
  updateOpacity(dt) {
    this.opacity -= dt * OPACITY_FADE_RATE;
  }

  /**
   * Updates scale.
   * Used to advance state during the update loop for UI interaction handling.
   * @param {number} dt Delta time in seconds.
   */
  updateScale(dt) {
    this.scaleFactor -= dt * SCALE_SHRINK_RATE;
    if (this.scaleFactor < MIN_SCALE_FACTOR) this.scaleFactor = MIN_SCALE_FACTOR;
  }

  /**
   * Updates shake.
   */
  updateShake() {
    if (this.type === "damage") {
      this.shakeOffset = Math.sin(Date.now() * DAMAGE_SHAKE_FREQUENCY) * DAMAGE_SHAKE_AMPLITUDE;
    }
  }

  /**
   * Clamp opacity.
   */
  clampOpacity() {
    if (this.opacity < 0) this.opacity = 0;
  }

  /**
   * Draws.
   * Used to render visuals.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Camera} camera Camera instance.
   */
  draw(ctx, camera) {
    if (this.opacity <= 0) return;
    ctx.save();
    this.applyOpacity(ctx);
    const { screenX, screenY } = this.getScreenPosition(camera);
    this.applyTransform(ctx, screenX, screenY);
    this.applyTextStyle(ctx);
    this.drawText(ctx);
    ctx.restore();
  }

  /**
   * Applies opacity.
   * Used to keep UI visuals consistent.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  applyOpacity(ctx) {
    ctx.globalAlpha = this.opacity;
  }

  /**
   * Returns screen position.
   * Used to provide screen position for camera-relative placement.
   * @param {Camera} camera Camera instance.
   * @returns {Object} Screen position.
   */
  getScreenPosition(camera) {
    const screenX = this.x - camera.x + this.shakeOffset;
    const screenY = this.y - camera.y - this.riseOffset;
    return { screenX, screenY };
  }

  /**
   * Applies transform.
   * Used to keep UI visuals consistent.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} screenX Screen X.
   * @param {number} screenY Screen Y.
   */
  applyTransform(ctx, screenX, screenY) {
    ctx.translate(screenX, screenY);
    ctx.scale(this.scaleFactor, this.scaleFactor);
    ctx.textAlign = "center";
    ctx.lineWidth = LINE_WIDTH;
  }

  /**
   * Applies text style.
   * Used to keep UI visuals consistent.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  applyTextStyle(ctx) {
    const style = POPUP_STYLES[this.type] ?? POPUP_STYLES.coin;
    ctx.font = `${style.fontSize} ComixLoud`;
    ctx.strokeStyle = style.stroke;
    ctx.fillStyle = style.fill;
  }

  /**
   * Draws text.
   * Used to render text.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  drawText(ctx) {
    ctx.strokeText(this.text, 0, 0);
    ctx.fillText(this.text, 0, 0);
  }
}
