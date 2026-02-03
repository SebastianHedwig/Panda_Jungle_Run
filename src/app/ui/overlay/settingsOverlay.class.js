import { OverlayRenderer } from "./overlayBase.class.js";
import { ControlsOverlay } from "./controlsOverlay.class.js";
import { ControlsOverlayMobile } from "./controlsOverlayMobile.class.js";
import { applyOverlayTextStyle } from "./overlayUtils.js";

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

export class SettingsOverlay {
  constructor({ backgroundImage = null, uiImage = null, onQuit = null } = {}) {
    this.renderer = new OverlayRenderer();
    this.controlsOverlayDesktop = new ControlsOverlay({ showBackButton: true });
    this.controlsOverlayMobile = new ControlsOverlayMobile({ showBackButton: true });
    this.assets = { bgImage: backgroundImage, uiImage };
    this.pointer = null;
    this.itemBounds = [];
    this.showControls = false;
    this.onQuit = onQuit;
  }

  getActiveControlsOverlay() {
    const container = document.getElementById("game-container");
    const useMobile = container?.classList?.contains("auto-fullscreen");
    return useMobile ? this.controlsOverlayMobile : this.controlsOverlayDesktop;
  }

  setAssets({ bgImage, uiImage }) {
    this.assets = { bgImage, uiImage };
    this.controlsOverlayDesktop.setAssets({ bgImage, uiImage });
    this.controlsOverlayMobile.setAssets({ bgImage, uiImage });
  }

  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
    if (this.showControls) {
      this.getActiveControlsOverlay().setPointer(x, y);
    } else {
      this.renderer.setPointer(x, y);
    }
  }

  clearPointer() {
    this.pointer = null;
    this.itemBounds = [];
    this.renderer.clearPointer();
    this.controlsOverlayDesktop.clearPointer();
    this.controlsOverlayMobile.clearPointer();
  }

  isInsideBounds(x, y, bounds) {
    return x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;
  }

  isPointerInsideBounds(bounds) {
    const pointer = this.pointer;
    return !!pointer && this.isInsideBounds(pointer.x, pointer.y, bounds);
  }

  exitControlsOverlay(activeOverlay) {
    this.showControls = false;
    activeOverlay.clearPointer();
    this.renderer.clearPointer();
    return false;
  }

  handleControlsClick(x, y) {
    const activeOverlay = this.getActiveControlsOverlay();
    if (activeOverlay.handleBackClick?.(x, y)) return this.exitControlsOverlay(activeOverlay);
    if (activeOverlay.handleCloseButtonClick(x, y)) {
      this.showControls = false;
      return true;
    }
    return false;
  }

  getItemHitIndex(x, y) {
    return this.itemBounds.findIndex((bounds) => this.isInsideBounds(x, y, bounds));
  }

  openControls() {
    this.showControls = true;
    this.renderer.clearPointer();
    this.controlsOverlayDesktop.clearPointer();
    this.controlsOverlayMobile.clearPointer();
    return false;
  }

  quitGame() {
    this.showControls = false;
    this.clearPointer();
    this.onQuit?.();
    return true;
  }

  handleMenuItemHit(hitIndex) {
    if (hitIndex === 0) return this.openControls();
    if (hitIndex === 1) return this.quitGame();
    return false;
  }

  handleSettingsOverlayClick(x, y) {
    if (this.showControls) return this.handleControlsClick(x, y);
    if (this.renderer.handleCloseButtonClick(x, y)) return true;
    const hitIndex = this.getItemHitIndex(x, y);
    return this.handleMenuItemHit(hitIndex);
  }

  textStyle(ctx) {
    applyOverlayTextStyle(ctx, { fill: OVERLAY_TEXT_COLOR });
  }

  renderControlsLayer(ctx, canvas) {
    const activeOverlay = this.getActiveControlsOverlay();
    activeOverlay.setAssets({
      bgImage: this.assets.bgImage,
      uiImage: this.assets.uiImage,
    });
    activeOverlay.render(ctx, canvas);
    if (canvas) canvas.style.cursor = activeOverlay.isHovering() ? "pointer" : "default";
    ctx.restore();
  }

  getTitleY({ y, height }) {
    return y + height * TITLE_BASELINE_RATIO + TITLE_OFFSET_Y;
  }

  drawSettingsTitle(ctx, canvas, titleY) {
    const canvasCenterX = canvas.width / 2;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("SETTINGS", canvasCenterX, titleY);
  }

  drawPausedText(ctx, canvas, titleY) {
    const pausedY = titleY + Math.min(PAUSED_MAX_OFFSET, canvas.height * PAUSED_HEIGHT_RATIO) + PAUSED_EXTRA_OFFSET_Y;
    ctx.font = `${TITLE_FONT_WEIGHT} ${Math.min(PAUSED_MAX_FONT, canvas.width * PAUSED_FONT_SCALE)}px "ComixLoud", sans-serif`;
    this.textStyle(ctx);
    ctx.fillText("(game paused)", canvas.width / 2, pausedY);
    return pausedY;
  }

  getListLayout(canvas, pausedY) {
    const listStartY = pausedY + Math.min(LIST_MAX_OFFSET, canvas.height * LIST_OFFSET_RATIO) + LIST_EXTRA_OFFSET_Y;
    const lineHeight = Math.min(LIST_MAX_LINE_HEIGHT, canvas.height * LIST_LINE_HEIGHT_RATIO);
    const canvasCenterX = canvas.width / 2;
    return { listStartY, lineHeight, canvasCenterX };
  }

  applyMenuFont(ctx, canvas) {
    const bodyFont = `${TITLE_FONT_WEIGHT} ${Math.min(BODY_FONT_MAX, canvas.width * BODY_FONT_SCALE)}px "ComixLoud", sans-serif`;
    ctx.font = bodyFont;
    this.textStyle(ctx);
  }

  getMenuItems() {
    return ["CONTROLS", "QUIT GAME"];
  }

  getMenuItemLayout(ctx, item, index, { listStartY, lineHeight, canvasCenterX }) {
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

  drawMenuItem(ctx, item, { itemYPosition, hoverScale }, canvasCenterX) {
    ctx.save();
    ctx.translate(canvasCenterX, itemYPosition);
    ctx.scale(hoverScale, hoverScale);
    ctx.textAlign = "center";
    ctx.fillText(item, 0, 0);
    ctx.restore();
  }

  renderMenuItems(ctx, items, layout) {
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

  renderMenuLayer(ctx, canvas) {
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

  renderMenuContent(ctx, canvas, panelRect) {
    const titleY = this.getTitleY(panelRect);
    this.drawSettingsTitle(ctx, canvas, titleY);
    const pausedY = this.drawPausedText(ctx, canvas, titleY);
    const listLayout = this.getListLayout(canvas, pausedY);
    this.applyMenuFont(ctx, canvas);
    return this.renderMenuItems(ctx, this.getMenuItems(), listLayout);
  }

  render(ctx, canvas) {
    if (canvas) canvas.style.cursor = "default";

    ctx.save();
    if (this.showControls) {
      this.renderControlsLayer(ctx, canvas);
      return;
    }
    this.renderMenuLayer(ctx, canvas);
  }
}
