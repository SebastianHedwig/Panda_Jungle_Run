const DEFAULT_FRAME_DURATION = 0.08;
const MAX_ANIMATION_LOOPS = 2;
const FLOAT_SPEED_PER_SECOND = -35;
const INITIAL_SCALE_FACTOR = 1.1;
const BASE_SPRITE_SIZE = 60;

export class DizzyEffect {
  constructor(x, y, frames) {
    this.x = x;
    this.y = y;
    this.frames = frames;

    this.currentFrameIndex = 0;
    this.frameElapsed = 0;
    this.frameDuration = DEFAULT_FRAME_DURATION;
    this.completedLoops = 0;
    this.maxLoops = MAX_ANIMATION_LOOPS;
    this.isFinished = false;

    this.floatSpeed = FLOAT_SPEED_PER_SECOND;
    this.scaleFactor = INITIAL_SCALE_FACTOR;
  }

  update(dt) {
    if (this.isFinished) return;

    this.frameElapsed += dt;
    this.y += this.floatSpeed * dt;

    if (this.frameElapsed >= this.frameDuration) {
      this.frameElapsed = 0;
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.frames.length) {
        this.currentFrameIndex = 0;
        this.completedLoops++;
        if (this.completedLoops >= this.maxLoops) {
          this.isFinished = true;
          return;
        }
      }
    }
  }

  render(ctx, camera) {
    if (this.isFinished) return;
    const img = this.frames[this.currentFrameIndex];
    if (!img) return;

    const size = BASE_SPRITE_SIZE * this.scaleFactor;
    ctx.drawImage(
      img,
      this.x - camera.x - size / 2,
      this.y - camera.y - size / 2,
      size,
      size
    );
  }
}
