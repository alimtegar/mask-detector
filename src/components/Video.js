import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceApi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
// import "@tensorflow/tfjs-node";
import Dropzone from 'react-dropzone';

const InfoIcon = () => (
    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginTop: -1, }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Video = ({ 
    log, 
    setLog, 
    media, 
    // setMedia, 
    setModelStatus, 
    setCount 
}) => {
    // Constants
    const VIDEO_WIDTH = 480; // 640
    const VIDEO_HEIGHT = 360; // 480
    const FACE_API_MODELS_URI = '/models/face-api-models';
    const MASK_DETECTOR_MODEL_URI = '/models/mask-detector-model/model.json';

    // States
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    // Refs
    const videoRef = useRef();
    const canvasRef = useRef();
    const tmpCanvasRef = useRef();

    // Functions
    const renderDetectionBox = useCallback((faceDetections, maskDetectorModel) => {
        setCount((prevCount) => ({
            ...prevCount,
            face: faceDetections.length,
            masked: 0,
            notMasked: 0,
        }));
        // let maskedCount = 0;
        // let notMaskedCount = 0;

        const ctx = canvasRef.current.getContext('2d');
        const tmpCtx = tmpCanvasRef.current.getContext('2d');

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Font options
        const font = "16px sans-serif";
        ctx.font = font;
        ctx.textBaseline = "top";

        setLog('Predicting whether face/s is wearing a mask or not...');

        faceDetections.map((faceDetection) => {
            if (faceDetection) {
                setLog('Face detected');

                const x = faceDetection.box._x / videoRef.current.videoWidth * VIDEO_WIDTH;
                const y = faceDetection.box._y / videoRef.current.videoHeight * VIDEO_HEIGHT;
                const w = faceDetection.box._width / videoRef.current.videoWidth * VIDEO_WIDTH;
                const h = faceDetection.box._height / videoRef.current.videoHeight * VIDEO_HEIGHT;

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
                        setLog('Mask detected')

                        let [withMask, withoutMask] = prediction;

                        console.log({ prediction });

                        // Tresholding the prediction
                        const treshold = 0.0; // 0.3

                        withMask -= treshold;
                        withoutMask += treshold;

                        // console.log('withMask', withMask);
                        // console.log('withoutMask', withoutMask);

                        let color = '#FF0000';
                        let label = 'not masked';

                        if (withMask > withoutMask) {
                            color = '#00FF00';
                            label = 'masked'

                            // maskedCount = maskedCount + 1;
                            // console.log('maskedCount', maskedCount);
                            setCount((prevCount) => ({
                                ...prevCount,
                                masked: prevCount.masked + 1,
                            }));
                        } else {
                            setCount((prevCount) => ({
                                ...prevCount,
                                notMasked: prevCount.notMasked + 1,
                            }));
                        }

                        // Draw the box
                        // const color = withMask > withoutMask ? '#00FF00' : '#FF0000';

                        setLog('Rendering detection box...');

                        ctx.strokeStyle = color;
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x, y, w, h);

                        // Draw the label 
                        // const label = withMask > withoutMask ? 'masked' : 'not masked';

                        ctx.fillStyle = color;

                        const textWidth = ctx.measureText(label).width;
                        const textHeight = parseInt(font, 10);

                        ctx.fillRect(x - 2, y - (textHeight + 4), textWidth + 4, textHeight + 4);

                        ctx.fillStyle = "#000000";
                        ctx.fillText(label, x, y - textHeight - 2);
                    });
            }

            return true;
        });
    }, [setCount]);

    const detect = useCallback((maskDetectorModel) => {
        setLog('Detecting faces...');

        faceApi.detectAllFaces(videoRef.current)
            .then((faceDetections) => {
                renderDetectionBox(faceDetections, maskDetectorModel);
                requestAnimationFrame(() => {
                    detect(maskDetectorModel);
                });
            }).catch((error) => console.error(error));
    }, [renderDetectionBox]);

    // Effects
    useEffect(() => {
        if (media === 'webcam') {
            setLog('Loading web camera...');
            setIsVideoLoaded(false);

            navigator.mediaDevices
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
                    videoRef.current.src = null;
                    videoRef.current.srcObject = stream;
                });
        }

        const faceApiModelPromise = faceApi.nets.ssdMobilenetv1.loadFromUri(FACE_API_MODELS_URI);
        const maskDetectorModelPromise = tf.loadLayersModel(MASK_DETECTOR_MODEL_URI);

        setLog('Loading Face API models...');

        faceApiModelPromise
            .then(() => {
                setModelStatus((prevModelStatus) => ({

                    ...prevModelStatus,
                    faceApi: {
                        isLoading: false,
                        isLoaded: true,
                    },
                }));

                setLog('Face API Models are loaded');
                setLog('Loading Mask Detector model...');

                maskDetectorModelPromise
                    .then((maskDetectorModel) => {
                        setModelStatus((prevModelStatus) => ({
                            ...prevModelStatus,
                            maskDetector: {
                                isLoading: false,
                                isLoaded: true,
                            },

                        }));

                        setLog('Mask Detector Model is loaded');

                        detect(maskDetectorModel);
                    })
                    .catch((error) => {
                        setModelStatus((prevModelStatus) => ({
                            ...prevModelStatus,
                            maskDetector: {
                                isLoading: false,
                                isLoaded: false,
                            },

                        }));
                        console.error(error)
                    });
            })
            .catch((error) => {
                setModelStatus((prevModelStatus) => ({
                    ...prevModelStatus,
                    faceApi: {
                        isLoading: false,
                        isLoaded: false,
                    },

                }));
                console.error(error)
            });
    }, [detect, setModelStatus, media]);

    const predict = (maskDetectorModel) => {
        setLog('Predicting...')

        // Preprocessing image
        let image = tf.browser.fromPixels(tmpCanvasRef.current);
        image = tf.image.resizeBilinear(image, [224, 224]);
        image = tf.cast(image, 'float32');
        image = tf.tensor4d(Array.from(image.dataSync()), [1, 224, 224, 3])

        return maskDetectorModel.predict(image, { batchSize: 32 }).data();
    }

    return (
        <div className="relative flex justify-center items-center w-full h-screen">
            <div className="flex flex-col">
                <div className="flex justify-center items-center">
                    <div
                        className="relative inline-flex justify-center items-center bg-gray-300 overflow-hidden"
                        style={{
                            width: VIDEO_WIDTH,
                            height: VIDEO_HEIGHT
                        }}
                    >
                        {media === 'video' && !isVideoLoaded ? (
                            <Dropzone
                                onDrop={(acceptedFiles) => {
                                    const acceptedFile = acceptedFiles[0];

                                    setLog('Loading video...');
                                    videoRef.current.srcObject = null;
                                    videoRef.current.src = URL.createObjectURL(acceptedFile);
                                    setIsVideoLoaded(true);
                                }}
                            >
                                {({ getRootProps, getInputProps }) => (
                                    <div
                                        className="absolute z-30 flex justify-center items-center bg-gray-100 text-center text-sm text-gray-500 w-full h-full border-3 border-gray-300 hover:border-green-500 border-dashed cursor-pointer focus:outline-none"
                                        {...getRootProps()}
                                    >
                                        <input {...getInputProps()} />
                                        <p>Drag 'n' drop your video here, <br /> or click to select video</p>
                                    </div>
                                )}
                            </Dropzone>
                        ) : null}

                        <video
                            className="absolute z-10"
                            autoPlay
                            playsInline
                            width={VIDEO_WIDTH}
                            height={VIDEO_HEIGHT}
                            ref={videoRef}
                        />
                        <canvas
                            className="absolute z-20"
                            width={VIDEO_WIDTH}
                            height={VIDEO_HEIGHT}
                            ref={canvasRef}
                        />
                    </div>
                </div>

                <span className="flex items-center text-xs text-gray-600 mt-4">
                    <InfoIcon />

                    {log}
                </span>

            </div>
            <canvas
                ref={tmpCanvasRef}
                width={VIDEO_HEIGHT / 2}
                height={VIDEO_HEIGHT}
                className="absolute top-0 left-0 hidden"
            />
        </div>
    );
}

export default Video;
