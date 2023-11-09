import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const NewCameraView = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [totals, setTotals] = useState({ cars: 0, motorbikes: 0, buses: 0, trucks: 0 })
  const navigate = useNavigate();
  //fetches the cached/api data from our backend service
  const fetchCameras = async () => {
    try {
      const response = await axios.get('http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001/');
      console.log(response)
      setCameras(response.data); // updates the cameras state. 
    } catch (error) {
      console.error('Error fetching camera data:', error);
    }
  };
  //gets the current totals from the database
  const fetchTotals = async () => {
    try {
      const response = await axios.get('http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001/monitor');
      setTotals(response.data); // Update the totals state
    } catch (error) {
      console.error('Error fetching camera data:', error);
    }
  };

  useEffect(() => {


    fetchCameras();
    fetchTotals();
  }, []);
  //handles when images are selected with the checkbox adding the camera ids to the selected images state. 
  const handleSelectImage = (imageUrl) => {
    setSelectedImages(prevSelectedImages =>
      prevSelectedImages.includes(imageUrl)
        ? prevSelectedImages.filter(image => image !== imageUrl)
        : [...prevSelectedImages, imageUrl]
    );
  };
  //handles enabled selected
  const handleEnableSelected = () => {
    //makes api call to backend. 
    axios.post('http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001/activate-cameras', { selectedImages })
      .then(response => {
        console.log("Selected cameras:", response.data);
        fetchCameras();
        fetchTotals();
      })
      .catch(error => {
        console.error("Error submitting cameras:", error);
      });
  };
  //handles disabling the monitoring
  const handleDisableSelected = () => {
    //makes api call to backend    
    axios.post('http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001/deactivate-cameras', { selectedImages })
      .then(response => {
        console.log("Selected cameras:", response.data);
        fetchCameras();
        fetchTotals();
      })
      .catch(error => {
        console.error("Error submitting cameras:", error);
      });

  };
  //this wipes the cache, and database - it will refetch the data and thus you end up re-populating the cache immediately and the database but resets all statuses to false. 
  const handleHardReset = () => {
    //makes api call to backend 
    axios.get('http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001/hardreset')
      .then(response => {
        console.log("Selected cameras:", response.data);
        fetchCameras();
        fetchTotals();
      })
      .catch(error => {
        console.error("Error submitting cameras:", error);
      });
    //navigate('/selected-images', { state: { selectedImages } }); // Make sure to pass the state properly
  };


  return (
    <>
      <Navbar />

      <div id='main' className="container mt-4">

        <h1 className="text-center mb-4">Queensland Traffic Webcams</h1>
        <div className="row">
          <div className='col'><h3>Cars: {totals.cars ? <>{totals.cars}</> : <>0</>}</h3></div>
          <div className='col'><h3>Buses: {totals.buses ? <>{totals.buses}</> : <>0</>}</h3></div>
          <div className='col'><h3>Trucks: {totals.trucks ? <>{totals.trucks}</> : <>0</>}</h3></div>
          <div className='col'><h3>Motorbikes: {totals.motorbikes ? <>{totals.motorbikes}</> : <>0</>}</h3></div>
        </div>

        <div className='row'>
          <div className='col'>
            <button onClick={handleEnableSelected} className="btn btn-primary mb-3">
              Enable Cameras
            </button>
          </div>
          <div className='col'>
            <button onClick={handleDisableSelected} className="btn btn-warning mb-3">
              Disable Cameras
            </button>
          </div>
          <div className='col'>
            <button onClick={handleHardReset} className="btn btn-danger mb-3">
              Hard Reset
            </button>
          </div>
        </div>
        <div className="row">
          {cameras.map((camera, index) => (
            <div key={index} className="col-sm-6 col-md-4 col-lg-3 mb-4">
              <div className="card">
                <img src={camera.imageUrl} className="card-img-top" alt={camera.description} />
                <div className="card-body">
                  <h5 className="card-title">{camera.description}</h5>
                  <div className="form-check">


                    <div className='row'>
                      <div className='col'>
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
                      <div className='col'>
                        {camera.status ?
                          <p>status: Monitoring</p>
                          :
                          <p>status: Not Monitoring</p>

                        }
                      </div>
                      <div className='col'>
                        <Link to={`/camera/${camera.id}`}>
                          <button className="btn btn-success mb-3">
                            View this specific Camera
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NewCameraView;
