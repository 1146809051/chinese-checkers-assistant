// js/rules.js
export const BOARD_SIZE = 121;
export const PLAYER_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

const BOARD_POSITIONS = [];
const POS_TO_INDEX = new Map();

(function initBoard() {
  // Generate all 121 positions of a Chinese Checkers hexagram board
  // Using cube coordinates (q, r, s) where q+r+s=0
  const positions = [];

  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= 8; r++) {
      const s = -q - r;
      if (Math.abs(s) > 8) continue;

      const maxCoord = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));

      if (maxCoord <= 4) {
        // Center hexagon: 61 positions
        positions.push({ q, r, s });
      } else if (maxCoord <= 8) {
        // 6 triangular arms: exactly one coordinate > 4 in absolute value
        const over4 = [q, r, s].filter(c => Math.abs(c) > 4);
        if (over4.length === 1) {
          positions.push({ q, r, s });
        }
      }
    }
  }

  // Convert cube to offset coordinates (odd-r layout)
  for (const pos of positions) {
    const row = pos.r + 8;
    const col = pos.q + 8 + ((pos.r + 8) & 1 ? 1 : 0);
    BOARD_POSITIONS.push({ row, col, q: pos.q, r: pos.r, s: pos.s });
  }

  // Sort by row then col for consistent ordering
  BOARD_POSITIONS.sort((a, b) => a.row - b.row || a.col - b.col);

  // Build index map
  for (let i = 0; i < BOARD_POSITIONS.length; i++) {
    POS_TO_INDEX.set(`${BOARD_POSITIONS[i].row},${BOARD_POSITIONS[i].col}`, i);
  }
})();

export { BOARD_POSITIONS, POS_TO_INDEX };

export function posToRowCol(pos) {
  return BOARD_POSITIONS[pos];
}

export function rowColToPos(row, col) {
  return POS_TO_INDEX.get(`${row},${col}`) ?? -1;
}

// 六角格邻居方向
const HEX_DIRS = [
  [-1, 0], [1, 0],
  [0, -1], [0, 1],
  [-1, -1], [-1, 1],
  [1, -1], [1, 1],
];

export function getNeighbors(pos) {
  const { row, col } = BOARD_POSITIONS[pos];
  const result = [];
  for (const [dr, dc] of HEX_DIRS) {
    const nr = row + dr, nc = col + dc;
    const npos = POS_TO_INDEX.get(`${nr},${nc}`);
    if (npos !== undefined) result.push(npos);
  }
  return result;
}

export function isAdjacent(a, b) {
  return getNeighbors(a).includes(b);
}

export function generateMoves(board, player) {
  const moves = [];
  for (let pos = 0; pos < BOARD_SIZE; pos++) {
    if (board[pos] === player) {
      for (const nb of getNeighbors(pos)) {
        if (board[nb] === 0) {
          moves.push({ from: pos, to: nb, path: [pos, nb] });
        }
      }
      const jumps = getJumps(board, player, pos);
      moves.push(...jumps);
    }
  }
  return moves;
}

export function getJumps(board, player, from, visited = new Set()) {
  const jumps = [];
  visited.add(from);
  for (const nb of getNeighbors(from)) {
    if (board[nb] !== 0 && !visited.has(nb)) {
      const { row: r1, col: c1 } = BOARD_POSITIONS[from];
      const { row: r2, col: c2 } = BOARD_POSITIONS[nb];
      const dr = r2 - r1, dc = c2 - c1;
      const nr = r2 + dr, nc = c2 + dc;
      const landing = POS_TO_INDEX.get(`${nr},${nc}`);
      if (landing !== undefined && board[landing] === 0) {
        const newBoard = [...board];
        newBoard[landing] = player;
        const subJumps = getJumps(newBoard, player, landing, new Set(visited));
        if (subJumps.length > 0) {
          for (const sj of subJumps) {
            jumps.push({ from, to: sj.to, path: [from, landing, ...sj.path.slice(1)] });
          }
        } else {
          jumps.push({ from, to: landing, path: [from, landing] });
        }
      }
    }
  }
  return jumps;
}
