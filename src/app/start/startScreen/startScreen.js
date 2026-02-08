import { createStartScreenHandlers } from "./startScreen.handler.js";
import { buildStartScreenContext, createLegalLinks, bindOverlayIconLoad, createStartScreenDependencies } from "./startScreen.context.js";
import { createDrawLegalPage, createShowLegalPage } from "./startScreen.legal.js";
import { createDrawStartScreen } from "./startScreen.render.js";
import { loadAndRenderStartAssets } from "./startScreen.assets.js";
import { bindStartScreenEvents } from "./startScreen.events.js";

export const AUTOSTART_KEY = "panda_autostart";
export const SETTINGS_ICON_DEFAULT_SRC = "./assets/icons/menu-100.png";
export const SETTINGS_ICON_CONTROLLER_SRC = "./assets/icons/controler.png";

export const TITLE_MAX_FONT_SIZE = 80;
export const TITLE_FONT_SCALE = 0.06;
export const TITLE_Y_RATIO = 0.22;
export const TITLE_FILL_COLOR = "rgb(0, 110, 110)";
export const TITLE_STROKE_COLOR = "rgba(0, 100, 100, 0.9)";
export const TITLE_SHADOW_COLOR = "rgba(255,255,255,0.7)";
export const TITLE_SHADOW_BLUR = 14;
export const TITLE_SHADOW_OFFSET_Y = 2;
export const TITLE_STROKE_WIDTH = 3;

export const LEGAL_RETURN_HOVER_SCALE = 1.02;
export const LEGAL_RETURN_COLOR = "rgb(0, 110, 110)";
export const LEGAL_RETURN_HOVER_COLOR = "rgba(255,255,255,0.8)";

export const START_BUTTON_SPRITE = { x: 525, y: 130, w: 360, h: 135 };
export const START_BUTTON_MAX_WIDTH = 260;
export const START_BUTTON_WIDTH_RATIO = 0.28;
export const START_BUTTON_BASE_Y_RATIO = 0.32;
export const START_BUTTON_Y_OFFSET = 138;
export const START_BUTTON_HOVER_SCALE = 1.2;
export const BUTTON_SHADOW_COLOR = "rgba(255,255,255,0.7)";
export const BUTTON_SHADOW_BLUR = 14;
export const BUTTON_SHADOW_OFFSET_Y = 2;

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
  bindStartScreenEvents({ ...handlers, ...startScreenContext, state: startScreenContext.startScreenState, showLegalPage, impressumLink, privacyPolicyLink });
}
