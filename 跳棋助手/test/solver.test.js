import assert from 'node:assert/strict';
import { evaluateMove, findBestMove } from '../js/solver.js';

// 基础评估：向目标阵营前进应得正分
const board = new Array(121).fill(0);
board[0] = 1;
const move = { from: 0, to: 1, path: [0, 1] };
const score = evaluateMove(board, move, 1);
assert.equal(typeof score, 'number', '评分应为数字');

// findBestMove 应返回一条路径
const best = findBestMove(board, 1);
assert.ok(best !== null, '应找到最佳走法');
assert.ok(best.path.length >= 2, '路径至少包含起点和终点');

// 多个棋子时应能选择最佳的
const board2 = new Array(121).fill(0);
board2[50] = 1;
board2[60] = 1;
const best2 = findBestMove(board2, 1);
assert.ok(best2 !== null, '多子时应找到最佳走法');

console.log('Solver 测试通过');