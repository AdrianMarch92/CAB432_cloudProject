const express = require('express');
const axios = require('axios');
var router = express.Router();


// Existing routes...

router.get('/', async (req, res, _) => {
    try {
        Promise.all(
            [
            req.db.raw('TRUNCATE TABLE traffic.public.traffic_volume CASCADE'),
            req.db.raw('TRUNCATE TABLE traffic.public.camera_config CASCADE'),

            ]

        )
        
        res.json({"message": "Complete"});

        
        


    } catch (err) {
        res.status(500).send(err);
    }
    

    
});



module.exports = router;

