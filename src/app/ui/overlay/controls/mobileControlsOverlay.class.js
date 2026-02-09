import { OverlayRenderer } from "../base/overlay.base.class.js";
import { renderBackButton } from "../base/overlay.utils.js";
import { drawControlValue, getIcon, getRowCenterY } from "./mobileControlsOverlay.helpers.js";

const MOBILE_CONTROLS = [
  {
    icon: "./assets/icons/mobileControls/arrow-backward.png",
    alt: "Walk left",
    value: "Walk Left",
  },
  {
    icon: "./assets/icons/mobileControls/arrow-forward.png",
    alt: "Walk right",
    value: "Walk Right",
  },
  {
    icon: "./assets/icons/mobileControls/button-fast-forward-inactive.png",
    alt: "toggle Walk/Run",
    value: "Walk / Run (toggle)",
  },
  {
    icon: "./assets/icons/mobileControls/button-jump.png",
    alt: "Jump",
    value: "Jump",
  },
  {
    icon: "./assets/icons/mobileControls/button-attack.png",
    alt: "Attack",
    value: "Attack",
  },
  {
    icon: "./assets/icons/mobileControls/button-slide.png",
    alt: "Slide",
    value: "Slide",
  }
];

const TITLE_BASELINE_RATIO = 0.2;
const TITLE_OFFSET_Y = 30;
const ICON_SIZE_MAX = 32;
const ICON_SIZE_RATIO = 0.05;
const LIST_START_OFFSET = 75;
const LINE_HEIGHT_EXTRA = 14;
const LINE_HEIGHT_MAX = 68;
const LINE_HEIGHT_RATIO = 0.065;
const ICON_X_OFFSET = 100;
const VALUE_X_PADDING = 30;
const ICON_INNER_SIZE_RATIO = 0.7;
const ICON_CENTERING_RATIO = 0.5;
const FULL_CIRCLE_RADIANS = Math.PI * 2;
const ICON_GRADIENT_START = "rgba(0, 200, 200, 0.65)";
const ICON_GRADIENT_END = "rgba(0, 80, 80, 0.65)";
const BACK_BUTTON_TARGET_SIZE = 50;
const BACK_BUTTON_MARGIN = 22;
const BACK_BUTTON_EXTRA_OFFSET_Y = 6;
const BACK_BUTTON_HOVER_SCALE = 1.2;
const BACK_BUTTON_SPRITE = { x: 713, y: 660, w: 200, h: 200 };
const BACK_BUTTON_SHADOW = { color: "rgba(0, 0, 0, 0.45)", blur: 10, offsetX: 0, offsetY: 3 };

export class ControlsOverlayMobile {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for UI interaction handling.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {HTMLElement} [options.showBackButton] Show back button.
   */
  constructor({ showBackButton = true } = {}) {
    this.renderer = new OverlayRenderer();
    this.assets = { bgImage: null, uiImage: null };
    this.controls = MOBILE_CONTROLS;
    this.backButtonSprite = BACK_BUTTON_SPRITE;
    this.pointer = null;
    this.backButtonHover = false;
    this.backButtonBounds = null;
    this.showBackButton = showBackButton;
    this.iconCache = new Map();
    this.onIconLoad = null;
  }

  /**
   * Sets on icon load.
   * Used to support UI interaction handling.
   * @param {Function} callback Callback.
   */
  setOnIconLoad(callback) {
    this.onIconLoad = typeof callback === "function" ? callback : null;
  }

