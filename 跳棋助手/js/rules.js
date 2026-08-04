// js/rules.js
export const BOARD_SIZE = 121;
export const PLAYER_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

// 棋盘位置：星形棋盘的121个位置的 (row, col) 坐标
// 星形由两个三角形叠加：上三角 行0-6，下三角 行6-12
const BOARD_POSITIONS = [];
const POS_TO_INDEX = new Map();

function inStarShape(r, c) {
  if (r >= 0 && r <= 6 && c >= 6 - r && c <= 6 + r) return true;
  if (r >= 6 && r <= 12 && c >= r - 6 && c <= 18 - r) return true;
  return false;
}

(function initBoard() {
  let idx = 0;
  for (let r = 0; r <= 12; r++) {
    for (let c = 0; c <= 12; c++) {
      if (inStarShape(r, c)) {
        BOARD_POSITIONS.push({ row: r, col: c });
        POS_TO_INDEX.set(`${r},${c}`, idx);
        idx++;
      }
    }
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
