const express = require('express');
const axios = require('axios');
var router = express.Router();
const AWS = require('aws-sdk');



//base route gets the totals
router.get('/', async (req, res, _) => {

    //unused body parameter
    const { selectedImages } = req.body;

    try {
        //get the totals from the database for each category to be displayed on the home page. 
        const trafficSums = {};
        const columnsToSum = ['cars', 'motorbikes', 'buses', 'trucks'];

        for (const column of columnsToSum) {
            const sumResult = await req.db.from('traffic.public.traffic_volume').sum({ [column]: `${column}` });
            trafficSums[column] = sumResult[0][column] || 0;
        }

        res.json(trafficSums);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update status for selected cameras.');
    }
});

//does the same thing but for individual camera
router.get('/:id', async (req, res, _) => {
    // Get the camera ID from the URL parameter
    const id = req.params.id;

    try {
        //We will use the cached data to get the details to be displayed this saves api calls to qld traffic
        const cachedCameraDetails = await req.redis.get(`cameraDetails`);

        if (cachedCameraDetails) {
            // If data exists in Redis for this specific camera ID, parse and send the cached data
            const parsedData = JSON.parse(cachedCameraDetails);

            const cameraDetail = parsedData.filter((camera) => camera.id == id);
            const trafficSums = {};
            const columnsToSum = ['cars', 'motorbikes', 'buses', 'trucks'];

            for (const column of columnsToSum) {
                const sumResult = await req.db.from('traffic.public.traffic_volume')
                    .where('cameraid', id) // Use the camera ID in the WHERE clause
                    .sum({ [column]: `${column}` });
                trafficSums[column] = sumResult[0][column] || 0;
            }
            //we send back one big json object.
            res.json({ cameraDetail: cameraDetail, trafficSums });

        } else {
            // Fetch camera details from the API if not found in Redis
            const response = await axios.get('https://api.qldtraffic.qld.gov.au/v1/webcams', {
                params: {
                    apikey: '8bvRR10buqalcqbuoiNZc75Ak4xPY2eY1CPgXFVk'
                }
            });

            const cameraDetails = response.data.features.map(feature => {
                return {
                    id: feature.properties.id,
                    description: feature.properties.description,
                    imageUrl: feature.properties.image_url
                };
            });


            const cameraDetail = cameraDetails.filter((camera) => camera.id == id);
            //I won't store into redis because I am just working with one camera id. when the user navigates back to home we will store the data anyway. 

            const trafficSums = {};
            const columnsToSum = ['cars', 'motorbikes', 'buses', 'trucks'];

            for (const column of columnsToSum) {
                const sumResult = await req.db.from('traffic.public.traffic_volume')
                    .where('cameraid', id) // Use the camera ID in the WHERE clause
                    .sum({ [column]: `${column}` });
                trafficSums[column] = sumResult[0][column] || 0;
            }

            res.json({ cameraDetail: cameraDetail, trafficSums });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve camera details and traffic sums.');
    }
});

//returns a detailed list of the rows for that camera
router.get('/:id/data', async (req, res, _) => {
    const id = req.params.id;
    try {
        const rowData = await req.db.from('traffic.public.traffic_volume')
            .where('cameraid', id); // Use the camera ID in the WHERE clause

        res.json(rowData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve row data.');
    }
});

module.exports = router;