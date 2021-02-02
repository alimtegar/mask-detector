import { version } from '../../package.json';

// Components
import Media from './Media';
import ModelStatus from './ModelStatus';
import Count from './Count';

const Sidebar = ({
    media,
    setMedia,
    modelStatus,
    count
}) => {
    return (
        <aside>
            <div className="flex justify-between items-center bg-gray-900 text-white px-8 py-6">
                <h1 className="font-extrabold">
                    Mask Detector
            </h1>
                <span className="text-sm font-bold">
                    v{version}
                </span>
            </div>
            <div className="p-8">
                <Media media={media} setMedia={setMedia} />

                <ModelStatus modelStatus={modelStatus} />
                {/* <div className="mb-8">
                    <h2 className="text-sm text-gray-900 font-bold mb-4">
                        Active Webcam
                    </h2>

                    <select className="bg-gray-100 px-4 py-3 text-sm text-gray-700 w-full appearance-none">
                        <option value="">
                            FaceTime HD
                        </option>
                    </select>
                </div> */}
                <Count count={count} />
            </div>
        </aside>
    );
};

export default Sidebar;