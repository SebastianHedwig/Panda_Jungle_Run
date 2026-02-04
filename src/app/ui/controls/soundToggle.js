/**
 * Returns sound elements.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {string} [options.toggleId] Toggle element id.
 * @param {string} [options.iconId] Icon element id.
 * @param {string} [options.labelId] Label element id.
 */
const getSoundElements = ({ toggleId, iconId, labelId }) => {
  const toggle = document.getElementById(toggleId);
  const icon = document.getElementById(iconId);
  const label = document.getElementById(labelId);
  if (!toggle || !icon || !label) return null;
  return { toggle, icon, label };
};

/**
 * Returns sound ui state.
 * Uses muted to compute the result.
 * @param {boolean} muted Muted.
 * @returns {*} Sound ui state.
 */
const getSoundUiState = (muted) => ({
  src: muted ? "./assets/icons/sound-off-100.png" : "./assets/icons/sound-on-100.png",
  alt: muted ? "Sound aus" : "Sound an",
  text: muted ? "sound: on" : "sound: off",
});

/**
 * Applies sound ui state.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {string} [options.label] Label.
 * @param {boolean} [options.muted] Muted.
 */
const applySoundUiState = ({ icon, label, muted }) => {
  const { src, alt, text } = getSoundUiState(muted);
  icon.src = src;
  icon.alt = alt;
  icon.dataset.currentSrc = src;
  icon.dataset.currentAlt = alt;
  label.textContent = text;
};

/**
 * Returns hover state.
 * Uses audioTracking to compute the result.
 * @param {*} audioTracking Audio tracking.
 * @returns {*} Hover state.
 */
const getHoverState = (audioTracking) => ({
  src: audioTracking.getMuted() ? "./assets/icons/sound-on-100.png" : "./assets/icons/sound-off-100.png",
  alt: audioTracking.getMuted() ? "Sound an" : "Sound aus",
});

/**
 * Applies hover state.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {*} [options.audioTracking] Audio tracking.
 */
const applyHoverState = ({ icon, audioTracking }) => {
  const { src, alt } = getHoverState(audioTracking);
  icon.src = src;
  icon.alt = alt;
};

/**
 * Restore icon state.
 * Uses icon to perform the operation.
 * @param {HTMLImageElement} icon Icon.
 */
const restoreIconState = (icon) => {
  icon.src = icon.dataset.currentSrc || icon.src;
  icon.alt = icon.dataset.currentAlt || icon.alt;
};

/**
 * Binds hover handlers.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.toggle] Toggle.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {*} [options.audioTracking] Audio tracking.
 */
const bindHoverHandlers = ({ toggle, icon, audioTracking }) => {
  toggle.addEventListener("mouseenter", () => applyHoverState({ icon, audioTracking }));
  toggle.addEventListener("mouseleave", () => restoreIconState(icon));
};

/**
 * Binds space block.
 * Binds keydown, keyup event listeners.
 * @param {HTMLElement} toggle Toggle.
 * @param {HTMLElement} blockSpaceToggle Block space toggle.
 */
const bindSpaceBlock = (toggle, blockSpaceToggle) => {
  toggle.addEventListener("keydown", blockSpaceToggle);
  toggle.addEventListener("keyup", blockSpaceToggle);
};

/**
 * Binds sound toggle click.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.toggle] Toggle.
 * @param {*} [options.audioTracking] Audio tracking.
 * @param {boolean} [options.setMuted] Set muted.
 */
const bindSoundToggleClick = ({ toggle, audioTracking, setMuted }) => {
  toggle.addEventListener("click", () => {
    setMuted(!audioTracking.getMuted());
    toggle.blur();
  });
};

/**
 * Creates muted setter.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.audioTracking] Audio tracking.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {string} [options.label] Label.
 * @returns {*} Muted setter.
 */
const createMutedSetter = ({ audioTracking, icon, label }) => (muted) => {
  audioTracking.setMuted(muted);
  applySoundUiState({ icon, label, muted });
};

/**
 * Creates block space toggle.
 * @returns {*} Block space toggle.
 */
const createBlockSpaceToggle = () => (event) => {
  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
};

/**
 * Binds sound toggle listeners.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.toggle] Toggle.
 * @param {*} [options.audioTracking] Audio tracking.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {boolean} [options.setMuted] Set muted.
 * @param {HTMLElement} [options.blockSpaceToggle] Block space toggle.
 */
const bindSoundToggleListeners = ({ toggle, audioTracking, icon, setMuted, blockSpaceToggle }) => {
  bindSoundToggleClick({ toggle, audioTracking, setMuted });
  bindSpaceBlock(toggle, blockSpaceToggle);
  bindHoverHandlers({ toggle, icon, audioTracking });
};

/**
 * Sets up sound toggle. If omitted, default values are used.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {*} [options.audioTracking] Audio tracking.
 * @param {boolean} [options.initialMuted] Initial muted.
 * @param {string} [options.toggleId] Toggle element id.
 * @param {string} [options.iconId] Icon element id.
 * @param {string} [options.labelId] Label element id.
 */
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
