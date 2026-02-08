import {
  BG_SHADOW_COLOR,
  SUBTITLE_FILL_COLOR,
  SUBTITLE_FONT_SIZE_CAP,
  SUBTITLE_FONT_SIZE_RATIO,
  SUBTITLE_SHADOW_BLUR,
  SUBTITLE_SHADOW_COLOR,
  SUBTITLE_SHADOW_OFFSET_Y,
  SUBTITLE_STROKE_COLOR,
  SUBTITLE_STROKE_WIDTH_MIN,
  SUBTITLE_STROKE_WIDTH_RATIO,
  SUBTITLE_VERTICAL_SPACING_RATIO,
  TITLE_BASE_SIZE_CAP,
  TITLE_BASE_SIZE_RATIO,
  TITLE_FILL_SHADOW_BLUR,
  TITLE_FILL_SHADOW_COLOR,
  TITLE_GRADIENT_HEIGHT_RATIO,
  TITLE_GRADIENT_STOPS,
  TITLE_MAX_HEIGHT_RATIO,
  TITLE_MAX_WIDTH_RATIO,
  TITLE_MIN_SIZE,
  TITLE_SHADOW_BLUR,
  TITLE_SHADOW_OFFSET_Y,
  TITLE_STROKE_COLOR,
  TITLE_STROKE_WIDTH_MIN,
  TITLE_STROKE_WIDTH_RATIO,
  TITLE_Y_OFFSET_RATIO,
} from "./gameOverlay.base.constants.js";

/**
 * Returns title options.
 * Uses opts to compute the result.
 * @param {*} opts Opts.
 * @returns {Object} Title options.
 */
export function getTitleOptions(opts) {
  return {
    maxWidthRatio: TITLE_MAX_WIDTH_RATIO,
    maxHeightRatio: TITLE_MAX_HEIGHT_RATIO,
    baseSizeRatio: TITLE_BASE_SIZE_RATIO,
    baseSizeCap: TITLE_BASE_SIZE_CAP,
    minSize: TITLE_MIN_SIZE,
    yOffsetRatio: TITLE_Y_OFFSET_RATIO,
    ...(opts || {}),
  };
}

/**
 * Measure title width.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} title Title.
 * @param {number} size Size.
 * @returns {*} Result value.
 */
export function measureTitleWidth(ctx, title, size) {
  ctx.font = `900 ${size}px "ComixLoud", sans-serif`;
  return ctx.measureText(title).width;
}

/**
 * Returns title font size.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {string} title Title.
 * @param {string} titleOptions Title options.
 * @returns {*} Title font size.
 */
export function getTitleFontSize(ctx, canvas, title, titleOptions) {
  const maxTextWidth = canvas.width * titleOptions.maxWidthRatio;
  const maxTextHeight = canvas.height * titleOptions.maxHeightRatio;
  const baseSize = Math.min(titleOptions.baseSizeCap, canvas.width * titleOptions.baseSizeRatio, canvas.height * titleOptions.maxHeightRatio);
  const textWidth = this.measureTitleWidth(ctx, title, baseSize);
  if (textWidth <= maxTextWidth && baseSize <= maxTextHeight) return baseSize;
  const fitScale = Math.min(maxTextWidth / textWidth, maxTextHeight / baseSize);
  return Math.max(titleOptions.minSize, baseSize * fitScale);
}

/**
 * Returns title position.
 * Uses canvas, yOffsetRatio to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} yOffsetRatio Y offset ratio.
 * @returns {Object} Title position.
 */
export function getTitlePosition(canvas, yOffsetRatio) {
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  const titleY = canvasCenterY + canvas.height * yOffsetRatio;
  return { canvasCenterX, titleY };
}

/**
 * Applies title font.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} drawFontSize Draw font size.
 */
