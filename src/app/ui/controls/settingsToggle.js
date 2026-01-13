export function togglePauseState({
  toggleId = "settings-toggle",
  getPaused,
  setPaused,
} = {}) {
  const toggle = document.getElementById(toggleId);
  const hasButton = !!toggle;

  if (hasButton) {
    toggle.addEventListener("click", () => {
      setPaused?.(!getPaused?.());
      toggle.blur();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat) return;
    event.preventDefault();
    setPaused?.(!getPaused?.());
  });

  setPaused?.(false);
}
