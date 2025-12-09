import { PlatformBuilder } from "../engine/platformBuilder.class.js";
import { CollectableItem } from "../core/collectableItems.class.js";
import { WORLD_WIDTH } from "../config.js";

/** ---------- PLATFORM SETUP ---------- */
export function createLevel1Platforms(sprites) {
  const platforms = [];
  const build = new PlatformBuilder(platforms, sprites);

  /* ---- BASE GROUND ---- */
  build.add("middleLong", 0, 650);
  build.add("middleLong", 1360, 650);
  build.add("middleShort", 2520, 450);
  build.add("endLong", 2968, 650);
  build.stackFiller(2520, 465, 3, 2, sprites["filler"].width - 6);
  build.row(4250, 650, 2, "middleLong");
  build.stackFiller(4022, 265, 10, 1, sprites["filler"].width);
  build.add("startLong", 7100, 500);
  build.add("endLong", 7550, 500);
  build.stackFiller(7150, 515, 3, 4, sprites["filler"].width - 1);
  build.row(8350, 650, 2, "middleLong");

  /* ---- HIGHER LVL PLATFORMS ---- */
  build.add("startLong", 260, 250);
  build.add("endLong", 810, 250);

  build.add("startLong", 3950, 250);
  build.add("endLong", 4500, 250);

  build.add("startLong", 5500, 380);
  build.add("endLong", 6200, 300);

  /* ---- FLOATING ISLANDS ---- */
  build.islandSmall(1600, 400);
  build.islandSmall(3200, 350);
  build.islandSmall(3500, 250);
  build.islandSmall(3750, 500);
  build.islandSmall(6750, 550);
  build.islandSmall(7000, 350);
  build.islandSmall(7400, 200);
  build.islandSmall(8200, 300);
  build.islandSmall(9300, 350);
  build.islandSmall(9800, 300);

  return platforms;
}

/** ---------- PLAYER SPEED → COIN SPACING ---------- */
export function getCoinSpacing(playerSpeed) {
  if (playerSpeed < 200) return 60;
  if (playerSpeed < 350) return 85;
  return 120;
}

/** ---------- RANDOM + PLATFORM COINS ---------- */
export function generateCoinsMixed(
  world,
  totalCount = 20,
  ratioAbovePlatforms = 0.5
) {
  const coins = [];
  const coinsAbove = Math.floor(totalCount * ratioAbovePlatforms);

  /** ----- COINS ÜBER PLATTFORMEN ----- */
  for (let i = 0; i < coinsAbove; i++) {
    const platform =
      world.platforms[Math.floor(Math.random() * world.platforms.length)];
    const width = platform.right - platform.left;

    if (width < 100) continue;

    const x = platform.left + Math.random() * (width - 60);
    const y = platform.top - 70;

    if (world.coinPositionIsValid(x, y, 50, 50)) {
      coins.push(new CollectableItem(x, y, "coin"));
    }
  }

  /** ----- RANDOM COINS, ABER NIE IN PLATFORMEN ----- */
  let tries = 0;
  while (coins.length < totalCount && tries < totalCount * 40) {
    const x = Math.random() * (world.width - 200) + 100;
    const y = 220 + Math.random() * 380;

    if (world.coinPositionIsValid(x, y, 50, 50)) {
      coins.push(new CollectableItem(x, y, "coin"));
    }

    tries++;
  }

  return coins;
}

/** ---------- COIN ARCS NUR BEI ECHTEN SPRÜNGEN ---------- */
export function generateCoinArcs(world, maxArcs = 4) {
  const arcs = [];
  let created = 0;

  const platforms = world.platforms.sort((a, b) => a.left - b.left);

  for (let i = 0; i < platforms.length - 1; i++) {
    if (created >= maxArcs) break;

    const p1 = platforms[i];
    const p2 = platforms[i + 1];

    const gap = p2.left - p1.right;
    const heightDiff = Math.abs(p2.top - p1.top);

    /** ----- SPRUNG WIRKLICH NÖTIG? ----- */
    const mustJump = gap >= 150 && gap <= 700 && heightDiff > 10;

    if (!mustJump) continue;

    /** ----- ARC PARAMETER ----- */
    const arcWidth = Math.min(gap * 0.85, 350);
    const coinsInArc = Math.floor(arcWidth / 70);

    for (let j = 0; j < coinsInArc; j++) {
      const t = j / (coinsInArc - 1);

      const x = p1.right + gap * t - 25;
      const y =
        p1.top - 110 - Math.sin(t * Math.PI) * 160 + (p2.top - p1.top) * t;

      if (world.coinPositionIsValid(x, y, 50, 50)) {
        arcs.push(new CollectableItem(x, y, "coin"));
      }
    }

    created++;
  }

  return arcs;
}

/** ---------- FIXED COINS OPTIONAL ---------- */
export function createLevel1Collectables() {
  return [];
}

export function placeGuns(world, count = 4) {
  const guns = [];
  const minHeartDistance = 300;

  const heartCenters =
    world.collectables
      ?.filter((c) => c.type === "heart")
      .map((c) => ({ x: c.x + c.width / 2, y: c.y + c.height / 2 })) || [];

  const farFromHearts = (x, y) =>
    heartCenters.every((h) => {
      const dx = h.x - x;
      const dy = h.y - y;
      return Math.hypot(dx, dy) >= minHeartDistance;
    });

  const targets = [
    WORLD_WIDTH * 0.15,
    WORLD_WIDTH * 0.38,
    WORLD_WIDTH * 0.62,
    WORLD_WIDTH * 0.86,
  ].slice(0, count);

  targets.forEach((x) => {
    const platform = world.platforms.find((p) => x >= p.left && x <= p.right);
    if (!platform) return;

    const clampedX = Math.min(
      Math.max(x, platform.left + 10),
      platform.right - 60
    );
    const y = platform.top - 80;

    const offsets = [0, 150, -150, 250, -250];
    let placed = false;
    for (const off of offsets) {
      const px = Math.min(
        Math.max(clampedX + off, platform.left + 10),
        platform.right - 60
      );
      const centerX = px + 25;
      const centerY = y + 25;
      if (farFromHearts(centerX, centerY)) {
        guns.push(new CollectableItem(px, y, "gun"));
        placed = true;
        break;
      }
    }
    if (!placed) {
      guns.push(new CollectableItem(clampedX, y, "gun"));
    }
  });

  world.addCollectables(guns);
}

export function placeHearts(world, count = 3) {
  const validHearts = [];

  const minX = WORLD_WIDTH * 0.25;
  const midX = WORLD_WIDTH * 0.5;
  const maxX = WORLD_WIDTH * 0.95;

  const positions = [
    Math.random() * (WORLD_WIDTH * 0.2) + minX,
    Math.random() * (WORLD_WIDTH * 0.25) + midX,
    Math.random() * (WORLD_WIDTH * 0.1) + maxX,
  ];

  for (let i = 0; i < count; i++) {
    const x = positions[i];

    const platform = world.platforms.find(
      (p) => x >= p.x && x <= p.x + p.width
    );

    if (!platform) continue;

    const y = platform.y - 80;

    if (!isInsidePlatform(world, x, y)) {
      validHearts.push(new CollectableItem(x, y, "heart"));
    }
  }

  world.addCollectables(validHearts);
}

function isInsidePlatform(world, hx, hy) {
  return world.platforms.some(
    (p) =>
      hx + 30 > p.x &&
      hx < p.x + p.width &&
      hy + 30 > p.y &&
      hy < p.y + p.height
  );
}
