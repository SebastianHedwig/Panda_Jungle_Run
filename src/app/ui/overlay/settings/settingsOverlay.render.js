import { applyOverlayTextStyle } from "../base/overlay.utils.js";

const DEFAULT_BUTTON_PADDING = 30;
const TITLE_OFFSET_Y = 70;
const PAUSED_EXTRA_OFFSET_Y = 45;
const LIST_EXTRA_OFFSET_Y = 50;
const HOVER_SCALE = 1.25;
const TITLE_BASELINE_RATIO = 0.18;
const PAUSED_MAX_FONT = 18;
const PAUSED_MAX_OFFSET = 26;
const PAUSED_HEIGHT_RATIO = 0.03;
const PAUSED_FONT_SCALE = 0.02;
const LIST_MAX_OFFSET = 90;
const LIST_MAX_LINE_HEIGHT = 100;
const LIST_OFFSET_RATIO = 0.09;
const LIST_LINE_HEIGHT_RATIO = 0.15;
const BODY_FONT_MAX = 28;
const BODY_FONT_SCALE = 0.03;
const TITLE_FONT_WEIGHT = 600;
const OVERLAY_TEXT_COLOR = "rgb(0, 110, 110)";

/**
 * Text style.
 * Uses ctx to perform the operation.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 */
export function textStyle(ctx) {
  applyOverlayTextStyle(ctx, { fill: OVERLAY_TEXT_COLOR });
}

/**
 * Renders controls layer.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 */
export function renderControlsLayer(ctx, canvas) {
  const activeOverlay = this.getActiveControlsOverlay();
  activeOverlay.setAssets({
    bgImage: this.assets.bgImage,
    uiImage: this.assets.uiImage,
  });
  activeOverlay.render(ctx, canvas);
  if (canvas) canvas.style.cursor = activeOverlay.isHovering() ? "pointer" : "default";
  ctx.restore();
}

/**
 * Returns title Y.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.y] Y.
 * @param {number} [options.height] Height.
 */
export function getTitleY({ y, height }) {
  return y + height * TITLE_BASELINE_RATIO + TITLE_OFFSET_Y;
}

/**
 * Draws settings title.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} titleY Title Y.
 */
export function drawSettingsTitle(ctx, canvas, titleY) {
  const canvasCenterX = canvas.width / 2;
  this.renderer.applyTitleStyle(ctx, canvas.width);
  ctx.fillText("SETTINGS", canvasCenterX, titleY);
}

/**
 * Draws paused text.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} titleY Title Y.
 * @returns {*} Result value.
 */
export function drawPausedText(ctx, canvas, titleY) {
  const pausedY = titleY + Math.min(PAUSED_MAX_OFFSET, canvas.height * PAUSED_HEIGHT_RATIO) + PAUSED_EXTRA_OFFSET_Y;
  ctx.font = `${TITLE_FONT_WEIGHT} ${Math.min(PAUSED_MAX_FONT, canvas.width * PAUSED_FONT_SCALE)}px "ComixLoud", sans-serif`;
  this.textStyle(ctx);
  ctx.fillText("(game paused)", canvas.width / 2, pausedY);
  return pausedY;
}

/**
 * Returns list layout.
 * Uses canvas, pausedY to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} pausedY Paused Y.
 * @returns {Object} List layout.
 */
export function getListLayout(canvas, pausedY) {
  const listStartY = pausedY + Math.min(LIST_MAX_OFFSET, canvas.height * LIST_OFFSET_RATIO) + LIST_EXTRA_OFFSET_Y;
  const lineHeight = Math.min(LIST_MAX_LINE_HEIGHT, canvas.height * LIST_LINE_HEIGHT_RATIO);
  const canvasCenterX = canvas.width / 2;
  return { listStartY, lineHeight, canvasCenterX };
}

/**
 * Applies menu font.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 */
export function applyMenuFont(ctx, canvas) {
  const bodyFont = `${TITLE_FONT_WEIGHT} ${Math.min(BODY_FONT_MAX, canvas.width * BODY_FONT_SCALE)}px "ComixLoud", sans-serif`;
  ctx.font = bodyFont;
  this.textStyle(ctx);
}

