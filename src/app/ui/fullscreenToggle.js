export function setupFullscreenToggle({
  containerId = "game-container",
  toggleId = "fullscreen-toggle",
  iconId = "fullscreen-icon",
  labelId = "fullscreen-label",
} = {}) {
  const toggle = document.getElementById(toggleId);
  const icon = document.getElementById(iconId);
  const label = document.getElementById(labelId);
  const gameContainer = document.getElementById(containerId);
  if (!toggle || !icon || !label || !gameContainer) return;

  const updateUi = (isFullscreen) => {
    const src = isFullscreen
      ? "./assets/icons/fullscreen-off.png"
      : "./assets/icons/fullscreen-on.png";
    const alt = isFullscreen ? "Fullscreen schliessen" : "Fullscreen starten";
    const text = isFullscreen ? "close fullscreen" : "fullscreen";

    toggle.setAttribute("aria-pressed", String(isFullscreen));
    toggle.setAttribute(
      "aria-label",
      isFullscreen ? "Fullscreen schliessen" : "Fullscreen starten"
    );
    icon.src = src;
    icon.alt = alt;
    label.textContent = text;
    gameContainer.classList.toggle("fullscreen-active", isFullscreen);
  };

  const enterFullscreen = () => {
    if (document.fullscreenElement === gameContainer) return;
    const request = gameContainer.requestFullscreen?.();
    if (request?.catch) {
      request.catch(() => updateUi(false));
    }
  };

  const exitFullscreen = () => {
    if (!document.fullscreenElement) {
      updateUi(false);
      return;
    }
    document.exitFullscreen?.().catch?.(() => updateUi(false));
  };

  toggle.addEventListener("click", () => {
    if (document.fullscreenElement === gameContainer) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
    toggle.blur();
  });

  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === gameContainer;
    updateUi(isFullscreen);
  });

  updateUi(false);
}

export function applyAutoFullscreen({
  containerId = "game-container",
  maxWidth = 1366,
  maxHeight = 800,
  enabled = true,
  toggleContainerSelector = ".hud-container-right",
} = {}) {
  const container = document.getElementById(containerId);
  const toggleContainer = document.querySelector(toggleContainerSelector);
  if (!container) return;
  const shouldFill =
    enabled &&
    window.innerWidth <= maxWidth &&
    window.innerHeight <= maxHeight;
  container.classList.toggle("auto-fullscreen", shouldFill);
  if (toggleContainer) {
    toggleContainer.classList.toggle("hide-fullscreen-toggle", shouldFill);
  }
}
