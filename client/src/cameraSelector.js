
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WebcamSelector = () => {
    const [cameras, setCameras] = useState([]);
    const [selectedCameras, setSelectedCameras] = useState([]);

    useEffect(() => {
        // Fetch cameras when the component mounts
        axios.get('/')
            .then(response => {
                setCameras(response.data.features);
            })
            .catch(error => {
                console.error("Error fetching webcams front end:", error);
            });
    }, []);

    const handleCheckboxChange = (cameraId) => {
        setSelectedCameras(prevState => {
            if (prevState.includes(cameraId)) {
                return prevState.filter(id => id !== cameraId);
            } else {
                return [...prevState, cameraId];
            }
        });
    };

    const handleSubmit = () => {
        axios.post('/activate-cameras', { selectedCameras })
            .then(response => {
                console.log("Selected cameras:", response.data);
            })
            .catch(error => {
                console.error("Error submitting cameras:", error);
            });
    };

    return (
        <div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {cameras.map(camera => (
                    <div key={camera.id}>
                        <img src={camera.imageUrl} alt={camera.name} width="150" />
                        <input 
                            type="checkbox" 
                            checked={selectedCameras.includes(camera.id)}
                            onChange={() => handleCheckboxChange(camera.id)}
                        />
                        {camera.name}
                    </div>
                ))}
                <div>
                <button type="submit">Enable Cameras</button>
                </div>
            </form>
        </div>
    );
}

export default WebcamSelector;
