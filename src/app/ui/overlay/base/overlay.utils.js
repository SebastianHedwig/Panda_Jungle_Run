/**
 * Returns back button base rect.
 * Used to provide back button base rect for UI interaction handling.
 * Advances animation state and sprites.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.sprite] Sprite.
 * @param {number} [options.targetSize] Target size.
 * @param {number} [options.containerX] Container X.
 * @param {number} [options.containerY] Container Y.
 * @param {number} [options.containerHeight] Container height.
 * @param {*} [options.margin] Margin.
 * @param {number} [options.extraOffsetY] Extra offset Y.
 */
function getBackButtonBaseRect({ sprite, targetSize, containerX, containerY, containerHeight, margin, extraOffsetY }) {
  const baseScale = targetSize / sprite.w;
  const iconW = sprite.w * baseScale;
  const iconH = sprite.h * baseScale;
  const iconX = containerX + margin;
  const iconY = containerY + containerHeight - iconH - margin - extraOffsetY;
  return { x: iconX, y: iconY, w: iconW, h: iconH };
}

/**
 * Is pointer inside rect.
 * Used to decide UI hit testing outcomes.
 * Uses pointer, rect to perform the operation.
 * @param {*} pointer Pointer.
 * @param {*} rect Rect.
 * @returns {boolean} Whether pointer inside rect.
 */
function isPointerInsideRect(pointer, rect) {
  return !!pointer && pointer.x >= rect.x && pointer.x <= rect.x + rect.w && pointer.y >= rect.y && pointer.y <= rect.y + rect.h;
}

/**
 * Returns scaled rect.
 * Used to provide scaled rect for UI interaction handling.
 * Uses rect, scale to compute the result.
 * @param {*} rect Rect.
 * @param {number} scale Scale.
 * @returns {Object} Scaled rect.
 */
function getScaledRect(rect, scale) {
  const drawW = rect.w * scale;
  const drawH = rect.h * scale;
  const drawX = rect.x - (drawW - rect.w) / 2;
  const drawY = rect.y - (drawH - rect.h) / 2;
  return { x: drawX, y: drawY, w: drawW, h: drawH };
}

/**
 * Draws back button sprite.
 * Used to render back button sprite.
 * Renders to the canvas context.
 * Advances animation state and sprites.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLImageElement} uiImage Ui image.
 * @param {HTMLImageElement} sprite Sprite.
 * @param {*} rect Rect.
 * @param {*} shadow Shadow.
 */
function drawBackButtonSprite(ctx, uiImage, sprite, rect, shadow) {
  ctx.save();
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetX = shadow.offsetX;
  ctx.shadowOffsetY = shadow.offsetY;
  ctx.drawImage(uiImage, sprite.x, sprite.y, sprite.w, sprite.h, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/**
 * Renders back button. If omitted, default values are used.
 * Used to render back button. If omitted, default values are used.
 * Advances animation state and sprites.
 * @param {Object} [options] Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLImageElement} [options.uiImage] Ui image.
 * @param {HTMLImageElement} [options.sprite] Sprite.
 * @param {*} [options.pointer] Pointer.
 * @param {number} [options.containerX] Container X.
 * @param {number} [options.containerY] Container Y.
 * @param {number} [options.containerHeight] Container height.
 * @param {number} [options.targetSize] Target size.
 * @param {*} [options.margin] Margin.
 * @param {number} [options.extraOffsetY] Extra offset Y.
 * @param {number} [options.hoverScale] Hover scale.
 * @param {*} [options.shadow] Shadow.
 */
export function renderBackButton({
  ctx, uiImage, sprite, pointer, containerX, containerY, containerHeight, targetSize, margin, extraOffsetY = 0, hoverScale = 1,
  shadow = { color: "rgba(0, 0, 0, 0.45)", blur: 10, offsetX: 0, offsetY: 3 },
}) {
  if (!ctx || !uiImage?.naturalWidth || !sprite) return { bounds: null, isHover: false };
  const baseRect = getBackButtonBaseRect({
    sprite, targetSize, containerX, containerY, containerHeight, margin, extraOffsetY
  });
  const isHover = isPointerInsideRect(pointer, baseRect);
  const drawRect = getScaledRect(baseRect, isHover ? hoverScale : 1);
  drawBackButtonSprite(ctx, uiImage, sprite, drawRect, shadow);
  return { bounds: drawRect, isHover };
}

/**
 * Applies overlay text style. If omitted, default values are used.
 * Used to keep UI visuals consistent.
 * Uses ctx, options to perform the operation.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.fill] Fill.
 * @param {string} [options.shadowColor] Shadow color.
 * @param {*} [options.shadowBlur] Shadow blur.
 */
export function applyOverlayTextStyle(
  ctx,
  { fill = "rgb(0, 110, 110)", shadowColor = "rgba(0, 0, 0, 0)", shadowBlur = 0 } = {}
) {
  ctx.fillStyle = fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
}
