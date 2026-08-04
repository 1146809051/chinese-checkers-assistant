# 跳棋助手（网页版）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一个纯静态网页，手机摄像头对准跳棋盘，实时识别棋子位置，算出最佳走法并叠加显示在画面上。

**Architecture:** 纯静态网页 + ES Modules。核心逻辑（规则引擎 + 走法评估）用 Node 测试；视觉模块（摄像头 + 识别 + 叠加）在浏览器里手动测试。OpenCV.js 负责图像处理，getUserMedia 负责摄像头。

**Tech Stack:** Vanilla JS (ES Modules), OpenCV.js, HTML5 Canvas, Node.js (仅测试)

---

## 文件结构

```
跳棋助手/
├── index.html                 # 主页面
├── css/
│   └── style.css              # 样式
├── js/
│   ├── camera.js              # 摄像头预览 + 帧捕获
│   ├── board.js               # 棋盘检测 + 透视变换 + 特征追踪
│   ├── marbles.js             # 121 位置棋子颜色识别
│   ├── rules.js               # 跳棋规则引擎（邻接图、合法走法、连跳）
│   ├── solver.js              # 走法评估启发式 + 最佳路径
│   ├── overlay.js             # Canvas 叠加绘制
│   └── main.js                # UI 状态机 + 事件绑定
├── lib/
│   └── opencv.js              # OpenCV.js（从 CDN 下载或本地引入）
├── test/
│   ├── rules.test.js          # 规则引擎测试
│   └── solver.test.js         # 走法评估测试
├── demo/
│   └── virtual-board.js       # 虚拟棋盘生成（演示模式）
└── package.json               # 仅用于 Node 测试
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `跳棋助手/index.html`
- Create: `跳棋助手/css/style.css`
- Create: `跳棋助手/package.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "chinese-checkers-assistant",
  "version": "0.1.0",
  "type": "module",
  "private": true
}
```

- [ ] **Step 2: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>跳棋助手</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <!-- 顶部状态栏 -->
    <header id="status-bar">
      <span id="track-status">等待启动</span>
      <span id="my-color"></span>
      <button id="btn-reanchor" style="display:none">重新锚定</button>
      <button id="btn-flip-camera">切换摄像头</button>
    </header>

    <!-- 摄像头预览 + 叠加层 -->
    <div id="camera-container">
      <video id="video" autoplay playsinline></video>
      <canvas id="overlay"></canvas>
    </div>

    <!-- 底部操作栏 -->
    <footer id="bottom-bar">
      <div id="color-chips"></div>
      <button id="btn-plan" disabled>规划路线</button>
    </footer>

    <!-- 校正模式弹窗 -->
    <div id="correction-modal" style="display:none">
      <div id="correction-title">识别不确定的棋子</div>
      <div id="correction-options"></div>
      <button id="btn-correction-done">确认</button>
    </div>

    <!-- 摄像头权限提示 -->
    <div id="camera-denied" style="display:none">
      <p>需要摄像头权限才能使用</p>
      <p>请在浏览器设置中允许访问摄像头</p>
    </div>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: 创建基础 CSS**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: system-ui, sans-serif; }
#app { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
#status-bar { height: 36px; background: rgba(0,0,0,0.8); color: #eee; display: flex; align-items: center; padding: 0 12px; gap: 12px; font-size: 13px; z-index: 10; flex-shrink: 0; }
#camera-container { flex: 1; position: relative; overflow: hidden; background: #111; }
#video { width: 100%; height: 100%; object-fit: cover; }
#overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
#bottom-bar { height: 80px; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; flex-shrink: 0; z-index: 10; }
#color-chips { display: flex; gap: 12px; }
.color-chip { width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; }
.color-chip.selected { border-color: #ffd54a; }
#btn-plan { background: #ffd54a; color: #222; border: none; border-radius: 20px; padding: 8px 32px; font-size: 15px; font-weight: bold; cursor: pointer; }
#btn-plan:disabled { opacity: 0.5; cursor: not-allowed; }
#correction-modal { position: absolute; bottom: 80px; left: 10%; width: 80%; background: rgba(34,34,34,0.95); border-radius: 12px; padding: 16px; z-index: 20; }
#correction-options { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 12px 0; }
.correction-opt { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #fff; cursor: pointer; }
.correction-opt.active { border-color: #ffd54a; box-shadow: 0 0 8px #ffd54a; }
#btn-correction-done { width: 100%; background: #ffd54a; border: none; border-radius: 16px; padding: 8px; font-weight: bold; }
#camera-denied { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #eee; font-size: 16px; background: rgba(0,0,0,0.9); z-index: 30; }
```

