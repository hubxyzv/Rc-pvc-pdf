const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Main Route: Yeh :vno se vehicle number lega aur API se connect karega
app.get('/rc/:vno', async (req, res) => {
    try {
        const vno = req.params.vno.toUpperCase();
        
        // 🚀 API SE DATA FETCH KARNA
        const apiUrl = `https://prerc-pvc-api.onrender.com/rc?id=${vno}`;
        const response = await axios.get(apiUrl);
        
        // API response validation
        if (!response.data || !response.data.vehicle_details) {
            return res.status(404).send("Error: Vehicle details not found in API.");
        }

        const vehicle = response.data.vehicle_details;

        // 🛡️ STRICT PRIVACY: Father's Name hamesha hide rahega (Constraint Applied)
        const v = {
            ...vehicle,
            swd_name: "_ _" 
        };

        // Render the HTML with the fetched data
        res.render('index', { v });
    } catch (err) {
        console.error("Fetch Error:", err.message);
        res.status(500).send("Server Error: API is not responding or Vehicle No. is invalid.");
    }
});

// Default route
app.get('/', (req, res) => {
    res.send("<h1>System Active</h1><p>Enter <b>/rc/[Vehicle_Number]</b> in the URL to generate PDF.</p>");
});

// Port settings
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🔗 Example: http://localhost:${PORT}/rc/UP62BZ1861`);
});
