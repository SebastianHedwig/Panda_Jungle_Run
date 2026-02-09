import { clearTimeoutIfNeeded, stopAndResetAudio } from "./bossAudio.helpers.js";

/**
 * Stops and cleanup boss audio.
 */
export function stopAndCleanupBossAudio() {
  this.isPlaying = false;
  this.clearBossTimers();
  this.stopGongAudioAndClear();
  this.stopNextMusicAudio();
  this.stopMusicAudio();
  this.stopDefeatAudio();
  this.stopAttack2Audio();
  this.stopWhooshAudio();
  this.stopHitAudio();
  this.stopHowlEndAudio();
  this.unbindUnlock();
}

/**
 * Clears boss timers.
 * Clears pending timers.
 */
export function clearBossTimers() {
  this.fadeStartTimer = clearTimeoutIfNeeded(this.fadeStartTimer);
  this.gongStopTimer = clearTimeoutIfNeeded(this.gongStopTimer);
  this.clearFadeInterval();
}

/**
 * Stops gong audio and clear.
 */
export function stopGongAudioAndClear() {
  this.gongAudio = stopAndResetAudio(this.gongAudio);
}

/**
 * Stops next music audio.
 */
export function stopNextMusicAudio() {
  this.nextMusicAudio = this.stopLoopedAudioInstance(this.nextMusicAudio);
}

/**
 * Stops music audio.
 */
export function stopMusicAudio() {
  this.musicAudio = this.stopLoopedAudioInstance(this.musicAudio);
}

/**
 * Stops defeat audio.
 */
export function stopDefeatAudio() {
  this.defeatAudio = stopAndResetAudio(this.defeatAudio);
}

/**
 * Stops attack 2 audio.
 */
export function stopAttack2Audio() {
  this.attack2Audio = stopAndResetAudio(this.attack2Audio);
}

/**
 * Stops whoosh audio.
 */
export function stopWhooshAudio() {
  this.whooshAudio = stopAndResetAudio(this.whooshAudio);
}

/**
 * Stops hit audio.
 */
export function stopHitAudio() {
  this.hitAudio = stopAndResetAudio(this.hitAudio);
}

/**
 * Stops howl end audio.
 */
export function stopHowlEndAudio() {
  this.howlEndAudio = stopAndResetAudio(this.howlEndAudio);
}

/**
 * Binds unlock.
 * Binds keydown, pointerdown, touchstart event listeners.
 * Triggers audio playback or updates audio state.
 */
export function bindUnlock() {
  if (this.unlockHandler) return;
  this.unlockHandler = () => {
    this.gongAudio?.play();
    this.musicAudio?.play();
    this.defeatAudio?.play();
    this.unbindUnlock();
  };
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
