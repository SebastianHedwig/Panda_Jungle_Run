import { SFX_VOLUME } from "../../config/config.js";
import { mobileAudioUnlock } from "../../app/audio/mobileAudioUnlock.js";
import { createAudioElement, playWhenReady } from "./audioUtils.js";

export class BulletAudio {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Used to set up required data for audio playback.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   * @param {string} [options.impactSrc] Impact src.
   * @param {number} [options.impactDurationMs] Impact duration ms.
   * @param {*} [options.fadeOutMs] Fade out ms.
   * @param {number} [options.volume] Volume.
   * @param {*} [options.}] Value.
   */
  constructor({
    impactSrc = "./assets/sfx/weapon/weapon-impact.mp3",
    impactDurationMs = 900,
    fadeOutMs = 200,
    volume = SFX_VOLUME,
  } = {}) {
    this.impactSrc = impactSrc;
    this.impactDurationMs = impactDurationMs;
    this.fadeOutMs = fadeOutMs;
    this.volume = volume;
    this.impactPoolSize = 2;
    this.impactPool = null;
    this.impactRoundPointer = 0;

    mobileAudioUnlock.addAudios(() => this.getWarmupAudios());
    mobileAudioUnlock.bind();
  }

  /**
   * Creates audio.
   * Used to set up required data for audio playback.
   * @param {string} src Source URL.
   * @returns {*} Audio.
   */
  createAudio(src) {
    return createAudioElement(src, { volume: this.volume });
  }

  /**
   * Ensure impact pool.
   * Used to support audio playback.
   * @returns {*} Result value.
   */
  ensureImpactPool() {
    if (!this.impactPool) {
      this.impactPool = Array.from({ length: this.impactPoolSize }, () =>
        this.createAudio(this.impactSrc)
      );
      this.impactRoundPointer = 0;
    }
    return this.impactPool;
  }

  /**
   * Next impact audio.
   * Used to support audio playback.
   * @returns {*} Result value.
   */
  nextImpactAudio() { // Round-Robin selection from impactPool
    const pool = this.ensureImpactPool();
    const audio = pool[this.impactRoundPointer];
    this.impactRoundPointer =
      (this.impactRoundPointer + 1) % pool.length;
    audio.volume = this.volume;
    audio.currentTime = 0;
    return audio;
  }

  /**
   * Plays impact.
   */
  playImpact() {
    const audio = this.nextImpactAudio();
    const fadeConfig = this.getImpactFadeConfig();
    /**
     * Stops and reset impact.
     * Used to support audio playback.
     * @returns {*} Result value.
     */
    const stopAndResetImpact = () => this.stopAndResetImpactAudio(audio);
    /**
     * Starts impact.
     * Used to support audio playback.
     * @returns {*} Result value.
     */
    const startImpact = () => this.scheduleImpactTimers(audio, stopAndResetImpact, fadeConfig);
    playWhenReady(audio, { beforePlay: startImpact });
  }

  /**
   * Stops and reset impact audio.
   * Used to support audio playback.
   * Triggers audio playback or updates audio state.
   * @param {HTMLAudioElement} audio Audio element.
   */
  stopAndResetImpactAudio(audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = this.volume;
  }

  /**
   * Returns impact fade config.
   * Used to provide impact fade config for audio playback.
   * @returns {Object} Impact fade config.
   */
  getImpactFadeConfig() {
    const impactTotalMs = this.impactDurationMs;
    const fadeOutDurationMs = Math.max(0, Math.min(this.fadeOutMs, impactTotalMs));
    const fadeStartMs = Math.max(0, impactTotalMs - fadeOutDurationMs);
    return { impactTotalMs, fadeOutDurationMs, fadeStartMs };
  }

  /**
   * Schedules impact timers.
   * Used to support audio playback.
   * Schedules timed actions.
   * @param {HTMLAudioElement} audio Audio element.
   * @param {*} stopAndResetImpact Stop and reset impact.
   * @param {*} fadeConfig Fade config.
   */
  scheduleImpactTimers(audio, stopAndResetImpact, fadeConfig) {
    let fadeIntervalId = null;
    /**
     * Starts fade.
     */
    const startFade = () => {
      fadeIntervalId = this.startFadeOut(audio, fadeConfig.fadeOutDurationMs);
    };
    setTimeout(startFade, fadeConfig.fadeStartMs);
    setTimeout(
      () => this.finishImpact(fadeIntervalId, stopAndResetImpact),
      fadeConfig.impactTotalMs
    );
  }

  /**
   * Starts fade out.
   * Used to support audio playback.
   * Schedules timed actions.
   * Clears pending timers.
   * @param {HTMLAudioElement} audio Audio element.
   * @param {number} fadeOutDurationMs Fade out duration ms.
   * @returns {*} Result value.
   */
  startFadeOut(audio, fadeOutDurationMs) {
    if (fadeOutDurationMs <= 0) return null;
    const loudnessStepMs = 50;
    let elapsedMs = 0;
    const fadeIntervalId = setInterval(() => {
      elapsedMs += loudnessStepMs;
      const fadeProgress = Math.min(elapsedMs / fadeOutDurationMs, 1); // 0..1 volume blend
      audio.volume = this.volume * (1 - fadeProgress);
      if (fadeProgress >= 1) clearInterval(fadeIntervalId);
    }, loudnessStepMs);
    return fadeIntervalId;
  }

  /**
   * Finish impact.
   * Used to support audio playback.
   * Clears pending timers.
   * @param {string} fadeIntervalId Fade interval element id.
   * @param {Function} stopAndResetImpact Stop and reset impact.
   */
  finishImpact(fadeIntervalId, stopAndResetImpact) {
    if (fadeIntervalId) clearInterval(fadeIntervalId);
    stopAndResetImpact();
  }

  /**
   * Returns warmup audios.
   * Used to provide warmup audios for audio playback.
   * @returns {*} Warmup audios.
   */
  getWarmupAudios() {
    return this.ensureImpactPool()[0];
  }
}
