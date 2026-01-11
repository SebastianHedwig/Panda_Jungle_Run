export class OverlayClose {
  constructor({
    sprite = { x: 240, y: 1150, w: 190, h: 190 },
    targetSize = 40,
    margin = 16,
    offsetX = 18,
    offsetY = 23.5,
    hoverScale = 1.2,
    shadow = { color: "rgba(0, 0, 0, 0.45)", blur: 10, offsetX: 0, offsetY: 3 },
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

  isHovering() {
    return this.hovering;
  }

  handleClick(x, y) {
    if (!this.bounds) return false;
    const inside = x >= this.bounds.x && x <= this.bounds.x + this.bounds.w && y >= this.bounds.y && y <= this.bounds.y + this.bounds.h;
    if (inside) this.hovering = false;
    return inside;
  }

  render(ctx, uiImage, { x, y, width, height }) {
    if (!ctx || !uiImage?.naturalWidth) {
      this.bounds = null;
      this.hovering = false;
      return;
    }

    const c = this.sprite;
    const baseScale = this.targetSize / c.w;
    const baseH = c.h * baseScale;
    const baseX = x + width - this.targetSize - this.margin - this.offsetX;
    const baseY = y + this.margin + this.offsetY;

    const ptr = this.pointer;
    const isHover =
      !!ptr &&
      ptr.x >= baseX &&
      ptr.x <= baseX + this.targetSize &&
      ptr.y >= baseY &&
      ptr.y <= baseY + baseH;
    const iconScale = baseScale * (isHover ? this.hoverScale : 1);
    const iconW = c.w * iconScale;
    const iconH = c.h * iconScale;
    const iconX = baseX - (iconW - this.targetSize) / 2;
    const iconY = baseY - (iconH - baseH) / 2;

    ctx.save();
    ctx.shadowColor = this.shadow.color;
    ctx.shadowBlur = this.shadow.blur;
    ctx.shadowOffsetX = this.shadow.offsetX;
    ctx.shadowOffsetY = this.shadow.offsetY;
    ctx.drawImage(uiImage, c.x, c.y, c.w, c.h, iconX, iconY, iconW, iconH);
    ctx.restore();

    this.bounds = { x: iconX, y: iconY, w: iconW, h: iconH };
    this.hovering = isHover;
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

  handleClick(x, y) {
    return this.closeOverlay.handleClick(x, y);
  }

  isHovering() {
    return this.closeOverlay.isHovering();
  }

  renderPanel(ctx, { canvas, bgImage, uiImage }) {
    if (!ctx || !canvas || !bgImage?.naturalWidth) return null;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const maxW = canvas.width * 0.9;
    const maxH = canvas.height * 0.9;
    const scale = Math.min(maxW / bgImage.naturalWidth, maxH / bgImage.naturalHeight, 2);
    const drawW = bgImage.naturalWidth * scale;
    const drawH = bgImage.naturalHeight * scale;
    const x = (canvas.width - drawW) / 2;
    const y = (canvas.height - drawH) / 2;

    ctx.drawImage(bgImage, x, y, drawW, drawH);

    if (uiImage?.naturalWidth) {
      this.closeOverlay.render(ctx, uiImage, { x, y, width: drawW, height: drawH });
    } else {
      this.closeOverlay.clearPointer();
    }

    ctx.restore();
    return { x, y, width: drawW, height: drawH };
  }

  applyTitleStyle(ctx, canvasWidth) {
    const font = `bold ${Math.min(48, canvasWidth * 0.04)}px "ComixLoud", sans-serif`;
    ctx.font = font;
    ctx.fillStyle = "rgb(0, 110, 110)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 10;
  }

  applyBodyStyle(ctx, canvasWidth) {
    const font = `600 ${Math.min(24, canvasWidth * 0.025)}px "ComixLoud", sans-serif`;
    ctx.font = font;
    ctx.fillStyle = "rgb(0, 110, 110)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.0)";
    ctx.shadowBlur = 0;
  }
}
