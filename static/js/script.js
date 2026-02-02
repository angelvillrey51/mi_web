const videoElement = document.getElementById('video');
const startButton = document.getElementById('startCam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const contador = document.getElementById('contador');

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(results => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FFCC', lineWidth: 5});
    drawLandmarks(canvasCtx, landmarks, {color: '#FF0066', lineWidth: 2});

    // Contar dedos
    const tipIds = [4, 8, 12, 16, 20];
    let dedos = 0;
    if (landmarks[tipIds[0]].x > landmarks[tipIds[0]-1].x) dedos++;
    for (let i = 1; i < tipIds.length; i++) {
      if (landmarks[tipIds[i]].y < landmarks[tipIds[i]-2].y) dedos++;
    }
    contador.innerText = `Dedos levantados: ${dedos}`;
  } else {
    contador.innerText = `Dedos levantados: 0`;
  }
  canvasCtx.restore();
});

startButton.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.play();

    const video = videoElement;
    const cameraLoop = async () => {
      await hands.send({image: video});
      requestAnimationFrame(cameraLoop);
    };
    cameraLoop();
    startButton.style.display = 'none';
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err);
  }
});
