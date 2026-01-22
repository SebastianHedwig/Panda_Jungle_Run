import { OverlayRenderer } from "./overlayBase.class.js";

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
    value: "Walk / Run",
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

export class ControlsOverlayMobile {
  constructor({ showBackButton = true } = {}) {
    this.renderer = new OverlayRenderer();
    this.assets = { bgImage: null, uiImage: null };
    this.controls = MOBILE_CONTROLS;
    this.backButtonSprite = { x: 713, y: 660, w: 200, h: 200 };
    this.pointer = null;
    this.backButtonHover = false;
    this.backButtonBounds = null;
    this.showBackButton = showBackButton;
    this.iconCache = new Map();
    this.onIconLoad = null;
  }

  setOnIconLoad(callback) {
    this.onIconLoad = typeof callback === "function" ? callback : null;
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
    ctx.fillText("Mobile Controls", canvasCenterX, titleY);

    const iconSize = Math.min(32, canvas.width * 0.05);
    const listStartY = titleY + 75;
    const lineHeight = Math.max(iconSize + 14, Math.min(68, canvas.height * 0.065));
    const iconX = canvasCenterX - 100;
    const valueX = iconX + iconSize + 30;

    this.renderer.applyBodyStyle(ctx, canvas.width);
    ctx.textBaseline = "middle";
    this.controls.forEach((item, index) => {
      const rowCenterY = listStartY + index * lineHeight + lineHeight / 2;

      const img = this.getIcon(item.icon);
      const drawX = iconX;
      const drawY = rowCenterY - iconSize * 0.5;
      ctx.save();

      const grad = ctx.createLinearGradient(drawX, drawY, drawX + iconSize, drawY + iconSize);
      grad.addColorStop(0, "rgba(0, 200, 200, 0.65)");
      grad.addColorStop(1, "rgba(0, 80, 80, 0.65)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(drawX + iconSize / 2, drawY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      ctx.fill();

      const innerSize = iconSize * 0.7;
      const maxDim = Math.max(img?.naturalWidth || 1, img?.naturalHeight || 1);
      const scale = innerSize / maxDim;
      const imgW = (img?.naturalWidth || innerSize) * scale;
      const imgH = (img?.naturalHeight || innerSize) * scale;
      const imgX = drawX + (iconSize - imgW) / 2;
      const imgY = drawY + (iconSize - imgH) / 2;
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
      ctx.restore();

      ctx.textAlign = "left";
      ctx.fillText(item.value, valueX, rowCenterY);
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
