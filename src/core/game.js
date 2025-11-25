import { Input } from "./input.js";
import { Background } from "../engine/background.class.js";
import { Camera } from "../engine/camera.class.js";
import { World } from "./world.class.js";
import { Player } from "./player.class.js";

let canvas, ctx;
let background;
let camera;
let cameraX = 0;
let player, input, world;
let lastTime = 0;

export function initGame() {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");

  input = new Input();

  const WORLD_WIDTH = 6000
  world = new World(canvas, WORLD_WIDTH);
  camera = new Camera(canvas, WORLD_WIDTH);

  background = new Background(canvas);

  const images = [
    loadImage(
      "/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-1.png"
    ),
    loadImage(
      "/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-2.png"
    ),
    loadImage(
      "/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-3.png"
    ),
    loadImage(
      "/assets/img/Game_BG_Image_Layers/BG/Game-Background-Layer-4.png"
    ),
    loadImage("/assets/img/Character/Character_Sprites/idle/Idle__000.png"),
  ];

  Promise.all(images.map((img) => img.decode())).then(() => {
    background.addLayer(images[0], 0.1, 0.01);
    background.addLayer(images[1], 0.3, 0.03);
    background.addLayer(images[2], 0.6, 0.06);
    background.addLayer(images[3], 1.0, 0.1);

    player = new Player(25, 550, images[4]);

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
  cameraX = player.x;
  camera.follow(player, 0.08);
  background.update(camera.x, camera.y);

  world.applyWorldBounds(player);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.render(ctx);
  player.render(ctx, camera);
}

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}
