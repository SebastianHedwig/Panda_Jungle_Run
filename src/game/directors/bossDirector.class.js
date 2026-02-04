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

/**
 * Builds boss director config. If omitted, default values are used.
 * Uses options to compute the result.
 * @param {Object} [options] Configuration options.
 */
function buildBossDirectorConfig(options = {}) {
  const { world, camera, gameAudio, bossSprites, spawnTriggerOffset = BOSS_SPAWN_TRIGGER_OFFSET, spawnGroundOffset = BOSS_SPAWN_GROUND_OFFSET, spawnClearance = BOSS_SPAWN_CLEARANCE, movementMinX = BOSS_MOVE_MIN_X, movementMaxX = BOSS_MOVE_MAX_X, spawnShakeDuration = BOSS_SPAWN_SHAKE_DURATION, spawnShakeMagnitude = BOSS_SPAWN_SHAKE_MAGNITUDE } = options;
  return { world, camera, gameAudio, bossSprites, spawnTriggerX: WORLD_WIDTH - spawnTriggerOffset, spawnGroundOffset, spawnClearance, movementMinX, movementMaxX, spawnShakeDuration, spawnShakeMagnitude };
}

/**
 * Builds boss director state.
 * Triggers audio playback or updates audio state.
 * @returns {Object} Boss director state.
 */
function buildBossDirectorState() {
  return { bossSpawned: false, bossRef: null, bossAudioPlayer: null };
}

export class BossDirector {
  /**
   * Creates a new instance. If omitted, default values are used.
   * Uses options to perform the operation.
   * @param {Object} [options] Configuration options.
   */
  constructor(options = {}) {
    Object.assign(this, buildBossDirectorConfig(options));
    Object.assign(this, buildBossDirectorState());
  }

  /**
   * Returns boss.
   * Updates the instance state.
   * @returns {*} Boss.
   */
  getBoss() {
    return this.bossRef;
  }

  /**
   * Updates.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {number} dt Delta time in seconds.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @returns {*} Result value.
   */
  update(dt, player) {
    if (!this.shouldProcessUpdate(player)) return null;
    if (this.shouldSpawnBoss(player)) this.spawnBoss(player);
    if (this.shouldHandleBossDefeat()) return this.handleBossDefeatResult();
    return null;
  }

  /**
   * Should process update.
   * Updates the instance state.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @returns {boolean} Whether process update.
   */
  shouldProcessUpdate(player) {
    return Boolean(player && this.world);
  }

  /**
   * Should spawn boss.
   * Updates the player state.
   * Spawns visual feedback effects.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @returns {boolean} Whether spawn boss.
   */
  shouldSpawnBoss(player) {
    return !this.bossSpawned && player.x >= this.spawnTriggerX;
  }

  /**
   * Should handle boss defeat.
   * Updates the instance state.
   * @returns {boolean} Whether handle boss defeat.
   */
  shouldHandleBossDefeat() {
    return this.bossRef?.remove || (this.bossRef && this.bossRef.isDead && this.bossRef.health <= 0);
  }

  /**
   * Handles boss defeat result.
   * Updates the instance state.
   * @returns {Object} Result value.
   */
  handleBossDefeatResult() {
    this.handleBossDefeat();
    return { cleared: true };
  }

  /**
   * Spawns boss.
   * Updates the instance state.
   * Spawns visual feedback effects.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   */
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

  /**
   * Returns boss spawn position.
   * Updates the player state.
   * Spawns visual feedback effects.
   * @param {import("../entities/player/player.class.js").Player} player Player instance.
   * @returns {Object} Boss spawn position.
   */
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

  /**
   * Find spawn platform.
   * Updates the world state.
   * Spawns visual feedback effects.
   * @param {number} spawnX Spawn X.
   * @returns {*} Result value.
   */
  findSpawnPlatform(spawnX) {
    return this.world.platforms?.find(
      (platform) => platform.supportsLanding && spawnX >= platform.left && spawnX <= platform.right
    );
  }

  /**
   * Creates boss.
   * Updates the boss state.
   * Spawns visual feedback effects.
   * @param {number} spawnX Spawn X.
   * @param {number} spawnY Spawn Y.
   * @param {number} minX Min X.
   * @param {number} maxX Max X.
   * @returns {*} Boss.
   */
  createBoss(spawnX, spawnY, minX, maxX) {
    const boss = new Boss(spawnX, spawnY, this.bossSprites, this.world);
    boss.movementMinX = minX;
    boss.movementMaxX = maxX;
    return boss;
  }

  /**
   * Register boss.
   * Updates the world state.
   * @param {import("../entities/boss/boss.class.js").Boss} boss Boss instance.
   */
  registerBoss(boss) {
    this.world.addEnemies([boss]);
    this.bossRef = boss;
    this.bossSpawned = true;
  }

  /**
   * Starts boss audio.
   * Triggers audio playback or updates audio state.
   * Updates the world state.
   */
  startBossAudio() {
    this.gameAudio?.stopCrossfadeAndCleanup?.();
    this.bossAudioPlayer = new BossAudio({ playbackRate: BOSS_MUSIC_PLAYBACK_RATE });
    this.bossAudioPlayer.play();
    this.world.bossAudioPlayer = this.bossAudioPlayer;
  }

  /**
   * Shake for spawn.
   * Updates the instance state.
   * Spawns visual feedback effects.
   */
  shakeForSpawn() {
    this.camera?.shake?.(this.spawnShakeDuration, this.spawnShakeMagnitude);
  }

  /**
   * Handles boss defeat.
   * Updates the instance state.
   */
  handleBossDefeat() {
    this.handleBossAudioDefeat();
    this.clearBossRefs();
  }

  /**
   * Handles boss audio defeat.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   */
  handleBossAudioDefeat() {
    if (!this.bossAudioPlayer) return;
    const defeatAudio = this.bossAudioPlayer.playDefeat?.();
    if (!defeatAudio) {
      this.bossAudioPlayer = null;
      return;
    }
    this.bindDefeatCleanup(defeatAudio);
  }

  /**
   * Binds defeat cleanup.
   * Binds ended event listeners.
   * Updates the instance state.
   * @param {*} defeatAudio Defeat audio.
   */
  bindDefeatCleanup(defeatAudio) {
    /**
     * On defeat ended.
     * Updates the instance state.
     * @returns {*} Result value.
     */
    const onDefeatEnded = () => this.finishDefeatCleanup(defeatAudio);
    defeatAudio.addEventListener("ended", onDefeatEnded, { once: true });
  }

  /**
   * Finish defeat cleanup.
   * Triggers audio playback or updates audio state.
   * Updates the instance state.
   * @param {*} defeatAudio Defeat audio.
   */
  finishDefeatCleanup(defeatAudio) {
    if (this.bossAudioPlayer?.defeatAudio === defeatAudio) {
      this.bossAudioPlayer = null;
    }
  }

  /**
   * Clears boss refs.
   * Triggers audio playback or updates audio state.
   * Updates the world state.
   */
  clearBossRefs() {
    this.world.bossAudioPlayer = null;
    this.bossRef = null;
  }
}
