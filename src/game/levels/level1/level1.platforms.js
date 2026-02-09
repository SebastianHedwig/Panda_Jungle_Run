import { PlatformBuilder } from "../../../engine/world/platformBuilder.class.js";

/**
 * Adds base ground.
 * Used to support platform collision handling.
 * Uses build, fillerWidth, fillerOffsetLarge, fillerOffsetSmall to perform the operation.
 * @param {*} build Build.
 * @param {number} fillerWidth Filler width.
 * @param {number} fillerOffsetLarge Filler offset large.
 * @param {number} fillerOffsetSmall Filler offset small.
 */
function addBaseGround(build, fillerWidth, fillerOffsetLarge, fillerOffsetSmall) {
  build.add("middleLong", 0, 650); build.add("middleLong", 1360, 650);
  build.add("middleShort", 2520, 450); build.stackFiller(2520, 465, 3, 2, fillerWidth - fillerOffsetLarge);
  build.add("endLong", 2968.5, 650); build.row(4250, 650, 2, "middleLong");
  build.stackFiller(4022, 265, 10, 1, fillerWidth); build.add("startLong", 7100, 500);
  build.add("endLong", 7550, 500); build.stackFiller(7150, 515, 3, 4, fillerWidth - fillerOffsetSmall);
  build.row(8350, 650, 2, "middleLong");
}

/**
 * Adds higher level platforms.
 * Used to support world state updates.
 * Uses build to perform the operation.
 * @param {*} build Build.
 */
function addHigherLevelPlatforms(build) {
  build.add("startLong", 265, 250); build.add("endLong", 810, 250);
  build.add("startLong", 3955, 250); build.add("endLong", 4500, 250);
  build.add("startLong", 5500, 380); build.add("endLong", 6200, 300);
}

/**
 * Adds floating islands.
 * Used to support world state updates.
 * Uses build to perform the operation.
 * @param {*} build Build.
 */
function addFloatingIslands(build) {
  build.islandSmall(1600, 400); build.islandSmall(3200, 350);
  build.islandSmall(3500, 250); build.islandSmall(3750, 500);
  build.islandSmall(6750, 550); build.islandSmall(7000, 350);
  build.islandSmall(7400, 200); build.islandSmall(8200, 300);
  build.islandSmall(9300, 350); build.islandSmall(9800, 300);
}

/**
 * Creates level 1 platforms.
 * Used to set up required data for world state updates.
 * Advances animation state and sprites.
 * @param {*} sprites Sprites.
 * @returns {*} Level 1 platforms.
 */
export function createLevel1Platforms(sprites) {
  const platforms = [];
  const build = new PlatformBuilder(platforms, sprites);
  const fillerWidth = sprites["filler"].width, fillerOffsetLarge = 6, fillerOffsetSmall = 1;

  addBaseGround(build, fillerWidth, fillerOffsetLarge, fillerOffsetSmall);
  addHigherLevelPlatforms(build);
  addFloatingIslands(build);

  return platforms;
}

