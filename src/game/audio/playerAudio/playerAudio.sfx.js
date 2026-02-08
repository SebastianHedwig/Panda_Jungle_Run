/**
 * Returns punch audio.
 * Updates the instance state.
 * @param {string} src Source URL.
 * @returns {*} Punch audio.
 */
export function getPunchAudio(src) {
  let audio = this.punchCache.get(src);
  if (!audio) {
    audio = this.createAudio(src);
    this.punchCache.set(src, audio);
  }
  return audio;
}

/**
 * Returns ouch audio.
 * Updates the instance state.
 * @param {string} src Source URL.
 * @returns {*} Ouch audio.
 */
export function getOuchAudio(src) {
  let audio = this.ouchCache.get(src);
  if (!audio) {
    audio = this.createAudio(src);
    this.ouchCache.set(src, audio);
  }
  return audio;
}

/**
 * Plays punch.
 * Performs hitbox or collision checks.
 * Updates the instance state.
 */
export function playPunch() {
  if (!this.punchSrcs?.length) return;
  const randomPunchIndex = Math.floor(Math.random() * this.punchSrcs.length);
  const src = this.punchSrcs[randomPunchIndex];
  this.getPunchAudio(src);
  this.playOneShot({
    propertyName: `punchAudio${randomPunchIndex}`,
    src,
    audioStartOffset: 0,
    rate: 1,
    forceClone: true, // allow overlaps when spammed
  });
}

/**
 * Plays hit.
 * Updates the instance state.
 */
export function playHit() {
  if (!this.hitSrc) return;
  this.playOneShot({ propertyName: "hitAudio", src: this.hitSrc });
}

/**
 * Plays shoot.
 * Updates the instance state.
 */
export function playShoot() {
  this.playOneShot({ propertyName: "shootAudio", src: this.shootSrc });
}

/**
 * Plays ouch.
 * Updates the instance state.
 * Introduces randomness into the outcome.
 */
export function playOuch() {
  if (!this.ouchSrcs?.length) return;
  const randomOuchIndex = Math.floor(Math.random() * this.ouchSrcs.length);
  const src = this.ouchSrcs[randomOuchIndex];
  this.getOuchAudio(src);
  const propertyName = `ouchAudio${randomOuchIndex}`;
  this.playOneShot({ propertyName, src });
}

/**
 * Plays jump.
 * Applies physics updates like gravity and velocity.
 * Updates the instance state.
 */
export function playJump() {
  this.playOneShot({ propertyName: "jumpAudio", src: this.jumpSrc });
}

/**
 * Plays slide.
 * Updates the instance state.
 * Introduces randomness into the outcome.
 */
export function playSlide() {
  if (!this.slideSrcs?.length) return;
  const randomSlideIndex = Math.floor(Math.random() * this.slideSrcs.length);
  const src = this.slideSrcs[randomSlideIndex];
  const propertyName = `slideAudio${randomSlideIndex}`;
  this.playOneShot({ propertyName, src });
}

/**
 * Plays dead.
 * Updates the instance state.
 */
export function playDead() {
  this.playOneShot({
    propertyName: "deadAudio",
    src: this.deadSrc,
    rate: this.deadRate,
  });
}
