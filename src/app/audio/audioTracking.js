export function installAudioTracking({ initiallyMuted = true } = {}) {
  const audioRegistry = new Set();
  window.__isMuted = initiallyMuted;

  const OriginalAudio = window.Audio;
  const originalCloneNode = OriginalAudio.prototype.cloneNode;

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
        const cacheBustQuery = `${originalSrc.includes("?") ? "&" : "?"}cb=${Date.now()}`;
        audio.src = `${originalSrc}${cacheBustQuery}`;
        audio.load();
      },
      { passive: true }
    );
  };

  function createTrackedAudio(...args) {
    const audio = new OriginalAudio(...args);
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
