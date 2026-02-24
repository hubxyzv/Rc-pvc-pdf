const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// State Map for "Government of [State]" text
const stateMap = { 
    AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CG: "Chhattisgarh", 
    CH: "Chandigarh", DD: "Daman and Diu", DL: "Delhi", GA: "Goa", GJ: "Gujarat", 
    HR: "Haryana", HP: "Himachal Pradesh", JH: "Jharkhand", JK: "Jammu and Kashmir", 
    KA: "Karnataka", KL: "Kerala", LA: "Ladakh", LD: "Lakshadweep", MH: "Maharashtra", 
    ML: "Meghalaya", MN: "Manipur", MP: "Madhya Pradesh", MZ: "Mizoram", NL: "Nagaland", 
    OD: "Odisha", PB: "Punjab", PY: "Puducherry", RJ: "Rajasthan", SK: "Sikkim", 
    TN: "Tamil Nadu", TR: "Tripura", TS: "Telangana", UK: "Uttarakhand", UP: "Uttar Pradesh", WB: "West Bengal" 
};

/**
 * Main Route: /rc/[VEHICLE_NUMBER]
 * Example: /rc/MH14CS8330
 */
app.get('/rc/:vno', async (req, res) => {
    try {
        const vno = req.params.vno.toUpperCase();
        
        // 1. Fetch data from your new API
        const apiUrl = `https://prerc-pvc-api.onrender.com/rc?id=${vno}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // 2. Prepare the clean object for EJS
        // We ensure all fields have a fallback "_" if the API data is missing
        const v = {
            regNo: vno,
            regDate: data.regDate || "_",
            cat: data.cat || "NT",
            serial: data.serial || "1",
            chassis: data.chassis || "_",
            engine: data.engine || "_",
            name: data.name || "_",
            
            // --- STRICT RESTRICTION: Father's Name Hidden ---
            swd: "_ _", 
            
            address: data.address || "_",
            fuel: data.fuel || "_",
            vClass: data.vClass || "_",
            maker: data.maker || "_",
            model: data.model || "_",
            colour: data.colour || "_",
            bodyType: data.bodyType || "_",
            seatCap: data.seatCap || "_",
            weight: data.weight || "_",
            cubicCap: data.cubicCap || "_",
            hp: data.hp || "_",
            wheelBase: data.wheelBase || "_",
            financier: data.financier || "NOT HYPOTHECATED",
            mfgDate: data.mfgDate || "_",
            cylinders: data.cylinders || "_",
            auth: data.auth || "_",
            norms: data.norms || "_",
            validity: data.validity || "_"
        };

        // 3. Render the index.ejs file with the data
        res.render('index', { v });

    } catch (err) {
        console.error("Error fetching vehicle data:", err.message);
        res.status(500).send("<h1>Error</h1><p>Could not fetch data for this vehicle. Please check the ID and try again.</p>");
    }
});

// Root route
app.get('/', (req, res) => {
    res.send("RC PVC Server is running. Use URL format: /rc/VEHICLE_NUMBER");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 Server is live on http://localhost:${PORT}`);
    console.log(`-------------------------------------------`);
});