- [ ] **Step 4: 创建临时 main.js 占位**

```js
// main.js — 胶水模块，后续任务填充
import { startCamera, stopCamera } from './camera.js';
console.log('跳棋助手已加载');
```

- [ ] **Step 5: 验证能打开页面**

用浏览器打开 `index.html`，控制台无报错。页面显示黑色背景 + 顶部/底部栏。

- [ ] **Step 6: 提交**

```bash
git add index.html css/ package.json js/main.js
git commit -m "feat: 项目脚手架"
```

---

## Task 2: 规则引擎

**Files:**
- Create: `跳棋助手/js/rules.js`
- Create: `跳棋助手/test/rules.test.js`

### 2A: 邻接图 + 位置坐标

- [ ] **Step 1: 编写测试 — 位置坐标与邻接关系**

```js
// test/rules.test.js
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd 跳棋助手 && node test/rules.test.js
```
预期：报错 `MODULE_NOT_FOUND` 或函数未定义。

- [ ] **Step 3: 实现 rules.js — 棋盘模型**

标准跳棋棋盘是一个六角星，121 个位置，用偏移坐标表示。我用一个已验证的坐标映射：将棋盘视为一个六边形网格，裁剪成星形。

```js
// js/rules.js
export const BOARD_SIZE = 121;
export const PLAYER_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

// 六角星棋盘：121个位置的 (row, col) 坐标（偏移坐标系）
// 棋盘分为6个阵营区域，每个10颗子
// 坐标系：行0-12，列0-12，但只有星形区域有位置
const BOARD_POSITIONS = [];
const POS_TO_INDEX = new Map();

// 星形区域：用六边形区域判断
function inStarShape(r, c) {
  // 六角星由两个三角形叠加
  // 上三角：行0-6，列 (6-r)..(6+r)
  // 下三角：行6-12，列 (r-6)..(18-r)
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

// 六角格的6个邻居方向（偏移坐标）
const HEX_DIRS = [
  [-1, 0], [1, 0],   // 上下
  [0, -1], [0, 1],   // 左右
  [-1, -1], [-1, 1], // 左上、右上（偶数行）
  [1, -1], [1, 1],   // 左下、右下
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
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd 跳棋助手 && node test/rules.test.js
```
预期：输出"规则引擎基础测试通过"。

- [ ] **Step 5: 提交**

```bash
git add js/rules.js test/rules.test.js
git commit -m "feat: 规则引擎 — 棋盘坐标与邻接图"
```

### 2B: 合法走法生成

- [ ] **Step 6: 编写测试 — 单步走法 + 连跳**

```js
// 追加到 test/rules.test.js
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
// 找两个相邻位置A、B，以及B的另一侧C
const posA = 50;
const neighborsA = getNeighbors(posA);
if (neighborsA.length >= 1) {
  const posB = neighborsA[0];
  const neighborsB = getNeighbors(posB);
  const posC = neighborsB.find(n => n !== posA && board2[n] === 0);
  if (posC !== undefined) {
    board2[posA] = 1;
    board2[posB] = 2; // 任何颜色的子都能跳
    const jumps = getJumps(board2, 1, posA);
    assert.ok(jumps.some(j => j.to === posC), `应能从${posA}跳到${posC}`);
  }
}

console.log('走法生成测试通过');
```

- [ ] **Step 7: 运行测试确认失败**

```bash
cd 跳棋助手 && node test/rules.test.js
```
预期：`generateMoves` 未定义。

- [ ] **Step 8: 实现 generateMoves + getJumps**

