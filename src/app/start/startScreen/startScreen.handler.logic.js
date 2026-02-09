import { setOverlayActive, setLegalScreenActive } from "./startScreen.utils.js";

/**
 * Returns canvas point.
 * Uses canvas, event to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {Event} event Event object.
 * @returns {Object} Canvas point.
 */
export const getCanvasPoint = (canvas, event) => {
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
 * Handles settings overlay click.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const handleSettingsOverlayClick = ({ state, x, y, getActiveControlsOverlay, canvas, drawStartScreen }) => {
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
export const handleStartButtonClick = ({ state, x, y, handlerRefs, ...dependencies }) => {
  if (!state.startButtonBounds) return false;
  const inside = isInsideStartButton({ state, x, y });
  if (!inside) return false;
  exitStartScreen({ ...dependencies, state, ...handlerRefs });
  return true;
};

/**
 * Handles settings move.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {number} [options.x] X.
 * @param {number} [options.y] Y.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const handleSettingsMove = ({ x, y, canvas, getActiveControlsOverlay, drawStartScreen }) => {
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
export const handleStartButtonMove = ({ state, x, y, canvas, drawStartScreen }) => {
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
 * Handles settings leave.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const handleSettingsLeave = ({ canvas, getActiveControlsOverlay, drawStartScreen }) => {
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
export const handleStartButtonLeave = ({ state, canvas, drawStartScreen }) => {
  if (state.startButtonHover) {
    state.startButtonHover = false;
    drawStartScreen();
  }
  canvas.style.cursor = "default";
};

/**
 * Close settings on escape.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.state] State.
 * @param {Event} [options.event] Event object.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.getActiveControlsOverlay] Get active controls overlay.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const closeSettingsOnEscape = ({ state, event, getActiveControlsOverlay, drawStartScreen }) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  state.settingsOpen = false;
  const overlay = getActiveControlsOverlay();
  overlay.clearPointer();
  setOverlayActive(false);
  drawStartScreen();
};
