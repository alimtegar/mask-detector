
import { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';

// Import video
// import Video from './assets/videos/video.mp4';

// Import styles
import './App.css';

function App() {
  const VIDEO_WIDTH = 480;
  const VIDEO_HEIGHT = 360;
  const FACE_API_MODELS_URI = '/models/face-api-models';
  const MASK_DETECTOR_MODEL_URI = '/models/mask-detector-model/model.json';
  const videoRef = useRef();
  const canvasRef = useRef();
  const tmpCanvasRef = useRef();

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
    const faceapiModelPromise = faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_API_MODELS_URI);
    const maskDetectorModelPromise = tf.loadLayersModel(MASK_DETECTOR_MODEL_URI);

    console.log('Webcam and models are loading');

    Promise.all([
      webCamPromise,
      faceapiModelPromise,
      maskDetectorModelPromise,
    ])
      .then((result) => {
        const _maskDetectorModel = result[2];

        console.log('Webcam and models are loaded');
        // console.log('mask detector model from promise', _maskDetectorModel.summary());

        detect(_maskDetectorModel);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const detect = (maskDetectorModel) => {
    faceapi.detectAllFaces(videoRef.current)
      .then((faceDetections) => {
        renderDetectionBox(faceDetections, maskDetectorModel);
        // setTimeout(() => { detect(maskDetectorModel); }, 1000);
        requestAnimationFrame(() => {
          // console.log('maskDetectorModel from animation', maskDetectorModel);
          detect(maskDetectorModel);
        });
      });
  };

  const renderDetectionBox = (faceDetections, maskDetectorModel) => {
    const ctx = canvasRef.current.getContext('2d');
    const tmpCtx = tmpCanvasRef.current.getContext('2d');

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    faceDetections.map((faceDetection) => {
      if (faceDetection) {
        console.log('A face is detected');

        const x = faceDetection.box._x;
        const y = faceDetection.box._y;
        const w = faceDetection.box._width;
        const h = faceDetection.box._height;

        // Crop video frame
        tmpCtx.clearRect(0, 0, tmpCtx.canvas.width, tmpCtx.canvas.height);
        tmpCtx.drawImage(
          videoRef.current,
          x, // Crop from x
          y, // Crop from y
          w, // Crop with width w
          h, // Crop with height h
          0, // Place from x
          0, // Place from y
          w, // Place with width w
          h // Place width height h
        );

        predict(maskDetectorModel)
          .then((outputs) => {
            let [withMask, withoutMask] = outputs;

            const treshold = 0.25;

            withMask -= treshold;
            withoutMask += treshold;

            console.log('withMask', withMask);
            console.log('withoutMask', withoutMask);
            console.log();

            const color = withMask > withoutMask ? '#00FF00' : '#FF0000';
            const label = withMask > withoutMask ? 'With mask' : 'Without mask';

            // Draw the bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, w, h);
          });
      }
    });
  };

  const predict = (maskDetectorModel) => {
    // const is_new_od_model = maskDetectorModel.inputs.length === 3;

    // const input_size = maskDetectorModel.inputs[0].shape[1];
    // let inputs = tf.browser.fromPixels(tmpCanvasRef.current, 3);
    // console.log('inputs', inputs);
    // inputs = tf.image.resizeBilinear(inputs.expandDims().toFloat(), [input_size, input_size]);
    // if (is_new_od_model) {
    //   console.log("Object Detection Model V2 detected.");
    //   inputs = is_new_od_model ? inputs : inputs.reverse(-1); // RGB->BGR for old models
    // }

    let inputs = tf.browser.fromPixels(tmpCanvasRef.current);

    inputs = tf.image.resizeBilinear(inputs, [224, 224]);
    inputs = tf.cast(inputs, 'float32');
    inputs = tf.tensor4d(Array.from(inputs.dataSync()), [1, 224, 224, 3])

    // console.log('inputs', inputs);
    // console.log('maskDetectorModel', maskDetectorModel);

    return maskDetectorModel.predict(inputs, { batchSize: 32 }).data();
    // return new Promise((resolve) => resolve([0, 0]));
  }

  return (
    <div className="App">
      <div id="preview">
        <video
          className="fixed"
          autoPlay
          playsInline
          muted
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          ref={videoRef}
        // src={Video}
        // type="video/mp4"
        // loop
        />
        <canvas
          className="fixed"
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          ref={canvasRef}
        />

      </div>
      <canvas
        ref={tmpCanvasRef}
        width={VIDEO_HEIGHT / 2}
        height={VIDEO_HEIGHT}
        style={{ position: 'absolute', left: 0, top: 0 }}
      />
    </div>
  );
}

export default App;