  /**
   * Sets assets.
   * Used to support UI interaction handling.
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
   * Used to support UI interaction handling.
   * @param {number} x X.
   * @param {number} y Y.
   */
  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
    this.renderer.setPointer(x, y);
  }

  /**
   * Clears pointer.
   */
  clearPointer() {
    this.pointer = null;
    this.backButtonHover = false;
    this.backButtonBounds = null;
    this.renderer.clearPointer();
  }

  /**
   * Handles close button click.
   * Used to centralize a specific behavior for UI interaction handling.
   * @param {number} x X.
   * @param {number} y Y.
   * @returns {*} Result value.
   */
  handleCloseButtonClick(x, y) {
    return this.renderer.handleCloseButtonClick(x, y);
  }

  /**
   * Handles back click.
   * Used to centralize a specific behavior for UI interaction handling.
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
   * Used to decide UI hit testing outcomes.
   * @returns {boolean} Whether hovering.
   */
  isHovering() {
    return this.renderer.isHovering() || (this.showBackButton && this.backButtonHover);
  }

  /**
   * Starts render.
   * Used to support UI interaction handling.
   * Renders to the canvas context.
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
   * Used to provide title Y for UI interaction handling.
   * Uses options to compute the result.
   * @param {Object} options Configuration options.
   * @param {number} [options.y] Y.
   * @param {number} [options.height] Height.
   */
  getTitleY({ y, height }) {
    return y + height * TITLE_BASELINE_RATIO + TITLE_OFFSET_Y;
  }

  /**
   * Returns layout.
   * Used to provide layout for UI interaction handling.
   * Uses canvas, titleY to compute the result.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} titleY Title Y.
   * @returns {Object} Layout.
   */
  getLayout(canvas, titleY) {
    const canvasCenterX = canvas.width / 2;
    const iconSize = Math.min(ICON_SIZE_MAX, canvas.width * ICON_SIZE_RATIO);
    const listStartY = titleY + LIST_START_OFFSET;
    const lineHeight = Math.max(iconSize + LINE_HEIGHT_EXTRA, Math.min(LINE_HEIGHT_MAX, canvas.height * LINE_HEIGHT_RATIO));
    const iconX = canvasCenterX - ICON_X_OFFSET;
    const valueX = iconX + iconSize + VALUE_X_PADDING;
    return { canvasCenterX, iconSize, listStartY, lineHeight, iconX, valueX };
  }

  /**
   * Draws title.
   * Used to render title.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} titleY Title Y.
   */
  drawTitle(ctx, canvas, titleY) {
    const canvasCenterX = canvas.width / 2;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("Mobile Controls", canvasCenterX, titleY);
  }

  /**
   * Draws controls.
   * Used to render controls.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {*} layout Layout.
   */
  drawControls(ctx, canvas, layout) {
    this.renderer.applyBodyStyle(ctx, canvas.width);
    ctx.textBaseline = "middle";
    this.controls.forEach((item, index) => {
      this.drawControlRow(ctx, item, index, layout);
    });
  }


  /**
   * Returns icon layout.
   * Used to provide icon layout for UI interaction handling.
   * Uses rowCenterY, options to compute the result.
   * @param {number} rowCenterY Row center Y.
   * @param {Object} options Configuration options.
   * @param {number} [options.iconSize] Icon size.
   * @param {number} [options.iconX] Icon X.
   */
  getIconLayout(rowCenterY, { iconSize, iconX }) {
    const drawX = iconX;
    const drawY = rowCenterY - iconSize * ICON_CENTERING_RATIO;
    return { drawX, drawY, iconSize };
  }

  /**
   * Draws icon background.
   * Used to render icon background.
   * Uses ctx, options to perform the operation.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {Object} options Configuration options.
   * @param {number} [options.drawX] Draw X.
   * @param {number} [options.drawY] Draw Y.
   * @param {number} [options.iconSize] Icon size.
   */
  drawIconBackground(ctx, { drawX, drawY, iconSize }) {
    const grad = ctx.createLinearGradient(drawX, drawY, drawX + iconSize, drawY + iconSize);
    grad.addColorStop(0, ICON_GRADIENT_START);
    grad.addColorStop(1, ICON_GRADIENT_END);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(drawX + iconSize / 2, drawY + iconSize / 2, iconSize / 2, 0, FULL_CIRCLE_RADIANS);
    ctx.fill();
  }

  /**
   * Returns icon image rect.
   * Used to provide icon image rect for UI interaction handling.
   * Uses img, options to compute the result.
   * @param {HTMLImageElement} img Img.
   * @param {Object} options Configuration options.
   * @param {number} [options.drawX] Draw X.
   * @param {number} [options.drawY] Draw Y.
   * @param {number} [options.iconSize] Icon size.
   */
  getIconImageRect(img, { drawX, drawY, iconSize }) {
    const innerSize = iconSize * ICON_INNER_SIZE_RATIO;
    const maxIconDimension = Math.max(img.naturalWidth, img.naturalHeight);
    const iconScale = innerSize / maxIconDimension;
    const imgW = img.naturalWidth * iconScale;
    const imgH = img.naturalHeight * iconScale;
    const imgX = drawX + (iconSize - imgW) / 2;
    const imgY = drawY + (iconSize - imgH) / 2;
    return { imgX, imgY, imgW, imgH };
  }


  /**
   * Draws control row.
   * Used to render control row.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} item Item.
   * @param {number} index Index.
   * @param {*} layout Layout.
   */
  drawControlRow(ctx, item, index, layout) {
    const rowCenterY = this.getRowCenterY(layout, index);
    const iconLayout = this.getIconLayout(rowCenterY, layout);
    const img = this.getIcon(item.icon);
    ctx.save();
    this.drawIconBackground(ctx, iconLayout);
    if (!img?.naturalWidth || !img?.naturalHeight) {
      ctx.restore();
      return;
    }
    const imageRect = this.getIconImageRect(img, iconLayout);
    ctx.drawImage(img, imageRect.imgX, imageRect.imgY, imageRect.imgW, imageRect.imgH);
    ctx.restore();
    this.drawControlValue(ctx, item.value, layout.valueX, rowCenterY);
  }

  /**
   * Draws back button if needed.
   * Used to render back button if needed.
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
   * Used to render visuals.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  render(ctx, canvas) {
    const panelRect = this.startRender(ctx, canvas);
    if (!panelRect) return;
    const titleY = this.getTitleY(panelRect);
    const layout = this.getLayout(canvas, titleY);
    this.drawTitle(ctx, canvas, titleY);
    this.drawControls(ctx, canvas, layout);
    this.drawBackButtonIfNeeded(ctx, panelRect);
    ctx.restore();
  }

  /**
   * Returns back button options.
   * Used to provide back button options for UI interaction handling.
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
   * Used to provide back button args for UI interaction handling.
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
   * Used to advance state during the update loop for UI interaction handling.
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
   * Used to render back button.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLElement} panelRect Panel rect.
   */
  drawBackButton(ctx, panelRect) {
    const renderState = renderBackButton(this.getBackButtonArgs(ctx, panelRect));
    this.updateBackButtonState(renderState);
  }

}

Object.assign(ControlsOverlayMobile.prototype, {
  getRowCenterY,
  drawControlValue,
  getIcon,
});
