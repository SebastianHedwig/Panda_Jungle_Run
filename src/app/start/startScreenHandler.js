import { setOverlayActive, setLegalScreenActive } from "./startScreenUtils.js";

/**
 * Returns canvas point.
 * Uses canvas, event to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {Event} event Event object.
 * @returns {Object} Canvas point.
 */
const getCanvasPoint = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  /**
   * Y.
   * Uses (event.clientY - rect.top) / rect.height to perform the operation.
   * @param {number} (event.clientY - rect.top) / rect.height Event client Y rect top rect height.
   * @returns {*} Result value.
   */
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
};

/**
 * Is point inside bounds.
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
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @returns {*} Legal return hit.
 */
const getLegalReturnHit = ({ state, x, y }) => isPointInsideBounds({ x, y, bounds: state.legalReturnBounds });

/**
 * Close legal page.
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
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {*} [options.showLegalPage] Show legal page.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleLegalClick = ({ state, x, y, showLegalPage, canvas, drawStartScreen }) => {
  if (!state.legalPage) return false;
  if (getLegalLinkHit({ state, x, y })) {
    showLegalPage("privacy");
    return true;
  }
  if (getLegalReturnHit({ state, x, y })) closeLegalPage({ state, canvas, drawStartScreen });
  return true;
};

/**
 * Handles settings overlay click.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleSettingsOverlayClick = ({ state, x, y, getActiveControlsOverlay, canvas, drawStartScreen }) => {
  if (!state.settingsOpen) return false;
  const overlay = getActiveControlsOverlay();
  if (!overlay.handleCloseButtonClick(x, y)) return true;
  state.settingsOpen = false;
  overlay.clearPointer();
  setOverlayActive(false);
  canvas.style.cursor = "default";
  drawStartScreen();
  return true;
};

/**
 * Is inside start button.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 */
const isInsideStartButton = ({ state, x, y }) => {
  if (!state.startButtonBounds) return false;
  const { x: startButtonX, y: startButtonY, w: startButtonWidth, h: startButtonHeight } = state.startButtonBounds;
  const inside = x >= startButtonX && x <= startButtonX + startButtonWidth && y >= startButtonY && y <= startButtonY + startButtonHeight;
  return inside;
};

/**
 * Removes start screen listeners.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {HTMLElement} [options.settingsToggle] Settings toggle.
 * @param {*} [options.handleCanvasClick] Handle canvas click.
 * @param {*} [options.handleMove] Handle move.
 * @param {*} [options.handleLeave] Handle leave.
 * @param {*} [options.handleSettingsClick] Handle settings click.
 * @param {string} [options.handleKeyDown] Handle key down.
 */
const removeStartScreenListeners = ({ canvas, settingsToggle, handleCanvasClick, handleMove, handleLeave, handleSettingsClick, handleKeyDown }) => {
  canvas.removeEventListener("click", handleCanvasClick);
  canvas.removeEventListener("mousemove", handleMove);
  canvas.removeEventListener("mouseleave", handleLeave);
  settingsToggle?.removeEventListener("click", handleSettingsClick, true);
  window.removeEventListener("keydown", handleKeyDown, true);
};

/**
 * Resets settings toggle UI.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {string} [options.settingsLabel] Settings label.
 * @param {string} [options.defaultSettingsLabel] Default settings label.
 * @param {HTMLImageElement} [options.settingsIcon] Settings icon.
 * @param {string} [options.settingsIconDefaultSrc] Settings icon default src.
 * @param {HTMLElement} [options.settingsToggle] Settings toggle.
 */
const resetSettingsToggleUI = ({ settingsLabel, defaultSettingsLabel, settingsIcon, settingsIconDefaultSrc, settingsToggle }) => {
  if (settingsLabel) settingsLabel.textContent = defaultSettingsLabel;
  if (settingsIcon) {
    settingsIcon.src = settingsIconDefaultSrc;
    settingsIcon.alt = "Settings";
  }
  settingsToggle?.classList.add("settings-toggle--spin");
};

/**
 * Applies start screen exit effects.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.stopMenuMusic] Stop menu music.
 * @param {*} [options.mobileAudioUnlock] Mobile audio unlock.
 * @param {Function} [options.onStart] On start.
 */
const applyStartScreenExitEffects = ({ canvas, stopMenuMusic, mobileAudioUnlock, onStart }) => {
  setOverlayActive(false);
  setLegalScreenActive(false);
  document.body?.classList.remove("start-screen-active");
  canvas.style.cursor = "default";
  stopMenuMusic();
  mobileAudioUnlock.unlock();
  onStart?.();
};

