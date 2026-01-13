import { getPaused, initGame, setPaused } from "./core/game.class.js";
import { MUTE_TOGGLE_GAMESTART, SET_FULLSCREEN } from "./config/config.js";
import { installAudioTracking } from "./app/audioTracking.js";
import { setupSoundToggle } from "./app/ui/controls/soundToggle.js";
import { setupMenuToggle } from "./app/ui/controls/menuToggle.js";
import {
  setupFullscreenToggle,
  applyAutoFullscreen,
} from "./app/ui/controls/fullscreenToggle.js";
import { setupStartScreen } from "./app/start/startScreen.js";

const audioTracking = installAudioTracking({ initiallyMuted: MUTE_TOGGLE_GAMESTART });

setupSoundToggle({ audioTracking, initialMuted: MUTE_TOGGLE_GAMESTART });
setupMenuToggle({ getPaused, setPaused });
setupFullscreenToggle();
applyAutoFullscreen({ enabled: SET_FULLSCREEN });
window.addEventListener("resize", () => applyAutoFullscreen({ enabled: SET_FULLSCREEN }));

setupStartScreen({ onStart: initGame, preloadMuted: MUTE_TOGGLE_GAMESTART });
