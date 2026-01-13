export function setupMenuToggle({
  toggleId = "menu-toggle",
  getPaused,
  setPaused,
} = {}) {
  const toggle = document.getElementById(toggleId);
  const hasButton = !!toggle;

  const setMenuOpen = (open) => {
    setPaused?.(open);
    if (hasButton) {
      toggle.setAttribute("aria-pressed", String(open));
      toggle.setAttribute("aria-label", open ? "Menu schliessen" : "Menu oeffnen");
    }
  };

  if (hasButton) {
    toggle.addEventListener("click", () => {
      setMenuOpen(!getPaused?.());
      toggle.blur();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat) return;
    event.preventDefault();
    setMenuOpen(!getPaused?.());
  });

  setMenuOpen(false);
}

