const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.get('/fetch-rc', async (req, res) => {
    const { vNo } = req.query;
    try {
        const apiUrl = `https://rc-pvc-api.vercel.app/?number=${vNo}`;
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "API connection failed" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));
