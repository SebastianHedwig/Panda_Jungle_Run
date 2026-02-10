# Panda Jungle Run

A 2D side‑scrolling platformer in the browser (Canvas), built entirely in vanilla JS.

**Contents**
- [Features](#features)
- [Gameplay Highlights](#gameplay-highlights)
- [Inspiration](#inspiration)
- [Controls (Desktop)](#controls-desktop)
- [Controls (Mobile)](#controls-mobile)
- [Sound Settings](#sound-settings)
- [Installation](#installation)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Project Size](#project-size)
- [Git Workflow](#git-workflow)
- [Credits / Assets](#credits-assets)
- [Copyright](#copyright)

<a id="features"></a>
**Features**
- Side‑scrolling platformer with Canvas rendering
- Sprint + slide move (with its own animation)
- Player attack / shoot actions
- Multiple enemy types + boss encounter
- Collectables like coins/hearts/gun drops
- HUD with sound and fullscreen toggles
- Start screen + settings overlay (incl. controls overview)
- Custom mini‑engine (vanilla JS), no external game frameworks
- Responsive design (desktop + mobile)
- Desktop and mobile controls
- Sound mute is stored in `localStorage`


<a id="gameplay-highlights"></a>
**Gameplay Highlights**
- Focus on fluid movement: run, jump, slide as the core loop
- Short combat encounters that reward movement
- Clear screen flow: start menu → game → HUD interaction


<a id="inspiration"></a>
**Inspiration**
- Inspired by classic 2D side‑scrolling platformers
- Mix of fast run‑and‑slide sections and short combat phases
- Arcade‑like: quick entry, direct controls, instant feedback


<a id="controls-desktop"></a>
**Controls (Desktop)**
- Move: `A / D` or arrow keys
- Sprint: hold `Shift`
- Jump: `Space`
- Slide: `Shift + S` or arrow down
- Attack / Shoot: `Enter`
- Pause / Menu: `Escape` or HUD button


<a id="controls-mobile"></a>
**Controls (Mobile)**
- On‑screen buttons (left/right, sprint, jump, attack, slide)


<a id="sound-settings"></a>
**Sound Settings**
- Default mute: `src/config/config.js` → `INITIAL_MUTE_STATE_GAMESTART`
- Persistence: `localStorage` key `SoundMute`


<a id="installation"></a>
**Installation**
1. Clone the repository:
```bash
git clone https://github.com/SebastianHedwig/Panda_Jungle_Run.git
cd Panda_Jungle_Run
```
2. Open directly:
```bash
index.html
```
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


<a id="documentation"></a>
**Documentation**
- The project is documented with JSDoc (HTML output).
- Prerequisite: Node.js + npm installed.
- Install deps once: `npm install`
- Generate docs: `npm run docs`
- Open: `docs/jsdoc/index.html`
- Theme: `docdash-orange` (configured in `jsdoc.json`)


<a id="project-structure"></a>
**Project Structure**
- `index.html` — entry point + canvas/HUD
- `initGame.js` — game bootstrap (entry point) incl. audio setup, UI toggles, start screen
- `src/` — core game logic
- `src/core/` — game loop, world management, foundational systems
- `src/engine/` — custom mini‑engine (core abstractions, utilities)
- `src/game/` — entities, level logic, combat, audio, HUD
- `src/app/` — UI, overlays, start screen, controls, audio tracking
- `assets/` — spritesheets, SFX, icons
- `styles/` and `style.css` — UI and layout styles


<a id="project-size"></a>
**Project Size (status: 09/02/2026)**
- Folder: 128
- Files: 784
- Total number of codelines: 11.148 Lines<br>
(folder, files & codelines - Project only)

<a id="git-workflow"></a>
**Git Workflow (Push / Pull / Branch)**
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

<a id="credits-assets"></a>
**Credits / Assets**
- [Graphicriver](https://graphicriver.net/)
- [Icons8](https://icons8.de/icons)
- [Flaticon](https://www.flaticon.com/)
- [Pixabay](https://pixabay.com/de/)
- [Developer Akademie](https://developerakademie.com/)


<a id="copyright"></a>
**Copyright**
- © 2026 Sebastian Hedwig. All rights reserved.
