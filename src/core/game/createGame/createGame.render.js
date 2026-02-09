/**
 * Sets canvas cursor default.
 */
export function setCanvasCursorDefault() {
  if (this.canvas) this.canvas.style.cursor = "default";
}

/**
 * Sets overlay active state.
 * Updates CSS classes to reflect the current state.
 */
export function setOverlayActiveState() {
  const overlayActive = this.isGameWon || this.isGameOver || this.isPaused;
  document.body?.classList.toggle("overlay-active", overlayActive);
}

/**
 * Clears canvas.
 * Renders to the canvas context.
 */
export function clearCanvas() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

/**
 * Renders platforms.
 */
export function renderPlatforms() {
  this.world.platforms.forEach((platform) => platform.render(this.ctx, this.camera));
}

/**
 * Renders collectables.
 */
export function renderCollectables() {
  this.world.collectables.forEach((collectable) => collectable.draw(this.ctx, this.camera));
}

/**
 * Renders hud popups.
 * Spawns visual feedback effects.
 */
export function renderHudPopups() {
  this.world.hudPopups.forEach((popup) => popup.draw(this.ctx, this.camera));
}

/**
 * Renders world.
 * Spawns visual feedback effects.
 */
export function renderWorld() {
  this.background.render(this.ctx, this.camera);
  this.renderPlatforms();
  this.renderCollectables();
  this.renderHudPopups();
  this.world.renderProjectiles(this.ctx, this.camera);
  this.world.renderEnemies(this.ctx, this.camera);
  this.player.render(this.ctx, this.camera);
  this.world.renderHitEffects(this.ctx, this.camera);
}

/**
 * Renders hud.
 */
export function renderHud() {
  this.hud?.render(this.ctx, this.canvas, this.camera, this.player, this.bossDirector?.getBoss());
}

/**
 * Renders game won overlay.
 */
export function renderGameWonOverlay() {
  this.gameWonOverlay?.render(this.ctx, this.canvas);
  if (this.canvas) this.canvas.style.cursor = this.gameWonOverlay?.isHovering?.() ? "pointer" : "default";
}

/**
 * Renders game over overlay.
 */
export function renderGameOverOverlay() {
  this.gameOverOverlay?.render(this.ctx, this.canvas);
  if (this.canvas) this.canvas.style.cursor = this.gameOverOverlay?.isHovering?.() ? "pointer" : "default";
}

/**
 * Renders end game overlay.
 * Used to render end game overlay.
 * @returns {*} Result value.
 */
export function renderEndGameOverlay() {
  if (this.isGameWon) {
    this.renderGameWonOverlay();
    return true;
  }
  if (this.isGameOver) {
    this.renderGameOverOverlay();
    return true;
  }
  return false;
}

/**
 * Renders paused menu.
 */
export function renderPausedMenu() {
  if (!this.isPaused) return;
  if (this.menuPointer) this.menu.setPointer?.(this.menuPointer.x, this.menuPointer.y);
  this.menu?.render(this.ctx, this.canvas);
}

/**
 * Draws.
 */
export function draw() {
  this.setCanvasCursorDefault();
  this.setOverlayActiveState();
  this.clearCanvas();
  this.renderWorld();
  this.renderHud();
  if (this.renderEndGameOverlay()) return;
  this.renderPausedMenu();
}
