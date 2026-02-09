import { playWhenReady } from "../audioUtils.js";

/**
 * Plays one shot. If omitted, default values are used.
 * Used to support audio playback.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.propertyName] Property name.
 * @param {string} [options.src] Source URL.
 * @param {number} [options.audioStartOffset] Audio start offset.
 * @param {number} [options.rate] Rate.
 * @param {*} [options.forceClone] Force clone.
 */
export function playOneShot({ propertyName, src, audioStartOffset = 0, rate = 1, forceClone = false }) {
  const cachedAudioBaseInstance = this.ensureBase(propertyName, src);
  const audio = this.prepareOneShotAudio(cachedAudioBaseInstance, forceClone, rate);
  const setOffset = this.createOffsetSetter(audio, audioStartOffset);
  this.queueOneShotPlayback(audio, setOffset);
  this.bindUnlock();
  return audio;
}

/**
 * Prepares one shot audio.
 * Used to support audio playback.
 * @param {*} cachedAudioBaseInstance Cached audio base instance.
 * @param {*} forceClone Force clone.
 * @param {number} rate Rate.
 * @returns {*} Result value.
 */
export function prepareOneShotAudio(cachedAudioBaseInstance, forceClone, rate) {
  let audio = cachedAudioBaseInstance;
  if (forceClone || this.shouldCloneAudio(cachedAudioBaseInstance)) {
    audio = this.cloneAudioInstance(cachedAudioBaseInstance);
  } else {
    audio.currentTime = 0;
  }
  if (rate !== 1) audio.playbackRate = rate;
  return audio;
}

/**
 * Should clone audio.
 * Used to decide control flow.
 * Uses cachedAudioBaseInstance to perform the operation.
 * @param {*} cachedAudioBaseInstance Cached audio base instance.
 * @returns {boolean} Whether clone audio.
 */
export function shouldCloneAudio(cachedAudioBaseInstance) {
  return !cachedAudioBaseInstance.paused && !cachedAudioBaseInstance.ended;
}

/**
 * Clone audio instance.
 * Used to support audio playback.
 * @param {*} cachedAudioBaseInstance Cached audio base instance.
 * @returns {*} Result value.
 */
export function cloneAudioInstance(cachedAudioBaseInstance) {
  const audio = cachedAudioBaseInstance.cloneNode(true);
  audio.volume = this.volume;
  audio.preload = "auto";
  audio.autoplay = false;
  return audio;
}

/**
 * Creates offset setter.
 * Used to set up required data for audio playback.
 * Uses audio, audioStartOffset to compute the result.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {number} audioStartOffset Audio start offset.
 * @returns {*} Offset setter.
 */
export function createOffsetSetter(audio, audioStartOffset) {
  return () => {
    if (
      audioStartOffset > 0 &&
      Number.isFinite(audio.duration) &&
      audio.duration > audioStartOffset
    ) {
      audio.currentTime = audioStartOffset;
    }
  };
}

/**
 * Queues one shot playback.
 * Used to support audio playback.
 * Uses audio, setOffset to perform the operation.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {number} setOffset Set offset.
 */
export function queueOneShotPlayback(audio, setOffset) {
  playWhenReady(audio, {
    beforePlay: setOffset,
    onMetadata: setOffset,
  });
}
