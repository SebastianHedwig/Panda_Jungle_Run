export function installAudioTracking({ initiallyMuted = true } = {}) {
  const audioRegistry = new Set();
  window.__isMuted = initiallyMuted;

  const OriginalAudio = window.Audio;
  const originalCloneNode = OriginalAudio.prototype.cloneNode;

  function createTrackedAudio(...args) {
    const audio = new OriginalAudio(...args);
    audioRegistry.add(audio);
    if (window.__isMuted === true) audio.muted = true;
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

