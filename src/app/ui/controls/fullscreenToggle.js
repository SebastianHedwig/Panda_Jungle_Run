import {
  AUTO_FULLSCREEN_MAX_HEIGHT,
  AUTO_FULLSCREEN_MAX_WIDTH,
} from "../../../config/config.js";

const getFullscreenElements = ({ containerId, toggleId, iconId, labelId }) => {
  const toggle = document.getElementById(toggleId);
  const icon = document.getElementById(iconId);
  const label = document.getElementById(labelId);
  const gameContainer = document.getElementById(containerId);
  if (!toggle || !icon || !label || !gameContainer) return null;
  return { toggle, icon, label, gameContainer };
};

const getFullscreenUiText = (isFullscreen) => ({
  src: isFullscreen ? "./assets/icons/fullscreen-off.png" : "./assets/icons/fullscreen-on.png",
  alt: isFullscreen ? "close fullscreen" : "fullscreen",
  text: isFullscreen ? "close fullscreen" : "fullscreen",
});

const applyFullscreenUi = ({ icon, label, gameContainer, isFullscreen }) => {
  const { src, alt, text } = getFullscreenUiText(isFullscreen);
  icon.src = src;
  icon.alt = alt;
  label.textContent = text;
  gameContainer.classList.toggle("fullscreen-active", isFullscreen);
};

const createUiUpdater = ({ icon, label, gameContainer }) => (isFullscreen) =>
  applyFullscreenUi({ icon, label, gameContainer, isFullscreen });

const createEnterFullscreen = ({ gameContainer, updateUi }) => () => {
  if (document.fullscreenElement === gameContainer) return;
  const request = gameContainer.requestFullscreen?.();
  if (request?.catch) request.catch(() => updateUi(false));
};

const createExitFullscreen = ({ updateUi }) => () => {
  if (!document.fullscreenElement) {
    updateUi(false);
    return;
  }
  document.exitFullscreen?.().catch?.(() => updateUi(false));
};

const createFullscreenControllers = ({ icon, label, gameContainer }) => {
  const updateUi = createUiUpdater({ icon, label, gameContainer });
  const enterFullscreen = createEnterFullscreen({ gameContainer, updateUi });
  const exitFullscreen = createExitFullscreen({ updateUi });
  return { updateUi, enterFullscreen, exitFullscreen };
};

const bindToggleClick = ({ toggle, gameContainer, enterFullscreen, exitFullscreen }) => {
  toggle.addEventListener("click", () => {
    if (document.fullscreenElement === gameContainer) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
    toggle.blur();
  });
};

const bindFullscreenChange = ({ gameContainer, updateUi }) => {
  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === gameContainer;
    updateUi(isFullscreen);
  });
};

export function setupFullscreenToggle({
  containerId = "game-container",
  toggleId = "fullscreen-toggle",
  iconId = "fullscreen-icon",
  labelId = "fullscreen-label",
} = {}) {
  const elements = getFullscreenElements({ containerId, toggleId, iconId, labelId });
  if (!elements) return;
  const { toggle, icon, label, gameContainer } = elements;
  const { updateUi, enterFullscreen, exitFullscreen } = createFullscreenControllers({ icon, label, gameContainer });
  bindToggleClick({ toggle, gameContainer, enterFullscreen, exitFullscreen });
  bindFullscreenChange({ gameContainer, updateUi });
  updateUi(false);
};

const getAutoFullscreenElements = ({ containerId, toggleContainerSelector }) => ({
  container: document.getElementById(containerId),
  toggleContainer: document.querySelector(toggleContainerSelector),
});

const getAutoFullscreenState = ({ enabled, maxWidth, maxHeight }) =>
  enabled && window.innerWidth <= maxWidth && window.innerHeight <= maxHeight;

const applyAutoFullscreenState = ({ container, toggleContainer, shouldFill }) => {
  container.classList.toggle("auto-fullscreen", shouldFill);
  document.body?.classList.toggle("auto-fullscreen-active", shouldFill);
  if (toggleContainer) {
    toggleContainer.classList.toggle("hide-fullscreen-toggle", shouldFill);
  }
};

export function applyAutoFullscreen({
  containerId = "game-container",
  maxWidth = AUTO_FULLSCREEN_MAX_WIDTH,
  maxHeight = AUTO_FULLSCREEN_MAX_HEIGHT,
  enabled = true,
  toggleContainerSelector = ".hud-container-right",
}) {
  updateAutoFullscreenState({ containerId, toggleContainerSelector,  enabled,  maxWidth, maxHeight });
};

const updateAutoFullscreenState = ({ containerId, toggleContainerSelector, enabled, maxWidth, maxHeight }) => {
  const { container, toggleContainer } = getAutoFullscreenElements({ containerId, toggleContainerSelector });
  if (!container) return;
  const shouldFill = getAutoFullscreenState({ enabled, maxWidth, maxHeight });
  applyAutoFullscreenState({ container, toggleContainer, shouldFill });
};
