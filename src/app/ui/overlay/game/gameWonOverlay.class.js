import { GameOverlayBase } from "./gameOverlay.base.class.js";

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
  /**
   * Creates a new instance.
   */
  constructor() {
    super();
    this.title = "LEVEL CLEARED";
    this.coins = 0;
    this.coinImage = null;
  }

  /**
   * Sets coins. If omitted, default values are used.
   * Used to support UI interaction handling.
   * @param {number} [amount] Amount.
   */
  setCoins(amount = 0) {
    this.coins = Math.max(0, Math.floor(amount));
  }

  /**
   * Sets coin image.
   * Used to support UI interaction handling.
   * @param {HTMLImageElement} img Img.
   */
  setCoinImage(img) {
    this.coinImage = img;
  }

  /**
   * Renders.
   * Used to render visuals.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  render(ctx, canvas) {
    if (!ctx || !canvas) return;
    const frameState = this.startFrame(ctx, canvas);
    const titleMetrics = this.drawWinTitle(ctx, canvas, frameState);
    const scoreY = this.getScoreY(titleMetrics, canvas);
    const buttonsBaseY = this.drawHighscore(ctx, canvas, scoreY, frameState.easeOut);
    this.drawButtons(ctx, canvas, buttonsBaseY, frameState.scale, frameState.easeOut);
    this.finishFrame(ctx);
  }

  /**
   * Draws win title.
   * Used to render win title.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} frameState Frame state.
   * @returns {*} Result value.
   */
  drawWinTitle(ctx, canvas, frameState) {
    return this.drawTitle(ctx, canvas, this.title, this.getWinTitleOptions(), frameState.easeOut, frameState.scale);
  }

  /**
   * Returns win title options.
   * Used to provide win title options for UI interaction handling.
   * @returns {Object} Win title options.
   */
  getWinTitleOptions() {
    return {
      maxWidthRatio: TITLE_MAX_WIDTH_RATIO_WIN,
      maxHeightRatio: TITLE_MAX_HEIGHT_RATIO_WIN,
      baseSizeRatio: TITLE_BASE_SIZE_RATIO_WIN,
      baseSizeCap: TITLE_BASE_SIZE_CAP_WIN,
      minSize: TITLE_MIN_SIZE_WIN,
      yOffsetRatio: TITLE_Y_OFFSET_RATIO_WIN,
    };
  }

  /**
   * Returns score Y.
   * Used to provide score Y for UI interaction handling.
   * Uses options, canvas to compute the result.
   * @param {Object} options Configuration options.
   * @param {number} [options.titleY] Title Y.
   * @param {number} [options.drawFontSize] Draw font size.
   * @param {HTMLCanvasElement} canvas Target canvas.
   */
  getScoreY({ titleY, drawFontSize }, canvas) {
    return titleY + drawFontSize * SCORE_TITLE_SCALE + canvas.height * SCORE_Y_SPACING_RATIO;
  }

  /**
   * Draws highscore.
   * Used to render highscore.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {number} y Y.
   * @param {*} easeOut Ease out.
   * @returns {*} Result value.
   */
  drawHighscore(ctx, canvas, y, easeOut) {
    const fontSize = this.getScoreFontSize(canvas);
    const scoreText = this.getScoreText();
    ctx.save();
    this.applyScoreTextStyle(ctx, fontSize, easeOut);
    const layout = this.getScoreLayout(ctx, canvas, scoreText, fontSize);
    ctx.textAlign = "left";
    this.drawScoreText(ctx, scoreText.labelText, layout.startX, y);
    const valueX = layout.startX + layout.labelWidth + layout.gap;
    this.drawScoreText(ctx, scoreText.valueText, valueX, y);
    this.drawScoreCoin(ctx, valueX, layout, y);
    ctx.restore();
    return y + fontSize + canvas.height * SCORE_Y_SPACING_RATIO;
  }

  /**
   * Returns score font size.
   * Used to provide score font size for rendering.
   * Uses canvas to compute the result.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @returns {*} Score font size.
   */
  getScoreFontSize(canvas) {
    return Math.min(SCORE_FONT_SIZE_MAX, canvas.width * SCORE_FONT_SIZE_RATIO);
  }

  /**
   * Returns score text.
   * Used to provide score text for rendering.
   * @returns {Object} Score text.
   */
  getScoreText() {
    return { labelText: "Highscore:", valueText: `${this.coins}` };
  }

  /**
   * Applies score text style.
   * Used to keep UI visuals consistent.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} fontSize Font size.
   * @param {*} easeOut Ease out.
   */
  applyScoreTextStyle(ctx, fontSize, easeOut) {
    ctx.font = `800 ${fontSize}px "ComixLoud", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = SCORE_FILL_COLOR;
    ctx.shadowColor = SCORE_SHADOW_COLOR;
    ctx.shadowBlur = SCORE_SHADOW_BLUR * easeOut;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = SCORE_SHADOW_OFFSET_Y * easeOut;
    ctx.strokeStyle = SCORE_STROKE_COLOR;
    ctx.lineWidth = Math.max(SCORE_STROKE_WIDTH_MIN, fontSize * SCORE_STROKE_WIDTH_RATIO);
  }

  /**
   * Returns score layout.
   * Used to provide score layout for UI interaction handling.
   * Uses ctx, canvas, options, fontSize to compute the result.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {Object} options Configuration options.
   * @param {string} [options.labelText] Label text.
   * @param {string} [options.valueText] Value text.
   * @param {number} fontSize Font size.
   */
  getScoreLayout(ctx, canvas, { labelText, valueText }, fontSize) {
    const labelWidth = ctx.measureText(labelText).width;
    const valueWidth = ctx.measureText(valueText).width;
    const coinSize = fontSize * SCORE_COIN_SIZE_RATIO;
    const padding = Math.min(SCORE_PADDING_MAX, coinSize * SCORE_PADDING_RATIO);
    const gap = Math.min(SCORE_GAP_MAX, coinSize * SCORE_GAP_RATIO);
    const totalWidth = labelWidth + gap + valueWidth + padding + coinSize;
    const startX = canvas.width / 2 - totalWidth / 2;
    return { labelWidth, valueWidth, coinSize, padding, gap, startX };
  }

  /**
   * Draws score text.
   * Used to render score text.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {string} text Text.
   * @param {number} x X.
   * @param {number} y Y.
   */
  drawScoreText(ctx, text, x, y) {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  /**
   * Draws score coin.
   * Used to render score coin.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {number} valueX Value X.
   * @param {*} layout Layout.
   * @param {number} y Y.
   */
  drawScoreCoin(ctx, valueX, layout, y) {
    const coinImg = this.coinImage;
    if (!coinImg?.naturalWidth) return;
    const coinX = valueX + layout.valueWidth + layout.padding;
    const coinY = y - layout.coinSize / 2 - Math.min(COIN_VERTICAL_OFFSET_MAX, layout.coinSize * COIN_VERTICAL_OFFSET_RATIO);
    ctx.drawImage(coinImg, coinX, coinY, layout.coinSize, layout.coinSize);
  }
}
