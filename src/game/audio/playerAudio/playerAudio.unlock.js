/**
 * Binds unlock.
 */
export function bindUnlock() {
  if (this.unlockHandler) return;
  this.unlockHandler = () => {
    const audioFiles = this.getUnlockAudioFiles();
    audioFiles.forEach((audioFile) => this.warmupAudioFile(audioFile));
    this.unbindUnlock();
  };
  this.addUnlockListeners();
}

/**
 * Returns unlock audio files.
 * Used to provide unlock audio files for audio playback.
 * Applies physics updates like gravity and velocity.
 * @returns {Array<any>} Unlock audio files.
 */
export function getUnlockAudioFiles() {
  return [
    this.deadAudio,
    this.hitAudio,
    this.shootAudio,
    this.jumpAudio,
    this.landingBase,
    this.slideAudio0,
    this.slideAudio1,
    ...this.ouchCache.values(),
    ...this.punchCache.values(),
  ];
}

/**
 * Warmup audio file.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {*} audioFile Audio file.
 */
export function warmupAudioFile(audioFile) {
  if (!audioFile) return;
  const previousMuted = audioFile.muted;
  const previousVolume = audioFile.volume;
  this.muteAudioForWarmup(audioFile);
  this.playAndResetAudio(audioFile, previousMuted, previousVolume);
}

/**
 * Mute audio for warmup.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {*} audioFile Audio file.
 */
export function muteAudioForWarmup(audioFile) {
  audioFile.muted = true;
  audioFile.volume = 0;
}

/**
 * Plays and reset audio.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {*} audioFile Audio file.
 * @param {boolean} previousMuted Previous muted.
 * @param {number} previousVolume Previous volume.
 */
export function playAndResetAudio(audioFile, previousMuted, previousVolume) {
  audioFile.play()
    .then(() => this.resetAudioPlayback(audioFile))
    .finally(() => this.restoreAudioState(audioFile, previousMuted, previousVolume));
}

/**
 * Resets audio playback.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {*} audioFile Audio file.
 */
export function resetAudioPlayback(audioFile) {
  audioFile.pause();
  audioFile.currentTime = 0;
}

/**
 * Restore audio state.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {*} audioFile Audio file.
 * @param {boolean} previousMuted Previous muted.
 * @param {number} previousVolume Previous volume.
 */
export function restoreAudioState(audioFile, previousMuted, previousVolume) {
  audioFile.muted = previousMuted;
  audioFile.volume = previousVolume;
}

/**
 * Adds unlock listeners.
 * Binds keydown, pointerdown, touchstart event listeners.
 */
export function addUnlockListeners() {
  window.addEventListener("pointerdown", this.unlockHandler, { once: true });
  window.addEventListener("keydown", this.unlockHandler, { once: true });
  window.addEventListener("touchstart", this.unlockHandler, { once: true });
}

/**
 * Unbind unlock.
 */
export function unbindUnlock() {
  if (!this.unlockHandler) return;
  window.removeEventListener("pointerdown", this.unlockHandler);
  window.removeEventListener("keydown", this.unlockHandler);
  window.removeEventListener("touchstart", this.unlockHandler);
  this.unlockHandler = null;
}
