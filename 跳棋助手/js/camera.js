// js/camera.js
let stream = null;
let facingMode = 'environment'; // 默认后置摄像头

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

export function setResolution(videoEl, width, height) {
  const track = videoEl.srcObject?.getVideoTracks()[0];
  if (track) {
    track.applyConstraints({ width: { ideal: width }, height: { ideal: height } });
  }
}