import { DEBUG_MODE } from "../../config/config.js";

/**
 * Draws.
 * Used to render visuals.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Camera} camera Camera instance.
 */
export function draw(ctx, camera) {
  if (!this.images.length || this.opacity <= 0) return;

  const img = this.getCurrentImage();
  if (!img) return;

  const { screenX, screenY } = this.getScreenPosition(camera);
  ctx.save();
  this.applyOpacity(ctx);
  this.drawItemImage(ctx, screenX, screenY, img);
  ctx.restore();
  this.drawDebugHitbox(ctx, camera);
}

/**
 * Returns current image.
 * Used to provide current image for rendering.
 * @returns {*} Current image.
 */
export function getCurrentImage() {
  return this.images[this.currentImage];
}

/**
 * Applies opacity.
 * Used to apply visual styling before rendering.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 */
export function applyOpacity(ctx) {
  ctx.globalAlpha = this.opacity;
}

/**
 * Returns screen position.
 * Used to provide screen position for camera-relative placement.
 * @param {Camera} camera Camera instance.
 * @returns {Object} Screen position.
 */
export function getScreenPosition(camera) {
  const screenX = this.x - (camera?.x || 0);
  const screenY = this.y - (camera?.y || 0);
  return { screenX, screenY };
}

/**
 * Draws item image.
 * Used to render item image.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} screenX Screen X.
 * @param {number} screenY Screen Y.
 * @param {HTMLImageElement} img Img.
 */
export function drawItemImage(ctx, screenX, screenY, img) {
  const { centerX, centerY } = this.getCenterPosition(screenX, screenY);
  this.applyItemTransform(ctx, centerX, centerY);
  this.paintItemImage(ctx, img);
}

/**
 * Returns center position.
 * Used to provide center position for rendering.
 * @param {number} screenX Screen X.
 * @param {number} screenY Screen Y.
 * @returns {Object} Center position.
 */
export function getCenterPosition(screenX, screenY) {
  const centerX = screenX + this.width / 2;
  const centerY = screenY + this.height / 2;
  return { centerX, centerY };
}

/**
 * Applies item transform.
 * Used to apply visual styling before rendering.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} centerX Center X.
 * @param {number} centerY Center Y.
 */
export function applyItemTransform(ctx, centerX, centerY) {
  ctx.translate(centerX, centerY);
  ctx.scale(this.scaleFactor, this.scaleFactor);
  ctx.rotate(this.rotationAngle);
}

/**
 * Paint item image.
 * Used to render item image.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLImageElement} img Img.
 */
export function paintItemImage(ctx, img) {
  ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
}

/**
 * Returns hitbox.
 * Used to provide hitbox for collision and hit testing.
 * @returns {Object} Hitbox.
 */
export function getHitbox() {
  const shrinkX = this.width * this.hitboxShrinkXFactor;
  const shrinkY = this.height * this.hitboxShrinkYFactor;
  return {
    x: this.x + shrinkX / 2,
    y: this.y + shrinkY / 2,
    width: this.width - shrinkX,
    height: this.height - shrinkY,
  };
}

/**
 * Draws debug hitbox.
 * Used to render debug hitbox.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Camera} camera Camera instance.
 */
export function drawDebugHitbox(ctx, camera) {
  if (!DEBUG_MODE) return;
  const hitbox = this.getHitbox();
  const cameraX = camera?.x || 0;
  const cameraY = camera?.y || 0;
  ctx.save();
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.strokeRect(hitbox.x - cameraX, hitbox.y - cameraY, hitbox.width, hitbox.height);
  ctx.restore();
}
