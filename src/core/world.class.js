import { WORLD_WIDTH } from "../config.js";

export class World {
  constructor(canvas) {
    this.canvas = canvas;

    this.width = WORLD_WIDTH;
    this.left = 0;
    this.right = this.width;

    this.baseGround = canvas.height;
    this.platforms = [];
  }

  addPlatforms(platforms) {
    this.platforms.push(...platforms);
    const floorTop = Math.max(...this.platforms.map(p => p.top));
    if (Number.isFinite(floorTop)) this.baseGround = floorTop;
  }

  applyPlatformCollisions(player) {
    let grounded = false;

    const prevBottom = player.y + player.height - player.vy;
    const currBottom = player.y + player.height;
    const currTop = player.y;

    for (const p of this.platforms) {
      const overlapsY = currBottom > p.top && currTop < p.bottom;
      const overlapsX = player.x + player.width > p.left && player.x < p.right;

      // ----- VERTIKALE KOLLISIONEN -----
      if (p.supportsLanding && overlapsY && overlapsX) {
        // ----- LANDEN -----
        if (
          player.vy > 0 &&
          prevBottom <= p.top &&
          currBottom >= p.top
        ) {
          player.y = p.top - player.height;
          player.vy = 0;
          player.onGround = true;
          grounded = true;
          continue;
        }

        // ----- KOPFSTOSS -----
        if (
          player.vy < 0 &&
          currTop <= p.bottom &&
          currTop - player.vy >= p.bottom
        ) {
          player.y = p.bottom;
          player.vy = 0;
          continue;
        }
      }

      // ----- SEITENWÄNDE -----

      if (p.hasSideWalls && overlapsY && currBottom > p.top + p.sideWallGap && player.vy >= 0) {
        // von links kommend
        if (
          player.x + player.width > p.left &&
          player.x <= p.left &&
          currBottom > p.top + p.cornerCutLeft * p.colliderHeight
        ) {
          player.x = p.left - player.width;
        }
        // von rechts kommend
        if (
          player.x < p.right &&
          player.x + player.width >= p.right &&
          currBottom > p.top + p.cornerCutRight * p.colliderHeight
        ) {
          player.x = p.right;
        }
      }
    }

    // ----- FALLBACK / TOD BEI STURZ -----
    if (!grounded) {
      player.onGround = false;
      if (currBottom >= this.canvas.height) {
        player.isDead = true; // mark death when leaving canvas bottom
      }
    }

    // ----- HORIZONTAL BOUNDS -----
    if (player.x < this.left) player.x = this.left;
    if (player.x > this.right - player.width)
      player.x = this.right - player.width;
  }
}