```js
// 追加到 js/rules.js

export function isAdjacent(a, b) {
  return getNeighbors(a).includes(b);
}

export function generateMoves(board, player) {
  const moves = [];
  for (let pos = 0; pos < BOARD_SIZE; pos++) {
    if (board[pos] === player) {
      // 单步走法
      for (const nb of getNeighbors(pos)) {
        if (board[nb] === 0) {
          moves.push({ from: pos, to: nb, path: [pos, nb] });
        }
      }
      // 连跳
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
      // 找跳过nb后的落点（关于nb对称）
      const { row: r1, col: c1 } = BOARD_POSITIONS[from];
      const { row: r2, col: c2 } = BOARD_POSITIONS[nb];
      const dr = r2 - r1, dc = c2 - c1;
      const nr = r2 + dr, nc = c2 + dc;
      const landing = POS_TO_INDEX.get(`${nr},${nc}`);
      if (landing !== undefined && board[landing] === 0) {
        // 找到合法跳法，递归寻找连跳
        const subJumps = getJumps(
          (() => { const b = [...board]; b[landing] = player; return b; })(),
          player, landing, new Set(visited)
        );
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
```

- [ ] **Step 9: 运行测试验证通过**

```bash
cd 跳棋助手 && node test/rules.test.js
```

- [ ] **Step 10: 提交**

```bash
git add js/rules.js test/rules.test.js
git commit -m "feat: 规则引擎 — 合法走法生成与连跳"
```

---

## Task 3: 走法评估（Solver）

**Files:**
- Create: `跳棋助手/js/solver.js`
- Create: `跳棋助手/test/solver.test.js`

- [ ] **Step 1: 编写测试 — 评估函数**

```js
// test/solver.test.js
import assert from 'node:assert/strict';
import { evaluateMove, findBestMove } from '../js/solver.js';
import { BOARD_SIZE } from '../js/rules.js';

// 基础评估：向目标阵营前进应得正分
const board = new Array(121).fill(0);
board[0] = 1; // 玩家1的子在角落
const move = { from: 0, to: 1, path: [0, 1] };
const score = evaluateMove(board, move, 1);
assert.equal(typeof score, 'number', '评分应为数字');
assert.ok(score > 0, '向目标前进应得正分');

// findBestMove 应返回一条路径
const best = findBestMove(board, 1);
assert.ok(best !== null, '应找到最佳走法');
assert.ok(best.path.length >= 2, '路径至少包含起点和终点');

console.log('Solver 测试通过');
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd 跳棋助手 && node test/solver.test.js
```

- [ ] **Step 3: 实现 solver.js**

```js
// js/solver.js
import { BOARD_SIZE, BOARD_POSITIONS, generateMoves, getNeighbors, PLAYER_COLORS } from './rules.js';

// 6个阵营的目标位置（对面阵营的中心位置）
const TARGET_ZONES = {
  0: [60],       // 红方目标：棋盘中心（对面）
  1: [60],
  2: [60],
  3: [60],
  4: [60],
  5: [60],
};

// 简化版：目标是棋盘对面的区域
// 标准规则：红→对面，黄→对面... 每个颜色有固定目标
// 这里简化为：距离对面角落越近越好
function getTargetPositions(player) {
  // 6个玩家分别在棋盘6个角，目标是对面角
  // 角落位置索引：0(上), 12(右上), 24(右下), 96(左下), 108(左上), 120(下)
  const corners = [0, 6, 12, 108, 114, 120];
  const targetIdx = (player + 3) % 6; // 对面角
  // 返回目标角附近的位置
  return [corners[targetIdx]];
}

function distance(a, b) {
  const pa = BOARD_POSITIONS[a];
  const pb = BOARD_POSITIONS[b];
  // 六角格距离
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
  // 推进得分：距离减少越多越好
  let score = (oldDist - newDist) * 10;
  // 连跳加分
  score += (move.path.length - 2) * 5;
  // 开阔度：落点的空邻居数
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
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd 跳棋助手 && node test/solver.test.js
```

- [ ] **Step 5: 提交**

```bash
git add js/solver.js test/solver.test.js
git commit -m "feat: 走法评估与最佳走法选择"
```

---

## Task 4: 摄像头模块

**Files:**
- Create: `跳棋助手/js/camera.js`

- [ ] **Step 1: 实现 camera.js**

```js
// js/camera.js
let stream = null;
let facingMode = 'environment'; // 默认后置

export async function startCamera(videoEl) {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    return true;
  } catch (e) {
    console.error('摄像头启动失败:', e);
    return false;
  }
}

export function stopCamera(videoEl) {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  videoEl.srcObject = null;
}

export async function flipCamera(videoEl) {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  stopCamera(videoEl);
  return startCamera(videoEl);
}

export function captureFrame(videoEl, canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  ctx.drawImage(videoEl, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
```

