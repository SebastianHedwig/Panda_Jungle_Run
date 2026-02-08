/**
 * Is inside bounds.
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
 * Updates the instance state.
 * @param {*} bounds Bounds.
 * @returns {boolean} Whether pointer inside bounds.
 */
export function isPointerInsideBounds(bounds) {
  const pointer = this.pointer;
  return !!pointer && this.isInsideBounds(pointer.x, pointer.y, bounds);
}

/**
 * Exit controls overlay.
 * Updates the instance state.
 * @param {import("../controls/controlsOverlay.class.js").ControlsOverlay | import("../controls/mobileControlsOverlay.class.js").ControlsOverlayMobile} activeOverlay Active overlay.
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
 * Updates the instance state.
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
 * Updates the instance state.
 * @param {number} x X.
 * @param {number} y Y.
 * @returns {*} Item hit index.
 */
export function getItemHitIndex(x, y) {
  return this.itemBounds.findIndex((bounds) => this.isInsideBounds(x, y, bounds));
}

/**
 * Open controls.
 * Updates the instance state.
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
 * Updates the instance state.
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
 * Updates the instance state.
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
 * Updates the instance state.
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
