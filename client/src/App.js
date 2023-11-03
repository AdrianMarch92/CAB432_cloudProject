import WebcamSelector from './cameraSelector';
import CameraImages from './components/CameraImages';

function App() {
    return (
        <div className="App">
            <cameraSelector />
            <h1>Welcome to the Camera Feed</h1>
            <CameraImages />
        </div>
    );
}

export default App;
