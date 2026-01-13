export class GameOverlayBase {
  constructor({
    animDuration = 700,
    minScale = 0.55,
    maxBgAlpha = 0.55,
  } = {}) {
    this.animStart = null;
    this.animDuration = animDuration;
    this.minScale = minScale;
    this.maxBgAlpha = maxBgAlpha;
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }

  reset() {
    this.animStart = null;
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }

  setPointer(x, y) {
    this.pointer = x == null || y == null ? null : { x, y };
  }

  clearPointer() {
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }

  isHovering() {
    return this.hovering;
  }

  handleClick(x, y) {
    const hit = this.buttonBounds.find(
      (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
    );
    return hit?.action ?? null;
  }

  startFrame(ctx, canvas) {
    const now = performance?.now?.() ?? Date.now();
    if (this.animStart == null) this.animStart = now;
    const animT = Math.min(1, (now - this.animStart) / this.animDuration);
    const easeOut = 1 - Math.pow(1 - animT, 3);
    const scale = this.minScale + (1 - this.minScale) * easeOut;
    const bgAlpha = this.maxBgAlpha * easeOut;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return { easeOut, scale, centerX: canvas.width / 2, centerY: canvas.height / 2 };
  }

  finishFrame(ctx) {
    ctx.restore();
  }

  drawTitle(ctx, canvas, title, opts, easeOut, scale) {
    const {
      maxWidthRatio = 0.78,
      maxHeightRatio = 0.26,
      baseSizeRatio = 0.14,
      baseSizeCap = 140,
      minSize = 48,
      yOffsetRatio = -0.06,
    } = opts || {};

    const maxTextWidth = canvas.width * maxWidthRatio;
    const maxTextHeight = canvas.height * maxHeightRatio;
    const baseSize = Math.min(baseSizeCap, canvas.width * baseSizeRatio, canvas.height * maxHeightRatio);

    const measureWithSize = (size) => {
      ctx.font = `900 ${size}px "ComixLoud", sans-serif`;
      return ctx.measureText(title).width;
    };

    let targetFontSize = baseSize;
    let textWidth = measureWithSize(targetFontSize);
    const tooWide = textWidth > maxTextWidth;
    const tooTall = targetFontSize > maxTextHeight;
    if (tooWide || tooTall) {
      const fitScale = Math.min(maxTextWidth / textWidth, maxTextHeight / targetFontSize);
      targetFontSize = Math.max(minSize, targetFontSize * fitScale);
      textWidth = measureWithSize(targetFontSize);
    }

    const drawFontSize = targetFontSize * scale;
    const titleY = canvas.height / 2 + canvas.height * yOffsetRatio;
    ctx.font = `900 ${drawFontSize}px "ComixLoud", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const gradient = ctx.createLinearGradient(
      0,
      titleY - drawFontSize,
      0,
      titleY + drawFontSize * 0.6
    );
    gradient.addColorStop(0, "#fff6a1");
    gradient.addColorStop(0.35, "#fdd74a");
    gradient.addColorStop(0.65, "#f6b028");
    gradient.addColorStop(1, "#d87808");

    ctx.lineWidth = Math.max(6, drawFontSize * 0.08);
    ctx.strokeStyle = "#8a3b04";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 14 * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6 * easeOut;
    ctx.strokeText(title, canvas.width / 2, titleY);

    ctx.shadowColor = "rgba(255, 255, 255, 0.65)";
    ctx.shadowBlur = 18 * easeOut;
    ctx.fillStyle = gradient;
    ctx.fillText(title, canvas.width / 2, titleY);

    return { titleY, drawFontSize };
  }

  drawSubtitle(ctx, canvas, text, y, easeOut, { fontSizeCap = 48, fontSizeRatio = 0.06 } = {}) {
    const fontSize = Math.min(fontSizeCap, canvas.width * fontSizeRatio);
    ctx.font = `800 ${fontSize}px "ComixLoud", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10 * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3 * easeOut;
    ctx.strokeStyle = "#8a3b04";
    ctx.lineWidth = Math.max(3, fontSize * 0.12);
    ctx.strokeText(text, canvas.width / 2, y);
    ctx.fillText(text, canvas.width / 2, y);
    return y + fontSize + canvas.height * 0.06;
  }

  drawButtons(ctx, canvas, baseY, scale, easeOut) {
    const baseBtnWidth = Math.min(280, canvas.width * 0.24);
    const baseBtnHeight = baseBtnWidth * 0.38;
    const btnGap = Math.min(40, canvas.width * 0.04);
    const totalWidth = baseBtnWidth * 2 + btnGap;
    const startX = (canvas.width - totalWidth) / 2;
    const buttonsY = baseY + 60;

    this.buttonBounds = [];
    let hoverAny = false;

    const buttons = [
      { label: "Retry", action: "retry", x: startX },
      { label: "Quit", action: "quit", x: startX + baseBtnWidth + btnGap },
    ];

    buttons.forEach((btn) => {
      const bounds = {
        x: btn.x,
        y: buttonsY - baseBtnHeight / 2,
        w: baseBtnWidth,
        h: baseBtnHeight,
        action: btn.action,
      };
      const isHover =
        !!this.pointer &&
        this.pointer.x >= bounds.x &&
        this.pointer.x <= bounds.x + bounds.w &&
        this.pointer.y >= bounds.y &&
        this.pointer.y <= bounds.y + bounds.h;
      hoverAny = hoverAny || isHover;

      const btnScale = scale * (isHover ? 1.08 : 1);
      const drawW = bounds.w * btnScale;
      const drawH = bounds.h * btnScale;
      const drawX = bounds.x + bounds.w / 2 - drawW / 2;
      const drawY = bounds.y + bounds.h / 2 - drawH / 2;
      this.buttonBounds.push({ ...bounds, x: drawX, y: drawY, w: drawW, h: drawH });

      const radius = Math.min(drawH / 2, 18);
      const btnGrad = ctx.createLinearGradient(0, drawY, 0, drawY + drawH);
      btnGrad.addColorStop(0, "#fff7c8");
      btnGrad.addColorStop(0.35, "#fdd74a");
      btnGrad.addColorStop(0.65, "#f6b028");
      btnGrad.addColorStop(1, "#d87808");

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 12 * easeOut;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5 * easeOut;
      this.drawRoundedRect(ctx, drawX, drawY, drawW, drawH, radius);
      ctx.fillStyle = btnGrad;
      ctx.fill();
      ctx.lineWidth = Math.max(4, drawH * 0.08);
      ctx.strokeStyle = "#8a3b04";
      ctx.stroke();
      ctx.restore();

      const labelSize = Math.max(10, Math.min(drawH * 0.5, drawW * 0.28) - 4);
      const labelOffsetY = Math.min(6, drawH * 0.08);
      const labelCenterY = drawY + drawH / 2 + labelOffsetY;
      ctx.save();
      ctx.font = `800 ${labelSize}px "ComixLoud", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(3, labelSize * 0.14);
      ctx.strokeStyle = "#8a3b04";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 10 * easeOut;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3 * easeOut;
      ctx.strokeText(btn.label, drawX + drawW / 2, labelCenterY);
      ctx.fillText(btn.label, drawX + drawW / 2, labelCenterY);
      ctx.restore();
    });

    this.hovering = hoverAny;
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.max(2, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
