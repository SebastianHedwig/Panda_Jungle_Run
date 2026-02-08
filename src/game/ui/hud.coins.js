/**
 * Draws coins.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {import("../entities/player/player.class.js").Player} player Player instance.
 */
export function drawCoins(ctx, canvas, player) {
  if (!this.isCoinImageReady()) return;
  const coinSettings = this.getCoinHudSettings();
  const { x, y } = this.getCoinPosition(canvas, coinSettings);
  this.drawCoinImage(ctx, x, y, coinSettings);
  this.drawCoinValue(ctx, x, y, coinSettings, player);
}

/**
 * Is coin image ready.
 * Updates the instance state.
 * @returns {boolean} Whether coin image ready.
 */
export function isCoinImageReady() {
  return this.coinImage && this.coinImage.naturalWidth !== 0;
}

/**
 * Returns coin hud settings.
 * @returns {Object} Coin hud settings.
 */
export function getCoinHudSettings() {
  return {
    padding: 20,
    coinSize: 40,
    coinOffsetX: 80,
    coinTextOffsetX: 35,
    coinTextOffsetY: 25,
    coinPulseScale: 0.3,
    coinTextFont: "1.2rem ComixLoud",
    coinTextStrokeColor: "#000",
    coinTextFillColor: "rgba(255,255,2,0.9)",
    coinTextStrokeWidth: 3 };
}

/**
 * Returns coin position.
 * Uses canvas, coinSettings to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {*} coinSettings Coin settings.
 * @returns {Object} Coin position.
 */
export function getCoinPosition(canvas, coinSettings) {
  const x = canvas.width - coinSettings.coinSize - coinSettings.padding - coinSettings.coinOffsetX;
  const y = coinSettings.padding;
  return { x, y };
}

/**
 * Draws coin image.
 * Renders to the canvas context.
 * Updates the instance state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} coinSettings Coin settings.
 */
export function drawCoinImage(ctx, x, y, coinSettings) {
  ctx.drawImage(this.coinImage, x, y, coinSettings.coinSize, coinSettings.coinSize);
}

/**
 * Draws coin value.
 * Renders to the canvas context.
 * Updates the player state.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} coinSettings Coin settings.
 * @param {import("../entities/player/player.class.js").Player} player Player instance.
 */
export function drawCoinValue(ctx, x, y, coinSettings, player) {
  const baseScale = 1;
  const scale = baseScale + player.hudPulse * coinSettings.coinPulseScale;
  const text = Math.round(this.displayCoinValue).toString();
  ctx.save();
  this.applyCoinTextTransform(ctx, x, y, coinSettings, scale);
  this.applyCoinTextStyle(ctx, coinSettings);
  this.drawHudTextValue(ctx, text);
  ctx.restore();
}

/**
 * Applies coin text transform.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} coinSettings Coin settings.
 * @param {number} scale Scale.
 */
export function applyCoinTextTransform(ctx, x, y, coinSettings, scale) {
  ctx.translate(x + coinSettings.coinSize + coinSettings.coinTextOffsetX, y + coinSettings.coinTextOffsetY);
  ctx.scale(scale, scale);
}

/**
 * Applies coin text style.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {*} coinSettings Coin settings.
 */
export function applyCoinTextStyle(ctx, coinSettings) {
  ctx.font = coinSettings.coinTextFont;
  ctx.strokeStyle = coinSettings.coinTextStrokeColor;
  ctx.fillStyle = coinSettings.coinTextFillColor;
  ctx.lineWidth = coinSettings.coinTextStrokeWidth;
}