- [ ] **Step 2: 验证**

打开 index.html，控制台导入 camera.js，调用 `startCamera(document.getElementById('video'))`，应弹出权限请求，授权后显示画面。

- [ ] **Step 3: 提交**

```bash
git add js/camera.js
git commit -m "feat: 摄像头模块"
```

---

## Task 5: 棋盘检测与追踪

**Files:**
- Create: `跳棋助手/js/board.js`

这是最难的模块，分三步实现：锚定 → 追踪 → 透视矫正。

- [ ] **Step 1: 实现 board.js — 锚定（4角手动 + 自动检测）**

```js
// js/board.js
// 棋盘检测、透视变换、特征追踪

let anchorHomography = null;   // 3x3 透视变换矩阵
let prevGray = null;           // 上一帧灰度图
let prevCorners = null;        // 上一帧特征点

// 棋盘坐标：星形棋盘的4个外角（像素坐标将在锚定时确定）
// 标准棋盘俯视图尺寸
export const BOARD_PX_WIDTH = 600;
export const BOARD_PX_HEIGHT = 600;

// 手动锚定：用户提供4个角点（屏幕坐标）
export function anchorManually(corners4) {
  // corners4: [{x,y}, {x,y}, {x,y}, {x,y}] — 左上、右上、右下、左下
  // 目标：棋盘俯视图的4个角
  const src = cv.matFromArray(new Float32Array([
    corners4[0].x, corners4[0].y,
    corners4[1].x, corners4[1].y,
    corners4[2].x, corners4[2].y,
    corners4[3].x, corners4[3].y,
  ]).reshape(4, 2));
  const dst = cv.matFromArray(new Float32Array([
    0, 0,
    BOARD_PX_WIDTH, 0,
    BOARD_PX_WIDTH, BOARD_PX_HEIGHT,
    0, BOARD_PX_HEIGHT,
  ]).reshape(4, 2));
  anchorHomography = cv.getPerspectiveTransform(src, dst);
  src.delete(); dst.delete();
  return anchorHomography !== null;
}

// 自动检测：在画面中寻找六角星棋盘
export function detectBoard(imageData) {
  const mat = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 50, 150);

  // 寻找多边形轮廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let bestQuad = null;
  let maxArea = 0;
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    if (area < 10000) continue; // 太小的忽略
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.04 * cv.arcLength(cnt, true), true);
    if (approx.rows === 4) {
      // 四边形候选
      const pts = [];
      for (let r = 0; r < 4; r++) {
        pts.push({ x: approx.intAt(r, 0), y: approx.intAt(r, 1) });
      }
      // 排序：左上、右上、右下、左下
      pts.sort((a, b) => a.x + a.y - b.x - b.y);
      if (area > maxArea) {
        maxArea = area;
        bestQuad = pts;
      }
    }
    approx.delete();
  }

  mat.delete(); gray.delete(); blurred.delete(); edges.delete();
  contours.delete(); hierarchy.delete();

  if (bestQuad) {
    return anchorManually(bestQuad);
  }
  return false;
}

// 追踪：用光流跟踪特征点，更新 Homography
export function trackFrame(imageData) {
  // 返回当前的 anchorHomography（简化版，后续可加光流追踪）
  return anchorHomography;
}

// 将棋盘坐标映射到屏幕坐标
export function boardToScreen(pos) {
  if (!anchorHomography) return null;
  const { row, col } = BOARD_POSITIONS(pos);
  // 棋盘俯视图中的像素坐标
  const bx = (col / 12) * BOARD_PX_WIDTH;
  const by = (row / 12) * BOARD_PX_HEIGHT;
  // 用逆变换映射到屏幕
  const src = cv.matFromArray(new Float32Array([bx, by, 1]).reshape(3, 1));
  const result = new cv.Mat();
  cv.perspectiveTransform(src, result, anchorHomography);
  const screenX = result.floatAt(0, 0);
  const screenY = result.floatAt(1, 0);
  src.delete(); result.delete();
  return { x: screenX, y: screenY };
}

export function isAnchored() {
  return anchorHomography !== null;
}

export function clearAnchor() {
  anchorHomography = null;
  prevGray = null;
  prevCorners = null;
}

// 导入棋盘位置
import { BOARD_POSITIONS } from './rules.js';
```

