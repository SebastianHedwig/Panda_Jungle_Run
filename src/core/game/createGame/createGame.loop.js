/**
 * Loop high res.
 * Uses timeStamp to perform the operation.
 * @param {number} timeStamp Time stamp.
 */
export function loopHighRes(timeStamp) {
  const msPerSecond = 1000;
  if (!this.lastTimeHigh) this.lastTimeHigh = timeStamp;
  const dt = Math.min((timeStamp - this.lastTimeHigh) / msPerSecond, this.MAX_FRAME_TIME);
  this.lastTimeHigh = timeStamp;

  if (!this.isPaused) this.update(dt);
  this.draw();
  this.input.endFrame();
  requestAnimationFrame(this.loopHighRes);
}

/**
 * Sets game won state.
 */
export function setGameWonState() {
  this.isGameWon = true;
  this.gameWonOverlay?.setCoins?.(this.player?.coins ?? 0);
  this.setPaused(false);
  this.menuPointer = null;
  this.gameWonOverlay?.reset?.();
}

/**
 * Handles boss update.
 * Uses dt to perform the operation.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
export function handleBossUpdate(dt) {
  const bossResult = this.bossDirector?.update(dt, this.player);
  if (!this.isGameWon && bossResult?.cleared) {
    this.setGameWonState();
    return true;
  }
  return false;
}

/**
 * Updates player and camera.
 * Updates the player state.
 * @param {number} dt Delta time in seconds.
 */
export function updatePlayerAndCamera(dt) {
  this.player.update(dt, this.input);
  this.audio?.ensureVolume?.();
  this.camera.follow(this.player, this.CAMERA_FOLLOW_LERP, dt);
  this.background.update(this.camera.x, this.camera.y, dt);
}

/**
 * Updates collectable entities.
 * Updates the world state.
 * @param {number} dt Delta time in seconds.
 */
export function updateCollectableEntities(dt) {
  this.world.collectables.forEach((collectable) => collectable.update(dt));
}

/**
 * Updates enemies and projectiles.
 * Updates the world state.
 * @param {number} dt Delta time in seconds.
 */
export function updateEnemiesAndProjectiles(dt) {
  this.world.updateEnemies(dt, this.player);
  this.world.updateProjectiles(dt, this.world.enemies ?? []);
}

/**
 * Updates world entities.
 * Updates the player state.
 * Spawns visual feedback effects.
 * @param {number} dt Delta time in seconds.
 */
export function updateWorldEntities(dt) {
  this.world.applyPlatformCollisions(this.player);
  this.player.handleLandingAudio?.();
  this.updateCollectableEntities(dt);
  this.updateEnemiesAndProjectiles(dt);
  this.world.updateHitEffects(dt);
}

/**
 * Updates hud popups.
 * Updates the world state.
 * Spawns visual feedback effects.
 * @param {number} dt Delta time in seconds.
 * @returns {*} Result value.
 */
export function updateHudPopups(dt) {
  this.world.hudPopups = this.world.hudPopups.filter((popup) => {
    popup.update(dt);
    return popup.opacity > 0;
  });
}

/**
 * Updates.
 * Spawns visual feedback effects.
 * @param {number} dt Delta time in seconds.
 */
export function update(dt) {
  if (this.handleBossUpdate(dt)) return;
  this.updatePlayerAndCamera(dt);
  this.updateWorldEntities(dt);
  this.checkCollectables();
  this.hud?.update(dt, this.player);
  this.updateHudPopups(dt);
}

/**
 * Checks collectables.
 * Updates the world state.
 * @returns {*} Result value.
 */
export function checkCollectables() {
  this.world.collectables = this.world.collectables.filter((collectable) => {
    if (!collectable.collected && collectable.isColliding(this.player)) {
      collectable.collect(this.player);
      return true;
    }
    return !collectable.pickupAnimating || collectable.opacity > 0;
  });
}
