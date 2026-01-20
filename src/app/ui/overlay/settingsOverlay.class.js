import { OverlayRenderer } from "./overlayBase.class.js";
import { ControlsOverlay } from "./controlsOverlay.class.js";
import { ControlsOverlayMobile } from "./controlsOverlayMobile.class.js";

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
      (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
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
    const titleY = y + height * 0.18 + 70;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("SETTINGS", canvas.width / 2, titleY);

    const pausedY = titleY + Math.min(26, canvas.height * 0.03) + 45;
    ctx.font = `600 ${Math.min(18, canvas.width * 0.02)}px "ComixLoud", sans-serif`;
    ctx.fillStyle = "rgb(0, 110, 110)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0)";
    ctx.shadowBlur = 0;
    ctx.fillText("(game paused)", canvas.width / 2, pausedY);

    const listStartY = pausedY + Math.min(90, canvas.height * 0.09) + 50;
    const lineHeight = Math.min(100, canvas.height * 0.15);
    const bodyFont = `600 ${Math.min(28, canvas.width * 0.03)}px "ComixLoud", sans-serif`;
    ctx.font = bodyFont;
    ctx.fillStyle = "rgb(0, 110, 110)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0)";
    ctx.shadowBlur = 0;

    const items = ["CONTROLS", "QUIT GAME"];
    this.itemBounds = [];
    let hoverAny = false;
    items.forEach((item, index) => {
      const yPos = listStartY + index * lineHeight;
      const textWidth = ctx.measureText(item).width;
      const padding = 30;
      const bounds = {
        x: canvas.width / 2 - textWidth / 2 - padding / 2,
        y: yPos - lineHeight / 2,
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
      const scale = isHover ? 1.25 : 1;
      hoverAny = hoverAny || isHover;

      ctx.save();
      ctx.translate(canvas.width / 2, yPos);
      ctx.scale(scale, scale);
      ctx.textAlign = "center";
      ctx.fillText(item, 0, 0);
      ctx.restore();
    });
    if (canvas) canvas.style.cursor = hoverAny ? "pointer" : "default";
    ctx.restore();
  }
}
