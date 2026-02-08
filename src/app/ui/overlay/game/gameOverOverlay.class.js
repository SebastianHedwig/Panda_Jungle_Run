import { GameOverlayBase } from "./gameOverlay.base.class.js";

const BUTTONS_TITLE_GAP_FACTOR = 0.9;
const BUTTONS_BASE_Y_OFFSET_RATIO = 0.08;

export class GameOverOverlay extends GameOverlayBase {
  /**
   * Creates a new instance.
   * Updates the instance state.
   */
  constructor() {
    super();
    this.title = "GAME OVER";
  }

  /**
   * Renders.
   * Updates the instance state.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  render(ctx, canvas) {
    if (!ctx || !canvas) return;
    const { easeOut, scale } = this.startFrame(ctx, canvas);

    const { titleY, drawFontSize } = this.drawTitle(ctx, canvas, this.title, null, easeOut, scale);

    const buttonsBaseY = titleY + drawFontSize * BUTTONS_TITLE_GAP_FACTOR + canvas.height * BUTTONS_BASE_Y_OFFSET_RATIO;
    this.drawButtons(ctx, canvas, buttonsBaseY, scale, easeOut);

    this.finishFrame(ctx);
  }
}
