import { OverlayRenderer } from "./overlayBase.class.js";
import { renderBackButton } from "./overlayUtils.js";

const DEFAULT_CONTROLS = [
  { label: "Move", value: "A / D or Arrow keys" },
  { label: "Sprint", value: "Hold Shift" },
  { label: "Jump", value: "Space" },
  { label: "Slide", value: "Shift + S / Arrow down" },
  { label: "Attack / Shoot", value: "Enter" },
  { label: "Pause / Menu", value: "Escape or Menu-Button" },
];

const TITLE_BASELINE_RATIO = 0.2;
const TITLE_OFFSET_Y = 30;
const LIST_START_OFFSET = 100;
const LINE_HEIGHT_MAX = 64;
const LINE_HEIGHT_RATIO = 0.065;
const LABEL_OFFSET_X = 105;
const COLON_SPACING = 27;
const BACK_BUTTON_TARGET_SIZE = 50;
const BACK_BUTTON_MARGIN = 22;
const BACK_BUTTON_EXTRA_OFFSET_Y = 6;
const BACK_BUTTON_HOVER_SCALE = 1.2;
const BACK_BUTTON_SPRITE = { x: 713, y: 660, w: 200, h: 200 };
const BACK_BUTTON_SHADOW = { color: "rgba(0, 0, 0, 0.45)", blur: 10, offsetX: 0, offsetY: 3 };

export class ControlsOverlay {
  constructor({ showBackButton = true } = {}) {
    this.renderer = new OverlayRenderer();
    this.assets = { bgImage: null, uiImage: null };
    this.controls = DEFAULT_CONTROLS;
    this.backButtonSprite = BACK_BUTTON_SPRITE;
    this.pointer = null;
    this.backButtonHover = false;
    this.backButtonBounds = null;
    this.showBackButton = showBackButton;
  }

  setAssets({ bgImage, uiImage }) {
    this.assets = { bgImage, uiImage };
  }

  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
    this.renderer.setPointer(x, y);
  }

  clearPointer() {
    this.pointer = null;
    this.backButtonHover = false;
    this.backButtonBounds = null;
    this.renderer.clearPointer();
  }

  handleCloseButtonClick(x, y) {
    return this.renderer.handleCloseButtonClick(x, y);
  }

  handleBackClick(x, y) {
    if (!this.showBackButton) return false;
    if (!this.backButtonBounds) return false;
    const { x: boundsX, y: boundsY, w, h } = this.backButtonBounds;
    return x >= boundsX && x <= boundsX + w && y >= boundsY && y <= boundsY + h;
  }

  isHovering() {
    return this.renderer.isHovering() || (this.showBackButton && this.backButtonHover);
  }

  startRender(ctx, canvas) {
    ctx.save();
    const panelRect = this.renderer.renderPanel(ctx, {
      canvas,
      bgImage: this.assets.bgImage,
      uiImage: this.assets.uiImage,
    });
    if (!panelRect) {
      ctx.restore();
      return null;
    }
    return panelRect;
  }

  getTitleY({ y, height }) {
    return y + height * TITLE_BASELINE_RATIO + TITLE_OFFSET_Y;
  }

  getListLayout(canvas, titleY) {
    const canvasCenterX = canvas.width / 2;
    const listStartY = titleY + LIST_START_OFFSET;
    const lineHeight = Math.min(LINE_HEIGHT_MAX, canvas.height * LINE_HEIGHT_RATIO);
    const labelX = canvasCenterX - LABEL_OFFSET_X;
    const colonX = labelX + COLON_SPACING;
    const valueX = colonX + COLON_SPACING;
    return { canvasCenterX, listStartY, lineHeight, labelX, colonX, valueX };
  }

  drawTitle(ctx, canvas, titleY) {
    const canvasCenterX = canvas.width / 2;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("Controls", canvasCenterX, titleY);
  }

  drawControlsList(ctx, canvas, layout) {
    this.renderer.applyBodyStyle(ctx, canvas.width);
    this.controls.forEach((item, index) => {
      this.drawControlRow(ctx, item, index, layout);
    });
  }

  drawControlRow(ctx, item, index, { listStartY, lineHeight, labelX, colonX, valueX }) {
    const itemYPosition = listStartY + index * lineHeight;
    ctx.textAlign = "right";
    ctx.fillText(item.label, labelX, itemYPosition);
    ctx.textAlign = "center";
    ctx.fillText(":", colonX, itemYPosition);
    ctx.textAlign = "left";
    ctx.fillText(item.value, valueX, itemYPosition);
  }

  drawBackButtonIfNeeded(ctx, panelRect) {
    if (this.assets.uiImage?.naturalWidth && this.showBackButton) {
      this.drawBackButton(ctx, panelRect);
    }
  }

  render(ctx, canvas) {
    const panelRect = this.startRender(ctx, canvas);
    if (!panelRect) return;
    const titleY = this.getTitleY(panelRect);
    const layout = this.getListLayout(canvas, titleY);
    this.drawTitle(ctx, canvas, titleY);
    this.drawControlsList(ctx, canvas, layout);
    this.drawBackButtonIfNeeded(ctx, panelRect);
    ctx.restore();
  }

  getBackButtonOptions() {
    return {
      targetSize: BACK_BUTTON_TARGET_SIZE,
      margin: BACK_BUTTON_MARGIN,
      extraOffsetY: BACK_BUTTON_EXTRA_OFFSET_Y,
      hoverScale: BACK_BUTTON_HOVER_SCALE,
      shadow: BACK_BUTTON_SHADOW,
    };
  }

  getBackButtonArgs(ctx, { x, y, height }) {
    return {
      ctx,
      uiImage: this.assets.uiImage,
      sprite: this.backButtonSprite,
      pointer: this.pointer,
      containerX: x,
      containerY: y,
      containerHeight: height,
      ...this.getBackButtonOptions(),
    };
  }

  updateBackButtonState({ bounds, isHover }) {
    this.backButtonHover = isHover;
    this.backButtonBounds = bounds;
  }

  drawBackButton(ctx, panelRect) {
    const renderState = renderBackButton(this.getBackButtonArgs(ctx, panelRect));
    this.updateBackButtonState(renderState);
  }
}
