import { createGame } from "./game/createGame/createGame.js";

const game = createGame({ canvasId: "game" });

/**
 * Initializes game.
 */
export function initGame() {
  game.init();
}

/**
 * Sets paused.
 * Used to support gameplay flow.
 * Uses paused to perform the operation.
 * @param {boolean} paused Paused.
 */
export function setPaused(paused) {
  game.setPaused(paused);
}

/**
 * Returns paused.
 * Used to provide paused for gameplay flow.
 * @returns {*} Paused.
 */
export function getPaused() {
  return game.getPaused();
}

