import { EnemyBase, DEBUG_ENEMY_HITBOX } from "./enemyBase.class.js";
import { CollectableItem } from "../../items/collectableItem.class.js";
import {
  ENEMY1_DAMAGE,
  ENEMY1_HEALTH,
  ENEMY1_COIN_DROP_COUNT,
  ENEMY1_SPEED,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  FACING_LEFT,
  FACING_RIGHT,
  PLAYER_HURT_IMMUNITY_TIME,
} from "../../../config/config.js";
import { loadFrames } from "../../../core/game/assets/assetLoader.js";

export function loadEnemy1Sprites() {
  const base = "assets/img/Enemies/Enemy_Sprites/Character-1/";
  return {
    idle: loadFrames(`${base}idle/`, "Idle_", 12),
    walk: loadFrames(`${base}walk/`, "walk_", 10),
    attack: loadFrames(`${base}attack-2/`, "Attack-2_", 8),
    die: loadFrames(`${base}die/`, "Die_", 12),
  };
}

export class Enemy1 extends EnemyBase {
  constructor(
    x,
    y,
    sprites,
    world = null,
    width = ENEMY_WIDTH,
    height = ENEMY_HEIGHT
  ) {
    super(x, y, width, height, world);

    this.idleFrames = sprites.idle;
    this.walkFrames = sprites.walk;
    this.attackFrames = sprites.attack;
    this.dieFrames = sprites.die;

    this.currentAnimation = this.idleFrames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameSpeed = 0.09;
    this.sprite = this.currentAnimation[0];

    this.speed = ENEMY1_SPEED;
    this.health = ENEMY1_HEALTH;
    this.damage = ENEMY1_DAMAGE;
    this.attackDamageCurrent = this.damage;
    this.isDead = false;
    this.remove = false;
    this.deathDone = false;
    this.deathTimer = 0;
    this.blinkTimer = 0;
    this.isAttacking = false;
    this.attackDuration = 0.6;
    this.attackTimer = 0;

    this.attackRange = 60;
    this.attackHeightTolerance = 20;
    this.chaseRangeX = 300;
    this.chaseRangeXExit = 360;
    this.chaseRangeY = 200;
    this.chaseRangeYExit = 260;
    this.hasDroppedLoot = false;
  }
  
  setAnimation(frames) {
    if (!frames || this.currentAnimation === frames) return;
    this.currentAnimation = frames;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.sprite = this.currentAnimation[0];
  }

