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
    const { x: boundsX, y: boundsY, w, h } = this.backButtonBounds;
    return x >= boundsX && x <= boundsX + w && y >= boundsY && y <= boundsY + h;
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
    const titleY = y + height * TITLE_BASELINE_RATIO + TITLE_OFFSET_Y;
    const canvasCenterX = canvas.width / 2;
    this.renderer.applyTitleStyle(ctx, canvas.width);
    ctx.fillText("Mobile Controls", canvasCenterX, titleY);

    const iconSize = Math.min(ICON_SIZE_MAX, canvas.width * ICON_SIZE_RATIO);
    const listStartY = titleY + LIST_START_OFFSET;
    const lineHeight = Math.max(iconSize + LINE_HEIGHT_EXTRA, Math.min(LINE_HEIGHT_MAX, canvas.height * LINE_HEIGHT_RATIO));
    const iconX = canvasCenterX - ICON_X_OFFSET;
    const valueX = iconX + iconSize + VALUE_X_PADDING;

    this.renderer.applyBodyStyle(ctx, canvas.width);
    ctx.textBaseline = "middle";
    this.controls.forEach((item, index) => {
      const rowCenterY = listStartY + index * lineHeight + lineHeight / 2;

      const img = this.getIcon(item.icon);
      const drawX = iconX;
      const drawY = rowCenterY - iconSize * ICON_CENTERING_RATIO;
      ctx.save();

      const grad = ctx.createLinearGradient(drawX, drawY, drawX + iconSize, drawY + iconSize);
      grad.addColorStop(0, ICON_GRADIENT_START);
      grad.addColorStop(1, ICON_GRADIENT_END);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(drawX + iconSize / 2, drawY + iconSize / 2, iconSize / 2, 0, FULL_CIRCLE_RADIANS);
      ctx.fill();

      const innerSize = iconSize * ICON_INNER_SIZE_RATIO;
      if (!img?.naturalWidth || !img?.naturalHeight) {
        ctx.restore();
        return;
      }
      const maxIconDimension = Math.max(img.naturalWidth, img.naturalHeight);
      const iconScale = innerSize / maxIconDimension;
      const imgW = img.naturalWidth * iconScale;
      const imgH = img.naturalHeight * iconScale;
      const imgX = drawX + (iconSize - imgW) / 2;
      const imgY = drawY + (iconSize - imgH) / 2;
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
      ctx.restore();

      ctx.textAlign = "left";
      ctx.fillText(item.value, valueX, rowCenterY);
    });

    if (this.assets.uiImage?.naturalWidth && this.showBackButton) {
      this.drawBackButton(ctx, { x, y, width, height });
    }
    ctx.restore();
  }

  drawBackButton(ctx, { x, y, height }) {
    const { bounds, isHover } = renderBackButton({
      ctx,
      uiImage: this.assets.uiImage,
      sprite: this.backButtonSprite,
      pointer: this.pointer,
      containerX: x,
      containerY: y,
      containerHeight: height,
      targetSize: BACK_BUTTON_TARGET_SIZE,
      margin: BACK_BUTTON_MARGIN,
      extraOffsetY: BACK_BUTTON_EXTRA_OFFSET_Y,
      hoverScale: BACK_BUTTON_HOVER_SCALE,
      shadow: BACK_BUTTON_SHADOW,
    });
    this.backButtonHover = isHover;
    this.backButtonBounds = bounds;
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
