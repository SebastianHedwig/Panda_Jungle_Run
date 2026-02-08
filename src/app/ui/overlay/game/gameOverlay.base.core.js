import { EASE_OUT_EXPONENT } from "./gameOverlay.base.constants.js";

/**
 * Resets.
 * Updates the instance state.
 */
export function reset() {
  this.animStart = null;
  this.pointer = null;
  this.buttonBounds = [];
  this.hovering = false;
}

/**
 * Sets pointer.
 * Updates the instance state.
 * @param {number} x X.
 * @param {number} y Y.
 */
export function setPointer(x, y) {
  this.pointer = x == null || y == null ? null : { x, y };
}

/**
 * Clears pointer.
 * Updates the instance state.
 */
export function clearPointer() {
  this.pointer = null;
  this.buttonBounds = [];
  this.hovering = false;
}

/**
 * Is hovering.
 * Updates the instance state.
 * @returns {boolean} Whether hovering.
 */
export function isHovering() {
  return this.hovering;
}

/**
 * Handles game overlay button click.
 * Updates the instance state.
 * @param {number} x X.
 * @param {number} y Y.
 * @returns {*} Result value.
 */
export function handleGameOverlayButtonClick(x, y) {
  const hit = this.buttonBounds.find(
    (bounds) => x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h
  );
  return hit?.action ?? null;
}

/**
 * Returns animation state.
 * Updates the instance state.
 * @returns {Object} Animation state.
 */
export function getAnimationState() {
  const now = performance?.now?.() ?? Date.now();
  if (this.animStart == null) this.animStart = now;
  const animT = Math.min(1, (now - this.animStart) / this.animDuration);
  const easeOut = 1 - Math.pow(1 - animT, EASE_OUT_EXPONENT);
  const scale = this.minScale + (1 - this.minScale) * easeOut;
  const bgAlpha = this.maxBgAlpha * easeOut;
  return { easeOut, scale, bgAlpha };
}

/**
 * Returns canvas center.
 * Uses canvas to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @returns {Object} Canvas center.
 */
export function getCanvasCenter(canvas) {
  return { centerX: canvas.width / 2, centerY: canvas.height / 2 };
}

/**
 * Draws backdrop.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} bgAlpha Bg alpha.
 */
export function drawBackdrop(ctx, canvas, bgAlpha) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Starts frame.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @returns {Object} Result value.
 */
export function startFrame(ctx, canvas) {
  const animationState = this.getAnimationState();
  const canvasCenter = this.getCanvasCenter(canvas);
  this.drawBackdrop(ctx, canvas, animationState.bgAlpha);
  return { easeOut: animationState.easeOut, scale: animationState.scale, centerX: canvasCenter.centerX, centerY: canvasCenter.centerY };
}

/**
 * Finish frame.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 */
export function finishFrame(ctx) {
  ctx.restore();
}
