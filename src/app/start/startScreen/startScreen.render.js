import { GAME_HEIGHT, GAME_WIDTH } from "../../../config/config.js";
import { setOverlayActive } from "./startScreen.utils.js";
import {
  TITLE_MAX_FONT_SIZE,
  TITLE_FONT_SCALE,
  TITLE_Y_RATIO,
  TITLE_FILL_COLOR,
  TITLE_STROKE_COLOR,
  TITLE_SHADOW_COLOR,
  TITLE_SHADOW_BLUR,
  TITLE_SHADOW_OFFSET_Y,
  TITLE_STROKE_WIDTH,
  START_BUTTON_SPRITE,
  START_BUTTON_MAX_WIDTH,
  START_BUTTON_WIDTH_RATIO,
  START_BUTTON_BASE_Y_RATIO,
  START_BUTTON_Y_OFFSET,
  START_BUTTON_HOVER_SCALE,
  BUTTON_SHADOW_COLOR,
  BUTTON_SHADOW_BLUR,
  BUTTON_SHADOW_OFFSET_Y,
} from "./startScreen.js";

/**
 * Prepares start screen canvas.
 * Renders to the canvas context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @returns {*} Result value.
 */
export const prepareStartScreenCanvas = (canvas, ctx) => {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return canvas.width / 2;
};

/**
 * Draws background image.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.bg] Bg.
 */
export const drawBackgroundImage = ({ ctx, canvas, bg }) => {
  const scale = Math.max(canvas.width / bg.width, canvas.height / bg.height);
  const drawW = bg.width * scale;
  const drawH = bg.height * scale;
  const bgDrawX = (canvas.width - drawW) / 2;
  /**
   * Bg draw Y.
   * Uses canvas.height - drawH to perform the operation.
   * @param {boolean} canvas.height - drawH Canvas height draw H.
   */
  const bgDrawY = (canvas.height - drawH) / 2;
  ctx.drawImage(bg, bgDrawX, bgDrawY, drawW, drawH);
};

/**
 * Applies title styles.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 */
export const applyTitleStyles = ({ ctx, canvas }) => {
  ctx.font = `small-caps ${Math.min(TITLE_MAX_FONT_SIZE, canvas.width * TITLE_FONT_SCALE)}px "ComixLoud", sans-serif`;
  ctx.fillStyle = TITLE_FILL_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = TITLE_SHADOW_COLOR;
  ctx.shadowBlur = TITLE_SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = TITLE_SHADOW_OFFSET_Y;
  ctx.lineWidth = TITLE_STROKE_WIDTH;
  ctx.strokeStyle = TITLE_STROKE_COLOR;
};

/**
 * Draws start title.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {boolean} [options.canvasCenterX] Canvas center X.
 */
export const drawStartTitle = ({ ctx, canvas, canvasCenterX }) => {
  const title = "Panda Jungle Run";
  applyTitleStyles({ ctx, canvas });
  ctx.strokeText(title, canvasCenterX, canvas.height * TITLE_Y_RATIO);
  ctx.fillText(title, canvasCenterX, canvas.height * TITLE_Y_RATIO);
  ctx.shadowBlur = 0;
};

/**
 * Returns start button dimensions.
 * Uses canvas to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @returns {Object} Start button dimensions.
 */
export const getStartButtonDimensions = (canvas) => {
  const buttonWidth = Math.min(canvas.width * START_BUTTON_WIDTH_RATIO, START_BUTTON_MAX_WIDTH);
  /**
   * Button height.
   * Uses START_BUTTON_SPRITE.h / START_BUTTON_SPRITE.w to perform the operation.
   * @param {HTMLImageElement} START_BUTTON_SPRITE.h / START_BUTTON_SPRITE.w START BUTTON SPRITE h START BUTTON SPRITE w.
   * @returns {Object} Result value.
   */
  const buttonHeight = (START_BUTTON_SPRITE.h / START_BUTTON_SPRITE.w) * buttonWidth;
  return { buttonWidth, buttonHeight };
};

/**
 * Returns start button base center.
 * Uses canvas, buttonWidth, buttonHeight to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} buttonWidth Button width.
 * @param {number} buttonHeight Button height.
 * @returns {Object} Start button base center.
 */
export const getStartButtonBaseCenter = (canvas, buttonWidth, buttonHeight) => {
  const baseCenterX = (canvas.width - buttonWidth) / 2 + buttonWidth / 2;
  const baseCenterY = canvas.height * START_BUTTON_BASE_Y_RATIO + START_BUTTON_Y_OFFSET + buttonHeight / 2;
  return { baseCenterX, baseCenterY };
};

/**
 * Returns scaled button rect.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.baseCenterX] Base center X.
 * @param {number} [options.baseCenterY] Base center Y.
 * @param {number} [options.buttonWidth] Button width.
 * @param {number} [options.buttonHeight] Button height.
 * @param {number} [options.hoverScale] Hover scale.
 */
export const getScaledButtonRect = ({ baseCenterX, baseCenterY, buttonWidth, buttonHeight, hoverScale }) => {
  const buttonWidthScaled = buttonWidth * hoverScale;
  const buttonHeightScaled = buttonHeight * hoverScale;
  const buttonDrawX = baseCenterX - buttonWidthScaled / 2;
  const buttonDrawY = baseCenterY - buttonHeightScaled / 2;
  return { buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled };
};

