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
 * Returns auto fullscreen active.
 * Reads from the document.
 * @returns {boolean} Whether auto fullscreen active.
 */
export const isAutoFullscreenActive = () => document.getElementById("game-container")?.classList?.contains("auto-fullscreen");

/**
 * Creates active controls overlay getter.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.controlsOverlayDesktop] Controls overlay desktop.
 * @param {ControlsOverlay | ControlsOverlayMobile} [options.controlsOverlayMobile] Controls overlay mobile.
 * @returns {*} Active controls overlay getter.
 */
export const createActiveControlsOverlayGetter = ({ controlsOverlayDesktop, controlsOverlayMobile }) => () => {
  const useMobile = isAutoFullscreenActive();
  return useMobile ? controlsOverlayMobile : controlsOverlayDesktop;
};

const MENU_MUSIC_START_EVENTS = ["pointerdown", "touchstart", "keydown"];

/**
 * Iterates menu music start events.
 * Uses callback to perform the operation.
 * @param {Function} callback Callback.
 */
const forEachMenuMusicStartEvent = (callback) => MENU_MUSIC_START_EVENTS.forEach(callback);

/**
 * Returns menu music event target.
 * Uses eventName, canvas to compute the result.
 * @param {string} eventName Event name.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @returns {EventTarget} Event target.
 */
const getMenuMusicEventTarget = (eventName, canvas) => (eventName === "keydown" ? window : canvas);

/**
 * Returns menu music event options.
 * Uses eventName to compute the result.
 * @param {string} eventName Event name.
 * @returns {*} Event options.
 */
const getMenuMusicEventOptions = (eventName) => (eventName === "touchstart" ? { passive: true } : undefined);

/**
 * Binds menu music event.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {string} [options.eventName] Event name.
 * @param {Function} [options.handler] Handler.
 */
const bindMenuMusicEvent = ({ canvas, eventName, handler }) =>
  getMenuMusicEventTarget(eventName, canvas).addEventListener(eventName, handler, getMenuMusicEventOptions(eventName));

/**
 * Unbinds menu music event.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {string} [options.eventName] Event name.
 * @param {Function} [options.handler] Handler.
 */
const unbindMenuMusicEvent = ({ canvas, eventName, handler }) =>
  getMenuMusicEventTarget(eventName, canvas).removeEventListener(eventName, handler);

/**
 * Creates menu music start handler.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {Function} [options.startMenuMusic] Start menu music.
 * @param {Function} [options.cleanup] Cleanup.
 * @param {Object} [options.startedRef] Started ref.
 * @returns {Function} Menu music start handler.
 */
const createMenuMusicStartHandler = ({ startMenuMusic, cleanup, startedRef }) => () => {
  if (startedRef.started) return;
  startedRef.started = true;
  cleanup();
  startMenuMusic();
};

/**
 * Binds menu music start to first user interaction.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {Function} [options.startMenuMusic] Start menu music.
 */
export const bindMenuMusicStartOnFirstInteraction = ({ canvas, startMenuMusic }) => {
  if (!canvas || typeof startMenuMusic !== "function") return;
  const startedRef = { started: false };
  let handler = () => {};
  const cleanup = () => forEachMenuMusicStartEvent((eventName) => unbindMenuMusicEvent({ canvas, eventName, handler }));
  handler = createMenuMusicStartHandler({ startMenuMusic, cleanup, startedRef });
  forEachMenuMusicStartEvent((eventName) => bindMenuMusicEvent({ canvas, eventName, handler }));
};

/**
 * Initializes menu music.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {Function} [options.startMenuMusic] Start menu music.
 */
const initMenuMusic = ({ canvas, startMenuMusic }) => {
  if (isAutoFullscreenActive()) {
    bindMenuMusicStartOnFirstInteraction({ canvas, startMenuMusic });
    return;
  }
  startMenuMusic();
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
  initMenuMusic({ canvas: canvasContext.canvas, startMenuMusic });
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
