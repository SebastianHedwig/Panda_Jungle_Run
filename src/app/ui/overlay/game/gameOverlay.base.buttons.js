import {
  BG_SHADOW_COLOR,
  BUTTON_BASE_WIDTH_MAX,
  BUTTON_BASE_WIDTH_RATIO,
  BUTTON_COUNT,
  BUTTON_GAP_MAX,
  BUTTON_GAP_RATIO,
  BUTTON_HEIGHT_RATIO,
  BUTTON_HOVER_SCALE,
  BUTTON_LABEL_COLOR,
  BUTTON_LABEL_FONT_WEIGHT,
  BUTTON_LABEL_OFFSET_Y_MAX,
  BUTTON_LABEL_OFFSET_Y_RATIO,
  BUTTON_LABEL_SHADOW_BLUR,
  BUTTON_LABEL_SHADOW_COLOR,
  BUTTON_LABEL_SHADOW_OFFSET_Y,
  BUTTON_LABEL_SIZE_HEIGHT_RATIO,
  BUTTON_LABEL_SIZE_MIN,
  BUTTON_LABEL_SIZE_PADDING,
  BUTTON_LABEL_SIZE_WIDTH_RATIO,
  BUTTON_LABEL_STROKE_WIDTH_MIN,
  BUTTON_LABEL_STROKE_WIDTH_RATIO,
  BUTTON_RADIUS_MAX,
  BUTTON_SHADOW_BLUR,
  BUTTON_SHADOW_OFFSET_Y,
  BUTTON_STROKE_COLOR,
  BUTTON_STROKE_WIDTH_MIN,
  BUTTON_STROKE_WIDTH_RATIO,
  BUTTONS_Y_OFFSET,
  BUTTON_GRADIENT_STOPS,
  MIN_CORNER_RADIUS,
} from "./gameOverlay.base.constants.js";

/**
 * Draws buttons.
 * Used to render buttons.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} baseY Base Y.
 * @param {number} scale Scale.
 * @param {*} easeOut Ease out.
 */
export function drawButtons(ctx, canvas, baseY, scale, easeOut) {
  const layout = this.getButtonLayout(canvas, baseY);
  const buttons = this.getButtons(layout);
  this.buttonBounds = [];
  let hoverAny = false;
  buttons.forEach((btn) => {
    const { bounds, isHover } = this.drawButton(ctx, btn, layout, scale, easeOut);
    this.buttonBounds.push(bounds);
    hoverAny = hoverAny || isHover;
  });
  this.hovering = hoverAny;
}

/**
 * Returns button layout.
 * Used to provide button layout for UI interaction handling.
 * Uses canvas, baseY to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} baseY Base Y.
 * @returns {Object} Button layout.
 */
export function getButtonLayout(canvas, baseY) {
  const baseBtnWidth = Math.min(BUTTON_BASE_WIDTH_MAX, canvas.width * BUTTON_BASE_WIDTH_RATIO);
  const baseBtnHeight = baseBtnWidth * BUTTON_HEIGHT_RATIO;
  const btnGap = Math.min(BUTTON_GAP_MAX, canvas.width * BUTTON_GAP_RATIO);
  const totalWidth = baseBtnWidth * BUTTON_COUNT + btnGap;
  const startX = (canvas.width - totalWidth) / 2;
  const buttonsY = baseY + BUTTONS_Y_OFFSET;
  return { baseBtnWidth, baseBtnHeight, btnGap, startX, buttonsY };
}

/**
 * Returns buttons.
 * Used to provide buttons for UI interaction handling.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.baseBtnWidth] Base btn width.
 * @param {number} [options.btnGap] Btn gap.
 * @param {number} [options.startX] Start X.
 */
export function getButtons({ baseBtnWidth, btnGap, startX }) {
  return [
    { label: "Retry", action: "retry", x: startX },
    { label: "Quit", action: "quit", x: startX + baseBtnWidth + btnGap },
  ];
}

/**
 * Returns button base bounds.
 * Used to provide button base bounds for UI hit testing.
 * Uses btn, options to compute the result.
 * @param {*} btn Btn.
 * @param {Object} options Configuration options.
 * @param {number} [options.baseBtnWidth] Base btn width.
 * @param {number} [options.baseBtnHeight] Base btn height.
 * @param {number} [options.buttonsY] Buttons Y.
 */
export function getButtonBaseBounds(btn, { baseBtnWidth, baseBtnHeight, buttonsY }) {
  return {
    x: btn.x,
    y: buttonsY - baseBtnHeight / 2,
    w: baseBtnWidth,
    h: baseBtnHeight,
    action: btn.action,
  };
}

/**
 * Is pointer inside button.
 * Used to decide UI hit testing outcomes.
 * @param {*} bounds Bounds.
 * @returns {boolean} Whether pointer inside button.
 */
export function isPointerInsideButton(bounds) {
  return (
    !!this.pointer &&
    this.pointer.x >= bounds.x &&
    this.pointer.x <= bounds.x + bounds.w &&
    this.pointer.y >= bounds.y &&
    this.pointer.y <= bounds.y + bounds.h
  );
}

/**
 * Returns scaled bounds.
 * Used to provide scaled bounds for UI hit testing.
 * Uses bounds, btnScale to compute the result.
 * @param {*} bounds Bounds.
 * @param {number} btnScale Btn scale.
 * @returns {Object} Scaled bounds.
 */
export function getScaledBounds(bounds, btnScale) {
  const drawW = bounds.w * btnScale;
  const drawH = bounds.h * btnScale;
  const drawX = bounds.x + bounds.w / 2 - drawW / 2;
  const drawY = bounds.y + bounds.h / 2 - drawH / 2;
  return { ...bounds, x: drawX, y: drawY, w: drawW, h: drawH };
}

