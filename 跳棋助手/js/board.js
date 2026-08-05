// js/board.js
import { BOARD_POSITIONS, BOARD_SIZE, rowColToPos } from './rules.js';

let anchorHomography = null;
let prevGray = null;
let prevCorners = null;

export const BOARD_PX_WIDTH = 600;
export const BOARD_PX_HEIGHT = 600;

export function anchorManually(corners4) {
  try {
    const src = cv.matFromArray(4, 1, cv.CV_32FC2, new Float32Array([
      corners4[0].x, corners4[0].y,
      corners4[1].x, corners4[1].y,
      corners4[2].x, corners4[2].y,
      corners4[3].x, corners4[3].y,
    ]));
    const dst = cv.matFromArray(4, 1, cv.CV_32FC2, new Float32Array([
      0, 0,
      BOARD_PX_WIDTH, 0,
      BOARD_PX_WIDTH, BOARD_PX_HEIGHT,
      0, BOARD_PX_HEIGHT,
    ]));
    anchorHomography = cv.getPerspectiveTransform(src, dst);
    src.delete();
    dst.delete();
    return anchorHomography !== null;
  } catch (e) {
    console.error('锚定失败:', e);
    return false;
  }
}

export function detectBoard(imageData) {
  try {
    const mat = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let bestQuad = null;
    let maxArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area < 10000) continue;
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.04 * cv.arcLength(cnt, true), true);
      if (approx.rows === 4) {
        const pts = [];
        for (let r = 0; r < 4; r++) {
          pts.push({ x: approx.intAt(r, 0), y: approx.intAt(r, 1) });
        }
        pts.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        if (area > maxArea) {
          maxArea = area;
          bestQuad = pts;
        }
      }
      approx.delete();
    }

    mat.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();

    if (bestQuad) {
      return anchorManually(bestQuad);
    }
    return false;
  } catch (e) {
    console.error('检测失败:', e);
    return false;
  }
}

export function trackFrame(imageData) {
  return anchorHomography;
}

export function boardToScreen(pos) {
  if (!anchorHomography) return null;
  const { row, col } = BOARD_POSITIONS[pos];
  const bx = (col / 16) * BOARD_PX_WIDTH;
  const by = (row / 16) * BOARD_PX_HEIGHT;
  try {
    const src = cv.matFromArray(3, 1, cv.CV_64FC1, [bx, by, 1]);
    const result = new cv.Mat();
    cv.perspectiveTransform(src, result, anchorHomography);
    const screenX = result.doubleAt(0, 0);
    const screenY = result.doubleAt(1, 0);
    src.delete();
    result.delete();
    return { x: screenX, y: screenY };
  } catch (e) {
    return null;
  }
}

export function isAnchored() {
  return anchorHomography !== null;
}

export function clearAnchor() {
  anchorHomography = null;
  prevGray = null;
  prevCorners = null;
}
