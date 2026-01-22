import { MUSIC_VOLUME } from "../../config/config.js";

export function createWebAudioUnlock({ src, volume = MUSIC_VOLUME ?? 0.2 } = {}) {
  let audio = null;
  let unlockHandlers = [];

  const clearUnlockHandlers = () => {
    if (!unlockHandlers.length) return;
    unlockHandlers.forEach(({ event: eventName, handler }) => window.removeEventListener(eventName, handler));
    unlockHandlers = [];
  };

  const bindUnlock = (startPlayback) => {
    if (unlockHandlers.length) return;
    ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
      const handler = () => {
        startPlayback?.();
        window.removeEventListener(eventName, handler);
      };
      unlockHandlers.push({ event: eventName, handler });
      const listenerOptions = eventName === "touchstart" ? { once: true, passive: true } : { once: true };
      window.addEventListener(eventName, handler, listenerOptions);
    });
  };

  const tryPlay = () => {
    if (!audio) return Promise.reject();
    return audio
      .play()
      .then(() => {
        audio.muted = false;
        audio.volume = volume;
        clearUnlockHandlers();
        return true;
      })
      .catch(() => {
        audio.muted = false;
        audio.volume = volume;
        bindUnlock(() => audio.play().catch(() => {}));
        return false;
      });
  };

  const start = () => {
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0;
      audio.muted = true;
      audio.preload = "auto";
    }

    if (audio.readyState >= 2) {
      tryPlay();
    } else {
      const onReady = () => {
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("loadeddata", onReady);
        tryPlay();
      };
      audio.addEventListener("canplaythrough", onReady);
      audio.addEventListener("loadeddata", onReady);
      audio.load();
    }

    bindUnlock(() => audio.play().catch(() => {}));
    return audio;
  };

  const stop = () => {
    clearUnlockHandlers();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const getAudio = () => audio;

  return {
    start,
    stop,
    getAudio,
  };
}

export const startMusicController = createWebAudioUnlock({
  src: "./assets/music/jungle-menu.mp3",
});
