import WebcamSelector from './cameraSelector';
import CameraImages from './components/CameraImages';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NewCameraView from './components/NewCameraView';
function App() {
    return (
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewCameraView />} />
          <Route path="/selected-images" element={<CameraImages />} />
          {/* other routes can go here */}
        </Routes>
      </BrowserRouter>
    );
}

export default App;
