import { GAME_HEIGHT, GAME_WIDTH } from "../../config/config.js";
import { mobileAudioUnlock } from "../audio/mobileAudioUnlock.js";
import { startMusicController } from "../audio/webAudioUnlock.js";
import { ControlsOverlay } from "../ui/overlay/controlsOverlay.class.js";
import { ControlsOverlayMobile } from "../ui/overlay/controlsOverlayMobile.class.js";
import { renderImpressumScreen } from "./impressumScreen.js";
import { renderPrivacyPolicyScreen } from "./privacyPolicyScreen.js";
import { loadFont, loadStartImage, setOverlayActive } from "./startScreenUtils.js";
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
const START_BUTTON_Y_OFFSET = 170;
const START_BUTTON_HOVER_SCALE = 1.2;
const BUTTON_SHADOW_COLOR = "rgba(255,255,255,0.7)";
const BUTTON_SHADOW_BLUR = 14;
const BUTTON_SHADOW_OFFSET_Y = 2;

export function setupStartScreen({ canvasId = "game", onStart } = {}) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  mobileAudioUnlock.bind();

  const autoStart = (() => {
    try {
      return window.localStorage?.getItem?.(AUTOSTART_KEY) === "1"; // "1" = simple Autostart-Flag set by handleRetry().
    } catch (_err) {
      return false;
    }
  })();
  if (autoStart) {
    try {window.localStorage?.removeItem?.(AUTOSTART_KEY);
    } catch (_err) {}
    onStart?.();
    return;
  }

  const settingsToggle = document.getElementById("settings-toggle");
  const settingsLabel = settingsToggle?.querySelector(".hud-label");
  const settingsIcon = settingsToggle?.querySelector("img");
  const defaultSettingsLabel = settingsLabel?.textContent ?? "settings";
  const settingsIconDefaultSrc = SETTINGS_ICON_DEFAULT_SRC;
  const settingsIconControllerSrc = SETTINGS_ICON_CONTROLLER_SRC;
  if (settingsLabel) settingsLabel.textContent = "controls";
  settingsToggle?.classList.remove("settings-toggle--spin");
  if (settingsIcon) {
    settingsIcon.src = settingsIconControllerSrc;
    settingsIcon.alt = "Settings";
  }

  const controlsOverlayDesktop = new ControlsOverlay({ showBackButton: false });
  const controlsOverlayMobile = new ControlsOverlayMobile({ showBackButton: false });
  controlsOverlayDesktop.setOnIconLoad?.(() => drawStartScreen());
  controlsOverlayMobile.setOnIconLoad?.(() => drawStartScreen());

  const impressumLink = document.querySelector(".impressum");
  const privacyPolicyLink = document.querySelector(".privacyPolicy");
  const startScreenState = {
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
  };

  const getActiveControlsOverlay = () => {
    const container = document.getElementById("game-container");
    const useMobile = container?.classList?.contains("auto-fullscreen");
    return useMobile ? controlsOverlayMobile : controlsOverlayDesktop;
  };

  const { start: startMenuMusic, stop: stopMenuMusic } = startMusicController;

  startMenuMusic();

  const drawLegalPage = () => {
    const isImpressum = startScreenState.legalPage === "impressum";
    const renderer =
      startScreenState.legalPage === "impressum"
        ? renderImpressumScreen
        : startScreenState.legalPage === "privacy"
        ? renderPrivacyPolicyScreen
        : null;

    startScreenState.impressumLinkBounds = null;
    startScreenState.legalReturnBounds = null;
    if (!renderer) return;

    const { maxScroll, closeTextBounds, linkBounds } = renderer({
      ctx,
      canvas,
      scroll: startScreenState.legalScroll,
    });
    startScreenState.legalMaxScroll = maxScroll;
    startScreenState.legalScroll = Math.min(startScreenState.legalScroll, startScreenState.legalMaxScroll);
    if (isImpressum) startScreenState.impressumLinkBounds = linkBounds || null;

    const drawClose = (closeTextBounds) => {
      ctx.font = `bold ${closeTextBounds.fontSize}px sans-serif`;
      ctx.fillStyle = startScreenState.legalReturnHover ? LEGAL_RETURN_HOVER_COLOR : LEGAL_RETURN_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.save();
      const scale = startScreenState.legalReturnHover ? LEGAL_RETURN_HOVER_SCALE : 1;
      ctx.translate(closeTextBounds.x, closeTextBounds.y);
      ctx.scale(scale, scale);
      ctx.fillText(closeTextBounds.text, 0, 0);
      ctx.restore();
      const returnTextWidth = ctx.measureText(closeTextBounds.text).width;
      startScreenState.legalReturnBounds = {
        x: closeTextBounds.x,
        y: closeTextBounds.y,
        w: returnTextWidth,
        h: closeTextBounds.h,
      };
    };

    if (closeTextBounds) drawClose(closeTextBounds);
  };

  const drawStartScreen = () => {
    if (!startScreenState.startAssets) return;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const canvasCenterX = canvas.width / 2;

    const { bg, ui } = startScreenState.startAssets;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width / bg.width, canvas.height / bg.height);
    const drawW = bg.width * scale;
    const drawH = bg.height * scale;
    const bgDrawX = (canvas.width - drawW) / 2;
    const bgDrawY = (canvas.height - drawH) / 2;
    ctx.drawImage(bg, bgDrawX, bgDrawY, drawW, drawH);

    const title = "Panda Jungle Run";
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
    ctx.strokeText(title, canvasCenterX, canvas.height * TITLE_Y_RATIO);
    ctx.fillText(title, canvasCenterX, canvas.height * TITLE_Y_RATIO);
    ctx.shadowBlur = 0;

    if (startScreenState.legalPage) {
      startScreenState.startButtonBounds = null;
      drawLegalPage();
      return;
    }

    const startButtonSprite = START_BUTTON_SPRITE;
    const buttonWidth = Math.min(canvas.width * START_BUTTON_WIDTH_RATIO, START_BUTTON_MAX_WIDTH);
    const buttonHeight = (startButtonSprite.h / startButtonSprite.w) * buttonWidth;
    const baseCenterX = (canvas.width - buttonWidth) / 2 + buttonWidth / 2;
    const baseCenterY = canvas.height * START_BUTTON_BASE_Y_RATIO + START_BUTTON_Y_OFFSET + buttonHeight / 2;
    const hoverScale = startScreenState.startButtonHover ? START_BUTTON_HOVER_SCALE : 1;
    const buttonWidthScaled = buttonWidth * hoverScale;
    const buttonHeightScaled = buttonHeight * hoverScale;
    const buttonDrawX = baseCenterX - buttonWidthScaled / 2;
    const buttonDrawY = baseCenterY - buttonHeightScaled / 2;

    ctx.save();
    ctx.shadowColor = BUTTON_SHADOW_COLOR;
    ctx.shadowBlur = BUTTON_SHADOW_BLUR;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = BUTTON_SHADOW_OFFSET_Y;
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
    ctx.restore();

    startScreenState.startButtonBounds = {
      x: buttonDrawX,
      y: buttonDrawY,
      w: buttonWidthScaled,
      h: buttonHeightScaled,
    };

    if (startScreenState.settingsOpen && startScreenState.startAssets.menuBg) {
      const overlay = getActiveControlsOverlay();
      overlay.setAssets({ bgImage: startScreenState.startAssets.menuBg, uiImage: startScreenState.startAssets.ui });
      overlay.render(ctx, canvas);
      setOverlayActive(true);
    }
  };

  const showLegalPage = (page) => {
    startScreenState.legalPage = page;
    startScreenState.legalScroll = 0;
    startScreenState.legalMaxScroll = 0;
    startScreenState.impressumLinkBounds = null;
    startScreenState.legalReturnBounds = null;
    startScreenState.settingsOpen = false;
    startScreenState.startButtonHover = false;
    setOverlayActive(false);
    canvas.style.cursor = "pointer";
    startScreenState.legalReturnHover = false;
    drawStartScreen();
  };

  const {
    handleClick,
    handleMove,
    handleLeave,
    handleSettingsClick,
    handleKeyDown,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = createStartScreenHandlers({
    canvas,
    settingsToggle,
    settingsLabel,
    settingsIcon,
    defaultSettingsLabel,
    settingsIconDefaultSrc,
    getActiveControlsOverlay,
    drawStartScreen,
    showLegalPage,
    stopMenuMusic,
    onStart,
    mobileAudioUnlock,
    state: startScreenState,
  });

  Promise.all([
    loadStartImage("./assets/img/canvas-start-game_BG.jpg"),
    loadStartImage("./assets/img/Gui/Game-UI.png"),
    loadStartImage("./assets/img/menu_BG.png"),
    loadFont("ComixLoud", "4rem"),
  ])
    .then(([bg, ui, menuBg, _fontLoaded]) => {
      startScreenState.startAssets = { bg, ui, menuBg };
      document.body?.classList.add("start-screen-active");
      drawStartScreen();
    })
    .catch((err) => console.error("Failed to load start assets", err));

  canvas.addEventListener("click", handleClick);
  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mouseleave", handleLeave);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd);
  canvas.addEventListener("touchcancel", handleTouchEnd);
  settingsToggle?.addEventListener("click", handleSettingsClick, true);
  window.addEventListener("keydown", handleKeyDown, true);
  impressumLink?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showLegalPage("impressum");
  });
  privacyPolicyLink?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showLegalPage("privacy");
  });
}
