const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { exec } = require('child_process');
const router = express.Router();


module.exports = router;


const app = express();
const PORT = 3001;

app.use(cors());

app.get('/webcams', async (req, res) => {
    try {
        const response = await axios.get('https://api.qldtraffic.qld.gov.au/v1/webcams', {
            params: {
                apikey: '8bvRR10buqalcqbuoiNZc75Ak4xPY2eY1CPgXFVk'
            }
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch webcamsdfsfs.' });
    }
});

app.get('/vehicle-count/:imageUrl', (req, res) => {
    const imageUrl = req.params.imageUrl;
    
    exec(`python3 vehicle_count.py "${imageUrl}"`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).json({ error: 'Failed to get vehicle count.' });
            return;
        }
        res.json({ count: stdout.trim() });
    });
});
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


