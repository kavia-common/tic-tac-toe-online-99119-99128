import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
export default function App() {
  /**
   * App component is the root of the Tic Tac Toe SPA.
   * It manages theme toggling only; the game is handled by Game component.
   */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Expose env-driven title (best practice demo; safe even if undefined)
  const appTitle = useMemo(() => {
    const name = process.env.REACT_APP_APP_NAME || 'Tic Tac Toe';
    return name;
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <div className="container">
          <h1 className="title">{appTitle}</h1>
          <p className="subtitle">Play locally against a friend or a simple AI.</p>
          <Game />
          <Footer />
        </div>
      </header>
    </div>
  );
}

/**
 * Types
 */
const Players = {
  X: 'X',
  O: 'O',
};

const Modes = {
  HUMAN: 'HUMAN',
  AI: 'AI',
};

/**
 * Utilities
 */
function emptyBoard(size) {
  return Array(size * size).fill(null);
}

function buildWinningLines(size) {
  const lines = [];

  // Rows
  for (let r = 0; r < size; r++) {
    const start = r * size;
    const row = [];
    for (let c = 0; c < size; c++) row.push(start + c);
    lines.push(row);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) col.push(r * size + c);
    lines.push(col);
  }

  // Main diagonal
  const diag1 = [];
  for (let i = 0; i < size; i++) diag1.push(i * (size + 1));
  lines.push(diag1);

  // Anti diagonal
  const diag2 = [];
  for (let i = 1; i <= size; i++) diag2.push(i * (size - 1));
  lines.push(diag2);

  return lines;
}

function calculateWinner(squares, size) {
  const lines = buildWinningLines(size);
  for (const line of lines) {
    const [first, ...rest] = line;
    const token = squares[first];
    if (!token) continue;
    if (rest.every((idx) => squares[idx] === token)) {
      return { winner: token, line };
    }
  }
  return { winner: null, line: [] };
}

function isBoardFull(squares) {
  return squares.every(Boolean);
}

/**
 * Very basic AI: tries to win in one move, otherwise block, otherwise random.
 */
function aiMove(squares, aiPlayer, size) {
  const human = aiPlayer === Players.X ? Players.O : Players.X;
  const emptyIndices = squares.map((v, i) => (v ? null : i)).filter(v => v !== null);

  // Helper to simulate a move and check for immediate win
  const findWinningMove = (player) => {
    for (const idx of emptyIndices) {
      const trial = squares.slice();
      trial[idx] = player;
      if (calculateWinner(trial, size).winner === player) return idx;
    }
    return null;
  };

  // 1) Try to win
  const winIdx = findWinningMove(aiPlayer);
  if (winIdx !== null) return winIdx;

  // 2) Block opponent
  const blockIdx = findWinningMove(human);
  if (blockIdx !== null) return blockIdx;

  // 3) Otherwise random
  if (emptyIndices.length === 0) return null;
  const r = Math.floor(Math.random() * emptyIndices.length);
  return emptyIndices[r];
}

/**
 * Components
 */

// PUBLIC_INTERFACE
function Footer() {
  /** Renders a small footer with optional environment info. */
  const version = process.env.REACT_APP_VERSION || '0.1.0';
  const env = process.env.NODE_ENV || 'development';
  return (
    <div className="footer">
      <span>Version {version}</span>
      <span className="dot">•</span>
      <span>{env}</span>
    </div>
  );
}

