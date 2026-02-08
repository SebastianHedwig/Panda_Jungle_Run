/**
 * Draws.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Camera} camera Camera instance.
 */
export function draw(ctx, camera) {
  if (!this.images.length || this.opacity <= 0) return;

  const img = this.getCurrentImage();
  if (!img) return;

  ctx.save();
  this.applyOpacity(ctx);
  const { screenX, screenY } = this.getScreenPosition(camera);
  this.drawItemImage(ctx, screenX, screenY, img);
  ctx.restore();
}

/**
 * Returns current image.
 * Updates the instance state.
 * @returns {*} Current image.
 */
export function getCurrentImage() {
  return this.images[this.currentImage];
}

/**
 * Applies opacity.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 */
export function applyOpacity(ctx) {
  ctx.globalAlpha = this.opacity;
}

/**
 * Returns screen position.
 * Updates the instance state.
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
 * Updates the instance state.
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
 * Updates the instance state.
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
 * Renders to the canvas context.
 * Updates the instance state.
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
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLImageElement} img Img.
 */
export function paintItemImage(ctx, img) {
  ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
}
