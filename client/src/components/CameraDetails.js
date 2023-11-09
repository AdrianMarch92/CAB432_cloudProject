import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; 
import Navbar from './Navbar';
import DataDisplay from './DataDisplay'

const CameraDetails = () => {
  const [data, setData] = useState(null);
  const { id } = useParams(); // Gets the ID from the URL params 
  const [rowData, setRowData] = useState(null); // row data starts off as a null object
  //getches the data to redner on the page, this should be a cached version of the data from the qld traffic api. 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001/monitor/${id}`); 
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [id]); 

  //when the button is pressed we return all of the detailed data as row data. 
  const handleEnableSelected = () => {
    
    axios.get(`http://ec2-3-104-65-218.ap-southeast-2.compute.amazonaws.com:3001/monitor/${id}/data`)
            .then(response => {
                console.log("Selected cameras:", response.data);
                setRowData(response.data);

            })
            .catch(error => {
                console.error("Error submitting cameras:", error);
            });
    //navigate('/selected-images', { state: { selectedImages } }); // Make sure to pass the state properly
  };

  return (



    <div className='maincontainer'>
      <Navbar />
      
      {
      //turnery so if the data is loaded it shows otherwise the user gets loading text.
      data ? (
        <div>
              
         <div id='main' className="container mt-4">
        
  
    
      <h1 className="text-center mb-4">{data.cameraDetail[0].description}</h1>
      <div className="row">
        <div className='col'><h3>Cars: {data.trafficSums.cars ?<>{data.trafficSums.cars}</>:<>0</> }</h3></div>
        <div className='col'><h3>Buses: {data.trafficSums.buses ?<>{data.trafficSums.buses}</>:<>0</> }</h3></div>
        <div className='col'><h3>Trucks: {data.trafficSums.trucks ?<>{data.trafficSums.trucks}</>:<>0</> }</h3></div>
        <div className='col'><h3>Motorbikes: {data.trafficSums.motorbikes ?<>{data.trafficSums.motorbikes}</>:<>0</> }</h3></div>
      </div>

      <div className='row'>
        <h2>Status: 

          {data.cameraDetail[0].status? <>Monitoring</>: <>Not Monitoring</>} </h2>
      </div>
      <div className="row">
        {data.cameraDetail.map((camera, index) => (
          <div key={index} className="col-lg-5 mb-4">
            <div className="card">
              <img src={camera.imageUrl} className="card-img-top" alt={camera.description} />
   
            </div>
          </div>
        ))}
        <button onClick={handleEnableSelected} className="btn btn-primary mb-3">
        Show the detailed logs
      </button>
      </div>
          {
            //after fetching the data we then pass it to datadisplay which maps the data as a table using bootstrap convetntions
            rowData?
            <><DataDisplay data={rowData} /></>
            :
            <>NoData</>
          }

    </div>
          
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default CameraDetails;