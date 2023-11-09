const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { exec } = require('child_process');
const router = express.Router();
const options = require('./knexfile');
const knex = require('knex')(options);
const hardResetrouter = require('./routes/hardreset');
const logger = require('morgan');
const redis = require('redis');

module.exports = router;


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

//allows db access using req.db in other routes. 
app.use((req, res, next) => {
    req.db = knex;
    next();

});
//mapping to the redis url in the docker container
const url = `redis://redis:6379`;
const redisClient = redis.createClient({ url });
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.log(err);
    }
})();

//allowing access to the redis service
app.use((req, res, next) => {
    req.redis = redisClient;
    next();

});

//adding logging 
app.use(logger('combined'));
//resets the db and cache
app.use('/hardreset', hardResetrouter);

//adding routes
const indexRouter = require('./routes/index');
const monitorRouter = require('./routes/monitor');
app.use('/monitor', monitorRouter);
app.use('/', indexRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


