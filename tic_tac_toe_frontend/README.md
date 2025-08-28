# Tic Tac Toe – React Frontend

A lightweight React single‑page app for playing Tic Tac Toe locally against a friend or a simple AI.

## Features

- 3×3 interactive board with winning line highlight
- Human vs Human (hot seat) or Human vs AI
- Simple AI (win/block/random)
- Turn indicator, win/draw detection, game result
- Round reset and score tracking (X, O, draws)
- Optional theme toggle (light/dark)
- Minimal dependencies and clean structure

## Getting Started

Install and run:

- npm install
- npm start

Open http://localhost:3000 in your browser.

Run tests:

- npm test

Build for production:

- npm run build

## Environment Variables

Copy .env.example to .env and customize:

- REACT_APP_APP_NAME: Set a custom app title.
- REACT_APP_VERSION: Displayed in the footer.

Note: Create React App requires REACT_APP_ prefix for client variables.

## Code Structure

- src/App.js – Main app, game logic, components (Game, Board, Cell, Controls, Scoreboard, Footer)
- src/App.css – Theming and UI styles
- src/index.js – App entry point

You can extend the AI strategy or add routing without changing the current structure.
