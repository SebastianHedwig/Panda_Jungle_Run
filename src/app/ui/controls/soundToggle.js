const getSoundElements = ({ toggleId, iconId, labelId }) => {
  const toggle = document.getElementById(toggleId);
  const icon = document.getElementById(iconId);
  const label = document.getElementById(labelId);
  if (!toggle || !icon || !label) return null;
  return { toggle, icon, label };
};

const getSoundUiState = (muted) => ({
  src: muted ? "./assets/icons/sound-off-100.png" : "./assets/icons/sound-on-100.png",
  alt: muted ? "Sound aus" : "Sound an",
  text: muted ? "sound: on" : "sound: off",
});

const applySoundUiState = ({ icon, label, muted }) => {
  const { src, alt, text } = getSoundUiState(muted);
  icon.src = src;
  icon.alt = alt;
  icon.dataset.currentSrc = src;
  icon.dataset.currentAlt = alt;
  label.textContent = text;
};

const getHoverState = (audioTracking) => ({
  src: audioTracking.getMuted() ? "./assets/icons/sound-on-100.png" : "./assets/icons/sound-off-100.png",
  alt: audioTracking.getMuted() ? "Sound an" : "Sound aus",
});

const applyHoverState = ({ icon, audioTracking }) => {
  const { src, alt } = getHoverState(audioTracking);
  icon.src = src;
  icon.alt = alt;
};

const restoreIconState = (icon) => {
  icon.src = icon.dataset.currentSrc || icon.src;
  icon.alt = icon.dataset.currentAlt || icon.alt;
};

const bindHoverHandlers = ({ toggle, icon, audioTracking }) => {
  toggle.addEventListener("mouseenter", () => applyHoverState({ icon, audioTracking }));
  toggle.addEventListener("mouseleave", () => restoreIconState(icon));
};

const bindSpaceBlock = (toggle, blockSpaceToggle) => {
  toggle.addEventListener("keydown", blockSpaceToggle);
  toggle.addEventListener("keyup", blockSpaceToggle);
};

const bindSoundToggleClick = ({ toggle, audioTracking, setMuted }) => {
  toggle.addEventListener("click", () => {
    setMuted(!audioTracking.getMuted());
    toggle.blur();
  });
};

const createMutedSetter = ({ audioTracking, icon, label }) => (muted) => {
  audioTracking.setMuted(muted);
  applySoundUiState({ icon, label, muted });
};

const createBlockSpaceToggle = () => (event) => {
  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
};

const bindSoundToggleListeners = ({ toggle, audioTracking, icon, setMuted, blockSpaceToggle }) => {
  bindSoundToggleClick({ toggle, audioTracking, setMuted });
  bindSpaceBlock(toggle, blockSpaceToggle);
  bindHoverHandlers({ toggle, icon, audioTracking });
};

export function setupSoundToggle({
  audioTracking,
  initialMuted = false,
  toggleId = "sound-toggle",
  iconId = "sound-icon",
  labelId = "sound-label",
}) {
  const elements = getSoundElements({ toggleId, iconId, labelId });
  if (!elements || !audioTracking) return;
  const { toggle, icon, label } = elements;
  const setMuted = createMutedSetter({ audioTracking, icon, label });
  const blockSpaceToggle = createBlockSpaceToggle();
  bindSoundToggleListeners({ toggle, audioTracking, icon, setMuted, blockSpaceToggle });
  setMuted(initialMuted);
}
