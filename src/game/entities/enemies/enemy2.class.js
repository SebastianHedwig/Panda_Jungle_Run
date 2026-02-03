import { Enemy1 } from "./enemy1.class.js";
import { EnemyBase } from "./enemyBase.class.js";
import { ENEMY2_ATTACK1_DAMAGE, ENEMY2_ATTACK2_DAMAGE, ENEMY2_HEALTH, ENEMY2_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT, ENEMY2_COIN_DROP_COUNT } from "../../../config/config.js";
import { loadFrames } from "../../../core/game/assets/assetLoader.js";

export function loadEnemy2Sprites() {
  const base = "assets/img/Enemies/Enemy_Sprites/Character-2/";
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
    super(x, y, buildEnemy2SpriteSet(sprites), world, ENEMY_WIDTH, ENEMY_HEIGHT);
    this.initializeEnemy2State(sprites);
  }

  initializeEnemy2State(sprites) {
    this.runFrames = sprites.run;
    this.walkFrames = sprites.run;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.attack1Damage = ENEMY2_ATTACK1_DAMAGE;
    this.attack2Damage = ENEMY2_ATTACK2_DAMAGE;
    this.speed = ENEMY2_SPEED;
    this.health = ENEMY2_HEALTH;
    this.hasDroppedLoot = false;
  }

  tryStartAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const deltaX = playerInfo.deltaX;
    const absoluteDeltaY = playerInfo.absoluteDeltaY;
    if (Math.abs(deltaX) <= this.attackRange && absoluteDeltaY <= this.attackHeightTolerance) {
      const attack2Probability = 0.5;
      const useSecond = Math.random() < attack2Probability;
      const frames = useSecond ? this.attack2Frames : this.attack1Frames;
      const damage = useSecond ? this.attack2Damage : this.attack1Damage;
      this.startMeleeAttack(deltaX, frames, damage, player);
      return true;
    }
    return false;
  }

  takeDamage(amount = 1, hitContext = {}) {
    const wasDead = this.isDead;
    EnemyBase.prototype.takeDamage.call(this, amount, hitContext);
    if (!wasDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(ENEMY2_COIN_DROP_COUNT);
      this.hasDroppedLoot = true;
    }
  }
}

function buildEnemy2SpriteSet(sprites) {
  return { ...sprites, walk: sprites.run, attack: sprites.attack1 };
}
