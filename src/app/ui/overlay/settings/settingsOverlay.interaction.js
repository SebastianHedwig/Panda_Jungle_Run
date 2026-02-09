/**
 * Is inside bounds.
 * Used to decide UI hit testing outcomes.
 * Uses x, y, bounds to perform the operation.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {*} bounds Bounds.
 * @returns {boolean} Whether inside bounds.
 */
export function isInsideBounds(x, y, bounds) {
  return x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;
}

/**
 * Is pointer inside bounds.
 * Used to decide UI hit testing outcomes.
 * @param {*} bounds Bounds.
 * @returns {boolean} Whether pointer inside bounds.
 */
export function isPointerInsideBounds(bounds) {
  const pointer = this.pointer;
  return !!pointer && this.isInsideBounds(pointer.x, pointer.y, bounds);
}

/**
 * Exit controls overlay.
 * Used to support UI interaction handling.
 * @param {ControlsOverlay | ControlsOverlayMobile} activeOverlay Active overlay.
 * @returns {*} Result value.
 */
export function exitControlsOverlay(activeOverlay) {
  this.showControls = false;
  activeOverlay.clearPointer();
  this.renderer.clearPointer();
  return false;
}

/**
 * Handles controls click.
 * Used to centralize a specific behavior for UI interaction handling.
 * @param {number} x X.
 * @param {number} y Y.
 * @returns {*} Result value.
 */
export function handleControlsClick(x, y) {
  const activeOverlay = this.getActiveControlsOverlay();
  if (activeOverlay.handleBackClick?.(x, y)) return this.exitControlsOverlay(activeOverlay);
  if (activeOverlay.handleCloseButtonClick(x, y)) {
    this.showControls = false;
    return true;
  }
  return false;
}

/**
 * Returns item hit index.
 * Used to provide item hit index for UI interaction handling.
 * @param {number} x X.
 * @param {number} y Y.
 * @returns {*} Item hit index.
 */
export function getItemHitIndex(x, y) {
  return this.itemBounds.findIndex((bounds) => this.isInsideBounds(x, y, bounds));
}

/**
 * Open controls.
 * Used to support UI interaction handling.
 * @returns {*} Result value.
 */
export function openControls() {
  this.showControls = true;
  this.renderer.clearPointer();
  this.controlsOverlayDesktop.clearPointer();
  this.controlsOverlayMobile.clearPointer();
  return false;
}

/**
 * Quit game.
 * Used to support UI interaction handling.
 * @returns {*} Result value.
 */
export function quitGame() {
  this.showControls = false;
  this.clearPointer();
  this.onQuit?.();
  return true;
}

/**
 * Handles menu item hit.
 * Used to centralize a specific behavior for UI interaction handling.
 * @param {number} hitIndex Hit index.
 * @returns {*} Result value.
 */
export function handleMenuItemHit(hitIndex) {
  if (hitIndex === 0) return this.openControls();
  if (hitIndex === 1) return this.quitGame();
  return false;
}

/**
 * Handles settings overlay click.
 * Used to centralize a specific behavior for UI interaction handling.
 * @param {number} x X.
 * @param {number} y Y.
 * @returns {*} Result value.
 */
export function handleSettingsOverlayClick(x, y) {
  if (this.showControls) return this.handleControlsClick(x, y);
  if (this.renderer.handleCloseButtonClick(x, y)) return true;
  const hitIndex = this.getItemHitIndex(x, y);
  return this.handleMenuItemHit(hitIndex);
}
