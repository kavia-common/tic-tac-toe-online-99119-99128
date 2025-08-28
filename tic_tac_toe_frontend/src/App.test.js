import { render, screen } from '@testing-library/react';
import App from './App';

test('renders title and controls', () => {
  render(<App />);
  const title = screen.getByText(/Tic Tac Toe/i);
  expect(title).toBeInTheDocument();

  const modeButton = screen.getByRole('button', { name: /Human vs Human/i });
  expect(modeButton).toBeInTheDocument();

  const board = screen.getByRole('grid', { name: /Tic Tac Toe board/i });
  expect(board).toBeInTheDocument();
});
