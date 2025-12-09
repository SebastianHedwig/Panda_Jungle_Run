import { WORLD_WIDTH } from "../config.js";

export class World {
  constructor(canvas) {
    this.canvas = canvas;

    this.width = WORLD_WIDTH;
    this.left = 0;
    this.right = this.width;

    this.baseGround = canvas.height;

    /** ----- LEVEL OBJECTS ----- */
    this.platforms = [];
    this.collectables = [];
    this.hudPopups = [];

  }

  /** ---------- ADD PLATFORMS ---------- */
  addPlatforms(platforms) {
    this.platforms.push(...platforms);
    const floorTop = Math.max(...this.platforms.map(p => p.top));
    if (Number.isFinite(floorTop)) this.baseGround = floorTop;
  }

  /** ---------- ADD COLLECTABLES ---------- */
  addCollectables(items) {
    this.collectables.push(...items);
  }

  /** ---------- PLATFORM COLLISION LOGIC ---------- */
  applyPlatformCollisions(player) {
    let grounded = false;

    const prevBottom = player.y + player.height - player.vy;
    const currBottom = player.y + player.height;
    const currTop = player.y;

    for (const p of this.platforms) {
      const overlapsY = currBottom > p.top && currTop < p.bottom;
      const overlapsX = player.x + player.width > p.left && player.x < p.right;

      /** ----- LANDING / VERTICAL COLLISION ----- */
      if (p.supportsLanding && overlapsY && overlapsX) {
        // LANDING FROM ABOVE
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

        // HEAD BUMP FROM BELOW
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

      /** ----- SIDE WALLS ----- */
      if (p.hasSideWalls && overlapsY && currBottom > p.top + p.sideWallGap && player.vy >= 0) {
        // WALL FROM LEFT
        if (
          player.x + player.width > p.left &&
          player.x <= p.left &&
          currBottom > p.top + p.cornerCutLeft * p.colliderHeight
        ) {
          player.x = p.left - player.width;
        }
        // WALL FROM RIGHT
        if (
          player.x < p.right &&
          player.x + player.width >= p.right &&
          currBottom > p.top + p.cornerCutRight * p.colliderHeight
        ) {
          player.x = p.right;
        }
      }
    }

    /** ----- FALLBACK: WORLD LIMIT / DEATH ----- */
    player.handleFallOffWorld(grounded, currBottom, this.canvas.height);

    /** ----- HORIZONTAL BOUNDS ----- */
    if (player.x < this.left) player.x = this.left;
    if (player.x > this.right - player.width)
      player.x = this.right - player.width;
  }

  /** ---------- VALID COIN SPAWN CHECK ---------- */
coinPositionIsValid(x, y, width = 50, height = 50) {
  return !this.platforms.some(p => {
    const overlapsX = x + width > p.left && x < p.right;
    const coinBottom = y + height;
    const coinTop = y;
    const platformTop = p.top;
    const platformBottom = p.bottom;
    const overlapsY = coinBottom > platformTop && coinTop < platformBottom;
    return overlapsX && overlapsY;
  });
}

  /** ---------- ADD HUD POPUP ---------- */
addPopup(popup) {
  this.hudPopups.push(popup);
}

}