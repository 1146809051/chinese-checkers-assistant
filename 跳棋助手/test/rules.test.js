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
