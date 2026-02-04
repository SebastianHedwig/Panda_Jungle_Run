import { MUSIC_VOLUME } from "../../config/config.js";

/**
 * Applies audio settings.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLAudioElement} [options.audio] Audio element.
 * @param {number} [options.volume] Volume.
 * @param {boolean} [options.getGlobalMuted] Get global muted.
 */
const applyAudioSettings = ({ audio, volume, getGlobalMuted }) => {
  audio.muted = getGlobalMuted();
  audio.volume = volume;
};

/**
 * Handles play success.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLAudioElement} [options.audio] Audio element.
 * @param {number} [options.volume] Volume.
 * @param {boolean} [options.getGlobalMuted] Get global muted.
 * @param {*} [options.clearUnlockHandlers] Clear unlock handlers.
 */
const handlePlaySuccess = ({ audio, volume, getGlobalMuted, clearUnlockHandlers }) => {
  applyAudioSettings({ audio, volume, getGlobalMuted });
  clearUnlockHandlers();
  return true;
};

/**
 * Handles play failure.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLAudioElement} [options.audio] Audio element.
 * @param {number} [options.volume] Volume.
 * @param {boolean} [options.getGlobalMuted] Get global muted.
 * @param {*} [options.bindUnlock] Bind unlock.
 */
const handlePlayFailure = ({ audio, volume, getGlobalMuted, bindUnlock }) => {
  applyAudioSettings({ audio, volume, getGlobalMuted });
  bindUnlock(() => audio.play());
  return false;
};

/**
 * Creates try play.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.getAudio] Get audio.
 * @param {number} [options.volume] Volume.
 * @param {boolean} [options.getGlobalMuted] Get global muted.
 * @param {*} [options.clearUnlockHandlers] Clear unlock handlers.
 * @param {*} [options.bindUnlock] Bind unlock.
 */
const createTryPlay = ({ getAudio, volume, getGlobalMuted, clearUnlockHandlers, bindUnlock }) => {
  return () => {
    const audio = getAudio();
    if (!audio) return Promise.reject();
    return audio
      .play()
      .then(() => handlePlaySuccess({ audio, volume, getGlobalMuted, clearUnlockHandlers }))
      .catch(() => handlePlayFailure({ audio, volume, getGlobalMuted, bindUnlock }));
  };
};

/**
 * Ensure audio initialized.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLAudioElement} [options.audio] Audio element.
 * @param {string} [options.src] Source URL.
 * @param {boolean} [options.getGlobalMuted] Get global muted.
 */
const ensureAudioInitialized = ({ audio, src, getGlobalMuted }) => {
  if (audio) return audio;
  const newAudio = new Audio(src);
  newAudio.loop = true;
  newAudio.volume = 0;
  newAudio.muted = getGlobalMuted();
  newAudio.preload = "auto";
  return newAudio;
};

/**
 * Starts playback when ready.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLAudioElement} [options.audio] Audio element.
 * @param {*} [options.tryPlay] Try play.
 */
const startPlaybackWhenReady = ({ audio, tryPlay }) => {
  if (audio.readyState >= 2) {
    tryPlay();
    return;
  }
  /**
   * On ready.
   */
  const onReady = () => {
    audio.removeEventListener("canplaythrough", onReady);
    audio.removeEventListener("loadeddata", onReady);
    tryPlay();
  };
  audio.addEventListener("canplaythrough", onReady);
  audio.addEventListener("loadeddata", onReady);
  audio.load();
};

/**
 * Adds unlock listeners.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.startPlayback] Start playback.
 */
const addUnlockListeners = ({ startPlayback }) => {
  const newUnlockHandlers = [];
  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    /**
     * Handler.
     */
    const handler = () => {
      startPlayback?.();
      window.removeEventListener(eventName, handler);
    };
    newUnlockHandlers.push({ event: eventName, handler });
    const listenerOptions = eventName === "touchstart" ? { once: true, passive: true } : { once: true };
    window.addEventListener(eventName, handler, listenerOptions);
  });
  return newUnlockHandlers;
};

