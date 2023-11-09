import React from 'react';
const DataDisplay = ({ data }) => {
  //simple bootstrap themed table that maps the data props to a table. 
    return (
      <div className="container mt-4">
        <h2>Data Table</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Recorded Timestamp</th>
              <th>Camera ID</th>
              <th>Cars</th>
              <th>Buses</th>
              <th>Trucks</th>
              <th>Motorbikes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.recorded_timestamp}</td>
                <td>{item.cameraid}</td>
                <td>{item.cars}</td>
                <td>{item.buses}</td>
                <td>{item.trucks}</td>
                <td>{item.motorbikes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default DataDisplay;