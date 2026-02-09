/**
 * Sets paused.
 * Used to support UI interaction handling.
 * Uses paused to perform the operation.
 * @param {boolean} paused Paused.
 */
export function setPaused(paused) {
  this.isPaused = !!paused;
  if (!this.isPaused) {
    this.menuPointer = null;
    this.menu?.clearPointer?.();
  }
}

/**
 * Returns paused.
 * Used to provide paused for UI interaction handling.
 * @returns {*} Paused.
 */
export function getPaused() {
  return this.isPaused;
}

/**
 * Sets settings open.
 * Used to support UI interaction handling.
 * Resolves DOM elements from the document.
 * @param {boolean} open Open.
 */
export function setSettingsOpen(open) {
  this.setPaused(open);
  const toggle = document.getElementById("settings-toggle");
}

/**
 * Returns canvas pointer.
 * Used to provide canvas pointer for UI interaction handling.
 * Uses event to compute the result.
 * @param {Event} event Event object.
 * @returns {Object} Canvas pointer.
 */
export function getCanvasPointer(event) {
  const rect = this.canvas.getBoundingClientRect();
  const canvasPointerX = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
  const canvasPointerY = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
  return { x: canvasPointerX, y: canvasPointerY };
}

/**
 * Sets game won pointer.
 * Used to support UI interaction handling.
 * Uses canvasPointerX, canvasPointerY to perform the operation.
 * @param {number} canvasPointerX Canvas pointer X.
 * @param {number} canvasPointerY Canvas pointer Y.
 */
export function setGameWonPointer(canvasPointerX, canvasPointerY) {
  this.gameWonOverlay?.setPointer?.(canvasPointerX, canvasPointerY);
}

/**
 * Sets game over pointer.
 * Used to support UI interaction handling.
 * Uses canvasPointerX, canvasPointerY to perform the operation.
 * @param {number} canvasPointerX Canvas pointer X.
 * @param {number} canvasPointerY Canvas pointer Y.
 */
export function setGameOverPointer(canvasPointerX, canvasPointerY) {
  this.gameOverOverlay?.setPointer?.(canvasPointerX, canvasPointerY);
}

/**
 * Sets menu pointer.
 * Used to support UI interaction handling.
 * Uses menuPointerX, menuPointerY to perform the operation.
 * @param {number} menuPointerX Menu pointer X.
 * @param {number} menuPointerY Menu pointer Y.
 */
export function setMenuPointer(menuPointerX, menuPointerY) {
  this.menuPointer = { x: menuPointerX, y: menuPointerY };
  if (this.isPaused) this.menu?.setPointer?.(menuPointerX, menuPointerY);
}

/**
 * Applies menu pointer.
 * Used to keep UI visuals consistent.
 * Uses canvasPointerX, canvasPointerY to perform the operation.
 * @param {number} canvasPointerX Canvas pointer X.
 * @param {number} canvasPointerY Canvas pointer Y.
 * @returns {*} Result value.
 */
export function applyMenuPointer(canvasPointerX, canvasPointerY) {
  if (this.isGameWon) return this.setGameWonPointer(canvasPointerX, canvasPointerY);
  if (this.isGameOver) return this.setGameOverPointer(canvasPointerX, canvasPointerY);
  this.setMenuPointer(canvasPointerX, canvasPointerY);
}

/**
 * Updates settings pointer.
 * Used to advance state during the update loop for UI interaction handling.
 * Uses event to perform the operation.
 * @param {Event} event Event object.
 */
export function updateSettingsPointer(event) {
  if (!this.canvas) return;
  const { x: canvasPointerX, y: canvasPointerY } = this.getCanvasPointer(event);
  this.applyMenuPointer(canvasPointerX, canvasPointerY);
}

/**
 * Clears settings pointer.
 */
export function clearSettingsPointer() {
  this.menuPointer = null;
  this.menu?.clearPointer?.();
  this.gameOverOverlay?.clearPointer?.();
  this.gameWonOverlay?.clearPointer?.();
}

/**
 * Handles game overlay action.
 * Used to centralize a specific behavior for UI interaction handling.
 * Uses action to perform the operation.
 * @param {*} action Action.
 */
export function handleGameOverlayAction(action) {
  if (action === "retry") this.handleRetry();
  if (action === "quit") this.handleQuit();
}

/**
 * Handles end game click.
 * Used to centralize a specific behavior for UI interaction handling.
 * Uses canvasPointerX, canvasPointerY to perform the operation.
 * @param {number} canvasPointerX Canvas pointer X.
 * @param {number} canvasPointerY Canvas pointer Y.
 * @returns {*} Result value.
 */
export function handleEndGameClick(canvasPointerX, canvasPointerY) {
  if (this.isGameWon) {
    this.handleGameOverlayAction(
      this.gameWonOverlay?.handleGameOverlayButtonClick?.(canvasPointerX, canvasPointerY)
    );
    return true;
  }
  if (this.isGameOver) {
    this.handleGameOverlayAction(
      this.gameOverOverlay?.handleGameOverlayButtonClick?.(canvasPointerX, canvasPointerY)
    );
    return true;
  }
  return false;
}

/**
 * Stops menu click event.
 * Used to support UI interaction handling.
 * Uses event to perform the operation.
 * @param {Event} event Event object.
 */
export function stopMenuClickEvent(event) {
  event.stopImmediatePropagation?.();
  event.preventDefault?.();
}

/**
 * Handles menu click.
 * Used to centralize a specific behavior for UI interaction handling.
 * Uses event to perform the operation.
 * @param {Event} event Event object.
 */
export function handleMenuClick(event) {
  const { x: canvasPointerX, y: canvasPointerY } = this.getCanvasPointer(event);
  if (this.handleEndGameClick(canvasPointerX, canvasPointerY)) return;
  if (!this.isPaused || !this.menu) return;
  if (this.menu.handleSettingsOverlayClick?.(canvasPointerX, canvasPointerY)) {
    this.setSettingsOpen(false);
    this.stopMenuClickEvent(event);
  }
}

/**
 * Handles quit.
 */
export function handleQuit() {
  window.location.href = window.location.origin + window.location.pathname;
}

/**
 * Handles retry.
 * Reads or writes browser storage.
 */
export function handleRetry() {
  try {
    window.localStorage?.setItem?.("panda_autostart", "1");
  } catch (_err) {
    // ignore DOMExceptions from storage (e.g.: blocked/readonly/incognito)
  }
  window.location.reload();
}

/**
 * Adds menu listeners.
 * Binds click, mouseleave, mousemove event listeners.
 */
export function addMenuListeners() {
  this.canvas.addEventListener("mousemove", this.updateSettingsPointer);
  this.canvas.addEventListener("mouseleave", this.clearSettingsPointer);
  this.canvas.addEventListener("click", this.handleMenuClick, true);
}
