// js/camera.js
let stream = null;
let facingMode = 'environment'; // 默认后置摄像头

export async function startCamera(videoEl) {
  try {
    const constraints = { audio: false };
    if (facingMode === 'environment') {
      constraints.video = { facingMode: 'environment', width: { max: 1280 }, height: { max: 720 } };
    } else {
      constraints.video = { facingMode: 'user' };
    }
    stream = await navigator.mediaDevices.getUserMedia(constraints);
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
  const ok = await startCamera(videoEl);
  if (!ok) return false;
  await waitForVideoReady(videoEl);
  return true;
}

function waitForVideoReady(videoEl) {
  return new Promise(resolve => {
    if (videoEl.videoWidth > 0) { resolve(); return; }
    const check = () => {
      if (videoEl.videoWidth > 0) { resolve(); return; }
      requestAnimationFrame(check);
    };
    videoEl.onloadedmetadata = () => { videoEl.play().then(check); };
    check();
  });
}

export function captureFrame(videoEl, canvas) {
  if (!videoEl.videoWidth || !videoEl.videoHeight) return null;
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
