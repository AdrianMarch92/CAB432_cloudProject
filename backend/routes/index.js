const express = require('express');
const axios = require('axios');
var router = express.Router();
const AWS = require('aws-sdk');

//base route to get all the cameras 
router.get('/', async (req, res, _) => {
    try {
        // Check if data exists in Redis
        const cachedData = await req.redis.get('cameraDetails');

        if (cachedData) {
            // If data exists in Redis, parse and send the cached data
            const parsedData = JSON.parse(cachedData);
            res.json(parsedData);
        } else {
            //data not in cache make the api call 
            const response = await axios.get('https://api.qldtraffic.qld.gov.au/v1/webcams', {
                params: {
                    apikey: '8bvRR10buqalcqbuoiNZc75Ak4xPY2eY1CPgXFVk'
                }
            });

            //return all the cameras from the api call
            const cameraDetails = response.data.features.map(feature => {
                return {
                    id: feature.properties.id,
                    description: feature.properties.description,
                    imageUrl: feature.properties.image_url
                };
            });

            // Fetching status from the database (if they are in the database)
            let statusMap = {};
            try {
                const camerasFromDB = await req.db.from('traffic.public.camera_config').whereIn('cameraid', cameraDetails.map(camera => camera.id));
                statusMap = camerasFromDB.reduce((acc, camera) => {
                    acc[camera.cameraid] = camera.status;
                    return acc;
                }, {});
            } catch (err) {
                console.error(err);
            }

            // Inserting cameraDetails into the database
            let errored;
            try {
                for (const camera of cameraDetails) {
                    errored = camera;
                    await req.db.from('traffic.public.camera_config').insert({
                        cameraid: camera.id,
                        status: false,
                        imageurl: camera.imageUrl
                    }).onConflict('cameraid').ignore();
                }

                // Combining cameraDetails with current status
                const camerasWithStatus = cameraDetails.map(camera => ({
                    ...camera,
                    // Set status from statusMap to false
                    status: statusMap[camera.id] || false
                }));

                // Cache the data in Redis for future use
                await req.redis.set('cameraDetails', JSON.stringify(camerasWithStatus));

                //returns results
                res.json(camerasWithStatus);
            } catch (err) {
                res.status(500).send(`Failed to insert camera details into the database. Error: ${err}, Camera: ${errored}`);
            }
        }
    } catch (err) {
        res.status(500).send('Failed to fetch webcams.');
    }
});

//activates the camers passed to it
router.post('/activate-cameras', async (req, res, _) => {
    //selectedImages is an array of camera ids
    const { selectedImages } = req.body;

    //make database call to update the values and return the id and the url to the immage.
    try {
        const camerasToUpdate = await req.db.from('traffic.public.camera_config')
            .select('cameraid', 'imageurl')
            .whereIn('cameraid', selectedImages)
            .update({ status: true })
            .returning(['cameraid', 'imageurl']);
        //setup aws config
        AWS.config.update({
            accessKeyId: 'placeholder',
            secretAccessKey: 'placeholder',
            sessionToken: 'placeholder',
            region: "ap-southeast-2",
        });


        //because we are working with a cache for the front end we need to get the cached version and update there too.
        let cameraDetails = JSON.parse(await req.redis.get('cameraDetails'));

        if (cameraDetails) {
            // Update status in cameraDetails
            cameraDetails = cameraDetails.map(camera => {
                if (selectedImages.includes(camera.id)) {
                    return { ...camera, status: true };
                }
                return camera;
            });

            // Update the updated cameraDetails in Redis
            await req.redis.set('cameraDetails', JSON.stringify(cameraDetails));
        }



        const sqs = new AWS.SQS();

        // Prepare messages for SQS
        const queueUrl = 'https://sqs.ap-southeast-2.amazonaws.com/901444280953/cab432_team42'; // 
        const params = {
            QueueUrl: queueUrl,
            Entries: camerasToUpdate.map(camera => ({
                Id: camera.cameraid.toString(),
                MessageBody: JSON.stringify({
                    carmeraid: camera.cameraid,
                    imageURL: camera.imageurl
                })
            }))
        };

        // Send messages to SQS
        sqs.sendMessageBatch(params, (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send(camerasToUpdate);
            } else {


                res.send(`Updated status and sent messages to SQS for selected cameras: ${selectedImages.join(', ')}`);
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update status for selected cameras.');
    }

});

//The same as activating it just deactivates. 
router.post('/deactivate-cameras', async (req, res, _) => {
    const { selectedImages } = req.body;

    try {
        //sets the db status to false
        await req.db.from('traffic.public.camera_config')
            .whereIn('cameraid', selectedImages)
            .update({ status: false });

        //again need to update the cache.
        let cameraDetails = JSON.parse(await req.redis.get('cameraDetails'));

        if (cameraDetails) {
            // Update status in cameraDetails
            cameraDetails = cameraDetails.map(camera => {
                if (selectedImages.includes(camera.id)) {
                    return { ...camera, status: false };
                }
                return camera;
            });

            // Update the updated cameraDetails in Redis
            await req.redis.set('cameraDetails', JSON.stringify(cameraDetails));
        }

        res.send(`Updated status to false for selected cameras: ${selectedImages.join(', ')}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update status for selected cameras.');
    }
});


module.exports = router;