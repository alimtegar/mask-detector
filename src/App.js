
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

  // Refs
  const videoRef = useRef();
  const canvasRef = useRef();
  const tmpCanvasRef = useRef();

  useEffect(() => {
    const webCamPromise = navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          // Prevent different size between video and canvas
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        },
      })
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
        // console.log('mask detector model from promise', _maskDetectorModel);

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
          x, // x coordinate where to start cropping the frame
          y, // y coordinate where to start cropping the frame
          w, // w (width) of the cropped frame
          h, // h (height) of the cropped frame
          0, // x coordinate where to start placing the cropped frame
          0, // y coordinate where to start placing the cropped frame
          w, // w (width) of the cropped frame
          h  // h (height) of the cropped frame
        );

        predict(maskDetectorModel)
          .then((prediction) => {
            let [withMask, withoutMask] = prediction;

            // Tresholding the prediction
            const treshold = 0.3;

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

    // Preprocessing image
    let image = tf.browser.fromPixels(tmpCanvasRef.current);
    image = tf.image.resizeBilinear(image, [224, 224]);
    image = tf.cast(image, 'float32');
    image = tf.tensor4d(Array.from(image.dataSync()), [1, 224, 224, 3])

    // console.log('image', image);
    // console.log('maskDetectorModel', maskDetectorModel);

    return maskDetectorModel.predict(image, { batchSize: 32 }).data();
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
