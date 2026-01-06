export function startSlide(player, playerAudio) {
  if (player.isSliding || !player.onGround) return;
  player.isSliding = true;
  player.slideStartX = player.x;
  player.slideDir = player.facing;
  player.vy = 0;
  playerAudio.playSlide();
  player.slideBlockGrace = 0.12;
  player.slideHitEnemies.clear();
  player.invulnerableTimer = Math.max(
    player.invulnerableTimer,
    player.slideInvulnerableDuring
  );
  player.slideInvulWindow = Math.max(player.slideInvulWindow, player.slideInvulnerableDuring);
}

export function handleLandingAudio(player, playerAudio) {
  if (player.justLanded && player.landedOnPlatform && !player.isSliding) {
    playerAudio.playLanding();
    player.justLanded = false;
    player.landedOnPlatform = false;
  }
}

