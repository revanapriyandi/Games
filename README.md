# AI Board Game Adventure

A real-time multiplayer board game powered by React, Firebase, and AI. Navigate snakes, ladders, challenges, and card battles with your friends!

![Lobby Preview](public/screenshots/lobby_v2.png)

## New Features (v2.0)

### 🎨 Modern Lobby & Avatar Selector
- **Custom Avatars:** Choose your unique look using the new **Avatar Selector**, powered by [DiceBear](https://dicebear.com/).
  - Search for your hero name to generate a unique avatar seed.
  - Randomize to find something that fits your style.
  - Supports multiple styles including Adventurer, Robot, and Emoji.
- **Sleek UI:** A completely redesigned lobby with a dark, modern aesthetic, glassmorphism effects, and smoother animations using Framer Motion.

### 🐛 Gameplay Improvements & Fixes
- **Double Dice Fix:** The "Double Dice" effect now correctly displays the halved value on the dice (e.g., rolling a 12 shows a 6) with a "x2" indicator, matching the movement logic.
- **Exit Button:** Restored the missing "KELUAR" (Exit) button in the game header, allowing players to leave the room easily.
- **Smoother Movement:** Character movement animations have been refactored to better handle Snakes & Ladders, preventing "backward walking" visual glitches.

![Gameplay Preview](public/screenshots/gameplay_v2.png)

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Firebase Realtime Database
- **AI:** Google Gemini (for generating challenges and themes)

## getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`

## License

MIT
