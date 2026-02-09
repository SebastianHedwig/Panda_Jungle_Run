import { playWhenReady } from "../audioUtils.js";

/**
 * Plays landing.
 */
export function playLanding() {
  const cachedLandingBase = this.getLandingBase();
  const audio = this.cloneLandingAudio(cachedLandingBase);
  /**
   * Sets landing offset.
   * Used to support audio playback.
   * @returns {*} Result value.
   */
  const setLandingOffset = () => this.applyLandingOffset(audio);
  playWhenReady(audio, { beforePlay: setLandingOffset, onMetadata: setLandingOffset });
  this.bindUnlock();
}

/**
 * Returns landing base.
 * Used to provide landing base for audio playback.
 * @returns {*} Landing base.
 */
export function getLandingBase() {
  if (this.landingBase && this.landingBase.src === this.landingSrc) {
    return this.landingBase;
  }
  this.landingBase = this.createAudio(this.landingSrc);
  return this.landingBase;
}

/**
 * Clone landing audio.
 * Used to support audio playback.
 * @param {*} cachedLandingBase Cached landing base.
 * @returns {*} Result value.
 */
export function cloneLandingAudio(cachedLandingBase) {
  const audio = cachedLandingBase.cloneNode(true);
  audio.volume = this.landingVolume;
  audio.preload = "auto";
  audio.autoplay = false;
  return audio;
}

/**
 * Applies landing offset.
 * Used to apply audio settings.
 * @param {HTMLAudioElement} audio Audio element.
 */
export function applyLandingOffset(audio) {
  const landingEndSafetyMargin = 0.05;
  const duration = audio.duration;
  if (Number.isFinite(duration)) {
    const latestSafeStart = Math.max(0, duration - landingEndSafetyMargin);
    const clampedOffset = Math.min(Math.max(0, this.landingOffset), latestSafeStart);
    audio.currentTime = clampedOffset;
  } else {
    audio.currentTime = 0;
  }
}