export function applyTitleFont(ctx, drawFontSize) {
  ctx.font = `900 ${drawFontSize}px "ComixLoud", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}

/**
 * Returns title gradient.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} titleY Title Y.
 * @param {number} drawFontSize Draw font size.
 * @returns {*} Title gradient.
 */
export function getTitleGradient(ctx, titleY, drawFontSize) {
  const gradient = ctx.createLinearGradient(0, titleY - drawFontSize, 0, titleY + drawFontSize * TITLE_GRADIENT_HEIGHT_RATIO);
  TITLE_GRADIENT_STOPS.forEach(({ stop, color }) => gradient.addColorStop(stop, color));
  return gradient;
}

/**
 * Stroke title.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} title Title.
 * @param {boolean} canvasCenterX Canvas center X.
 * @param {number} titleY Title Y.
 * @param {number} drawFontSize Draw font size.
 * @param {*} easeOut Ease out.
 */
export function strokeTitle(ctx, title, canvasCenterX, titleY, drawFontSize, easeOut) {
  ctx.lineWidth = Math.max(TITLE_STROKE_WIDTH_MIN, drawFontSize * TITLE_STROKE_WIDTH_RATIO);
  ctx.strokeStyle = TITLE_STROKE_COLOR;
  ctx.shadowColor = BG_SHADOW_COLOR;
  ctx.shadowBlur = TITLE_SHADOW_BLUR * easeOut;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = TITLE_SHADOW_OFFSET_Y * easeOut;
  ctx.strokeText(title, canvasCenterX, titleY);
}

/**
 * Fill title.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} title Title.
 * @param {boolean} canvasCenterX Canvas center X.
 * @param {number} titleY Title Y.
 * @param {*} gradient Gradient.
 * @param {*} easeOut Ease out.
 */
export function fillTitle(ctx, title, canvasCenterX, titleY, gradient, easeOut) {
  ctx.shadowColor = TITLE_FILL_SHADOW_COLOR;
  ctx.shadowBlur = TITLE_FILL_SHADOW_BLUR * easeOut;
  ctx.fillStyle = gradient;
  ctx.fillText(title, canvasCenterX, titleY);
}

/**
 * Draws title.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {string} title Title.
 * @param {*} opts Opts.
 * @param {*} easeOut Ease out.
 * @param {number} scale Scale.
 * @returns {Object} Result value.
 */
export function drawTitle(ctx, canvas, title, opts, easeOut, scale) {
  const titleOptions = this.getTitleOptions(opts);
  const targetFontSize = this.getTitleFontSize(ctx, canvas, title, titleOptions);
  const drawFontSize = targetFontSize * scale;
  const titlePosition = this.getTitlePosition(canvas, titleOptions.yOffsetRatio);
  this.applyTitleFont(ctx, drawFontSize);
  const gradient = this.getTitleGradient(ctx, titlePosition.titleY, drawFontSize);
  this.strokeTitle(ctx, title, titlePosition.canvasCenterX, titlePosition.titleY, drawFontSize, easeOut);
  this.fillTitle(ctx, title, titlePosition.canvasCenterX, titlePosition.titleY, gradient, easeOut);
  return { titleY: titlePosition.titleY, drawFontSize };
}

/**
 * Draws subtitle. If omitted, default values are used.
 * Uses ctx, canvas, text, y, easeOut, options to perform the operation.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {string} text Text.
 * @param {number} y Y.
 * @param {*} easeOut Ease out.
 * @param {Object} [options] Configuration options.
 * @param {number} [options.fontSizeCap] Font size cap.
 * @param {number} [options.fontSizeRatio] Font size ratio.
 */
export function drawSubtitle(ctx, canvas, text, y, easeOut, { fontSizeCap = SUBTITLE_FONT_SIZE_CAP, fontSizeRatio = SUBTITLE_FONT_SIZE_RATIO } = {}) {
  const fontSize = this.getSubtitleFontSize(canvas, { fontSizeCap, fontSizeRatio });
  const canvasCenterX = canvas.width / 2;
  this.applySubtitleFont(ctx, fontSize);
  this.applySubtitleStyle(ctx, fontSize, easeOut);
  this.drawSubtitleText(ctx, text, canvasCenterX, y);
  return y + fontSize + canvas.height * SUBTITLE_VERTICAL_SPACING_RATIO;
}

/**
 * Returns subtitle font size.
 * Uses canvas, options to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {Object} options Configuration options.
 * @param {number} [options.fontSizeCap] Font size cap.
 * @param {number} [options.fontSizeRatio] Font size ratio.
 */
export function getSubtitleFontSize(canvas, { fontSizeCap, fontSizeRatio }) {
  return Math.min(fontSizeCap, canvas.width * fontSizeRatio);
}

/**
 * Applies subtitle font.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} fontSize Font size.
 */
export function applySubtitleFont(ctx, fontSize) {
  ctx.font = `800 ${fontSize}px "ComixLoud", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}

/**
 * Applies subtitle style.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} fontSize Font size.
 * @param {*} easeOut Ease out.
 */
export function applySubtitleStyle(ctx, fontSize, easeOut) {
  ctx.fillStyle = SUBTITLE_FILL_COLOR;
  ctx.shadowColor = SUBTITLE_SHADOW_COLOR;
  ctx.shadowBlur = SUBTITLE_SHADOW_BLUR * easeOut;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = SUBTITLE_SHADOW_OFFSET_Y * easeOut;
  ctx.strokeStyle = SUBTITLE_STROKE_COLOR;
  ctx.lineWidth = Math.max(SUBTITLE_STROKE_WIDTH_MIN, fontSize * SUBTITLE_STROKE_WIDTH_RATIO);
}

/**
 * Draws subtitle text.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} text Text.
 * @param {boolean} canvasCenterX Canvas center X.
 * @param {number} y Y.
 */
export function drawSubtitleText(ctx, text, canvasCenterX, y) {
  ctx.strokeText(text, canvasCenterX, y);
  ctx.fillText(text, canvasCenterX, y);
}
