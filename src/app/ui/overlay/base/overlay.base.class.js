const DEFAULT_CLOSE_SPRITE = { x: 240, y: 1150, w: 190, h: 190 };
const CLOSE_TARGET_SIZE = 40;
const CLOSE_MARGIN = 16;
const CLOSE_OFFSET_X = 18;
const CLOSE_OFFSET_Y = 23.5;
const CLOSE_HOVER_SCALE = 1.2;
const CLOSE_SHADOW = { color: "rgba(0, 0, 0, 0.45)", blur: 10, offsetX: 0, offsetY: 3 };

const OVERLAY_BACKDROP_COLOR = "rgba(0, 0, 0, 0.45)";
const PANEL_MAX_WIDTH_RATIO = 0.9;
const PANEL_MAX_HEIGHT_RATIO = 0.9;
const PANEL_MAX_SCALE = 2;

const TITLE_FONT_MAX = 48;
const TITLE_FONT_RATIO = 0.04;
const TITLE_COLOR = "rgb(0, 110, 110)";
const TITLE_SHADOW_COLOR = "rgba(0, 0, 0, 0.6)";
const TITLE_SHADOW_BLUR = 10;

const BODY_FONT_MAX = 24;
const BODY_FONT_RATIO = 0.025;
const BODY_COLOR = "rgb(0, 110, 110)";
const BODY_SHADOW_COLOR = "rgba(0, 0, 0, 0.0)";
const BODY_SHADOW_BLUR = 0;