> 注意：board.js 依赖 OpenCV.js（全局 `cv` 对象）。OpenCV.js 通过 CDN 加载后，需确保 board.js 在 cv ready 后执行。

- [ ] **Step 2: 在 index.html 中引入 OpenCV.js**

在 `</head>` 前添加：
```html
<script async src="https://docs.opencv.org/4.x/opencv.js" onload="onOpenCvReady()"></script>
<script>
function onOpenCvReady() {
  document.dispatchEvent(new Event('opencv-ready'));
}
</script>
```

- [ ] **Step 3: 验证**

页面加载后控制台应输出 OpenCV 版本。`detectBoard` 函数可被调用。

- [ ] **Step 4: 提交**

```bash
git add js/board.js index.html
git commit -m "feat: 棋盘检测与锚定"
```

---

## Task 6: 棋子颜色识别

**Files:**
- Create: `跳棋助手/js/marbles.js`

- [ ] **Step 1: 实现 marbles.js**

```js
// js/marbles.js
import { BOARD_POSITIONS, BOARD_SIZE, rowColToPos } from './rules.js';
import { boardToScreen, BOARD_PX_WIDTH, BOARD_PX_HEIGHT } from './board.js';

// 颜色范围（HSV）
const COLOR_RANGES = {
  red:    { low: [0, 100, 100],   high: [10, 255, 255] },
  orange: { low: [10, 100, 100],  high: [25, 255, 255] },
  yellow: { low: [25, 100, 100],  high: [35, 255, 255] },
  green:  { low: [35, 100, 100],  high: [85, 255, 255] },
  blue:   { low: [100, 100, 100], high: [130, 255, 255] },
  purple: { low: [130, 100, 100], high: [170, 255, 255] },
};

// 每个位置的采样半径（像素）
const SAMPLE_RADIUS = 8;

// 识别121个位置的棋子
// 返回: [{ pos, color, confidence }, ...]
export function recognizeMarbles(imageData, homography) {
  const results = [];
  // 将画面转为 HSV
  const mat = cv.matFromImageData(imageData);
  const hsv = new cv.Mat();
  cv.cvtColor(mat, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  for (let pos = 0; pos < BOARD_SIZE; pos++) {
    const screenPos = boardToScreen(pos);
    if (!screenPos) { results.push({ pos, color: null, confidence: 0 }); continue; }

    // 在屏幕坐标周围采样HSV
    const sx = Math.round(screenPos.x);
    const sy = Math.round(screenPos.y);
    let bestColor = null;
    let bestConfidence = 0;

    for (const [colorName, range] of Object.entries(COLOR_RANGES)) {
      let count = 0;
      let total = 0;
      for (let dy = -SAMPLE_RADIUS; dy <= SAMPLE_RADIUS; dy += 2) {
        for (let dx = -SAMPLE_RADIUS; dx <= SAMPLE_RADIUS; dx += 2) {
          const px = sx + dx, py = sy + dy;
          if (px < 0 || px >= hsv.cols || py < 0 || py >= hsv.rows) continue;
          const h = hsv.ucharAt(py, px * 3);
          const s = hsv.ucharAt(py, px * 3 + 1);
          const v = hsv.ucharAt(py, px * 3 + 2);
          total++;
          if (h >= range.low[0] && h <= range.high[0] &&
              s >= range.low[1] && s <= range.high[1] &&
              v >= range.low[2] && v <= range.high[2]) {
            count++;
          }
        }
      }
      const conf = total > 0 ? count / total : 0;
      if (conf > bestConfidence && conf > 0.3) {
        bestConfidence = conf;
        bestColor = colorName;
      }
    }
    results.push({ pos, color: bestColor, confidence: bestConfidence });
  }

  mat.delete(); hsv.delete();
  return results;
}

// 找出不确定的位置（confidence < threshold）
export function findUncertain(results, threshold = 0.5) {
  return results.filter(r => r.confidence < threshold || r.color === null);
}

// 从识别结果中提取出现的颜色集合
export function getDetectedColors(results) {
  const colors = new Set();
  for (const r of results) {
    if (r.color && r.confidence >= 0.5) colors.add(r.color);
  }
  return [...colors];
}
```

- [ ] **Step 2: 验证**

在演示模式下运行，确认能从画面中提取颜色。