/**
 * Returns menu items.
 * @returns {Array<any>} Menu items.
 */
export function getMenuItems() {
  return ["CONTROLS", "QUIT GAME"];
}

/**
 * Returns menu item layout.
 * Uses ctx, item, index, options to compute the result.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} item Item.
 * @param {number} index Index.
 * @param {Object} options Configuration options.
 * @param {number} [options.listStartY] List start Y.
 * @param {number} [options.lineHeight] Line height.
 * @param {boolean} [options.canvasCenterX] Canvas center X.
 */
export function getMenuItemLayout(ctx, item, index, { listStartY, lineHeight, canvasCenterX }) {
  const itemYPosition = listStartY + index * lineHeight;
  const textWidth = ctx.measureText(item).width;
  const padding = DEFAULT_BUTTON_PADDING;
  const bounds = {
    x: canvasCenterX - textWidth / 2 - padding / 2,
    y: itemYPosition - lineHeight / 2,
    w: textWidth + padding,
    h: lineHeight,
  };
  const isHover = this.isPointerInsideBounds(bounds);
  const hoverScale = isHover ? HOVER_SCALE : 1;
  return { bounds, itemYPosition, hoverScale, isHover };
}

/**
 * Draws menu item.
 * Uses ctx, item, options, canvasCenterX to perform the operation.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} item Item.
 * @param {Object} options Configuration options.
 * @param {number} [options.itemYPosition] Item Y position.
 * @param {number} [options.hoverScale] Hover scale.
 * @param {boolean} canvasCenterX Canvas center X.
 */
export function drawMenuItem(ctx, item, { itemYPosition, hoverScale }, canvasCenterX) {
  ctx.save();
  ctx.translate(canvasCenterX, itemYPosition);
  ctx.scale(hoverScale, hoverScale);
  ctx.textAlign = "center";
  ctx.fillText(item, 0, 0);
  ctx.restore();
}

/**
 * Renders menu items.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} items Items.
 * @param {*} layout Layout.
 * @returns {*} Result value.
 */
export function renderMenuItems(ctx, items, layout) {
  this.itemBounds = [];
  let hoverAny = false;
  items.forEach((item, index) => {
    const itemLayout = this.getMenuItemLayout(ctx, item, index, layout);
    this.itemBounds.push(itemLayout.bounds);
    this.drawMenuItem(ctx, item, itemLayout, layout.canvasCenterX);
    hoverAny = hoverAny || itemLayout.isHover;
  });
  return hoverAny;
}

/**
 * Renders menu layer.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 */
export function renderMenuLayer(ctx, canvas) {
  const panelRect = this.renderer.renderPanel(ctx, {
    canvas,
    bgImage: this.assets.bgImage,
    uiImage: this.assets.uiImage,
  });
  if (!panelRect) return;
  const hoverAny = this.renderMenuContent(ctx, canvas, panelRect);
  if (canvas) canvas.style.cursor = hoverAny ? "pointer" : "default";
  ctx.restore();
}

/**
 * Renders menu content.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {HTMLElement} panelRect Panel rect.
 * @returns {*} Result value.
 */
export function renderMenuContent(ctx, canvas, panelRect) {
  const titleY = this.getTitleY(panelRect);
  this.drawSettingsTitle(ctx, canvas, titleY);
  const pausedY = this.drawPausedText(ctx, canvas, titleY);
  const listLayout = this.getListLayout(canvas, pausedY);
  this.applyMenuFont(ctx, canvas);
  return this.renderMenuItems(ctx, this.getMenuItems(), listLayout);
}

/**
 * Renders.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 */
export function render(ctx, canvas) {
  if (canvas) canvas.style.cursor = "default";

  ctx.save();
  if (this.showControls) {
    this.renderControlsLayer(ctx, canvas);
    return;
  }
  this.renderMenuLayer(ctx, canvas);
}
