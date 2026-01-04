import { Input } from "./engine/input/input.class.js";
import { initGame } from "./core/game.class.js";

const audioRegistry = new Set();
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

function setupSoundToggle() {
  const toggle = document.getElementById("sound-toggle");
  const icon = document.getElementById("sound-icon");
  const label = document.getElementById("sound-label");
  if (!toggle || !icon || !label) return;

  const setMuted = (muted) => {
    window.__isMuted = muted;
    setAllAudioMuted(muted);
    toggle.setAttribute("aria-pressed", String(muted));
    toggle.setAttribute("aria-label", muted ? "Sound einschalten" : "Sound ausschalten");
    const src = muted
      ? "./assets/icons/sound-off-100.png"
      : "./assets/icons/sound-on-100.png";
    const alt = muted ? "Sound aus" : "Sound an";
    icon.src = src;
    icon.alt = alt;
    icon.dataset.currentSrc = src;
    icon.dataset.currentAlt = alt;
    label.textContent = muted ? "sound: on" : "sound: off";
  };

  toggle.addEventListener("click", () => setMuted(!window.__isMuted));
  toggle.addEventListener("mouseenter", () => {
    const hoverSrc =
      window.__isMuted === true
        ? "./assets/icons/sound-on-100.png"
        : "./assets/icons/sound-off-100.png";
    const hoverAlt = window.__isMuted === true ? "Sound an" : "Sound aus";
    icon.src = hoverSrc;
    icon.alt = hoverAlt;
  });
  toggle.addEventListener("mouseleave", () => {
    icon.src = icon.dataset.currentSrc || icon.src;
    icon.alt = icon.dataset.currentAlt || icon.alt;
  });
  setMuted(false);
}

window.input = new Input();
initGame();
setupSoundToggle();
