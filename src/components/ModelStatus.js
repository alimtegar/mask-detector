const StatusIndicator = (status) => {
    const LoadedStatusIndicator = (color) => (
        <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        </svg>
    );

    const LoadingStatusIndicator = () => (
        <svg className="animate-spin h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    switch (status) {
        case 'loaded':
            return (<LoadedStatusIndicator color="green-500" />)
        case 'not-loaded':
            return (<LoadedStatusIndicator color="red-700" />)
        default:
            return (<LoadingStatusIndicator />);
    }
};

const ModelStatus = ({ modelStatus }) => (
    <div className="mb-8">
        <h2 className="text-sm text-gray-900 font-bold mb-4">
            ML Model Status
        </h2>
        <ul className="text-sm text-gray-700 border border-gray-300">
            <li>
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-300">
                    Face API Models

                    {modelStatus.faceApi.IsLoading ? (<StatusIndicator status="loading" />) : modelStatus.faceApi.IsLoaded ? (<StatusIndicator status="loaded" />) : (<StatusIndicator status="not-loaded" />)}
                </div>
            </li>
            <li>
                <div className="flex justify-between items-center px-4 py-3">
                    Mask Detector Models

                    {modelStatus.maskDetector.IsLoading ? (<StatusIndicator status="loading" />) : modelStatus.maskDetector.IsLoaded ? (<StatusIndicator status="loaded" />) : (<StatusIndicator status="not-loaded" />)}
                </div>
            </li>
        </ul>
    </div>
);

export default ModelStatus;