  animate(dt) {
    this.frameTime += dt;
    if (this.frameTime >= this.frameSpeed) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.currentAnimation.length;
      this.sprite = this.currentAnimation[this.currentFrame];
    }
  }

  update(dt, player) {
    if (this.isDead) {
      this.isChasing = false;
      if (!this.deathDone) {
        this.frameTime += dt;
        if (this.frameTime >= this.frameSpeed) {
          this.frameTime = 0;
          this.currentFrame = Math.min(
            this.currentFrame + 1,
            this.currentAnimation.length - 1
          );
          this.sprite = this.currentAnimation[this.currentFrame];
          if (this.currentFrame === this.currentAnimation.length - 1) {
            this.deathDone = true;
          }
        }
      }

      if (this.deathTimer > 0) {
        this.deathTimer = Math.max(0, this.deathTimer - dt);
      } else if (this.blinkTimer > 0) {
        this.blinkTimer = Math.max(0, this.blinkTimer - dt);
      } else {
        this.remove = true;
      }

      return;
    }

    if (this.recentSlideHit > 0) {
      this.recentSlideHit = Math.max(0, this.recentSlideHit - dt);
    }
    if (this.chaseCooldown > 0) {
      this.chaseCooldown = Math.max(0, this.chaseCooldown - dt);
    }

    if (this.hitStun > 0) {
      this.hitStun = Math.max(0, this.hitStun - dt);
      this.isChasing = false;
      // freeze on first idle frame (no animation) for clear feedback
      this.setAnimation(this.idleFrames);
      this.currentFrame = 0;
      this.sprite = this.idleFrames[0];
      return;
    }

    const playerInfo = this.getPlayerDelta(player);
    if (player?.isDead) {
      this.isChasing = false;
      this.isAttacking = false;
    }

    // ATTACK HANDLING
    if (this.isAttacking) {
      this.attackTimer -= dt;
      const attackFrames = this.activeAttackFrames || this.attackFrames;
      this.setAnimation(attackFrames);
      if (this.attackMoveSpeed) {
        const platform = this.getPlatformUnderfoot();
        const nextX = this.x + this.attackMoveSpeed * this.facing * dt;
        const nextFoot = nextX + this.width / 2;
        const hitsPlatformEdge =
          platform &&
          (nextFoot <= platform.left + this.edgeMargin ||
            nextFoot >= platform.right - this.edgeMargin);
        if (hitsPlatformEdge) {
          // stop sliding attack when reaching the edge
          this.isAttacking = false;
          this.attackMoveSpeed = 0;
          this.hasHitDuringAttack = false;
          this.setAnimation(this.idleFrames);
          this.currentFrame = 0;
        } else {
          this.x = nextX;
        }
      }
      this.animate(dt);

      this.tryDealAttackDamage(player, 0.2);

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.hasHitDuringAttack = false;
        this.attackMoveSpeed = 0;
        this.activeAttackFrames = null;
      }

      this.applyAttackPhysics(dt);
      this.isChasing = false;
      return;
    }

    // START ATTACK if player in range
    if (this.tryStartAttack(playerInfo, player)) return;

    const platform = this.getPlatformUnderfoot();
    this.currentPlatform = platform || null;
    const onLowestPlatform = this.isOnLowestPlatform();
    const fromChasing = this.isChasing;
    const chaseReady = this.chaseCooldown <= 0;
    const hasLivingPlayer = !!player && !player.isDead;
    const playerInRange = this.shouldChasePlayer(playerInfo, fromChasing);
    const canChase = chaseReady && hasLivingPlayer && playerInRange;
    const enemyCenterX = this.x + this.width / 2;
    const blockedByEdge =
      canChase &&
      onLowestPlatform &&
      platform &&
      ((playerInfo.deltaX < 0 &&
        enemyCenterX <= platform.left + this.edgeMargin) ||
        (playerInfo.deltaX > 0 &&
          enemyCenterX >= platform.right - this.edgeMargin));

    this.isChasing = canChase && !blockedByEdge;

    let moveDirection = this.lastMoveDirection;
    if (this.isChasing) {
      const deltaX = playerInfo.deltaX;
      const targetDirection =
        Math.abs(deltaX) < 1
          ? this.lastMoveDirection || this.facing || FACING_RIGHT
          : Math.sign(deltaX) || FACING_RIGHT;
      this.facing = targetDirection;
      moveDirection = targetDirection;
    } else {
      this.patrol();
      moveDirection = this.patrolDirection;
    }

    if (platform) {
      moveDirection = this.adjustForEdges(
        moveDirection,
        dt,
        platform,
        onLowestPlatform,
        fromChasing
      );
    }

    this.x += moveDirection * this.speed * dt;
    this.lastMoveDirection = moveDirection;

    const previousBottom = this.y + this.height;
    this.applyApexGravity(dt);
    const currentBottom = this.y + this.height;
    this.handlePlatformLanding(previousBottom, currentBottom);

    const playerCanBeHit =
      player &&
      !player.isDead &&
      !player.isSliding &&
      player.invulnerableTimer <= 0;
    const isColliding = playerCanBeHit && this.collidesWith(player);
    if (isColliding) {
      player.takeDamage?.(this.damage, { useDizzy: false });
      if (typeof player.invulnerableTimer === "number") {
        player.invulnerableTimer = Math.max(
          player.invulnerableTimer, PLAYER_HURT_IMMUNITY_TIME
        );
      }
    }

    this.setAnimation(this.walkFrames);
    this.animate(dt);
  }

  tryDealAttackDamage(player, popupDelay = 0) {
    if (!player || player.isDead || this.isDead || this.hasHitDuringAttack)
      return false;

    const enemyCenterX = this.x + this.width / 2;
    const enemyCenterY = this.y + this.height / 2;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const deltaX = playerCenterX - enemyCenterX;
    const absoluteDeltaY = Math.abs(playerCenterY - enemyCenterY);
    const facingMatches = Math.sign(deltaX || FACING_RIGHT) === this.facing;

    if (
      facingMatches &&
      Math.abs(deltaX) <= this.attackRange &&
      absoluteDeltaY <= this.attackHeightTolerance &&
      player.invulnerableTimer <= 0
    ) {
      if (player.isSliding) {
        return false;
      }

      const dmg = this.attackDamageCurrent ?? this.damage;
      player.takeDamage?.(dmg, { popupDelay });
      if (typeof player.invulnerableTimer === "number") {
        player.invulnerableTimer = Math.max(
          player.invulnerableTimer,
          PLAYER_HURT_IMMUNITY_TIME
        );
      }
      this.hasHitDuringAttack = true;
      return true;
    }

    return false;
  }

  render(ctx, camera) {
    if (this.isDead && this.deathTimer === 0 && this.blinkTimer > 0) {
      const blinkInterval = 0.3;
      const blinkPhaseModulo = 2;
      const blinkPhase = Math.floor(this.blinkTimer / blinkInterval) % blinkPhaseModulo;
      const isInvisiblePhase = blinkPhase === 0;
      if (isInvisiblePhase) return;
    }

    ctx.save();
    const isMirroredFacing = this.facing === FACING_LEFT;
    if (isMirroredFacing) ctx.scale(-1, 1);

    const enemyScreenX = this.x - camera.x;
    const enemyScreenY = this.y - camera.y;
    const spriteDrawX = isMirroredFacing
      ? -(enemyScreenX + this.width)
      : enemyScreenX;
    const spriteDrawY = enemyScreenY;

    ctx.drawImage(this.sprite, spriteDrawX, spriteDrawY, this.width, this.height);

    if (DEBUG_ENEMY_HITBOX) {
      const hitbox = this.getHitbox();
      const hitboxScreenX = hitbox.x - camera.x;
      const hitboxScreenY = hitbox.y - camera.y;
      const hitboxDrawX = isMirroredFacing
        ? -(hitboxScreenX + hitbox.width)
        : hitboxScreenX;
      const hitboxDrawY = hitboxScreenY;
      ctx.strokeStyle = "rgba(0,120,255,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height);
    }

    ctx.restore();
  }

  takeDamage(amount = 1, hitContext = {}) {
    const prevDead = this.isDead;
    super.takeDamage?.(amount, hitContext);
    if (!prevDead && this.isDead && !this.hasDroppedLoot) {
      this.dropCoins(ENEMY1_COIN_DROP_COUNT);
      this.hasDroppedLoot = true;
    }
  }
}
