import { GAME_HEIGHT, GAME_WIDTH } from "../../config/config.js";
import { mobileAudioUnlock } from "../audio/mobileAudioUnlock.js";
import { startMusicController } from "../audio/webAudioUnlock.js";
import { ControlsOverlay } from "../ui/overlay/controlsOverlay.class.js";
import { ControlsOverlayMobile } from "../ui/overlay/controlsOverlayMobile.class.js";
import { renderImpressumScreen } from "./impressumScreen.js";
import { renderPrivacyPolicyScreen } from "./privacyPolicyScreen.js";
import { loadFont, loadStartImage, setOverlayActive, setLegalScreenActive } from "./startScreenUtils.js";
import { createStartScreenHandlers } from "./startScreenHandler.js";

const AUTOSTART_KEY = "panda_autostart";
const SETTINGS_ICON_DEFAULT_SRC = "./assets/icons/menu-100.png";
const SETTINGS_ICON_CONTROLLER_SRC = "./assets/icons/controler.png";

const TITLE_MAX_FONT_SIZE = 80;
const TITLE_FONT_SCALE = 0.06;
const TITLE_Y_RATIO = 0.22;
const TITLE_FILL_COLOR = "rgb(0, 110, 110)";
const TITLE_STROKE_COLOR = "rgba(0, 100, 100, 0.9)";
const TITLE_SHADOW_COLOR = "rgba(255,255,255,0.7)";
const TITLE_SHADOW_BLUR = 14;
const TITLE_SHADOW_OFFSET_Y = 2;
const TITLE_STROKE_WIDTH = 3;

const LEGAL_RETURN_HOVER_SCALE = 1.02;
const LEGAL_RETURN_COLOR = "rgb(0, 110, 110)";
const LEGAL_RETURN_HOVER_COLOR = "rgba(255,255,255,0.8)";

const START_BUTTON_SPRITE = { x: 525, y: 130, w: 360, h: 135 };
const START_BUTTON_MAX_WIDTH = 260;
const START_BUTTON_WIDTH_RATIO = 0.28;
const START_BUTTON_BASE_Y_RATIO = 0.32;
const START_BUTTON_Y_OFFSET = 138;
const START_BUTTON_HOVER_SCALE = 1.2;
const BUTTON_SHADOW_COLOR = "rgba(255,255,255,0.7)";
const BUTTON_SHADOW_BLUR = 14;
const BUTTON_SHADOW_OFFSET_Y = 2;

/**
 * Returns canvas and context.
 * Resolves DOM elements from the document.
 * @param {string} canvasId Canvas element id.
 * @returns {Object} Canvas and context.
 */
