/**
 * Clone or restart. If omitted, default values are used.
 * Uses cachedBaseAudioInstance, options to perform the operation.
 * @param {*} cachedBaseAudioInstance Cached base audio instance.
 * @param {Object} [options] Configuration options.
 * @param {number} [options.volume }] Volume.
 */
export function cloneOrRestart(cachedBaseAudioInstance, { volume } = {}) {
  if (!cachedBaseAudioInstance) return null;
  let audio = cachedBaseAudioInstance;
  if (!cachedBaseAudioInstance.paused && !cachedBaseAudioInstance.ended) {
    audio = cachedBaseAudioInstance.cloneNode(true);
    if (typeof volume === "number") audio.volume = volume;
    audio.preload = "auto";
    audio.autoplay = false;
  } else {
    cachedBaseAudioInstance.currentTime = 0;
  }
  return audio;
}

/**
 * Creates audio element. If omitted, default values are used.
 * Uses src, options to compute the result.
 * @param {string} src Source URL.
 * @param {Object} [options] Configuration options.
 * @param {boolean} [options.loop] Loop.
 * @param {number} [options.volume] Volume.
 * @param {*} [options.preload] Preload.
 * @param {*} [options.autoplay] Autoplay.
 * @param {number} [options.playbackRate }] Playback rate.
 */
export function createAudioElement(
  src,
  { loop = false, volume = 1, preload = "auto", autoplay = false, playbackRate } = {}
) {
  const audioElement = new Audio(src);
  audioElement.loop = loop;
  audioElement.volume = volume;
  audioElement.preload = preload;
  audioElement.autoplay = autoplay;
  if (typeof playbackRate === "number") audioElement.playbackRate = playbackRate;
  return audioElement;
}

/**
 * Adds metadata listener if needed.
 * Binds loadedmetadata event listeners.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {Function} onMetadata On metadata.
 */
function addMetadataListenerIfNeeded(audio, onMetadata) {
  if (typeof onMetadata !== "function") return;
  audio.addEventListener("loadedmetadata", onMetadata, { once: true });
}

/**
 * Creates start audio handler.
 * Triggers audio playback or updates audio state.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {*} beforePlay Before play.
 * @returns {*} Start audio handler.
 */
function createStartAudioHandler(audio, beforePlay) {
  return () => {
    beforePlay?.();
    audio.play();
  };
}

/**
 * Starts audio when ready.
 * Binds canplaythrough, loadeddata event listeners.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {Function} startAudio Start audio.
 */
function startAudioWhenReady(audio, startAudio) {
  if (audio.readyState >= 2) { // readyState >= 2 => HAVE_CURRENT_DATA, can start immediately
    startAudio();
    return;
  }
  audio.addEventListener("canplaythrough", startAudio, { once: true });
  audio.addEventListener("loadeddata", startAudio, { once: true });
  audio.load();
}

/**
 * Plays when ready. If omitted, default values are used.
 * Uses audio, options to perform the operation.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.beforePlay] Before play.
 * @param {Function} [options.onMetadata }] On metadata.
 */
export function playWhenReady(audio, { beforePlay, onMetadata } = {}) {
  if (!audio) return;
  addMetadataListenerIfNeeded(audio, onMetadata);
  const startAudio = createStartAudioHandler(audio, beforePlay);
  startAudioWhenReady(audio, startAudio);
}
