const express = require('express');
const axios = require('axios');
var router = express.Router();


// have to do raw query due to requireing to do a cascading truncate. 

router.get('/', async (req, res, _) => {
  try {
    const truncateDbPromise = Promise.all([
      req.db.raw('TRUNCATE TABLE traffic.public.traffic_volume CASCADE'),
      req.db.raw('TRUNCATE TABLE traffic.public.camera_config CASCADE')
    ]);

    //flush the redis cache
    const flushRedisPromise = req.redis.FLUSHALL();

    await Promise.all([truncateDbPromise, flushRedisPromise]);

    res.json({ message: 'Tables truncated in database and Redis flushed.' });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).send(err);
  }

});

module.exports = router;

