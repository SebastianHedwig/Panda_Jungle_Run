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
import { BOSS_MUSIC_PLAYBACK_RATE } from "../../config/config.js";

function buildBossDirectorConfig(options = {}) {
  const { world, camera, gameAudio, bossSprites, spawnTriggerOffset = BOSS_SPAWN_TRIGGER_OFFSET, spawnGroundOffset = BOSS_SPAWN_GROUND_OFFSET, spawnClearance = BOSS_SPAWN_CLEARANCE, movementMinX = BOSS_MOVE_MIN_X, movementMaxX = BOSS_MOVE_MAX_X, spawnShakeDuration = BOSS_SPAWN_SHAKE_DURATION, spawnShakeMagnitude = BOSS_SPAWN_SHAKE_MAGNITUDE } = options;
  return { world, camera, gameAudio, bossSprites, spawnTriggerX: WORLD_WIDTH - spawnTriggerOffset, spawnGroundOffset, spawnClearance, movementMinX, movementMaxX, spawnShakeDuration, spawnShakeMagnitude };
}

function buildBossDirectorState() {
  return { bossSpawned: false, bossRef: null, bossAudioPlayer: null };
}

export class BossDirector {
  constructor(options = {}) {
    Object.assign(this, buildBossDirectorConfig(options));
    Object.assign(this, buildBossDirectorState());
  }

  getBoss() {
    return this.bossRef;
  }

  update(dt, player) {
    if (!this.shouldProcessUpdate(player)) return null;
    if (this.shouldSpawnBoss(player)) this.spawnBoss(player);
    if (this.shouldHandleBossDefeat()) return this.handleBossDefeatResult();
    return null;
  }

  shouldProcessUpdate(player) {
    return Boolean(player && this.world);
  }

  shouldSpawnBoss(player) {
    return !this.bossSpawned && player.x >= this.spawnTriggerX;
  }

  shouldHandleBossDefeat() {
    return this.bossRef?.remove || (this.bossRef && this.bossRef.isDead && this.bossRef.health <= 0);
  }

  handleBossDefeatResult() {
    this.handleBossDefeat();
    return { cleared: true };
  }

  spawnBoss(player) {
    if (!this.bossSprites) return;
    const spawnPosition = this.getBossSpawnPosition(player);
    if (!spawnPosition) return;
    const { spawnX, spawnY, minX, maxX } = spawnPosition;
    const boss = this.createBoss(spawnX, spawnY, minX, maxX);
    this.registerBoss(boss);
    this.startBossAudio();
    this.shakeForSpawn();
  }

  getBossSpawnPosition(player) {
    const bossSpawnPlayerOffset = 1500;
    const minX = this.movementMinX;
    const maxX = this.movementMaxX;
    const desiredSpawn = player.x + bossSpawnPlayerOffset;
    const bossWidth = 240;
    const spawnX = Math.min(Math.max(desiredSpawn, minX), maxX - bossWidth);
    const bossHeight = 240;
    const platform = this.findSpawnPlatform(spawnX);
    if (!platform) return null;
    const groundTop = platform.top;
    const spawnY = Math.max(0, groundTop - bossHeight - this.spawnClearance + this.spawnGroundOffset);
    return { spawnX, spawnY, minX, maxX };
  }

  findSpawnPlatform(spawnX) {
    return this.world.platforms?.find(
      (platform) => platform.supportsLanding && spawnX >= platform.left && spawnX <= platform.right
    );
  }

  createBoss(spawnX, spawnY, minX, maxX) {
    const boss = new Boss(spawnX, spawnY, this.bossSprites, this.world);
    boss.movementMinX = minX;
    boss.movementMaxX = maxX;
    return boss;
  }

  registerBoss(boss) {
    this.world.addEnemies([boss]);
    this.bossRef = boss;
    this.bossSpawned = true;
  }

  startBossAudio() {
    this.gameAudio?.stopCrossfadeAndCleanup?.();
    this.bossAudioPlayer = new BossAudio({ playbackRate: BOSS_MUSIC_PLAYBACK_RATE });
    this.bossAudioPlayer.play();
    this.world.bossAudioPlayer = this.bossAudioPlayer;
  }

  shakeForSpawn() {
    this.camera?.shake?.(this.spawnShakeDuration, this.spawnShakeMagnitude);
  }

  handleBossDefeat() {
    this.handleBossAudioDefeat();
    this.clearBossRefs();
  }

  handleBossAudioDefeat() {
    if (!this.bossAudioPlayer) return;
    const defeatAudio = this.bossAudioPlayer.playDefeat?.();
    if (!defeatAudio) {
      this.bossAudioPlayer = null;
      return;
    }
    this.bindDefeatCleanup(defeatAudio);
  }

  bindDefeatCleanup(defeatAudio) {
    const onDefeatEnded = () => this.finishDefeatCleanup(defeatAudio);
    defeatAudio.addEventListener("ended", onDefeatEnded, { once: true });
  }

  finishDefeatCleanup(defeatAudio) {
    if (this.bossAudioPlayer?.defeatAudio === defeatAudio) {
      this.bossAudioPlayer = null;
    }
  }

  clearBossRefs() {
    this.world.bossAudioPlayer = null;
    this.bossRef = null;
  }
}
