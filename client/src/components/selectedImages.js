import React from 'react';
import { useLocation } from 'react-router-dom';

const SelectedImagesPage = () => {
  const location = useLocation();
  const { selectedImages } = location.state || {};

  if (!selectedImages || selectedImages.length === 0) {
    return <div>No images selected.</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Selected Queensland Traffic Webcams</h1>
      <div className="row">
        {selectedImages.map((url, index) => (
          <div key={index} className="col-sm-6 col-md-4 col-lg-3 mb-4">
            <div className="card">
              <img src={url} className="card-img-top" alt={`Selected Camera ${index}`} />
              <div className="card-body">
                <h5 className="card-title">Camera {index + 1}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedImagesPage;
