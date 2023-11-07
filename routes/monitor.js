const express = require('express');
const axios = require('axios');
var router = express.Router();
const AWS = require('aws-sdk');


// Existing routes...

router.get('/', async (req, res, _) => {

    const { selectedImages } = req.body;

    try {
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

router.get('/:id', async (req, res, _) => {
    const id = req.params.id; // Get the camera ID from the URL parameter

    try {
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
            res.json({ cameraDetail:cameraDetail, trafficSums });

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

            // Save camera details in Redis with a specific key for this camera ID
            //await req.redis.set(`cameraDetails:${id}`, JSON.stringify(cameraDetails));

            // Fetch traffic sums from the database
            const trafficSums = {};
            const columnsToSum = ['cars', 'motorbikes', 'buses', 'trucks'];

            for (const column of columnsToSum) {
                const sumResult = await req.db.from('traffic.public.traffic_volume')
                    .where('cameraid', id) // Use the camera ID in the WHERE clause
                    .sum({ [column]: `${column}` });
                trafficSums[column] = sumResult[0][column] || 0;
            }

            res.json({ cameraDetail:cameraDetail, trafficSums });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to retrieve camera details and traffic sums.');
    }
});
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


// router.get('/:id', async (req, res, _) => {
//     const id = req.params.id; // Get the camera ID from the URL parameter

//     try {
//         const trafficSums = {};
//         const columnsToSum = ['cars', 'motorbikes', 'buses', 'trucks'];

//         for (const column of columnsToSum) {
//             const sumResult = await req.db('traffic.public.traffic_volume')
//                 .where('cameraid', id) // Use the camera ID in the WHERE clause
//                 .sum({ [column]: `${column}` });
//             trafficSums[column] = sumResult[0][column] || 0;
//         }

//         res.json(trafficSums);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Failed to retrieve traffic sums.');
//     }
// });

router.post('/submit-cameras', (req, res, _) => {
    const selectedCameraIds = req.body.selectedCameras;
    // Now you have an array of selected camera IDs which you can use.
    res.send(`Selected cameras: ${selectedCameraIds.join(', ')}`);
});

module.exports = router;