/**
 * Creates clear unlock handlers.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.getUnlockHandlers] Get unlock handlers.
 * @param {*} [options.setUnlockHandlers] Set unlock handlers.
 */
const createClearUnlockHandlers = ({ getUnlockHandlers, setUnlockHandlers }) => {
  return () => {
    const unlockHandlers = getUnlockHandlers();
    if (!unlockHandlers.length) return;
    unlockHandlers.forEach(({ event: eventName, handler }) => window.removeEventListener(eventName, handler));
    setUnlockHandlers([]);
  };
};

/**
 * Creates bind unlock.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.getUnlockHandlers] Get unlock handlers.
 * @param {*} [options.setUnlockHandlers] Set unlock handlers.
 */
const createBindUnlock = ({ getUnlockHandlers, setUnlockHandlers }) => {
  return (startPlayback) => {
    const unlockHandlers = getUnlockHandlers();
    if (unlockHandlers.length) return;
    const newUnlockHandlers = addUnlockListeners({ startPlayback });
    setUnlockHandlers(newUnlockHandlers);
  };
};

/**
 * Creates start.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {string} [options.src] Source URL.
 * @param {*} [options.getAudio] Get audio.
 * @param {*} [options.setAudio] Set audio.
 * @param {boolean} [options.getGlobalMuted] Get global muted.
 * @param {*} [options.tryPlay] Try play.
 * @param {*} [options.bindUnlock] Bind unlock.
 */
const createStart = ({ src, getAudio, setAudio, getGlobalMuted, tryPlay, bindUnlock }) => {
  return () => {
    const audio = ensureAudioInitialized({ audio: getAudio(), src, getGlobalMuted });
    setAudio(audio);
    startPlaybackWhenReady({ audio, tryPlay });
    bindUnlock(() => audio.play());
    return audio;
  };
};

/**
 * Creates stop.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.getAudio] Get audio.
 * @param {*} [options.clearUnlockHandlers] Clear unlock handlers.
 */
const createStop = ({ getAudio, clearUnlockHandlers }) => {
  return () => {
    clearUnlockHandlers();
    const audio = getAudio();
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };
};

/**
 * Creates web audio api.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {string} [options.src] Source URL.
 * @param {number} [options.volume] Volume.
 * @param {boolean} [options.getGlobalMuted] Get global muted.
 * @param {*} [options.getAudio] Get audio.
 * @param {*} [options.setAudio] Set audio.
 * @param {*} [options.getUnlockHandlers] Get unlock handlers.
 * @param {*} [options.setUnlockHandlers] Set unlock handlers.
 */
const createWebAudioApi = ({ src, volume, getGlobalMuted, getAudio, setAudio, getUnlockHandlers, setUnlockHandlers }) => {
  const clearUnlockHandlers = createClearUnlockHandlers({ getUnlockHandlers, setUnlockHandlers });
  const bindUnlock = createBindUnlock({ getUnlockHandlers, setUnlockHandlers });
  const tryPlay = createTryPlay({ getAudio, volume, getGlobalMuted, clearUnlockHandlers, bindUnlock });
  const start = createStart({ src, getAudio, setAudio, getGlobalMuted, tryPlay, bindUnlock });
  const stop = createStop({ getAudio, clearUnlockHandlers });
  return { start, stop, getAudio: () => getAudio() };
};

/**
 * Creates web audio unlock. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.src] Source URL.
 * @param {number} [options.volume] Volume.
 */
export function createWebAudioUnlock({ src, volume = MUSIC_VOLUME }) {
  let audio = null;
  let unlockHandlers = [];
  /**
   * Returns global muted.
   * @returns {*} Global muted.
   */
  const getGlobalMuted = () => window?.__isMuted === true;
  return createWebAudioApi({
    src,
    volume,
    getGlobalMuted,
    getAudio: () => audio,
    setAudio: (nextAudio) => (audio = nextAudio),
    getUnlockHandlers: () => unlockHandlers,
    setUnlockHandlers: (nextUnlockHandlers) => (unlockHandlers = nextUnlockHandlers),
  });
}

export const startMusicController = createWebAudioUnlock({
  src: "./assets/music/jungle-menu.mp3",
});
