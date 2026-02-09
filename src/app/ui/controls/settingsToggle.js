/**
 * Toggles pause.
 * Used to support gameplay flow.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {boolean} [options.getPaused] Get paused.
 * @param {boolean} [options.setPaused] Set paused.
 * @returns {*} Result value.
 */
const togglePause = ({ getPaused, setPaused }) => setPaused?.(!getPaused?.());

/**
 * Binds toggle click.
 * Used to support UI interaction handling.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.toggle] Toggle.
 * @param {boolean} [options.hasButton] Whether button.
 * @param {boolean} [options.getPaused] Get paused.
 * @param {boolean} [options.setPaused] Set paused.
 */
const bindToggleClick = ({ toggle, hasButton, getPaused, setPaused }) => {
  if (!hasButton) return;
  toggle.addEventListener("click", () => {
    togglePause({ getPaused, setPaused });
    toggle.blur();
  });
};

/**
 * Binds escape key.
 * Used to support gameplay flow.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {boolean} [options.getPaused] Get paused.
 * @param {boolean} [options.setPaused] Set paused.
 */
const bindEscapeKey = ({ getPaused, setPaused }) => {
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat) return;
    event.preventDefault();
    togglePause({ getPaused, setPaused });
  });
};

/**
 * Toggles pause state. If omitted, default values are used.
 * Used to support gameplay flow.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.toggleId] Toggle element id.
 * @param {boolean} [options.getPaused] Get paused.
 * @param {boolean} [options.setPaused] Set paused.
 * @param {*} [options.}] Value.
 */
export function togglePauseState({
  toggleId = "settings-toggle",
  getPaused,
  setPaused,
} = {}) {
  const toggle = document.getElementById(toggleId);
  const hasButton = !!toggle;
  bindToggleClick({ toggle, hasButton, getPaused, setPaused });
  bindEscapeKey({ getPaused, setPaused });
  setPaused?.(false);
}
