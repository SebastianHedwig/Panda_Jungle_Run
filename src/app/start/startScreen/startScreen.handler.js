import { consumeNextStartScreenAction, setOverlayActive } from "./startScreen.utils.js";
import { handleLegalClick, handleLegalMove, handleLegalLeave, closeLegalOnEscape } from "./startScreen.handler.legal.js";
import { getCanvasPoint, handleSettingsOverlayClick, handleStartButtonClick, handleSettingsMove, handleStartButtonMove, handleSettingsLeave, handleStartButtonLeave, closeSettingsOnEscape } from "./startScreen.handler.logic.js";

/**
 * Creates handle canvas click.
 * Used to set up required data for UI interaction handling.
 * Uses dependencies, handlerRefs to compute the result.
 * @param {*} dependencies Dependencies.
 * @param {*} handlerRefs Handler refs.
 * @returns {*} Handle canvas click.
 */
const createHandleCanvasClick = (dependencies, handlerRefs) => (event) => {
  if (!dependencies.state.startScreenActive) return;
  if (consumeNextStartScreenAction(dependencies.state)) return;
  const { x, y } = getCanvasPoint(dependencies.canvas, event);
  if (handleLegalClick({ ...dependencies, x, y })) return;
  if (handleSettingsOverlayClick({ ...dependencies, x, y })) return;
  handleStartButtonClick({ ...dependencies, x, y, handlerRefs });
};

/**
 * Creates handle move.
 * Used to set up required data for camera-relative placement.
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
 * Used to set up required data for camera-relative placement.
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
 * Used to set up required data for UI interaction handling.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle settings click.
 */
const createHandleSettingsClick = (dependencies) => (event) => {
  if (!dependencies.state.startScreenActive) return;
  event?.preventDefault();
  event?.stopImmediatePropagation();
  if (consumeNextStartScreenAction(dependencies.state)) return;
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
 * Used to set up required data for camera-relative placement.
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
 * Used to set up required data for camera-relative placement.
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
 * Used to set up required data for UI interaction handling.
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
 * Used to set up required data for UI interaction handling.
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
 * Used to set up required data for UI interaction handling.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Handle touch end.
 */
const createHandleTouchEnd = (dependencies) => () => {
  dependencies.state.touchScrollStartY = null;
};

/**
 * Builds start screen handlers.
 * Used to assemble required data for camera-relative placement.
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
 * Used to set up required data for camera-relative placement.
 * Uses dependencies to compute the result.
 * @param {*} dependencies Dependencies.
 * @returns {*} Start screen handlers.
 */
export function createStartScreenHandlers(dependencies) {
  return buildStartScreenHandlers(dependencies);
}
