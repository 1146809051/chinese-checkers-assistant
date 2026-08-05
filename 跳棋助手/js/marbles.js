// js/marbles.js
import { BOARD_SIZE } from './rules.js';
import { boardToScreen } from './board.js';

// 颜色范围（HSV）
const COLOR_RANGES = {
  red:    { low: [0, 100, 100],   high: [10, 255, 255] },
  orange: { low: [10, 100, 100],  high: [25, 255, 255] },
  yellow: { low: [25, 100, 100],  high: [35, 255, 255] },
  green:  { low: [35, 100, 100],  high: [85, 255, 255] },
  blue:   { low: [100, 100, 100], high: [130, 255, 255] },
  purple: { low: [130, 100, 100], high: [170, 255, 255] },
};

const SAMPLE_RADIUS = 8;

// 识别121个位置的棋子颜色
// 返回: [{ pos, color, confidence }, ...]
export function recognizeMarbles(imageData, homography) {
  const results = [];
  try {
    const mat = cv.matFromImageData(imageData);
    const hsv = new cv.Mat();
    cv.cvtColor(mat, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    for (let pos = 0; pos < BOARD_SIZE; pos++) {
      const screenPos = boardToScreen(pos);
      if (!screenPos) { results.push({ pos, color: null, confidence: 0 }); continue; }

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
  } catch (e) {
    console.error('棋子识别失败:', e);
  }
  return results;
}

// 找出不确定的位置
export function findUncertain(results, threshold = 0.5) {
  return results.filter(r => r.confidence < threshold || r.color === null);
}

// 提取出现的颜色集合
export function getDetectedColors(results) {
  const colors = new Set();
  for (const r of results) {
    if (r.color && r.confidence >= 0.5) colors.add(r.color);
  }
  return [...colors];
}