export class DizzyEffect {
  constructor(x, y, frames) {
    this.x = x;
    this.y = y;
    this.frames = frames;

    this.current = 0;
    this.time = 0;
    this.frameDuration = 0.08;
    this.loops = 0;
    this.maxLoops = 2;
    this.finished = false;

    this.floatSpeed = -35;
    this.scale = 1.1;
  }

  update(dt) {
    if (this.finished) return;

    this.time += dt;
    this.y += this.floatSpeed * dt;

    if (this.time >= this.frameDuration) {
      this.time = 0;
      this.current++;

      if (this.current >= this.frames.length) {
        this.current = 0;
        this.loops++;
        if (this.loops >= this.maxLoops) {
          this.finished = true;
          return;
        }
      }
    }
  }

  render(ctx, camera) {
    if (this.finished) return;
    const img = this.frames[this.current];
    if (!img) return;

    const size = 60 * this.scale;
    ctx.drawImage(
      img,
      this.x - camera.x - size / 2,
      this.y - camera.y - size / 2,
      size,
      size
    );
  }
}

