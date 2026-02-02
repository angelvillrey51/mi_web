const videoElement = document.getElementById('video');
const startButton = document.getElementById('startCam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const accion = document.getElementById('accion');

// IP o URL de tu ESP32
const ESP32_URL = "http://192.168.1.50/abrir"; // cambia a tu IP

// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

let vCounter = 0;          // cuántas veces se hizo la V
const vRepetitions = 2;    // V requiere 2 repeticiones
let activeTimer = null;
let manoCerrada = false;

// Contar dedos levantados
function contarDedos(landmarks) {
  const tipIds = [4, 8, 12, 16, 20];
  let dedos = [false, false, false, false, false];
  dedos[0] = landmarks[tipIds[0]].x > landmarks[tipIds[0]-1].x;
  for (let i = 1; i < tipIds.length; i++) {
    dedos[i] = landmarks[tipIds[i]].y < landmarks[tipIds[i]-2].y;
  }
  return dedos;
}

// Detectar gesto OK 👌
function detectarOK(landmarks) {
  const tipIds = [4,8,12,16,20];
  const pulgar = landmarks[tipIds[0]];
  const indice = landmarks[tipIds[1]];
  const dist = Math.hypot(pulgar.x - indice.x, pulgar.y - indice.y);
  const medio = landmarks[tipIds[2]];
  const anular = landmarks[tipIds[3]];
  const meñique = landmarks[tipIds[4]];
  const otrosLevantados = (medio.y < landmarks[tipIds[2]-2].y) &&
                           (anular.y < landmarks[tipIds[3]-2].y) &&
                           (meñique.y < landmarks[tipIds[4]-2].y);
  return dist < 0.05 && otrosLevantados;
}

// Función para mandar POST al ESP32
function enviarSenalESP32() {
  fetch(ESP32_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion: "abrir" })
  })
  .then(res => console.log("Señal enviada al ESP32"))
  .catch(err => console.error("Error enviando señal:", err));
}

// Activar acción y mandar señal
function activarAccion(texto) {
  accion.innerText = `Acción: ${texto}`;
  enviarSenalESP32(); // mandar señal al ESP32
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    accion.innerText = "Acción: Ninguna";
  }, 5000);
}

// Procesar resultados de MediaPipe
hands.onResults(results => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.image) canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FFCC', lineWidth: 5});
    drawLandmarks(canvasCtx, landmarks, {color: '#FF0066', lineWidth: 2});

    const dedos = contarDedos(landmarks);

    // --- V con estado de cierre y apertura ---
    const tresMediosCerrados = !dedos[2] && !dedos[3] && !dedos[4];
    const pulgarIndiceV = dedos[0] && dedos[1];

    if (tresMediosCerrados && !pulgarIndiceV) {
      manoCerrada = true;
    }

    if (manoCerrada && pulgarIndiceV && tresMediosCerrados) {
      vCounter++;
      manoCerrada = false;
      if (vCounter >= vRepetitions) {
        activarAccion("Abrir puerta (V)");
        vCounter = 0;
      }
    }

    // --- OK 👌 ---
    if (detectarOK(landmarks)) {
      activarAccion("Abrir puerta (OK 👌)");
    }
  }
  canvasCtx.restore();
});

// Iniciar cámara
startButton.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.play();
    videoElement.style.display = 'none';

    const processFrame = async () => {
      if (videoElement.readyState === 4) await hands.send({image: videoElement});
      requestAnimationFrame(processFrame);
    };
    processFrame();
    startButton.style.display = 'none';
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err);
  }
});
