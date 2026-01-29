const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Proxy route to avoid CORS errors
app.get('/api/vahan', async (req, res) => {
    try {
        const vNo = req.query.number;
        const response = await axios.get(`https://rc-pvc-api.vercel.app/?number=${vNo}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ status: false, message: "API Connection Error" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
