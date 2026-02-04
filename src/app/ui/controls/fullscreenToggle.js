import {
  AUTO_FULLSCREEN_MAX_HEIGHT,
  AUTO_FULLSCREEN_MAX_WIDTH,
} from "../../../config/config.js";

/**
 * Returns fullscreen elements.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {string} [options.containerId] Container element id.
 * @param {string} [options.toggleId] Toggle element id.
 * @param {string} [options.iconId] Icon element id.
 * @param {string} [options.labelId] Label element id.
 */
const getFullscreenElements = ({ containerId, toggleId, iconId, labelId }) => {
  const toggle = document.getElementById(toggleId);
  const icon = document.getElementById(iconId);
  const label = document.getElementById(labelId);
  const gameContainer = document.getElementById(containerId);
  if (!toggle || !icon || !label || !gameContainer) return null;
  return { toggle, icon, label, gameContainer };
};

/**
 * Returns fullscreen ui text.
 * Uses isFullscreen to compute the result.
 * @param {boolean} isFullscreen Whether fullscreen.
 * @returns {*} Fullscreen ui text.
 */
const getFullscreenUiText = (isFullscreen) => ({
  src: isFullscreen ? "./assets/icons/fullscreen-off.png" : "./assets/icons/fullscreen-on.png",
  alt: isFullscreen ? "close fullscreen" : "fullscreen",
  text: isFullscreen ? "close fullscreen" : "fullscreen",
});

/**
 * Applies fullscreen ui.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {string} [options.label] Label.
 * @param {HTMLElement} [options.gameContainer] Game container.
 * @param {boolean} [options.isFullscreen] Whether fullscreen.
 */
const applyFullscreenUi = ({ icon, label, gameContainer, isFullscreen }) => {
  const { src, alt, text } = getFullscreenUiText(isFullscreen);
  icon.src = src;
  icon.alt = alt;
  label.textContent = text;
  gameContainer.classList.toggle("fullscreen-active", isFullscreen);
};

/**
 * Creates ui updater.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {string} [options.label] Label.
 * @param {HTMLElement} [options.gameContainer] Game container.
 * @returns {*} Ui updater.
 */
const createUiUpdater = ({ icon, label, gameContainer }) => (isFullscreen) =>
  applyFullscreenUi({ icon, label, gameContainer, isFullscreen });

/**
 * Creates enter fullscreen.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.gameContainer] Game container.
 * @param {*} [options.updateUi] Update ui.
 * @returns {*} Enter fullscreen.
 */
const createEnterFullscreen = ({ gameContainer, updateUi }) => () => {
  if (document.fullscreenElement === gameContainer) return;
  const request = gameContainer.requestFullscreen?.();
  if (request?.catch) request.catch(() => updateUi(false));
};

/**
 * Creates exit fullscreen.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.updateUi] Update ui.
 * @returns {*} Exit fullscreen.
 */
const createExitFullscreen = ({ updateUi }) => () => {
  if (!document.fullscreenElement) {
    updateUi(false);
    return;
  }
  document.exitFullscreen?.().catch?.(() => updateUi(false));
};

/**
 * Creates fullscreen controllers.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {HTMLImageElement} [options.icon] Icon.
 * @param {string} [options.label] Label.
 * @param {HTMLElement} [options.gameContainer] Game container.
 */
const createFullscreenControllers = ({ icon, label, gameContainer }) => {
  const updateUi = createUiUpdater({ icon, label, gameContainer });
  const enterFullscreen = createEnterFullscreen({ gameContainer, updateUi });
  const exitFullscreen = createExitFullscreen({ updateUi });
  return { updateUi, enterFullscreen, exitFullscreen };
};

/**
 * Binds toggle click.
 * Manages fullscreen state for the game container.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.toggle] Toggle.
 * @param {HTMLElement} [options.gameContainer] Game container.
 * @param {boolean} [options.enterFullscreen] Enter fullscreen.
 * @param {boolean} [options.exitFullscreen] Exit fullscreen.
 */
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

/**
 * Binds fullscreen change.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.gameContainer] Game container.
 * @param {*} [options.updateUi] Update ui.
 */
const bindFullscreenChange = ({ gameContainer, updateUi }) => {
  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === gameContainer;
    updateUi(isFullscreen);
  });
};

/**
 * Sets up fullscreen toggle. If omitted, default values are used.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.containerId] Container element id.
 * @param {string} [options.toggleId] Toggle element id.
 * @param {string} [options.iconId] Icon element id.
 * @param {string} [options.labelId] Label element id.
 * @param {*} [options.}] Value.
 */
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

/**
 * Returns auto fullscreen elements.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {string} [options.containerId] Container element id.
 * @param {HTMLElement} [options.toggleContainerSelector] Toggle container selector.
 * @returns {*} Auto fullscreen elements.
 */
const getAutoFullscreenElements = ({ containerId, toggleContainerSelector }) => ({
  container: document.getElementById(containerId),
  toggleContainer: document.querySelector(toggleContainerSelector),
});

/**
 * Returns auto fullscreen state.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {boolean} [options.enabled] Enabled.
 * @param {number} [options.maxWidth] Max width.
 * @param {number} [options.maxHeight] Max height.
 * @returns {*} Auto fullscreen state.
 */
const getAutoFullscreenState = ({ enabled, maxWidth, maxHeight }) =>
  enabled && window.innerWidth <= maxWidth && window.innerHeight <= maxHeight;

/**
 * Applies auto fullscreen state.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.container] Container.
 * @param {HTMLElement} [options.toggleContainer] Toggle container.
 * @param {boolean} [options.shouldFill] Whether fill.
 */
const applyAutoFullscreenState = ({ container, toggleContainer, shouldFill }) => {
  container.classList.toggle("auto-fullscreen", shouldFill);
  document.body?.classList.toggle("auto-fullscreen-active", shouldFill);
  if (toggleContainer) {
    toggleContainer.classList.toggle("hide-fullscreen-toggle", shouldFill);
  }
};

/**
 * Applies auto fullscreen. If omitted, default values are used.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.containerId] Container element id.
 * @param {number} [options.maxWidth] Max width.
 * @param {number} [options.maxHeight] Max height.
 * @param {boolean} [options.enabled] Enabled.
 * @param {HTMLElement} [options.toggleContainerSelector] Toggle container selector.
 */
export function applyAutoFullscreen({
  containerId = "game-container",
  maxWidth = AUTO_FULLSCREEN_MAX_WIDTH,
  maxHeight = AUTO_FULLSCREEN_MAX_HEIGHT,
  enabled = true,
  toggleContainerSelector = ".hud-container-right",
}) {
  updateAutoFullscreenState({ containerId, toggleContainerSelector,  enabled,  maxWidth, maxHeight });
};

/**
 * Updates auto fullscreen state.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {string} [options.containerId] Container element id.
 * @param {HTMLElement} [options.toggleContainerSelector] Toggle container selector.
 * @param {boolean} [options.enabled] Enabled.
 * @param {number} [options.maxWidth] Max width.
 * @param {number} [options.maxHeight] Max height.
 */
const updateAutoFullscreenState = ({ containerId, toggleContainerSelector, enabled, maxWidth, maxHeight }) => {
  const { container, toggleContainer } = getAutoFullscreenElements({ containerId, toggleContainerSelector });
  if (!container) return;
  const shouldFill = getAutoFullscreenState({ enabled, maxWidth, maxHeight });
  applyAutoFullscreenState({ container, toggleContainer, shouldFill });
};
