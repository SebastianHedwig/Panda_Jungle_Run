import { Enemy1 } from "./enemy1.class.js";
import { CollectableItem } from "../../items/collectableItem.class.js";
import {
  ENEMY2_ATTACK1_DAMAGE,
  ENEMY2_ATTACK2_DAMAGE,
  ENEMY2_HEALTH,
} from "../../../config/config.js";

export function loadEnemy2Sprites() {
  const base = "assets/img/enemies/Enemy_Sprites/Character-2/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    run: loadFrames(`${base}run/`, "Run_", 8),
    attack1: loadFrames(`${base}attack-1/`, "Attack-1_", 8),
    attack2: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

export class Enemy2 extends Enemy1 {
  constructor(x, y, sprites, world = null) {
    super(x, y, { ...sprites, walk: sprites.run, attack: sprites.attack1 }, world);
    this.runFrames = sprites.run;
    this.walkFrames = sprites.run;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.attack1Damage = ENEMY2_ATTACK1_DAMAGE;
    this.attack2Damage = ENEMY2_ATTACK2_DAMAGE;
    this.speed = (this.speed || 80) * 1.5;
    this.health = ENEMY2_HEALTH;
    this.hasDroppedLoot = false;
  }

  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const dx = playerInfo.dx;
    const dy = playerInfo.absDy;
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
    super.takeDamage?.(amount, opts);
    if (!prevDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(4);
      this.hasDroppedLoot = true;
    }
  }

  dropCoins(count = 4) {
    if (!this.world?.collectables) return;
    const coins = [];
    const baseX = this.x + this.width / 2;
    const baseY = this.y + this.height * 0.2;
    for (let i = 0; i < count; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      const radius = 30 + Math.random() * 20;
      const angle = (Math.random() * Math.PI) / 6 + Math.PI / 3;
      const x = baseX + dir * radius * Math.cos(angle);
      const y = baseY - radius * Math.sin(angle);
      const vx = dir * (120 + Math.random() * 60);
      const vy = -(400 + Math.random() * 150);
      const c = new CollectableItem(x, y, "coin", this.world);
      c.startDrop(vx, vy);
      coins.push(c);
    }
    this.world.addCollectables
      ? this.world.addCollectables(coins)
      : this.world.collectables.push(...coins);
  }
}

function loadFrames(path, prefix, count) {
  return [...Array(count)].map((_, i) => {
    const img = new Image();
    img.src = `${path}${prefix}${String(i).padStart(3, "0")}.png`;
    return img;
  });
}
