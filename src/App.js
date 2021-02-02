import { useState } from 'react';

// Components
import Sidebar from './components/Sidebar';
import Video from './components/Video';

const App = () => {
  // States
  const initModelStatus = { isLoading: true, };
  const [log, setLog] = useState("");
  const [media, setMedia] = useState('video');
  const [modelStatus, setModelStatus] = useState({
    faceApi: initModelStatus,
    maskDetector: initModelStatus,
  });
  const [count, setCount] = useState({
    face: 0,
    masked: 0,
    notMasked: 0,
  });

  return (
    <div className="App font-mulish">
      <main>
        <div className="grid grid-cols-4">
          <div>
            <Sidebar
              media={media}
              setMedia={setMedia}
              modelStatus={modelStatus}
              count={count}
            />
          </div>
          <section className="col-span-3 bg-gray-100 min-h-screen">

            <Video
              log={log}
              setLog={setLog}
              media={media}
              setMedia={setMedia}
              setModelStatus={setModelStatus}
              setCount={setCount}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;