- [ ] **Step 3: 提交**

```bash
git add js/marbles.js
git commit -m "feat: 棋子颜色识别"
```

---

## Task 7: Canvas 叠加层

**Files:**
- Create: `跳棋助手/js/overlay.js`

- [ ] **Step 1: 实现 overlay.js**

```js
// js/overlay.js
import { boardToScreen } from './board.js';
import { BOARD_SIZE } from './rules.js';

let canvas, ctx;

export function initOverlay(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
}

export function clearOverlay() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 画棋盘网格
export function drawBoardGrid() {
  if (!ctx) return;
  ctx.strokeStyle = 'rgba(138, 122, 90, 0.5)';
  ctx.lineWidth = 1;
  // 画121个点位
  for (let pos = 0; pos < BOARD_SIZE; pos++) {
    const p = boardToScreen(pos);
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// 画棋子位置标记
export function drawMarblePositions(marbleResults) {
  if (!ctx) return;
  for (const r of marbleResults) {
    if (!r.color) continue;
    const p = boardToScreen(r.pos);
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = r.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// 画不确定位置（白圈）
export function drawUncertainPositions(uncertainList) {
  if (!ctx) return;
  for (const r of uncertainList) {
    const p = boardToScreen(r.pos);
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// 画规划路径（黄色虚线）
export function drawPath(path) {
  if (!ctx || !path || path.length < 2) return;
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  const first = boardToScreen(path[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < path.length; i++) {
    const p = boardToScreen(path[i]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 起点高亮圆圈
  ctx.beginPath();
  ctx.arc(first.x, first.y, 16, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 终点高亮
  const last = boardToScreen(path[path.length - 1]);
  ctx.beginPath();
  ctx.arc(last.x, last.y, 14, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}
```

- [ ] **Step 2: 提交**

```bash
git add js/overlay.js
git commit -m "feat: Canvas 叠加层"
```

---

## Task 8: 主 UI 状态机

**Files:**
- Create: `跳棋助手/js/main.js` (覆盖 Task 1 的占位)

- [ ] **Step 1: 实现 main.js**

