
import { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

function App() {
  const WIDTH = 360;
  const HEIGHT = 480;
  const FACE_API_MODELS_URI = '/models/face-api-models';
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const webCamPromise = navigator.mediaDevices
      .getUserMedia({ video: true, })
      .then((stream) => {
        window.stream = stream;
        videoRef.current.srcObject = stream;

        return new Promise((resolve, _) => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });
      });

    const faceapiPromise = faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_API_MODELS_URI);

    Promise.all([
      webCamPromise,
      faceapiPromise,
    ])
      .then(() => {
        detectFrame(videoRef.current)
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const detectFrame = (input) => {
    faceapi.detectAllFaces(input)
      .then((faceDetections) => {
        renderDetectionBox(faceDetections);

        setTimeout(() => { detectFrame(videoRef.current); }, 1000);
      });
  };

  const renderDetectionBox = (faceDetections) => {
    const ctx = canvasRef.current.getContext('2d');

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    faceDetections.map((faceDetection) => {
      if (faceDetection) {
        // console.log(faceDetection);
        const x = faceDetection.box._x;
        const y = faceDetection.box._y;
        const w = faceDetection.box._width;
        const h = faceDetection.box._height;

        // Draw the bounding box
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);
      }
    });
  };

  return (
    <div>
      <video
        autoPlay
        playsInline
        muted
        width={WIDTH}
        height={HEIGHT}
        ref={videoRef}
      />
      <canvas
        width={WIDTH}
        height={HEIGHT}
        ref={canvasRef}
      />
    </div>
  );
}

export default App;
