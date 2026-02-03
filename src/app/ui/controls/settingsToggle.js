const togglePause = ({ getPaused, setPaused }) => setPaused?.(!getPaused?.());

const bindToggleClick = ({ toggle, hasButton, getPaused, setPaused }) => {
  if (!hasButton) return;
  toggle.addEventListener("click", () => {
    togglePause({ getPaused, setPaused });
    toggle.blur();
  });
};

const bindEscapeKey = ({ getPaused, setPaused }) => {
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat) return;
    event.preventDefault();
    togglePause({ getPaused, setPaused });
  });
};

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
