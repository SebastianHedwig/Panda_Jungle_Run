const resolveUnlockEvents = (options = {}) =>
  Array.isArray(options.events) ? options.events : ["pointerdown", "touchstart", "keydown"];

const restoreAudioState = (audio, prevMuted, prevVolume) => {
  audio.muted = prevMuted;
  audio.volume = prevVolume;
};

const resetAudio = (audio) => {
  audio.pause();
  audio.currentTime = 0;
};

const finalizePriming = (audio, prevMuted, prevVolume) => {
  resetAudio(audio);
  restoreAudioState(audio, prevMuted, prevVolume);
};

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

const createUnlock = ({ audioGetters, primeAudio, unbind, getUnlocked, setUnlocked }) => {
  return () => {
    if (getUnlocked()) return;
    setUnlocked(true);
    const audios = collectAudioCandidates(audioGetters);
    audios.forEach(primeAudio);
    unbind();
  };
};

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

const createUnbind = ({ events, handler, getBound, setBound }) => {
  return () => {
    if (!getBound()) return;
    events.forEach((event) => {
      window.removeEventListener(event, handler);
    });
    setBound(false);
  };
};

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

const createMobileAudioApi = ({ addAudios, bind, unlock, getUnlocked }) => ({
  addAudios,
  bind,
  unlock,
  isUnlocked: () => getUnlocked(),
});

const createMobileAudioHandlers = ({ events, audioGetters, getUnlocked, setUnlocked, getBound, setBound }) => {
  let unlock = () => {};
  const handler = () => unlock();
  const unbind = createUnbind({ events, handler, getBound, setBound });
  unlock = createUnlock({ audioGetters, primeAudio, unbind, getUnlocked, setUnlocked });
  const bind = createBind({ events, handler, getBound, getUnlocked, setBound });
  const addAudios = createAddAudios(audioGetters);
  return createMobileAudioApi({ addAudios, bind, unlock, getUnlocked });
};

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