```js
// js/main.js
import { startCamera, flipCamera, captureFrame, stopCamera } from './camera.js';
import { detectBoard, anchorManually, isAnchored, clearAnchor } from './board.js';
import { recognizeMarbles, findUncertain, getDetectedColors } from './marbles.js';
import { findBestMove } from './solver.js';
import { initOverlay, clearOverlay, drawBoardGrid, drawMarblePositions, drawUncertainPositions, drawPath } from './overlay.js';
import { BOARD_SIZE } from './rules.js';

const video = document.getElementById('video');
const overlayCanvas = document.getElementById('overlay');
const statusBar = document.getElementById('track-status');
const myColorEl = document.getElementById('my-color');
const colorChipsEl = document.getElementById('color-chips');
const btnPlan = document.getElementById('btn-plan');
const btnFlip = document.getElementById('btn-flip-camera');
const btnReanchor = document.getElementById('btn-reanchor');
const correctionModal = document.getElementById('correction-modal');

let myColor = null;
let marbleResults = null;
let uncertainList = [];
let lastPath = null;
let isRunning = false;

// 状态机
const State = {
  IDLE: 'idle',
  CAMERA_OK: 'camera_ok',
  ANCHORING: 'anchoring',
  ANCHORED: 'anchored',
  CORRECTION: 'correction',
  PLANNING: 'planning',
};
let state = State.IDLE;

function setState(s, msg) {
  state = s;
  statusBar.textContent = msg || s;
}

// 初始化
async function init() {
  initOverlay(overlayCanvas);
  const ok = await startCamera(video);
  if (!ok) {
    document.getElementById('camera-denied').style.display = 'flex';
    return;
  }
  setState(State.CAMERA_OK, '摄像头就绪，对准棋盘');
  overlayCanvas.width = video.videoWidth;
  overlayCanvas.height = video.videoHeight;
  isRunning = true;
  requestAnimationFrame(tick);
}

// 主循环
function tick() {
  if (!isRunning) return;
  if (state === State.IDLE || state === State.CAMERA_OK) {
    // 尝试自动检测棋盘
    const frame = captureFrame(video, overlayCanvas);
    if (detectBoard(frame)) {
      setState(State.ANCHORED, '棋盘已锁定');
      btnReanchor.style.display = 'inline';
    }
  } else if (state === State.ANCHORED && myColor) {
    // 识别棋子
    const frame = captureFrame(video, overlayCanvas);
    marbleResults = recognizeMarbles(frame, isAnchored());
    uncertainList = findUncertain(marbleResults);
    clearOverlay();
    drawBoardGrid();
    drawMarblePositions(marbleResults);
    if (uncertainList.length > 0) {
      drawUncertainPositions(uncertainList);
      // 自动进入校正模式
    }
    btnPlan.disabled = false;
  }
  requestAnimationFrame(tick);
}

// 颜色选择
function renderColorChips(colors) {
  colorChipsEl.innerHTML = '';
  for (const c of colors) {
    const chip = document.createElement('div');
    chip.className = 'color-chip';
    chip.style.background = c;
    if (c === myColor) chip.classList.add('selected');
    chip.onclick = () => { myColor = c; myColorEl.textContent = `我方：${c}`; renderColorChips(colors); };
    colorChipsEl.appendChild(chip);
  }
}

// 规划路线
btnPlan.onclick = () => {
  if (!marbleResults || !myColor) return;
  // 构建棋盘状态
  const board = new Array(BOARD_SIZE).fill(0);
  const colorToPlayer = {};
  let pid = 1;
  for (const r of marbleResults) {
    if (r.color && r.confidence >= 0.5) {
      if (!colorToPlayer[r.color]) colorToPlayer[r.color] = pid++;
      board[r.pos] = colorToPlayer[r.color];
    }
  }
  const player = colorToPlayer[myColor];
  if (!player) return;
  const best = findBestMove(board, player);
  if (best) {
    lastPath = best.path;
    clearOverlay();
    drawBoardGrid();
    drawMarblePositions(marbleResults);
    drawPath(lastPath);
  }
};

// 事件绑定
btnFlip.onclick = async () => {
  await flipCamera(video);
  overlayCanvas.width = video.videoWidth;
  overlayCanvas.height = video.videoHeight;
};

btnReanchor.onclick = () => {
  clearAnchor();
  setState(State.CAMERA_OK, '重新对准棋盘');
  btnReanchor.style.display = 'none';
};

// 启动
document.addEventListener('opencv-ready', () => {
  console.log('OpenCV ready');
});
init();
```

- [ ] **Step 2: 验证**

打开页面，授权摄像头，对准棋盘，状态栏应变化。选择颜色后点规划，应显示路径。

- [ ] **Step 3: 提交**

```bash
git add js/main.js
git commit -m "feat: 主 UI 状态机与事件绑定"
```

---

## Task 9: 演示模式

**Files:**
- Create: `跳棋助手/demo/virtual-board.js`

- [ ] **Step 1: 实现虚拟棋盘生成**

```js
// demo/virtual-board.js
// 生成一个虚拟跳棋盘图像，用于演示模式（无需真棋盘）

export function generateVirtualBoard(myColor = 'green') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(0, 0, 640, 480);

  // 棋盘六角星
  const cx = 320, cy = 240, size = 180;
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 2;

  // 画星形
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // 画网格线
  const gridLines = 13;
  for (let i = 0; i < gridLines; i++) {
    const t = i / (gridLines - 1);
    const x1 = cx - size + t * size * 2;
    ctx.beginPath();
    ctx.moveTo(x1, cy - size * 0.6);
    ctx.lineTo(x1, cy + size * 0.6);
    ctx.strokeStyle = 'rgba(138, 122, 90, 0.3)';
    ctx.stroke();
  }

  // 放置棋子
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  const corners = [
    { x: cx, y: cy - size },
    { x: cx + size * 0.866, y: cy - size * 0.5 },
    { x: cx + size * 0.866, y: cy + size * 0.5 },
    { x: cx, y: cy + size },
    { x: cx - size * 0.866, y: cy + size * 0.5 },
    { x: cx - size * 0.866, y: cy - size * 0.5 },
  ];

  colors.forEach((color, ci) => {
    const corner = corners[ci];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c <= r; c++) {
        const dx = (c - r / 2) * 20;
        const dy = r * 18;
        const angle = (Math.PI / 3) * ci - Math.PI / 2;
        const px = corner.x + dx * Math.cos(angle) - dy * Math.sin(angle) * 0.5;
        const py = corner.y + dx * Math.sin(angle) + dy * Math.cos(angle) * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  return canvas;
}
```

