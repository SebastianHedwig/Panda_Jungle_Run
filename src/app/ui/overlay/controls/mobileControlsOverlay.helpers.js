/**
 * Returns row center Y.
 * Used to provide row center Y for rendering.
 * Uses options, index to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.listStartY] List start Y.
 * @param {number} [options.lineHeight] Line height.
 * @param {number} index Index.
 */
export function getRowCenterY({ listStartY, lineHeight }, index) {
  return listStartY + index * lineHeight + lineHeight / 2;
}

/**
 * Draws control value.
 * Used to render control value.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} value Value.
 * @param {number} valueX Value X.
 * @param {number} rowCenterY Row center Y.
 */
export function drawControlValue(ctx, value, valueX, rowCenterY) {
  ctx.textAlign = "left";
  ctx.fillText(value, valueX, rowCenterY);
}

/**
 * Returns icon.
 * Used to provide icon for UI interaction handling.
 * @param {string} src Source URL.
 * @returns {*} Icon.
 */
export function getIcon(src) {
  if (!src) return null;
  if (this.iconCache.has(src)) return this.iconCache.get(src);
  const img = new Image();
  img.onload = () => {
    this.iconCache.set(src, img);
    this.onIconLoad?.();
  };
  img.src = src;
  this.iconCache.set(src, img);
  return img;
}
