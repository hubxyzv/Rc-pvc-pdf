const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.use(express.static('public'));
app.use(express.json());

// API Se data lane ka rasta
app.get('/api/fetch-rc', async (req, res) => {
    try {
        const { vNumber } = req.query;
        const response = await axios.get(`https://didactic-robot-phi.vercel.app/vehicle?number=${vNumber}&key=CYBER-SAFE-7733`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "API Connection Failed" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
