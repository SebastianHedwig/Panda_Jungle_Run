import { getPaused, initGame, setPaused } from "./core/game.js";
import { MUTE_TOGGLE_GAMESTART, SET_FULLSCREEN } from "./config/config.js";
import { installAudioTracking } from "./app/audio/audioTracking.js";
import { setupSoundToggle } from "./app/ui/controls/soundToggle.js";
import { togglePauseState } from "./app/ui/controls/settingsToggle.js";
import { setupFullscreenToggle, applyAutoFullscreen } from "./app/ui/controls/fullscreenToggle.js";
import { setupStartScreen } from "./app/start/startScreen/startScreen.js";
import { ViewportManagement } from "./app/ui/viewportManagement.class.js";
import { setupMobileControls } from "./app/ui/controls/mobileControls.js";

const audioTracking = installAudioTracking({ initiallyMuted: MUTE_TOGGLE_GAMESTART });

setupSoundToggle({ audioTracking, initialMuted: MUTE_TOGGLE_GAMESTART });

togglePauseState({ getPaused, setPaused });

setupFullscreenToggle();

applyAutoFullscreen({ enabled: SET_FULLSCREEN });

window.addEventListener("resize", () => applyAutoFullscreen({ enabled: SET_FULLSCREEN }));

setupMobileControls();

new ViewportManagement({ setPaused, getPaused });

setupStartScreen({ onStart: initGame });