// PUBLIC_INTERFACE
function Game() {
  /**
   * Game holds high-level state: board, current player, mode, scores, and controls.
   * Now supports dynamic board sizes (3x3, 4x4, 5x5).
   */
  const BOARD_SIZES = [3, 4, 5];

  const [boardSize, setBoardSize] = useState(3);
  const [squares, setSquares] = useState(() => emptyBoard(3));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState(Modes.HUMAN);
  const [aiPlaysAs, setAiPlaysAs] = useState(Players.O);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const { winner, line } = calculateWinner(squares, boardSize);
  const currentPlayer = xIsNext ? Players.X : Players.O;

  const gameOver = Boolean(winner) || isBoardFull(squares);

  useEffect(() => {
    // AI turn effect
    if (mode === Modes.AI && !gameOver) {
      const aiTurn = currentPlayer === aiPlaysAs;
      if (aiTurn) {
        const t = setTimeout(() => {
          const idx = aiMove(squares, aiPlaysAs, boardSize);
          if (idx !== null) handleMove(idx);
        }, 400); // small delay for UX
        return () => clearTimeout(t);
      }
    }
  }, [mode, aiPlaysAs, currentPlayer, squares, gameOver, boardSize]);

  useEffect(() => {
    // Update scores upon game end
    if (gameOver) {
      if (winner) {
        setScores(prev => ({ ...prev, [winner]: prev[winner] + 1 }));
      } else {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
    }
  }, [gameOver, winner]);

  const handleMove = (i) => {
    if (squares[i] || winner || gameOver) return;
    const next = squares.slice();
    next[i] = currentPlayer;
    setSquares(next);
    setXIsNext(prev => !prev);
  };

  const onCellClick = (i) => {
    // Prevent human from moving when it's AI's turn
    if (mode === Modes.AI && currentPlayer === aiPlaysAs) return;
    handleMove(i);
  };

  // PUBLIC_INTERFACE
  const resetBoard = () => {
    /** Reset board to start a new round (scores persist). */
    setSquares(emptyBoard(boardSize));
    setXIsNext(true);
  };

  // PUBLIC_INTERFACE
  const resetAll = () => {
    /** Reset board and scores. */
    setSquares(emptyBoard(boardSize));
    setXIsNext(true);
    setScores({ X: 0, O: 0, draws: 0 });
  };

  // PUBLIC_INTERFACE
  const changeMode = (newMode) => {
    /** Change game mode between HUMAN and AI, resetting the board. */
    setMode(newMode);
    resetBoard();
  };

  // PUBLIC_INTERFACE
  const changeAiSide = (side) => {
    /** Change which side the AI plays as, resetting the board. */
    setAiPlaysAs(side);
    resetBoard();
  };

  // PUBLIC_INTERFACE
  const changeBoardSize = (size) => {
    /** Change the board size, resetting the current round (scores persist). */
    setBoardSize(size);
    setSquares(emptyBoard(size));
    setXIsNext(true);
  };

  const statusText = (() => {
    if (winner) return `Winner: ${winner}`;
    if (!winner && isBoardFull(squares)) return "It's a draw!";
    return `Turn: ${currentPlayer}`;
  })();

  return (
    <div className="game">
      <div className="controls">
        <GameControls
          mode={mode}
          aiPlaysAs={aiPlaysAs}
          onChangeMode={changeMode}
          onChangeAiSide={changeAiSide}
          onResetRound={resetBoard}
          onResetAll={resetAll}
          boardSize={boardSize}
          boardSizes={BOARD_SIZES}
          onChangeBoardSize={changeBoardSize}
        />
        <Scoreboard scores={scores} />
      </div>
      <div className="status" role="status" aria-live="polite">
        {statusText}
      </div>
      <Board
        squares={squares}
        onClick={onCellClick}
        winningLine={line}
        disabled={mode === Modes.AI && currentPlayer === aiPlaysAs}
        size={boardSize}
      />
      {gameOver && (
        <div className="result">
          {winner ? `🎉 ${winner} wins!` : "🤝 It's a draw!"}
          <button className="btn btn-primary" onClick={resetBoard} aria-label="Play again">
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function GameControls({
  mode,
  aiPlaysAs,
  onChangeMode,
  onChangeAiSide,
  onResetRound,
  onResetAll,
  boardSize,
  boardSizes,
  onChangeBoardSize
}) {
  /** Renders controls to switch mode, AI side, board size, and reset game or round. */
  return (
    <div className="game-controls">
      <div className="row">
        <label className="label">Mode</label>
        <div className="btn-group" role="group" aria-label="Game mode selector">
          <button
            className={`btn ${mode === Modes.HUMAN ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onChangeMode(Modes.HUMAN)}
          >
            Human vs Human
          </button>
          <button
            className={`btn ${mode === Modes.AI ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onChangeMode(Modes.AI)}
          >
            Human vs AI
          </button>
        </div>
      </div>

      {mode === Modes.AI && (
        <div className="row">
          <label className="label">AI plays as</label>
          <div className="btn-group" role="group" aria-label="AI side selector">
            <button
              className={`btn ${aiPlaysAs === Players.X ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onChangeAiSide(Players.X)}
            >
              X (first)
            </button>
            <button
              className={`btn ${aiPlaysAs === Players.O ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onChangeAiSide(Players.O)}
            >
              O (second)
            </button>
          </div>
        </div>
      )}

      <div className="row">
        <label className="label">Board Size</label>
        <div className="btn-group" role="group" aria-label="Board size selector">
          {boardSizes.map((s) => (
            <button
              key={s}
              className={`btn ${boardSize === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onChangeBoardSize(s)}
              aria-label={`Set board size to ${s} by ${s}`}
            >
              {s}×{s}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="btn-group">
          <button className="btn btn-outline" onClick={onResetRound}>Reset Round</button>
          <button className="btn btn-danger" onClick={onResetAll}>Reset All</button>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function Scoreboard({ scores }) {
  /** Shows X wins, O wins, and draws. */
  return (
    <div className="scoreboard" aria-label="Scoreboard">
      <div className="score pill x">X: {scores.X}</div>
      <div className="score pill o">O: {scores.O}</div>
      <div className="score pill draw">Draws: {scores.draws}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function Board({ squares, onClick, winningLine, disabled, size }) {
  /** Board renders NxN cells and highlights the winning line. */
  return (
    <div
      className={`board ${disabled ? 'disabled' : ''}`}
      role="grid"
      aria-label="Tic Tac Toe board"
      style={{ '--board-size': size }}
    >
      {squares.map((value, idx) => (
        <Cell
          key={idx}
          value={value}
          onClick={() => onClick(idx)}
          highlight={winningLine.includes(idx)}
          disabled={disabled || Boolean(value)}
          index={idx}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function Cell({ value, onClick, highlight, disabled, index }) {
  /** A single cell in the grid. */
  return (
    <button
      className={`cell ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
      disabled={disabled}
      role="gridcell"
      aria-label={`Cell ${index + 1}${value ? ` with ${value}` : ''}`}
    >
      {value}
    </button>
  );
}
