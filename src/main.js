import { getPaused, initGame, setPaused } from "./core/game.class.js";
import { installAudioTracking } from "./app/audioTracking.js";

const audioTracking = installAudioTracking({ initiallyMuted: true });

function setupMenuToggle() {
  const toggle = document.getElementById("menu-toggle");
  const hasButton = !!toggle;

  const setMenuOpen = (open) => {
    setPaused(open);
    if (hasButton) {
      toggle.setAttribute("aria-pressed", String(open));
      toggle.setAttribute("aria-label", open ? "Menu schliessen" : "Menu oeffnen");
    }
  };

  if (hasButton) {
    toggle.addEventListener("click", () => setMenuOpen(!getPaused()));
  }

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat) return;
    event.preventDefault();
    setMenuOpen(!getPaused());
  });

  setMenuOpen(false);
}


function setupSoundToggle() {
  const toggle = document.getElementById("sound-toggle");
  const icon = document.getElementById("sound-icon");
  const label = document.getElementById("sound-label");
  if (!toggle || !icon || !label) return;

  const setMuted = (muted) => {
    audioTracking.setMuted(muted);
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

  toggle.addEventListener("click", () => setMuted(!audioTracking.getMuted()));
  toggle.addEventListener("mouseenter", () => {
    const hoverSrc = audioTracking.getMuted()
        ? "./assets/icons/sound-on-100.png"
        : "./assets/icons/sound-off-100.png";
    const hoverAlt = audioTracking.getMuted() ? "Sound an" : "Sound aus";
    icon.src = hoverSrc;
    icon.alt = hoverAlt;
  });
  toggle.addEventListener("mouseleave", () => {
    icon.src = icon.dataset.currentSrc || icon.src;
    icon.alt = icon.dataset.currentAlt || icon.alt;
  });
  setMuted(true);
}

initGame();
setupSoundToggle();
setupMenuToggle();
