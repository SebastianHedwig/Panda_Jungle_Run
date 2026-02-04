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
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {number} [options.animDuration] Anim duration.
   * @param {number} [options.minScale] Min scale.
   * @param {number} [options.maxBgAlpha] Max bg alpha.
   * @param {*} [options.}] Value.
   */
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

  /**
   * Resets.
   * Updates the instance state.
   */
  reset() {
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
  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
  }

  /**
   * Clears pointer.
   * Updates the instance state.
   */
  clearPointer() {
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }

  /**
   * Is hovering.
   * Updates the instance state.
   * @returns {boolean} Whether hovering.
   */
  isHovering() {
    return this.hovering;
  }

  /**
   * Handles game overlay button click.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  handleGameOverlayButtonClick(x, y) {
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
  getAnimationState() {
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
  getCanvasCenter(canvas) {
    return { centerX: canvas.width / 2, centerY: canvas.height / 2 };
  }

  /**
   * Draws backdrop.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} bgAlpha Bg alpha.
   */
  drawBackdrop(ctx, canvas, bgAlpha) {
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
  startFrame(ctx, canvas) {
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
  finishFrame(ctx) {
    ctx.restore();
  }

  /**
   * Returns title options.
   * Uses opts to compute the result.
   * @param {*} opts Opts.
   * @returns {Object} Title options.
   */
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

  /**
   * Measure title width.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {string} title Title.
   * @param {number} size Size.
   * @returns {*} Result value.
   */
  measureTitleWidth(ctx, title, size) {
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
  getTitleFontSize(ctx, canvas, title, titleOptions) {
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
  getTitlePosition(canvas, yOffsetRatio) {
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
  applyTitleFont(ctx, drawFontSize) {
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
  getTitleGradient(ctx, titleY, drawFontSize) {
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
  strokeTitle(ctx, title, canvasCenterX, titleY, drawFontSize, easeOut) {
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
  fillTitle(ctx, title, canvasCenterX, titleY, gradient, easeOut) {
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
  drawSubtitle(ctx, canvas, text, y, easeOut, { fontSizeCap = SUBTITLE_FONT_SIZE_CAP, fontSizeRatio = SUBTITLE_FONT_SIZE_RATIO } = {}) {
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
  getSubtitleFontSize(canvas, { fontSizeCap, fontSizeRatio }) {
    return Math.min(fontSizeCap, canvas.width * fontSizeRatio);
  }

  /**
   * Applies subtitle font.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} fontSize Font size.
   */
  applySubtitleFont(ctx, fontSize) {
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
  applySubtitleStyle(ctx, fontSize, easeOut) {
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
  drawSubtitleText(ctx, text, canvasCenterX, y) {
    ctx.strokeText(text, canvasCenterX, y);
    ctx.fillText(text, canvasCenterX, y);
  }

  /**
   * Draws buttons.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} baseY Base Y.
   * @param {number} scale Scale.
   * @param {*} easeOut Ease out.
   */
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

  /**
   * Returns button layout.
   * Uses canvas, baseY to compute the result.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} baseY Base Y.
   * @returns {Object} Button layout.
   */
  getButtonLayout(canvas, baseY) {
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
   * Uses options to compute the result.
   * @param {Object} options Configuration options.
   * @param {number} [options.baseBtnWidth] Base btn width.
   * @param {number} [options.btnGap] Btn gap.
   * @param {number} [options.startX] Start X.
   */
  getButtons({ baseBtnWidth, btnGap, startX }) {
    return [
      { label: "Retry", action: "retry", x: startX },
      { label: "Quit", action: "quit", x: startX + baseBtnWidth + btnGap },
    ];
  }

  /**
   * Returns button base bounds.
   * Uses btn, options to compute the result.
   * @param {*} btn Btn.
   * @param {Object} options Configuration options.
   * @param {number} [options.baseBtnWidth] Base btn width.
   * @param {number} [options.baseBtnHeight] Base btn height.
   * @param {number} [options.buttonsY] Buttons Y.
   */
  getButtonBaseBounds(btn, { baseBtnWidth, baseBtnHeight, buttonsY }) {
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
   * Updates the instance state.
   * @param {*} bounds Bounds.
   * @returns {boolean} Whether pointer inside button.
   */
  isPointerInsideButton(bounds) {
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
   * Uses bounds, btnScale to compute the result.
   * @param {*} bounds Bounds.
   * @param {number} btnScale Btn scale.
   * @returns {Object} Scaled bounds.
   */
  getScaledBounds(bounds, btnScale) {
    const drawW = bounds.w * btnScale;
    const drawH = bounds.h * btnScale;
    const drawX = bounds.x + bounds.w / 2 - drawW / 2;
    const drawY = bounds.y + bounds.h / 2 - drawH / 2;
    return { ...bounds, x: drawX, y: drawY, w: drawW, h: drawH };
  }

  /**
   * Draws button.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} btn Btn.
   * @param {*} layout Layout.
   * @param {number} scale Scale.
   * @param {*} easeOut Ease out.
   * @returns {Object} Result value.
   */
  drawButton(ctx, btn, layout, scale, easeOut) {
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
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} bounds Bounds.
   * @returns {*} Button gradient.
   */
  getButtonGradient(ctx, bounds) {
    const btnGradient = ctx.createLinearGradient(0, bounds.y, 0, bounds.y + bounds.h);
    BUTTON_GRADIENT_STOPS.forEach(({ stop, color }) => btnGradient.addColorStop(stop, color));
    return btnGradient;
  }

  /**
   * Applies button shadow.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} easeOut Ease out.
   */
  applyButtonShadow(ctx, easeOut) {
    ctx.save();
    ctx.shadowColor = BG_SHADOW_COLOR;
    ctx.shadowBlur = BUTTON_SHADOW_BLUR * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = BUTTON_SHADOW_OFFSET_Y * easeOut;
  }

  /**
   * Fill button.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} btnGradardient Btn gradardient.
   */
  fillButton(ctx, btnGradardient) {
    ctx.fillStyle = btnGradardient;
    ctx.fill();
  }

  /**
   * Stroke button.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} bounds Bounds.
   */
  strokeButton(ctx, bounds) {
    ctx.lineWidth = Math.max(BUTTON_STROKE_WIDTH_MIN, bounds.h * BUTTON_STROKE_WIDTH_RATIO);
    ctx.strokeStyle = BUTTON_STROKE_COLOR;
    ctx.stroke();
  }

  /**
   * Draws button shape.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} bounds Bounds.
   * @param {*} easeOut Ease out.
   */
  drawButtonShape(ctx, bounds, easeOut) {
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
   * Uses bounds to compute the result.
   * @param {*} bounds Bounds.
   * @returns {*} Label size.
   */
  getLabelSize(bounds) {
    return Math.max(
      BUTTON_LABEL_SIZE_MIN,
      Math.min(bounds.h * BUTTON_LABEL_SIZE_HEIGHT_RATIO, bounds.w * BUTTON_LABEL_SIZE_WIDTH_RATIO) - BUTTON_LABEL_SIZE_PADDING
    );
  }

  /**
   * Returns label center Y.
   * Uses bounds to compute the result.
   * @param {*} bounds Bounds.
   * @returns {*} Label center Y.
   */
  getLabelCenterY(bounds) {
    const labelOffsetY = Math.min(BUTTON_LABEL_OFFSET_Y_MAX, bounds.h * BUTTON_LABEL_OFFSET_Y_RATIO);
    return bounds.y + bounds.h / 2 + labelOffsetY;
  }

  /**
   * Applies label style.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} labelSize Label size.
   * @param {*} easeOut Ease out.
   */
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

  /**
   * Draws button label.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {string} label Label.
   * @param {*} bounds Bounds.
   * @param {*} easeOut Ease out.
   */
  drawButtonLabel(ctx, label, bounds, easeOut) {
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
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} w W.
   * @param {*} h H.
   * @param {*} r R.
   */
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
