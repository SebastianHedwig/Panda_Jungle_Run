import { GameOverlayBase } from "./gameOverlayBase.class.js";

const TITLE_MAX_WIDTH_RATIO_WIN = 0.82;
const TITLE_MAX_HEIGHT_RATIO_WIN = 0.24;
const TITLE_BASE_SIZE_RATIO_WIN = 0.12;
const TITLE_BASE_SIZE_CAP_WIN = 120;
const TITLE_MIN_SIZE_WIN = 42;
const TITLE_Y_OFFSET_RATIO_WIN = -0.18;

const SCORE_FONT_SIZE_MAX = 48;
const SCORE_FONT_SIZE_RATIO = 0.06;
const SCORE_STROKE_COLOR = "#8a3b04";
const SCORE_STROKE_WIDTH_MIN = 3;
const SCORE_STROKE_WIDTH_RATIO = 0.12;
const SCORE_FILL_COLOR = "#fff";
const SCORE_SHADOW_COLOR = "rgba(0, 0, 0, 0.4)";
const SCORE_SHADOW_BLUR = 10;
const SCORE_SHADOW_OFFSET_Y = 3;
const SCORE_COIN_SIZE_RATIO = 1.4;
const SCORE_PADDING_MAX = 14;
const SCORE_PADDING_RATIO = 0.3;
const SCORE_GAP_MAX = 18;
const SCORE_GAP_RATIO = 0.35;
const SCORE_Y_SPACING_RATIO = 0.12;
const SCORE_TITLE_SCALE = 1.05;
const COIN_VERTICAL_OFFSET_MAX = 6;
const COIN_VERTICAL_OFFSET_RATIO = 0.12;

export class GameWonOverlay extends GameOverlayBase {
  constructor() {
    super();
    this.title = "LEVEL CLEARED";
    this.coins = 0;
    this.coinImage = null;
  }

  setCoins(amount = 0) {
    this.coins = Math.max(0, Math.floor(amount));
  }

  setCoinImage(img) {
    this.coinImage = img;
  }

  render(ctx, canvas) {
    if (!ctx || !canvas) return;
    const { easeOut, scale } = this.startFrame(ctx, canvas);

    const { titleY, drawFontSize } = this.drawTitle(
      ctx,
      canvas,
      this.title,
      {
        maxWidthRatio: TITLE_MAX_WIDTH_RATIO_WIN,
        maxHeightRatio: TITLE_MAX_HEIGHT_RATIO_WIN,
        baseSizeRatio: TITLE_BASE_SIZE_RATIO_WIN,
        baseSizeCap: TITLE_BASE_SIZE_CAP_WIN,
        minSize: TITLE_MIN_SIZE_WIN,
        yOffsetRatio: TITLE_Y_OFFSET_RATIO_WIN,
      },
      easeOut,
      scale
    );

    const scoreY = titleY + drawFontSize * SCORE_TITLE_SCALE + canvas.height * SCORE_Y_SPACING_RATIO;
    const buttonsBaseY = this.drawHighscore(ctx, canvas, scoreY, easeOut);

    this.drawButtons(ctx, canvas, buttonsBaseY, scale, easeOut);

    this.finishFrame(ctx);
  }

  drawHighscore(ctx, canvas, y, easeOut) {
    const fontSize = Math.min(SCORE_FONT_SIZE_MAX, canvas.width * SCORE_FONT_SIZE_RATIO);
    const labelText = "Highscore:";
    const valueText = `${this.coins}`;
    ctx.save();
    ctx.font = `800 ${fontSize}px "ComixLoud", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = SCORE_FILL_COLOR;
    ctx.shadowColor = SCORE_SHADOW_COLOR;
    ctx.shadowBlur = SCORE_SHADOW_BLUR * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = SCORE_SHADOW_OFFSET_Y * easeOut;
    ctx.strokeStyle = SCORE_STROKE_COLOR;
    ctx.lineWidth = Math.max(SCORE_STROKE_WIDTH_MIN, fontSize * SCORE_STROKE_WIDTH_RATIO);

    const labelWidth = ctx.measureText(labelText).width;
    const valueWidth = ctx.measureText(valueText).width;
    const coinSize = fontSize * SCORE_COIN_SIZE_RATIO;
    const padding = Math.min(SCORE_PADDING_MAX, coinSize * SCORE_PADDING_RATIO);
    const gap = Math.min(SCORE_GAP_MAX, coinSize * SCORE_GAP_RATIO);
    const totalWidth = labelWidth + gap + valueWidth + padding + coinSize;
    const canvasCenterX = canvas.width / 2;
    const startX = canvasCenterX - totalWidth / 2;

    ctx.textAlign = "left";
    ctx.strokeText(labelText, startX, y);
    ctx.fillText(labelText, startX, y);

    const valueX = startX + labelWidth + gap;
    ctx.strokeText(valueText, valueX, y);
    ctx.fillText(valueText, valueX, y);

    const coinImg = this.coinImage;
    if (coinImg?.naturalWidth) {
      const coinX = valueX + valueWidth + padding;
      ctx.drawImage(
        coinImg,
        coinX,
        y - coinSize / 2 - Math.min(COIN_VERTICAL_OFFSET_MAX, coinSize * COIN_VERTICAL_OFFSET_RATIO),
        coinSize,
        coinSize
      );
    }
    ctx.restore();

    return y + fontSize + canvas.height * SCORE_Y_SPACING_RATIO;
  }
}
