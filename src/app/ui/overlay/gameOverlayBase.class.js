const DEFAULT_ANIM_DURATION_MS = 700;
const DEFAULT_MIN_SCALE = 0.55;
const DEFAULT_MAX_BG_ALPHA = 0.55;

const EASE_OUT_EXPONENT = 3;
const BG_SHADOW_COLOR = "rgba(0, 0, 0, 0.5)";

const TITLE_MAX_WIDTH_RATIO = 0.78;
const TITLE_MAX_HEIGHT_RATIO = 0.26;
const TITLE_BASE_SIZE_RATIO = 0.14;
const TITLE_BASE_SIZE_CAP = 140;
const TITLE_MIN_SIZE = 48;
const TITLE_Y_OFFSET_RATIO = -0.06;
const TITLE_GRADIENT_STOPS = [
  { stop: 0, color: "#fff6a1" },
  { stop: 0.35, color: "#fdd74a" },
  { stop: 0.65, color: "#f6b028" },
  { stop: 1, color: "#d87808" },
];
const TITLE_GRADIENT_HEIGHT_RATIO = 0.6;
const TITLE_STROKE_COLOR = "#8a3b04";
const TITLE_STROKE_WIDTH_MIN = 6;
const TITLE_STROKE_WIDTH_RATIO = 0.08;
const TITLE_SHADOW_BLUR = 14;
const TITLE_SHADOW_OFFSET_Y = 6;
const TITLE_FILL_SHADOW_COLOR = "rgba(255, 255, 255, 0.65)";
const TITLE_FILL_SHADOW_BLUR = 18;

const SUBTITLE_FONT_SIZE_CAP = 48;
const SUBTITLE_FONT_SIZE_RATIO = 0.06;
const SUBTITLE_STROKE_COLOR = "#8a3b04";
const SUBTITLE_STROKE_WIDTH_MIN = 3;
const SUBTITLE_STROKE_WIDTH_RATIO = 0.12;
const SUBTITLE_FILL_COLOR = "#fff";
const SUBTITLE_SHADOW_COLOR = "rgba(0, 0, 0, 0.4)";
const SUBTITLE_SHADOW_BLUR = 10;
const SUBTITLE_SHADOW_OFFSET_Y = 3;
const SUBTITLE_VERTICAL_SPACING_RATIO = 0.06;

const BUTTON_BASE_WIDTH_MAX = 280;
const BUTTON_BASE_WIDTH_RATIO = 0.24;
const BUTTON_HEIGHT_RATIO = 0.38;
const BUTTON_GAP_MAX = 40;
const BUTTON_GAP_RATIO = 0.04;
const BUTTON_COUNT = 2;
const BUTTONS_Y_OFFSET = 60;
const BUTTON_HOVER_SCALE = 1.08;
const BUTTON_RADIUS_MAX = 18;
const BUTTON_GRADIENT_STOPS = [
  { stop: 0, color: "#fff7c8" },
  { stop: 0.35, color: "#fdd74a" },
  { stop: 0.65, color: "#f6b028" },
  { stop: 1, color: "#d87808" },
];
const BUTTON_SHADOW_BLUR = 12;
const BUTTON_SHADOW_OFFSET_Y = 5;
const BUTTON_STROKE_COLOR = "#8a3b04";
const BUTTON_STROKE_WIDTH_MIN = 4;
const BUTTON_STROKE_WIDTH_RATIO = 0.08;
const BUTTON_LABEL_FONT_WEIGHT = 800;
const BUTTON_LABEL_COLOR = "#fff";
const BUTTON_LABEL_SHADOW_COLOR = "rgba(0, 0, 0, 0.4)";
const BUTTON_LABEL_SHADOW_BLUR = 10;
const BUTTON_LABEL_SHADOW_OFFSET_Y = 3;
const BUTTON_LABEL_SIZE_MIN = 10;
const BUTTON_LABEL_SIZE_HEIGHT_RATIO = 0.5;
const BUTTON_LABEL_SIZE_WIDTH_RATIO = 0.28;
const BUTTON_LABEL_SIZE_PADDING = 4;
const BUTTON_LABEL_OFFSET_Y_MAX = 6;
const BUTTON_LABEL_OFFSET_Y_RATIO = 0.08;
const BUTTON_LABEL_STROKE_WIDTH_MIN = 3;
const BUTTON_LABEL_STROKE_WIDTH_RATIO = 0.14;

