import { Input } from "./input.js";
import { Background } from "../engine/background.class.js";
import { Camera } from "../engine/camera.class.js";
import { World } from "./world.class.js";
import { Player } from "./player.class.js";
import { WORLD_WIDTH } from "../config.js";

let canvas, ctx;
let background, camera, player, input, world;
let lastTime = 0;

export function initGame() {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");

  input = new Input();
  world = new World(canvas, WORLD_WIDTH);
  camera = new Camera(canvas, WORLD_WIDTH);
  background = new Background(canvas);

  const bgImages = [
    loadImage("/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-1.png"),
    loadImage("/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-2.png"),
    loadImage("/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-3.png"),
    loadImage("/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-4.png"),
    loadImage("/assets/img/Game_BG_Image_Layers/clouds/clouds-1.png"),
    loadImage("/assets/img/Game_BG_Image_Layers/clouds/clouds-2.png")
  ];

  const idleFrames = loadFrames(
    "/assets/img/Character/Character_Sprites/idle/",
    "Idle",
    10
  );

  const walkFrames = loadFrames(
    "/assets/img/Character/Character_Sprites/walk/",
    "walk",
    10
  );

  const runFrames = loadFrames(
  "/assets/img/Character/Character_Sprites/run/",
  "Run",
  8
  );

  const jumpFrames = loadFrames(
    "/assets/img/Character/Character_Sprites/jump/",
    "Jump",
    5
  );

  const slideFrames = loadFrames(
  "/assets/img/Character/Character_Sprites/slide/",
  "Sliding",
  4
  );

  const throwFrames = loadFrames(
  "/assets/img/Character/Character_Sprites/throw/",
  "Throw_Attack",
  5
  );


  Promise.all([...bgImages, ...idleFrames, ...walkFrames, ...runFrames, ...jumpFrames, ...slideFrames, ...throwFrames].map(img => img.decode()))
    .then(() => {
      // bg1 = sky, bg2 = far trees, bg3 = mid trees, bg4 = front, cloud1/2 = variations
      const [bg1, bg2, bg3, bg4, cloud1, cloud2] = bgImages;

      background.addLayer(bg1, 0.1, 0.01);
      background.spawnClouds(cloud1, cloud2);
      background.addLayer(bg2, 0.3, 0.03);
      background.addLayer(bg3, 0.6, 0.06);
      background.addLayer(bg4, 1.0, 0.1);

      player = new Player(25, 550, idleFrames, walkFrames, runFrames, jumpFrames, slideFrames, throwFrames);
      requestAnimationFrame(loop);
    });
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  player.update(dt, input);
  camera.follow(player, 0.08);
  background.update(camera.x, camera.y, dt);
  world.applyWorldBounds(player);
  input.endFrame();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.render(ctx, camera);
  player.render(ctx, camera);
}

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function loadFrames(path, prefix, count) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const img = new Image();
    img.src = `${path}${prefix}_${String(i).padStart(3, "0")}.png`;
    frames.push(img);
  }
  return frames;
}
