/**
 * Creates legal link handler.
 * Uses page, showLegalPage to compute the result.
 * @param {*} page Page.
 * @param {*} showLegalPage Show legal page.
 * @returns {*} Legal link handler.
 */
export const createLegalLinkHandler = (page, showLegalPage) => (event) => {
  event.preventDefault();
  event.stopPropagation();
  showLegalPage(page);
};

/**
 * Binds canvas events.
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
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.impressumLink] Impressum link.
 * @param {*} [options.privacyPolicyLink] Privacy policy link.
 * @param {*} [options.showLegalPage] Show legal page.
 */
export const bindLegalLinkEvents = ({ impressumLink, privacyPolicyLink, showLegalPage }) => {
  const handleImpressumClick = createLegalLinkHandler("impressum", showLegalPage);
  const handlePrivacyClick = createLegalLinkHandler("privacy", showLegalPage);
  impressumLink?.addEventListener("click", handleImpressumClick);
  privacyPolicyLink?.addEventListener("click", handlePrivacyClick);
};

/**
 * Binds start screen events.
 * Uses deps to perform the operation.
 * @param {*} deps Deps.
 */
export const bindStartScreenEvents = (deps) => {
  bindCanvasEvents(deps);
  bindSettingsEvents(deps);
  bindLegalLinkEvents(deps);
};
