const express = require('express');
const axios = require('axios');
var router = express.Router();
const AWS = require('aws-sdk');



// Existing routes...

//const redisClient = redis.createClient();

//const client = redis.createClient(); // Set up your Redis client

router.get('/', async (req, res, _) => {
    try {
        const cachedData = await req.redis.get('cameraDetails'); // Check if data exists in Redis

        if (cachedData) {
            // If data exists in Redis, parse and send the cached data
            const parsedData = JSON.parse(cachedData);
            res.json(parsedData);
        } else {
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

            // Fetching status from the database
            let statusMap = {};
            try {
                const camerasFromDB = await req.db.from('traffic.public.camera_config').whereIn('cameraid', cameraDetails.map(camera => camera.id));
                statusMap = camerasFromDB.reduce((acc, camera) => {
                    acc[camera.cameraid] = camera.status;
                    return acc;
                }, {});
            } catch (err) {
                console.error(err);
                // Handle error if needed
            }

            // Inserting cameraDetails into the database
            let errored;
            try {
                for (const camera of cameraDetails) {
                    errored = camera;
                    await req.db.from('traffic.public.camera_config').insert({
                        cameraid: camera.id,
                        status: false, // Assuming a column named 'status' for the boolean value
                        imageurl: camera.imageUrl
                    }).onConflict('cameraid').ignore();
                }

                // Combining cameraDetails with current status
                const camerasWithStatus = cameraDetails.map(camera => ({
                    ...camera,
                    status: statusMap[camera.id] || false // Set status from statusMap or default to false
                }));

                // Cache the data in Redis for future use
                await req.redis.set('cameraDetails', JSON.stringify(camerasWithStatus));

                res.json(camerasWithStatus);
            } catch (err) {
                res.status(500).send(`Failed to insert camera details into the database. Error: ${err}, Camera: ${errored}`);
            }
        }
    } catch (err) {
        res.status(500).send('Failed to fetch webcams.');
    }
});

// router.get('/', async (req, res, _) => {

//     try {


//         // Check if data is available in Redis
//         req.redis.get('cameraData', async (error, cachedData) => {
//             if (error) {
//                 console.error('Redis error:', error);
//             }

//             if (cachedData) {
//                 // If data exists in Redis, parse and use the cached data
//                 const cameraDetails = JSON.parse(cachedData);

//                 // Fetch data from the database
//                 let statusMap = {};
//                 try {
//                     const camerasFromDB = await req.db.from('traffic.public.camera_config').whereIn('cameraid', cameraDetails.map(camera => camera.id));
//                     statusMap = camerasFromDB.reduce((acc, camera) => {
//                         acc[camera.cameraid] = camera.status;
//                         return acc;
//                     }, {});
//                 } catch (err) {
//                     console.error(err);
//                     // Handle error if needed
//                 }

//                 // Merge database status with API/Redis data
//                 const mergedData = cameraDetails.map(camera => ({
//                     ...camera,
//                     status: statusMap[camera.id] || false // Set status from statusMap or default to false
//                 }));

//                 res.json(mergedData);
//             } else {
//                 // If data doesn't exist in Redis, fetch from the external API
//                 const response = await axios.get('https://api.qldtraffic.qld.gov.au/v1/webcams', {
//                     params: {
//                         apikey: '8bvRR10buqalcqbuoiNZc75Ak4xPY2eY1CPgXFVk'
//                     }
//                 });

//                 const cameraDetails = response.data.features.map(feature => ({
//                     id: feature.properties.id,
//                     description: feature.properties.description,
//                     imageUrl: feature.properties.image_url
//                 }));

//                 // Store the data in Redis
//                 req.redis.set('cameraData', JSON.stringify(cameraDetails));

//                 // Fetch data from the database
//                 let statusMap = {};
//                 try {
//                     const camerasFromDB = await req.db.from('traffic.public.camera_config').whereIn('cameraid', cameraDetails.map(camera => camera.id));
//                     statusMap = camerasFromDB.reduce((acc, camera) => {
//                         acc[camera.cameraid] = camera.status;
//                         return acc;
//                     }, {});
//                 } catch (err) {
//                     console.error(err);
//                     // Handle error if needed
//                 }

//                 // Merge database status with API data
//                 const mergedData = cameraDetails.map(camera => ({
//                     ...camera,
//                     status: statusMap[camera.id] || false // Set status from statusMap or default to false
//                 }));

//                 res.json(mergedData);
//             }
//         });
//     } catch (err) {
//         res.status(500).send(err);
//     }
// });


// router.get('/', async (req, res, _) => {
//     try {
//         const response = await axios.get('https://api.qldtraffic.qld.gov.au/v1/webcams', {
//             params: {
//                 apikey: '8bvRR10buqalcqbuoiNZc75Ak4xPY2eY1CPgXFVk'
//             }
//         });const cameraDetails = response.data.features.map(feature => {
//             return {
//                 id: feature.properties.id,
//                 description: feature.properties.description,
//                 imageUrl: feature.properties.image_url
//             };
//         });

//         // Fetching status from the database
//         let statusMap = {};
//         try {
//             const camerasFromDB = await req.db.from('traffic.public.camera_config').whereIn('cameraid', cameraDetails.map(camera => camera.id));
//             statusMap = camerasFromDB.reduce((acc, camera) => {
//                 acc[camera.cameraid] = camera.status;
//                 return acc;
//             }, {});
//         } catch (err) {
//             console.error(err);
//             // Handle error if needed
//         }

//         // Inserting cameraDetails into the database
//         let errored;
//         try {
//             for (const camera of cameraDetails) {
//                 errored = camera;
//                 await req.db.from('traffic.public.camera_config').insert({
//                     cameraid: camera.id,
//                     status: false, // Assuming a column named 'status' for the boolean value
//                     imageurl: camera.imageUrl
//                 }).onConflict('cameraid').ignore();
//             }

//             // Combining cameraDetails with current status
//             const camerasWithStatus = cameraDetails.map(camera => ({
//                 ...camera,
//                 status: statusMap[camera.id] || false // Set status from statusMap or default to false
//             }));

//             res.json(camerasWithStatus);
//         } catch (err) {
//             res.status(500).send(`Failed to insert camera details into the database. Error: ${err}, Camera: ${errored}`);
//         }
//     } catch (err) {
//         res.status(500).send('Failed to fetch webcams.');
//     }
// });

router.post('/activate-cameras', async (req, res, _) => {
    const { selectedImages } = req.body;


    try {
        const camerasToUpdate = await req.db.from('traffic.public.camera_config')
            .select('cameraid', 'imageurl')
            .whereIn('cameraid', selectedImages)
            .update({ status: true })
            .returning(['cameraid', 'imageurl']);
        AWS.config.update({
            accessKeyId: 'placeholder',
            secretAccessKey: 'placeholder',
            sessionToken: 'placeholder',
            region: "ap-southeast-2",
        });
       


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

    //     res.send(`Updated status to true for selected cameras: ${selectedImages.join(', ')}`);
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).send('Failed to update status for selected cameras.');
    // }
});
router.post('/deactivate-cameras', async (req, res, _) => {
    const { selectedImages } = req.body;

    try {
        await req.db.from('traffic.public.camera_config')
            .whereIn('cameraid', selectedImages)
            .update({ status: false });
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

router.post('/submit-cameras', (req, res, _) => {
    const selectedCameraIds = req.body.selectedCameras;
    // Now you have an array of selected camera IDs which you can use.
    res.send(`Selected cameras: ${selectedCameraIds.join(', ')}`);
});

module.exports = router;