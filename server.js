const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Main Route: Yeh /rc/UP62... format mein kaam karega
app.get('/rc/:vno', async (req, res) => {
    try {
        const vno = req.params.vno.toUpperCase();
        
        // Live API Fetching
        const apiUrl = `https://prerc-pvc-api.onrender.com/rc?id=${vno}`;
        const response = await axios.get(apiUrl);
        
        if (!response.data || !response.data.vehicle_details) {
            return res.status(404).send("Vehicle Not Found in API.");
        }

        const vehicle = response.data.vehicle_details;

        // 🛡️ STRICT PRIVACY: Father's Name constraint
        const v = {
            ...vehicle,
            swd_name: "_ _" 
        };

        res.render('index', { v });
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).send("API fetching failed. Please check the vehicle number.");
    }
});

app.get('/', (req, res) => res.send("System Active. Use /rc/VehicleNumber"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server live on port ${PORT}`));
