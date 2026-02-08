import { mobileAudioUnlock } from "../../audio/mobileAudioUnlock.js";
import { startMusicController } from "../../audio/webAudioUnlock.js";
import { ControlsOverlay } from "../../ui/overlay/controls/controlsOverlay.class.js";
import { ControlsOverlayMobile } from "../../ui/overlay/controls/mobileControlsOverlay.class.js";
import { AUTOSTART_KEY, SETTINGS_ICON_DEFAULT_SRC, SETTINGS_ICON_CONTROLLER_SRC } from "./startScreen.js";

/**
 * Returns canvas and context.
 * Resolves DOM elements from the document.
 * @param {string} canvasId Canvas element id.
 * @returns {Object} Canvas and context.
 */
export const getCanvasAndContext = (canvasId) => {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return null;
  return { canvas, ctx };
};

/**
 * Returns auto start flag.
 * Reads or writes browser storage.
 * @returns {*} Auto start flag.
 */
export const getAutoStartFlag = () => {
  try {
    return window.localStorage?.getItem?.(AUTOSTART_KEY) === "1"; // "1" = simple Autostart-Flag set by handleRetry().
  } catch (_err) {
    return false;
  }
};

/**
 * Clears auto start flag.
 * Reads or writes browser storage.
 */
export const clearAutoStartFlag = () => {
  try {
    window.localStorage?.removeItem?.(AUTOSTART_KEY);
  } catch (_err) {}
};

/**
 * Handles auto start.
 * Uses onStart to perform the operation.
 * @param {Function} onStart On start.
 * @returns {*} Result value.
 */
export const handleAutoStart = (onStart) => {
  const autoStart = getAutoStartFlag();
  if (!autoStart) return false;
  clearAutoStartFlag();
  onStart?.();
  return true;
};

/**
 * Applies settings toggle defaults.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {string} [options.settingsLabel] Settings label.
 * @param {HTMLElement} [options.settingsToggle] Settings toggle.
 * @param {HTMLImageElement} [options.settingsIcon] Settings icon.
 * @param {string} [options.settingsIconControllerSrc] Settings icon controller src.
 */
export const applySettingsToggleDefaults = ({ settingsLabel, settingsToggle, settingsIcon, settingsIconControllerSrc }) => {
  if (settingsLabel) settingsLabel.textContent = "controls";
  settingsToggle?.classList.remove("settings-toggle--spin");
  if (settingsIcon) {
    settingsIcon.src = settingsIconControllerSrc;
    settingsIcon.alt = "Settings";
  }
};

/**
 * Returns settings context.
 * Resolves DOM elements from the document.
 * @returns {Object} Settings context.
 */
export const getSettingsContext = () => {
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsLabel = settingsToggle?.querySelector(".hud-label");
  const settingsIcon = settingsToggle?.querySelector("img");
  const defaultSettingsLabel = settingsLabel?.textContent ?? "settings";
  const settingsIconDefaultSrc = SETTINGS_ICON_DEFAULT_SRC;
  const settingsIconControllerSrc = SETTINGS_ICON_CONTROLLER_SRC;
  applySettingsToggleDefaults({ settingsLabel, settingsToggle, settingsIcon, settingsIconControllerSrc });
  return { settingsToggle, settingsLabel, settingsIcon, defaultSettingsLabel, settingsIconDefaultSrc, settingsIconControllerSrc };
};

/**
 * Creates controls overlays.
 * @returns {*} Controls overlays.
 */
export const createControlsOverlays = () => ({
  controlsOverlayDesktop: new ControlsOverlay({ showBackButton: false }),
  controlsOverlayMobile: new ControlsOverlayMobile({ showBackButton: false }),
});

/**
 * Creates active controls overlay getter.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.controlsOverlayDesktop] Controls overlay desktop.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.controlsOverlayMobile] Controls overlay mobile.
 * @returns {*} Active controls overlay getter.
 */
export const createActiveControlsOverlayGetter = ({ controlsOverlayDesktop, controlsOverlayMobile }) => () => {
  const container = document.getElementById("game-container");
  const useMobile = container?.classList?.contains("auto-fullscreen");
  return useMobile ? controlsOverlayMobile : controlsOverlayDesktop;
};

/**
 * Creates start screen state.
 * @returns {*} Start screen state.
 */
export const createStartScreenState = () => ({
  startScreenActive: true,
  startButtonBounds: null,
  startButtonHover: false,
  settingsOpen: false,
  startAssets: null,
  legalPage: null, // "impressum" | "privacy" | null
  legalScroll: 0,
  legalMaxScroll: 0,
  legalReturnHover: false,
  touchScrollStartY: null,
  impressumLinkBounds: null,
  legalReturnBounds: null,
});

/**
 * Builds start screen context.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {string} [options.canvasId] Canvas element id.
 * @param {Function} [options.onStart] On start.
 */
export const buildStartScreenContext = ({ canvasId, onStart }) => {
  const canvasContext = getCanvasAndContext(canvasId);
  if (!canvasContext) return null;
  mobileAudioUnlock.bind();
  if (handleAutoStart(onStart)) return null;
  const settingsContext = getSettingsContext();
  const overlays = createControlsOverlays();
  const getActiveControlsOverlay = createActiveControlsOverlayGetter(overlays);
  const startScreenState = createStartScreenState();
  const { start: startMenuMusic, stop: stopMenuMusic } = startMusicController;
  startMenuMusic();
  return { ...canvasContext, onStart, ...settingsContext, ...overlays, getActiveControlsOverlay, startScreenState, stopMenuMusic };
};

/**
 * Creates legal links.
 * @returns {*} Legal links.
 */
export const createLegalLinks = () => ({
  impressumLink: document.querySelector(".impressum"),
  privacyPolicyLink: document.querySelector(".privacyPolicy"),
});

/**
 * Binds overlay icon load.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.controlsOverlayDesktop] Controls overlay desktop.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.controlsOverlayMobile] Controls overlay mobile.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
export const bindOverlayIconLoad = ({ controlsOverlayDesktop, controlsOverlayMobile, drawStartScreen }) => {
  controlsOverlayDesktop.setOnIconLoad?.(() => drawStartScreen());
  controlsOverlayMobile.setOnIconLoad?.(() => drawStartScreen());
};

/**
 * Creates start screen dependencies.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {*} [options.startScreenContext] Start screen context.
 * @param {*} [options.drawStartScreen] Draw start screen.
 * @param {*} [options.showLegalPage] Show legal page.
 * @param {Function} [options.onStart] On start.
 * @returns {*} Start screen dependencies.
 */
export const createStartScreenDependencies = ({ startScreenContext, drawStartScreen, showLegalPage, onStart }) => ({
  canvas: startScreenContext.canvas,
  settingsToggle: startScreenContext.settingsToggle,
  settingsLabel: startScreenContext.settingsLabel,
  settingsIcon: startScreenContext.settingsIcon,
  defaultSettingsLabel: startScreenContext.defaultSettingsLabel,
  settingsIconDefaultSrc: startScreenContext.settingsIconDefaultSrc,
  getActiveControlsOverlay: startScreenContext.getActiveControlsOverlay,
  drawStartScreen,
  showLegalPage,
  stopMenuMusic: startScreenContext.stopMenuMusic,
  onStart,
  mobileAudioUnlock,
  state: startScreenContext.startScreenState,
});
