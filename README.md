# Panda Jungle Run

A 2D side‑scrolling platformer in the browser (Canvas), built in vanilla JS with a small custom engine.


**Contents**
- [Features](#features)
- [Gameplay Highlights](#gameplay-highlights)
- [Inspiration](#inspiration)
- [Controls (Desktop)](#controls-desktop)
- [Controls (Mobile)](#controls-mobile)
- [Sound Settings](#sound-settings)
- [Requirements](#requirements)
- [Installation](#installation)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Project Size](#project-size)
- [Git Workflow](#git-workflow)
- [Credits / Assets](#credits-assets)
- [Licenses](#licenses)
- [Copyright](#copyright)


## Features
- Side‑scrolling platformer with Canvas rendering
- Sprint + slide move (with its own animation)
- Player attack / shoot actions
- Multiple enemy types + boss encounter
- Collectables like coins/hearts/gun drops
- HUD with sound and fullscreen toggles
- Start screen + settings overlay (incl. controls overview)
- Custom mini‑engine (vanilla JS), no external game frameworks
- Responsive design (desktop + mobile)
- Sound mute is stored in `localStorage`


## Gameplay Highlights
- Focus on fluid movement: run, jump, slide as the core loop
- Short combat encounters that reward movement
- Clear screen flow: start menu → game → HUD interaction


## Inspiration
- Inspired by classic 2D side‑scrolling platformers
- Mix of fast run‑and‑slide sections and short combat phases
- Arcade‑like: quick entry, direct controls, instant feedback


## Controls (Desktop)
- Move: `A / D` or arrow keys
- Sprint: hold `Shift`
- Jump: `Space`
- Slide: `Shift + S` or arrow down
- Attack / Shoot: `Enter`
- Pause / Menu: `Escape` or HUD button


## Controls (Mobile)
- On‑screen buttons (left/right, sprint, jump, attack, slide)


## Sound Settings
- Default mute: `src/config/config.js` → `INITIAL_MUTE_STATE_GAMESTART`
- Persistence: `localStorage` key `SoundMute`


## Requirements
- Any modern browser
- Optional: Node.js + npm for `npm run docs` or `npx serve`
- Optional: Python 3 for `python -m http.server`


## Installation
1. Clone the repository:
```bash
git clone https://github.com/SebastianHedwig/Panda_Jungle_Run.git
cd Panda_Jungle_Run
```
2. Open directly:<br>
Open `index.html` in your browser.

3. Or run a local development server:
```bash
# Using Python
python -m http.server 8000
```
```bash
# Using Node.js
npx serve
```
4. Navigate to `http://localhost:8000` (or your server’s address).


## Documentation
- The project is documented with JSDoc (HTML output).
- Prerequisite: Node.js + npm installed.
- Install deps once: `npm install`
- Generate docs: `npm run docs`
- Open: `docs/jsdoc/index.html`
- Theme: `docdash-orange` (configured in `jsdoc.json`)


## Project Structure
- `index.html` — entry point + canvas/HUD
- `initGame.js` — game bootstrap (entry point) incl. audio setup, UI toggles, start screen
- `src/` — core game logic
- `src/core/` — game loop, world management, foundational systems
- `src/engine/` — custom mini‑engine (core abstractions, utilities)
- `src/game/` — entities, level logic, combat, audio, HUD
- `src/app/` — UI, overlays, start screen, controls, audio tracking
- `assets/` — spritesheets, SFX, icons
- `styles/` and `style.css` — UI and layout styles
- `docs/` — generated JSDoc output
- `licenses/` — asset purchase/license PDFs
- `jsdoc.json` — JSDoc configuration
- `package.json` and `package-lock.json` — tooling config
- `node_modules/` — local dependencies (generated)


## Project Size (as of: 2026-02-10)
- Folders: 130
- Files: 788
- Code lines: 22582
- Excludes: `node_modules/`, `docs/`, `.idea/`, `package-lock.json`
- Code line types: `.js`, `.json`, `.html`, `.css`, `.md`


## Git Workflow (Push / Pull / Branch)
1. Create a branch:
```bash
git checkout -b feature/my-change
```

2. Make changes and commit:
```bash
git add .
git commit -m "Describe your change"
```

3. Push your branch:
```bash
git push -u origin feature/my-change
```

4. Pull latest changes (main):
```bash
git checkout main
git pull
```


## Credits / Assets
- [Graphicriver](https://graphicriver.net/)
- [Icons8](https://icons8.de/icons)
- [Flaticon](https://www.flaticon.com/)
- [Pixabay](https://pixabay.com/de/)
- [Developer Akademie](https://developerakademie.com/)


## Licenses
License PDFs for purchased assets are stored in `licenses/`.
- `licenses/77105051-panda-run-platformer-game-kit-license.pdf`
- `licenses/77105052-panda-2d-game-character-sprites-86-license.pdf`
- `licenses/77105053-panda-warrior-2-game-character-sprites-221-license.pdf`
- `licenses/77131765-wolves-2d-game-character-sprites-288-license.pdf`
- `licenses/77131842-game-enemies-character-sprites-142-license.pdf`


## Copyright
- © 2026 Sebastian Hedwig. All rights reserved.
