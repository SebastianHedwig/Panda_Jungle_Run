import {
  setupCanvas,
  setupCoreSystems,
  setupAudio,
  getMusicReadyPromise,
  startLoadingRender,
  getAssetsReady,
  startWhenReady,
  init,
} from "./createGame.setup.js";
import {
  setPaused,
  getPaused,
  setSettingsOpen,
  getCanvasPointer,
  setGameWonPointer,
  setGameOverPointer,
  setMenuPointer,
  applyMenuPointer,
  updateSettingsPointer,
  clearSettingsPointer,
  handleGameOverlayAction,
  handleEndGameClick,
  stopMenuClickEvent,
  handleMenuClick,
  handleQuit,
  handleRetry,
  addMenuListeners,
} from "./createGame.menu.js";
import {
  getBackgroundAssets,
  addParallaxLayers,
  setupBackgroundAssets,
  setupWorldPlatforms,
  getCollectables,
  addCollectables,
  placePickups,
  placeEnemies,
  getSpawnPosition,
  getPlayerFrames,
  createPlayerInstance,
  handlePlayerDeath,
  setupPlayer,
  setupBossDirector,
  setupHud,
  setupMenu,
  setupOverlays,
  startGameplayLoop,
  start,
} from "./createGame.world.js";
import {
  loopHighRes,
  setGameWonState,
  handleBossUpdate,
  updatePlayerAndCamera,
  updateCollectableEntities,
  updateEnemiesAndProjectiles,
  updateWorldEntities,
  updateHudPopups,
  update,
  checkCollectables,
} from "./createGame.loop.js";
import {
  setCanvasCursorDefault,
  setOverlayActiveState,
  clearCanvas,
  renderPlatforms,
  renderCollectables,
  renderHudPopups,
  renderWorld,
  renderHud,
  renderGameWonOverlay,
  renderGameOverOverlay,
  renderEndGameOverlay,
  renderPausedMenu,
  draw,
} from "./createGame.render.js";
import {
  updateLoadingTime,
  drawLoadingBackdrop,
  getLoadingSpinnerState,
  drawLoadingSpinner,
  drawLoadingText,
  renderLoading,
} from "./createGame.loading.js";

const MAX_FRAME_TIME = 0.05;
const CAMERA_FOLLOW_LERP = 0.08;
const PLAYER_SPAWN_X = 25;
const PLAYER_SPAWN_HEIGHT_RATIO = 0.5;
const PLAYER_SPAWN_GROUND_OFFSET = 200;
const PARALLAX_LAYERS = [
  { imageIndex: 0, parallaxFactor: 0.1, swaySpeed: 0.01 },
  { imageIndex: 1, parallaxFactor: 0.3, swaySpeed: 0.03 },
  { imageIndex: 2, parallaxFactor: 0.6, swaySpeed: 0.06 },
  { imageIndex: 3, parallaxFactor: 1.0, swaySpeed: 0.1 },
];
const LOADING_SPINNER_ROTATE_MS = 500;
const LOADING_ARC_SWEEP = Math.PI * 1.5;
const LOADING_STROKE_WIDTH = 8;
const LOADING_FILL_STYLE = "rgba(10, 16, 20, 0.85)";
const LOADING_STROKE_STYLE = "rgba(0, 200, 200, 0.9)";
const LOADING_TEXT_COLOR = "#e5f7ff";
const LOADING_FONT = "32px ComixLoud, sans-serif";
const LOADING_TEXT_OFFSET_Y = 80;
const FULL_CIRCLE_RADIANS = Math.PI * 2;

/**
 * Creates game. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 * @param {string} [options.canvasId] Canvas element id.
 */
export function createGame({ canvasId = "game" } = {}) {
  const state = {
    canvasId,
    canvas: null,
    ctx: null,
    background: null,
    camera: null,
    player: null,
    input: null,
    world: null,
    lastTimeHigh: 0,
    audio: null,
    isLoading: true,
    loadingAnimTime: 0,
    isPaused: false,
    menuPointer: null,
    hud: null,
    menu: null,
    bossDirector: null,
    gameOverOverlay: null,
    gameWonOverlay: null,
    isGameOver: false,
    isGameWon: false,
    MAX_FRAME_TIME,
    CAMERA_FOLLOW_LERP,
    PLAYER_SPAWN_X,
    PLAYER_SPAWN_HEIGHT_RATIO,
    PLAYER_SPAWN_GROUND_OFFSET,
    PARALLAX_LAYERS,
    LOADING_SPINNER_ROTATE_MS,
    LOADING_ARC_SWEEP,
    LOADING_STROKE_WIDTH,
    LOADING_FILL_STYLE,
    LOADING_STROKE_STYLE,
    LOADING_TEXT_COLOR,
    LOADING_FONT,
    LOADING_TEXT_OFFSET_Y,
    FULL_CIRCLE_RADIANS,
  };

  Object.assign(state, {
    setupCanvas,
    setupCoreSystems,
    setupAudio,
    getMusicReadyPromise,
    startLoadingRender,
    getAssetsReady,
    startWhenReady,
    init,
    setPaused,
    getPaused,
    setSettingsOpen,
    getCanvasPointer,
    setGameWonPointer,
    setGameOverPointer,
    setMenuPointer,
    applyMenuPointer,
    updateSettingsPointer,
    clearSettingsPointer,
    handleGameOverlayAction,
    handleEndGameClick,
    stopMenuClickEvent,
    handleMenuClick,
    handleQuit,
    handleRetry,
    addMenuListeners,
    getBackgroundAssets,
    addParallaxLayers,
    setupBackgroundAssets,
    setupWorldPlatforms,
    getCollectables,
    addCollectables,
    placePickups,
    placeEnemies,
    getSpawnPosition,
    getPlayerFrames,
    createPlayerInstance,
    handlePlayerDeath,
    setupPlayer,
    setupBossDirector,
    setupHud,
    setupMenu,
    setupOverlays,
    startGameplayLoop,
    start,
    loopHighRes,
    setGameWonState,
    handleBossUpdate,
    updatePlayerAndCamera,
    updateCollectableEntities,
    updateEnemiesAndProjectiles,
    updateWorldEntities,
    updateHudPopups,
    update,
    checkCollectables,
    setCanvasCursorDefault,
    setOverlayActiveState,
    clearCanvas,
    renderPlatforms,
    renderCollectables,
    renderHudPopups,
    renderWorld,
    renderHud,
    renderGameWonOverlay,
    renderGameOverOverlay,
    renderEndGameOverlay,
    renderPausedMenu,
    draw,
    updateLoadingTime,
    drawLoadingBackdrop,
    getLoadingSpinnerState,
    drawLoadingSpinner,
    drawLoadingText,
    renderLoading,
  });

  bindMethods(state);
  return { init: state.init, setPaused: state.setPaused, getPaused: state.getPaused };
}

/**
 * Binds methods.
 * Uses state to perform the operation.
 * @param {Object} state State.
 */
function bindMethods(state) {
  Object.keys(state).forEach((key) => {
    if (typeof state[key] === "function") {
      state[key] = state[key].bind(state);
    }
  });
}
