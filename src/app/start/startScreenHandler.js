import { setOverlayActive } from "./startScreenUtils.js";

const getCanvasPoint = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
};

const isPointInsideBounds = ({ x, y, bounds }) =>
  bounds && x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;

const getLegalLinkHit = ({ state, x, y }) =>
  state.legalPage === "impressum" && isPointInsideBounds({ x, y, bounds: state.impressumLinkBounds });

const getLegalReturnHit = ({ state, x, y }) => isPointInsideBounds({ x, y, bounds: state.legalReturnBounds });

const closeLegalPage = ({ state, canvas, drawStartScreen }) => {
  state.legalPage = null;
  setOverlayActive(false);
  canvas.style.cursor = "default";
  state.legalReturnBounds = null;
  state.legalReturnHover = false;
  drawStartScreen();
};

const handleLegalClick = ({ state, x, y, showLegalPage, canvas, drawStartScreen }) => {
  if (!state.legalPage) return false;
  if (getLegalLinkHit({ state, x, y })) {
    showLegalPage("privacy");
    return true;
  }
  if (getLegalReturnHit({ state, x, y })) closeLegalPage({ state, canvas, drawStartScreen });
  return true;
};

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

const isInsideStartButton = ({ state, x, y }) => {
  if (!state.startButtonBounds) return false;
  const { x: startButtonX, y: startButtonY, w: startButtonWidth, h: startButtonHeight } = state.startButtonBounds;
  const inside = x >= startButtonX && x <= startButtonX + startButtonWidth && y >= startButtonY && y <= startButtonY + startButtonHeight;
  return inside;
};

const removeStartScreenListeners = ({ canvas, settingsToggle, handleCanvasClick, handleMove, handleLeave, handleSettingsClick, handleKeyDown }) => {
  canvas.removeEventListener("click", handleCanvasClick);
  canvas.removeEventListener("mousemove", handleMove);
  canvas.removeEventListener("mouseleave", handleLeave);
  settingsToggle?.removeEventListener("click", handleSettingsClick, true);
  window.removeEventListener("keydown", handleKeyDown, true);
};

const resetSettingsToggleUI = ({ settingsLabel, defaultSettingsLabel, settingsIcon, settingsIconDefaultSrc, settingsToggle }) => {
  if (settingsLabel) settingsLabel.textContent = defaultSettingsLabel;
  if (settingsIcon) {
    settingsIcon.src = settingsIconDefaultSrc;
    settingsIcon.alt = "Settings";
  }
  settingsToggle?.classList.add("settings-toggle--spin");
};

const applyStartScreenExitEffects = ({ canvas, stopMenuMusic, mobileAudioUnlock, onStart }) => {
  setOverlayActive(false);
  document.body?.classList.remove("start-screen-active");
  canvas.style.cursor = "default";
  stopMenuMusic();
  mobileAudioUnlock.unlock();
  onStart?.();
};

const exitStartScreen = (dependencies) => {
  dependencies.state.startScreenActive = false;
  dependencies.state.settingsOpen = false;
  removeStartScreenListeners(dependencies);
  resetSettingsToggleUI(dependencies);
  applyStartScreenExitEffects(dependencies);
};

const handleStartButtonClick = ({ state, x, y, handlerRefs, ...dependencies }) => {
  if (!state.startButtonBounds) return false;
  const inside = isInsideStartButton({ state, x, y });
  if (!inside) return false;
  exitStartScreen({ ...dependencies, state, ...handlerRefs });
  return true;
};

const getLegalHoverFlags = ({ state, x, y }) => {
  const overReturn = isPointInsideBounds({ x, y, bounds: state.legalReturnBounds });
  const overLink = state.legalPage === "impressum" && isPointInsideBounds({ x, y, bounds: state.impressumLinkBounds });
  return { overReturn, overLink };
};

const handleLegalMove = ({ state, x, y, canvas, drawStartScreen }) => {
  const { overReturn, overLink } = getLegalHoverFlags({ state, x, y });
  if (state.legalReturnHover !== overReturn) {
    state.legalReturnHover = overReturn;
    drawStartScreen();
  }
  canvas.style.cursor = overReturn || overLink ? "pointer" : "default";
};

