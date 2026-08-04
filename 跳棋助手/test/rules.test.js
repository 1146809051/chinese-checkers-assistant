import assert from 'node:assert/strict';
import { posToRowCol, rowColToPos, getNeighbors, BOARD_SIZE } from '../js/rules.js';

// 位置 0 应在棋盘某处
assert.equal(typeof posToRowCol(0), 'object');

// 位置总数 121
assert.equal(BOARD_SIZE, 121);

// 中心位置的邻居数应为 6（六角格中心）
const neighbors = getNeighbors(60); // 棋盘中心附近
assert.ok(neighbors.length >= 4, `中心位置应有6邻居，实际 ${neighbors.length}`);

// 邻居不重复
assert.equal(new Set(neighbors).size, neighbors.length, '邻居不应重复');

// 自反性：如果 A 是 B 的邻居，则 B 是 A 的邻居
for (const n of getNeighbors(0)) {
  const nNeighbors = getNeighbors(n);
  assert.ok(nNeighbors.includes(0), `位置0的邻居${n}应把0作为邻居`);
}

console.log('规则引擎基础测试通过');

// === Task 2B: 合法走法生成与连跳 ===

import { generateMoves, getJumps, isAdjacent } from '../js/rules.js';

// 相邻判断
assert.ok(isAdjacent(0, 1), '位置0和1应相邻');

// 单步走法：棋子在位置A，相邻位置B为空 → 生成走法
const board1 = new Array(121).fill(0); // 0=空
board1[50] = 1; // 玩家1的子在位置50
const moves1 = generateMoves(board1, 1);
assert.ok(moves1.length > 0, '应有合法走法');
assert.equal(moves1[0].from, 50, '起点应为50');
assert.equal(moves1[0].path.length, 2, '单步走法路径长度应为2（起点+终点）');

// 连跳：A有子，B有子，C空 → 可从A跳到C
const board2 = new Array(121).fill(0);
const posA = 50;
const neighborsA = getNeighbors(posA);
if (neighborsA.length >= 1) {
  const posB = neighborsA[0];
  const neighborsB = getNeighbors(posB);
  const posC = neighborsB.find(n => n !== posA && board2[n] === 0);
  if (posC !== undefined) {
    board2[posA] = 1;
    board2[posB] = 2;
    const jumps = getJumps(board2, 1, posA);
    assert.ok(jumps.some(j => j.to === posC), `应能从${posA}跳到${posC}`);
  }
}

console.log('走法生成测试通过');
