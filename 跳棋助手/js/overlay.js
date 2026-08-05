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

// 画棋盘网格点位
export function drawBoardGrid() {
  if (!ctx) return;
  ctx.strokeStyle = 'rgba(138, 122, 90, 0.5)';
  ctx.lineWidth = 1;
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

// 画不确定位置（白色虚线圈）
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

// 画规划路径（黄色虚线 + 起点/终点高亮）
export function drawPath(path) {
  if (!ctx || !path || path.length < 2) return;

  // 路径线
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

  // 起点高亮
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
