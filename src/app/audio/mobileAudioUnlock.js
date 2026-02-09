/**
 * Resolve unlock events. If omitted, default values are used.
 * Used to support audio playback.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @returns {*} Result value.
 */
const resolveUnlockEvents = (options = {}) =>
  Array.isArray(options.events) ? options.events : ["pointerdown", "touchstart", "keydown"];

/**
 * Restore audio state.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {boolean} prevMuted Prev muted.
 * @param {number} prevVolume Prev volume.
 */
const restoreAudioState = (audio, prevMuted, prevVolume) => {
  audio.muted = prevMuted;
  audio.volume = prevVolume;
};

/**
 * Resets audio.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {HTMLAudioElement} audio Audio element.
 */
const resetAudio = (audio) => {
  audio.pause();
  audio.currentTime = 0;
};

/**
 * Finalize priming.
 * Used to support audio playback.
 * Uses audio, prevMuted, prevVolume to perform the operation.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {boolean} prevMuted Prev muted.
 * @param {number} prevVolume Prev volume.
 */
const finalizePriming = (audio, prevMuted, prevVolume) => {
  resetAudio(audio);
  restoreAudioState(audio, prevMuted, prevVolume);
};

/**
 * Handles prime promise.
 * Used to centralize a specific behavior for audio playback.
 * Uses playPromise, audio, prevMuted, prevVolume to perform the operation.
 * @param {*} playPromise Play promise.
 * @param {HTMLAudioElement} audio Audio element.
 * @param {boolean} prevMuted Prev muted.
 * @param {number} prevVolume Prev volume.
 */
const handlePrimePromise = (playPromise, audio, prevMuted, prevVolume) => {
  if (!playPromise?.then) {
    finalizePriming(audio, prevMuted, prevVolume);
    return;
  }
  playPromise
    .then(() => resetAudio(audio))
    .catch(() => {})
    .finally(() => restoreAudioState(audio, prevMuted, prevVolume));
};

/**
 * Prime audio.
 * Used to support audio playback.
 * Triggers audio playback or updates audio state.
 * @param {HTMLAudioElement} audio Audio element.
 */
const primeAudio = (audio) => {
  if (!audio) return;
  const prevMuted = audio.muted;
  const prevVolume = audio.volume;
  try {
    audio.muted = true;
    audio.volume = 0;
    const playPromise = audio.play();
    handlePrimePromise(playPromise, audio, prevMuted, prevVolume);
  } catch (_) {
    restoreAudioState(audio, prevMuted, prevVolume);
  }
};

/**
 * Collect audio candidates.
 * Used to support audio playback.
 * Uses audioGetters to perform the operation.
 * @param {*} audioGetters Audio getters.
 * @returns {*} Result value.
 */
const collectAudioCandidates = (audioGetters) => {
  const audios = [];
  audioGetters.forEach((getter) => {
    try {
      const value = getter();
      if (Array.isArray(value)) audios.push(...value);
      else audios.push(value);
    } catch (_) {}
  });
  return audios;
};

/**
 * Creates unlock.
 * Used to set up required data for audio playback.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.audioGetters] Audio getters.
 * @param {*} [options.primeAudio] Prime audio.
 * @param {*} [options.unbind] Unbind.
 * @param {*} [options.getUnlocked] Get unlocked.
 * @param {*} [options.setUnlocked] Set unlocked.
 */
const createUnlock = ({ audioGetters, primeAudio, unbind, getUnlocked, setUnlocked }) => {
  return () => {
    if (getUnlocked()) return;
    setUnlocked(true);
    const audios = collectAudioCandidates(audioGetters);
    audios.forEach(primeAudio);
    unbind();
  };
};

/**
 * Creates bind.
 * Used to set up required data for audio playback.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.events] Events.
 * @param {Function} [options.handler] Handler.
 * @param {*} [options.getBound] Get bound.
 * @param {*} [options.getUnlocked] Get unlocked.
 * @param {*} [options.setBound] Set bound.
 */
const createBind = ({ events, handler, getBound, getUnlocked, setBound }) => {
  return () => {
    if (getBound() || getUnlocked()) return;
    setBound(true);
    events.forEach((event) => {
      const listenerOptions = event === "touchstart" ? { once: true, passive: true } : { once: true };
      window.addEventListener(event, handler, listenerOptions);
    });
  };
};

/**
 * Creates unbind.
 * Used to set up required data for audio playback.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.events] Events.
 * @param {Function} [options.handler] Handler.
 * @param {*} [options.getBound] Get bound.
 * @param {*} [options.setBound] Set bound.
 */
const createUnbind = ({ events, handler, getBound, setBound }) => {
  return () => {
    if (!getBound()) return;
    events.forEach((event) => {
      window.removeEventListener(event, handler);
    });
    setBound(false);
  };
};

/**
 * Creates add audios.
 * Used to set up required data for audio playback.
 * Uses audioGetters to compute the result.
 * @param {*} audioGetters Audio getters.
 * @returns {*} Add audios.
 */
const createAddAudios = (audioGetters) => {
  return (...items) => {
    items.flat().forEach((item) => {
      if (!item) return;
      if (typeof item === "function") {
        audioGetters.add(item);
      } else {
        audioGetters.add(() => item);
      }
    });
  };
};

/**
 * Creates mobile audio api.
 * Used to set up required data for audio playback.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.addAudios] Add audios.
 * @param {*} [options.bind] Bind.
 * @param {*} [options.unlock] Unlock.
 * @param {*} [options.getUnlocked] Get unlocked.
 * @returns {*} Mobile audio api.
 */
const createMobileAudioApi = ({ addAudios, bind, unlock, getUnlocked }) => ({
  addAudios,
  bind,
  unlock,
  isUnlocked: () => getUnlocked(),
});

/**
 * Creates mobile audio handlers.
 * Used to set up required data for audio playback.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.events] Events.
 * @param {*} [options.audioGetters] Audio getters.
 * @param {*} [options.getUnlocked] Get unlocked.
 * @param {*} [options.setUnlocked] Set unlocked.
 * @param {*} [options.getBound] Get bound.
 * @param {*} [options.setBound] Set bound.
 */
const createMobileAudioHandlers = ({ events, audioGetters, getUnlocked, setUnlocked, getBound, setBound }) => {
  /**
   * Unlock.
   */
  let unlock = () => {};
  /**
   * Handler.
   * Used to support audio playback.
   * @returns {*} Result value.
   */
  const handler = () => unlock();
  const unbind = createUnbind({ events, handler, getBound, setBound });
  unlock = createUnlock({ audioGetters, primeAudio, unbind, getUnlocked, setUnlocked });
  const bind = createBind({ events, handler, getBound, getUnlocked, setBound });
  const addAudios = createAddAudios(audioGetters);
  return createMobileAudioApi({ addAudios, bind, unlock, getUnlocked });
};

/**
 * Creates mobile audio unlock. If omitted, default values are used.
 * Used to set up required data for audio playback.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 */
export function createMobileAudioUnlock(options = {}) {
  const events = resolveUnlockEvents(options);
  const audioGetters = new Set();
  let unlocked = false;
  let bound = false;
  return createMobileAudioHandlers({
    events,
    audioGetters,
    getUnlocked: () => unlocked,
    setUnlocked: (next) => (unlocked = next),
    getBound: () => bound,
    setBound: (next) => (bound = next),
  });
}

export const mobileAudioUnlock = createMobileAudioUnlock();
