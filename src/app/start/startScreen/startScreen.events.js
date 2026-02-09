import { consumeNextStartScreenAction } from "./startScreen.utils.js";

/**
 * Creates legal link handler.
 * Used to set up required data for camera-relative placement.
 * Uses page, showLegalPage to compute the result.
 * @param {*} page Page.
 * @param {*} showLegalPage Show legal page.
 * @param {Object} state Start screen state.
 * @returns {*} Legal link handler.
 */
export const createLegalLinkHandler = (page, showLegalPage, state) => (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (consumeNextStartScreenAction(state)) return;
  showLegalPage(page);
};

/**
 * Binds canvas events.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.handleCanvasClick] Handle canvas click.
 * @param {*} [options.handleMove] Handle move.
 * @param {*} [options.handleLeave] Handle leave.
 * @param {*} [options.handleWheel] Handle wheel.
 * @param {*} [options.handleTouchStart] Handle touch start.
 * @param {*} [options.handleTouchMove] Handle touch move.
 * @param {*} [options.handleTouchEnd] Handle touch end.
 */
export const bindCanvasEvents = ({ canvas, handleCanvasClick, handleMove, handleLeave, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd }) => {
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mouseleave", handleLeave);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd);
  canvas.addEventListener("touchcancel", handleTouchEnd);
};

/**
 * Binds settings events.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.settingsToggle] Settings toggle.
 * @param {*} [options.handleSettingsClick] Handle settings click.
 * @param {string} [options.handleKeyDown] Handle key down.
 */
export const bindSettingsEvents = ({ settingsToggle, handleSettingsClick, handleKeyDown }) => {
  settingsToggle?.addEventListener("click", handleSettingsClick, true);
  window.addEventListener("keydown", handleKeyDown, true);
};

/**
 * Binds legal link events.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.impressumLink] Impressum link.
 * @param {*} [options.privacyPolicyLink] Privacy policy link.
 * @param {*} [options.showLegalPage] Show legal page.
 * @param {Object} [options.state] Start screen state.
 */
export const bindLegalLinkEvents = ({ impressumLink, privacyPolicyLink, showLegalPage, state }) => {
  const handleImpressumClick = createLegalLinkHandler("impressum", showLegalPage, state);
  const handlePrivacyClick = createLegalLinkHandler("privacy", showLegalPage, state);
  impressumLink?.addEventListener("click", handleImpressumClick);
  privacyPolicyLink?.addEventListener("click", handlePrivacyClick);
};

/**
 * Binds start screen events.
 * Used to support camera-relative placement.
 * Uses deps to perform the operation.
 * @param {*} deps Deps.
 */
export const bindStartScreenEvents = (deps) => {
  bindCanvasEvents(deps);
  bindSettingsEvents(deps);
  bindLegalLinkEvents(deps);
};
