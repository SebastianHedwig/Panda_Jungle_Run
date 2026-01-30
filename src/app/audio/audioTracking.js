export function installAudioTracking({ initiallyMuted = true } = {}) {
  const audioRegistry = new Set();
  window.__isMuted = initiallyMuted;

  const OriginalAudio = window.Audio;
  const originalCloneNode = OriginalAudio.prototype.cloneNode;

  const separator = (url) => (url.includes("?") ? "&" : "?");

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
    const withoutCacheBust = hasCacheBust
      ? url.replace(/([?&])cb=[^&#]*(&)?/, (match, prefix, suffix) => (suffix ? prefix : ""))
      : url;
    return `${withoutCacheBust}${separator(withoutCacheBust)}cb=${Date.now()}`;
  };

  /**
   * Adds a one-time retry for an Audio element: on the first load error it appends
   * a timestamp cache-buster to the src and reloads, to sidestep stale/blocked caches
   * (z. B. `net::ERR_CACHE_OPERATION_NOT_SUPPORTED`).
   * @param {HTMLAudioElement} audio Audio element to monitor for load errors.
   */
  const attachCacheBustOnError = (audio) => {
    if (!audio) return;
    let hasRetriedOnce = false;
    audio.addEventListener(
      "error",
      () => {
        if (hasRetriedOnce) return;
        hasRetriedOnce = true;
        const originalSrc = audio.currentSrc || audio.src;
        if (!originalSrc) return;
        audio.src = addCacheBust(originalSrc, { force: true });
        audio.load();
      },
      { passive: true }
    );
  };

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
  window.Audio = createTrackedAudio;

  if (originalCloneNode) {
    OriginalAudio.prototype.cloneNode = function (...args) {
      const clone = originalCloneNode.apply(this, args);
      if (clone.src) clone.src = addCacheBust(clone.src);
      audioRegistry.add(clone);
      if (window.__isMuted === true) clone.muted = true;
      attachCacheBustOnError(clone);
      return clone;
    };
  }

  function setAllAudioMuted(muted) {
    audioRegistry.forEach((audio) => {
      if (!audio) return;
      audio.muted = muted;
    });
  }

  return {
    setAllAudioMuted,
    setMuted(muted) {
      window.__isMuted = muted;
      setAllAudioMuted(muted);
    },
    getMuted() {
      return window.__isMuted === true;
    },
  };
}
