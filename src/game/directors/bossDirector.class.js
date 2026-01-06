import {
  BOSS_MOVE_MAX_X,
  BOSS_MOVE_MIN_X,
  BOSS_SPAWN_CLEARANCE,
  BOSS_SPAWN_GROUND_OFFSET,
  BOSS_SPAWN_SHAKE_DURATION,
  BOSS_SPAWN_SHAKE_MAGNITUDE,
  BOSS_SPAWN_TRIGGER_OFFSET,
  WORLD_WIDTH,
} from "../../config/config.js";
import { Boss } from "../entities/boss/boss.class.js";
import { BossAudio } from "../audio/bossAudio.class.js";

export class BossDirector {
  constructor({
    world,
    camera,
    gameAudio,
    bossSprites,
    spawnTriggerOffset = BOSS_SPAWN_TRIGGER_OFFSET,
    spawnGroundOffset = BOSS_SPAWN_GROUND_OFFSET,
    spawnClearance = BOSS_SPAWN_CLEARANCE,
    moveMinX = BOSS_MOVE_MIN_X,
    moveMaxX = BOSS_MOVE_MAX_X,
    spawnShakeDuration = BOSS_SPAWN_SHAKE_DURATION,
    spawnShakeMagnitude = BOSS_SPAWN_SHAKE_MAGNITUDE,
  } = {}) {
    this.world = world;
    this.camera = camera;
    this.gameAudio = gameAudio;
    this.bossSprites = bossSprites;

    this.spawnTriggerX = WORLD_WIDTH - spawnTriggerOffset;
    this.spawnGroundOffset = spawnGroundOffset;
    this.spawnClearance = spawnClearance;
    this.moveMinX = moveMinX;
    this.moveMaxX = moveMaxX;
    this.spawnShakeDuration = spawnShakeDuration;
    this.spawnShakeMagnitude = spawnShakeMagnitude;

    this.bossSpawned = false;
    this.bossRef = null;
    this.bossAudioPlayer = null;
  }

  getBoss() {
    return this.bossRef;
  }

  update(dt, player) {
    if (!player || !this.world) return;

    if (!this.bossSpawned && player.x >= this.spawnTriggerX) {
      this.spawnBoss(player);
    }

    if (
      this.bossRef?.remove ||
      (this.bossRef && this.bossRef.isDead && this.bossRef.health <= 0)
    ) {
      this.handleBossDefeat();
    }
  }

  spawnBoss(player) {
    if (!this.bossSprites) return;
    const minX = this.moveMinX;
    const maxX = this.moveMaxX;
    const desiredSpawn = player.x + 1500;
    const bossWidth = 240;
    const spawnX = Math.min(Math.max(desiredSpawn, minX), maxX - bossWidth);
    const bossHeight = 240;
    const platform = this.world.platforms?.find(
      (p) => p.supportsLanding && spawnX >= p.left && spawnX <= p.right
    );
    const groundTop = platform?.top ?? this.world.baseGround ?? this.world.canvas?.height;
    const spawnY = Math.max(
      0,
      groundTop - bossHeight - this.spawnClearance + this.spawnGroundOffset
    );

    const boss = new Boss(spawnX, spawnY, this.bossSprites, this.world);
    boss.movementMinX = minX;
    boss.movementMaxX = maxX;
    this.world.addEnemies([boss]);
    this.bossRef = boss;
    this.bossSpawned = true;

    this.gameAudio?.stop?.();
    this.bossAudioPlayer = new BossAudio();
    this.bossAudioPlayer.play();
    this.world.bossAudioPlayer = this.bossAudioPlayer;

    this.camera?.shake?.(this.spawnShakeDuration, this.spawnShakeMagnitude);
  }

  handleBossDefeat() {
    if (this.bossAudioPlayer) {
      const defeatAudio = this.bossAudioPlayer.playDefeat?.();
      if (defeatAudio) {
        defeatAudio.addEventListener(
          "ended",
          () => {
            if (this.bossAudioPlayer?.defeatAudio === defeatAudio) {
              this.bossAudioPlayer = null;
            }
          },
          { once: true }
        );
      } else {
        this.bossAudioPlayer = null;
      }
    }
    this.world.bossAudioPlayer = null;
    this.bossRef = null;
  }
}
