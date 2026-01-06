export function updatePlayer(player, dt, input, playerAudio) {
  player._preCollisionX = player.x;
  if (player.healthPoints <= 0) {
    if (!player.isDead) player.startDeath();
    else if (!player.deathSoundPlayed) {
      playerAudio.playDead();
      player.deathSoundPlayed = true;
    }
  }
  const slideEndedLastFrame = player.wasSlidingPreviousFrame && !player.isSliding;
  if (player.slideBlockGrace > 0) {
    player.slideBlockGrace = Math.max(0, player.slideBlockGrace - dt);
  }

  /** COOLDOWN TIMERS */
  if (player.shootCooldown > 0)
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  if (player.gunPulse > 0) player.gunPulse = Math.max(0, player.gunPulse - dt * 4);
  if (player.invulnerableTimer > 0)
    player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
  if (player.slideInvulWindow > 0)
    player.slideInvulWindow = Math.max(0, player.slideInvulWindow - dt);
  if (slideEndedLastFrame) {
    applyPostSlideInvulnerability(player);
  }

  /** DEATH OVERRIDE */
  if (player.isDead) {
    player.setAnimation(player.dieFrames);
    const prevBottom = player.y + player.height;
    player.applyApexGravity(dt);
    const currBottom = player.y + player.height;
    player.handleDeathLanding(prevBottom, currBottom);
    if (!player.deathDone) {
      player.frameTime += dt;
      if (player.frameTime >= player.frameSpeed) {
        player.frameTime = 0;
        player.currentFrame = Math.min(
          player.currentFrame + 1,
          player.currentAnimation.length - 1
        );
        player.sprite = player.currentAnimation[player.currentFrame];
        if (player.currentFrame === player.currentAnimation.length - 1) {
          player.deathDone = true;
        }
      }
    }
    player.wasSlidingPreviousFrame = player.isSliding;
    return;
  }

  /** HURT */
  player.updateHurt(dt);
  if (player.isHurt) {
    if (player.hurtUseDizzy) {
      const hurtAnim =
        player.hurtPhase === "hurt"
          ? player.hurtFrames
          : player.dizzyFrames || player.hurtFrames;
      player.setAnimation(hurtAnim);
      player.animate(dt);
    }
    player.applyApexGravity(dt);
    player.wasSlidingPreviousFrame = player.isSliding;
    return;
  }

  /** ATTACK / SHOOT INPUT (Enter only, bullets take priority) */
  if (input.isPressed("Enter")) {
    if (player.bulletAmmo > 0) player.startShoot();
    else player.startAttack();
  }

  player.updateShoot(dt);

  if (player.isShooting) {
    player.setAnimation(player.shootFrames);
    player.applyApexGravity(dt);
    player.animate(dt);
    player.wasSlidingPreviousFrame = player.isSliding;
    return;
  }

  player.updateAttack(dt);

  if (player.isAttacking) {
    player.setAnimation(player.throwFrames);
    player.applyApexGravity(dt);
    player.animate(dt);
    player.wasSlidingPreviousFrame = player.isSliding;
    return;
  }

  /** SLIDE INPUT */
  const slideKeysDown =
    input.isDown("Shift") && (input.isDown("s") || input.isDown("ArrowDown"));

  if (player.isSliding) {
    const moved = Math.abs(player.x - player.slideStartX);
    const t = Math.min(moved / player.slideDistance, 1);
    const speed = player.slideSpeed * (1 - t * 0.4);

    player.x += player.slideDir * speed * dt;
    player.invulnerableTimer = Math.max(
      player.invulnerableTimer,
      player.slideInvulnerableDuring
    );
    player.slideInvulWindow = Math.max(
      player.slideInvulWindow,
      player.slideInvulnerableDuring
    );
    if (moved >= player.slideDistance) {
      player.isSliding = false;
      applyPostSlideInvulnerability(player);
    }

    checkSlideHits(player, playerAudio);
    player.setAnimation(player.slideFrames);
    player.applyApexGravity(dt);
    player.animate(dt);
    player.wasSlidingPreviousFrame = player.isSliding;
    return;
  }

  if (
    player.onGround &&
    slideKeysDown &&
    player.slideReady &&
    (input.isDown("ArrowLeft") ||
      input.isDown("ArrowRight") ||
      input.isDown("a") ||
      input.isDown("d"))
  ) {
    player.startSlide();
    player.slideReady = false;
    player.wasSlidingPreviousFrame = player.isSliding;
    return;
  }

  if (!slideKeysDown) player.slideReady = true;

  /** MOVEMENT */
  let moving = false,
    running = false;

  const leftDown = input.isDown("ArrowLeft") || input.isDown("a");
  const rightDown = input.isDown("ArrowRight") || input.isDown("d");
  const bothDirectionsDown = leftDown && rightDown;

  if (!bothDirectionsDown) {
    if (leftDown) {
      player.moveLeft(dt);
      player.facing = -1;
      moving = true;
    }
    if (rightDown) {
      player.moveRight(dt);
      player.facing = 1;
      moving = true;
    }
  }
  if (moving && input.isDown("Shift")) {
    player.speed = player.defaultSpeed * player.runMultiplier;
    running = true;
  } else player.speed = player.defaultSpeed;

  if (!player.onGround) {
    player.setAnimation(player.jumpFrames);
  } else if (running) {
    player.setAnimation(player.runFrames);
  } else if (moving) {
    player.setAnimation(player.walkFrames);
  } else {
    player.setAnimation(player.idleFrames);
  }

  /** ADVANCED JUMP */
  if (input.isPressed(" ")) {
    player.jumpBufferTimer = player.jumpBufferTime;
    player.jumpHeld = true;
  } else if (!input.isDown(" ")) player.jumpHeld = false;

  if (player.onGround) player.coyoteTimer = player.coyoteTime;
  else player.coyoteTimer -= dt;

  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    playerAudio.playJump();
    player.jump();
    player.jumpBufferTimer = 0;
  }

  if (!player.jumpHeld && player.vy < 0) player.vy *= player.jumpCutMultiplier;
  player.jumpBufferTimer -= dt;

  player.applyApexGravity(dt);
  player.animate(dt);
  player.wasSlidingPreviousFrame = player.isSliding;
}

function checkSlideHits(player, playerAudio) {
  if (!player.world?.enemies?.length) return;
  const selfBox = player.getHitbox();

  for (const enemy of player.world.enemies) {
    if (enemy.isDead || player.slideHitEnemies.has(enemy)) continue;
    const enemyBox = enemy.getHitbox ? enemy.getHitbox() : null;
    if (!enemyBox) continue;
    const overlaps =
      selfBox.x < enemyBox.x + enemyBox.width &&
      selfBox.x + selfBox.width > enemyBox.x &&
      selfBox.y < enemyBox.y + enemyBox.height &&
      selfBox.y + selfBox.height > enemyBox.y;
    if (overlaps) {
      playerAudio.playHit();
      const dmg = player.slideDamage ?? 2;
      enemy.takeDamage?.(dmg, { skipStun: true, source: "slide" });
      if (!enemy.isDead && enemy.health > 0 && !enemy.disableHitEffect) {
        player.world?.spawnHitEffect?.(
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        );
      }
      player.slideHitEnemies.add(enemy);
    }
  }
}

function applyPostSlideInvulnerability(player) {
  player.invulnerableTimer = Math.max(
    player.invulnerableTimer,
    player.slideInvulnerableAfter
  );
  player.slideInvulWindow = Math.max(
    player.slideInvulWindow,
    player.slideInvulnerableAfter
  );
}
