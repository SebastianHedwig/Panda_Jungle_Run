import { Enemy2 } from "./enemy2.class.js";
import { EnemyBase } from "./enemyBase.class.js";
import { ENEMY3_ATTACK1_DAMAGE, ENEMY3_ATTACK2_DAMAGE, ENEMY3_HEALTH, ENEMY3_SLIDE_DAMAGE, ENEMY3_COIN_DROP_COUNT, ENEMY3_GUN_DROP_COUNT, ENEMY3_SPEED, ENEMY3_SLIDE_SPEED, ENEMY_WIDTH, ENEMY_HEIGHT } from "../../../config/config.js";
import { loadFrames } from "../../../core/game/assets/assetLoader.js";

export function loadEnemy3Sprites() {
  const base = "assets/img/Enemies/Enemy_Sprites/Character-3/";
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
    super(x, y, buildEnemy3SpriteSet(sprites), world, ENEMY_WIDTH, ENEMY_HEIGHT);
    this.initializeEnemy3State(sprites);
  }

  initializeEnemy3State(sprites) {
    this.initializeEnemy3Frames(sprites);
    this.initializeEnemy3Damage();
    this.initializeEnemy3Movement();
    this.health = ENEMY3_HEALTH;
    this.slideCooldown = 0;
    this.slideCooldownDuration = 5;
    this.hasDroppedLoot = false;
  }

  initializeEnemy3Frames(sprites) {
    this.runFrames = sprites.run;
    this.walkFrames = sprites.run;
    this.attack1Frames = sprites.attack1;
    this.attack2Frames = sprites.attack2;
    this.slideFrames = sprites.slide;
  }

  initializeEnemy3Damage() {
    this.attack1Damage = ENEMY3_ATTACK1_DAMAGE;
    this.attack2Damage = ENEMY3_ATTACK2_DAMAGE;
    this.slideDamage = ENEMY3_SLIDE_DAMAGE;
    this.slideRange = 220;
    this.slideHeightTolerance = this.attackHeightTolerance + 10;
  }

  initializeEnemy3Movement() {
    this.speed = ENEMY3_SPEED;
    this.slideSpeed = ENEMY3_SLIDE_SPEED;
  }

  update(dt, player) {
    if (this.slideCooldown > 0) {
      this.slideCooldown = Math.max(0, this.slideCooldown - dt);
    }
    if (this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(ENEMY3_COIN_DROP_COUNT);
      this.dropGun();
      this.hasDroppedLoot = true;
    }
    super.update(dt, player);
  }

  tryStartAttack(playerInfo, player) {
    if (this.canStartSlideAttack(playerInfo, player)) return this.startSlideAttack(playerInfo, player);
    return super.tryStartAttack(playerInfo, player);
  }

  canStartSlideAttack(playerInfo, player) {
    if (!playerInfo || !player || player.isDead) return false;
    const deltaX = playerInfo.deltaX;
    const absoluteDeltaY = playerInfo.absoluteDeltaY;
    return this.onGround &&
      Math.abs(deltaX) > this.attackRange &&
      Math.abs(deltaX) <= this.slideRange &&
      absoluteDeltaY <= this.slideHeightTolerance &&
      this.slideCooldown <= 0;
  }

  startSlideAttack(playerInfo, player) {
    const deltaX = playerInfo.deltaX;
    const frames = this.slideFrames || this.attack2Frames || this.attack1Frames;
    this.startMeleeAttack(deltaX, frames, this.slideDamage, player, this.slideSpeed);
    this.slideCooldown = this.slideCooldownDuration;
    return true;
  }

  takeDamage(amount = 1, hitContext = {}) {
    const wasDead = this.isDead;
    EnemyBase.prototype.takeDamage.call(this, amount, hitContext);
    if (!wasDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(ENEMY3_COIN_DROP_COUNT);
      this.dropGun();
      this.hasDroppedLoot = true;
    }
  }

  dropGun(count = ENEMY3_GUN_DROP_COUNT) {
    this.dropCollectables("gun", count);
  }
}

function buildEnemy3SpriteSet(sprites) {
  return { ...sprites, walk: sprites.run, attack: sprites.attack1 };
}