/**
 * Exit start screen.
 * Uses dependencies to perform the operation.
 * @param {*} dependencies Dependencies.
 */
const exitStartScreen = (dependencies) => {
  dependencies.state.startScreenActive = false;
  dependencies.state.settingsOpen = false;
  removeStartScreenListeners(dependencies);
  resetSettingsToggleUI(dependencies);
  applyStartScreenExitEffects(dependencies);
};

/**
 * Handles start button click.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {*} [options.handlerRefs] Handler refs.
 */
const handleStartButtonClick = ({ state, x, y, handlerRefs, ...dependencies }) => {
  if (!state.startButtonBounds) return false;
  const inside = isInsideStartButton({ state, x, y });
  if (!inside) return false;
  exitStartScreen({ ...dependencies, state, ...handlerRefs });
  return true;
};

/**
 * Returns legal hover flags.
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
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleLegalMove = ({ state, x, y, canvas, drawStartScreen }) => {
  const { overReturn, overLink } = getLegalHoverFlags({ state, x, y });
  if (state.legalReturnHover !== overReturn) {
    state.legalReturnHover = overReturn;
    drawStartScreen();
  }
  canvas.style.cursor = overReturn || overLink ? "pointer" : "default";
};

/**
 * Handles settings move.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleSettingsMove = ({ x, y, canvas, getActiveControlsOverlay, drawStartScreen }) => {
  const overlay = getActiveControlsOverlay();
  overlay.setPointer(x, y);
  const hovering = overlay.isHovering();
  canvas.style.cursor = hovering ? "pointer" : "default";
  drawStartScreen();
};

/**
 * Handles start button move.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleStartButtonMove = ({ state, x, y, canvas, drawStartScreen }) => {
  if (!state.startButtonBounds) return;
  const inside = isInsideStartButton({ state, x, y });
  if (inside !== state.startButtonHover) {
    state.startButtonHover = inside;
    canvas.style.cursor = inside ? "pointer" : "default";
    drawStartScreen();
    return;
  }
  if (inside) canvas.style.cursor = "pointer";
};

/**
 * Handles legal leave.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleLegalLeave = ({ state, canvas, drawStartScreen }) => {
  canvas.style.cursor = "default";
  if (!state.legalReturnHover) return;
  state.legalReturnHover = false;
  drawStartScreen();
};

/**
 * Handles settings leave.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleSettingsLeave = ({ canvas, getActiveControlsOverlay, drawStartScreen }) => {
  const overlay = getActiveControlsOverlay();
  overlay.clearPointer();
  drawStartScreen();
  setOverlayActive(true);
  canvas.style.cursor = "default";
};

/**
 * Handles start button leave.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const handleStartButtonLeave = ({ state, canvas, drawStartScreen }) => {
  if (state.startButtonHover) {
    state.startButtonHover = false;
    drawStartScreen();
  }
  canvas.style.cursor = "default";
};

/**
 * Close legal on escape.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {Event} [options.event] Event object.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const closeLegalOnEscape = ({ state, event, drawStartScreen }) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  state.legalPage = null;
  setOverlayActive(false);
  setLegalScreenActive(false);
  drawStartScreen();
};

/**
 * Close settings on escape.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {Event} [options.event] Event object.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const closeSettingsOnEscape = ({ state, event, getActiveControlsOverlay, drawStartScreen }) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  state.settingsOpen = false;
  const overlay = getActiveControlsOverlay();
  overlay.clearPointer();
  setOverlayActive(false);
  drawStartScreen();
};

/**
 * Creates handle canvas click.
 * Uses dependencies, handlerRefs to compute the result.
 * @param {*} dependencies Dependencies.
 * @param {*} handlerRefs Handler refs.
 * @returns {*} Handle canvas click.
 */
const createHandleCanvasClick = (dependencies, handlerRefs) => (event) => {
  if (!dependencies.state.startScreenActive) return;
  const { x, y } = getCanvasPoint(dependencies.canvas, event);
  if (handleLegalClick({ ...dependencies, x, y })) return;
  if (handleSettingsOverlayClick({ ...dependencies, x, y })) return;
  handleStartButtonClick({ ...dependencies, x, y, handlerRefs });
};

/**
 * Creates handle move.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle move.
 */
