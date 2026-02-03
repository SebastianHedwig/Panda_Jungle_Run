import { MUSIC_VOLUME } from "../../config/config.js";

const applyAudioSettings = ({ audio, volume, getGlobalMuted }) => {
  audio.muted = getGlobalMuted();
  audio.volume = volume;
};

const handlePlaySuccess = ({ audio, volume, getGlobalMuted, clearUnlockHandlers }) => {
  applyAudioSettings({ audio, volume, getGlobalMuted });
  clearUnlockHandlers();
  return true;
};

const handlePlayFailure = ({ audio, volume, getGlobalMuted, bindUnlock }) => {
  applyAudioSettings({ audio, volume, getGlobalMuted });
  bindUnlock(() => audio.play());
  return false;
};

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

const ensureAudioInitialized = ({ audio, src, getGlobalMuted }) => {
  if (audio) return audio;
  const newAudio = new Audio(src);
  newAudio.loop = true;
  newAudio.volume = 0;
  newAudio.muted = getGlobalMuted();
  newAudio.preload = "auto";
  return newAudio;
};

const startPlaybackWhenReady = ({ audio, tryPlay }) => {
  if (audio.readyState >= 2) {
    tryPlay();
    return;
  }
  const onReady = () => {
    audio.removeEventListener("canplaythrough", onReady);
    audio.removeEventListener("loadeddata", onReady);
    tryPlay();
  };
  audio.addEventListener("canplaythrough", onReady);
  audio.addEventListener("loadeddata", onReady);
  audio.load();
};

const addUnlockListeners = ({ startPlayback }) => {
  const newUnlockHandlers = [];
  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
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

const createClearUnlockHandlers = ({ getUnlockHandlers, setUnlockHandlers }) => {
  return () => {
    const unlockHandlers = getUnlockHandlers();
    if (!unlockHandlers.length) return;
    unlockHandlers.forEach(({ event: eventName, handler }) => window.removeEventListener(eventName, handler));
    setUnlockHandlers([]);
  };
};

const createBindUnlock = ({ getUnlockHandlers, setUnlockHandlers }) => {
  return (startPlayback) => {
    const unlockHandlers = getUnlockHandlers();
    if (unlockHandlers.length) return;
    const newUnlockHandlers = addUnlockListeners({ startPlayback });
    setUnlockHandlers(newUnlockHandlers);
  };
};

const createStart = ({ src, getAudio, setAudio, getGlobalMuted, tryPlay, bindUnlock }) => {
  return () => {
    const audio = ensureAudioInitialized({ audio: getAudio(), src, getGlobalMuted });
    setAudio(audio);
    startPlaybackWhenReady({ audio, tryPlay });
    bindUnlock(() => audio.play());
    return audio;
  };
};

const createStop = ({ getAudio, clearUnlockHandlers }) => {
  return () => {
    clearUnlockHandlers();
    const audio = getAudio();
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };
};

const createWebAudioApi = ({ src, volume, getGlobalMuted, getAudio, setAudio, getUnlockHandlers, setUnlockHandlers }) => {
  const clearUnlockHandlers = createClearUnlockHandlers({ getUnlockHandlers, setUnlockHandlers });
  const bindUnlock = createBindUnlock({ getUnlockHandlers, setUnlockHandlers });
  const tryPlay = createTryPlay({ getAudio, volume, getGlobalMuted, clearUnlockHandlers, bindUnlock });
  const start = createStart({ src, getAudio, setAudio, getGlobalMuted, tryPlay, bindUnlock });
  const stop = createStop({ getAudio, clearUnlockHandlers });
  return { start, stop, getAudio: () => getAudio() };
};

export function createWebAudioUnlock({ src, volume = MUSIC_VOLUME }) {
  let audio = null;
  let unlockHandlers = [];
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
