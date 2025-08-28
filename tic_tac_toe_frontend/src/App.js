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
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6], // diags
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
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
function aiMove(squares, aiPlayer) {
  const human = aiPlayer === Players.X ? Players.O : Players.X;
  const emptyIndices = squares.map((v, i) => (v ? null : i)).filter(v => v !== null);

  // Helper to simulate a move and check for immediate win
  const findWinningMove = (player) => {
    for (const idx of emptyIndices) {
      const trial = squares.slice();
      trial[idx] = player;
      if (calculateWinner(trial).winner === player) return idx;
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
   */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState(Modes.HUMAN);
  const [aiPlaysAs, setAiPlaysAs] = useState(Players.O);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const { winner, line } = calculateWinner(squares);
  const currentPlayer = xIsNext ? Players.X : Players.O;

  const gameOver = Boolean(winner) || isBoardFull(squares);

  useEffect(() => {
    // AI turn effect
    if (mode === Modes.AI && !gameOver) {
      const aiTurn = currentPlayer === aiPlaysAs;
      if (aiTurn) {
        const t = setTimeout(() => {
          const idx = aiMove(squares, aiPlaysAs);
          if (idx !== null) handleMove(idx);
        }, 400); // small delay for UX
        return () => clearTimeout(t);
      }
    }
  }, [mode, aiPlaysAs, currentPlayer, squares, gameOver]);

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
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  // PUBLIC_INTERFACE
  const resetAll = () => {
    /** Reset board and scores. */
    setSquares(Array(9).fill(null));
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
function GameControls({ mode, aiPlaysAs, onChangeMode, onChangeAiSide, onResetRound, onResetAll }) {
  /** Renders controls to switch mode, AI side, and reset game or round. */
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
function Board({ squares, onClick, winningLine, disabled }) {
  /** Board renders 3x3 cells and highlights the winning line. */
  return (
    <div
      className={`board ${disabled ? 'disabled' : ''}`}
      role="grid"
      aria-label="Tic Tac Toe board"
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
  /** A single cell in the 3x3 grid. */
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