/**
 * Applies button shadow.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 */
export const applyButtonShadow = (ctx) => {
  ctx.shadowColor = BUTTON_SHADOW_COLOR;
  ctx.shadowBlur = BUTTON_SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = BUTTON_SHADOW_OFFSET_Y;
};

/**
 * Draws button sprite image.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.ui] Ui.
 * @param {HTMLImageElement} [options.startButtonSprite] Start button sprite.
 * @param {number} [options.buttonDrawX] Button draw X.
 * @param {number} [options.buttonDrawY] Button draw Y.
 * @param {number} [options.buttonWidthScaled] Button width scaled.
 * @param {number} [options.buttonHeightScaled] Button height scaled.
 * @returns {*} Result value.
 */
export const drawButtonSpriteImage = ({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled }) =>
  ctx.drawImage(
    ui,
    startButtonSprite.x,
    startButtonSprite.y,
    startButtonSprite.w,
    startButtonSprite.h,
    buttonDrawX,
    buttonDrawY,
    buttonWidthScaled,
    buttonHeightScaled
  );

/**
 * Draws start button sprite.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.ui] Ui.
 * @param {HTMLImageElement} [options.startButtonSprite] Start button sprite.
 * @param {number} [options.buttonDrawX] Button draw X.
 * @param {number} [options.buttonDrawY] Button draw Y.
 * @param {number} [options.buttonWidthScaled] Button width scaled.
 * @param {number} [options.buttonHeightScaled] Button height scaled.
 */
export const drawStartButtonSprite = ({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled }) => {
  ctx.save();
  applyButtonShadow(ctx);
  drawButtonSpriteImage({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled });
  ctx.restore();
};

/**
 * Creates start button bounds.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.buttonDrawX] Button draw X.
 * @param {number} [options.buttonDrawY] Button draw Y.
 * @param {number} [options.buttonWidthScaled] Button width scaled.
 * @param {number} [options.buttonHeightScaled] Button height scaled.
 * @returns {*} Start button bounds.
 */
export const createStartButtonBounds = ({ buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled }) => ({
  x: buttonDrawX,
  y: buttonDrawY,
  w: buttonWidthScaled,
  h: buttonHeightScaled,
});

/**
 * Draws start button.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.ui] Ui.
 * @param {*} [options.startScreenState] Start screen state.
 */
export const drawStartButton = ({ ctx, canvas, ui, startScreenState }) => {
  const startButtonSprite = START_BUTTON_SPRITE;
  const { buttonWidth, buttonHeight } = getStartButtonDimensions(canvas);
  const { baseCenterX, baseCenterY } = getStartButtonBaseCenter(canvas, buttonWidth, buttonHeight);
  const hoverScale = startScreenState.startButtonHover ? START_BUTTON_HOVER_SCALE : 1;
  const { buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled } = getScaledButtonRect({ baseCenterX, baseCenterY, buttonWidth, buttonHeight, hoverScale });
  drawStartButtonSprite({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled });
  return createStartButtonBounds({ buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled });
};

/**
 * Draws settings overlay.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {import("../../ui/overlay/controls/controlsOverlay.class.js").ControlsOverlay | import("../../ui/overlay/controls/mobileControlsOverlay.class.js").ControlsOverlayMobile} [options.getActiveControlsOverlay] Get active controls overlay.
 */
export const drawSettingsOverlay = ({ ctx, canvas, startScreenState, getActiveControlsOverlay }) => {
  if (!startScreenState.settingsOpen || !startScreenState.startAssets.menuBg) return;
  const overlay = getActiveControlsOverlay();
  overlay.setAssets({ bgImage: startScreenState.startAssets.menuBg, uiImage: startScreenState.startAssets.ui });
  overlay.render(ctx, canvas);
  setOverlayActive(true);
};

/**
 * Draws legal start screen.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawLegalPage] Draw legal page.
 */
export const drawLegalStartScreen = ({ startScreenState, drawLegalPage }) => {
  startScreenState.startButtonBounds = null;
  drawLegalPage();
};

/**
 * Creates draw start screen.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawLegalPage] Draw legal page.
 * @param {import("../../ui/overlay/controls/controlsOverlay.class.js").ControlsOverlay | import("../../ui/overlay/controls/mobileControlsOverlay.class.js").ControlsOverlayMobile} [options.getActiveControlsOverlay] Get active controls overlay.
 * @returns {*} Draw start screen.
 */
export const createDrawStartScreen = ({ ctx, canvas, startScreenState, drawLegalPage, getActiveControlsOverlay }) => () => {
  if (!startScreenState.startAssets) return;
  const { bg, ui } = startScreenState.startAssets;
  const canvasCenterX = prepareStartScreenCanvas(canvas, ctx);
  drawBackgroundImage({ ctx, canvas, bg });
  drawStartTitle({ ctx, canvas, canvasCenterX });
  if (startScreenState.legalPage) return drawLegalStartScreen({ startScreenState, drawLegalPage });
  startScreenState.startButtonBounds = drawStartButton({ ctx, canvas, ui, startScreenState });
  drawSettingsOverlay({ ctx, canvas, startScreenState, getActiveControlsOverlay });
};
