const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint for fetching vehicle data
app.get('/fetch-vehicle', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: "Number is required" });

    try {
        const response = await axios.get(`https://didactic-robot-phi.vercel.app/vehicle?number=${number}&key=CYBER-SAFE-7733`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data from API" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
