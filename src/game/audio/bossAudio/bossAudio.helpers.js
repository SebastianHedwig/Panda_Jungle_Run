/**
 * Returns random source.
 * Introduces randomness into the outcome.
 * @param {*} sourceList Source list.
 * @returns {*} Random source.
 */
export function getRandomSource(sourceList) {
  if (!sourceList?.length) return null;
  const randomIndex = Math.floor(Math.random() * sourceList.length);
  return sourceList[randomIndex] ?? null;
}

/**
 * Stops and reset audio.
 * Triggers audio playback or updates audio state.
 * @param {HTMLElement} audioElement Audio element.
 * @returns {*} Result value.
 */
export function stopAndResetAudio(audioElement) {
  if (!audioElement) return null;
  audioElement.pause();
  audioElement.currentTime = 0;
  return null;
}

/**
 * Clears timeout if needed.
 * Clears pending timers.
 * @param {string} timerId Timer element id.
 * @returns {*} Result value.
 */
export function clearTimeoutIfNeeded(timerId) {
  if (timerId) clearTimeout(timerId);
  return null;
}