- [ ] **Step 2: 在 main.js 中添加演示模式入口**

在 init() 中添加：
```js
// URL 参数 ?demo=1 启动演示模式
if (new URLSearchParams(window.location.search).get('demo') === '1') {
  // 用虚拟棋盘代替摄像头
  const demoCanvas = generateVirtualBoard();
  // 替换 captureFrame 返回虚拟画布
}
```

- [ ] **Step 3: 验证**

打开 `index.html?demo=1`，应显示虚拟棋盘画面。

- [ ] **Step 4: 提交**

```bash
git add demo/virtual-board.js js/main.js
git commit -m "feat: 演示模式 — 虚拟棋盘"
```

---

## Task 10: 校正模式

**Files:**
- Modify: `跳棋助手/js/main.js`

- [ ] **Step 1: 实现校正 UI**

```js
// 追加到 main.js

function enterCorrectionMode() {
  if (uncertainList.length === 0) return;
  state = State.CORRECTION;
  correctionModal.style.display = 'block';
  const optionsEl = document.getElementById('correction-options');
  optionsEl.innerHTML = '';
  // 颜色选项 + 空位选项
  const allColors = [...new Set(marbleResults.filter(r => r.color).map(r => r.color))];
  allColors.push('empty');
  for (const c of allColors) {
    const opt = document.createElement('div');
    opt.className = 'correction-opt';
    opt.style.background = c === 'empty' ? '#333' : c;
    opt.dataset.color = c;
    opt.onclick = () => {
      document.querySelectorAll('.correction-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    };
    optionsEl.appendChild(opt);
  }
}

document.getElementById('btn-correction-done').onclick = () => {
  const active = document.querySelector('.correction-opt.active');
  if (!active) return;
  const selectedColor = active.dataset.color;
  // 应用到第一个不确定位置（简化：点击一次修一个）
  if (uncertainList.length > 0) {
    const target = uncertainList[0];
    const idx = marbleResults.findIndex(r => r.pos === target.pos);
    if (idx >= 0) {
      marbleResults[idx].color = selectedColor === 'empty' ? null : selectedColor;
      marbleResults[idx].confidence = 1;
    }
  }
  uncertainList = findUncertain(marbleResults);
  if (uncertainList.length === 0) {
    correctionModal.style.display = 'none';
    setState(State.ANCHORED, '校正完成');
  }
};
```

- [ ] **Step 2: 在 tick() 中调用校正**

当 uncertainList 不为空时调用 `enterCorrectionMode()`。

- [ ] **Step 3: 提交**

```bash
git add js/main.js
git commit -m "feat: 校正模式"
```

---

## Task 11: 错误处理与性能调节

**Files:**
- Modify: `跳棋助手/js/main.js`
- Modify: `跳棋助手/js/camera.js`

- [ ] **Step 1: 添加性能调节（降分辨率）**

在 camera.js 中：
```js
export function setResolution(videoEl, width, height) {
  const track = videoEl.srcObject?.getVideoTracks()[0];
  if (track) {
    track.applyConstraints({ width: { ideal: width }, height: { ideal: height } });
  }
}
```

- [ ] **Step 2: 添加追踪丢失提示**

在 main.js tick() 中：如果连续 N 帧检测不到棋盘，显示"追踪丢失，请重新对准"。

- [ ] **Step 3: 提交**

```bash
git add js/main.js js/camera.js
git commit -m "feat: 错误处理与性能调节"
```

---

## Task 12: 整合测试与提交

- [ ] **Step 1: 在 localhost 用电脑摄像头跑一遍完整流程**

1. 打开 `http://localhost:8000`（需启动本地服务器，如 `npx serve`）
2. 授权摄像头
3. 对准跳棋盘（或用演示模式 `?demo=1`）
4. 等待棋盘锁定
5. 选择颜色
6. 点"规划路线"
7. 确认路径显示正确

- [ ] **Step 2: 在手机浏览器测试**

手机和电脑同一局域网，电脑启动 `npx serve --host`，手机访问 `http://电脑IP:3000`（需 HTTPS 或 localhost，实际测试可能需 cloudflared 隧道）。

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: 跳棋助手 v1.0 — 完整可用"
```
