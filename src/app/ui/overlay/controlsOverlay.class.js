import { OverlayRenderer } from "./overlayBase.class.js";

const DEFAULT_CONTROLS = [
  { label: "Move", value: "A / D or Arrow keys" },
  { label: "Sprint", value: "Hold Shift" },
  { label: "Jump", value: "Space" },
  { label: "Slide", value: "Shift + S / Arrow down" },
  { label: "Attack / Shoot", value: "Enter" },
  { label: "Pause / Menu", value: "Escape or Menu-Button" },
];

export class ControlsOverlay {
  constructor({ showBackButton = true } = {}) {
    this.renderer = new OverlayRenderer();
    this.assets = { bgImage: null, uiImage: null };
    this.controls = DEFAULT_CONTROLS;
    this.backButtonSprite = { x: 713, y: 660, w: 200, h: 200 };
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

  handleClick(x, y) {
    return this.renderer.handleClick(x, y);
  }

  handleBackClick(x, y) {
    if (!this.showBackButton) return false;
    if (!this.backButtonBounds) return false;
    const { x: bx, y: by, w, h } = this.backButtonBounds;
    return x >= bx && x <= bx + w && y >= by && y <= by + h;
  }

  isHovering() {
    return this.renderer.isHovering() || (this.showBackButton && this.backButtonHover);
  }

  render(ctx, canvas) {
    ctx.save();
    const panelRect = this.renderer.renderPanel(ctx, {
      canvas,
      bgImage: this.assets.bgImage,
      uiImage: this.assets.uiImage,
    });
    if (!panelRect) {
      ctx.restore();
      return;
    }

    const { x, y, width, height } = panelRect;
    const titleY = y + height * 0.2 + 30;
    const canvasCenterX = canvas.width / 2;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("Controls", canvasCenterX, titleY);

    const listStartY = titleY + 100;
    const lineHeight = Math.min(64, canvas.height * 0.065);
    const labelX = canvasCenterX - 105;
    const colonX = labelX + 27;
    const valueX = colonX + 27;

    this.renderer.applyBodyStyle(ctx, canvas.width);
    this.controls.forEach((item, index) => {
      const yPos = listStartY + index * lineHeight;
      ctx.textAlign = "right";
      ctx.fillText(item.label, labelX, yPos);
      ctx.textAlign = "center";
      ctx.fillText(":", colonX, yPos);
      ctx.textAlign = "left";
      ctx.fillText(item.value, valueX, yPos);
    });

    if (this.assets.uiImage?.naturalWidth && this.showBackButton) {
      this.drawBackButton(ctx, panelRect);
    }
    ctx.restore();
  }

  drawBackButton(ctx, { x, y, width, height }) {
    const sprite = this.backButtonSprite;
    const targetSize = 50;
    const scale = targetSize / sprite.w;
    const iconW = sprite.w * scale;
    const iconH = sprite.h * scale;
    const margin = 22;
    const iconX = x + margin;
    const iconY = y + height - iconH - margin - 6;

    const isHover = this.pointer
      ? this.pointer.x >= iconX &&
        this.pointer.x <= iconX + iconW &&
        this.pointer.y >= iconY &&
        this.pointer.y <= iconY + iconH
      : false;
    this.backButtonHover = isHover;
    const hoverScale = isHover ? 1.2 : 1;
    const drawW = iconW * hoverScale;
    const drawH = iconH * hoverScale;
    const drawX = iconX - (drawW - iconW) / 2;
    const drawY = iconY - (drawH - iconH) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(
      this.assets.uiImage,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      drawX,
      drawY,
      drawW,
      drawH
    );
    ctx.restore();
    this.backButtonBounds = { x: drawX, y: drawY, w: drawW, h: drawH };
  }
}
