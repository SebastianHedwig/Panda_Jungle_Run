import { GAME_HEIGHT, GAME_WIDTH, MUTE_TOGGLE_GAMESTART } from "../../config/config.js";
import { GameAudio } from "../../game/audio/gameAudio.class.js";
import { ControlsOverlay } from "../ui/overlay/controlsOverlay.class.js";
import { ControlsOverlayMobile } from "../ui/overlay/controlsOverlayMobile.class.js";
import { loadImage, waitForImage } from "../../core/game/assets/assetLoader.js";

export function setupStartScreen({
  canvasId = "game",
  onStart,
  preloadMuted = MUTE_TOGGLE_GAMESTART,
} = {}) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  const autoStart = (() => {
    try {
      return window.localStorage?.getItem?.("panda_autostart") === "1";
    } catch (_err) {
      return false;
    }
  })();
  if (autoStart) {
    try {
      window.localStorage?.removeItem?.("panda_autostart");
    } catch (_err) {}
    onStart?.();
    return;
  }

  const settingsToggle = document.getElementById("settings-toggle");
  const settingsLabel = settingsToggle?.querySelector(".hud-label");
  const settingsIcon = settingsToggle?.querySelector("img");
  const defaultSettingsLabel = settingsLabel?.textContent ?? "settings";
  const settingsIconDefaultSrc = "./assets/icons/menu-100.png";
  const settingsIconControllerSrc = "./assets/icons/controler.png";
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

  const setOverlayActive = (active) => {
    document.body?.classList.toggle("overlay-active", active);
  };

  const getActiveControlsOverlay = () => {
    const container = document.getElementById("game-container");
    const useMobile = container?.classList?.contains("auto-fullscreen");
    return useMobile ? controlsOverlayMobile : controlsOverlayDesktop;
  };

  let startScreenActive = true;
  let startButtonBounds = null;
  let startButtonHover = false;
  let settingsOpen = false;
  let startAssets = null;
  let preloadedGameAudio = null;

  const loadStartImage = (src) =>
    waitForImage(loadImage(src)).then(({ ok, img }) => {
      if (!ok) throw new Error(`Failed to load ${src}`);
      return img;
    });

  const loadFont = (family, descriptor = "1rem") => {
    if (!document.fonts?.load) return Promise.resolve(false);
    return document.fonts.load(`${descriptor} "${family}"`).catch(() => false);
  };

  const preloadStartAudio = () => {
    if (preloadedGameAudio) return;
    preloadedGameAudio = new GameAudio();
    preloadedGameAudio
      .init()
      .then(() => {
        if (!preloadMuted) {
          preloadedGameAudio?.play?.();
        } else {
          preloadedGameAudio?.audio?.pause?.();
        }
      })
      .catch(() => {});
  };

  const drawStartScreen = () => {
    if (!startAssets) return;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    const { bg, ui } = startAssets;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width / bg.width, canvas.height / bg.height);
    const drawW = bg.width * scale;
    const drawH = bg.height * scale;
    const dx = (canvas.width - drawW) / 2;
    const dy = (canvas.height - drawH) / 2;
    ctx.drawImage(bg, dx, dy, drawW, drawH);

    const title = "Panda Jungle Run";
    ctx.font = `small-caps ${Math.min(80, canvas.width * 0.06)}px "ComixLoud", sans-serif`;
    ctx.fillStyle = "rgb(0, 110, 110)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,255,255,0.7)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 100, 100, 0.9)";
    ctx.strokeText(title, canvas.width / 2, canvas.height * 0.22);
    ctx.fillText(title, canvas.width / 2, canvas.height * 0.22);
    ctx.shadowBlur = 0;

    const src = { x: 525, y: 130, w: 360, h: 135 };
    const buttonWidth = Math.min(canvas.width * 0.28, 260);
    const buttonHeight = (src.h / src.w) * buttonWidth;
    const baseCenterX = (canvas.width - buttonWidth) / 2 + buttonWidth / 2;
    const baseCenterY = canvas.height * 0.32 + 170 + buttonHeight / 2;
    const hoverScale = startButtonHover ? 1.2 : 1;
    const btnW = buttonWidth * hoverScale;
    const btnH = buttonHeight * hoverScale;
    const drawX = baseCenterX - btnW / 2;
    const drawY = baseCenterY - btnH / 2;

    ctx.save();
    ctx.shadowColor = "rgba(255,255,255,0.7)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(ui, src.x, src.y, src.w, src.h, drawX, drawY, btnW, btnH);
    ctx.restore();

    startButtonBounds = { x: drawX, y: drawY, w: btnW, h: btnH };

    if (settingsOpen && startAssets.menuBg) {
      const overlay = getActiveControlsOverlay();
      overlay.setAssets({ bgImage: startAssets.menuBg, uiImage: startAssets.ui });
      overlay.render(ctx, canvas);
      setOverlayActive(true);
    }
  };

  const handleClick = (event) => {
    if (!startScreenActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    if (settingsOpen) {
      const overlay = getActiveControlsOverlay();
      if (overlay.handleClick(x, y)) {
        settingsOpen = false;
        overlay.clearPointer();
        setOverlayActive(false);
        canvas.style.cursor = "default";
        drawStartScreen();
      }
      return;
    }

    if (!startButtonBounds) return;
    const { x: bx, y: by, w, h } = startButtonBounds;
    const inside = x >= bx && x <= bx + w && y >= by && y <= by + h;
    if (inside) {
      startScreenActive = false;
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      settingsToggle?.removeEventListener("click", handleSettingsClick, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      settingsOpen = false;
      setOverlayActive(false);
      document.body?.classList.remove("start-screen-active");
      canvas.style.cursor = "default";
      if (settingsLabel) settingsLabel.textContent = defaultSettingsLabel;
      if (settingsIcon) {
        settingsIcon.src = settingsIconDefaultSrc;
        settingsIcon.alt = "Settings";
      }
      settingsToggle?.classList.add("settings-toggle--spin");
      if (preloadedGameAudio?.audio) {
        preloadedGameAudio.audio.pause();
        preloadedGameAudio.audio.currentTime = 0;
      }
      onStart?.();
    }
  };

  const handleMove = (event) => {
    if (!startScreenActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    if (settingsOpen) {
      const overlay = getActiveControlsOverlay();
      overlay.setPointer(x, y);
      const hovering = overlay.isHovering();
      canvas.style.cursor = hovering ? "pointer" : "default";
      drawStartScreen();
      return;
    }

    if (!startButtonBounds) return;
    const { x: bx, y: by, w, h } = startButtonBounds;
    const inside = x >= bx && x <= bx + w && y >= by && y <= by + h;
    if (inside !== startButtonHover) {
      startButtonHover = inside;
      canvas.style.cursor = inside ? "pointer" : "default";
      drawStartScreen();
    } else if (inside) {
      canvas.style.cursor = "pointer";
    }
  };

  const handleLeave = () => {
    if (!startScreenActive) return;
    if (settingsOpen) {
      const overlay = getActiveControlsOverlay();
      overlay.clearPointer();
      drawStartScreen();
      setOverlayActive(true);
      canvas.style.cursor = "default";
      return;
    }
    if (startButtonHover) {
      startButtonHover = false;
      drawStartScreen();
    }
    canvas.style.cursor = "default";
  };

  const handleSettingsClick = (event) => {
    if (!startScreenActive) return;
    event?.preventDefault();
    event?.stopImmediatePropagation();
    settingsOpen = !settingsOpen;
    startButtonHover = false;
    const overlay = getActiveControlsOverlay();
    overlay.clearPointer();
    canvas.style.cursor = "default";
    setOverlayActive(settingsOpen);
    drawStartScreen();
  };

  const handleKeyDown = (event) => {
    if (!startScreenActive || event.key !== "Escape") return;
    if (settingsOpen) {
      event.preventDefault();
      event.stopImmediatePropagation();
      settingsOpen = false;
      const overlay = getActiveControlsOverlay();
      overlay.clearPointer();
      setOverlayActive(false);
      drawStartScreen();
    }
  };

  preloadStartAudio();
  Promise.all([
    loadStartImage("./assets/img/canvas-start-game_BG.jpg"),
    loadStartImage("./assets/img/Gui/Game-UI.png"),
    loadStartImage("./assets/img/menu_BG.png"),
    loadFont("ComixLoud", "4rem"),
  ])
    .then(([bg, ui, menuBg, _fontLoaded]) => {
      startAssets = { bg, ui, menuBg };
      document.body?.classList.add("start-screen-active");
      drawStartScreen();
    })
    .catch((err) => console.error("Failed to load start assets", err));

  canvas.addEventListener("click", handleClick);
  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mouseleave", handleLeave);
  settingsToggle?.addEventListener("click", handleSettingsClick, true);
  window.addEventListener("keydown", handleKeyDown, true);
}
