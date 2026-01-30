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

  handleClick(x, y) {
    if (this.showControls) {
      const activeOverlay = this.getActiveControlsOverlay();
      if (activeOverlay.handleBackClick?.(x, y)) {
        this.showControls = false;
        activeOverlay.clearPointer();
        this.renderer.clearPointer();
        return false;
      }
      if (activeOverlay.handleClick(x, y)) {
        this.showControls = false;
        return true;
      }
      return false;
    }

    if (this.renderer.handleClick(x, y)) return true;

    const hitIndex = this.itemBounds.findIndex(
      (bounds) =>
        x >= bounds.x &&
        x <= bounds.x + bounds.w &&
        y >= bounds.y &&
        y <= bounds.y + bounds.h
    );
    if (hitIndex === 0) {
      this.showControls = true;
      this.renderer.clearPointer();
      this.controlsOverlayDesktop.clearPointer();
      this.controlsOverlayMobile.clearPointer();
      return false;
    }
    if (hitIndex === 1) {
      this.showControls = false;
      this.clearPointer();
      this.onQuit?.();
      return true;
    }
    return false;
  }

  textStyle(ctx) {
    applyOverlayTextStyle(ctx, { fill: OVERLAY_TEXT_COLOR });
  }

  render(ctx, canvas) {
    if (canvas) canvas.style.cursor = "default";

    ctx.save();
    if (this.showControls) {
      const activeOverlay = this.getActiveControlsOverlay();
      activeOverlay.setAssets({
        bgImage: this.assets.bgImage,
        uiImage: this.assets.uiImage,
      });
      activeOverlay.render(ctx, canvas);
      if (canvas) canvas.style.cursor = activeOverlay.isHovering() ? "pointer" : "default";
      ctx.restore();
      return;
    }

    const panelRect = this.renderer.renderPanel(ctx, {
      canvas,
      bgImage: this.assets.bgImage,
      uiImage: this.assets.uiImage,
    });
    if (!panelRect) return;

    const { y, height } = panelRect;
    const titleY = y + height * TITLE_BASELINE_RATIO + TITLE_OFFSET_Y;
    const canvasCenterX = canvas.width / 2;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("SETTINGS", canvasCenterX, titleY);

    const pausedY = titleY + Math.min(PAUSED_MAX_OFFSET, canvas.height * PAUSED_HEIGHT_RATIO) + PAUSED_EXTRA_OFFSET_Y;
    ctx.font = `${TITLE_FONT_WEIGHT} ${Math.min(PAUSED_MAX_FONT, canvas.width * PAUSED_FONT_SCALE)}px "ComixLoud", sans-serif`;
    this.textStyle(ctx);
    ctx.fillText("(game paused)", canvasCenterX, pausedY);

    const listStartY = pausedY + Math.min(LIST_MAX_OFFSET, canvas.height * LIST_OFFSET_RATIO) + LIST_EXTRA_OFFSET_Y;
    const lineHeight = Math.min(LIST_MAX_LINE_HEIGHT, canvas.height * LIST_LINE_HEIGHT_RATIO);
    const bodyFont = `${TITLE_FONT_WEIGHT} ${Math.min(BODY_FONT_MAX, canvas.width * BODY_FONT_SCALE)}px "ComixLoud", sans-serif`;
    ctx.font = bodyFont;
    this.textStyle(ctx);

    const items = ["CONTROLS", "QUIT GAME"];
    this.itemBounds = [];
    let hoverAny = false;
    items.forEach((item, index) => {
      const itemYPosition = listStartY + index * lineHeight;
      const textWidth = ctx.measureText(item).width;
      const padding = DEFAULT_BUTTON_PADDING;
      const bounds = {
        x: canvasCenterX - textWidth / 2 - padding / 2,
        y: itemYPosition - lineHeight / 2,
        w: textWidth + padding,
        h: lineHeight,
      };
      this.itemBounds.push(bounds);

      const isHover =
        !!this.pointer &&
        this.pointer.x >= bounds.x &&
        this.pointer.x <= bounds.x + bounds.w &&
        this.pointer.y >= bounds.y &&
        this.pointer.y <= bounds.y + bounds.h;
      const hoverScale = isHover ? HOVER_SCALE : 1;
      hoverAny = hoverAny || isHover;

      ctx.save();
      ctx.translate(canvasCenterX, itemYPosition);
      ctx.scale(hoverScale, hoverScale);
      ctx.textAlign = "center";
      ctx.fillText(item, 0, 0);
      ctx.restore();
    });
    if (canvas) canvas.style.cursor = hoverAny ? "pointer" : "default";
    ctx.restore();
  }
}
