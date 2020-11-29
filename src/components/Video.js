
import { Fragment, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';

function App() {
    const VIDEO_WIDTH = 640;
    const VIDEO_HEIGHT = 480;
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
                requestAnimationFrame(() => {
                    detect(maskDetectorModel);
                });
            });
    };

    const renderDetectionBox = (faceDetections, maskDetectorModel) => {
        const ctx = canvasRef.current.getContext('2d');
        const tmpCtx = tmpCanvasRef.current.getContext('2d');

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Font options
        const font = "16px sans-serif";
        ctx.font = font;
        ctx.textBaseline = "top";

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
                        const treshold = 0.25;

                        withMask -= treshold;
                        withoutMask += treshold;

                        // Draw the box
                        const color = withMask > withoutMask ? '#00FF00' : '#FF0000';

                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, h);

                        // Draw the label 
                        const label = withMask > withoutMask ? 'masked' : 'not masked';

                        ctx.fillStyle = color;

                        const textWidth = ctx.measureText(label).width;
                        const textHeight = parseInt(font, 10);

                        ctx.fillRect(x - 1, y - (textHeight + 4), textWidth + 4, textHeight + 4);

                        ctx.fillStyle = "#000000";
                        ctx.fillText(label, x, y - textHeight);
                    });
            }

            return false;
        });
    };

    const predict = (maskDetectorModel) => {
        // Preprocessing image
        let image = tf.browser.fromPixels(tmpCanvasRef.current);
        image = tf.image.resizeBilinear(image, [224, 224]);
        image = tf.cast(image, 'float32');
        image = tf.tensor4d(Array.from(image.dataSync()), [1, 224, 224, 3])

        return maskDetectorModel.predict(image, { batchSize: 32 }).data();
    }

    return (
        <div className="flex justify-center items-center w-full h-full">
            <div className="flex justify-center items-center">
                <div
                    className="relative inline-flex bg-gray-300 overflow-hidden"
                    style={{
                        width: VIDEO_WIDTH,
                        height: VIDEO_HEIGHT
                    }}
                >
                    <video
                        className="absolute"
                        autoPlay
                        playsInline
                        muted
                        width={VIDEO_WIDTH}
                        height={VIDEO_HEIGHT}
                        ref={videoRef}
                    />
                    <canvas
                        className="absolute"
                        width={VIDEO_WIDTH}
                        height={VIDEO_HEIGHT}
                        ref={canvasRef}
                    />

                </div>
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
