import { BOARD_SIZE, BOARD_POSITIONS, generateMoves, getNeighbors } from './rules.js';

// 4 corners of the diamond-shaped board (top, left, right, bottom)
const CORNERS = [0, 36, 48, 84];

function getTargetPositions(player) {
  const targetCorner = CORNERS[(player + 2) % 4];
  const targets = [targetCorner];
  const { row, col } = BOARD_POSITIONS[targetCorner];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr, nc = col + dc;
      const idx = BOARD_POSITIONS.findIndex(p => p.row === nr && p.col === nc);
      if (idx !== -1 && idx !== targetCorner) targets.push(idx);
    }
  }
  return targets;
}

function distance(a, b) {
  const pa = BOARD_POSITIONS[a];
  const pb = BOARD_POSITIONS[b];
  return Math.max(
    Math.abs(pa.row - pb.row),
    Math.abs(pa.col - pb.col),
    Math.abs((pa.row - pa.col) - (pb.row - pb.col))
  );
}

function minDistToTarget(pos, targets) {
  let min = Infinity;
  for (const t of targets) {
    const d = distance(pos, t);
    if (d < min) min = d;
  }
  return min;
}

export function evaluateMove(board, move, player) {
  const targets = getTargetPositions(player);
  const oldDist = minDistToTarget(move.from, targets);
  const newDist = minDistToTarget(move.to, targets);
  let score = (oldDist - newDist) * 10;
  score += (move.path.length - 2) * 5;
  const emptyNeighbors = getNeighbors(move.to).filter(n => board[n] === 0).length;
  score += emptyNeighbors;
  return score;
}

export function findBestMove(board, player) {
  const moves = generateMoves(board, player);
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const score = evaluateMove(board, m, player);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}