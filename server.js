const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.get('/fetch-rc', async (req, res) => {
    const { vNo } = req.query;
    try {
        console.log(`Fetching data for: ${vNo}`);
        const apiUrl = `https://didactic-robot-phi.vercel.app/vehicle?number=${vNo}&key=CYBER-SAFE-7733`;
        const response = await axios.get(apiUrl);
        
        // Debugging ke liye: Render logs mein data dikhega
        console.log("API Response Status:", response.status); 
        res.json(response.data);
    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: "API connection failed", details: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
