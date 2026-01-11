import { GAME_HEIGHT, GAME_WIDTH, MUTE_TOGGLE_GAMESTART } from "../../config/config.js";
import { GameAudio } from "../../game/audio/gameAudio.class.js";
import { ControlsOverlay } from "../ui/overlay/controlsOverlay.class.js";

export function setupStartScreen({
  canvasId = "game",
  onStart,
  preloadMuted = MUTE_TOGGLE_GAMESTART,
} = {}) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  const menuToggle = document.getElementById("menu-toggle");
  const menuLabel = menuToggle?.querySelector(".hud-label");
  const menuIcon = menuToggle?.querySelector("img");
  const defaultMenuLabel = menuLabel?.textContent ?? "settings";
  const menuIconMenuSrc = "./assets/icons/menu-100.png";
  const menuIconControllerSrc = "./assets/icons/controler.png";
  if (menuLabel) menuLabel.textContent = "controls";
  menuToggle?.classList.remove("menu-toggle--spin");
  if (menuIcon) {
    menuIcon.src = menuIconControllerSrc;
    menuIcon.alt = "Settings";
  }

  const controlsOverlay = new ControlsOverlay({ showBackButton: false });

  let startScreenActive = true;
  let startButtonBounds = null;
  let startButtonHover = false;
  let settingsOpen = false;
  let startAssets = null;
  let preloadedGameAudio = null;

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
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
      controlsOverlay.setAssets({ bgImage: startAssets.menuBg, uiImage: startAssets.ui });
      controlsOverlay.render(ctx, canvas);
    }
  };

  const handleClick = (event) => {
    if (!startScreenActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    if (settingsOpen) {
      if (controlsOverlay.handleClick(x, y)) {
        settingsOpen = false;
        controlsOverlay.clearPointer();
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
      menuToggle?.removeEventListener("click", handleSettingsClick, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      settingsOpen = false;
      canvas.style.cursor = "default";
      if (menuLabel) menuLabel.textContent = defaultMenuLabel;
      if (menuIcon) {
        menuIcon.src = menuIconMenuSrc;
        menuIcon.alt = "Settings";
      }
      menuToggle?.classList.add("menu-toggle--spin");
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
      controlsOverlay.setPointer(x, y);
      const hovering = controlsOverlay.isHovering();
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
      controlsOverlay.clearPointer();
      drawStartScreen();
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
    controlsOverlay.clearPointer();
    canvas.style.cursor = "default";
    drawStartScreen();
  };

  const handleKeyDown = (event) => {
    if (!startScreenActive || event.key !== "Escape") return;
    if (settingsOpen) {
      event.preventDefault();
      event.stopImmediatePropagation();
      settingsOpen = false;
      controlsOverlay.clearPointer();
      drawStartScreen();
    }
  };

  preloadStartAudio();
  Promise.all([
    loadImage("./assets/img/canvas-start-game_BG.jpg"),
    loadImage("./assets/img/Gui/Game-UI.png"),
    loadImage("./assets/img/menu_BG.png"),
    loadFont("ComixLoud", "4rem"),
  ])
    .then(([bg, ui, menuBg, _fontLoaded]) => {
      startAssets = { bg, ui, menuBg };
      drawStartScreen();
    })
    .catch((err) => console.error("Failed to load start assets", err));

  canvas.addEventListener("click", handleClick);
  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("mouseleave", handleLeave);
  menuToggle?.addEventListener("click", handleSettingsClick, true);
  window.addEventListener("keydown", handleKeyDown, true);
}
