/**
 * Separator.
 * Uses url to perform the operation.
 * @param {string} url URL to process.
 * @returns {*} Result value.
 */
const separator = (url) => (url.includes("?") ? "&" : "?");

/**
 * Removes cache bust from the URL.
 * Uses url to perform the operation.
 * @param {string} url URL to process.
 * @returns {*} Result value.
 */
const removeCacheBust = (url) =>
  url.replace(/([?&])cb=[^&#]*(&)?/, (match, prefix, suffix) => (suffix ? prefix : ""));

/**
 * Creates cache bust url.
 * Uses url to compute the result.
 * @param {string} url URL to process.
 * @returns {string} Cache bust url.
 */
const createCacheBustUrl = (url) => `${url}${separator(url)}cb=${Date.now()}`;

/**
 * Returns a URL with a `cb=<timestamp>` query param to defeat stale caches
 * (preventing cache-related load errors like `net::ERR_CACHE_OPERATION_NOT_SUPPORTED`).
 * If `force` is false, an existing `cb` stays untouched; if true, it is replaced.
 * @param {string} url Original audio URL.
 * @param {{force?: boolean}} [options] When `force` is true, always set a fresh cb.
 * @returns {string} URL with cache-buster applied (or original when not applicable).
 */
  const addCacheBust = (url, { force = false } = {}) => {
  if (!url) return url;
  const hasCacheBust = url.includes("cb=");
  if (hasCacheBust && !force) return url;
  const withoutCacheBust = hasCacheBust ? removeCacheBust(url) : url;
  return createCacheBustUrl(withoutCacheBust);
};

/**
 * Creates cache bust error handler.
 * Uses audio to compute the result.
 * @param {HTMLAudioElement} audio Audio element.
 * @returns {*} Cache bust error handler.
 */
const createCacheBustErrorHandler = (audio) => {
  let hasRetriedOnce = false;
  return () => {
    if (hasRetriedOnce) return;
    hasRetriedOnce = true;
    const originalSrc = audio.currentSrc || audio.src;
    if (!originalSrc) return;
    audio.src = addCacheBust(originalSrc, { force: true });
    audio.load();
  };
};

/**
 * Adds a one-time retry for an Audio element: on the first load error it appends
 * a timestamp cache-buster to the src and reloads, to sidestep stale/blocked caches
 * (z. B. `net::ERR_CACHE_OPERATION_NOT_SUPPORTED`).
 * @param {HTMLAudioElement} audio Audio element to monitor for load errors.
 */
const attachCacheBustOnError = (audio) => {
  if (!audio) return;
  const errorHandler = createCacheBustErrorHandler(audio);
  audio.addEventListener("error", errorHandler, { passive: true });
};

/**
 * Creates audio registry.
 * Uses initiallyMuted to compute the result.
 * @param {boolean} initiallyMuted Initially muted.
 * @returns {*} Audio registry.
 */
const createAudioRegistry = (initiallyMuted) => {
  const audioRegistry = new Set();
  window.__isMuted = initiallyMuted;
  return audioRegistry;
};

/**
 * Returns audio constructor info.
 * Triggers audio playback or updates audio state.
 * @returns {Object} Audio constructor info.
 */
const getAudioConstructorInfo = () => {
  const OriginalAudio = window.Audio;
  const originalCloneNode = OriginalAudio.prototype.cloneNode;
  return { OriginalAudio, originalCloneNode };
};

/**
 * Creates tracked audio factory.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {typeof Audio} [options.OriginalAudio] Original audio.
 * @param {*} [options.audioRegistry] Audio registry.
 * @param {Function} [options.addCacheBust] Add cache bust.
 * @param {Function} [options.attachCacheBustOnError] Attach cache bust on error.
 */
const createTrackedAudioFactory = ({ OriginalAudio, audioRegistry, addCacheBust, attachCacheBustOnError }) => {
  /**
   * Creates tracked audio.
   * Triggers audio playback or updates audio state.
   * @param {...*} args Args.
   * @returns {*} Tracked audio.
   */
  function createTrackedAudio(...args) {
    const audio = new OriginalAudio(...args);
    if (audio.src) audio.src = addCacheBust(audio.src);
    audioRegistry.add(audio);
    if (window.__isMuted === true) audio.muted = true;
    attachCacheBustOnError(audio);
    return audio;
  }
  createTrackedAudio.prototype = OriginalAudio.prototype;
  Object.setPrototypeOf(createTrackedAudio, OriginalAudio);
  return createTrackedAudio;
};

/**
 * Installs clone node override.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {typeof Audio} [options.OriginalAudio] Original audio.
 * @param {Function} [options.originalCloneNode] Original clone node.
 * @param {*} [options.audioRegistry] Audio registry.
 * @param {Function} [options.addCacheBust] Add cache bust.
 * @param {Function} [options.attachCacheBustOnError] Attach cache bust on error.
 */
const installCloneNodeOverride = ({ OriginalAudio, originalCloneNode, audioRegistry, addCacheBust, attachCacheBustOnError }) => {
  if (!originalCloneNode) return;
  OriginalAudio.prototype.cloneNode = function (...args) {
    const clone = originalCloneNode.apply(this, args);
    if (clone.src) clone.src = addCacheBust(clone.src);
    audioRegistry.add(clone);
    if (window.__isMuted === true) clone.muted = true;
    attachCacheBustOnError(clone);
    return clone;
  };
};

/**
 * Installs audio overrides.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {typeof Audio} [options.OriginalAudio] Original audio.
 * @param {Function} [options.originalCloneNode] Original clone node.
 * @param {Function} [options.createTrackedAudio] Create tracked audio.
 * @param {*} [options.audioRegistry] Audio registry.
 */
const installAudioOverrides = ({ OriginalAudio, originalCloneNode, createTrackedAudio, audioRegistry }) => {
  window.Audio = createTrackedAudio;
  installCloneNodeOverride({ OriginalAudio, originalCloneNode, audioRegistry, addCacheBust, attachCacheBustOnError });
};

/**
 * Creates set all audio muted.
 * Triggers audio playback or updates audio state.
 * @param {*} audioRegistry Audio registry.
 * @returns {*} Set all audio muted.
 */
const createSetAllAudioMuted = (audioRegistry) => {
  return (muted) => {
    audioRegistry.forEach((audio) => {
      if (!audio) return;
      audio.muted = muted;
    });
  };
};

/**
 * Creates audio tracking api.
 * Uses setAllAudioMuted to compute the result.
 * @param {boolean} setAllAudioMuted Set all audio muted.
 * @returns {*} Audio tracking api.
 */
const createAudioTrackingApi = (setAllAudioMuted) => ({
  setAllAudioMuted,
  /**
   * Sets muted.
   * Uses muted to perform the operation.
   * @param {boolean} muted Muted.
   */
  setMuted(muted) {
    window.__isMuted = muted;
    setAllAudioMuted(muted);
  },
  /**
   * Returns muted.
   * @returns {*} Muted.
   */
  getMuted() {
    return window.__isMuted === true;
  },
});

/**
 * Installs audio tracking. If omitted, default values are used.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {boolean} [options.initiallyMuted] Initially muted.
 */
export function installAudioTracking({ initiallyMuted = true }) {
  const audioRegistry = createAudioRegistry(initiallyMuted);
  const { OriginalAudio, originalCloneNode } = getAudioConstructorInfo();
  const createTrackedAudio = createTrackedAudioFactory({ OriginalAudio, audioRegistry, addCacheBust, attachCacheBustOnError });
  installAudioOverrides({ OriginalAudio, originalCloneNode, createTrackedAudio, audioRegistry });
  const setAllAudioMuted = createSetAllAudioMuted(audioRegistry);
  return createAudioTrackingApi(setAllAudioMuted);
}
