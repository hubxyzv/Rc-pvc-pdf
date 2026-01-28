const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', { data: null });
});

app.get('/fetch', async (req, res) => {
    const vNo = req.query.number;
    const apiKey = "CYBER-SAFE-7733";
    try {
        const response = await axios.get(`https://didactic-robot-phi.vercel.app/vehicle?number=${vNo}&key=${apiKey}`);
        res.render('index', { data: response.data });
    } catch (error) {
        res.send("API Error: Gaadi ka data nahi mila.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
