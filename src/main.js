import { getPaused, initGame, setPaused } from "./core/game.js";
import { INITIAL_MUTE_STATE_GAMESTART, SET_FULLSCREEN, SOUND_MUTE_STORAGE_KEY } from "./config/config.js";
import { installAudioTracking } from "./app/audio/audioTracking.js";
import { setupSoundToggle } from "./app/ui/controls/soundToggle.js";
import { togglePauseState } from "./app/ui/controls/settingsToggle.js";
import { setupFullscreenToggle, applyAutoFullscreen } from "./app/ui/controls/fullscreenToggle.js";
import { setupStartScreen } from "./app/start/startScreen/startScreen.js";
import { ViewportManagement } from "./app/ui/viewportManagement.class.js";
import { setupMobileControls } from "./app/ui/controls/mobileControls.js";

const getStoredMuted = () => {
  const stored = localStorage.getItem(SOUND_MUTE_STORAGE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  const fallback = INITIAL_MUTE_STATE_GAMESTART;
  localStorage.setItem(SOUND_MUTE_STORAGE_KEY, String(fallback));
  return fallback;
};

const initialMuted = getStoredMuted();

const audioTracking = installAudioTracking({ initiallyMuted: initialMuted });

setupSoundToggle({ audioTracking, initialMuted: initialMuted });

togglePauseState({ getPaused, setPaused });

setupFullscreenToggle();

applyAutoFullscreen({ enabled: SET_FULLSCREEN });

window.addEventListener("resize", () => applyAutoFullscreen({ enabled: SET_FULLSCREEN }));

setupMobileControls();

new ViewportManagement({ setPaused, getPaused });

setupStartScreen({ onStart: initGame });
