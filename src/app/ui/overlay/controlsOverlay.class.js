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
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {HTMLElement} [options.showBackButton] Show back button.
   */
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

  /**
   * Sets assets.
   * Uses options to perform the operation.
   * @param {Object} options Configuration options.
   * @param {HTMLImageElement} [options.bgImage] Bg image.
   * @param {HTMLImageElement} [options.uiImage] Ui image.
   */
  setAssets({ bgImage, uiImage }) {
    this.assets = { bgImage, uiImage };
  }

  /**
   * Sets pointer.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   */
  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
    this.renderer.setPointer(x, y);
  }

  /**
   * Clears pointer.
   * Updates the instance state.
   */
  clearPointer() {
    this.pointer = null;
    this.backButtonHover = false;
    this.backButtonBounds = null;
    this.renderer.clearPointer();
  }

  /**
   * Handles close button click.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  handleCloseButtonClick(x, y) {
    return this.renderer.handleCloseButtonClick(x, y);
  }

  /**
   * Handles back click.
   * Updates the instance state.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  handleBackClick(x, y) {
    if (!this.showBackButton) return false;
    if (!this.backButtonBounds) return false;
    const { x: boundsX, y: boundsY, w, h } = this.backButtonBounds;
    return x >= boundsX && x <= boundsX + w && y >= boundsY && y <= boundsY + h;
  }

  /**
   * Is hovering.
   * Updates the instance state.
   * @returns {boolean} Whether hovering.
   */
  isHovering() {
    return this.renderer.isHovering() || (this.showBackButton && this.backButtonHover);
  }

  /**
   * Starts render.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @returns {*} Result value.
   */
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

  /**
   * Returns title Y.
   * Uses options to compute the result.
   * @param {Object} options Configuration options.
   * @param {number} [options.y] Y.
   * @param {number} [options.height] Height.
   */
  getTitleY({ y, height }) {
    return y + height * TITLE_BASELINE_RATIO + TITLE_OFFSET_Y;
  }

  /**
   * Returns list layout.
   * Uses canvas, titleY to compute the result.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} titleY Title Y.
   * @returns {Object} List layout.
   */
  getListLayout(canvas, titleY) {
    const canvasCenterX = canvas.width / 2;
    const listStartY = titleY + LIST_START_OFFSET;
    const lineHeight = Math.min(LINE_HEIGHT_MAX, canvas.height * LINE_HEIGHT_RATIO);
    const labelX = canvasCenterX - LABEL_OFFSET_X;
    const colonX = labelX + COLON_SPACING;
    const valueX = colonX + COLON_SPACING;
    return { canvasCenterX, listStartY, lineHeight, labelX, colonX, valueX };
  }

  /**
   * Draws title.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} titleY Title Y.
   */
  drawTitle(ctx, canvas, titleY) {
    const canvasCenterX = canvas.width / 2;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("Controls", canvasCenterX, titleY);
  }

  /**
   * Draws controls list.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {*} layout Layout.
   */
  drawControlsList(ctx, canvas, layout) {
    this.renderer.applyBodyStyle(ctx, canvas.width);
    this.controls.forEach((item, index) => {
      this.drawControlRow(ctx, item, index, layout);
    });
  }

  /**
   * Draws control row.
   * Uses ctx, item, index, options to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} item Item.
   * @param {number} index Index.
   * @param {Object} options Configuration options.
   * @param {number} [options.listStartY] List start Y.
   * @param {number} [options.lineHeight] Line height.
   * @param {number} [options.labelX] Label X.
   * @param {number} [options.colonX] Colon X.
   * @param {number} [options.valueX] Value X.
   */
  drawControlRow(ctx, item, index, { listStartY, lineHeight, labelX, colonX, valueX }) {
    const itemYPosition = listStartY + index * lineHeight;
    ctx.textAlign = "right";
    ctx.fillText(item.label, labelX, itemYPosition);
    ctx.textAlign = "center";
    ctx.fillText(":", colonX, itemYPosition);
    ctx.textAlign = "left";
    ctx.fillText(item.value, valueX, itemYPosition);
  }

  /**
   * Draws back button if needed.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLElement} panelRect Panel rect.
   */
  drawBackButtonIfNeeded(ctx, panelRect) {
    if (this.assets.uiImage?.naturalWidth && this.showBackButton) {
      this.drawBackButton(ctx, panelRect);
    }
  }

  /**
   * Renders.
   * Renders to the canvas context.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
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

  /**
   * Returns back button options.
   * @returns {Object} Back button options.
   */
  getBackButtonOptions() {
    return {
      targetSize: BACK_BUTTON_TARGET_SIZE,
      margin: BACK_BUTTON_MARGIN,
      extraOffsetY: BACK_BUTTON_EXTRA_OFFSET_Y,
      hoverScale: BACK_BUTTON_HOVER_SCALE,
      shadow: BACK_BUTTON_SHADOW,
    };
  }

  /**
   * Returns back button args.
   * Uses ctx, options to compute the result.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Object} options Configuration options.
   * @param {number} [options.x] X.
   * @param {number} [options.y] Y.
   * @param {number} [options.height] Height.
   */
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

  /**
   * Updates back button state.
   * Uses options to perform the operation.
   * @param {Object} options Configuration options.
   * @param {*} [options.bounds] Bounds.
   * @param {boolean} [options.isHover] Whether hover.
   */
  updateBackButtonState({ bounds, isHover }) {
    this.backButtonHover = isHover;
    this.backButtonBounds = bounds;
  }

  /**
   * Draws back button.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLElement} panelRect Panel rect.
   */
  drawBackButton(ctx, panelRect) {
    const renderState = renderBackButton(this.getBackButtonArgs(ctx, panelRect));
    this.updateBackButtonState(renderState);
  }
}
