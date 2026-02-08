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
   * Updates the instance state.
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
   * Updates the instance state.
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
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updateRise(dt) {
    this.riseOffset += dt * RISE_SPEED;
  }

  /**
   * Updates opacity.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updateOpacity(dt) {
    this.opacity -= dt * OPACITY_FADE_RATE;
  }

  /**
   * Updates scale.
   * Updates the instance state.
   * @param {number} dt Delta time in seconds.
   */
  updateScale(dt) {
    this.scaleFactor -= dt * SCALE_SHRINK_RATE;
    if (this.scaleFactor < MIN_SCALE_FACTOR) this.scaleFactor = MIN_SCALE_FACTOR;
  }

  /**
   * Updates shake.
   * Updates the instance state.
   */
  updateShake() {
    if (this.type === "damage") {
      this.shakeOffset = Math.sin(Date.now() * DAMAGE_SHAKE_FREQUENCY) * DAMAGE_SHAKE_AMPLITUDE;
    }
  }

  /**
   * Clamp opacity.
   * Updates the instance state.
   */
  clampOpacity() {
    if (this.opacity < 0) this.opacity = 0;
  }

  /**
   * Draws.
   * Renders to the canvas context.
   * Updates the instance state.
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
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  applyOpacity(ctx) {
    ctx.globalAlpha = this.opacity;
  }

  /**
   * Returns screen position.
   * Updates the instance state.
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
   * Renders to the canvas context.
   * Updates the instance state.
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
   * Renders to the canvas context.
   * Updates the instance state.
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
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   */
  drawText(ctx) {
    ctx.strokeText(this.text, 0, 0);
    ctx.fillText(this.text, 0, 0);
  }
}
