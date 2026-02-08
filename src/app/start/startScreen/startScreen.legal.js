import { renderImpressumScreen } from "../legalScreens/impressumScreen.js";
import { renderPrivacyPolicyScreen } from "../legalScreens/privacyPolicyScreen.js";
import { setOverlayActive, setLegalScreenActive } from "./startScreen.utils.js";
import { LEGAL_RETURN_HOVER_SCALE, LEGAL_RETURN_COLOR, LEGAL_RETURN_HOVER_COLOR } from "./startScreen.js";

/**
 * Returns legal renderer.
 * Uses legalPage to compute the result.
 * @param {*} legalPage Legal page.
 * @returns {*} Legal renderer.
 */
export const getLegalRenderer = (legalPage) =>
  legalPage === "impressum" ? renderImpressumScreen : legalPage === "privacy" ? renderPrivacyPolicyScreen : null;

/**
 * Resets legal bounds.
 * Uses startScreenState to perform the operation.
 * @param {*} startScreenState Start screen state.
 */
export const resetLegalBounds = (startScreenState) => {
  startScreenState.impressumLinkBounds = null;
  startScreenState.legalReturnBounds = null;
};

/**
 * Applies legal render result.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.renderResult] Render result.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {boolean} [options.isImpressum] Whether impressum.
 */
export const applyLegalRenderResult = ({ renderResult, startScreenState, isImpressum }) => {
  const { maxScroll, closeTextBounds, linkBounds } = renderResult;
  startScreenState.legalMaxScroll = maxScroll;
  startScreenState.legalScroll = Math.min(startScreenState.legalScroll, startScreenState.legalMaxScroll);
  if (isImpressum) startScreenState.impressumLinkBounds = linkBounds || null;
  return closeTextBounds;
};

/**
 * Returns legal return scale.
 * Uses startScreenState to compute the result.
 * @param {*} startScreenState Start screen state.
 * @returns {*} Legal return scale.
 */
export const getLegalReturnScale = (startScreenState) =>
  startScreenState.legalReturnHover ? LEGAL_RETURN_HOVER_SCALE : 1;

/**
 * Draws scaled close text.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {string} [options.closeTextBounds] Close text bounds.
 * @param {number} [options.scale] Scale.
 */
export const drawScaledCloseText = ({ ctx, closeTextBounds, scale }) => {
  ctx.save();
  ctx.translate(closeTextBounds.x, closeTextBounds.y);
  ctx.scale(scale, scale);
  ctx.fillText(closeTextBounds.text, 0, 0);
  ctx.restore();
};

/**
 * Returns legal return bounds.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} closeTextBounds Close text bounds.
 * @returns {Object} Legal return bounds.
 */
export const getLegalReturnBounds = (ctx, closeTextBounds) => {
  const returnTextWidth = ctx.measureText(closeTextBounds.text).width;
  return { x: closeTextBounds.x, y: closeTextBounds.y, w: returnTextWidth, h: closeTextBounds.h };
};

/**
 * Draws legal close text.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {string} [options.closeTextBounds] Close text bounds.
 * @param {*} [options.startScreenState] Start screen state.
 */
export const drawLegalCloseText = ({ ctx, closeTextBounds, startScreenState }) => {
  if (!closeTextBounds) return;
  ctx.font = `bold ${closeTextBounds.fontSize}px sans-serif`;
  ctx.fillStyle = startScreenState.legalReturnHover ? LEGAL_RETURN_HOVER_COLOR : LEGAL_RETURN_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const scale = getLegalReturnScale(startScreenState);
  drawScaledCloseText({ ctx, closeTextBounds, scale });
  startScreenState.legalReturnBounds = getLegalReturnBounds(ctx, closeTextBounds);
};

/**
 * Creates draw legal page.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @returns {*} Draw legal page.
 */
export const createDrawLegalPage = ({ ctx, canvas, startScreenState }) => () => {
  const isImpressum = startScreenState.legalPage === "impressum";
  const renderer = getLegalRenderer(startScreenState.legalPage);
  resetLegalBounds(startScreenState);
  if (!renderer) return;
  const renderResult = renderer({ ctx, canvas, scroll: startScreenState.legalScroll });
  const closeTextBounds = applyLegalRenderResult({ renderResult, startScreenState, isImpressum });
  drawLegalCloseText({ ctx, closeTextBounds, startScreenState });
};

/**
 * Applies legal page state.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.page] Page.
 */
export const applyLegalPageState = ({ startScreenState, page }) => {
  startScreenState.legalPage = page;
  startScreenState.legalScroll = 0;
  startScreenState.legalMaxScroll = 0;
  startScreenState.impressumLinkBounds = null;
  startScreenState.legalReturnBounds = null;
  startScreenState.settingsOpen = false;
  startScreenState.startButtonHover = false;
  startScreenState.legalReturnHover = false;
};

/**
 * Creates show legal page.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawStartScreen] Draw start screen.
 * @returns {*} Show legal page.
 */
export const createShowLegalPage = ({ canvas, startScreenState, drawStartScreen }) => (page) => {
  applyLegalPageState({ startScreenState, page });
  setOverlayActive(false);
  setLegalScreenActive(true);
  canvas.style.cursor = "pointer";
  drawStartScreen();
};