const MIN_CORNER_RADIUS = 2;

export class GameOverlayBase {
  constructor({
    animDuration = DEFAULT_ANIM_DURATION_MS,
    minScale = DEFAULT_MIN_SCALE,
    maxBgAlpha = DEFAULT_MAX_BG_ALPHA,
  } = {}) {
    this.animStart = null;
    this.animDuration = animDuration;
    this.minScale = minScale;
    this.maxBgAlpha = maxBgAlpha;
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }

  reset() {
    this.animStart = null;
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }

  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
  }

  clearPointer() {
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }

  isHovering() {
    return this.hovering;
  }

  handleGameOverlayButtonClick(x, y) {
    const hit = this.buttonBounds.find(
      (bounds) => x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h
    );
    return hit?.action ?? null;
  }

  getAnimationState() {
    const now = performance?.now?.() ?? Date.now();
    if (this.animStart == null) this.animStart = now;
    const animT = Math.min(1, (now - this.animStart) / this.animDuration);
    const easeOut = 1 - Math.pow(1 - animT, EASE_OUT_EXPONENT);
    const scale = this.minScale + (1 - this.minScale) * easeOut;
    const bgAlpha = this.maxBgAlpha * easeOut;
    return { easeOut, scale, bgAlpha };
  }

  getCanvasCenter(canvas) {
    return { centerX: canvas.width / 2, centerY: canvas.height / 2 };
  }

  drawBackdrop(ctx, canvas, bgAlpha) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  startFrame(ctx, canvas) {
    const animationState = this.getAnimationState();
    const canvasCenter = this.getCanvasCenter(canvas);
    this.drawBackdrop(ctx, canvas, animationState.bgAlpha);
    return { easeOut: animationState.easeOut, scale: animationState.scale, centerX: canvasCenter.centerX, centerY: canvasCenter.centerY };
  }

  finishFrame(ctx) {
    ctx.restore();
  }

  getTitleOptions(opts) {
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

  measureTitleWidth(ctx, title, size) {
    ctx.font = `900 ${size}px "ComixLoud", sans-serif`;
    return ctx.measureText(title).width;
  }

  getTitleFontSize(ctx, canvas, title, titleOptions) {
    const maxTextWidth = canvas.width * titleOptions.maxWidthRatio;
    const maxTextHeight = canvas.height * titleOptions.maxHeightRatio;
    const baseSize = Math.min(titleOptions.baseSizeCap, canvas.width * titleOptions.baseSizeRatio, canvas.height * titleOptions.maxHeightRatio);
    const textWidth = this.measureTitleWidth(ctx, title, baseSize);
    if (textWidth <= maxTextWidth && baseSize <= maxTextHeight) return baseSize;
    const fitScale = Math.min(maxTextWidth / textWidth, maxTextHeight / baseSize);
    return Math.max(titleOptions.minSize, baseSize * fitScale);
  }

  getTitlePosition(canvas, yOffsetRatio) {
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    const titleY = canvasCenterY + canvas.height * yOffsetRatio;
    return { canvasCenterX, titleY };
  }

  applyTitleFont(ctx, drawFontSize) {
    ctx.font = `900 ${drawFontSize}px "ComixLoud", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  getTitleGradient(ctx, titleY, drawFontSize) {
    const gradient = ctx.createLinearGradient(0, titleY - drawFontSize, 0, titleY + drawFontSize * TITLE_GRADIENT_HEIGHT_RATIO);
    TITLE_GRADIENT_STOPS.forEach(({ stop, color }) => gradient.addColorStop(stop, color));
    return gradient;
  }

  strokeTitle(ctx, title, canvasCenterX, titleY, drawFontSize, easeOut) {
    ctx.lineWidth = Math.max(TITLE_STROKE_WIDTH_MIN, drawFontSize * TITLE_STROKE_WIDTH_RATIO);
    ctx.strokeStyle = TITLE_STROKE_COLOR;
    ctx.shadowColor = BG_SHADOW_COLOR;
    ctx.shadowBlur = TITLE_SHADOW_BLUR * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = TITLE_SHADOW_OFFSET_Y * easeOut;
    ctx.strokeText(title, canvasCenterX, titleY);
  }

  fillTitle(ctx, title, canvasCenterX, titleY, gradient, easeOut) {
    ctx.shadowColor = TITLE_FILL_SHADOW_COLOR;
    ctx.shadowBlur = TITLE_FILL_SHADOW_BLUR * easeOut;
    ctx.fillStyle = gradient;
    ctx.fillText(title, canvasCenterX, titleY);
  }

  drawTitle(ctx, canvas, title, opts, easeOut, scale) {
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

  drawSubtitle(ctx, canvas, text, y, easeOut, { fontSizeCap = SUBTITLE_FONT_SIZE_CAP, fontSizeRatio = SUBTITLE_FONT_SIZE_RATIO } = {}) {
    const fontSize = this.getSubtitleFontSize(canvas, { fontSizeCap, fontSizeRatio });
    const canvasCenterX = canvas.width / 2;
    this.applySubtitleFont(ctx, fontSize);
    this.applySubtitleStyle(ctx, fontSize, easeOut);
    this.drawSubtitleText(ctx, text, canvasCenterX, y);
    return y + fontSize + canvas.height * SUBTITLE_VERTICAL_SPACING_RATIO;
  }

  getSubtitleFontSize(canvas, { fontSizeCap, fontSizeRatio }) {
    return Math.min(fontSizeCap, canvas.width * fontSizeRatio);
  }

  applySubtitleFont(ctx, fontSize) {
    ctx.font = `800 ${fontSize}px "ComixLoud", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  applySubtitleStyle(ctx, fontSize, easeOut) {
    ctx.fillStyle = SUBTITLE_FILL_COLOR;
    ctx.shadowColor = SUBTITLE_SHADOW_COLOR;
    ctx.shadowBlur = SUBTITLE_SHADOW_BLUR * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = SUBTITLE_SHADOW_OFFSET_Y * easeOut;
    ctx.strokeStyle = SUBTITLE_STROKE_COLOR;
    ctx.lineWidth = Math.max(SUBTITLE_STROKE_WIDTH_MIN, fontSize * SUBTITLE_STROKE_WIDTH_RATIO);
  }

  drawSubtitleText(ctx, text, canvasCenterX, y) {
    ctx.strokeText(text, canvasCenterX, y);
    ctx.fillText(text, canvasCenterX, y);
  }

  drawButtons(ctx, canvas, baseY, scale, easeOut) {
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

  getButtonLayout(canvas, baseY) {
    const baseBtnWidth = Math.min(BUTTON_BASE_WIDTH_MAX, canvas.width * BUTTON_BASE_WIDTH_RATIO);
    const baseBtnHeight = baseBtnWidth * BUTTON_HEIGHT_RATIO;
    const btnGap = Math.min(BUTTON_GAP_MAX, canvas.width * BUTTON_GAP_RATIO);
    const totalWidth = baseBtnWidth * BUTTON_COUNT + btnGap;
    const startX = (canvas.width - totalWidth) / 2;
    const buttonsY = baseY + BUTTONS_Y_OFFSET;
    return { baseBtnWidth, baseBtnHeight, btnGap, startX, buttonsY };
  }

  getButtons({ baseBtnWidth, btnGap, startX }) {
    return [
      { label: "Retry", action: "retry", x: startX },
      { label: "Quit", action: "quit", x: startX + baseBtnWidth + btnGap },
    ];
  }

  getButtonBaseBounds(btn, { baseBtnWidth, baseBtnHeight, buttonsY }) {
    return {
      x: btn.x,
      y: buttonsY - baseBtnHeight / 2,
      w: baseBtnWidth,
      h: baseBtnHeight,
      action: btn.action,
    };
  }

  isPointerInsideButton(bounds) {
    return (
      !!this.pointer &&
      this.pointer.x >= bounds.x &&
      this.pointer.x <= bounds.x + bounds.w &&
      this.pointer.y >= bounds.y &&
      this.pointer.y <= bounds.y + bounds.h
    );
  }

  getScaledBounds(bounds, btnScale) {
    const drawW = bounds.w * btnScale;
    const drawH = bounds.h * btnScale;
    const drawX = bounds.x + bounds.w / 2 - drawW / 2;
    const drawY = bounds.y + bounds.h / 2 - drawH / 2;
    return { ...bounds, x: drawX, y: drawY, w: drawW, h: drawH };
  }

  drawButton(ctx, btn, layout, scale, easeOut) {
    const bounds = this.getButtonBaseBounds(btn, layout);
    const isHover = this.isPointerInsideButton(bounds);
    const btnScale = scale * (isHover ? BUTTON_HOVER_SCALE : 1);
    const drawBounds = this.getScaledBounds(bounds, btnScale);
    this.drawButtonShape(ctx, drawBounds, easeOut);
    this.drawButtonLabel(ctx, btn.label, drawBounds, easeOut);
    return { bounds: drawBounds, isHover };
  }

  getButtonGradient(ctx, bounds) {
    const btnGradient = ctx.createLinearGradient(0, bounds.y, 0, bounds.y + bounds.h);
    BUTTON_GRADIENT_STOPS.forEach(({ stop, color }) => btnGradient.addColorStop(stop, color));
    return btnGradient;
  }

  applyButtonShadow(ctx, easeOut) {
    ctx.save();
    ctx.shadowColor = BG_SHADOW_COLOR;
    ctx.shadowBlur = BUTTON_SHADOW_BLUR * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = BUTTON_SHADOW_OFFSET_Y * easeOut;
  }

  fillButton(ctx, btnGradardient) {
    ctx.fillStyle = btnGradardient;
    ctx.fill();
  }

  strokeButton(ctx, bounds) {
    ctx.lineWidth = Math.max(BUTTON_STROKE_WIDTH_MIN, bounds.h * BUTTON_STROKE_WIDTH_RATIO);
    ctx.strokeStyle = BUTTON_STROKE_COLOR;
    ctx.stroke();
  }

  drawButtonShape(ctx, bounds, easeOut) {
    const radius = Math.min(bounds.h / 2, BUTTON_RADIUS_MAX);
    const btnGradient = this.getButtonGradient(ctx, bounds);
    this.applyButtonShadow(ctx, easeOut);
    this.drawRoundedRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, radius);
    this.fillButton(ctx, btnGradient);
    this.strokeButton(ctx, bounds);
    ctx.restore();
  }

  getLabelSize(bounds) {
    return Math.max(
      BUTTON_LABEL_SIZE_MIN,
      Math.min(bounds.h * BUTTON_LABEL_SIZE_HEIGHT_RATIO, bounds.w * BUTTON_LABEL_SIZE_WIDTH_RATIO) - BUTTON_LABEL_SIZE_PADDING
    );
  }

  getLabelCenterY(bounds) {
    const labelOffsetY = Math.min(BUTTON_LABEL_OFFSET_Y_MAX, bounds.h * BUTTON_LABEL_OFFSET_Y_RATIO);
    return bounds.y + bounds.h / 2 + labelOffsetY;
  }

  applyLabelStyle(ctx, labelSize, easeOut) {
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

  drawButtonLabel(ctx, label, bounds, easeOut) {
    const labelSize = this.getLabelSize(bounds);
    const labelCenterY = this.getLabelCenterY(bounds);
    ctx.save();
    this.applyLabelStyle(ctx, labelSize, easeOut);
    ctx.strokeText(label, bounds.x + bounds.w / 2, labelCenterY);
    ctx.fillText(label, bounds.x + bounds.w / 2, labelCenterY);
    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, w, h, r) { // Draws path for rounded rectangle on the Buttons Retry and Quit
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
}
