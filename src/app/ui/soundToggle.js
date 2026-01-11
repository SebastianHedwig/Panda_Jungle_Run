export function setupSoundToggle({
  audioTracking,
  initialMuted = false,
  toggleId = "sound-toggle",
  iconId = "sound-icon",
  labelId = "sound-label",
} = {}) {
  const toggle = document.getElementById(toggleId);
  const icon = document.getElementById(iconId);
  const label = document.getElementById(labelId);
  if (!toggle || !icon || !label || !audioTracking) return;

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

  setMuted(initialMuted);
}

