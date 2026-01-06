export function cloneOrRestart(base, { volume } = {}) {
  if (!base) return null;
  let audio = base;
  if (!base.paused && !base.ended) {
    audio = base.cloneNode(true);
    if (typeof volume === "number") audio.volume = volume;
    audio.preload = "auto";
    audio.autoplay = false;
  } else {
    base.currentTime = 0;
  }
  return audio;
}

export function playWhenReady(audio, { beforePlay } = {}) {
  if (!audio) return;
  const start = () => {
    try {
      beforePlay?.();
    } catch (_) {}
    audio.play().catch(() => {});
  };
  if (audio.readyState >= 2) start();
  else {
    audio.addEventListener("canplaythrough", start, { once: true });
    audio.addEventListener("loadeddata", start, { once: true });
  }
  audio.load();
}

