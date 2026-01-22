
export function createMobileAudioUnlock(options = {}) {
  const events = Array.isArray(options.events)
    ? options.events
    : ["pointerdown", "touchstart", "keydown"];
  const audioGetters = new Set();
  let unlocked = false;
  let bound = false;

  const primeAudio = (audio) => {
    if (!audio) return;
    const prevMuted = audio.muted;
    const prevVolume = audio.volume;
    try {
      audio.muted = true;
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise?.then) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {})
          .finally(() => {
            audio.muted = prevMuted;
            audio.volume = prevVolume;
          });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = prevMuted;
        audio.volume = prevVolume;
      }
    } catch (_) {
      audio.muted = prevMuted;
      audio.volume = prevVolume;
    }
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const audios = [];
    audioGetters.forEach((getter) => {
      try {
        const value = getter();
        if (Array.isArray(value)) audios.push(...value);
        else audios.push(value);
      } catch (_) {}
    });
    audios.forEach(primeAudio);
    unbind();
  };

  const handler = () => unlock();

  const bind = () => {
    if (bound || unlocked) return;
    bound = true;
    events.forEach((event) => {
      const listenerOptions =
        event === "touchstart" ? { once: true, passive: true } : { once: true };
      window.addEventListener(event, handler, listenerOptions);
    });
  };

  const unbind = () => {
    if (!bound) return;
    events.forEach((event) => {
      window.removeEventListener(event, handler);
    });
    bound = false;
  };

  const addAudios = (...items) => {
    items.flat().forEach((item) => {
      if (!item) return;
      if (typeof item === "function") {
        audioGetters.add(item);
      } else {
        audioGetters.add(() => item);
      }
    });
  };

  return {
    addAudios,
    bind,
    unlock,
    isUnlocked: () => unlocked,
  };
}

export const mobileAudioUnlock = createMobileAudioUnlock();
