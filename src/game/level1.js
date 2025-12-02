import { PlatformBuilder } from "../engine/platformBuilder.class.js";

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
  build.stackFiller(4029, 265, 10, 1, sprites["filler"].width);
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
