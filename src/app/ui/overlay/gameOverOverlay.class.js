import { GameOverlayBase } from "./gameOverlayBase.class.js";

export class GameOverOverlay extends GameOverlayBase {
  constructor() {
    super();
    this.title = "GAME OVER";
  }

  render(ctx, canvas) {
    if (!ctx || !canvas) return;
    const { easeOut, scale } = this.startFrame(ctx, canvas);

    const { titleY, drawFontSize } = this.drawTitle(
      ctx,
      canvas,
      this.title,
      {
        maxWidthRatio: 0.78,
        maxHeightRatio: 0.26,
        baseSizeRatio: 0.14,
        baseSizeCap: 140,
        minSize: 48,
        yOffsetRatio: -0.06,
      },
      easeOut,
      scale
    );

    const buttonsBaseY = titleY + drawFontSize * 0.9 + canvas.height * 0.08;
    this.drawButtons(ctx, canvas, buttonsBaseY, scale, easeOut);

    this.finishFrame(ctx);
  }
}
