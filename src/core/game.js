import { createGame } from "./game/createGame.js";

const game = createGame({ canvasId: "game" });

export function initGame() {
  game.init();
}

export function setPaused(paused) {
  game.setPaused(paused);
}

export function getPaused() {
  return game.getPaused();
}

