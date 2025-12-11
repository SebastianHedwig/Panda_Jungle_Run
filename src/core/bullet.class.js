export class Bullet {
  constructor(x, y, direction, world) {
    this.x = x;
    this.y = y;
    this.vx = 900 * direction;

    this.width = 32;
    this.height = 16;
    this.scale = 1.2;

    this.direction = direction;
    this.world = world;
    this.remove = false;

    this.image = new Image();
    this.image.src = "assets/img/Bullets/Bullet-1.png";
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width * this.scale,
      height: this.height * this.scale,
    };
  }

  update(dt, enemies = []) {
    this.x += this.vx * dt;

    const bounds = this.getBounds();

    for (const p of this.world.platforms || []) {
      const hit =
        bounds.x < p.right &&
        bounds.x + bounds.width > p.left &&
        bounds.y < p.bottom &&
        bounds.y + bounds.height > p.top;

      if (hit) {
        this.remove = true;
        this.world.spawnExplosion(
          this.x + bounds.width / 2,
          this.y + bounds.height / 2
        );
        return;
      }
    }

    // OUT OF WORLD → remove
    if (this.x < -200 || this.x > this.world.width + 200) {
      this.remove = true;
      return;
    }

    // ENEMY COLLISION
    enemies.forEach((enemy) => {
      if (this.collidesWith(enemy)) {
        this.remove = true;
        this.world.spawnExplosion(this.x, this.y);
        enemy.takeDamage?.(2);
        if (!enemy.isDead && enemy.health > 0) {
          this.world.spawnHitEffect?.(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
          );
        }
      }
    });
  }

  collidesWith(obj) {
    const bounds = this.getBounds();
    const target = obj.getHitbox ? obj.getHitbox() : obj;
    return (
      bounds.x < target.x + target.width &&
      bounds.x + bounds.width > target.x &&
      bounds.y < target.y + target.height &&
      bounds.y + bounds.height > target.y
    );
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();

    // Flip when facing left
    if (this.direction === -1) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.image,
        -(sx + this.width * this.scale),
        sy,
        this.width * this.scale,
        this.height * this.scale
      );
    } else {
      ctx.drawImage(
        this.image,
        sx,
        sy,
        this.width * this.scale,
        this.height * this.scale
      );
    }

    ctx.restore();
  }
}

/* ===========================================================
   EXPLOSION ANIMATION – LASTS 7 FRAMES & REMOVES ITSELF
   =========================================================== */

export class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.frames = [];
    this.current = 0;
    this.time = 0;
    this.frameDuration = 0.06;
    this.scale = 1.6;
    this.finished = false;

    for (let i = 1; i <= 7; i++) {
      const img = new Image();
      img.src = `assets/img/Explosions/EXPLOSIONS${i}.png`;
      this.frames.push(img);
    }
  }

  update(dt) {
    this.time += dt;

    if (this.time >= this.frameDuration) {
      this.time = 0;
      this.current++;

      if (this.current >= this.frames.length) {
        this.finished = true;
        return;
      }
    }
  }

  render(ctx, camera) {
    if (this.finished) return;

    const img = this.frames[this.current];
    if (!img) return;

    const size = 64 * this.scale;
    ctx.drawImage(
      img,
      this.x - camera.x - size / 2,
      this.y - camera.y - size / 2,
      size,
      size
    );
  }
}
