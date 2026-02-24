const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files support (agar aap koi images local rakhna chahen)
app.use(express.static(path.join(__dirname, 'public')));

// 🚀 MAIN ROUTE
app.get('/rc/:vno', async (req, res) => {
    try {
        const vno = req.params.vno.toUpperCase();
        
        // 📡 API Fetching
        const apiUrl = `https://prerc-pvc-api.onrender.com/rc?id=${vno}`;
        const response = await axios.get(apiUrl);
        
        if (!response.data || !response.data.vehicle_details) {
            return res.status(404).send("Vehicle details not found in API.");
        }

        const vehicle = response.data.vehicle_details;

        // 🛡️ STRICT PRIVACY: Father's Name constraint
        const v = {
            ...vehicle,
            swd_name: "_ _" 
        };

        // Frontend ko data bhej rahe hain
        res.render('index', { v });
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).send("API Error. Please check vehicle number and try again.");
    }
});

// Root route instructions
app.get('/', (req, res) => {
    res.send("<h1>System Active</h1><p>URL format: <code>/rc/UP62BZ1861</code></p>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server live on port ${PORT}`));
