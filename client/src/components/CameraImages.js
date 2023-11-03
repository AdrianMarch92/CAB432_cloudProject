import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CameraImages = () => {
  const [imageUrls, setImageUrls] = useState([]);

  useEffect(() => {
    const fetchImageUrls = async () => {
      try {
        // Replace '/api/cameras' with the actual route to your Express backend
        const response = await axios.get('http://localhost:3001/');
        setImageUrls(response.data); // Assuming the backend sends an array of image URLs
      } catch (error) {
        console.error('Error fetching image URLs:', error);
      }
    };

    fetchImageUrls();
  }, []);

  return (
    <div>
      <h1>Camera Images</h1>
      <div>
        {imageUrls.map((url, index) => (
          <img key={index} src={url} alt={`Camera ${index}`} />
        ))}
      </div>
    </div>
  );
};

export default CameraImages;
