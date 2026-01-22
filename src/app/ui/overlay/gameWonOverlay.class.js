import { GameOverlayBase } from "./gameOverlayBase.class.js";

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
        maxWidthRatio: 0.82,
        maxHeightRatio: 0.24,
        baseSizeRatio: 0.12,
        baseSizeCap: 120,
        minSize: 42,
        yOffsetRatio: -0.18,
      },
      easeOut,
      scale
    );

    const scoreY = titleY + drawFontSize * 1.05 + canvas.height * 0.16;
    const buttonsBaseY = this.drawHighscore(ctx, canvas, scoreY, easeOut);

    this.drawButtons(ctx, canvas, buttonsBaseY, scale, easeOut);

    this.finishFrame(ctx);
  }

  drawHighscore(ctx, canvas, y, easeOut) {
    const fontSize = Math.min(48, canvas.width * 0.06);
    const labelText = "Highscore:";
    const valueText = `${this.coins}`;
    ctx.save();
    ctx.font = `800 ${fontSize}px "ComixLoud", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10 * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3 * easeOut;
    ctx.strokeStyle = "#8a3b04";
    ctx.lineWidth = Math.max(3, fontSize * 0.12);

    const labelWidth = ctx.measureText(labelText).width;
    const valueWidth = ctx.measureText(valueText).width;
    const coinSize = fontSize * 1.4;
    const padding = Math.min(14, coinSize * 0.3);
    const gap = Math.min(18, coinSize * 0.35);
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
        y - coinSize / 2 - Math.min(6, coinSize * 0.12),
        coinSize,
        coinSize
      );
    }
    ctx.restore();

    return y + fontSize + canvas.height * 0.12;
  }
}
