import { Enemy1 } from "./enemy1.class.js";

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
    this.attack1Damage = 1;
    this.attack2Damage = 2;
    this.speed = (this.speed || 80) * 1.5;
    this.health = 6;
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
}

function loadFrames(path, prefix, count) {
  return [...Array(count)].map((_, i) => {
    const img = new Image();
    img.src = `${path}${prefix}${String(i).padStart(3, "0")}.png`;
    return img;
  });
}