const createHandleMove = (dependencies) => (event) => {
  if (!dependencies.state.startScreenActive) return;
  const { x, y } = getCanvasPoint(dependencies.canvas, event);
  if (dependencies.state.legalPage) return handleLegalMove({ ...dependencies, x, y });
  if (dependencies.state.settingsOpen) return handleSettingsMove({ ...dependencies, x, y });
  handleStartButtonMove({ ...dependencies, x, y });
};

/**
 * Creates handle leave.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle leave.
 */
const createHandleLeave = (dependencies) => () => {
  if (!dependencies.state.startScreenActive) return;
  if (dependencies.state.legalPage) return handleLegalLeave(dependencies);
  if (dependencies.state.settingsOpen) return handleSettingsLeave(dependencies);
  handleStartButtonLeave(dependencies);
};

/**
 * Creates handle settings click.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle settings click.
 */
const createHandleSettingsClick = (dependencies) => (event) => {
  if (!dependencies.state.startScreenActive) return;
  event?.preventDefault();
  event?.stopImmediatePropagation();
  dependencies.state.settingsOpen = !dependencies.state.settingsOpen;
  dependencies.state.startButtonHover = false;
  const overlay = dependencies.getActiveControlsOverlay();
  overlay.clearPointer();
  dependencies.canvas.style.cursor = "default";
  setOverlayActive(dependencies.state.settingsOpen);
  dependencies.drawStartScreen();
};

/**
 * Creates handle key down.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle key down.
 */
const createHandleKeyDown = (dependencies) => (event) => {
  if (!dependencies.state.startScreenActive || event.key !== "Escape") return;
  if (dependencies.state.legalPage) return closeLegalOnEscape({ ...dependencies, event });
  if (dependencies.state.settingsOpen) closeSettingsOnEscape({ ...dependencies, event });
};

/**
 * Creates handle wheel.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle wheel.
 */
const createHandleWheel = (dependencies) => (event) => {
  if (!dependencies.state.legalPage) return;
  event.preventDefault();
  const scrollDeltaY = event.deltaY;
  dependencies.state.legalScroll = Math.min(dependencies.state.legalMaxScroll, Math.max(0, dependencies.state.legalScroll + scrollDeltaY));
  dependencies.drawStartScreen();
};

/**
 * Creates handle touch start.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle touch start.
 */
const createHandleTouchStart = (dependencies) => (event) => {
  if (!dependencies.state.legalPage) return;
  const firstTouch = event.touches?.[0];
  if (!firstTouch) return;
  dependencies.state.touchScrollStartY = firstTouch.clientY;
};

/**
 * Creates handle touch move.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle touch move.
 */
const createHandleTouchMove = (dependencies) => (event) => {
  if (!dependencies.state.legalPage || dependencies.state.touchScrollStartY === null) return;
  const firstTouch = event.touches?.[0];
  if (!firstTouch) return;
  const scrollDeltaY = dependencies.state.touchScrollStartY - firstTouch.clientY;
  dependencies.state.legalScroll = Math.min(dependencies.state.legalMaxScroll, Math.max(0, dependencies.state.legalScroll + scrollDeltaY));
  dependencies.state.touchScrollStartY = firstTouch.clientY;
  event.preventDefault();
  dependencies.drawStartScreen();
};

/**
 * Creates handle touch end.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle touch end.
 */
const createHandleTouchEnd = (dependencies) => () => {
  dependencies.state.touchScrollStartY = null;
};

/**
 * Builds start screen handlers.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Start screen handlers.
 */
const buildStartScreenHandlers = (dependencies) => {
  const handlerRefs = {};
  handlerRefs.handleCanvasClick = createHandleCanvasClick(dependencies, handlerRefs);
  handlerRefs.handleMove = createHandleMove(dependencies);
  handlerRefs.handleLeave = createHandleLeave(dependencies);
  handlerRefs.handleSettingsClick = createHandleSettingsClick(dependencies);
  handlerRefs.handleKeyDown = createHandleKeyDown(dependencies);
  handlerRefs.handleWheel = createHandleWheel(dependencies);
  handlerRefs.handleTouchStart = createHandleTouchStart(dependencies);
  handlerRefs.handleTouchMove = createHandleTouchMove(dependencies);
  handlerRefs.handleTouchEnd = createHandleTouchEnd(dependencies);
  return handlerRefs;
};

/**
 * Creates start screen handlers.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Start screen handlers.
 */
export function createStartScreenHandlers(dependencies) {
  return buildStartScreenHandlers(dependencies);
}