/**
 * Draws button.
 * Used to render button.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} btn Btn.
 * @param {*} layout Layout.
 * @param {number} scale Scale.
 * @param {*} easeOut Ease out.
 * @returns {Object} Result value.
 */
export function drawButton(ctx, btn, layout, scale, easeOut) {
  const bounds = this.getButtonBaseBounds(btn, layout);
  const isHover = this.isPointerInsideButton(bounds);
  const btnScale = scale * (isHover ? BUTTON_HOVER_SCALE : 1);
  const drawBounds = this.getScaledBounds(bounds, btnScale);
  this.drawButtonShape(ctx, drawBounds, easeOut);
  this.drawButtonLabel(ctx, btn.label, drawBounds, easeOut);
  return { bounds: drawBounds, isHover };
}

/**
 * Returns button gradient.
 * Used to provide button gradient for rendering.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} bounds Bounds.
 * @returns {*} Button gradient.
 */
export function getButtonGradient(ctx, bounds) {
  const btnGradient = ctx.createLinearGradient(0, bounds.y, 0, bounds.y + bounds.h);
  BUTTON_GRADIENT_STOPS.forEach(({ stop, color }) => btnGradient.addColorStop(stop, color));
  return btnGradient;
}

/**
 * Applies button shadow.
 * Used to keep UI visuals consistent.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} easeOut Ease out.
 */
export function applyButtonShadow(ctx, easeOut) {
  ctx.save();
  ctx.shadowColor = BG_SHADOW_COLOR;
  ctx.shadowBlur = BUTTON_SHADOW_BLUR * easeOut;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = BUTTON_SHADOW_OFFSET_Y * easeOut;
}

/**
 * Fill button.
 * Used to render button.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} btnGradardient Btn gradardient.
 */
export function fillButton(ctx, btnGradardient) {
  ctx.fillStyle = btnGradardient;
  ctx.fill();
}

/**
 * Stroke button.
 * Used to render button.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} bounds Bounds.
 */
export function strokeButton(ctx, bounds) {
  ctx.lineWidth = Math.max(BUTTON_STROKE_WIDTH_MIN, bounds.h * BUTTON_STROKE_WIDTH_RATIO);
  ctx.strokeStyle = BUTTON_STROKE_COLOR;
  ctx.stroke();
}

/**
 * Draws button shape.
 * Used to render button shape.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} bounds Bounds.
 * @param {*} easeOut Ease out.
 */
export function drawButtonShape(ctx, bounds, easeOut) {
  const radius = Math.min(bounds.h / 2, BUTTON_RADIUS_MAX);
  const btnGradient = this.getButtonGradient(ctx, bounds);
  this.applyButtonShadow(ctx, easeOut);
  this.drawRoundedRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, radius);
  this.fillButton(ctx, btnGradient);
  this.strokeButton(ctx, bounds);
  ctx.restore();
}

/**
 * Returns label size.
 * Used to provide label size for rendering.
 * Uses bounds to compute the result.
 * @param {*} bounds Bounds.
 * @returns {*} Label size.
 */
export function getLabelSize(bounds) {
  return Math.max(
    BUTTON_LABEL_SIZE_MIN,
    Math.min(bounds.h * BUTTON_LABEL_SIZE_HEIGHT_RATIO, bounds.w * BUTTON_LABEL_SIZE_WIDTH_RATIO) - BUTTON_LABEL_SIZE_PADDING
  );
}

/**
 * Returns label center Y.
 * Used to provide label center Y for rendering.
 * Uses bounds to compute the result.
 * @param {*} bounds Bounds.
 * @returns {*} Label center Y.
 */
export function getLabelCenterY(bounds) {
  const labelOffsetY = Math.min(BUTTON_LABEL_OFFSET_Y_MAX, bounds.h * BUTTON_LABEL_OFFSET_Y_RATIO);
  return bounds.y + bounds.h / 2 + labelOffsetY;
}

/**
 * Applies label style.
 * Used to keep UI visuals consistent.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} labelSize Label size.
 * @param {*} easeOut Ease out.
 */
export function applyLabelStyle(ctx, labelSize, easeOut) {
  ctx.font = `${BUTTON_LABEL_FONT_WEIGHT} ${labelSize}px "ComixLoud", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(BUTTON_LABEL_STROKE_WIDTH_MIN, labelSize * BUTTON_LABEL_STROKE_WIDTH_RATIO);
  ctx.strokeStyle = BUTTON_STROKE_COLOR;
  ctx.fillStyle = BUTTON_LABEL_COLOR;
  ctx.shadowColor = BUTTON_LABEL_SHADOW_COLOR;
  ctx.shadowBlur = BUTTON_LABEL_SHADOW_BLUR * easeOut;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = BUTTON_LABEL_SHADOW_OFFSET_Y * easeOut;
}

/**
 * Draws button label.
 * Used to render button label.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} label Label.
 * @param {*} bounds Bounds.
 * @param {*} easeOut Ease out.
 */
export function drawButtonLabel(ctx, label, bounds, easeOut) {
  const labelSize = this.getLabelSize(bounds);
  const labelCenterY = this.getLabelCenterY(bounds);
  ctx.save();
  this.applyLabelStyle(ctx, labelSize, easeOut);
  ctx.strokeText(label, bounds.x + bounds.w / 2, labelCenterY);
  ctx.fillText(label, bounds.x + bounds.w / 2, labelCenterY);
  ctx.restore();
}

/**
 * Draws rounded rect.
 * Used to render rounded rect.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} w W.
 * @param {*} h H.
 * @param {*} r R.
 */
export function drawRoundedRect(ctx, x, y, w, h, r) { // Draws path for rounded rectangle on the Buttons Retry and Quit
  const radius = Math.max(MIN_CORNER_RADIUS, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
