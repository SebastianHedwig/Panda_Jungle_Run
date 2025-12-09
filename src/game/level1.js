import { PlatformBuilder } from "../engine/platformBuilder.class.js";
import { CollectableItem } from "../core/collectableItems.class.js";

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
export function generateCoinsMixed(world, totalCount = 20, ratioAbovePlatforms = 0.5) {
  const coins = [];
  const coinsAbove = Math.floor(totalCount * ratioAbovePlatforms);

  /** ----- COINS ÜBER PLATTFORMEN ----- */
  for (let i = 0; i < coinsAbove; i++) {
    const platform = world.platforms[Math.floor(Math.random() * world.platforms.length)];
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
    const mustJump =
      gap >= 150 && gap <= 700 &&
      heightDiff > 10;

    if (!mustJump) continue;

    /** ----- ARC PARAMETER ----- */
    const arcWidth = Math.min(gap * 0.85, 350);
    const coinsInArc = Math.floor(arcWidth / 70);

    for (let j = 0; j < coinsInArc; j++) {
      const t = j / (coinsInArc - 1);

      const x = p1.right + gap * t - 25;
      const y =
        p1.top - 110
        - Math.sin(t * Math.PI) * 160
        + (p2.top - p1.top) * t;

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
