import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewCameraView = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await axios.get('http://localhost:3001/');
        setCameras(response.data); // Update this to set the camera details
      } catch (error) {
        console.error('Error fetching camera data:', error);
      }
    };

    fetchCameras();
  }, []);

  const handleSelectImage = (imageUrl) => {
    setSelectedImages(prevSelectedImages =>
      prevSelectedImages.includes(imageUrl)
        ? prevSelectedImages.filter(image => image !== imageUrl)
        : [...prevSelectedImages, imageUrl]
    );
  };

  const handleViewSelected = () => {
    
    axios.post('http://localhost:3001/activate-cameras', { selectedImages })
            .then(response => {
                console.log("Selected cameras:", response.data);
            })
            .catch(error => {
                console.error("Error submitting cameras:", error);
            });
    //navigate('/selected-images', { state: { selectedImages } }); // Make sure to pass the state properly
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Queensland Traffic Webcams</h1>
      <button onClick={handleViewSelected} className="btn btn-primary mb-3">
        View Selected
      </button>
      <div className="row">
        {cameras.map((camera, index) => (
          <div key={index} className="col-sm-6 col-md-4 col-lg-3 mb-4">
            <div className="card">
              <img src={camera.imageUrl} className="card-img-top" alt={camera.description} />
              <div className="card-body">
                <h5 className="card-title">{camera.description}</h5>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`camera-checkbox-${index}`}
                    checked={selectedImages.includes(camera.id)}
                    onChange={() => handleSelectImage(camera.id)}
                  />
                  <label className="form-check-label" htmlFor={`camera-checkbox-${index}`}>
                    Select
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewCameraView;