const handleSettingsMove = ({ x, y, canvas, getActiveControlsOverlay, drawStartScreen }) => {
  const overlay = getActiveControlsOverlay();
  overlay.setPointer(x, y);
  const hovering = overlay.isHovering();
  canvas.style.cursor = hovering ? "pointer" : "default";
  drawStartScreen();
};

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

const handleLegalLeave = ({ state, canvas, drawStartScreen }) => {
  canvas.style.cursor = "default";
  if (!state.legalReturnHover) return;
  state.legalReturnHover = false;
  drawStartScreen();
};

const handleSettingsLeave = ({ canvas, getActiveControlsOverlay, drawStartScreen }) => {
  const overlay = getActiveControlsOverlay();
  overlay.clearPointer();
  drawStartScreen();
  setOverlayActive(true);
  canvas.style.cursor = "default";
};

const handleStartButtonLeave = ({ state, canvas, drawStartScreen }) => {
  if (state.startButtonHover) {
    state.startButtonHover = false;
    drawStartScreen();
  }
  canvas.style.cursor = "default";
};

const closeLegalOnEscape = ({ state, event, drawStartScreen }) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  state.legalPage = null;
  setOverlayActive(false);
  drawStartScreen();
};

const closeSettingsOnEscape = ({ state, event, getActiveControlsOverlay, drawStartScreen }) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  state.settingsOpen = false;
  const overlay = getActiveControlsOverlay();
  overlay.clearPointer();
  setOverlayActive(false);
  drawStartScreen();
};

const createHandleCanvasClick = (dependencies, handlerRefs) => (event) => {
  if (!dependencies.state.startScreenActive) return;
  const { x, y } = getCanvasPoint(dependencies.canvas, event);
  if (handleLegalClick({ ...dependencies, x, y })) return;
  if (handleSettingsOverlayClick({ ...dependencies, x, y })) return;
  handleStartButtonClick({ ...dependencies, x, y, handlerRefs });
};

const createHandleMove = (dependencies) => (event) => {
  if (!dependencies.state.startScreenActive) return;
  const { x, y } = getCanvasPoint(dependencies.canvas, event);
  if (dependencies.state.legalPage) return handleLegalMove({ ...dependencies, x, y });
  if (dependencies.state.settingsOpen) return handleSettingsMove({ ...dependencies, x, y });
  handleStartButtonMove({ ...dependencies, x, y });
};

const createHandleLeave = (dependencies) => () => {
  if (!dependencies.state.startScreenActive) return;
  if (dependencies.state.legalPage) return handleLegalLeave(dependencies);
  if (dependencies.state.settingsOpen) return handleSettingsLeave(dependencies);
  handleStartButtonLeave(dependencies);
};

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

const createHandleKeyDown = (dependencies) => (event) => {
  if (!dependencies.state.startScreenActive || event.key !== "Escape") return;
  if (dependencies.state.legalPage) return closeLegalOnEscape({ ...dependencies, event });
  if (dependencies.state.settingsOpen) closeSettingsOnEscape({ ...dependencies, event });
};

const createHandleWheel = (dependencies) => (event) => {
  if (!dependencies.state.legalPage) return;
  event.preventDefault();
  const scrollDeltaY = event.deltaY;
  dependencies.state.legalScroll = Math.min(dependencies.state.legalMaxScroll, Math.max(0, dependencies.state.legalScroll + scrollDeltaY));
  dependencies.drawStartScreen();
};

const createHandleTouchStart = (dependencies) => (event) => {
  if (!dependencies.state.legalPage) return;
  const firstTouch = event.touches?.[0];
  if (!firstTouch) return;
  dependencies.state.touchScrollStartY = firstTouch.clientY;
};

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

const createHandleTouchEnd = (dependencies) => () => {
  dependencies.state.touchScrollStartY = null;
};

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

export function createStartScreenHandlers(dependencies) {
  return buildStartScreenHandlers(dependencies);
}
