import WebcamSelector from './cameraSelector';
import CameraImages from './components/CameraImages';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NewCameraView from './components/NewCameraView';
import CameraDetails from './components/CameraDetails';
function App() {
    return (
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewCameraView />} />
          <Route path='/camera/:id' element={<CameraDetails />} />
          <Route path="/selected-images" element={<CameraImages />} />
          {/* other routes can go here */}
        </Routes>
      </BrowserRouter>
    );
}

export default App;
