const express = require('express');
const axios = require('axios');
var router = express.Router();


// Existing routes...

router.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://api.qldtraffic.qld.gov.au/v1/webcams', {
            params: {
                apikey: '8bvRR10buqalcqbuoiNZc75Ak4xPY2eY1CPgXFVk'
            }
        });
        const imageUrls = response.data.features.map(feature => feature.properties.image_url);

        // Send the array of image URLs as a JSON response
        res.json(imageUrls);

        response.data.features.forEach(feature => {
            console.log(feature.properties.image_url);
        });

    } catch (err) {
        res.status(500).send('Failed to fetch webcams.');
    }
});

router.post('/submit-cameras', (req, res) => {
    const selectedCameraIds = req.body.selectedCameras;
    // Now you have an array of selected camera IDs which you can use.
    res.send(`Selected cameras: ${selectedCameraIds.join(', ')}`);
});

module.exports = router;

