import { playWhenReady } from "../audioUtils.js";
import { msPerSecond } from "./bossAudio.class.js";

/**
 * Plays.
 */
export function play() {
  this.stopAndCleanupBossAudio();
  this.isPlaying = true;
  this.startGong();
  this.scheduleFadeToMusic();
  this.scheduleGongStop();
}

/**
 * Starts gong.
 */
export function startGong() {
  this.gongAudio = this.createAudio(this.gongSrc, false, this.volume);
  playWhenReady(this.gongAudio);
  this.bindUnlock();
}

/**
 * Schedules fade to music.
 * Schedules timed actions.
 */
export function scheduleFadeToMusic() {
  const fadeStartMs = this.getFadeStartMs();
  this.fadeStartTimer = setTimeout(() => this.startFadeToMusic(), fadeStartMs);
}

/**
 * Returns fade start ms.
 * Used to provide fade start ms for timed actions.
 * @returns {*} Fade start ms.
 */
export function getFadeStartMs() {
  return Math.max(0, (this.gongPlayDuration - this.fadeDuration) * msPerSecond);
}

/**
 * Schedules gong stop.
 * Schedules timed actions.
 */
export function scheduleGongStop() {
  this.gongStopTimer = setTimeout(
    () => this.stopGongAudio(),
    this.gongPlayDuration * msPerSecond
  );
}

/**
 * Stops gong audio.
 * Triggers audio playback or updates audio state.
 */
export function stopGongAudio() {
  if (!this.gongAudio) return;
  this.gongAudio.pause();
  this.gongAudio.currentTime = 0;
}

/**
 * Starts fade to music.
 */
export function startFadeToMusic() {
  if (this.musicAudio) return;
  const music = this.createAndStartMusicAudio();
  this.beginMusicFadeIn(music);
}

/**
 * Creates and start music audio.
 * Used to set up required data for audio playback.
 * @returns {*} And start music audio.
 */
export function createAndStartMusicAudio() {
  this.musicAudio = this.createMusicAudio(0);
  const music = this.musicAudio;
  this.attachMusicLoopWatcher(music);
  playWhenReady(music, {
    beforePlay: () => {
      music.playbackRate = this.playbackRate;
    },
  });
  return music;
}

/**
 * Begin music fade in.
 * Used to support audio playback.
 * Schedules timed actions.
 * @param {*} music Music.
 */
export function beginMusicFadeIn(music) {
  const durationMs = this.getFadeDurationMs();
  const loudnessStepMs = this.loudnessStepMs;
  let elapsedMs = 0;
  this.fadeInterval = setInterval(() => {
    elapsedMs += loudnessStepMs;
    const fadeProgress = Math.min(elapsedMs / durationMs, 1);
    music.volume = this.volume * fadeProgress;
    if (fadeProgress >= 1) this.clearFadeInterval();
  }, loudnessStepMs);
}

/**
 * Returns fade duration ms.
 * Used to provide fade duration ms for timed actions.
 * @returns {*} Fade duration ms.
 */
export function getFadeDurationMs() {
  return Math.max(this.minFadeDurationMs, this.fadeDuration * msPerSecond);
}

/**
 * Attaches music loop watcher.
 * Used to support audio playback.
 * Binds timeupdate event listeners.
 * @param {HTMLElement} audioElement Audio element.
 */
export function attachMusicLoopWatcher(audioElement) {
  /**
   * Handler.
   * Used to support audio playback.
   * @returns {*} Result value.
   */
  const handler = () => this.handleMusicLoopTimeUpdate(audioElement);
  audioElement.addEventListener("timeupdate", handler);
  this.loopHandlers.set(audioElement, handler);
}

/**
 * Handles music loop time update.
 * Used to centralize a specific behavior for audio playback.
 * Performs hitbox or collision checks.
 * @param {HTMLElement} audioElement Audio element.
 */
export function handleMusicLoopTimeUpdate(audioElement) {
  if (!audioElement.duration || !isFinite(audioElement.duration)) return;
  const cutoff = this.getMusicLoopCutoff(audioElement.duration);
  const overlapStart = this.getMusicOverlapStart(cutoff);
  this.tryStartNextLoop(audioElement, overlapStart);
  this.tryCompleteLoop(audioElement, cutoff);
}

/**
 * Returns music loop cutoff.
 * Used to provide music loop cutoff for audio playback.
 * @param {number} duration Duration in seconds.
 * @returns {*} Music loop cutoff.
 */
export function getMusicLoopCutoff(duration) {
  return Math.max(0, duration - this.musicLoopCut);
}

/**
 * Returns music overlap start.
 * Used to provide music overlap start for collision and hit testing.
 * @param {*} cutoff Cutoff.
 * @returns {*} Music overlap start.
 */
export function getMusicOverlapStart(cutoff) {
  return Math.max(0, cutoff - this.fadeDuration);
}

/**
 * Try start next loop.
 * Used to support audio playback.
 * Performs hitbox or collision checks.
 * @param {HTMLElement} audioElement Audio element.
 * @param {*} overlapStart Overlap start.
 */
