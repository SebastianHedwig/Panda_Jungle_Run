import { createPanelMetrics } from "../legalScreens/legalScreen.render.js";
import { setOverlayActive, setLegalScreenActive } from "./startScreen.utils.js";

/**
 * Is point inside bounds.
 * Used to decide collision outcomes.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {*} [options.bounds] Bounds.
 * @returns {boolean} Whether point inside bounds.
 */
const isPointInsideBounds = ({ x, y, bounds }) =>
  bounds && x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;

/**
 * Returns legal link hit.
 * Used to provide legal link hit for camera-relative placement.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @returns {*} Legal link hit.
 */
const getLegalLinkHit = ({ state, x, y }) =>
  state.legalPage === "impressum" && isPointInsideBounds({ x, y, bounds: state.impressumLinkBounds });

/**
 * Returns legal return hit.
 * Used to provide legal return hit for camera-relative placement.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @returns {*} Legal return hit.
 */
const getLegalReturnHit = ({ state, x, y }) => isPointInsideBounds({ x, y, bounds: state.legalReturnBounds });

/**
 * Returns legal panel bounds.
 * Used to provide legal panel bounds for collision and hit testing.
 * Uses canvas to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @returns {*} Legal panel bounds.
 */
const getLegalPanelBounds = (canvas) => {
  if (!canvas) return null;
  const { panelX, panelY, panelWidth, panelHeight } = createPanelMetrics(canvas);
  return { x: panelX, y: panelY, w: panelWidth, h: panelHeight };
};

/**
 * Returns legal outside click.
 * Used to provide legal outside click for UI interaction handling.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @returns {boolean} Whether outside legal panel.
 */
const isLegalOutsideClick = ({ x, y, canvas }) => {
  const panelBounds = getLegalPanelBounds(canvas);
  if (!panelBounds) return false;
  return !isPointInsideBounds({ x, y, bounds: panelBounds });
};

/**
 * Handles legal link click.
 * Used to centralize a specific behavior for UI interaction handling.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.showLegalPage] Show legal page.
 * @returns {boolean} Whether handled.
 */
const handleLegalLinkClick = ({ showLegalPage }) => {
  showLegalPage("privacy");
  return true;
};

/**
 * Closes legal page and returns true.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 * @returns {boolean} Whether handled.
 */
const closeLegalAndReturn = ({ state, canvas, drawStartScreen }) => {
  closeLegalPage({ state, canvas, drawStartScreen });
  return true;
};

/**
 * Close legal page.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const closeLegalPage = ({ state, canvas, drawStartScreen }) => {
  state.legalPage = null;
  setOverlayActive(false);
  setLegalScreenActive(false);
  canvas.style.cursor = "default";
  state.legalReturnBounds = null;
  state.legalReturnHover = false;
  drawStartScreen();
};

/**
 * Handles legal click.
 * Used to centralize a specific behavior for UI interaction handling.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {*} [options.showLegalPage] Show legal page.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const handleLegalClick = ({ state, x, y, showLegalPage, canvas, drawStartScreen }) => {
  if (!state.legalPage) return false;
  if (getLegalLinkHit({ state, x, y })) return handleLegalLinkClick({ showLegalPage });
  if (getLegalReturnHit({ state, x, y })) return closeLegalAndReturn({ state, canvas, drawStartScreen });
  if (isLegalOutsideClick({ x, y, canvas })) return closeLegalAndReturn({ state, canvas, drawStartScreen });
  return true;
};

/**
 * Returns legal hover flags.
 * Used to provide legal hover flags for UI interaction handling.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 */
const getLegalHoverFlags = ({ state, x, y }) => {
  const overReturn = isPointInsideBounds({ x, y, bounds: state.legalReturnBounds });
  const overLink = state.legalPage === "impressum" && isPointInsideBounds({ x, y, bounds: state.impressumLinkBounds });
  return { overReturn, overLink };
};

/**
 * Handles legal move.
 * Used to centralize a specific behavior for camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const handleLegalMove = ({ state, x, y, canvas, drawStartScreen }) => {
  const { overReturn, overLink } = getLegalHoverFlags({ state, x, y });
  if (state.legalReturnHover !== overReturn) {
    state.legalReturnHover = overReturn;
    drawStartScreen();
  }
  canvas.style.cursor = overReturn || overLink ? "pointer" : "default";
};

/**
 * Handles legal leave.
 * Used to centralize a specific behavior for camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const handleLegalLeave = ({ state, canvas, drawStartScreen }) => {
  canvas.style.cursor = "default";
  if (!state.legalReturnHover) return;
  state.legalReturnHover = false;
  drawStartScreen();
};

/**
 * Close legal on escape.
 * Used to support camera-relative placement.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {Event} [options.event] Event object.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const closeLegalOnEscape = ({ state, event, canvas, drawStartScreen }) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  closeLegalPage({ state, canvas, drawStartScreen });
};