const getCanvasAndContext = (canvasId) => {
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
const getAutoStartFlag = () => {
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
const clearAutoStartFlag = () => {
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
const handleAutoStart = (onStart) => {
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
const applySettingsToggleDefaults = ({ settingsLabel, settingsToggle, settingsIcon, settingsIconControllerSrc }) => {
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
const getSettingsContext = () => {
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
const createControlsOverlays = () => ({
  controlsOverlayDesktop: new ControlsOverlay({ showBackButton: false }),
  controlsOverlayMobile: new ControlsOverlayMobile({ showBackButton: false }),
});

/**
 * Creates active controls overlay getter.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.controlsOverlayDesktop] Controls overlay desktop.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.controlsOverlayMobile] Controls overlay mobile.
 * @returns {*} Active controls overlay getter.
 */
const createActiveControlsOverlayGetter = ({ controlsOverlayDesktop, controlsOverlayMobile }) => () => {
  const container = document.getElementById("game-container");
  const useMobile = container?.classList?.contains("auto-fullscreen");
  return useMobile ? controlsOverlayMobile : controlsOverlayDesktop;
};

/**
 * Creates start screen state.
 * @returns {*} Start screen state.
 */
const createStartScreenState = () => ({
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
 * Returns legal renderer.
 * Uses legalPage to compute the result.
 * @param {*} legalPage Legal page.
 * @returns {*} Legal renderer.
 */
const getLegalRenderer = (legalPage) =>
  legalPage === "impressum" ? renderImpressumScreen : legalPage === "privacy" ? renderPrivacyPolicyScreen : null;

/**
 * Resets legal bounds.
 * Uses startScreenState to perform the operation.
 * @param {*} startScreenState Start screen state.
 */
const resetLegalBounds = (startScreenState) => {
  startScreenState.impressumLinkBounds = null;
  startScreenState.legalReturnBounds = null;
};

/**
 * Applies legal render result.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.renderResult] Render result.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {boolean} [options.isImpressum] Whether impressum.
 */
const applyLegalRenderResult = ({ renderResult, startScreenState, isImpressum }) => {
  const { maxScroll, closeTextBounds, linkBounds } = renderResult;
  startScreenState.legalMaxScroll = maxScroll;
  startScreenState.legalScroll = Math.min(startScreenState.legalScroll, startScreenState.legalMaxScroll);
  if (isImpressum) startScreenState.impressumLinkBounds = linkBounds || null;
  return closeTextBounds;
};

/**
 * Returns legal return scale.
 * Uses startScreenState to compute the result.
 * @param {*} startScreenState Start screen state.
 * @returns {*} Legal return scale.
 */
const getLegalReturnScale = (startScreenState) =>
  startScreenState.legalReturnHover ? LEGAL_RETURN_HOVER_SCALE : 1;

/**
 * Draws scaled close text.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {string} [options.closeTextBounds] Close text bounds.
 * @param {number} [options.scale] Scale.
 */
const drawScaledCloseText = ({ ctx, closeTextBounds, scale }) => {
  ctx.save();
  ctx.translate(closeTextBounds.x, closeTextBounds.y);
  ctx.scale(scale, scale);
  ctx.fillText(closeTextBounds.text, 0, 0);
  ctx.restore();
};

/**
 * Returns legal return bounds.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @param {string} closeTextBounds Close text bounds.
 * @returns {Object} Legal return bounds.
 */
const getLegalReturnBounds = (ctx, closeTextBounds) => {
  const returnTextWidth = ctx.measureText(closeTextBounds.text).width;
  return { x: closeTextBounds.x, y: closeTextBounds.y, w: returnTextWidth, h: closeTextBounds.h };
};

/**
 * Draws legal close text.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {string} [options.closeTextBounds] Close text bounds.
 * @param {*} [options.startScreenState] Start screen state.
 */
const drawLegalCloseText = ({ ctx, closeTextBounds, startScreenState }) => {
  if (!closeTextBounds) return;
  ctx.font = `bold ${closeTextBounds.fontSize}px sans-serif`;
  ctx.fillStyle = startScreenState.legalReturnHover ? LEGAL_RETURN_HOVER_COLOR : LEGAL_RETURN_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const scale = getLegalReturnScale(startScreenState);
  drawScaledCloseText({ ctx, closeTextBounds, scale });
  startScreenState.legalReturnBounds = getLegalReturnBounds(ctx, closeTextBounds);
};

/**
 * Creates draw legal page.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @returns {*} Draw legal page.
 */
const createDrawLegalPage = ({ ctx, canvas, startScreenState }) => () => {
  const isImpressum = startScreenState.legalPage === "impressum";
  const renderer = getLegalRenderer(startScreenState.legalPage);
  resetLegalBounds(startScreenState);
  if (!renderer) return;
  const renderResult = renderer({ ctx, canvas, scroll: startScreenState.legalScroll });
  const closeTextBounds = applyLegalRenderResult({ renderResult, startScreenState, isImpressum });
  drawLegalCloseText({ ctx, closeTextBounds, startScreenState });
};

/**
 * Prepares start screen canvas.
 * Renders to the canvas context.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 * @returns {*} Result value.
 */
const prepareStartScreenCanvas = (canvas, ctx) => {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return canvas.width / 2;
};

/**
 * Draws background image.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.bg] Bg.
 */
const drawBackgroundImage = ({ ctx, canvas, bg }) => {
  const scale = Math.max(canvas.width / bg.width, canvas.height / bg.height);
  const drawW = bg.width * scale;
  const drawH = bg.height * scale;
  const bgDrawX = (canvas.width - drawW) / 2;
  /**
   * Bg draw Y.
   * Uses canvas.height - drawH to perform the operation.
   * @param {boolean} canvas.height - drawH Canvas height draw H.
   */
  const bgDrawY = (canvas.height - drawH) / 2;
  ctx.drawImage(bg, bgDrawX, bgDrawY, drawW, drawH);
};

/**
 * Applies title styles.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 */
const applyTitleStyles = ({ ctx, canvas }) => {
  ctx.font = `small-caps ${Math.min(TITLE_MAX_FONT_SIZE, canvas.width * TITLE_FONT_SCALE)}px "ComixLoud", sans-serif`;
  ctx.fillStyle = TITLE_FILL_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = TITLE_SHADOW_COLOR;
  ctx.shadowBlur = TITLE_SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = TITLE_SHADOW_OFFSET_Y;
  ctx.lineWidth = TITLE_STROKE_WIDTH;
  ctx.strokeStyle = TITLE_STROKE_COLOR;
};

/**
 * Draws start title.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {boolean} [options.canvasCenterX] Canvas center X.
 */
const drawStartTitle = ({ ctx, canvas, canvasCenterX }) => {
  const title = "Panda Jungle Run";
  applyTitleStyles({ ctx, canvas });
  ctx.strokeText(title, canvasCenterX, canvas.height * TITLE_Y_RATIO);
  ctx.fillText(title, canvasCenterX, canvas.height * TITLE_Y_RATIO);
  ctx.shadowBlur = 0;
};

/**
 * Returns start button dimensions.
 * Uses canvas to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @returns {Object} Start button dimensions.
 */
const getStartButtonDimensions = (canvas) => {
  const buttonWidth = Math.min(canvas.width * START_BUTTON_WIDTH_RATIO, START_BUTTON_MAX_WIDTH);
  /**
   * Button height.
   * Uses START_BUTTON_SPRITE.h / START_BUTTON_SPRITE.w to perform the operation.
   * @param {HTMLImageElement} START_BUTTON_SPRITE.h / START_BUTTON_SPRITE.w START BUTTON SPRITE h START BUTTON SPRITE w.
   * @returns {Object} Result value.
   */
  const buttonHeight = (START_BUTTON_SPRITE.h / START_BUTTON_SPRITE.w) * buttonWidth;
  return { buttonWidth, buttonHeight };
};

/**
 * Returns start button base center.
 * Uses canvas, buttonWidth, buttonHeight to compute the result.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {number} buttonWidth Button width.
 * @param {number} buttonHeight Button height.
 * @returns {Object} Start button base center.
 */
const getStartButtonBaseCenter = (canvas, buttonWidth, buttonHeight) => {
  const baseCenterX = (canvas.width - buttonWidth) / 2 + buttonWidth / 2;
  const baseCenterY = canvas.height * START_BUTTON_BASE_Y_RATIO + START_BUTTON_Y_OFFSET + buttonHeight / 2;
  return { baseCenterX, baseCenterY };
};

/**
 * Returns scaled button rect.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.baseCenterX] Base center X.
 * @param {number} [options.baseCenterY] Base center Y.
 * @param {number} [options.buttonWidth] Button width.
 * @param {number} [options.buttonHeight] Button height.
 * @param {number} [options.hoverScale] Hover scale.
 */
const getScaledButtonRect = ({ baseCenterX, baseCenterY, buttonWidth, buttonHeight, hoverScale }) => {
  const buttonWidthScaled = buttonWidth * hoverScale;
  const buttonHeightScaled = buttonHeight * hoverScale;
  const buttonDrawX = baseCenterX - buttonWidthScaled / 2;
  const buttonDrawY = baseCenterY - buttonHeightScaled / 2;
  return { buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled };
};

/**
 * Applies button shadow.
 * Renders to the canvas context.
 * @param {CanvasRenderingContext2D} ctx Canvas rendering context.
 */
const applyButtonShadow = (ctx) => {
  ctx.shadowColor = BUTTON_SHADOW_COLOR;
  ctx.shadowBlur = BUTTON_SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = BUTTON_SHADOW_OFFSET_Y;
};

/**
 * Draws button sprite image.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.ui] Ui.
 * @param {HTMLImageElement} [options.startButtonSprite] Start button sprite.
 * @param {number} [options.buttonDrawX] Button draw X.
 * @param {number} [options.buttonDrawY] Button draw Y.
 * @param {number} [options.buttonWidthScaled] Button width scaled.
 * @param {number} [options.buttonHeightScaled] Button height scaled.
 * @returns {*} Result value.
 */
const drawButtonSpriteImage = ({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled }) =>
  ctx.drawImage(
    ui,
    startButtonSprite.x,
    startButtonSprite.y,
    startButtonSprite.w,
    startButtonSprite.h,
    buttonDrawX,
    buttonDrawY,
    buttonWidthScaled,
    buttonHeightScaled
  );

/**
 * Draws start button sprite.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {*} [options.ui] Ui.
 * @param {HTMLImageElement} [options.startButtonSprite] Start button sprite.
 * @param {number} [options.buttonDrawX] Button draw X.
 * @param {number} [options.buttonDrawY] Button draw Y.
 * @param {number} [options.buttonWidthScaled] Button width scaled.
 * @param {number} [options.buttonHeightScaled] Button height scaled.
 */
const drawStartButtonSprite = ({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled }) => {
  ctx.save();
  applyButtonShadow(ctx);
  drawButtonSpriteImage({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled });
  ctx.restore();
};

/**
 * Creates start button bounds.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {number} [options.buttonDrawX] Button draw X.
 * @param {number} [options.buttonDrawY] Button draw Y.
 * @param {number} [options.buttonWidthScaled] Button width scaled.
 * @param {number} [options.buttonHeightScaled] Button height scaled.
 * @returns {*} Start button bounds.
 */
const createStartButtonBounds = ({ buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled }) => ({
  x: buttonDrawX,
  y: buttonDrawY,
  w: buttonWidthScaled,
  h: buttonHeightScaled,
});

/**
 * Draws start button.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.ui] Ui.
 * @param {*} [options.startScreenState] Start screen state.
 */
const drawStartButton = ({ ctx, canvas, ui, startScreenState }) => {
  const startButtonSprite = START_BUTTON_SPRITE;
  const { buttonWidth, buttonHeight } = getStartButtonDimensions(canvas);
  const { baseCenterX, baseCenterY } = getStartButtonBaseCenter(canvas, buttonWidth, buttonHeight);
  const hoverScale = startScreenState.startButtonHover ? START_BUTTON_HOVER_SCALE : 1;
  const { buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled } = getScaledButtonRect({ baseCenterX, baseCenterY, buttonWidth, buttonHeight, hoverScale });
  drawStartButtonSprite({ ctx, ui, startButtonSprite, buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled });
  return createStartButtonBounds({ buttonDrawX, buttonDrawY, buttonWidthScaled, buttonHeightScaled });
};

/**
 * Draws settings overlay.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.getActiveControlsOverlay] Get active controls overlay.
 */
const drawSettingsOverlay = ({ ctx, canvas, startScreenState, getActiveControlsOverlay }) => {
  if (!startScreenState.settingsOpen || !startScreenState.startAssets.menuBg) return;
  const overlay = getActiveControlsOverlay();
  overlay.setAssets({ bgImage: startScreenState.startAssets.menuBg, uiImage: startScreenState.startAssets.ui });
  overlay.render(ctx, canvas);
  setOverlayActive(true);
};

/**
 * Draws legal start screen.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawLegalPage] Draw legal page.
 */
const drawLegalStartScreen = ({ startScreenState, drawLegalPage }) => {
  startScreenState.startButtonBounds = null;
  drawLegalPage();
};

/**
 * Creates draw start screen.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {CanvasRenderingContext2D} [options.ctx] Canvas rendering context.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawLegalPage] Draw legal page.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.getActiveControlsOverlay] Get active controls overlay.
 * @returns {*} Draw start screen.
 */
const createDrawStartScreen = ({ ctx, canvas, startScreenState, drawLegalPage, getActiveControlsOverlay }) => () => {
  if (!startScreenState.startAssets) return;
  const { bg, ui } = startScreenState.startAssets;
  const canvasCenterX = prepareStartScreenCanvas(canvas, ctx);
  drawBackgroundImage({ ctx, canvas, bg });
  drawStartTitle({ ctx, canvas, canvasCenterX });
  if (startScreenState.legalPage) return drawLegalStartScreen({ startScreenState, drawLegalPage });
  startScreenState.startButtonBounds = drawStartButton({ ctx, canvas, ui, startScreenState });
  drawSettingsOverlay({ ctx, canvas, startScreenState, getActiveControlsOverlay });
};

/**
 * Applies legal page state.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.page] Page.
 */
const applyLegalPageState = ({ startScreenState, page }) => {
  startScreenState.legalPage = page;
  startScreenState.legalScroll = 0;
  startScreenState.legalMaxScroll = 0;
  startScreenState.impressumLinkBounds = null;
  startScreenState.legalReturnBounds = null;
  startScreenState.settingsOpen = false;
  startScreenState.startButtonHover = false;
  startScreenState.legalReturnHover = false;
};

/**
 * Creates show legal page.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawStartScreen] Draw start screen.
 * @returns {*} Show legal page.
 */
const createShowLegalPage = ({ canvas, startScreenState, drawStartScreen }) => (page) => {
  applyLegalPageState({ startScreenState, page });
  setOverlayActive(false);
  setLegalScreenActive(true);
  canvas.style.cursor = "pointer";
  drawStartScreen();
};

/**
 * Loads start assets.
 * @returns {*} Result value.
 */
const loadStartAssets = () =>
  Promise.all([
    loadStartImage("./assets/img/canvas-start-game_BG.jpg"),
    loadStartImage("./assets/img/Gui/Game-UI.png"),
    loadStartImage("./assets/img/menu_BG.png"),
    loadFont("ComixLoud", "4rem"),
  ]);

/**
 * Applies loaded assets.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.bg] Bg.
 * @param {*} [options.ui] Ui.
 * @param {*} [options.menuBg] Menu bg.
 * @param {*} [options.startScreenState] Start screen state.
 */
const applyLoadedAssets = ({ bg, ui, menuBg, startScreenState }) => {
  startScreenState.startAssets = { bg, ui, menuBg };
  document.body?.classList.add("start-screen-active");
};

/**
 * Loads and render start assets.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.startScreenState] Start screen state.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const loadAndRenderStartAssets = ({ startScreenState, drawStartScreen }) => {
  loadStartAssets()
    .then(([bg, ui, menuBg, _fontLoaded]) => {
      applyLoadedAssets({ bg, ui, menuBg, startScreenState });
      drawStartScreen();
    })
    .catch((err) => console.error("Failed to load start assets", err));
};

/**
 * Creates legal link handler.
 * Uses page, showLegalPage to compute the result.
 * @param {*} page Page.
 * @param {*} showLegalPage Show legal page.
 * @returns {*} Legal link handler.
 */
const createLegalLinkHandler = (page, showLegalPage) => (event) => {
  event.preventDefault();
  event.stopPropagation();
  showLegalPage(page);
};

/**
 * Binds canvas events.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLCanvasElement} [options.canvas] Target canvas.
 * @param {*} [options.handleCanvasClick] Handle canvas click.
 * @param {*} [options.handleMove] Handle move.
 * @param {*} [options.handleLeave] Handle leave.
 * @param {*} [options.handleWheel] Handle wheel.
 * @param {*} [options.handleTouchStart] Handle touch start.
 * @param {*} [options.handleTouchMove] Handle touch move.
 * @param {*} [options.handleTouchEnd] Handle touch end.
 */
const bindCanvasEvents = ({ canvas, handleCanvasClick, handleMove, handleLeave, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd }) => {
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mouseleave", handleLeave);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd);
  canvas.addEventListener("touchcancel", handleTouchEnd);
};

/**
 * Binds settings events.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {HTMLElement} [options.settingsToggle] Settings toggle.
 * @param {*} [options.handleSettingsClick] Handle settings click.
 * @param {string} [options.handleKeyDown] Handle key down.
 */
const bindSettingsEvents = ({ settingsToggle, handleSettingsClick, handleKeyDown }) => {
  settingsToggle?.addEventListener("click", handleSettingsClick, true);
  window.addEventListener("keydown", handleKeyDown, true);
};

/**
 * Binds legal link events.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {*} [options.impressumLink] Impressum link.
 * @param {*} [options.privacyPolicyLink] Privacy policy link.
 * @param {*} [options.showLegalPage] Show legal page.
 */
const bindLegalLinkEvents = ({ impressumLink, privacyPolicyLink, showLegalPage }) => {
  const handleImpressumClick = createLegalLinkHandler("impressum", showLegalPage);
  const handlePrivacyClick = createLegalLinkHandler("privacy", showLegalPage);
  impressumLink?.addEventListener("click", handleImpressumClick);
  privacyPolicyLink?.addEventListener("click", handlePrivacyClick);
};

/**
 * Binds start screen events.
 * Uses deps to perform the operation.
 * @param {*} deps Deps.
 */
const bindStartScreenEvents = (deps) => {
  bindCanvasEvents(deps);
  bindSettingsEvents(deps);
  bindLegalLinkEvents(deps);
};

/**
 * Builds start screen context.
 * Uses options to compute the result.
 * @param {Object} options Configuration options.
 * @param {string} [options.canvasId] Canvas element id.
 * @param {Function} [options.onStart] On start.
 */
const buildStartScreenContext = ({ canvasId, onStart }) => {
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
const createLegalLinks = () => ({
  impressumLink: document.querySelector(".impressum"),
  privacyPolicyLink: document.querySelector(".privacyPolicy"),
});

/**
 * Binds overlay icon load.
 * Uses options to perform the operation.
 * @param {Object} options Configuration options.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.controlsOverlayDesktop] Controls overlay desktop.
 * @param {import("../ui/overlay/overlayBase.class.js").OverlayBase} [options.controlsOverlayMobile] Controls overlay mobile.
 * @param {*} [options.drawStartScreen] Draw start screen.
 */
const bindOverlayIconLoad = ({ controlsOverlayDesktop, controlsOverlayMobile, drawStartScreen }) => {
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
const createStartScreenDependencies = ({ startScreenContext, drawStartScreen, showLegalPage, onStart }) => ({
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

/**
 * Sets up start screen. If omitted, default values are used.
 * Uses options to perform the operation.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.canvasId] Canvas element id.
 * @param {Function} [options.onStart] On start.
 */
export function setupStartScreen({ canvasId = "game", onStart }) {
  const startScreenContext = buildStartScreenContext({ canvasId, onStart });
  if (!startScreenContext) return;
  const { impressumLink, privacyPolicyLink } = createLegalLinks();
  const drawLegalPage = createDrawLegalPage(startScreenContext);
  const drawStartScreen = createDrawStartScreen({ ...startScreenContext, drawLegalPage });
  bindOverlayIconLoad({ ...startScreenContext, drawStartScreen });
  const showLegalPage = createShowLegalPage({ ...startScreenContext, drawStartScreen });
  const startScreenDependencies = createStartScreenDependencies({ startScreenContext, drawStartScreen, showLegalPage, onStart });
  const handlers = createStartScreenHandlers(startScreenDependencies);
  loadAndRenderStartAssets({ startScreenState: startScreenContext.startScreenState, drawStartScreen });
  bindStartScreenEvents({ ...handlers, ...startScreenContext, showLegalPage, impressumLink, privacyPolicyLink });
}
