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

  setPointer(x, y) {
    if (x == null || y == null) {
      this.clearPointer();
      return;
    }
    this.pointer = { x, y };
  }

  clearPointer() {
    this.pointer = null;
    this.hovering = false;
  }

  clearRenderState() {
    this.bounds = null;
    this.hovering = false;
  }

  canRender(ctx, uiImage) {
    if (!ctx || !uiImage?.naturalWidth) {
      this.clearRenderState();
      return false;
    }
    return true;
  }

  getBaseRect(x, y, width) {
    const sprite = this.sprite;
    const baseScale = this.targetSize / sprite.w;
    const baseH = sprite.h * baseScale;
    const baseX = x + width - this.targetSize - this.margin - this.offsetX;
    const baseY = y + this.margin + this.offsetY;
    return { baseScale, baseH, baseX, baseY };
  }

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

  getDrawRect({ baseScale, baseH, baseX, baseY }, isHover) {
    const sprite = this.sprite;
    const iconScale = baseScale * (isHover ? this.hoverScale : 1);
    const iconW = sprite.w * iconScale;
    const iconH = sprite.h * iconScale;
    const iconX = baseX - (iconW - this.targetSize) / 2;
    const iconY = baseY - (iconH - baseH) / 2;
    return { x: iconX, y: iconY, w: iconW, h: iconH };
  }

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

  updateRenderState(rect, isHover) {
    this.bounds = rect;
    this.hovering = isHover;
  }

  isInsideBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;
  }

  isHovering() {
    return this.hovering;
  }

  handleCloseButtonClick(x, y) {
    if (!this.bounds) return false;
    const inside = this.isInsideBounds(x, y, this.bounds);
    if (inside) this.hovering = false;
    return inside;
  }

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
  constructor({ closeOverlay = new OverlayClose() } = {}) {
    this.closeOverlay = closeOverlay;
  }

  setPointer(x, y) {
    this.closeOverlay.setPointer(x, y);
  }

  clearPointer() {
    this.closeOverlay.clearPointer();
  }

  handleCloseButtonClick(x, y) {
    return this.closeOverlay.handleCloseButtonClick(x, y);
  }

  isHovering() {
    return this.closeOverlay.isHovering();
  }

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

  canRenderPanel(ctx, canvas, bgImage) {
    return !!ctx && !!canvas && !!bgImage?.naturalWidth;
  }

  drawBackdrop(ctx, canvas) {
    ctx.fillStyle = OVERLAY_BACKDROP_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

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

  drawPanelImage(ctx, bgImage, panelRect) {
    ctx.drawImage(bgImage, panelRect.x, panelRect.y, panelRect.width, panelRect.height);
  }

  updateCloseOverlay(ctx, uiImage, panelRect) {
    if (uiImage?.naturalWidth) {
      this.closeOverlay.render(ctx, uiImage, panelRect);
    } else {
      this.closeOverlay.clearPointer();
    }
  }

  applyTitleStyle(ctx, canvasWidth) {
    const font = `bold ${Math.min(TITLE_FONT_MAX, canvasWidth * TITLE_FONT_RATIO)}px "ComixLoud", sans-serif`;
    ctx.font = font;
    ctx.fillStyle = TITLE_COLOR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = TITLE_SHADOW_COLOR;
    ctx.shadowBlur = TITLE_SHADOW_BLUR;
  }

  applyBodyStyle(ctx, canvasWidth) {
    const font = `600 ${Math.min(BODY_FONT_MAX, canvasWidth * BODY_FONT_RATIO)}px "ComixLoud", sans-serif`;
    ctx.font = font;
    ctx.fillStyle = BODY_COLOR;
    ctx.shadowColor = BODY_SHADOW_COLOR;
    ctx.shadowBlur = BODY_SHADOW_BLUR;
  }
}
