export function cloneOrRestart(cachedBaseAudioInstance, { volume } = {}) {
  if (!cachedBaseAudioInstance) return null;
  let audio = cachedBaseAudioInstance;
  if (!cachedBaseAudioInstance.paused && !cachedBaseAudioInstance.ended) {
    audio = cachedBaseAudioInstance.cloneNode(true);
    if (typeof volume === "number") audio.volume = volume;
    audio.preload = "auto";
    audio.autoplay = false;
  } else {
    cachedBaseAudioInstance.currentTime = 0;
  }
  return audio;
}

export function playWhenReady(audio, { beforePlay } = {}) {
  if (!audio) return;
  const start = () => {
    beforePlay?.();
    audio.play();
  };
  if (audio.readyState >= 2) { // readyState >= 2 => HAVE_CURRENT_DATA, can start immediately
    start();
  } else {
    audio.addEventListener("canplaythrough", start, { once: true });
    audio.addEventListener("loadeddata", start, { once: true });
    audio.load();
  }
}