export class OverlayClose {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Advances animation state and sprites.
   * @param {Object} [options] Configuration options.
   * @param {HTMLImageElement} [options.sprite] Sprite.
   * @param {number} [options.targetSize] Target size.
   * @param {*} [options.margin] Margin.
   * @param {number} [options.offsetX] Offset X.
   * @param {number} [options.offsetY] Offset Y.
   * @param {number} [options.hoverScale] Hover scale.
   * @param {*} [options.shadow] Shadow.
   * @param {*} [options.}] Value.
   */
  constructor({
    sprite = DEFAULT_CLOSE_SPRITE,
    targetSize = CLOSE_TARGET_SIZE,
    margin = CLOSE_MARGIN,
    offsetX = CLOSE_OFFSET_X,
    offsetY = CLOSE_OFFSET_Y,
    hoverScale = CLOSE_HOVER_SCALE,
    shadow = CLOSE_SHADOW,
  } = {}) {
    this.sprite = sprite;
    this.targetSize = targetSize;
    this.margin = margin;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.hoverScale = hoverScale;
    this.shadow = shadow;
    this.pointer = null;
    this.bounds = null;
    this.hovering = false;
  }

  /**
   * Sets pointer.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   */
  setPointer(x, y) {
    if (x == null || y == null) {
      this.clearPointer();
      return;
    }
    this.pointer = { x, y };
  }

  /**
   * Clears pointer.
   * Updates the instance state.
   */
  clearPointer() {
    this.pointer = null;
    this.hovering = false;
  }

  /**
   * Clears render state.
   * Updates the instance state.
   */
  clearRenderState() {
    this.bounds = null;
    this.hovering = false;
  }

  /**
   * Can render.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLImageElement} uiImage Ui image.
   * @returns {boolean} Whether render.
   */
  canRender(ctx, uiImage) {
    if (!ctx || !uiImage?.naturalWidth) {
      this.clearRenderState();
      return false;
    }
    return true;
  }

  /**
   * Returns base rect.
   * Advances animation state and sprites.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} width Width.
   * @returns {Object} Base rect.
   */
  getBaseRect(x, y, width) {
    const sprite = this.sprite;
    const baseScale = this.targetSize / sprite.w;
    const baseH = sprite.h * baseScale;
    const baseX = x + width - this.targetSize - this.margin - this.offsetX;
    const baseY = y + this.margin + this.offsetY;
    return { baseScale, baseH, baseX, baseY };
  }

  /**
   * Returns hover state.
   * Uses options to compute the result.
   * @param {Object} options Configuration options.
   * @param {number} [options.baseX] Base X.
   * @param {number} [options.baseY] Base Y.
   * @param {*} [options.baseH] Base H.
   */
  getHoverState({ baseX, baseY, baseH }) {
    const pointer = this.pointer;
    return (
      !!pointer &&
      pointer.x >= baseX &&
      pointer.x <= baseX + this.targetSize &&
      pointer.y >= baseY &&
      pointer.y <= baseY + baseH
    );
  }

  /**
   * Returns draw rect.
   * Uses options, isHover to compute the result.
   * @param {Object} options Configuration options.
   * @param {number} [options.baseScale] Base scale.
   * @param {*} [options.baseH] Base H.
   * @param {number} [options.baseX] Base X.
   * @param {number} [options.baseY] Base Y.
   * @param {boolean} isHover Whether hover.
   */
  getDrawRect({ baseScale, baseH, baseX, baseY }, isHover) {
    const sprite = this.sprite;
    const iconScale = baseScale * (isHover ? this.hoverScale : 1);
    const iconW = sprite.w * iconScale;
    const iconH = sprite.h * iconScale;
    const iconX = baseX - (iconW - this.targetSize) / 2;
    const iconY = baseY - (iconH - baseH) / 2;
    return { x: iconX, y: iconY, w: iconW, h: iconH };
  }

  /**
   * Draws icon.
   * Renders to the canvas context.
   * Advances animation state and sprites.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLImageElement} uiImage Ui image.
   * @param {*} rect Rect.
   */
  drawIcon(ctx, uiImage, rect) {
    const sprite = this.sprite;
    ctx.save();
    ctx.shadowColor = this.shadow.color;
    ctx.shadowBlur = this.shadow.blur;
    ctx.shadowOffsetX = this.shadow.offsetX;
    ctx.shadowOffsetY = this.shadow.offsetY;
    ctx.drawImage(uiImage, sprite.x, sprite.y, sprite.w, sprite.h, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  /**
   * Updates render state.
   * Updates the instance state.
   * @param {*} rect Rect.
   * @param {boolean} isHover Whether hover.
   */
  updateRenderState(rect, isHover) {
    this.bounds = rect;
    this.hovering = isHover;
  }

  /**
   * Is inside bounds.
   * Uses x, y, bounds to perform the operation.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {*} bounds Bounds.
   * @returns {boolean} Whether inside bounds.
   */
  isInsideBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;
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
   * Handles close button click.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  handleCloseButtonClick(x, y) {
    if (!this.bounds) return false;
    const inside = this.isInsideBounds(x, y, this.bounds);
    if (inside) this.hovering = false;
    return inside;
  }

  /**
   * Renders.
   * Uses ctx, uiImage, options to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLImageElement} uiImage Ui image.
   * @param {Object} options Configuration options.
   * @param {number} [options.x] X.
   * @param {number} [options.y] Y.
   * @param {number} [options.width] Width.
   * @param {number} [options.height] Height.
   */
  render(ctx, uiImage, { x, y, width, height }) {
    if (!this.canRender(ctx, uiImage)) return;
    const baseRect = this.getBaseRect(x, y, width);
    const isHover = this.getHoverState(baseRect);
    const drawRect = this.getDrawRect(baseRect, isHover);
    this.drawIcon(ctx, uiImage, drawRect);
    this.updateRenderState(drawRect, isHover);
  }
}

export class OverlayRenderer {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {OverlayClose} [options.closeOverlay] Close overlay.
   */
  constructor({ closeOverlay = new OverlayClose() } = {}) {
    this.closeOverlay = closeOverlay;
  }

  /**
   * Sets pointer.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   */
  setPointer(x, y) {
    this.closeOverlay.setPointer(x, y);
  }

  /**
   * Clears pointer.
   * Updates the instance state.
   */
  clearPointer() {
    this.closeOverlay.clearPointer();
  }

  /**
   * Handles close button click.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  handleCloseButtonClick(x, y) {
    return this.closeOverlay.handleCloseButtonClick(x, y);
  }

  /**
   * Is hovering.
   * Updates the instance state.
   * @returns {boolean} Whether hovering.
   */
  isHovering() {
    return this.closeOverlay.isHovering();
  }

  /**
   * Renders panel.
   * Uses ctx, options to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Object} options Configuration options.
   * @param {HTMLCanvasElement} [options.canvas] Target canvas.
   * @param {HTMLImageElement} [options.bgImage] Bg image.
   * @param {HTMLImageElement} [options.uiImage] Ui image.
   */
  renderPanel(ctx, { canvas, bgImage, uiImage }) {
    if (!this.canRenderPanel(ctx, canvas, bgImage)) return null;
    ctx.save();
    this.drawBackdrop(ctx, canvas);
    const panelRect = this.getPanelRect(canvas, bgImage);
    this.drawPanelImage(ctx, bgImage, panelRect);
    this.updateCloseOverlay(ctx, uiImage, panelRect);
    ctx.restore();
    return panelRect;
  }

  /**
   * Can render panel.
   * Uses ctx, canvas, bgImage to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {HTMLImageElement} bgImage Bg image.
   * @returns {boolean} Whether render panel.
   */
  canRenderPanel(ctx, canvas, bgImage) {
    return !!ctx && !!canvas && !!bgImage?.naturalWidth;
  }

  /**
   * Draws backdrop.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  drawBackdrop(ctx, canvas) {
    ctx.fillStyle = OVERLAY_BACKDROP_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Returns panel rect.
   * Uses canvas, bgImage to compute the result.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {HTMLImageElement} bgImage Bg image.
   * @returns {Object} Panel rect.
   */
  getPanelRect(canvas, bgImage) {
    const maxW = canvas.width * PANEL_MAX_WIDTH_RATIO;
    const maxH = canvas.height * PANEL_MAX_HEIGHT_RATIO;
    const panelScale = Math.min(maxW / bgImage.naturalWidth, maxH / bgImage.naturalHeight, PANEL_MAX_SCALE);
    const drawW = bgImage.naturalWidth * panelScale;
    const drawH = bgImage.naturalHeight * panelScale;
    const x = (canvas.width - drawW) / 2;
    const y = (canvas.height - drawH) / 2;
    return { x, y, width: drawW, height: drawH };
  }

  /**
   * Draws panel image.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLImageElement} bgImage Bg image.
   * @param {HTMLElement} panelRect Panel rect.
   */
  drawPanelImage(ctx, bgImage, panelRect) {
    ctx.drawImage(bgImage, panelRect.x, panelRect.y, panelRect.width, panelRect.height);
  }

  /**
   * Updates close overlay.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLImageElement} uiImage Ui image.
   * @param {HTMLElement} panelRect Panel rect.
   */
  updateCloseOverlay(ctx, uiImage, panelRect) {
    if (uiImage?.naturalWidth) {
      this.closeOverlay.render(ctx, uiImage, panelRect);
    } else {
      this.closeOverlay.clearPointer();
    }
  }

  /**
   * Applies title style.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {boolean} canvasWidth Canvas width.
   */
  applyTitleStyle(ctx, canvasWidth) {
    const font = `bold ${Math.min(TITLE_FONT_MAX, canvasWidth * TITLE_FONT_RATIO)}px "ComixLoud", sans-serif`;
    ctx.font = font;
    ctx.fillStyle = TITLE_COLOR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = TITLE_SHADOW_COLOR;
    ctx.shadowBlur = TITLE_SHADOW_BLUR;
  }

  /**
   * Applies body style.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {boolean} canvasWidth Canvas width.
   */
  applyBodyStyle(ctx, canvasWidth) {
    const font = `600 ${Math.min(BODY_FONT_MAX, canvasWidth * BODY_FONT_RATIO)}px "ComixLoud", sans-serif`;
    ctx.font = font;
    ctx.fillStyle = BODY_COLOR;
    ctx.shadowColor = BODY_SHADOW_COLOR;
    ctx.shadowBlur = BODY_SHADOW_BLUR;
  }
}
