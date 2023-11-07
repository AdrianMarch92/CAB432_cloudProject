const express = require('express');
const axios = require('axios');
var router = express.Router();


// Existing routes...

router.get('/', async (req, res, _) => {
    try {
        const truncateDbPromise = Promise.all([
          req.db.raw('TRUNCATE TABLE traffic.public.traffic_volume CASCADE'),
          req.db.raw('TRUNCATE TABLE traffic.public.camera_config CASCADE')
        ]);
    
        const flushRedisPromise = req.redis.FLUSHALL();
    
        await Promise.all([truncateDbPromise, flushRedisPromise]);
    
        res.json({ message: 'Tables truncated in database and Redis flushed.' });
      } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).send(err);
      }



});



module.exports = router;

