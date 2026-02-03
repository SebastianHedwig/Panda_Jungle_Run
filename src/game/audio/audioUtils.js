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

export function createAudioElement(
  src,
  { loop = false, volume = 1, preload = "auto", autoplay = false, playbackRate } = {}
) {
  const audioElement = new Audio(src);
  audioElement.loop = loop;
  audioElement.volume = volume;
  audioElement.preload = preload;
  audioElement.autoplay = autoplay;
  if (typeof playbackRate === "number") audioElement.playbackRate = playbackRate;
  return audioElement;
}

function addMetadataListenerIfNeeded(audio, onMetadata) {
  if (typeof onMetadata !== "function") return;
  audio.addEventListener("loadedmetadata", onMetadata, { once: true });
}

function createStartAudioHandler(audio, beforePlay) {
  return () => {
    beforePlay?.();
    audio.play();
  };
}

function startAudioWhenReady(audio, startAudio) {
  if (audio.readyState >= 2) { // readyState >= 2 => HAVE_CURRENT_DATA, can start immediately
    startAudio();
    return;
  }
  audio.addEventListener("canplaythrough", startAudio, { once: true });
  audio.addEventListener("loadeddata", startAudio, { once: true });
  audio.load();
}

export function playWhenReady(audio, { beforePlay, onMetadata } = {}) {
  if (!audio) return;
  addMetadataListenerIfNeeded(audio, onMetadata);
  const startAudio = createStartAudioHandler(audio, beforePlay);
  startAudioWhenReady(audio, startAudio);
}
