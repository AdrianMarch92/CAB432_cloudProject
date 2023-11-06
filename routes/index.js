const express = require('express');
const axios = require('axios');
var router = express.Router();


// Existing routes...

router.get('/', async (req, res, _) => {
    try {
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

        // Inserting cameraDetails into the database
        let errored 
        try {
            for (const camera of cameraDetails) {
                errored = camera
                await req.db.from('traffic.public.camera_config').insert({
                    cameraid: camera.id,
                    status: false // Assuming a column named 'is_active' for the boolean value
                }).onConflict('cameraid').ignore();
            }
            res.json(cameraDetails);
        } catch (err) {
            res.status(500).send(err + errored);
        }
    } catch (err) {
        res.status(500).send('Failed to fetch webcams.');
    }
});

router.post('/activate-cameras', async (req, res, _) => {
    const { selectedImages } = req.body;


    try {
        await req.db.from('traffic.public.camera_config')
            .whereIn('cameraid', selectedImages)
            .update({ status: true });

        res.send(`Updated status to true for selected cameras: ${selectedImages.join(', ')}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update status for selected cameras.');
    }
});
router.post('/deactivate-cameras', async (req, res, _) => {
    const selectedCameraIds = req.body.selectedCameraIds;

    try {
        await req.db.from('traffic.public.camera_config')
            .whereIn('cameraid', selectedCameraIds)
            .update({ status: false });

        res.send(`Updated status to false for selected cameras: ${selectedCameraIds.join(', ')}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update status for selected cameras.');
    }
});

router.post('/submit-cameras', (req, res, _) => {
    const selectedCameraIds = req.body.selectedCameras;
    // Now you have an array of selected camera IDs which you can use.
    res.send(`Selected cameras: ${selectedCameraIds.join(', ')}`);
});

module.exports = router;