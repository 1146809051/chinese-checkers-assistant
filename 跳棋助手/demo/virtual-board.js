// demo/virtual-board.js
// 生成虚拟跳棋盘图像，用于演示模式

export function generateVirtualBoard(myColor = 'green') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(0, 0, 640, 480);

  const cx = 320, cy = 240, size = 160;

  // 画六角星轮廓
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 2;
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
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 20, cy - size * 0.8);
    ctx.lineTo(cx + i * 20, cy + size * 0.8);
    ctx.strokeStyle = 'rgba(138, 122, 90, 0.3)';
    ctx.stroke();
  }

  // 6个角落的颜色和位置
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  const angles = [-Math.PI/2, -Math.PI/6, Math.PI/6, Math.PI/2, 5*Math.PI/6, -5*Math.PI/6];

  colors.forEach((color, ci) => {
    const angle = angles[ci];
    const cornerX = cx + size * 0.8 * Math.cos(angle);
    const cornerY = cy + size * 0.8 * Math.sin(angle);

    // 每个角落放4颗棋子（简化版，10颗太挤）
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c <= r; c++) {
        const dx = (c - r / 2) * 18;
        const dy = r * 16;
        const px = cornerX + dx * Math.cos(angle) - dy * Math.sin(angle) * 0.5;
        const py = cornerY + dx * Math.sin(angle) + dy * Math.cos(angle) * 0.5;

        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  // 标注文字
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('虚拟棋盘 — 演示模式', cx, 30);
  ctx.fillText(`我的颜色: ${myColor}`, cx, 470);

  return canvas;
}
