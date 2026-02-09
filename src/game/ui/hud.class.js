import {
  update,
  getUpdateSpeeds,
  updateCoinDisplay,
  updatePulseTimes,
  decayHudPulse,
  decayHealthPulse,
} from "./hud.update.js";
import {
  drawHearts,
  getHeartSettings,
  getLastFilledIndex,
  drawHeartsFromStates,
  drawHeartAtIndex,
  getHeartScale,
  drawHeartShape,
  getHeartStyle,
  traceHeartPath,
  applyHeartOutline,
  applyHeartFill,
} from "./hud.hearts.js";
import {
  drawCoins,
  isCoinImageReady,
  getCoinHudSettings,
  getCoinPosition,
  drawCoinImage,
  drawCoinValue,
  applyCoinTextTransform,
  applyCoinTextStyle,
} from "./hud.coins.js";
import {
  drawBullets,
  isGunImageReady,
  getGunHudSettings,
  getGunPosition,
  drawGunImage,
  drawBulletValue,
  applyBulletTextTransform,
  applyBulletTextStyle,
} from "./hud.bullets.js";
import {
  drawBossIndicator,
  shouldRenderBossIndicator,
  getBossIndicatorStyle,
  drawBossIndicatorContent,
  drawSideIndicator,
  drawVerticalIndicator,
  getBossIndicatorPlacement,
  getBossIndicatorBase,
  getBossIndicatorOffscreen,
  buildBossIndicatorPlacement,
  drawIndicatorArrow,
  getArrowGeometry,
  drawArrowPath,
  drawIndicatorLabel,
} from "./hud.bossIndicator.js";

export class Hud {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for UI interaction handling.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {HTMLImageElement} [options.coinImage] Coin image.
   * @param {HTMLImageElement} [options.gunImage] Gun image.
   * @param {string} [options.bossName] Boss name.
   */
  constructor({ coinImage, gunImage, bossName = "LUPO" } = {}) {
    this.coinImage = coinImage || null;
    this.gunImage = gunImage || null;
    this.bossName = bossName;

    this.displayCoinValue = 0;
    this.heartPulseTime = 0;
  }

  /**
   * Renders.
   * Used to render visuals.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {HTMLCanvasElement} canvas Target canvas.
   * @param {Camera} camera Camera instance.
   * @param {Player} player Player instance.
   * @param {Boss} boss Boss instance.
   */
  render(ctx, canvas, camera, player, boss) {
    if (!ctx || !canvas || !camera || !player) return;
    this.drawHearts(ctx, player);
    this.drawCoins(ctx, canvas, player);
    this.drawBullets(ctx, canvas, player);
    this.drawBossIndicator(ctx, canvas, camera, boss);
  }

  /**
   * Draws hud text value.
   * Used to render hud text value.
   * Renders to the canvas context.
   * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
   * @param {string} text Text.
   */
  drawHudTextValue(ctx, text) {
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
  }
}

Object.assign(Hud.prototype, {
  update,
  getUpdateSpeeds,
  updateCoinDisplay,
  updatePulseTimes,
  decayHudPulse,
  decayHealthPulse,
  drawHearts,
  getHeartSettings,
  getLastFilledIndex,
  drawHeartsFromStates,
  drawHeartAtIndex,
  getHeartScale,
  drawHeartShape,
  getHeartStyle,
  traceHeartPath,
  applyHeartOutline,
  applyHeartFill,
  drawCoins,
  isCoinImageReady,
  getCoinHudSettings,
  getCoinPosition,
  drawCoinImage,
  drawCoinValue,
  applyCoinTextTransform,
  applyCoinTextStyle,
  drawBullets,
  isGunImageReady,
  getGunHudSettings,
  getGunPosition,
  drawGunImage,
  drawBulletValue,
  applyBulletTextTransform,
  applyBulletTextStyle,
  drawBossIndicator,
  shouldRenderBossIndicator,
  getBossIndicatorStyle,
  drawBossIndicatorContent,
  drawSideIndicator,
  drawVerticalIndicator,
  getBossIndicatorPlacement,
  getBossIndicatorBase,
  getBossIndicatorOffscreen,
  buildBossIndicatorPlacement,
  drawIndicatorArrow,
  getArrowGeometry,
  drawArrowPath,
  drawIndicatorLabel,
});
