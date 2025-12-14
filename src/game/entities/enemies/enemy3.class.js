import { Enemy2 } from "./enemy2.class.js";
import { EnemyBase } from "./enemyBase.class.js";
import { CollectableItem } from "../../items/collectableItem.class.js";

export function loadEnemy3Sprites() {
  const base = "assets/img/enemies/Enemy_Sprites/Character-3/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    run: loadFrames(`${base}run/`, "Run_", 8),
    attack1: loadFrames(`${base}attack-1/`, "Attack-1_", 8),
    attack2: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    slide: loadFrames(`${base}slide/`, "Slide_", 4),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

export class Enemy3 extends Enemy2 {
  constructor(x, y, sprites, world = null) {
    super(x, y, { ...sprites, walk: sprites.run, attack: sprites.attack1 }, world);
    this.runFrames = sprites.run;
    this.walkFrames = sprites.run;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.slideFrames = sprites.slide;
    this.attack1Damage = 1;
    this.attack2Damage = 2;
    this.slideDamage = 2;
    this.slideRange = 220;
    this.slideHeightTolerance = this.attackHeightTolerance + 10;
    this.slideSpeed = (this.speed || 80) * 1.8;
    this.health = 8;
    this.slideCooldown = 0;
    this.slideCooldownDuration = 5;
    this.hasDroppedLoot = false;
  }

  update(dt, player) {
    if (this.slideCooldown > 0) {
      this.slideCooldown = Math.max(0, this.slideCooldown - dt);
    }
    if (this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(4);
      this.dropGun();
      this.hasDroppedLoot = true;
    }
    super.update(dt, player);
  }

  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const dx = playerInfo.dx;
    const dy = playerInfo.absDy;

    if (
      this.onGround &&
      Math.abs(dx) > this.attackRange &&
      Math.abs(dx) <= this.slideRange &&
      dy <= this.slideHeightTolerance &&
      this.slideCooldown <= 0
    ) {
      const frames = this.slideFrames || this.attack2Frames || this.attack1Frames;
      this.startMeleeAttack(dx, frames, this.slideDamage, player, this.slideSpeed);
      this.slideCooldown = this.slideCooldownDuration;
      return true;
    }

    if (Math.abs(dx) <= this.attackRange && dy <= this.attackHeightTolerance) {
      const useSecond = Math.random() < 0.5;
      const frames = useSecond ? this.attack2Frames : this.attack1Frames;
      const damage = useSecond ? this.attack2Damage : this.attack1Damage;
      this.startMeleeAttack(dx, frames, damage, player);
      return true;
    }

    return false;
  }

  takeDamage(amount = 1, opts = {}) {
    const prevDead = this.isDead;
    EnemyBase.prototype.takeDamage.call(this, amount, opts);
    if (!prevDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(4);
      this.dropGun();
      this.hasDroppedLoot = true;
    }
  }

  dropGun() {
    if (!this.world?.collectables) return;
    const baseX = this.x + this.width / 2;
    const baseY = this.y + this.height * 0.2;
    const gun = new CollectableItem(baseX, baseY, "gun", this.world);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const vx = dir * (120 + Math.random() * 60);
    const vy = -(400 + Math.random() * 150);
    gun.startDrop(vx, vy);
    this.world.addCollectables
      ? this.world.addCollectables([gun])
      : this.world.collectables.push(gun);
  }
}

function loadFrames(path, prefix, count) {
  return [...Array(count)].map((_, i) => {
    const img = new Image();
    img.src = `${path}${prefix}${String(i).padStart(3, "0")}.png`;
    return img;
  });
}