export function tryStartNextLoop(audioElement, overlapStart) {
  if (this.shouldStartNextLoop(audioElement, overlapStart)) {
    this.startNextMusicLoop(audioElement);
  }
}

/**
 * Should start next loop.
 * Used to decide control flow.
 * Performs hitbox or collision checks.
 * @param {HTMLElement} audioElement Audio element.
 * @param {*} overlapStart Overlap start.
 * @returns {boolean} Whether start next loop.
 */
export function shouldStartNextLoop(audioElement, overlapStart) {
  return (
    !this.nextMusicAudio &&
    this.musicLoopCut > 0 &&
    audioElement.currentTime >= overlapStart
  );
}

/**
 * Try complete loop.
 * Used to support audio playback.
 * @param {HTMLElement} audioElement Audio element.
 * @param {*} cutoff Cutoff.
 */
export function tryCompleteLoop(audioElement, cutoff) {
  if (this.shouldCompleteLoop(audioElement, cutoff)) {
    this.completeMusicSwitch(audioElement);
  }
}

/**
 * Should complete loop.
 * Used to decide control flow.
 * @param {HTMLElement} audioElement Audio element.
 * @param {*} cutoff Cutoff.
 * @returns {boolean} Whether complete loop.
 */
export function shouldCompleteLoop(audioElement, cutoff) {
  return (
    this.nextMusicAudio &&
    this.fadeInterval === null &&
    audioElement.currentTime >= cutoff
  );
}

/**
 * Detach loop watcher.
 * Used to support audio playback.
 * @param {HTMLElement} audioElement Audio element.
 */
export function detachLoopWatcher(audioElement) {
  const handler = this.loopHandlers.get(audioElement);
  if (handler) {
    audioElement.removeEventListener("timeupdate", handler);
    this.loopHandlers.delete(audioElement);
  }
}

/**
 * Starts next music loop.
 * Used to support audio playback.
 * @param {*} current Current.
 */
export function startNextMusicLoop(current) {
  this.nextMusicAudio = this.createMusicAudio(0);
  const next = this.nextMusicAudio;
  this.attachMusicLoopWatcher(next);
  this.beginMusicCrossfade(current, next);
  playWhenReady(next, {
    beforePlay: () => {
      next.playbackRate = this.playbackRate;
    },
  });
}

/**
 * Begin music crossfade.
 * Used to support audio playback.
 * Schedules timed actions.
 * @param {*} current Current.
 * @param {*} next Next.
 */
export function beginMusicCrossfade(current, next) {
  this.clearFadeInterval();
  const durationMs = this.getFadeDurationMs();
  const loudnessStepMs = this.loudnessStepMs;
  let elapsedMs = 0;
  this.fadeInterval = setInterval(() => {
    elapsedMs += loudnessStepMs;
    const fadeProgress = Math.min(elapsedMs / durationMs, 1); // 0..1 volume blend
    this.applyCrossfadeVolumes(current, next, fadeProgress);
    if (fadeProgress >= 1) this.completeMusicSwitch(current);
  }, loudnessStepMs);
}

/**
 * Applies crossfade volumes.
 * Used to apply audio settings.
 * @param {*} current Current.
 * @param {*} next Next.
 * @param {number} fadeProgress Fade progress.
 */
export function applyCrossfadeVolumes(current, next, fadeProgress) {
  if (current) current.volume = this.volume * (1 - fadeProgress);
  if (next) next.volume = this.volume * fadeProgress;
}

/**
 * Clears fade interval.
 * Clears pending timers.
 */
export function clearFadeInterval() {
  if (this.fadeInterval) {
    clearInterval(this.fadeInterval);
    this.fadeInterval = null;
  }
}

/**
 * Clears music tracks.
 */
export function clearMusicTracks() {
  this.stopNextMusicAudio();
  this.stopMusicAudio();
}

/**
 * Complete music switch.
 * Used to support audio playback.
 * @param {*} prev Prev.
 */
export function completeMusicSwitch(prev) {
  this.clearFadeInterval();
  this.stopPreviousMusicAudio(prev);
  this.swapToNextMusicAudio();
}

/**
 * Stops looped audio instance.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {HTMLElement} audioElement Audio element.
 * @returns {*} Result value.
 */
export function stopLoopedAudioInstance(audioElement) {
  if (!audioElement) return null;
  this.detachLoopWatcher(audioElement);
  audioElement.pause();
  audioElement.currentTime = 0;
  return null;
}

/**
 * Stops previous music audio.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {*} prev Prev.
 */
export function stopPreviousMusicAudio(prev) {
  if (!prev) return;
  this.detachLoopWatcher(prev);
  prev.pause();
  prev.currentTime = 0;
}

/**
 * Swap to next music audio.
 */
export function swapToNextMusicAudio() {
  if (!this.nextMusicAudio) return;
  this.musicAudio = this.nextMusicAudio;
  this.nextMusicAudio = null;
  this.musicAudio.volume = this.volume;
}
