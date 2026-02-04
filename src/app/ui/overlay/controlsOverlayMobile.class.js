import { OverlayRenderer } from "./overlayBase.class.js";
import { renderBackButton } from "./overlayUtils.js";

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
   * Updates the instance state.
   * @param {Function} callback Callback.
   */
  setOnIconLoad(callback) {
    this.onIconLoad = typeof callback === "function" ? callback : null;
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
   * Returns layout.
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
   * Renders to the canvas context.
   * Updates the instance state.
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
   * Renders to the canvas context.
   * Updates the instance state.
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
   * Returns row center Y.
   * Uses options, index to compute the result.
   * @param {Object} options Configuration options.
   * @param {number} [options.listStartY] List start Y.
   * @param {number} [options.lineHeight] Line height.
   * @param {number} index Index.
   */
  getRowCenterY({ listStartY, lineHeight }, index) {
    return listStartY + index * lineHeight + lineHeight / 2;
  }

  /**
   * Returns icon layout.
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
   * Draws control value.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {*} value Value.
   * @param {number} valueX Value X.
   * @param {number} rowCenterY Row center Y.
   */
  drawControlValue(ctx, value, valueX, rowCenterY) {
    ctx.textAlign = "left";
    ctx.fillText(value, valueX, rowCenterY);
  }

  /**
   * Draws control row.
   * Renders to the canvas context.
   * Updates the instance state.
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
    const layout = this.getLayout(canvas, titleY);
    this.drawTitle(ctx, canvas, titleY);
    this.drawControls(ctx, canvas, layout);
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

  /**
   * Returns icon.
   * Updates the instance state.
   * @param {string} src Source URL.
   * @returns {*} Icon.
   */
  getIcon(src) {
    if (!src) return null;
    if (this.iconCache.has(src)) return this.iconCache.get(src);
    const img = new Image();
    img.onload = () => {
      this.iconCache.set(src, img);
      this.onIconLoad?.();
    };
    img.src = src;
    this.iconCache.set(src, img);
    return img;
  }
}
