import { DEFAULT_ANIM_DURATION_MS, DEFAULT_MAX_BG_ALPHA, DEFAULT_MIN_SCALE } from "./gameOverlay.base.constants.js";
import { clearPointer, finishFrame, getAnimationState, getCanvasCenter, handleGameOverlayButtonClick, isHovering, reset, setPointer, startFrame, drawBackdrop } from "./gameOverlay.base.core.js";
import { applySubtitleFont, applySubtitleStyle, applyTitleFont, drawSubtitle, drawSubtitleText, drawTitle, fillTitle, getSubtitleFontSize, getTitleFontSize, getTitleGradient, getTitleOptions, getTitlePosition, measureTitleWidth, strokeTitle } from "./gameOverlay.base.title.js";
import { applyButtonShadow, applyLabelStyle, drawButton, drawButtonLabel, drawButtonShape, drawButtons, drawRoundedRect, fillButton, getButtonBaseBounds, getButtonGradient, getButtonLayout, getButtons, getLabelCenterY, getLabelSize, getScaledBounds, isPointerInsideButton, strokeButton } from "./gameOverlay.base.buttons.js";

export class GameOverlayBase {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {number} [options.animDuration] Anim duration.
   * @param {number} [options.minScale] Min scale.
   * @param {number} [options.maxBgAlpha] Max bg alpha.
   * @param {*} [options.}] Value.
   */
  constructor({
    animDuration = DEFAULT_ANIM_DURATION_MS,
    minScale = DEFAULT_MIN_SCALE,
    maxBgAlpha = DEFAULT_MAX_BG_ALPHA,
  } = {}) {
    this.animStart = null;
    this.animDuration = animDuration;
    this.minScale = minScale;
    this.maxBgAlpha = maxBgAlpha;
    this.pointer = null;
    this.buttonBounds = [];
    this.hovering = false;
  }
}

Object.assign(GameOverlayBase.prototype, {
  reset,
  setPointer,
  clearPointer,
  isHovering,
  handleGameOverlayButtonClick,
  getAnimationState,
  getCanvasCenter,
  drawBackdrop,
  startFrame,
  finishFrame,
  getTitleOptions,
  measureTitleWidth,
  getTitleFontSize,
  getTitlePosition,
  applyTitleFont,
  getTitleGradient,
  strokeTitle,
  fillTitle,
  drawTitle,
  drawSubtitle,
  getSubtitleFontSize,
  applySubtitleFont,
  applySubtitleStyle,
  drawSubtitleText,
  drawButtons,
  getButtonLayout,
  getButtons,
  getButtonBaseBounds,
  isPointerInsideButton,
  getScaledBounds,
  drawButton,
  getButtonGradient,
  applyButtonShadow,
  fillButton,
  strokeButton,
  drawButtonShape,
  getLabelSize,
  getLabelCenterY,
  applyLabelStyle,
  drawButtonLabel,
  drawRoundedRect,
});
