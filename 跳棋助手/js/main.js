// js/main.js
import { startCamera, flipCamera, captureFrame } from './camera.js';
import { detectBoard, anchorManually, isAnchored, clearAnchor, boardToScreen } from './board.js';
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
let framesSinceLastDetection = 0;
const TRACKING_LOST_THRESHOLD = 30;

const State = {
  IDLE: 'idle',
  CAMERA_OK: 'camera_ok',
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

  // 演示模式：使用虚拟棋盘
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === '1') {
    const { generateVirtualBoard } = await import('../demo/virtual-board.js');
    const virtualCanvas = generateVirtualBoard(myColor || 'green');
    video.style.display = 'none';
    document.getElementById('camera-denied').style.display = 'none';

    const demoContainer = document.createElement('div');
    demoContainer.id = 'demo-container';
    demoContainer.appendChild(virtualCanvas);
    video.parentNode.insertBefore(demoContainer, video);

    overlayCanvas.width = virtualCanvas.width;
    overlayCanvas.height = virtualCanvas.height;
    setState(State.ANCHORED, '演示模式 — 虚拟棋盘已加载');
    isRunning = true;
    requestAnimationFrame(tick);
    return;
  }

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

  if (state === State.CAMERA_OK) {
    // 尝试自动检测棋盘
    const frame = captureFrame(video, overlayCanvas);
    if (detectBoard(frame)) {
      setState(State.ANCHORED, '棋盘已锁定，请选择颜色');
      btnReanchor.style.display = 'inline';
      framesSinceLastDetection = 0;

      // 识别棋子并显示颜色选择
      marbleResults = recognizeMarbles(frame, isAnchored());
      const colors = getDetectedColors(marbleResults);
      if (colors.length > 0) {
        renderColorChips(colors);
      }
    }
  } else if (state === State.ANCHORED) {
    // 识别棋子
    const frame = captureFrame(video, overlayCanvas);

    // 追踪丢失检测
    if (detectBoard(frame)) {
      framesSinceLastDetection = 0;
    } else {
      framesSinceLastDetection++;
    }

    if (framesSinceLastDetection > TRACKING_LOST_THRESHOLD) {
      setState(State.ANCHORED, '追踪丢失，请重新对准');
      clearOverlay();
      requestAnimationFrame(tick);
      return;
    }

    marbleResults = recognizeMarbles(frame, isAnchored());
    uncertainList = findUncertain(marbleResults);

    clearOverlay();
    drawBoardGrid();
    drawMarblePositions(marbleResults);

    if (uncertainList.length > 0) {
      drawUncertainPositions(uncertainList);
      setState(State.CORRECTION, `有 ${uncertainList.length} 颗识别不确定`);
    } else if (myColor) {
      btnPlan.disabled = false;
    }
  } else if (state === State.CORRECTION) {
    // 等待用户校正
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
    chip.onclick = () => {
      myColor = c;
      myColorEl.textContent = `我方：${c}`;
      renderColorChips(colors);
      setState(State.ANCHORED, `已选择 ${c}，等待识别`);
    };
    colorChipsEl.appendChild(chip);
  }
}

// 规划路线按钮
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
    statusBar.textContent = `规划完成：${best.path.length}步`;
  }
};

// 切换摄像头
btnFlip.onclick = async () => {
  await flipCamera(video);
  overlayCanvas.width = video.videoWidth;
  overlayCanvas.height = video.videoHeight;
};

// 重新锚定
btnReanchor.onclick = () => {
  clearAnchor();
  setState(State.CAMERA_OK, '重新对准棋盘');
  btnReanchor.style.display = 'none';
};

// 校正模式 — 点击颜色圆点校正
function enterCorrectionMode() {
  if (uncertainList.length === 0) return;
  correctionModal.style.display = 'block';
  const optionsEl = document.getElementById('correction-options');
  optionsEl.innerHTML = '';

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

  // 应用到第一个不确定位置
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
    btnPlan.disabled = false;
  } else {
    statusBar.textContent = `还剩 ${uncertainList.length} 颗需校正`;
  }
};

// 启动
document.addEventListener('opencv-ready', () => {
  console.log('OpenCV ready');
});

window.onerror = function(msg, url, line, col, error) {
  statusBar.textContent = 'JS错误: ' + msg;
  console.error('全局错误:', msg, url, line, col, error);
};

init().catch(e => {
  console.error('init失败:', e);
  statusBar.textContent = '启动失败: ' + e.message;
});
