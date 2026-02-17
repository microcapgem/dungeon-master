# Dungeon Master

A browser-based RPG powered by AI. Create a character, and an AI Dungeon Master will guide you through a dynamic, open-ended adventure with D&D-inspired rules, 3D dice rolling, combat, and voice narration.

## Features

- **AI Dungeon Master** — Powered by Claude or OpenAI. The DM generates narrative, tracks game state, requests dice rolls, and manages combat encounters via streaming responses.
- **Character Creation** — Three modes: pick from 6 pre-built characters (Fighter, Wizard, Rogue, Cleric, Ranger, Barbarian), generate a random character with 4d6-drop-lowest ability scores, or build one from scratch with custom race, class, abilities, and backstory.
- **3D Dice Roller** — Interactive dice rolling with React Three Fiber and Cannon.js physics. The DM requests rolls when actions require skill checks or attacks.
- **Combat System** — Turn-based combat with enemy HP tracking, damage, and initiative. The DM manages encounters and transitions in/out of combat mode.
- **Voice Narration** — Toggle text-to-speech so the DM reads the story aloud using the Web Speech API.
- **Save/Load** — Auto-saves progress to localStorage. Manual save slots let you manage multiple adventures.
- **Quest Export** — Export your adventure log as a formatted text file.
- **Suggested Actions** — The DM suggests contextual actions after each response, or type your own.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- React Three Fiber + Drei + Cannon (3D dice)
- Claude API / OpenAI API (streaming)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), go to **Settings**, and enter your Claude or OpenAI API key. Then create a character and start your adventure.

## Races

Human, Elf, Dwarf, Halfling, Half-Orc, Tiefling

## Classes

Fighter, Wizard, Rogue, Cleric, Ranger, Barbarian

## Project Structure

```
src/
├── ai/           # AI provider interface, Claude/OpenAI implementations, prompt templates
├── components/   # UI — GameScreen, CharacterCreation, DiceRoller, CombatTracker, etc.
├── context/      # GameContext — central state, AI communication, roll handling
├── game/         # Character types, dice logic, D&D rules, game state/reducer
└── utils/        # LocalStorage persistence, voice/TTS helpers
```

## License

MIT
